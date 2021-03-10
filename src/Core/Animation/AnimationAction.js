/**
 * AnimationAction。<br/>
 * 定义了一个动画，复杂的3D动画中通常为一个角色创建多个动画。<br/>
 * 一个完整的动画通常由多个ActionClip定义或描述。<br/>
 * @author Kkk
 */
import Log from "../Util/Log.js";

export default class AnimationAction {
    static S_LOOP = 0x001;
    static S_DONT_LOOP = 0x002;
    static S_BACK_AND_FORTH = 0x003;
    constructor(name) {
        // 动画名称
        this._m_Name = name;
        // 动画进度
        this._m_Time = 0;
        // 动画长度
        this._m_TimeLength = 0;
        // 播放模式
        this._m_Mode = AnimationAction.S_LOOP;
        this._m_TimeMode = 1;
        // 轨迹合成器
        this._m_TrackMixer = null;
    }

    /**
     * 返回动画名称。<br/>
     * @return {String}
     */
    getName(){
        return this._m_Name;
    }

    /**
     * 返回动画长度。<br/>
     * @return {Number}[秒]
     */
    getAnimationLength(){
        return this._m_TimeLength;
    }

    /**
     * 设置轨迹合成器。<br/>
     * @param {TrackMixer}[trackMixer]
     */
    setTrackMixer(trackMixer){
        this._m_TrackMixer = trackMixer;
        // 更新动画长度
        this._m_Time = 0;
        this._m_TimeLength = -Number.MAX_VALUE;
        trackMixer.getClips().forEach(clip=>{
            this._m_TimeLength = Math.max(clip.getLength(), this._m_TimeLength);
        });
        if(this._m_TimeLength == -Number.MAX_VALUE){
            this._m_TimeLength = 0;
        }
        Log.log('[[' + this.getName() + ']]动画时长:' + this._m_TimeLength + "s");
    }
    play(){

    }

    /**
     * 更新动画。<br/>
     * @param {Number}[exTime 经过时间毫秒]
     */
    update(exTime){
        if(this._m_Time >= this._m_TimeLength){
            if(this._m_Mode == AnimationAction.S_DONT_LOOP){
                this._m_TimeMode = 1;
                return;
            }
            if(this._m_Mode == AnimationAction.S_LOOP){
                this._m_Time = 0;
                this._m_TimeMode = 1;
            }
            if(this._m_Mode == AnimationAction.S_BACK_AND_FORTH){
                this._m_Time = this._m_TimeLength;
                this._m_TimeMode = -1;
            }
        }
        this._m_Time += exTime * this._m_TimeMode;
        this._m_TrackMixer.update(this._m_Time);
    }

}
