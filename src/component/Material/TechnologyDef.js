export default class TechnologyDef {
    constructor(name) {
        this.m_Name = name;
        // key:renderPath, value:SubShaderDef[]
        this.m_SubPass = {};
        // 设置该SubShaderDef来自哪个MaterialDef
        this._m_FromMaterialDef = null;
    }
    getName(){
        return this.m_Name;
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
     * 添加一个subShaderDef
     * @param {String}[path 渲染路径]
     * @param {SubShaderDef}[subShaderDef]
     */
    addSubPass(path, subShaderDef){
        if(!this.m_SubPass[path]){
            this.m_SubPass[path] = [];
        }
        this.m_SubPass[path].push(subShaderDef);
    }

    /**
     * 返回SubPass。<br/>
     * @returns {SubShaderDef[]}
     */
    getSubPass(){
        return this.m_SubPass;
    }

}
