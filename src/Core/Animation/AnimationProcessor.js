import Component from "../Component.js";
import Log from "../Util/Log.js";

/**
 * AnimationProcessor。<br/>
 * 作为提供轨迹动画，变形动画和Skin动画的控制器。<br/>
 * @author Kkk
 * @date 2021年3月8日2点28分
 * @lastdate 2021年3月13日22点00分
 */
export default class AnimationProcessor extends Component{
    getType(){
        return 'AnimationProcessor';
    }

    constructor(owner, cfg) {
        super(owner, cfg);

        // 所有动画
        this._m_AnimationActions = [];
        this._m_AnimationActionMaps = {};

        // 激活的动画
        this._m_ActiveAnimationActions = [];

        // 这里监听场景的update而不是组件的update()事件
        let count = -1;
        this._m_Scene.on('update', exTime=>{
            // Log.log('更新AnimationProcessor!');
            count = this._m_ActiveAnimationActions.length;
            if(count > 0){
                for(let i = 0;i < count;i++){
                    // 播放所有动画
                    this._m_ActiveAnimationActions[i].update(exTime);
                }
            }
        });
    }

    /**
     * 激活一个动画,由内部调用。<br/>
     * @param {AnimationAction}[activeAnimation]
     * @private
     */
    _activeAnimationAction(activeAnimation){
        this._m_ActiveAnimationActions.push(activeAnimation);
    }

    /**
     * 禁用一个动画,由内部调用。<br/>
     * @param {AnimationAction}[disableAnimation]
     * @private
     */
    _disableAnimationAction(disableAnimation){
        let i = this._m_ActiveAnimationActions.indexOf(disableAnimation);
        if(i > -1){
            this._m_ActiveAnimationActions.splice(i, 1);
        }
    }

    /**
     * 添加一个动画。<br/>
     * @param {AnimationAction}[animationAction]
     */
    addAnimationAction(animationAction){
        if(!this._m_AnimationActionMaps[animationAction.getName()]){
            this._m_AnimationActionMaps[animationAction.getName()] = animationAction;
            this._m_AnimationActions.push(animationAction);
            animationAction._setProcessor(this);
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

    /**
     * 返回指定索引的动画。<br/>
     * @param {Number}[i]
     * @return {AnimationAction}
     */
    getAnimationActionAtIndex(i){
        if(i >= this._m_AnimationActions.length){
            return null;
        }
        return this._m_AnimationActions[i];
    }

    /**
     * 返回所有动画。<br/>
     * @return {AnimationAction[]}
     */
    getAnimationActions(){
        return this._m_AnimationActions;
    }

}
