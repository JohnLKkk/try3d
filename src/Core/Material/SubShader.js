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
        this._m_Def = subShaderDef;
        // 根据shader本身创建编码id
        // 以便所有同种类型的shader只被切换使用一次
        this._m_DefId = subShaderDef.getDefId();
        this._m_Name = subShaderDef.getName();
        // 当前该SubShader使用的所有参数(包含params和contextVars以及renderDatas)
        this._m_MatParams = {};
        // 渲染材质参数
        // 可定义参数
        this._m_CanDefineParams = {};
        // 已定义参数
        this._m_AleadyDefinedParams = {};
        // 参数列表
        this._m_Params = {};
        // 参数值列表
        this._m_ParamValues = {};
        // 宏定义列表
        this._m_Defines = {};
        // 上下文变量
        // name:varName,loc:glLoc,fun:glFunc
        // 这里有一个优化是根据不同类型上下文变量提前分为不同的列表保存
        // 比如geometry的上下文变量(在geometry中提交modelMatrix和骨骼变换之类的变量)
        // 比如光照的上下文变量(在renderProgram中提交对应变量)
        this._m_ContextVars = {};
        // 保存特殊纹理数据
        this._m_RenderDatas = {};
        // 该pass使用的frameBuffer(默认为null)
        // 当前subShader使用的FrameBuffer,为null使用默认的frameBuffer
        this._m_FBId = subShaderDef.getFBId();
        // 当前subShader引用的fb(renderDatas数据可能来自多个不同的fb)
        this._m_RefRenderDataFBs = null;
        // 渲染程序类型
        this._m_RenderProgramType = subShaderDef.getRenderProgramType();

        // 创建shader
        if(!frameContext.m_Shaders[this._m_DefId]){
            this._m_ShaderProgram = new ShaderProgram(gl, subShaderDef.getName(), subShaderDef.getShaderSource());
            frameContext.m_Shaders[this._m_DefId] = this._m_ShaderProgram;
        }
        else{
            this._m_ShaderProgram = frameContext.m_Shaders[this._m_DefId];
        }
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
                    this._m_CanDefineParams[param.getName()] = "#defined " + param.getDefType();
                    this._m_Params[param.getName()] = true;
                    this._m_MatParams[param.getName()] = {type:param.getType(), loc, fun};
                }
            });
        }
        if(useContexts && useContexts.length > 0){
            let texId = 0;
            useContexts.forEach(context=>{
                // 过滤掉layout in和layout out(即包含loc的变量)
                if(!context.loc){
                    let loc = gl.getUniformLocation(this._m_ShaderProgram.getProgram(), context.src);
                    if(loc){
                        let fun = null;
                        switch (context.type) {
                            case "mat4":
                                fun = 'uniformMatrix4fv';
                                break;
                            case "sampler2D":
                                // 2D纹理
                                gl.uniform1i(loc, texId);
                                // 使用texId作为loc
                                fun = null;
                                loc = texId++;
                                // 对于subShader,有两种类别sampler2D
                                // 一种是普通sampler2D,其数据来自MatValue(即用户的纹理输入)
                                // 另一种是frameBuffer的缓冲区(包括Context.Inxxx之类的纹理,以及自定义Globals_FrameBuffer.Inxxx之类的纹理)
                                // 对于第二种情况,存在一个标识context.flag='renderData'
                                if(context.flag == 'renderData'){
                                    // 添加到frameBuffer.textures
                                    // refId表示当前subShader的纹理数据来自哪个frameBuffer
                                    // dataId表示当前subShader的纹理数据来自frameBuffer的哪个texture
                                    // 对于Global_Textures,也做同样的处理逻辑
                                    this._m_RenderDatas[context.src] = {type:context.type, loc, fun, refId:ShaderSource.Context_RenderDataRefFBs[context.src], dataId:context.src};
                                }
                                break;
                        }
                        this._m_ContextVars[context.src] = {type:context.type, loc, fun};
                        this._m_MatParams[context.src] = {type:context.type, loc, fun};
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
        if(frameContext.m_LastSubShader){
            frameContext.m_LastSubShader.use(gl);
        }
    }

    /**
     * 返回渲染程序类型。<br/>
     * null表示使用默认渲染程序。<br/>
     * @return {null}
     */
    getRenderProgramType(){
        return this._m_RenderProgramType;
    }

    /**
     * 返回当前SubShader名称。<br/>
     * @return {*|String}
     */
    getName(){
        return this._m_Name;
    }

    /**
     * 返回当前SubShader定义Id。<br/>
     * 只有完全一致的着色源码定义，材质同一种类型的SubShader。<br/>
     * 一旦存在不同宏定义导致源码不一致，则也是不同DefId。<br/>
     * 但目前仅用MaterDef+SubShaderName计算该DefId，所以需要后续完善。<br/>
     * @return {Number}
     */
    getDefId(){
        return this._m_DefId;
    }

    /**
     * 设置使用的fbid。<br/>
     * @param {String}[fbId]
     */
    setFBId(fbId){
        this._m_FBId = fbId;
    }

    /**
     * 返回指定的fbid。<br/>
     * @return {String}
     */
    getFBId(){
        return this._m_FBId;
    }

    /**
     * 使用该SubShader。<br/>
     * @param {GL}
     */
    use(gl){
        this._m_ShaderProgram.use(gl);
    }
    getContextVars(){
        return this._m_ContextVars;
    }

    getRenderDatas(){
        return this._m_RenderDatas;
    }
    getRefRenderDataFBs(){
        return this._m_RefRenderDataFBs;
    }

    /**
     * 添加参数定义。<br/>
     * @param {String}[param 参数名]
     */
    addDefine(param){
        if(!this._m_AleadyDefinedParams[param]){
            if(this._m_CanDefineParams[param]){
                if(!this._m_Defines){
                    this._m_Defines = {};
                }
                // 定义参数
                let shaderParams = this._m_Def.getShaderParams();
                if(shaderParams[ShaderSource.VERTEX_SHADER][param]){
                    // 加入顶点着色器
                    if(!this._m_Defines[ShaderSource.VERTEX_SHADER]){
                        this._m_Defines[ShaderSource.VERTEX_SHADER] = "";
                    }
                    this._m_Defines[ShaderSource.VERTEX_SHADER] += this._m_CanDefineParams[param] + "\n";
                }
                else if(shaderParams[ShaderSource.FRAGMENT_SHADER][param]){
                    // 加入片段着色器
                    if(!this._m_Defines[ShaderSource.FRAGMENT_SHADER]){
                        this._m_Defines[ShaderSource.FRAGMENT_SHADER] = "";
                    }
                    this._m_Defines[ShaderSource.FRAGMENT_SHADER] += this._m_CanDefineParams[param] + "\n";
                }
            }
        }
    }

    /**
     * 重新构建SubShader。<br/>
     * @param {FrameContext}[frameContext]
     */
    rebuild(frameContext){
        if(this._m_Defines){
            let key = '';
            if(this._m_Defines[ShaderSource.VERTEX_SHADER]){
                key += this._m_Defines[ShaderSource.VERTEX_SHADER];
            }
            if(this._m_Defines[ShaderSource.FRAGMENT_SHADER]){
                key += this._m_Defines[ShaderSource.FRAGMENT_SHADER];
            }
            // 重新计算DefId
            this._m_DefId = this._m_Def.computeSignatureDefId(key);
            // 重新编译shader
            this._m_ShaderProgram = new ShaderProgram(gl, this._m_Def.getName(), this._m_Def.getShaderSource(), this._m_Defines);
            frameContext.m_Shaders[this._m_DefId] = this._m_ShaderProgram;
            // 清空
            this._m_Defines = null;
        }
    }

}
