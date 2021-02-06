export default class Technology {
    constructor(name) {
        this._m_Name = name;
        // 根据渲染路径分类
        // key:renderPath,value:SubShader
        this._m_SubShaders = {};
    }
    setName(name){
        this._m_Name = name;
    }

    /**
     * 添加一个SubShader。<br/>
     * @param {String}[renderPath 渲染路径]
     * @param {SubShader}[subShader ]
     */
    addSubShader(renderPath, subShader){
        if(!this._m_SubShaders[renderPath]){
            this._m_SubShaders[renderPath] = [];
        }
        this._m_SubShaders[renderPath].push(subShader);
    }

    /**
     * 返回指定渲染路径的subShader。<br/>
     * @param {String}[renderPath 渲染路径]
     * @returns {SubShader[]}
     */
    getSubShaders(renderPath){
        return this._m_SubShaders[renderPath];
    }

}
