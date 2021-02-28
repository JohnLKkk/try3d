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
        // 关闭深度写入
        this._m_TranslucentRenderState.setFlag(RenderState.S_STATES[1], 'Off');
        // 设置默认blend方程


    }

    /**
     * 启动渲染器。<br/>
     */
    startUp(){
        // 创建默认DeferredShadingFrameBuffer
        let gl = this._m_Scene.getCanvas().getGLContext();
        var DepthEXT = gl.getExtension( "WEBKIT_WEBGL_depth_texture" ) ||
            gl.getExtension( "MOZ_WEBGL_depth_texture" );
        console.log("depthEXT:",DepthEXT);
        // console.log("支持的拓展:" , gl.getSupportedExtensions());
        let w = this._m_Scene.getCanvas().getWidth();
        let h = this._m_Scene.getCanvas().getHeight();
        let dfb = new FrameBuffer(gl, Render.DEFAULT_DEFERRED_SHADING_FRAMEBUFFER, w, h);
        this._m_FrameContext.addFrameBuffer(Render.DEFAULT_DEFERRED_SHADING_FRAMEBUFFER, dfb);
        // position color buffer
        dfb.addTexture(gl, ShaderSource.S_G_POSITION_SRC, gl.RGB, 0, gl.RGB, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT0, true);
        // normal color buffer
        dfb.addTexture(gl, ShaderSource.S_G_NORMAL_SRC, gl.RGB, 0, gl.RGB, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT1, true);
        // color + specular color buffer
        dfb.addTexture(gl, ShaderSource.S_G_ALBEDOSPEC_SRC, gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT2, true);
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
        let forwardMat = new Material(this._m_Scene, {id:'for_m', frameContext:this.getFrameContext(), materialDef:MaterialDef.load("../src/Core/Assets/MaterialDef/DefaultOutColorDef")});
        ffb.getFramePicture().setMaterial(forwardMat);
        this._m_FrameContext._m_DefaultFrameBuffer = ffb.getFrameBuffer();

        // 加载可用渲染程序
        this._m_RenderPrograms[DefaultRenderProgram.PROGRAM_TYPE] = new DefaultRenderProgram();
        this._m_RenderPrograms[SinglePassLightingRenderProgram.PROGRAM_TYPE] = new SinglePassLightingRenderProgram();
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
        for(let k in state){
            if(currentRenderState.getFlag(k) != state[k]){
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
                        console.log("depthWrite");
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
                        console.log("depthTest");
                        if(state[k] == 'On'){
                            gl.enable(gl.DEPTH_TEST);
                        }
                        else if(state[k] == 'Off'){
                            gl.disable(gl.DEPTH_TEST);
                        }
                        break;
                }
            }
        }
    }
    // 后期开发渲染路径模块时,把_draw2开发完成然后删掉_draw函数
    _draw(exTime){
        // 一帧的开始
        this.fire(Render.PRE_FRAME, [exTime]);
        // 视锥剔除,遮挡查询
        // 从所有可见drawable列表中,进行剔除,得到剔除后的列表
        // 这里暂时还没实现剔除,所以直接就是全部的drawables
        // 剔除的时候,需要先排除GUI元素
        let visDrawables = this._m_VisDrawables;

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
        let lights = this._m_Scene.getLights();
        // 不透明队列
        let opaqueBucket = {};
        // 半透明队列
        let translucentBucket = {};
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
                if(!translucentBucket[drawable.getMaterial().getId()]){
                    translucentBucket[drawable.getMaterial().getId()] = [];
                }
                translucentBucket[drawable.getMaterial().getId()].push(drawable);
            }
        });

        // 排队,各种剔除之后(考虑设计一个RenderQueue,保存剔除后的待渲染的不透明，半透明，透明列表，然后作为参数传递到postQueue中)
        this.fire(Render.POST_QUEUE,[exTime]);

        let gl = this._m_Scene.getCanvas().getGLContext();


        // 不透明物体渲染默认默认开启深度测试,深度写入(但是仍然可以通过具体的SubPass控制渲染状态)
        if(hasOpaque){
            this._checkRenderState(gl, this._m_OpaqueRenderState, this._m_FrameContext.getRenderState());
        }
        let subShaders = null;
        // 延迟路径部分...
        let renderInDeferredShading = false;
        let deferredShadingPass = null;
        for(let matId in opaqueBucket){
            let subShader = null;
            opaqueBucket[matId].forEach(geo=>{
                // 获取当前选中的技术
                let mat = this._m_Scene.getComponent(matId);
                let currentTechnology = mat.getCurrentTechnology();
                // 获取当前技术所有DeferredShading路径下的SubShaders
                let deferredShadingSubPasss = currentTechnology.getSubPasss(Render.DEFERRED_SHADING);
                // 如果该物体存在DeferredShading路径渲染的需要,则执行DeferredShading渲染
                if(deferredShadingSubPasss){
                    subShaders = deferredShadingSubPasss.getSubShaderMaps();
                    // 获取GBuffPass
                    // 检测是否需要切换FrameBuffer
                    subShader = Render.DEFERRED_SHADING_PASS_GROUP[0];
                    if(!renderInDeferredShading){
                        renderInDeferredShading = true;
                        // 获取deferredShadingSubPasss使用的延迟frameBuffer
                        let dfb = this._m_FrameContext.getFrameBuffer(subShaders[subShader].subShader.getFBId() || Render.DEFAULT_DEFERRED_SHADING_FRAMEBUFFER);
                        gl.bindFramebuffer(gl.FRAMEBUFFER, dfb.getFrameBuffer());
                        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                        this._m_FrameContext.m_LastFrameBuffer = dfb;
                    }
                    else if(this._m_FrameContext.m_LastFrameBuffer != this._m_FrameContext.getFrameBuffer(subShaders[subShader].subShader.getFBId() || Render.DEFAULT_DEFERRED_SHADING_FRAMEBUFFER)){
                        // 报错,因为必须所有延迟渲染都使用同一个frameBuffer
                        console.error("使用了不同的dfb>>>");
                    }
                    // 检测是否需要更新渲染状态
                    if(subShaders[subShader].renderState){
                        // 依次检测所有项
                        this._checkRenderState(gl, subShaders[subShader].renderState, this._m_FrameContext.getRenderState());
                    }
                    // 指定subShader
                    mat._selectSubShader(subShaders[subShader].subShader);
                    geo.draw(this._m_FrameContext);
                    // deferredShadingPass
                    subShader = Render.DEFERRED_SHADING_PASS_GROUP[1];
                    deferredShadingPass = subShaders[subShader];
                }
            });
        }
        if(renderInDeferredShading && deferredShadingPass){
            useBackForwardFrameBuffer = true;
            let dfb = this._m_FrameContext.m_LastFrameBuffer;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._m_FrameContext._m_DefaultFrameBuffer);
            this._m_FrameContext.m_LastFrameBuffer = this._m_FrameContext._m_DefaultFrameBuffer;
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            // 下面是待实现的内容---------------------↓
            // DeferredShadingPass
            // 1.先检测是否需要切换subShader(根据shader种类)(这里检测可能与理论不一样，打印出id来调试...)
            if(this._m_FrameContext.m_LastSubShaderId != deferredShadingPass.subShader.getDefId()){
                // 切换
                deferredShadingPass.subShader.use(gl);
                this._m_FrameContext.m_LastSubShaderId = deferredShadingPass.subShader.getDefId();
            }
            // 2.检测是否需要更新参数到subShader中(同种类型subShaderId,但存在不同具体实力化subShader对象,所以参数不同需要更新)
            if(this._m_FrameContext.m_LastSubShader != deferredShadingPass.subShader){
                this._m_FrameContext.m_LastSubShader = deferredShadingPass.subShader;
            }

            // 检测是否需要更新渲染状态
            if(deferredShadingPass.renderState){
                // 依次检测所有项
                this._checkRenderState(gl, deferredShadingPass.renderState, this._m_FrameContext.getRenderState());
            }

            let dfbFramePicture = dfb.getFramePicture();
            let renderDatas = deferredShadingPass.subShader.getRenderDatas();
            // 绑定renderData
            // dfb.getTextures().forEach(texture=>{
            //     if(renderDatas[texture.getName()]){
            //         gl.activeTexture(gl.TEXTURE0 + renderDatas[texture.getName()].loc);
            //         gl.bindTexture(gl.TEXTURE_2D, texture.getLoc());
            //     }
            // });
            for(let k in renderDatas){
                gl.activeTexture(gl.TEXTURE0 + renderDatas[k].loc);
                gl.bindTexture(gl.TEXTURE_2D, this._m_FrameContext.getFrameBuffer(renderDatas[k].refId).getTexture(renderDatas[k].dataId).getLoc());
            }
            // 关闭深度测试然后进行渲染dfbFramePicture(因为渲染的是一个Picture,深度永远最小,如果不关闭,则后续的前向渲染所有物体都无法通过测试)
            // draw call
            if(this._m_FrameContext.getRenderState().getFlag(RenderState.S_STATES[3]) == 'On'){
                gl.disable(gl.DEPTH_TEST);
                // gl.depthMask(false);
            }
            this._m_RenderPrograms[deferredShadingPass.subShader.getRenderProgramType()].draw(gl, this._m_Scene, this._m_FrameContext, dfbFramePicture, lights);
            dfbFramePicture.draw(this._m_FrameContext);
            if(this._m_FrameContext.getRenderState().getFlag(RenderState.S_STATES[3]) == 'On'){
                gl.enable(gl.DEPTH_TEST);
                // gl.depthMask(true);
            }
            // 绑定renderData
            // dfb.getTextures().forEach(texture=>{
            //     if(renderDatas[texture.getName()]){
            //         gl.activeTexture(gl.TEXTURE0 + renderDatas[texture.getName()].loc);
            //         gl.bindTexture(gl.TEXTURE_2D, null);
            //     }
            // });
            // 获取所有可见灯光并进行提交数据
            // (判断材质是否需要灯光?)
            // ...
            // 渲染light
            // 获取默认的GUI元素(id为deferredShadingQuad)
            // gl.bindVertexArray(deferredShadingQuadVAO);
            // gl.drawElements(gl.TRIANGLES, 4, gl.UNSIGNED_SHORT, 0);
            // gl.bindVertexArray(null);
            // 上面是待实现的内容---------------------↑

            // 复制geometry深度到下一个渲染缓存(默认缓存)并继续后续渲染
            // 设置写入默认缓存
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, dfb.getFrameBuffer());
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this._m_FrameContext._m_DefaultFrameBuffer);
            // 复制数据到默认缓存
            // 请注意，这可能会也可能不会，因为FBO和默认帧缓冲区的内部格式必须匹配。
            // 内部格式由实现定义。 这适用于我的所有系统，但是如果您的系统不适用，则可能必须在另一个着色器阶段写入深度缓冲区（或以某种方式将默认帧缓冲区的内部格式与FBO的内部格式进行匹配）。
            gl.blitFramebuffer(0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight(), 0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight(), gl.DEPTH_BUFFER_BIT, gl.NEAREST);
            // 切换回默认fb1
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._m_FrameContext._m_DefaultFrameBuffer);
        }
        else{
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        // 正向路径部分...
        // 先渲染不透明队列
        for(let matId in opaqueBucket){
            opaqueBucket[matId].forEach(geo=>{
                // 获取当前选中的技术
                let mat = this._m_Scene.getComponent(matId);
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
                        this._m_RenderPrograms[subShaders[subShader].subShader.getRenderProgramType()].draw(gl, this._m_Scene, this._m_FrameContext, geo, lights);
                        // geo.draw(this._m_FrameContext);
                    }
                }
            });
        }
        // 接着渲染半透明队列
        // 半透明物体默认关闭深度写入(但是仍然可通过具体的SubPass控制渲染状态)
        if(hasTranslucent){
            this._checkRenderState(gl, this._m_TranslucentRenderState, this._m_FrameContext.getRenderState());
            // 排序半透明队列
            // 这里有个问题,可以按照材质组作为整体组进行排序
            // 也可分开成独立物体进行排序
            // 由于默认关闭了深度写入,所有理论上所有面片都会渲染
        }
        for(let matId in translucentBucket){
            translucentBucket[matId].forEach(geo=>{
                // 获取当前选中的技术
                let mat = this._m_Scene.getComponent(matId);
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
                        this._m_RenderPrograms[subShaders[subShader].subShader.getRenderProgramType()].draw(gl, this._m_Scene, this._m_FrameContext, geo, lights);
                        // geo.draw(this._m_FrameContext);
                    }
                }
            });
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
    // _draw(exTime){
    //     // 一帧的开始
    //     this.fire('preFrame', [exTime]);
    //
    //     // 重置上下文信息
    //     this._m_FrameContext.reset();
    //     // 半透明列表
    //     let translucentBucket = [];
    //     // 透明列表
    //     let transparentBucket = [];
    //     // 绘制渲染列表
    //
    //     // 排队,各种剔除之后(考虑设计一个RenderQueue,保存剔除后的待渲染的不透明，半透明，透明列表，然后作为参数传递到postQueue中)
    //     this.fire('postQueue',[exTime]);
    //
    //     let gl = this._m_Scene.getCanvas().getGLContext();
    //     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //
    //
    //     // 1.首先绘制不透明元素,把半透明和透明分别归入不同的列表中,在后一个步骤中渲染。
    //     this._m_Drawables.forEach(iDrawable=>{
    //         // 绘制不透明元素
    //         if(iDrawable.isOpaque()){
    //             iDrawable.draw(this._m_FrameContext);
    //         }
    //         else if(iDrawable.isTranslucent()){
    //             // 添加到半透明列表
    //             translucentBucket.push(iDrawable);
    //         }
    //         else if(iDrawable.isTransparent()){
    //             // 添加到透明列表
    //             transparentBucket.push(iDrawable);
    //         }
    //     });
    //     // 2.绘制半透明列表
    //     // 设置gl状态机,开始混合模式
    //     for(let iDrawable in translucentBucket){
    //
    //     }
    //     // 3.绘制透明列表
    //     for(let iDrawable in transparentBucket){
    //
    //     }
    //
    //     // 一帧结束后
    //     this.fire('postFrame', [exTime]);
    // }

    /**
     * 执行渲染调用,先判断是否需要重新构建渲染列表,然后判断是否需要优化排序,以便把所有材质一致的渲染元素排列在一起,加速渲染调用。<br/>
     * @param exTime
     */
    render(exTime){
        if(true){
            this._draw(exTime);
        }
    }

    /**
     * 排序渲染列表,这里根据材质对象进行优化排序渲染列表,以便加速渲染调用。<br/>
     * @private
     */
    _sortDrawList(){

    }

}
