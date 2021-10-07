/**
 * 渲染器用于管理渲染对象和执行渲染优化(如排序)，以及对渲染列表调用渲染绘制。<br/>
 * @author Kkk
 */
import FrameContext from "../WebGL/FrameContext.js";
import Component from "../Component.js";
import RenderState from "../WebGL/RenderState.js";
import FrameBuffer from "../WebGL/FrameBuffer.js";
import ShaderSource from "../WebGL/ShaderSource.js";
import Material from "../Material/Material.js";
import MaterialDef from "../Material/MaterialDef.js";
import DefaultRenderProgram from "./Program/DefaultRenderProgram.js";
import SinglePassLightingRenderProgram from "./Program/SinglePassLightingRenderProgram.js";
import SinglePassIBLLightingRenderProgram from "./Program/SinglePassIBLLightingRenderProgram.js";
import Log from "../Util/Log.js";
import Internal from "./Internal.js";
import RenderQueue from "./RenderQueue.js";
import TempVars from "../Util/TempVars.js";
import Forward from "./Pipeline/Forward.js";
import Deferred from "./Pipeline/Deferred.js";
import MultiPassLightingRenderProgram from "./Program/MultiPassLightingRenderProgram.js";
import MultiPassIBLLightingRenderProgram from "./Program/MultiPassIBLLightingRenderProgram.js";
import TilePassLightingRenderProgram from "./Program/TilePassLightingRenderProgram.js";
import TileDeferred from "./Pipeline/TileDeferred.js";
import TilePassIBLLightingRenderProgram from "./Program/TilePassIBLLightingRenderProgram.js";
import FloatVars from "../WebGL/Vars/FloatVars.js";
import BoolVars from "../WebGL/Vars/BoolVars.js";

export default class Render extends Component{
    // 渲染路径
    static FORWARD = 'Forward';
    static DEFERRED_SHADING = 'DeferredShading';
    static TILE_DEFERRED_SHADING = 'TileDeferredShading';


    // 默认延迟着色渲染路径frameBuffer
    static DEFAULT_DEFERRED_SHADING_FRAMEBUFFER = 'DefaultDeferredShadingFrameBuffer';
    // 如果启用了多渲染路径,则创建默认forwardFrameBuffer而不是使用内置frameBuffer(这是因为webGL不支持从多fbo.blit到内置fbo)
    static DEFAULT_FORWARD_SHADING_FRAMEBUFFER = 'DefaultForwardShadingFrameBuffer';
    // 用于FilterPipeline
    static DEFAULT_POST_FILTER_SHADING_FRAMEBUFFER = 'DefaultPostFilterShadingFrameBuffer';

    // Event
    // 一帧渲染开始
    static PRE_FRAME = "preFrame";
    // 获得待渲染列表后
    static POST_QUEUE = "postQueue";
    // 在一帧渲染提交后
    static POST_FRAME = "postFrame";


    getType(){
        return "Render";
    }
    constructor(owner, cfg) {
        super(owner, cfg);

        // 保存所有需要渲染的元素
        this._m_Drawables = [];
        this._m_DrawableIDs = {};
        // 缓存当前帧渲染数据
        this._m_VisDrawables = [];
        // 保存所有FramePicture对象
        this._m_FramePictures = [];
        this._m_FramePictureIDs = [];
        // sky(每次只能渲染一个sky,因为没有必要存在多个sky)
        this._m_Sky = null;

        // 渲染模式
        // 默认下,0为forward,1为deferred
        this._m_Pipeline = {};
        this._m_PipelineConfig = {};
        // renderProgram优先技术
        this._m_PriorityTechnology = '';

        // 帧上下文
        this._m_FrameContext = new FrameContext();
        // 所有可用渲染程序
        this._m_RenderPrograms = {};

        // 初始化渲染状态
        this.m_InitState = new RenderState(true);
        // 不透明队列的默认渲染状态
        this._m_OpaqueRenderState = new RenderState();
        // 半透明队列的默认渲染状态
        this._m_TranslucentRenderState = new RenderState();
        // 开启blend模式
        // this._m_TranslucentRenderState.setFlag(RenderState.S_STATES[1], 'Off');
        this._m_TranslucentRenderState.setFlag(RenderState.S_STATES[4], 'On');
        // 关闭深度写入(不建议默认设置,因为对于大部分情况,都需要开启深度写入,以避免同一个物体前后交叉而没有深度写入导致错误情况产生,但可以通过具体材质进行控制)
        // this._m_TranslucentRenderState.setFlag(RenderState.S_STATES[1], 'Off');
        // 设置默认blend方程(默认方程)
        this._m_TranslucentRenderState.setFlag(RenderState.S_STATES[5], ['SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA']);


        // 一些杂项
        // singlePass batchLightSize 默认为4
        this._m_BatchLightSize = 4;
        // gamma矫正
        this._m_GammaCorrection = true;
        // gamma编码因子
        this._m_GammaFactor = 0.45;
        // 色调映射
        this._m_ToneMapping = false;

        // Tile
        this._m_TileInfo = {
            tileSize:0,
            tileWidth:0,
            tileHeight:0,
            tileNum:0
        };
        this._m_Scene.getCanvas().on('resize', (w, h)=>{
            this.updateTileInfo(w, h);
        });
        this.setTileSize(32);
    }

