import AnimKeyframe from "./AnimKeyframe.js";
import Quaternion from "../../Math3d/Quaternion.js";

/**
 * QuaternionKeyframe。<br/>
 * 四元数关键帧用于表达需要球面插值的旋转关键帧动画。<br/>
 * @author Kkk
 * @date 2021年3月8日16点05分
 */
export default class QuaternionKeyframe extends AnimKeyframe{
    constructor(time, x, y, z, w) {
        super(time);
        this._m_Value = new Quaternion(x, y, z, w);
    }

}
