import RenderState from "../WebGL/RenderState.js";
import SubPass from "./SubPass.js";

export default class Technology {
    constructor(name) {
        this._m_Name = name;
        // 根据渲染路径分类
        // key:renderPath,value:SubPass
        this._m_SubPasss = {};
    }
    setName(name){
        this._m_Name = name;
    }

    /**
     * 添加一个SubShader到指定的SubPass。<br/>
     * @param {String}[renderPath 渲染路径]
     * @param {SubShader}[subShader ]
     * @param {RenderState}[renderStte]
     */
    addSubPass(renderPath, subShader, renderState){
        if(!this._m_SubPasss[renderPath]){
            this._m_SubPasss[renderPath] = new SubPass(renderPath);
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
        this._m_SubPasss[renderPath].addSubShader({subShader, renderState:rState});
    }

    /**
     * 返回指定渲染路径的subPass。<br/>
     * @param {String}[renderPath 渲染路径]
     * @returns {SubPass}
     */
    getSubPasss(renderPath){
        return this._m_SubPasss[renderPath];
    }

    /**
     * 返回渲染阶段列表数据。<br/>
     * @return {SubPass[]}
     */
    getSubPassList(){
        return this._m_SubPasss;
    }

}
