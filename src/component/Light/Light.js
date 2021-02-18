/**
 * 灯光组件,所有灯光节点继承该组件。<br/>
 * @author Kkk
 */
import Node from "../Node/Node.js";
import Vector4 from "../Math3d/Vector4.js";

export default class Light extends Node{
    getType() {
        return 'Light';
    }
    getTypeId(){
        return -1;
    }

    constructor(owner, cfg) {
        super(owner, cfg);
        // 灯光可以附加在任何节点中
        this._m_Color = new Vector4();
    }

    /**
     * 设置颜色。<br/>
     * @param {Vector4}[color]
     */
    setColor(color){
        this._m_Color.setTo(color);
    }

    /**
     * 返回颜色。<br/>
     * @return {Vector4}
     */
    getColor(){
        return this._m_Color;
    }

    /**
     * 设置颜色rgba。<br/>
     * @param {Number}[r 介于0-1]
     * @param {Number}[g 介于0-1]
     * @param {Number}[b 介于0-1]
     * @param {Number}[a 介于0-1]
     */
    setColorRGBA(r, g, b, a){
        this._m_Color.setToInXYZW(r, g, b, a);
    }

}
