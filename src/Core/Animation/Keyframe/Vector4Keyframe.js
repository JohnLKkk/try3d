import AnimKeyframe from "./AnimKeyframe.js";
import Vector4 from "../../Math3d/Vector4.js";

/**
 * Vector4Keyframe。<br/>
 * 用于定义4维数值变换的关键帧。<br/>
 * @author Kkk
 * @date 2021年3月8日16点02分
 */
export default class Vector4Keyframe extends AnimKeyframe{
    constructor(time, x, y, z, w) {
        super(time);
        this._m_Value = new Vector4(x, y, z, w);
    }

}
