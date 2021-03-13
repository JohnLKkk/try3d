import Vector3Keyframe from "./Vector3Keyframe.js";
import QuaternionKeyframe from "./QuaternionKeyframe.js";

/**
 * AnimKeyframeEnum。<br/>
 * 轨迹通道。<br/>
 * @author Kkk
 * @date 2021年3月11日12点25分
 */
export default class AnimKeyframeEnum {
    static S_KEY_FRAME = {
        'scale':Vector3Keyframe,
        'rotation':QuaternionKeyframe,
        'translation':Vector3Keyframe
    }
}
