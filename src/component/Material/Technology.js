import RenderState from "../WebGL/RenderState.js";

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
     * @param {RenderState}[renderStte]
     */
    addSubShader(renderPath, subShader, renderState){
        if(!this._m_SubShaders[renderPath]){
            this._m_SubShaders[renderPath] = [];
        }
        let rState = null;
        if(renderState){
            for(let k in renderState){
                if(!rState){
                    rState = new RenderState();
                }
                rState.setFlag(k, renderState[k]);
            }
        }
        this._m_SubShaders[renderPath].push({subShader, renderState:rState});
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
