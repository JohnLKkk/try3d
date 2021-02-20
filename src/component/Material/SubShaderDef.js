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
        this._m_DefId = null;
        this._m_ShaderSource = new ShaderSource();
        // 设置该SubShaderDef来自哪个MaterialDef
        this._m_FromMaterialDef = null;
        // 变量列表
        this._m_Var_Table = [];

        // 使用的context变量
        this._m_UseContexts = [];
        // 使用的材质参数变量
        this._m_UseParams = [];
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
    addUseParams(useParams){
        useParams.forEach(param=>{
            this._m_UseParams.push(param);
        });
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
        this._m_DefId = Tools.uniqueId(materialDef.getName() + this.getName());
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
        this._m_Var_Table.push({type, name, pattern:eval("/" + name + "/")});
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
