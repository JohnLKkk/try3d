import ShaderSource from "./ShaderSource.js";
import Shader from "./Shader.js";
import Tools from "../Util/Tools.js";
/**
 * ShaderProgram定义了着色器程序对象,解析shaderSource并生成指定的着色器程序对象,以便后续使用。<br/>
 * 其中shaderSource包含了vs,gs,fs等的源码，这些源码可以从外部解析读取得到，也可以通过js脚本定义得到。<br/>
 * @author Kkk
 */
export default class ShaderProgram {
    constructor(gl, defId, shaderSource, defines, delayCompile) {
        this._m_DefId = defId;
        this._m_vs_s = shaderSource.get(ShaderSource.VERTEX_SHADER);
        this._m_fs_s = shaderSource.get(ShaderSource.FRAGMENT_SHADER);
        this._m_vsDefines = defines ? defines[ShaderSource.VERTEX_SHADER] : null;
        this._m_fsDefines = defines ? defines[ShaderSource.FRAGMENT_SHADER] : null;
        this._m_Hold = 0;
        if(delayCompile){
            // this._compile();
            this._m_needCompile = true;
        }
        else{
            this._compile(gl);
        }
    }

    /**
     * 是否应该销毁。<br/>
     * @return {Boolean}
     */
    canDestroy(){
        return this._m_Hold <= 0;
    }

    /**
     * 销毁。<br/>
     * @param {WebGL}[gl]
     * @param {FrameContext}[frameContext]
     */
    destroy(gl, frameContext){
        if(this._m_Program){
            // 删除
            gl.deleteProgram(this._m_Program);
            frameContext.m_Shaders[this._m_DefId] = null;
            this._m_Program = null;
        }
    }

    /**
     * 增加一个句柄。<br/>
     */
    addHold(){
        this._m_Hold++;
    }

    /**
     * 删除一个句柄。<br/>
     */
    deleteHold(){
        this._m_Hold--;
    }

    /**
     * 是否需要编译。<br/>
     * @return {Boolean}
     */
    needCompile(){
        return this._m_needCompile;
    }

    /**
     * 编译源码。<br/>
     * @private
     */
    _compile(gl){
        this._m_needCompile = false;
        if(this._m_vs_s){
            if(this._m_vsDefines){
                // 追加宏定义
                this._m_vs_s = Tools.insertLine(this._m_vs_s, this._m_vsDefines, 1);
            }
            this._m_vs = new Shader(gl, gl.VERTEX_SHADER, this._m_vs_s);
        }
        if(this._m_fs_s){
            if(this._m_fsDefines){
                // 追加宏定义
                this._m_fs_s = Tools.insertLine(this._m_fs_s, this._m_fsDefines, 1);
            }
            this._m_fs = new Shader(gl, gl.FRAGMENT_SHADER, this._m_fs_s);
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
                    console.log("vs:\n" + this._m_vs_s);
                    console.log("fs:\n" + this._m_fs_s);
                }
                this._m_vs.deleteShader();
                this._m_fs.deleteShader();
            }
            else{
                console.error("[[" + name + "]]无法创建着色器程序,vs或fs编译失败!!");
                console.log("vs:\n" + this._m_vs_s);
                console.log("fs:\n" + this._m_fs_s);
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
