import Render from "../Render.js";
import RenderState from "../../WebGL/RenderState.js";
import Deferred from "./Deferred.js";

/**
 * Tile Based Deferred。<br/>
 * @author Kkk
 * @date 2021年9月7日20点45分
 */
export default class TileDeferred extends Deferred{
    static S_TILE_DEFERRED_SHADING_G_BUFFER_PASS = "GBufferPass";
    static S_TILE_DEFERRED_SHADING_GLOBAL_PASS = "GlobalPass";
    static S_TILE_DEFERRED_SHADING_TILE_PASS = "TilePass";
    static S_TILE_DEFERRED_SHADING_PASS_GROUP = [TileDeferred.S_TILE_DEFERRED_SHADING_G_BUFFER_PASS, TileDeferred.S_TILE_DEFERRED_SHADING_GLOBAL_PASS, TileDeferred.S_TILE_DEFERRED_SHADING_TILE_PASS];
    static S_TILE_DEFERRED_SHADING_PASS_GROUP_2 = [0, 1, 2];
    constructor(props) {
        super(props);
        this._init();
    }
    _init(){

    }
    render(cfg) {
        let frameContext = cfg.frameContext;
        let gl = cfg.gl;
        let scene = cfg.scene;
        let lights = cfg.lights;
        let stateChange = false;
        let subShaders = null;
        let renderInDeferredShading = false;
        let globalPass = null;
        let tilePass = null;
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
                let deferredShadingSubPasss = currentTechnology.getSubPasss(Render.TILE_DEFERRED_SHADING);
                // 如果该物体存在DeferredShading路径渲染的需要,则执行DeferredShading渲染
                if(deferredShadingSubPasss){
                    subShaders = deferredShadingSubPasss.getSubShaderMaps();
                    // 获取GBuffPass
                    // 检测是否需要切换FrameBuffer
                    subShader = TileDeferred.S_TILE_DEFERRED_SHADING_PASS_GROUP[0];
                    if(subShaders[subShader] == null){
                        subShader = TileDeferred.S_TILE_DEFERRED_SHADING_PASS_GROUP_2[0];
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
                    // globalPass
                    subShader = TileDeferred.S_TILE_DEFERRED_SHADING_PASS_GROUP[1];
                    globalPass = subShaders[subShader] ? subShaders[subShader] : subShaders[TileDeferred.S_TILE_DEFERRED_SHADING_PASS_GROUP_2[1]];
                    // tilePass
                    subShader = TileDeferred.S_TILE_DEFERRED_SHADING_PASS_GROUP[2];
                    tilePass = subShaders[subShader] ? subShaders[subShader] : subShaders[TileDeferred.S_TILE_DEFERRED_SHADING_PASS_GROUP_2[2]];
                }
                if(stateChange){
                    this._checkRenderState(gl, frameContext.restore(), frameContext.getRenderState());
                }
            });
        }
        if(renderInDeferredShading && globalPass && tilePass){
            useBackForwardFrameBuffer = true;
            let dfb = frameContext.m_LastFrameBuffer;
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameContext._m_DefaultFrameBuffer);
            frameContext.m_LastFrameBuffer = frameContext._m_DefaultFrameBuffer;
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            // 关闭深度测试然后进行渲染dfbFramePicture(因为渲染的是一个Picture,深度永远最小,如果不关闭,则后续的前向渲染所有物体都无法通过测试)
            // draw call
            if(frameContext.getRenderState().getFlag(RenderState.S_STATES[3]) == 'On'){
                gl.disable(gl.DEPTH_TEST);
                // gl.depthMask(false);
            }

            // 首先将dir light部分取出来
            let dirLights = [];
            let otherLights = [];
            let type = null;
            lights.forEach(light=>{
                type = light.getType();
                if(type == 'DirectionalLight'){
                    dirLights.push(light);
                }
                else if(type == 'PointLight' || type == 'SpotLight'){
                    otherLights.push(light);
                }
            });

            // Global Pass
            // 1.先检测是否需要切换subShader(根据shader种类)(这里检测可能与理论不一样，打印出id来调试...)
            if(frameContext.m_LastSubShaderId != globalPass.subShader.getDefId()){
                // 此时可能未编译,所以需要检测
                // 检测是否需要重新编译subShader
                if(globalPass.subShader.needCompile()){
                    globalPass.subShader._compile(gl, frameContext);
                }
                globalPass.subShader.use(gl);
                frameContext.m_LastSubShaderId = globalPass.subShader.getDefId();
            }
            // 2.检测是否需要更新参数到subShader中(同种类型subShaderId,但存在不同具体实力化subShader对象,所以参数不同需要更新)
            if(frameContext.m_LastSubShader != globalPass.subShader){
                frameContext.m_LastSubShader = globalPass.subShader;
            }

            // 检测是否需要更新渲染状态
            if(globalPass.renderState){
                // 依次检测所有项
                this._m_Render._checkRenderState(gl, globalPass.renderState, frameContext.getRenderState());
            }

            let dfbFramePicture = dfb.getFramePicture();
            let renderDatas = globalPass.subShader.getRenderDatas();
            for(let k in renderDatas){
                gl.activeTexture(gl.TEXTURE0 + renderDatas[k].loc);
                gl.bindTexture(gl.TEXTURE_2D, frameContext.getFrameBuffer(renderDatas[k].refId).getTexture(renderDatas[k].dataId).getLoc());
            }

            this._m_Render._m_RenderPrograms[globalPass.subShader.getRenderProgramType()].draw(gl, scene, frameContext, dfbFramePicture, dirLights, 0);


            // Tile Pass
            // 1.先检测是否需要切换subShader(根据shader种类)(这里检测可能与理论不一样，打印出id来调试...)
            if(frameContext.m_LastSubShaderId != tilePass.subShader.getDefId()){
                // 此时可能未编译,所以需要检测
                // 检测是否需要重新编译subShader
                if(tilePass.subShader.needCompile()){
                    tilePass.subShader._compile(gl, frameContext);
                }
                tilePass.subShader.use(gl);
                frameContext.m_LastSubShaderId = tilePass.subShader.getDefId();
            }
            // 2.检测是否需要更新参数到subShader中(同种类型subShaderId,但存在不同具体实力化subShader对象,所以参数不同需要更新)
            if(frameContext.m_LastSubShader != tilePass.subShader){
                frameContext.m_LastSubShader = tilePass.subShader;
            }

            // 检测是否需要更新渲染状态
            if(tilePass.renderState){
                // 依次检测所有项
                this._m_Render._checkRenderState(gl, tilePass.renderState, frameContext.getRenderState());
            }

            for(let k in renderDatas){
                gl.activeTexture(gl.TEXTURE0 + renderDatas[k].loc);
                gl.bindTexture(gl.TEXTURE_2D, frameContext.getFrameBuffer(renderDatas[k].refId).getTexture(renderDatas[k].dataId).getLoc());
            }

            this._m_Render._m_RenderPrograms[tilePass.subShader.getRenderProgramType()].draw(gl, scene, frameContext, dfbFramePicture, otherLights, 1);
            // dfbFramePicture.draw(this._m_FrameContext);
            if(frameContext.getRenderState().getFlag(RenderState.S_STATES[3]) == 'On'){
                gl.enable(gl.DEPTH_TEST);
                // gl.depthMask(true);
            }

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
