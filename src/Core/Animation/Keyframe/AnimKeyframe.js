/**
 * AnimKeyframe。<br/>
 * 动画关键帧，所有关键帧类型的根类。<br/>
 * @author Kkk
 * @date 2021年3月8日15点59分
 */

export default class AnimKeyframe {
    static S_INTERPOLATION_MODE = {
        'LINEAR':0,
    };
    static S_LINEAR = 'LINEAR';
    constructor(time) {
        // 关键帧时间
        this._m_Time = time;
        // 当前关键帧值
        this._m_Value = null;
        // 插值方式
        this._m_InterpolationMode = AnimKeyframe.S_INTERPOLATION_MODE[AnimKeyframe.S_LINEAR];
        // 插值函数
        this.interpolation = null;
    }

    /**
     * 返回关键帧时间。<br/>
     * @return {Number}
     */
    getTime(){
        return this._m_Time;
    }

    /**
     * 返回关键帧值。<br/>
     * @return {Object}
     */
    getValue(){
        return this._m_Value;
    }

    /**
     * 设置插值方式。<br/>
     * @param {Number}[interpolationMode]
     */
    setInterpolationMode(interpolationMode){
        this._m_InterpolationMode = AnimKeyframe.S_INTERPOLATION_MODE[interpolationMode];
    }

}