    /**
     * 更新tileInfo。<br/>
     * @param {Number}[w 视口宽度]
     * @param {Number}[h 视口高度]
     */
    updateTileInfo(w, h){
        let tileSize = this._m_TileInfo.tileSize;
        this._m_TileInfo.tileWidth = Math.floor(w / tileSize);
        this._m_TileInfo.tileHeight = Math.floor(h / tileSize);
        this._m_TileInfo.tileNum = this._m_TileInfo.tileWidth * this._m_TileInfo.tileHeight;
    }

    /**
     * 设置TileSize。<br/>
     * @param {Number}[tileSize]
     */
    setTileSize(tileSize){
        if(tileSize != this._m_TileInfo.tileSize){
            this._m_TileInfo.tileSize = tileSize;
            this.updateTileInfo(this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight());
        }
    }

    /**
     * 返回TileInfo。<br/>
     * @return {{}|*}
     */
    getTileInfo(){
        return this._m_TileInfo;
    }

    /**
     * 设置渲染优先技术。<br/>
     * @param technology
     */
    setPriorityTechnology(technology){
        this._m_PriorityTechnology = technology;
    }

    /**
     * 返回渲染优先技术。<br/>
     * @return {string}
     */
    getPriorityTechnology(){
        return this._m_PriorityTechnology;
    }

    /**
     * 设置批次渲染光源数目。<br/>
     * @param {Number}[size]
     */
    setBatchLightSize(size){
        if(size != this._m_BatchLightSize){
            if(size > 50)size = 50;
            TempVars.mallocLightData(size);
            this._m_BatchLightSize = size;
            ShaderSource.resizeBatchLightSize(size);
        }
    }

    /**
     * 返回批次渲染光源数目。<br/>
     * @return {number}
     */
    getBatchLightSize(){
        return this._m_BatchLightSize;
    }

