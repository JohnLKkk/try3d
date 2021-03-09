import Component from "../Component.js";
import Log from "../Util/Log.js";

export default class AnimationProcessor extends Component{
    getType(){
        return 'AnimationProcessor';
    }

    constructor(owner, cfg) {
        super(owner, cfg);

        // 所有动画
        this._m_AnimationActions = [];
        this._m_AnimationActionMaps = {};

        // 这里监听场景的update而不是组件的update()事件
        this._m_Scene.on('update', exTime=>{
            // Log.log('更新AnimationProcessor!');
        });
    }

    /**
     * 添加一个动画。<br/>
     * @param {AnimationAction}[animationAction]
     */
    addAnimationAction(animationAction){
        if(!this._m_AnimationActionMaps[animationAction.getName()]){
            this._m_AnimationActionMaps[animationAction.getName()] = animationAction;
            this._m_AnimationActions.push(animationAction);
        }
    }

    /**
     * 返回一个动画。<br/>
     * @param {String}[name]
     * @return {AnimationAction/null}
     */
    getAnimationAction(name){
        return this._m_AnimationActionMaps[name];
    }

}
