import ShaderSource from "../WebGL/ShaderSource.js";
import ShaderProgram from "../WebGL/ShaderProgram.js";

/**
 * SubShader,被Technology包含,一个Technology包含多个SubShader,用于实现高级着色中的多pass。<br/>
 * 一个SubShader就是一个具体的GLSL着色器程序。<br/>
 * @author Kkk
 * @date 2021年2月5日18点14分
 */
export default class SubShader {
    constructor(gl, frameContext, subShaderDef) {
        this._m_Name = subShaderDef.getName();
        // 材质参数
        this._m_Params = {};
        // 上下文变量
        // name:varName,loc:glLoc,fun:glFunc
        this.m_ContextVars = {};

        // 创建shader
        this._m_ShaderProgram = new ShaderProgram(gl, subShaderDef.getShaderSource());
        this.use(gl);
        // 获取program变量信息
        let useParams = subShaderDef.getUseParams();
        let useContexts = subShaderDef.getUseContexts();
        if(useParams && useParams.length > 0){
            // 解析材质参数
            useParams.forEach(param=>{
                let loc = gl.getUniformLocation(this._m_ShaderProgram.getProgram(), param.getName());
                if(loc){
                    let fun = null;
                    switch (param.getType()) {
                        case "vec4":
                            fun = 'uniform4f';
                            break;
                    }
                    this._m_Params[param.getName()] = {loc, fun};
                }
            });
        }
        if(useContexts && useContexts.length > 0){
            useContexts.forEach(context=>{
                if(!context.loc){
                    let loc = gl.getUniformLocation(this._m_ShaderProgram.getProgram(), context.src);
                    if(loc){
                        let fun = null;
                        switch (context.type) {
                            case "mat4":
                                fun = 'uniformMatrix4fv';
                                break;
                        }
                        this.m_ContextVars[context.src] = {loc, fun};
                    }
                    frameContext.addContext(context.src);
                }
            });
        }
        // BLOCKS
        let useBlocks = subShaderDef.getUseBlocks();
        if(useBlocks && useBlocks.length > 0){
            useBlocks.forEach(block=>{
                gl.uniformBlockBinding(this._m_ShaderProgram.getProgram(), gl.getUniformBlockIndex(this._m_ShaderProgram.getProgram(), block), ShaderSource.BLOCKS[block].blockIndex);
            });
        }
        // let ubi = gl.getUniformBlockIndex(this._m_ShaderProgram.getProgram(), "VP");
        // gl.uniformBlockBinding(this._m_ShaderProgram.getProgram(), ubi, 0x001);
        gl.useProgram(null);
    }

    /**
     * 使用该SubShader。<br/>
     * @param {GL}
     */
    use(gl){
        this._m_ShaderProgram.use(gl);
    }
    getContextVars(){
        return this.m_ContextVars;
    }

}
