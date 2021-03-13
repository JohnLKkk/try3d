/**
 * TrackMixer。<br/>
 * 将多个轨迹合成，通常一个Mixer包含多个ActionClip，在一段动画时间中插补关键帧得到对应的值并进行合成，最终更新到指定轨迹上。<br/>
 * @author Kkk
 * @date 2021年3月13日21点58分
 * @lastdata 2021年3月13日21点59分
 */
export default class TrackMixer {
    constructor() {
        // 从当前时间插值所有ActionClip的关键帧
        // 然后将更新后的ActionClip的各个Track绑定应用到指定的Node.property上。
        // 轨迹数组
        this._m_Clips = [];
    }

    /**
     * 添加剪辑。<br/>
     * @param {ActionClip}[clip]
     */
    addClip(clip){
        this._m_Clips.push(clip);
    }

    /**
     * 返回指定动作剪辑。<br/>
     * @param {Number}[index]
     * @return {ActionClip}
     */
    getClip(index){
        return this._m_Clips[index];
    }

    /**
     * 返回所有动作剪辑。<br/>
     * @return {ActionClip[]}
     */
    getClips(){
        return this._m_Clips;
    }

    /**
     * 更新剪辑。<br/>
     * @param {Number}[time 当前时间]
     */
    update(time){
        // 混合剪辑
        this._m_Clips.forEach(clip=>{
            clip.update(time);
        });
    }

}
