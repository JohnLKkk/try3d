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
        this._m_Enable = true;
        this._m_Scene.enableLight(this);
    }

    /**
     * 激活该灯光。<br/>
     */
    enable(){
        if(this._m_Enable)return;
        this._m_Enable = true;
        this._m_Scene.enableLight(this);
    }

    /**
     * 禁用该灯光。<br/>
     */
    disable(){
        if(this._m_Enable){
            this._m_Enable = false;
            this._m_Scene.disableLight(this);
        }
    }

    /**
     * 判断该灯是否激活。<br/>
     * @return {Boolean}
     */
    isEnable(){
        return this._m_Enable;
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
