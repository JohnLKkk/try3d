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
    }

}
