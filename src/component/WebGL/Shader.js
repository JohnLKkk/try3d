/**
 * 着色器对象通过解析vs和fs生成webGL shader对象,并保留句柄，以便后续使用。<br/>
 * @author Kkk
 */
export default class Shader {

    constructor(gl, type, soucre) {
        this._m_GL = gl;
        this._m_Shader = gl.createShader(type);
        gl.shaderSource(this._m_Shader, soucre);
        gl.compileShader(this._m_Shader);
        this.compile = gl.getShaderParameter(this._m_Shader, gl.COMPILE_STATUS);
        if(!this.compile){
            this.error = gl.getShaderInfoLog(this._m_Shader);
            console.log("编译[" + (type == gl.VERTEX_SHADER ? 'vertex_shader' : type == gl.FRAGMENT_SHADER ? 'fragment_shader' : 'unknow_shader') + "]失败!原因:\n" + this.error);
        }
    }
    getShader(){
        return this._m_Shader;
    }
    deleteShader(){
        let gl = this._m_GL;
        gl.deleteShader(this._m_Shader);
        this._m_Shader = null;
    }

}