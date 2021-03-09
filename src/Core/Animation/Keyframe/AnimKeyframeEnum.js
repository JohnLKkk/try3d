import Vector3Keyframe from "./Vector3Keyframe.js";
import QuaternionKeyframe from "./QuaternionKeyframe.js";

export default class AnimKeyframeEnum {
    static S_KEY_FRAME = {
        'scale':Vector3Keyframe,
        'rotation':QuaternionKeyframe,
        'translation':Vector3Keyframe
    }
}
