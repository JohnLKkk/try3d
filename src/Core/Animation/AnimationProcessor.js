import Component from "../Component.js";

export default class AnimationProcessor extends Component{
    getType(){
        return 'AnimationProcessor';
    }

    constructor(owner, cfg) {
        super(owner, cfg);
        // 这里监听场景的update而不是组件的update()事件
        this._m_Scene.on('update', exTime=>{});
    }

}
