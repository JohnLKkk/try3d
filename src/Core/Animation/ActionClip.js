/**
 * ActionClip。<br/>
 * 定义关键帧动作剪辑，一个动作剪辑定义了对某个轨迹通道的关键帧。<br/>
 * @author Kkk
 * @date 2021年3月8日17点27分
 */
export default class ActionClip {
    constructor(pathName) {
        // 轨迹路径名称(定义当前轨迹通道)
        this._m_PathName = pathName;
        // 关键帧数组
        this._m_Keyframes = [];
        // 剪辑轨迹通道
        this._m_ActionTrack = null;
    }

    /**
     * 返回剪辑长度。<br/>
     * @return {Number}
     */
    getLength(){
        let length = -Number.MAX_VALUE;
        this._m_Keyframes.forEach(keyframe=>{
            length = Math.max(length, keyframe.getTime());
        });
        return length == -Number.MAX_VALUE ? 0 : length;
    }

    /**
     * 添加关键帧。<br/>
     * @param {AnimKeyframe}[keyframe]
     */
    addKeyframe(keyframe){
        this._m_Keyframes.push(keyframe);
    }

    /**
     * 返回轨迹路径。<br/>
     * @return {String}
     */
    getPathName(){
        return this._m_PathName;
    }

    /**
     * 设置动作轨迹。<br/>
     * @param {TrackBinding}[track]
     */
    setActionTrack(track){
        this._m_ActionTrack = track;
    }

    /**
     * 更新动作。<br/>
     * @param {Number}[time 当前时间]
     */
    update(time){
        let keyFrameId = 0;
        let keyFrame = null;
        let keyFrames = this._m_Keyframes.length;
        while (keyFrameId < keyFrames && this._m_Keyframes[keyFrameId].getTime() < time){
            keyFrameId++;
        }

        if(keyFrameId == 0){
            keyFrame = this._m_Keyframes[keyFrameId];
            this._m_ActionTrack.setValue(keyFrame.getValue());
        }
        else if(keyFrameId == keyFrames){
            keyFrameId -= 1;
            keyFrame = this._m_Keyframes[keyFrameId];
            this._m_ActionTrack.setValue(keyFrame.getValue());
        }
        else{
            let left = this._m_Keyframes[keyFrameId - 1];
            let right = this._m_Keyframes[keyFrameId];

            keyFrame = left.interpolation(left.getValue(), right.getValue(), time);
            this._m_ActionTrack.setValue(keyFrame);
        }
    }

}
