import Base from "./Base.js";
import Render from "../Render.js";

/**
 * Forward Pipeline。<br/>
 * @author Kkk
 * @update 2021年9月7日20点26分
 */
export default class Forward extends Base{
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
        frameContext.getRenderState().store();

        if(cfg.opaque){
            for(let matId in cfg.bucket){
                stateChange = false;
                // 获取当前选中的技术
                let mat = scene.getComponent(matId);
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
                            stateChange = this._m_Render._checkRenderState(gl, subShaders[subShader].renderState, frameContext.getRenderState());
                        }
                        // 指定subShader
                        mat._selectSubShader(subShaders[subShader].subShader);
                        this._m_Render._useForceContextValue();
                        this._m_Render._m_RenderPrograms[subShaders[subShader].subShader.getRenderProgramType()].drawArrays(gl, scene, frameContext, cfg.bucket[matId], lights);
                    }
                }
                if(stateChange){
                    this._m_Render._checkRenderState(gl, frameContext.getRenderState().restore(), frameContext.getRenderState());
                }
            }
        }


        // 由于半透明按照次序相关渲染，所以无法使用mat合并
        else if(cfg.translucent){
            cfg.bucket.forEach(geo=>{
                stateChange = false;
                let mat = geo.getMaterial();
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
                            stateChange = this._m_Render._checkRenderState(gl, subShaders[subShader].renderState, frameContext.getRenderState());
                        }
                        // 指定subShader
                        mat._selectSubShader(subShaders[subShader].subShader);
                        this._m_Render._useForceContextValue();
                        this._m_Render._m_RenderPrograms[subShaders[subShader].subShader.getRenderProgramType()].draw(gl, scene, frameContext, geo, lights);
                        // geo.draw(this._m_FrameContext);
                    }
                }
                if(stateChange){
                    this._m_Render._checkRenderState(gl, frameContext.getRenderState().restore(), frameContext.getRenderState());
                }
            });
        }
    }

}
