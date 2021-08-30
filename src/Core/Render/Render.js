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
import DefaultRenderProgram from "./DefaultRenderProgram.js";
import SinglePassLightingRenderProgram from "./SinglePassLightingRenderProgram.js";
import SinglePassIBLLightingRenderProgram from "./SinglePassIBLLightingRenderProgram.js";
import Log from "../Util/Log.js";
import Internal from "./Internal.js";
import RenderQueue from "./RenderQueue.js";
import TempVars from "../Util/TempVars.js";
import Forward from "./Pipeline/Forward.js";
import Deferred from "./Pipeline/Deferred.js";

export default class Render extends Component{
    // 渲染路径
    static FORWARD = 'Forward';
    static DEFERRED_SHADING = 'DeferredShading';
    static DEFERRED_SHADING_G_BUFFER_PASS = "GBufferPass";
    static DEFERRED_SHADING_DEFERRED_SHADING_PASS = "DeferredShadingPass";
    static DEFERRED_SHADING_PASS_GROUP = [Render.DEFERRED_SHADING_G_BUFFER_PASS, Render.DEFERRED_SHADING_DEFERRED_SHADING_PASS];

    // 默认延迟着色渲染路径frameBuffer
    static DEFAULT_DEFERRED_SHADING_FRAMEBUFFER = 'DefaultDeferredShadingFrameBuffer';
    // 如果启用了多渲染路径,则创建默认forwardFrameBuffer而不是使用内置frameBuffer(这是因为webGL不支持从多fbo.blit到内置fbo)
    static DEFAULT_FORWARD_SHADING_FRAMEBUFFER = 'DefaultForwardShadingFrameBuffer';

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

        // 帧上下文
        this._m_FrameContext = new FrameContext();
        // 所有可用渲染程序
        this._m_RenderPrograms = {};

        // 不透明队列的默认渲染状态
        this._m_OpaqueRenderState = new RenderState();
        // 半透明队列的默认渲染状态
        this._m_TranslucentRenderState = new RenderState();
        // 开启blend模式
        this._m_TranslucentRenderState.setFlag(RenderState.S_STATES[4], 'On');
        // 关闭深度写入(不建议默认设置,因为对于大部分情况,都需要开启深度写入,以避免同一个物体前后交叉而没有深度写入导致错误情况产生,但可以通过具体材质进行控制)
        // this._m_TranslucentRenderState.setFlag(RenderState.S_STATES[1], 'Off');
        // 设置默认blend方程(默认方程)
        this._m_TranslucentRenderState.setFlag(RenderState.S_STATES[5], ['SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA']);


        // 一些杂项
        // singlePass batchLightSize 默认为4
        this._m_BatchLightSize = 4;
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
        // G-buffer0
        dfb.addTexture(gl, ShaderSource.S_G_BUFFER0_SRC, gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT0, true);
        // G-buffer1
        dfb.addTexture(gl, ShaderSource.S_G_BUFFER1_SRC, gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT1, true);
        // G-buffer2
        dfb.addTexture(gl, ShaderSource.S_G_BUFFER2_SRC, gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT2, true);
        // 创建depth附件(使用renderBuffer来提供)
        // 渲染缓存是一种特殊缓冲区,不需要在shader中写数据,而是可以作为提供类似深度缓冲区这种类型的缓存来使用
        // webGL2.0不支持将深度写入纹理,https://www.it1352.com/1705357.html
        dfb.addBuffer(gl, ShaderSource.S_G_DEPTH_RENDER_BUFFER_SRC, gl.DEPTH24_STENCIL8, gl.DEPTH_STENCIL_ATTACHMENT);
        // dfb.addTexture(gl, ShaderSource.S_G_DEPTH_SRC, gl.DEPTH_COMPONENT16 , 0, gl.DEPTH_COMPONENT16, gl.UNSIGNED_BYTE, gl.DEPTH_ATTACHMENT, false);
        // 但由于webGL不完全兼容gl.blitFramebuffer,所以这里使用纹理附件写入的方式进行
        // 而由于webGL不支持将深度附件作为纹理使用,所以需要同时创建一个depthRenderBuffer和一个depthTexture
        // dfb.addTexture(gl, ShaderSource.S_G_DEPTH_SRC, gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT3, true);
        // 这里使用另一种解决方案(由于webGL不支持从自定义frameBuffer.blit数据到默认frameBuffer,所以一旦启用了延迟渲染路径,则创建一个默认的forwardFrameBuffer而不是使用默认内置frameBuffer
        dfb.finish(gl, this._m_Scene, true);

