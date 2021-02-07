import ShaderSource from "../WebGL/ShaderSource.js";

/**
 * SubShader,被Technology包含,一个Technology包含多个SubShader,用于实现高级着色中的多pass。<br/>
 * 一个SubShader就是一个具体的GLSL着色器程序。<br/>
 * @author Kkk
 * @date 2021年2月5日18点14分
 */
export default class SubShaderDef {
    constructor(name) {
        this._m_Name = name;
        this._m_ShaderSource = new ShaderSource();
        // 设置该SubShaderDef来自哪个MaterialDef
        this._m_FromMaterialDef = null;
        // 变量列表
        this._m_Var_Table = [];
    }

    /**
     * 设置该SubShaderDef来自哪个MaterialDef。<br/>
     * @param {MaterialDef}[materialDef]
     */
    setFromMaterialDef(materialDef){
        this._m_FromMaterialDef = materialDef;
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
