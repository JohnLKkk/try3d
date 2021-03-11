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
    static S_PLAY = 1;
    static S_PAUSE = 1 << 1;
    static S_STOP = 1 << 2;
    constructor(name) {
        // 动画名称
        this._m_Name = name;
        // 动画进度
        this._m_Time = 0;
        // 动画长度
        this._m_TimeLength = 0;
        // 播放模式
        this._m_Mode = AnimationAction.S_DONT_LOOP;
        this._m_TimeMode = 1;
        // 处理器
        this._m_Processor = null;
        // 轨迹合成器
        this._m_TrackMixer = null;
        // 动画状态
        this._m_State = AnimationAction.S_STOP;
    }
    setAnimationMode(mode){

    }

    /**
     * 设置处理器，内部调用。<br/>
     * @param {AnimationProcessor}[processor]
     * @private
     */
    _setProcessor(processor){
        this._m_Processor = processor;
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

    /**
     * 播放当前动画。<br/>
     */
    play(){
        if(this._m_State == AnimationAction.S_PLAY){
            return;
        }
        // 激活动画
        this._m_Processor._activeAnimationAction(this);
        this._m_State = AnimationAction.S_PLAY;
    }

    /**
     * 暂停当前动画。<br/>
     */
    pause(){
        if(this._m_State == AnimationAction.S_PAUSE){
            return;
        }
        // 只有播放过的动画才需要禁用
        if(this._m_State == AnimationAction.S_PLAY)
            this._m_Processor._disableAnimationAction(this);
        this._m_State = AnimationAction.S_PAUSE;
    }

    /**
     * 停止当前动画。<br/>
     */
    stop(){
        if(this._m_State == AnimationAction.S_STOP){
            return;
        }
        // 只有播放过的动画才需要禁用
        if(this._m_State == AnimationAction.S_PLAY)
            this._m_Processor._disableAnimationAction(this);
        this._m_State = AnimationAction.S_STOP;
        // 重置时间
        this._m_Time = 0;
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