    /**
     * 启动渲染器。<br/>
     */
    startUp(){
        // 创建默认DeferredShadingFrameBuffer
        let gl = this._m_Scene.getCanvas().getGLContext();
        let depthEXT = gl.getExtension( "WEBKIT_WEBGL_depth_texture" ) ||
            gl.getExtension( "MOZ_WEBGL_depth_texture" );
        Log.debug("depthEXT:",depthEXT);
        // console.log("支持的拓展:" , gl.getSupportedExtensions());
        let w = this._m_Scene.getCanvas().getWidth();
        let h = this._m_Scene.getCanvas().getHeight();
        let dfb = new FrameBuffer(gl, Render.DEFAULT_DEFERRED_SHADING_FRAMEBUFFER, w, h);
        this._m_FrameContext.addFrameBuffer(Render.DEFAULT_DEFERRED_SHADING_FRAMEBUFFER, dfb);
        // 这里为了统一性，一致使用RGBA16F，而不是编码法线或其他压缩，确保可以在shader使用float存储更多的信息
        // G-buffer0
        dfb.addTexture(gl, ShaderSource.S_G_BUFFER0_SRC, gl.RGBA16F, 0, gl.RGBA, gl.FLOAT, gl.COLOR_ATTACHMENT0, true);
        // G-buffer1
        dfb.addTexture(gl, ShaderSource.S_G_BUFFER1_SRC, gl.RGBA32F, 0, gl.RGBA, gl.FLOAT, gl.COLOR_ATTACHMENT1, true);
        // G-buffer2
        dfb.addTexture(gl, ShaderSource.S_G_BUFFER2_SRC, gl.RGBA16F, 0, gl.RGBA, gl.FLOAT, gl.COLOR_ATTACHMENT2, true);
        // 创建depth附件(使用renderBuffer来提供)
        // 渲染缓存是一种特殊缓冲区,不需要在shader中写数据,而是可以作为提供类似深度缓冲区这种类型的缓存来使用
        // webGL2.0不支持将深度写入纹理,https://www.it1352.com/1705357.html
        // dfb.addBuffer(gl, ShaderSource.S_G_DEPTH_RENDER_BUFFER_SRC, gl.DEPTH24_STENCIL8, gl.DEPTH_STENCIL_ATTACHMENT);
        dfb.addTexture(gl, ShaderSource.S_G_DEPTH_SRC, gl.DEPTH_COMPONENT24 , 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, gl.DEPTH_ATTACHMENT, false);
        // 但由于webGL不完全兼容gl.blitFramebuffer,所以这里使用纹理附件写入的方式进行
        // 而由于webGL不支持将深度附件作为纹理使用,所以需要同时创建一个depthRenderBuffer和一个depthTexture
        // dfb.addTexture(gl, ShaderSource.S_G_DEPTH_SRC, gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT3, true);
        // 这里使用另一种解决方案(由于webGL不支持从自定义frameBuffer.blit数据到默认frameBuffer,所以一旦启用了延迟渲染路径,则创建一个默认的forwardFrameBuffer而不是使用默认内置frameBuffer
        dfb.finish(gl, this._m_Scene, true);

        // 创建备用默认fbo
        let ffb = new FrameBuffer(gl, Render.DEFAULT_FORWARD_SHADING_FRAMEBUFFER, w, h);
        this._m_FrameContext.addFrameBuffer(Render.DEFAULT_FORWARD_SHADING_FRAMEBUFFER, ffb);
        // ffb.addBuffer(gl, 'outColor', gl.RGBA4, gl.COLOR_ATTACHMENT0);
        // 为了支持HDR和gamma矫正,使用一个RGBA16F ffb
        ffb.addTexture(gl, ShaderSource.S_FORWARD_COLOR_MAP_SRC, gl.RGBA16F, 0, gl.RGBA, gl.FLOAT, gl.COLOR_ATTACHMENT0, false);
        // ffb.addTexture(gl, 'outColor', gl.RGB, 0, gl.RGB, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT0, false);
        // ffb.addBuffer(gl, 'depth', gl.DEPTH24_STENCIL8, gl.DEPTH_STENCIL_ATTACHMENT);
        ffb.addBuffer(gl, 'depth', gl.DEPTH_COMPONENT24, gl.DEPTH_ATTACHMENT);
        ffb.finish(gl, this._m_Scene, true);
        let forwardMat = new Material(this._m_Scene, {id:'for_m', frameContext:this.getFrameContext(), materialDef:MaterialDef.parse(Internal.S_DEFAULT_OUT_COLOR_DEF_DATA)});
        forwardMat.setParam('gammaFactor', new FloatVars().valueOf(this._m_GammaFactor));
        ffb.getFramePicture().setMaterial(forwardMat);
        this._m_FrameContext._m_DefaultFrameBuffer = ffb.getFrameBuffer();

        // FilterPipeline
        let filterfb = new FrameBuffer(gl, Render.DEFAULT_POST_FILTER_SHADING_FRAMEBUFFER, w, h);
        this._m_FrameContext.addFrameBuffer(Render.DEFAULT_POST_FILTER_SHADING_FRAMEBUFFER, filterfb);
        // 为了支持HDR和gamma矫正,使用一个RGBA16F ffb
        filterfb.addTexture(gl, ShaderSource.S_IN_SCREEN_SRC, gl.RGBA16F, 0, gl.RGBA, gl.FLOAT, gl.COLOR_ATTACHMENT0, false);
        filterfb.addTexture(gl, ShaderSource.S_IN_DEPTH_SRC, gl.DEPTH_COMPONENT24 , 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, gl.DEPTH_ATTACHMENT, false);
        filterfb.finish(gl, this._m_Scene, false);
        this._m_FrameContext._m_DefaultPostFilterFrameBuffer = filterfb.getFrameBuffer();

        // 加载可用渲染程序
        this._m_RenderPrograms[DefaultRenderProgram.PROGRAM_TYPE] = new DefaultRenderProgram();
        this._m_RenderPrograms[SinglePassLightingRenderProgram.PROGRAM_TYPE] = new SinglePassLightingRenderProgram();
        this._m_RenderPrograms[MultiPassLightingRenderProgram.PROGRAM_TYPE] = new MultiPassLightingRenderProgram();
        this._m_RenderPrograms[SinglePassIBLLightingRenderProgram.PROGRAM_TYPE] = new SinglePassIBLLightingRenderProgram();
        this._m_RenderPrograms[MultiPassIBLLightingRenderProgram.PROGRAM_TYPE] = new MultiPassIBLLightingRenderProgram();
        this._m_RenderPrograms[TilePassLightingRenderProgram.PROGRAM_TYPE] = new TilePassLightingRenderProgram();
        this._m_RenderPrograms[TilePassIBLLightingRenderProgram.PROGRAM_TYPE] = new TilePassIBLLightingRenderProgram();


        // pipeline
        this._m_PipelineConfig[Render.FORWARD] = new Forward({render:this});
        this._m_PipelineConfig[Render.DEFERRED_SHADING] = new Deferred({render:this});
        this._m_PipelineConfig[Render.TILE_DEFERRED_SHADING] = new TileDeferred({render:this});
        this.enablePipeline(Render.FORWARD);
        this.enablePipeline(Render.DEFERRED_SHADING);

        // 监听canvas的基本事件
        this._m_Scene.getCanvas().on('resize', (w, h)=>{
            this._m_FrameContext.resize(gl, w, h);
            this._m_FrameContext._m_DefaultFrameBuffer = this._m_FrameContext.getFrameBuffer(Render.DEFAULT_FORWARD_SHADING_FRAMEBUFFER).getFrameBuffer();
            this._m_FrameContext._m_DefaultPostFilterFrameBuffer = this._m_FrameContext.getFrameBuffer(Render.DEFAULT_POST_FILTER_SHADING_FRAMEBUFFER).getFrameBuffer();
        });
    }

