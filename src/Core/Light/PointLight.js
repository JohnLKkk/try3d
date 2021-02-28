import Light from "./Light.js";
import Vector3 from "../Math3d/Vector3.js";

/**
 * 点光源。<br/>
 * 通过指定点光源位置和半径可以实现范围光照。<br/>
 * @author Kkk
 * @date 2021年2月17日14点37分
 */
export default class PointLight extends Light{
    getType() {
        return 'PointLight';
    }
    getTypeId() {
        return 1;
    }

    constructor(owner, cfg) {
        super(owner, cfg);
        // 位置
        this._m_Position = new Vector3();
        // 灯光半径
        this._m_Radius = -1;
        // 半径倒数(加速计算)
        this._m_InvRadius = 1.0 / this._m_Radius;
    }

    /**
     * 设置灯光位置。<br/>
     * @param {Vector3}[pos]
     */
    setPosition(pos){
        this._m_Position.setTo(pos);
    }

    /**
     * 返回灯光位置。<br/>
     * @return {Vector3}
     */
    getPosition(){
        return this._m_Position;
    }

    /**
     * 设置灯光位置。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     */
    setPositionXYZ(x, y, z){
        this._m_Position.setToInXYZ(x, y, z);
    }

    /**
     * 设置灯光半径。<br/>
     * -1表示无限远。<br/>
     * @param {Number}[radius 默认为-1]
     */
    setRadius(radius){
        this._m_Radius = radius;
        this._m_InvRadius = 1.0 / radius;
    }

    /**
     * 返回当前点光源半径。<br/>
     * @return {Number}[默认为-1]
     */
    getRadius(){
        return this._m_Radius;
    }

    /**
     * 返回半径倒数。<br/>
     * @return {number|*}
     */
    getInRadius(){
        return this._m_InvRadius;
    }

}
