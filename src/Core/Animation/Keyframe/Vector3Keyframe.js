import AnimKeyframe from "./AnimKeyframe.js";
import Vector3 from "../../Math3d/Vector3.js";
import Log from "../../Util/Log.js";

/**
 * Vector3Keyframe。<br/>
 * 用于定义3维数值变换的关键帧。<br/>
 * @author Kkk
 * @date 2021年3月8日16点02分
 */
export default class Vector3Keyframe extends AnimKeyframe{
    constructor(time, x, y, z) {
        super(time);
        this._m_Value = new Vector3(x, y, z);
    }
    setInterpolationMode(interpolationMode){
        super.setInterpolationMode(interpolationMode);

        // 根据具体插值模式修改插值计算函数
        // Log.log('interpolationMode:' + interpolationMode);
        if(interpolationMode == AnimKeyframe.S_LINEAR){
            this.interpolation = Vector3.inter;
        }
    }

}
