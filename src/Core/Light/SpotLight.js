import Light from "./Light.js";
import Vector3 from "../Math3d/Vector3.js";
import MoreMath from "../Math3d/MoreMath.js";
import BoundingSphere from "../Math3d/Bounding/BoundingSphere.js";
import TempVars from "../Util/TempVars.js";
import SpotLightShadowProcess from "../Shadow/SpotLightShadowProcess.js";

/**
 * 聚光灯。<br/>
 * 包含位置,朝向,内外角等信息。<br/>
 * @author Kkk
 * @date 2021年2月17日14点41分
 */
export default class SpotLight extends Light{
    getType() {
        return 'SpotLight';
    }
    getTypeId() {
        return 2;
    }

    constructor(owner, cfg) {
        super(owner, cfg);
        // 方向
        this._m_Direction = new Vector3();
        // 位置
        this._m_Position = new Vector3();
        // 内角
        this._m_InnerAngle = MoreMath.toRadians(30);
        this._m_InnerCorner = Math.cos(this._m_InnerAngle);
        // 外角
        this._m_OuterAngle = MoreMath.toRadians(45);
        this._m_OuterCorner = Math.cos(this._m_OuterAngle);
        // 最远能够照射多远(为0表示可以无限远)
        this._m_SpotRange = 100;
        // 光源裁剪渐变范围
        this._m_StepClip = 4.0;
        // 最远照射范围倒数(用于加速计算)
        this._m_InvSpotRange = 1.0 / this._m_SpotRange;
        // 内外角余弦差
        this._m_InnerMinusOuter = this._m_InnerCorner - this._m_OuterCorner;
        // 打包内外角到一个变量中
        this._m_PackedAngleCos = 0;
        this.computeAngleParameters();
    }
    _genShadow() {
        // 创建用于SpotLight的阴影
        this._m_ShadowCfg.id = this._m_Id + "_shadow";
        this._m_Shadow = new SpotLightShadowProcess(this._m_Scene, this._m_ShadowCfg);
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
    }

    /**
     * 返回光源裁剪渐变范围。<br/>
     * @return {Number}
     */
    getStepClip(){
        return this._m_StepClip;
    }

    /**
     * 返回打包的内外角信息。<br/>
     * @return {Number}
     */
    getPackedAngleCos(){
        return this._m_PackedAngleCos;
    }

    /**
     * 计算角度信息，打包内外角到一个变量中。<br/>
     */
    computeAngleParameters(){
        // 将内角放在1000之后的字节中
        // 将外角放在1000之内的字节中
        this._m_PackedAngleCos = Math.floor(this._m_InnerCorner * 1000);
        // 为了避免位数据不够
        // 这里的情况是,假设InnerCorner和OutCorner都是1.0,则此时是没有小数部分的
        // 为了能够将OuterCorner编码到小数部分,一种做法是对OuterCorner进行缩放0.1
        // 或者,在这里对其进行-0.001
        if(this._m_PackedAngleCos == Math.floor(this._m_OuterCorner * 1000)){
            this._m_OuterCorner -= 0.001;
        }
        this._m_PackedAngleCos += this._m_OuterCorner * 1.0;
    }

    /**
     * 返回内外角余弦差。<br/>
     * @return {Number}
     */
    getInnerMinusOuter(){
        return this._m_InnerMinusOuter;
    }

    /**
     * 设置照射距离(0表示无限远)。<br/>
     * @param {Number}[spotRange]
     */
    setSpotRange(spotRange){
        if(spotRange <= 0){
            this._m_SpotRange = 0;
            this._m_InvSpotRange = 0;
        }
        else{
            this._m_SpotRange = spotRange;
            this._m_InvSpotRange = 1.0 / this._m_SpotRange;
        }
    }

    /**
     * 返回最远照射范围。<br/>
     * @return {Number}
     */
    getSpotRange(){
        return this._m_SpotRange;
    }

    /**
     * 返回最远照射范围倒数,用于加速计算。<br/>
     * @return {Number}
     */
    getInvSpotRange(){
        return this._m_InvSpotRange;
    }

    /**
     * 设置内角。<br/>
     * @param {Number}[innerAngle 弧度值]
     */
    setInnerAngle(innerAngle){
        this._m_InnerAngle = innerAngle;
        this._m_InnerCorner = Math.cos(this._m_InnerAngle);
        this._m_InnerMinusOuter = this._m_InnerCorner - this._m_OuterCorner;
        this.computeAngleParameters();
    }

    /**
     * 返回外角。<br/>
     * @return {Number|*}
     */
    getInnerAngle(){
        return this._m_InnerAngle;
    }

    /**
     * 设置外角。<br/>
     * @param {Number}[outerAngle 弧度值]
     */
    setOuterAngle(outerAngle){
        this._m_OuterAngle = outerAngle;
        this._m_OuterCorner = Math.cos(this._m_OuterAngle);
        this._m_InnerMinusOuter = this._m_InnerCorner - this._m_OuterCorner;
        this.computeAngleParameters();
    }

    /**
     * 返回外角。<br/>
     * @return {Number|*}
     */
    getOuterAngle(){
        return this._m_OuterAngle;
    }

    /**
     * 设置位置。<br/>
     * @param {Vector3}[position]
     */
    setPosition(position){
        this._m_Position.setTo(position);
    }

    /**
     * 设置位置。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     */
    setPositionXYZ(x, y, z){
        this._m_Position.setToInXYZ(x, y, z);
    }

    /**
     * 返回位置。<br/>
     * @return {Vector3}
     */
    getPosition(){
        return this._m_Position;
    }

    /**
     * 返回位置。<br/>
     * @return {Vector3}
     */
    getPosition(){
        return this._m_Position;
    }

    /**
     * 设置方向。<br/>
     * @param {Vector3}[direction]
     */
    setDirection(direction){
        this._m_Direction.setTo(direction);
        // 提前normal,以便shader减少normal操作
        this._m_Direction.normal();
    }

    /**
     * 设置方向。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     */
    setDirectionXYZ(x, y, z){
        this._m_Direction.setToInXYZ(x, y, z).normal();
    }

    /**
     * 返回方向。<br/>
     * @return {Vector3}
     */
    getDirection(){
        return this._m_Direction;
    }

    getBoundingVolume(){
        // 因为这一阶段只是快速剔除，如果使用OBB计算光锥剔除，则显得有点浪费
        // 对于无限远的聚光,直接渲染,无需剔除
        if(this._m_SpotRange == 0)return null;
        // 对于有限聚光灯,使用球体包围盒快速剔除
        if(this._m_UpdateBoundingVolume){
            if(!this._m_BoudingVolume){
                // 对于PointLight,创建包围球
                this._m_BoudingVolume = new BoundingSphere();
            }

            let lr = this._m_SpotRange * 0.5;
            let center = TempVars.S_TEMP_VEC3_2;
            this._m_Direction.multLength(this._m_SpotRange * 0.5, center).add(this._m_Position);

            let lr2 = this._m_SpotRange * Math.tan(this._m_OuterCorner);

            this._m_BoudingVolume.setCenter(center);
            this._m_BoudingVolume.setRaiuds(Math.max(lr, lr2));
            this._m_UpdateBoundingVolume = false;
        }
        return this._m_BoudingVolume;
    }
}