    /**
     * 准备进入PostFilterPipeline。<br/>
     */
    beginPostFilter(){
        // 准备进入PostFilterPipeline
        // 将当前帧结果复制到PostFilterFrameBuffer以便进行PostFilter
        const gl = this._m_Scene.getCanvas().getGLContext();
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this._m_FrameContext._m_DefaultFrameBuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this._m_FrameContext._m_DefaultPostFilterFrameBuffer);
        gl.blitFramebuffer(0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight(), 0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight(), gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, gl.NEAREST);
        // 将PostFilter输出结果设置到交换缓存区
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._m_FrameContext._m_DefaultFrameBuffer);
        if(this._m_FrameContext.getRenderState().getFlag(RenderState.S_STATES[3]) == 'On'){
            gl.disable(gl.DEPTH_TEST);
        }
    }

    /**
     * 交换PostFilter处理结果以便缓冲区进行正确的渲染。<br/>
     */
    swapPostFilter(){
        const gl = this._m_Scene.getCanvas().getGLContext();
        // 将输出buffer传递到输入buffer以便下一环节的postFilter
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this._m_FrameContext._m_DefaultFrameBuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this._m_FrameContext._m_DefaultPostFilterFrameBuffer);
        // 这里假设PostFilter不会修改深度缓冲区,所以没有复制深度缓冲区
        gl.blitFramebuffer(0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight(), 0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight(), gl.COLOR_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._m_FrameContext._m_DefaultFrameBuffer);
    }

    /**
     * 结束PostFilterPipeline。<br/>
     */
    finishPostFilter(){
        // 一些额外处理，暂时什么也不做
    }

    /**
     * 激活指定的pipeline。<br/>
     * @param {String}[pipeline Render的枚举值]
     */
    enablePipeline(pipeline){
        let pipelineId = -1;
        switch (pipeline) {
            case Render.FORWARD:
                pipelineId = 0;
                break;
            case Render.DEFERRED_SHADING:
            case Render.TILE_DEFERRED_SHADING:
                pipelineId = 1;
                break;
        }
        if(pipelineId >= 0)
            this._m_Pipeline[pipelineId] = this._m_PipelineConfig[pipeline];
        else{
            Log.warn('无效pipeline!');
        }
    }

    /**
     * 返回当前帧渲染列表。<br/>
     * @return {IDrawable[]}
     */
    getVisDrawables(){
        return this._m_VisDrawables;
    }

    /**
     * 返回名称映射drawable列表。<br/>
     * @return {{}|*}
     */
    getDrawableIDs(){
        return this._m_DrawableIDs;
    }

    /**
     * 返回上下文。<br/>
     * @return {FrameContext}
     */
    getFrameContext(){
        return this._m_FrameContext;
    }

    /**
     * 设置天空盒。<br/>
     * @param {Sky}[sky SkyBox或SkyDome]
     */
    setSky(sky){
        if(this._m_Sky == sky)return;
        this._m_Sky = sky;
    }

    /**
     * 返回天空盒。<br/>
     * @return {Sky}
     */
    getSky(){
        return this._m_Sky;
    }

    /**
     * 添加一个IDrawable对象,该对象必须实现IDrawable接口。<br/>
     * @param {IDrawable}[iDrawable]
     */
    addDrawable(iDrawable){
        if(iDrawable.isFramePicture && iDrawable.isFramePicture()){
            // 添加到FramesPicture列表中
            if(!this._m_FramePictureIDs[iDrawable.getId()]){
                this._m_FramePictureIDs[iDrawable.getId()] = iDrawable;
                this._m_FramePictures.push(iDrawable);
            }
            return;
        }
        if(iDrawable.isSky && iDrawable.isSky()){
            // 天空盒(我们通过setSky()来设置天空盒)
            return;
        }
        // 每次添加一个drawable时,根据材质提前做好分区
        if(!this._m_DrawableIDs[iDrawable.getId()]){
            this._m_DrawableIDs[iDrawable.getId()] = iDrawable;
            this._m_Drawables.push(iDrawable);
        }
    }

    /**
     * 移除一个IDrawable对象,该对象必须实现IDrawable接口。<br/>
     * @param {IDrawable}[iDrawable]
     */
    removeDrawable(iDrawable){
        if(this._m_DrawableIDs[iDrawable.getId()]){
            this._m_DrawableIDs[iDrawable.getId()] = null;
            this._m_Drawables.remove(iDrawable);
        }
    }

    /**
     * 检测渲染状态切换。<br/>
     * @param {WebGLContext}[gl]
     * @param {RenderState}[renderState 目标渲染状态]
     * @param {RenderState}[currentRenderState 当前渲染状态]
     * @private
     */
    _checkRenderState(gl, renderState, currentRenderState){
        let state = renderState.getState();
        let change = false;
        for(let k in state){
            if(currentRenderState.getFlag(k) != state[k]){
                change = true;
                // 更新状态机
                // console.log("更新渲染状态[" + k + ":" + currentRenderState.getFlag(k) + "=>" + state[k] + "]");
                currentRenderState.setFlag(k, state[k]);
                switch (k) {
                    case RenderState.S_STATES[0]:
                        switch (state[k]) {
                            case RenderState.S_FACE_CULL_BACK:
                                gl.enable(gl.CULL_FACE);
                                gl.cullFace(gl.BACK);
                                break;
                            case RenderState.S_FACE_CULL_FRONT:
                                gl.enable(gl.CULL_FACE);
                                gl.cullFace(gl.FRONT);
                                break;
                            case RenderState.S_FACE_CULL_FRONT_AND_BACK:
                                gl.enable(gl.CULL_FACE);
                                gl.cullFace(gl.FRONT_AND_BACK);
                                break;
                            case RenderState.S_FACE_CULL_OFF:
                                gl.disable(gl.CULL_FACE);
                                break;
                        }
                        break;
                    case RenderState.S_STATES[1]:
                        // console.log("depthWrite");
                        if(state[k] == 'On'){
                            gl.depthMask(true);
                        }
                        else if(state[k] == 'Off'){
                            gl.depthMask(false);
                        }
                        break;
                    case RenderState.S_STATES[2]:
                        if(state[k] == 'On'){
                            gl.colorMask(true, true, true, true);
                        }
                        else if(state[k] == 'Off'){
                            gl.colorMask(false, false, false, false);
                        }
                        break;
                    case RenderState.S_STATES[3]:
                        if(state[k] == 'On'){
                            gl.enable(gl.DEPTH_TEST);
                        }
                        else if(state[k] == 'Off'){
                            gl.disable(gl.DEPTH_TEST);
                        }
                        break;
                    case RenderState.S_STATES[4]:
                        if(state[k] == 'On'){
                            gl.enable(gl.BLEND);
                        }
                        else if(state[k] == 'Off'){
                            gl.disable(gl.BLEND);
                        }
                        break;
                    case RenderState.S_STATES[5]:
                        let sfactor = null; let dfactor = null;
                        switch (state[k][0]) {
                            case "SRC_ALPHA":
                                sfactor = gl.SRC_ALPHA;
                                break;
                            case "ONE":
                                sfactor = gl.ONE;
                                break;
                        }
                        switch (state[k][1]) {
                            case "SRC_ALPHA":
                                dfactor = gl.SRC_ALPHA;
                            case "ONE_MINUS_SRC_COLOR":
                                dfactor = gl.ONE_MINUS_SRC_COLOR;
                                break;
                            case "ONE_MINUS_SRC_ALPHA":
                                dfactor = gl.ONE_MINUS_SRC_ALPHA;
                                break;
                            case "ONE":
                                dfactor = gl.ONE;
                                break;
                        }
                        if(sfactor != null && dfactor != null){
                            gl.blendFunc(sfactor, dfactor);
                        }
                        break;
                    case RenderState.S_STATES[6]:
                        if(state[k] == 'On'){
                            gl.enable(gl.SCISSOR_TEST);
                        }
                        else if(state[k] == 'Off'){
                            gl.disable(gl.SCISSOR_TEST);
                        }
                        break;
                    case RenderState.S_STATES[7]:
                        if(state[k] == 'On'){
                            gl.enable(gl.POLYGON_OFFSET_FILL);
                        }
                        else if(state[k] == 'Off'){
                            gl.disable(gl.POLYGON_OFFSET_FILL);
                        }
                        break;
                    case RenderState.S_STATES[8]:
                        gl.polygonOffset(state[k][0], state[k][1]);
                        break;
                }
            }
        }
        return change;
    }

    /**
     * 重制帧上下文。<br/>
     * @private
     */
    _resetFrameContext(){
        this._m_FrameContext.reset();
    }

    /**
     * 重置所有渲染上下文。<br/>
     * @private
     */
    _resetRenderContext(){
        // 更新所有渲染程序
        for(let r in this._m_RenderPrograms){
            this._m_RenderPrograms[r].reset();
        }
    }

    /**
     * 绘制一帧。<br/>
     * @param {Number}[exTime]
     * @private
     */
    _drawFrame(exTime){
        let gl = this._m_Scene.getCanvas().getGLContext();
        // 一帧的开始
        this.fire(Render.PRE_FRAME, [exTime]);
        this._resetFrameContext();
        this._resetRenderContext();
        // this._checkRenderState(gl, this._m_FrameContext.getRenderState().reset(), this._m_FrameContext.getRenderState());
        this._checkRenderState(gl, this.m_InitState, this._m_FrameContext.getRenderState());
        // m_VisDrawables包含了视锥体剔除的结果
        // 在这里进行遮挡剔除
        // 然后进行z-pre pass
        // 剔除的时候,需要先排除GUI元素
        let visDrawables = this._m_VisDrawables;

        let stateChange = false;

        // 按材质分类
        // 1.实时创建分类列表
        // 2.另一种方案是,在添加和删除一个drawable的函数中提前分类材质
        // 然后在剔除阶段设置每个drawable的cull标记
        // 然后在路径渲染时根据cull跳过,这样虽然会遍历所有材质的所有几何,但是可以避免实时创建分类列表
        // 暂时使用方法1
        let hasOpaque = false;
        let hasTranslucent = false;
        let hasGUI = false;
        // 使用后置缓存?
        let useBackForwardFrameBuffer = false;
        // 灯光列表
        let lights = this._m_Scene.getVisLights();
        // 不透明队列
        let opaqueBucket = {};
        // 半透明队列
        // let translucentBucket = {};
        let translucentBucket = [];
        // 最后渲染的层
        let guiBucket = [];
        visDrawables.forEach(drawable=>{
            if(drawable.isGUI()){
                hasGUI = true;
                if(!guiBucket[drawable.getMaterial().getId()]){
                    guiBucket[drawable.getMaterial().getId()] = [];
                }
                guiBucket[drawable.getMaterial().getId()].push(drawable);
            }
            else if(drawable.isOpaque()){
                hasOpaque = true;
                if(!opaqueBucket[drawable.getMaterial().getId()]){
                    opaqueBucket[drawable.getMaterial().getId()] = [];
                }
                opaqueBucket[drawable.getMaterial().getId()].push(drawable);
            }
            else if(drawable.isTranslucent()){
                hasTranslucent = true;
                // if(!translucentBucket[drawable.getMaterial().getId()]){
                //     translucentBucket[drawable.getMaterial().getId()] = [];
                // }
                // translucentBucket[drawable.getMaterial().getId()].push(drawable);
                translucentBucket.push(drawable);
            }
        });

        // 排队,各种剔除之后(考虑设计一个RenderQueue,保存剔除后的待渲染的不透明，半透明，透明列表，然后作为参数传递到postQueue中)
        this.fire(Render.POST_QUEUE,[exTime]);



        // 不透明物体渲染默认默认开启深度测试,深度写入(但是仍然可以通过具体的SubPass控制渲染状态)
        if(hasOpaque){
            this._checkRenderState(gl, this._m_OpaqueRenderState, this._m_FrameContext.getRenderState());
        }
        let subShaders = null;
        // 延迟路径部分...
        useBackForwardFrameBuffer = this._m_Pipeline[1].render({gl, scene:this._m_Scene, frameContext:this._m_FrameContext, lights:lights, bucket:opaqueBucket});
        let pfilter = this._m_Scene.getMainCamera().demandFilter();
        if(!useBackForwardFrameBuffer){
            // 检测filters
            if(this._m_GammaCorrection || pfilter){
                useBackForwardFrameBuffer = true;
                gl.bindFramebuffer(gl.FRAMEBUFFER, this._m_FrameContext._m_DefaultFrameBuffer);
                this._m_FrameContext.m_LastFrameBuffer = this._m_FrameContext._m_DefaultFrameBuffer;
            }
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        // 正向路径部分...
        // 先渲染不透明队列
        this._m_Pipeline[0].render({gl, scene:this._m_Scene, frameContext:this._m_FrameContext, lights:lights, opaque:true, bucket:opaqueBucket});

        // 渲染env
        this._drawEnv(gl, lights);

        // 接着渲染半透明队列
        // 半透明物体默认关闭深度写入(但是仍然可通过具体的SubPass控制渲染状态)
        if(hasTranslucent){
            this._checkRenderState(gl, this._m_TranslucentRenderState, this._m_FrameContext.getRenderState());
            // 排序半透明队列
            // 这里有个问题,可以按照材质组作为整体组进行排序
            // 也可分开成独立物体进行排序
            // 由于默认关闭了深度写入,所有理论上所有面片都会渲染
            translucentBucket = RenderQueue.sortTranslucentBucket(this._m_Scene.getMainCamera(), translucentBucket);
            this._m_Pipeline[0].render({gl, scene:this._m_Scene, frameContext:this._m_FrameContext, lights:lights, translucent:true, bucket:translucentBucket});
        }

        // 一帧结束后
        if(pfilter){
            this.beginPostFilter();
        }
        this.fire(Render.POST_FRAME, [exTime]);
        if(pfilter){
            if(this._m_FrameContext.getRenderState().getFlag(RenderState.S_STATES[3]) == 'On'){
                gl.enable(gl.DEPTH_TEST);
            }
            this.finishPostFilter();
        }
        // 然后是GUI层(这里需要注意的是，这里需要完善，目前暂时使用opaque渲染)
        // 这里，GUI层比较特殊，应该在最后进行渲染（事实上，应该在默认gamma矫正之后，但可能gui本身也是在sRGB空间，所以这里在默认gamma矫正之前进行渲染）
        if(hasGUI){
            // 对于GUI,启用半透明混合,但是渲染的是opaque
            this._checkRenderState(gl, this._m_TranslucentRenderState, this._m_FrameContext.getRenderState());
            this._m_Pipeline[0].render({gl, scene:this._m_Scene, frameContext:this._m_FrameContext, lights:lights, opaque:true, bucket:guiBucket});
        }

        // 检测是否启用了自定义forwardFrameBuffer
        if(useBackForwardFrameBuffer){
            // 则在这里渲染到默认内置frameBuffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            // 渲染forwardPicture
            let forwardPicture = this._m_FrameContext.getFrameBuffer(Render.DEFAULT_FORWARD_SHADING_FRAMEBUFFER).getFramePicture();
            let currentTechnology = forwardPicture.getMaterial().getCurrentTechnology();
            // 获取当前技术所有Forward路径下的SubShaders
            let forwardSubPasss = currentTechnology.getSubPasss(Render.FORWARD);
            // 这里按照架构严格设计应该是遍历所有subShaders,但由于该阶段是完全引擎内置操作,所以直接取[0]第一个元素subShader进行渲染,从而跳过多余的遍历
            forwardPicture.getMaterial()._selectSubShader(forwardSubPasss.getSubShaders()[0].subShader);
            let renderDatas = forwardSubPasss.getSubShaders()[0].subShader.getRenderDatas();
            if(this._m_FrameContext.getRenderState().getFlag(RenderState.S_STATES[3]) == 'On'){
                gl.disable(gl.DEPTH_TEST);
            }
            for(let k in renderDatas){
                gl.activeTexture(gl.TEXTURE0 + renderDatas[k].loc);
                gl.bindTexture(gl.TEXTURE_2D, this._m_FrameContext.getFrameBuffer(renderDatas[k].refId).getTexture(renderDatas[k].dataId).getLoc());
            }
            forwardPicture.draw(this._m_FrameContext);
            if(this._m_FrameContext.getRenderState().getFlag(RenderState.S_STATES[3]) == 'On'){
                gl.enable(gl.DEPTH_TEST);
            }
            this._m_FrameContext.m_LastFrameBuffer = null;
        }
    }

    /**
     * 使用默认输出缓存。<br/>
     */
    useDefaultFrame(){
        if(this._m_FrameContext.m_LastFrameBuffer != null){
            let gl = this._m_Scene.getCanvas().getGLContext();
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            this._m_FrameContext.m_LastFrameBuffer = null;
        }
    }

    /**
     * 设置渲染视口。<br/>
     * @param {WebGL}[gl]
     * @param {Number}[x 偏移量]
     * @param {Number}[y 偏移量]
     * @param {Number}[w 视口宽度]
     * @param {Number}[h 视口高度]
     */
    setViewPort(gl, x, y, w, h){
        gl.viewport(x, y, w, h);
    }

    /**
     * 强制在接下来中使用指定的某个材质。<br/>
     * @param {String}[path]
     * @param {Material}[mat]
     * @param {Number}[passId]
     */
    useForcedMat(path, mat, passId){
        let currentTechnology = mat.getCurrentTechnology();
        let subPasss = currentTechnology.getSubPasss(path);
        if(subPasss) {
            let subShaders = subPasss.getSubShaders();
            let i = 0;
            for(let subShader in subShaders) {
                // 指定subShader
                if(i == passId){
                    mat._selectSubShader(subShaders[subShader].subShader);
                    let renderDatas = subShaders[subShader].subShader.getRenderDatas();
                    const gl = this._m_Scene.getCanvas().getGLContext();
                    for(let k in renderDatas){
                        gl.activeTexture(gl.TEXTURE0 + renderDatas[k].loc);
                        gl.bindTexture(gl.TEXTURE_2D, this._m_FrameContext.getFrameBuffer(renderDatas[k].refId).getTexture(renderDatas[k].dataId).getLoc());
                    }
                    break;
                }
                i++;
            }
        }
    }

    /**
     * 渲染指定列表。<br/>
     * 假设该列表已排序。<br/>
     * @param {WebGL}[gl]
     * @param {String}[path]
     * @param {Object}[lights]
     * @param {Light[]}[lights]
     */
    draw(gl, path, bucks, lights, swarp){
        let subShaders = null;
        let mat = null;
        let currentTechnology = null;
        let subPasss = null;
        if(bucks){
            let resetFrameBuffer = this._m_FrameContext.m_LastFrameBuffer;
            let outFB = null;
            let j = 0;
            for(let matId in bucks){
                if(swarp && j > 0){
                    this.swapPostFilter();
                }
                j++;
                // 获取当前选中的技术
                mat = this._m_Scene.getComponent(matId);
                currentTechnology = mat.getCurrentTechnology();
                subPasss = currentTechnology.getSubPasss(path);
                if(subPasss){
                    subShaders = subPasss.getSubShaders();
                    let i = 0;
                    // 执行渲染
                    for(let subShader in subShaders){
                        if(swarp && i > 0){
                            this.swapPostFilter();
                        }
                        i++;
                        // 指定subShader
                        mat._selectSubShader(subShaders[subShader].subShader);
                        if(subShaders[subShader].subShader.getFBId() != null){
                            outFB = this._m_FrameContext.getFrameBuffer(subShaders[subShader].subShader.getFBId());
                            if(this._m_FrameContext.m_LastFrameBuffer != outFB){
                                this._m_FrameContext.m_LastFrameBuffer = outFB;
                                gl.bindFramebuffer(gl.FRAMEBUFFER, outFB.getFrameBuffer());
                                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                            }
                        }
                        else if(this._m_FrameContext.m_LastFrameBuffer != resetFrameBuffer){
                            // 不需要clear
                            gl.bindFramebuffer(gl.FRAMEBUFFER, resetFrameBuffer);
                            this._m_FrameContext.m_LastFrameBuffer = resetFrameBuffer;
                        }
                        let renderDatas = subShaders[subShader].subShader.getRenderDatas();
                        for(let k in renderDatas){
                            gl.activeTexture(gl.TEXTURE0 + renderDatas[k].loc);
                            gl.bindTexture(gl.TEXTURE_2D, this._m_FrameContext.getFrameBuffer(renderDatas[k].refId).getTexture(renderDatas[k].dataId).getLoc());
                        }
                        // 检测是否需要更新渲染状态
                        if(subShaders[subShader].renderState){
                            // 依次检测所有项
                            this._checkRenderState(gl, subShaders[subShader].renderState, this._m_FrameContext.getRenderState());
                        }
                        this._m_RenderPrograms[subShaders[subShader].subShader.getRenderProgramType()].drawArrays(gl, this._m_Scene, this._m_FrameContext, bucks[matId], lights);

                    }
                }
            }
            if(this._m_FrameContext.m_LastFrameBuffer != resetFrameBuffer){
                gl.bindFramebuffer(gl.FRAMEBUFFER, resetFrameBuffer);
                this._m_FrameContext.m_LastFrameBuffer = resetFrameBuffer;
            }
        }
    }

    /**
     * 渲染环境。<br/>
     * @param {WebGL}[gl]
     * @param {Number[]}[lights]
     */
    _drawEnv(gl, lights){
        // 渲染sky
        if(this._m_Sky){
            let subShaders = null;
            // 获取当前选中的技术
            let mat = this._m_Sky.getMaterial();
            let currentTechnology = mat.getCurrentTechnology();
            // 获取当前技术所有Forward路径下的SubShaders
            let forwardSubPasss = currentTechnology.getSubPasss(Render.FORWARD);
            // 如果该物体存在Forward路径渲染的需要,则执行Forward渲染
            if(forwardSubPasss){
                subShaders = forwardSubPasss.getSubShaders();
                // 执行渲染
                for(let subShader in subShaders){
                    // 检测是否需要更新渲染状态
                    if(subShaders[subShader].renderState){
                        // 依次检测所有项
                        this._checkRenderState(gl, subShaders[subShader].renderState, this._m_FrameContext.getRenderState());
                    }
                    // 指定subShader
                    mat._selectSubShader(subShaders[subShader].subShader);
                    this._m_RenderPrograms[subShaders[subShader].subShader.getRenderProgramType()].draw(gl, this._m_Scene, this._m_FrameContext, this._m_Sky, lights);
                    // geo.draw(this._m_FrameContext);
                }
            }
        }
    }

    /**
     * 启用或关闭gamma矫正。<br/>
     * @param {Boolean}[enable]
     */
    enableGammaCorrection(enable){
        // 现在忽略这个参数
        this._m_GammaCorrection = enable;
    }

    /**
     * 启用或关闭toneMapping。<br/>
     * @param {Boolean}[enable]
     */
    enableToneMapping(enable){
        if(enable != this._m_ToneMapping){
            this._m_ToneMapping = enable;
            this._m_FrameContext.getFrameBuffer(Render.DEFAULT_FORWARD_SHADING_FRAMEBUFFER).getFramePicture().getMaterial().setParam('toneMapping', new BoolVars().valueOf(this._m_ToneMapping));
        }
    }

    /**
     * 设置gamma编码因子。<br/>
     * @param {Number}[gammaFactor 默认为0.45]
     */
    setGammaFactor(gammaFactor){
        if(gammaFactor != this._m_GammaFactor){
            this._m_GammaFactor = gammaFactor;
            this._m_FrameContext.getFrameBuffer(Render.DEFAULT_FORWARD_SHADING_FRAMEBUFFER).getFramePicture().getMaterial().setParam('gammaFactor', new FloatVars().valueOf(this._m_GammaFactor));
        }
    }

    /**
     * 执行渲染调用,先判断是否需要重新构建渲染列表,然后判断是否需要优化排序,以便把所有材质一致的渲染元素排列在一起,加速渲染调用。<br/>
     * @param exTime
     */
    render(exTime){
        if(true){
            this._drawFrame(exTime);
        }
    }

    /**
     * 排序渲染列表,这里根据材质对象进行优化排序渲染列表,以便加速渲染调用。<br/>
     * @private
     */
    _sortDrawList(){

    }

}
