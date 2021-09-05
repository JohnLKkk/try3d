import Base from "./Base.js";
import RenderState from "../../WebGL/RenderState.js";
import Render from "../Render.js";

export default class Deferred extends Base{
    static S_DEFERRED_SHADING_G_BUFFER_PASS = "GBufferPass";
    static S_DEFERRED_SHADING_DEFERRED_SHADING_PASS = "DeferredShadingPass";
    static S_DEFERRED_SHADING_PASS_GROUP = [Deferred.S_DEFERRED_SHADING_G_BUFFER_PASS, Deferred.S_DEFERRED_SHADING_DEFERRED_SHADING_PASS];
    static S_DEFERRED_SHADING_PASS_GROUP_2 = [0, 1];
    constructor(props) {
        super(props);

    }
    render(cfg) {
        let frameContext = cfg.frameContext;
        let gl = cfg.gl;
        let scene = cfg.scene;
        let lights = cfg.lights;
        let stateChange = false;
        let subShaders = null;
        let renderInDeferredShading = false;
        let deferredShadingPass = null;
        let useBackForwardFrameBuffer = false;
        for(let matId in cfg.bucket){
            frameContext.getRenderState().restore();
            let subShader = null;
            cfg.bucket[matId].forEach(geo=>{
                stateChange = false;
                // 获取当前选中的技术
                let mat = scene.getComponent(matId);
                let currentTechnology = mat.getCurrentTechnology();
                // 获取当前技术所有DeferredShading路径下的SubShaders
                let deferredShadingSubPasss = currentTechnology.getSubPasss(Render.DEFERRED_SHADING);
                // 如果该物体存在DeferredShading路径渲染的需要,则执行DeferredShading渲染
                if(deferredShadingSubPasss){
                    subShaders = deferredShadingSubPasss.getSubShaderMaps();
                    // 获取GBuffPass
                    // 检测是否需要切换FrameBuffer
                    subShader = Deferred.S_DEFERRED_SHADING_PASS_GROUP[0];
                    if(subShaders[subShader] == null){
                        subShader = Deferred.S_DEFERRED_SHADING_PASS_GROUP_2[0];
                    }
                    if(!renderInDeferredShading){
                        renderInDeferredShading = true;
                        // 获取deferredShadingSubPasss使用的延迟frameBuffer
                        let dfb = frameContext.getFrameBuffer(subShaders[subShader].subShader.getFBId() || Render.DEFAULT_DEFERRED_SHADING_FRAMEBUFFER);
                        gl.bindFramebuffer(gl.FRAMEBUFFER, dfb.getFrameBuffer());
                        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                        frameContext.m_LastFrameBuffer = dfb;
                    }
                    else if(frameContext.m_LastFrameBuffer != frameContext.getFrameBuffer(subShaders[subShader].subShader.getFBId() || Render.DEFAULT_DEFERRED_SHADING_FRAMEBUFFER)){
                        // 报错,因为必须所有延迟渲染都使用同一个frameBuffer
                        console.error("使用了不同的dfb>>>");
                    }
                    // 检测是否需要更新渲染状态
                    if(subShaders[subShader].renderState){
                        // 依次检测所有项
                        stateChange = this._m_Render._checkRenderState(gl, subShaders[subShader].renderState, frameContext.getRenderState());
                    }
                    // 指定subShader
                    mat._selectSubShader(subShaders[subShader].subShader);
                    geo.draw(frameContext);
                    // deferredShadingPass
                    subShader = Deferred.S_DEFERRED_SHADING_PASS_GROUP[1];
                    deferredShadingPass = subShaders[subShader] ? subShaders[subShader] : subShaders[Deferred.S_DEFERRED_SHADING_PASS_GROUP_2[1]];
                }
                if(stateChange){
                    this._checkRenderState(gl, frameContext.restore(), frameContext.getRenderState());
                }
            });
        }
        if(renderInDeferredShading && deferredShadingPass){
            useBackForwardFrameBuffer = true;
            let dfb = frameContext.m_LastFrameBuffer;
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameContext._m_DefaultFrameBuffer);
            frameContext.m_LastFrameBuffer = frameContext._m_DefaultFrameBuffer;
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            // 下面是待实现的内容---------------------↓
            // DeferredShadingPass
            // 1.先检测是否需要切换subShader(根据shader种类)(这里检测可能与理论不一样，打印出id来调试...)
            if(frameContext.m_LastSubShaderId != deferredShadingPass.subShader.getDefId()){
                // 此时可能未编译,所以需要检测
                // 检测是否需要重新编译subShader
                if(deferredShadingPass.subShader.needCompile()){
                    deferredShadingPass.subShader._compile(gl, frameContext);
                }
                deferredShadingPass.subShader.use(gl);
                frameContext.m_LastSubShaderId = deferredShadingPass.subShader.getDefId();
            }
            // 2.检测是否需要更新参数到subShader中(同种类型subShaderId,但存在不同具体实力化subShader对象,所以参数不同需要更新)
            if(frameContext.m_LastSubShader != deferredShadingPass.subShader){
                frameContext.m_LastSubShader = deferredShadingPass.subShader;
            }

            // 检测是否需要更新渲染状态
            if(deferredShadingPass.renderState){
                // 依次检测所有项
                this._m_Render._checkRenderState(gl, deferredShadingPass.renderState, frameContext.getRenderState());
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
                gl.bindTexture(gl.TEXTURE_2D, frameContext.getFrameBuffer(renderDatas[k].refId).getTexture(renderDatas[k].dataId).getLoc());
            }
            // 关闭深度测试然后进行渲染dfbFramePicture(因为渲染的是一个Picture,深度永远最小,如果不关闭,则后续的前向渲染所有物体都无法通过测试)
            // draw call
            if(frameContext.getRenderState().getFlag(RenderState.S_STATES[3]) == 'On'){
                gl.disable(gl.DEPTH_TEST);
                // gl.depthMask(false);
            }
            this._m_Render._m_RenderPrograms[deferredShadingPass.subShader.getRenderProgramType()].draw(gl, scene, frameContext, dfbFramePicture, lights);
            // dfbFramePicture.draw(this._m_FrameContext);
            if(frameContext.getRenderState().getFlag(RenderState.S_STATES[3]) == 'On'){
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
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, frameContext._m_DefaultFrameBuffer);
            // 复制数据到默认缓存
            // 请注意，这可能会也可能不会，因为FBO和默认帧缓冲区的内部格式必须匹配。
            // 内部格式由实现定义。 这适用于我的所有系统，但是如果您的系统不适用，则可能必须在另一个着色器阶段写入深度缓冲区（或以某种方式将默认帧缓冲区的内部格式与FBO的内部格式进行匹配）。
            gl.blitFramebuffer(0, 0, scene.getCanvas().getWidth(), scene.getCanvas().getHeight(), 0, 0, scene.getCanvas().getWidth(), scene.getCanvas().getHeight(), gl.DEPTH_BUFFER_BIT, gl.NEAREST);
            // 切换回默认fb1
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameContext._m_DefaultFrameBuffer);
        }
        return useBackForwardFrameBuffer;
    }

}
