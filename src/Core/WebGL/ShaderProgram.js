import ShaderSource from "./ShaderSource.js";
import Shader from "./Shader.js";
import Tools from "../Util/Tools.js";
/**
 * ShaderProgram定义了着色器程序对象,解析shaderSource并生成指定的着色器程序对象,以便后续使用。<br/>
 * 其中shaderSource包含了vs,gs,fs等的源码，这些源码可以从外部解析读取得到，也可以通过js脚本定义得到。<br/>
 * @author Kkk
 */
export default class ShaderProgram {
    constructor(gl, name, shaderSource, defines) {
        let source = null;
        if(shaderSource.get(ShaderSource.VERTEX_SHADER)){
            source = shaderSource.get(ShaderSource.VERTEX_SHADER);
            let vsDefines = defines ? defines[ShaderSource.VERTEX_SHADER] : null;
            if(vsDefines){
                // 追加宏定义
                source = Tools.insertLine(source, vsDefines, 1);
            }
            this._m_vs = new Shader(gl, gl.VERTEX_SHADER, source);
        }
        if(shaderSource.get(ShaderSource.FRAGMENT_SHADER)){
            source = shaderSource.get(ShaderSource.FRAGMENT_SHADER);
            let fsDefines = defines ? defines[ShaderSource.FRAGMENT_SHADER] : null;
            if(fsDefines){
                // 追加宏定义
                source = Tools.insertLine(source, fsDefines, 1);
            }
            this._m_fs = new Shader(gl, gl.FRAGMENT_SHADER, source);
        }
        this._m_Program = null;
        if(this._m_vs && this._m_fs){
            if(this._m_vs.compile && this._m_fs.compile){
                this._m_Program = gl.createProgram();
                gl.attachShader(this._m_Program, this._m_vs.getShader());
                gl.attachShader(this._m_Program, this._m_fs.getShader());
                gl.linkProgram(this._m_Program);
                let linkStatus = gl.getProgramParameter(this._m_Program, gl.LINK_STATUS);
                if(!linkStatus){
                    let pil = gl.getProgramInfoLog(this._m_Program);
                    console.error("[[" + name + "]]链接ShaderProgram异常:" + pil);
                    console.log("vs:\n" + shaderSource.get(ShaderSource.VERTEX_SHADER));
                    console.log("fs:\n" + shaderSource.get(ShaderSource.FRAGMENT_SHADER));
                }
                this._m_vs.deleteShader();
                this._m_fs.deleteShader();
            }
            else{
                console.error("[[" + name + "]]无法创建着色器程序,vs或fs编译失败!!");
                console.log("vs:\n" + shaderSource.get(ShaderSource.VERTEX_SHADER));
                console.log("fs:\n" + shaderSource.get(ShaderSource.FRAGMENT_SHADER));
            }
        }
    }
    use(gl){
        gl.useProgram(this._m_Program);
    }
    getProgram(){
        return this._m_Program;
    }

}