        // 创建备用默认fbo
        let ffb = new FrameBuffer(gl, Render.DEFAULT_FORWARD_SHADING_FRAMEBUFFER, w, h);
        this._m_FrameContext.addFrameBuffer(Render.DEFAULT_FORWARD_SHADING_FRAMEBUFFER, ffb);
        // ffb.addBuffer(gl, 'outColor', gl.RGBA4, gl.COLOR_ATTACHMENT0);
        ffb.addTexture(gl, ShaderSource.S_FORWARD_COLOR_MAP_SRC, gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT0, false);
        // ffb.addTexture(gl, 'outColor', gl.RGB, 0, gl.RGB, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT0, false);
        ffb.addBuffer(gl, 'depth', gl.DEPTH24_STENCIL8, gl.DEPTH_STENCIL_ATTACHMENT);
        ffb.finish(gl, this._m_Scene, true);
        let forwardMat = new Material(this._m_Scene, {id:'for_m', frameContext:this.getFrameContext(), materialDef:MaterialDef.parse(Internal.S_DEFAULT_OUT_COLOR_DEF_DATA)});
        ffb.getFramePicture().setMaterial(forwardMat);
        this._m_FrameContext._m_DefaultFrameBuffer = ffb.getFrameBuffer();

        // 加载可用渲染程序
        this._m_RenderPrograms[DefaultRenderProgram.PROGRAM_TYPE] = new DefaultRenderProgram();
        this._m_RenderPrograms[SinglePassLightingRenderProgram.PROGRAM_TYPE] = new SinglePassLightingRenderProgram();
        this._m_RenderPrograms[SinglePassIBLLightingRenderProgram.PROGRAM_TYPE] = new SinglePassIBLLightingRenderProgram();


        // pipeline
        this._m_Pipeline[0] = new Forward({render:this});
        this._m_Pipeline[1] = new Deferred({render:this});

        // 监听canvas的基本事件
        this._m_Scene.getCanvas().on('resize', (w, h)=>{
            this._m_FrameContext.resize(gl, w, h);
            this._m_FrameContext._m_DefaultFrameBuffer = this._m_FrameContext.getFrameBuffer(Render.DEFAULT_FORWARD_SHADING_FRAMEBUFFER).getFrameBuffer();
        });
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
                }
            }
        }
        return change;
    }

    /**
     * 重制渲染上下文。<br/>
     * @private
     */
    _resetFrameContext(){
        this._m_FrameContext.reset();
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
        this._checkRenderState(gl, this._m_FrameContext.getRenderState().reset(), this._m_FrameContext.getRenderState());
        // 视锥剔除,遮挡查询
        // 从所有可见drawable列表中,进行剔除,得到剔除后的列表
        // 这里暂时还没实现剔除,所以直接就是全部的drawables
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
        // 使用后置缓存?
        let useBackForwardFrameBuffer = false;
        // 灯光列表
        let lights = this._m_Scene.getEnableLights();
        // 不透明队列
        let opaqueBucket = {};
        // 半透明队列
        // let translucentBucket = {};
        let translucentBucket = [];
        visDrawables.forEach(drawable=>{
            if(drawable.isOpaque()){
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
        if(!useBackForwardFrameBuffer){
            // 检测filters
            let mainCamera = this._m_Scene.getMainCamera();
            if(mainCamera.demandFilter()){
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
        // 一帧结束后
        this.fire(Render.POST_FRAME, [exTime]);
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
     * 渲染指定列表。<br/>
     * 假设该列表已排序。<br/>
     * @param {WebGL}[gl]
     * @param {String}[path]
     * @param {Object}[lights]
     * @param {Light[]}[lights]
     */
    draw(gl, path, bucks, lights){
        let subShaders = null;
        let mat = null;
        let currentTechnology = null;
        let subPasss = null;
        if(bucks){
            let resetFrameBuffer = this._m_FrameContext.m_LastFrameBuffer;
            let outFB = null;
            for(let matId in bucks){
                // 获取当前选中的技术
                mat = this._m_Scene.getComponent(matId);
                currentTechnology = mat.getCurrentTechnology();
                subPasss = currentTechnology.getSubPasss(path);
                if(subPasss){
                    subShaders = subPasss.getSubShaders();
                    // 执行渲染
                    for(let subShader in subShaders){
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
