import Component from "../Component.js";
import MaterialSource from "./MaterialSource.js";
import ShaderProgram from "../WebGL/ShaderProgram.js";

/**
 * 材质定义，材质定义定义了相关物体渲染时的着色材质属性，通过MaterialShaderSource完成对材质的实现。<br/>
 * @author Kkk
 */
export default class Material extends Component{
    getType(){
        return "Material";
    }
    constructor(owner, cfg) {
        super(owner, cfg);
        // 根据当前材质类型获取对应的着色器源码定义，并生成对应的着色器程序
        this._m_MaterialSource = new MaterialSource(cfg.materialSourceDef);
        // 根据materialShaderSource,创建着色器程序,然后根据材质定义,获取着色器变量
        this._m_ShaderProgram = new ShaderProgram(this._m_Scene.getCanvas().getGLContext(), this._m_MaterialSource.getShaderSource());
        // 变量参数
        this._m_SystemParams = {};
        this._m_Params = {};
        this._init();
    }
    use(){
        let gl = this._m_Scene.getCanvas().getGLContext();
        this._m_ShaderProgram.use(gl);
        if(this._m_SystemParams){
            // 更新系统参数
        }
        if(this._m_Params){
            // 更新参数
            for(let key in this._m_Params){
            }
        }
    }
    _init(){
        let gl = this._m_Scene.getCanvas().getGLContext();
        this.use();
        let mI = gl.getUniformLocation(this._m_ShaderProgram.getProgram(), "modelMatrix");
        gl.uniformMatrix4fv(mI, false, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
        let ubi = gl.getUniformBlockIndex(this._m_ShaderProgram.getProgram(), "VP");
        gl.uniformBlockBinding(this._m_ShaderProgram.getProgram(), ubi, 0x001);
        gl.useProgram(null);
    }

}