/**
 * AnimationAction。<br/>
 * 定义了一个动画，复杂的3D动画中通常为一个角色创建多个动画。<br/>
 * 一个完整的动画通常由多个ActionClip定义或描述。<br/>
 * @author Kkk
 */
export default class AnimationAction {
    constructor(name) {
        // 动画名称
        this._m_Name = name;
        // 动画长度
        this._m_TimeLength = 0;
        // AnimationAction定义了一个动画的名称，长度，包含的TrackMixer
        // 对TrackMixer进行更新
    }

}
