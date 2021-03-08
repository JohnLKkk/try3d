/**
 * TrackMixer。<br/>
 * 将多个轨迹合成，通常一个Mixer包含多个ActionClip，在一段动画时间中插补关键帧得到对应的值并进行合成，最终更新到指定轨迹上。<br/>
 * @author Kkk
 */
export default class TrackMixer {
    constructor() {
        // 从当前时间插值所有ActionClip的关键帧
        // 然后将更新后的ActionClip的各个Track绑定应用到指定的Node.property上。
        // 轨迹数组
        this._m_Clips = [];
    }
    update(exTime){
        // 对clip进行关键帧插值
    }

}
