import Light from "./Light.js";
import Vector3 from "../Math3d/Vector3.js";
import BoundingSphere from "../Math3d/Bounding/BoundingSphere.js";
import PointLightShadowProcess from "../Shadow/PointLightShadowProcess.js";

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
        // 光源裁剪渐变范围
        this._m_StepClip = 0.2;
        // 半径倒数(加速计算)
        this._m_InvRadius = 1.0 / this._m_Radius;
        // 与其在裁剪范围进行扩大，不如直接减少半径，但是这可能带来一个问题是SpotLight和PointLight半径范围变小
        // 因为使用了1.0/r,所以会与光锥裁剪时的r有误差,只能在这里进行误差缩小
        this._m_InvRadius2 = 1.0 / (this._m_Radius - this._m_StepClip);
    }
    _genShadow() {
        // 创建用于PointLight的阴影
        this._m_ShadowCfg.id = this._m_Id + "_shadow";
        this._m_Shadow = new PointLightShadowProcess(this._m_Scene, this._m_ShadowCfg);
    }

    /**
     * 设置光源裁剪渐变范围。<br/>
     * @param {Number}[stepClip]
     */
    setStepClip(stepClip){
        if(stepClip < 0){
            stepClip = 1.0;
        }
        this._m_StepClip = stepClip;
        this._m_InvRadius2 = 1.0 / (this._m_Radius - this._m_StepClip);
    }

    /**
     * 返回光源裁剪渐变范围。<br/>
     * @return {Number}
     */
    getStepClip(){
        return this._m_StepClip;
    }

    /**
     * 设置灯光位置。<br/>
     * @param {Vector3}[pos]
     */
    setPosition(pos){
        this._m_Position.setTo(pos);
        this._updateBounding();
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
        this._updateBounding();
    }

    /**
     * 设置灯光半径。<br/>
     * -1表示无限远。<br/>
     * @param {Number}[radius 默认为-1]
     */
    setRadius(radius){
        this._m_Radius = radius;
        this._m_InvRadius = 1.0 / radius;
        this._updateBounding();
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

    /**
     * 返回光源裁剪后的半径的倒数。<br/>
     * @return {number|*}
     */
    getInRadius2(){
        return this._m_InvRadius2;
    }

    getBoundingVolume(){
        if(this._m_UpdateBoundingVolume){
            if(!this._m_BoudingVolume){
                // 对于PointLight,创建包围球
                this._m_BoudingVolume = new BoundingSphere();
            }
            this._m_BoudingVolume.setCenter(this._m_Position);
            this._m_BoudingVolume.setRaiuds(this._m_Radius);
            this._m_UpdateBoundingVolume = false;
        }
        return this._m_BoudingVolume;
    }
}
