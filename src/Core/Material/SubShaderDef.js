import ShaderSource from "../WebGL/ShaderSource.js";
import Tools from "../Util/Tools.js";

/**
 * SubShader,被Technology包含,一个Technology包含多个SubShader,用于实现高级着色中的多pass。<br/>
 * 一个SubShader就是一个具体的GLSL着色器程序。<br/>
 * @author Kkk
 * @date 2021年2月5日18点14分
 */
export default class SubShaderDef {
    constructor(name) {
        this._m_Name = name;
        // 用于判断是否属于同一类别shaderDef
        // 使用_m_Signature生成的定义id
        this._m_DefId = null;
        // 签名(每个subShader都是唯一签名的)
        this._m_Signature = null;
        this._m_ShaderSource = new ShaderSource();
        // 设置该SubShaderDef来自哪个MaterialDef
        this._m_FromMaterialDef = null;
        // 变量列表
        this._m_Var_Table = [];

        // 使用的context变量
        this._m_UseContexts = [];
        // 使用的材质参数变量
        this._m_UseParams = [];
        // 着色器使用的参数变量
        this._m_ShaderParams = {};
        // 着色器使用的上下文宏定义
        this._m_ShaderContextDefines = {};
        // 使用的块定义
        this._m_UseBlocks = [];
        // 该subShader使用的fb,null表示使用默认
        this._m_FBId = null;
        // 当前subShader使用的特殊
        this._m_RefFBs = null;
        // 设置指定的渲染程序类型(默认为null)
        this._m_RenderProgramType = null;


    }

    /**
     * 设置渲染程序类型。<br/>
     * @param {renderProgramType}[String]
     */
    setRenderProgramType(renderProgramType){
        this._m_RenderProgramType = renderProgramType;
    }

    /**
     * 返回渲染程序类型。<br/>
     * @return {null}
     */
    getRenderProgramType(){
        return this._m_RenderProgramType;
    }

    /**
     * 设置使用的fb。<br/>
     * @param {String}[fbId]
     */
    setFBId(fbId){
        this._m_FBId = fbId;
    }

    /**
     * 返回使用的fb。<br/>
     * @return {String}
     */
    getFBId(){
        return this._m_FBId;
    }

    /**
     * 计算定义id。<br/>
     * @param {String}[key 可选的密钥]
     */
    computeSignatureDefId(key){
        if(key){
            // 排序key
            let arr = key.split(',');
            let newArr = arr.sort(function(a,b){return a.localeCompare(b)});
            key = '';
            newArr.forEach(k=>{
                key += k + ',';
            });
            key = key.substr(0, key.length - 1);
            // this._m_DefId = Tools.uniqueId(this._m_Signature + key);
            return Tools.uniqueId(this._m_Signature + key);
            // console.log("key:" + key + ";defId:" + this._m_DefId);
        }
        else{
            this._m_DefId = Tools.uniqueId(this._m_Signature);
        }
        return this._m_DefId;
    }

    /**
     * 返回定义Id。<br/>
     * @return {String}
     */
    getDefId(){
        return this._m_DefId;
    }
    addUseContexts(useContexts){
        useContexts.forEach(context=>{
            this._m_UseContexts.push(context);
        });
    }
    getUseContexts(){
        return this._m_UseContexts;
    }
    addUseParams(shaderType, useParams){
        useParams.forEach(param=>{
            this._m_UseParams.push(param);
            if(shaderType == ShaderSource.VERTEX_SHADER){
                if(!this._m_ShaderParams[ShaderSource.VERTEX_SHADER]){
                    this._m_ShaderParams[ShaderSource.VERTEX_SHADER] = {};
                }
                this._m_ShaderParams[ShaderSource.VERTEX_SHADER][param.getName()] = true;
            }
            else if(shaderType == ShaderSource.FRAGMENT_SHADER){
                if(!this._m_ShaderParams[ShaderSource.FRAGMENT_SHADER]){
                    this._m_ShaderParams[ShaderSource.FRAGMENT_SHADER] = {};
                }
                this._m_ShaderParams[ShaderSource.FRAGMENT_SHADER][param.getName()] = true;
            }
        });
    }
    addContextDefine(shaderType, define){
        if(!this._m_ShaderContextDefines[shaderType]){
            this._m_ShaderContextDefines[shaderType] = {};
        }
        this._m_ShaderContextDefines[shaderType][define] = true;
    }
    getShaderParams(){
        return this._m_ShaderParams;
    }
    getShaderContextDefines(){
        return this._m_ShaderContextDefines;
    }
    getUseParams(){
        return this._m_UseParams;
    }
    addUseBlocks(useBlocks){
        useBlocks.forEach(block=>{
            this._m_UseBlocks.push(block);
        });
    }
    getUseBlocks(){
        return this._m_UseBlocks;
    }

    /**
     * 设置该SubShaderDef来自哪个MaterialDef。<br/>
     * @param {MaterialDef}[materialDef]
     */
    setFromMaterialDef(materialDef){
        this._m_FromMaterialDef = materialDef;

        // 计算shaderId
        this._m_Signature = materialDef.getName() + this.getName();
        this.computeSignatureDefId();
    }

    /**
     * 返回当前所属得MaterialDef。<br/>
     * @returns {MaterialDef}[materialDef]
     */
    getFromMaterialDef(){
        return this._m_FromMaterialDef;
    }

    /**
     * 返回SubShaderDef的名称。<br/>
     * @returns {String}
     */
    getName(){
        return this._m_Name;
    }

    /**
     * 添加一个变量。<br/>
     * @param {String}[type 变量类型]
     * @param {String}[name 变量名称]
     */
    addVar(type, name){
        this._m_Var_Table.push({type, name, pattern:eval("/" + name + "/"), pattern2:eval("/" + name + "[\\s+-;.,\\*\\\\]{1,}/")});
    }

    /**
     * 返回变量列表。<br/>
     * @return {{}|*}
     */
    getVarTable(){
        return this._m_Var_Table;
    }
    addShaderSource(type, shader){
        this._m_ShaderSource.set(type, shader);
    }
    /**
     * 返回材质定义的着色器源码。<br/>
     * @returns {Object}[ShaderSource]
     */
    getShaderSource(){
        return this._m_ShaderSource;
    }

}
