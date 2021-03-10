/**
 * TrackBinding。<br/>
 * 将指定的动作轨道绑定到指定的对象上,使得该对象执行该轨迹动作。<br/>
 * @author Kkk
 */
export default class TrackBinding {
    constructor(node, property) {
        // 绑定的对象
        this._m_Node = node;
        this.setValue = null;
        this.getValue = null;
        // 对绑定对象的property进行轨迹操作
        switch (property) {
            case 'rotation':
                this.setValue = (value)=>{
                    node.setLocalRotation(value);
                };
                this.getValue = ()=>{
                    return node.getLocalRotation();
                };
                break;
            case 'translation':
                this.setValue = (value)=>{
                    node.setLocalTranslation(value);
                };
                this.getValue = ()=>{
                    return node.getLocalTranslation();
                };
                break;
            case 'scale':
                this.setValue = (value)=>{
                    node.setLocalScale(value);
                };
                this.getValue = ()=>{
                    return node.getLocalScale();
                };
                break;
        }
    }

    /**
     * 创建轨迹通道绑定。<br/>
     * @param {Object}[obj]
     * @param {String}[track]
     * @return {TrackBinding}
     */
    static bind(obj, track){
        return new TrackBinding(obj, track);
    }

    /**
     * 创建轨迹。<br/>
     * @param {ActionClip}[actionClip]
     * @param {Object}[obj]
     */
    static createTrack(actionClip, obj){
        actionClip.setActionTrack(TrackBinding.bind(obj, actionClip.getPathName()));
    }

}
