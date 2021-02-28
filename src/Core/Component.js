import Globals from "./Globals.js";
import Events from "./Util/Events.js";

/**
 * 所有组件基类。<br/>
 * @author Kkk
 * @date 2021年2月1日16点03分
 */
export default class Component {

    getType(){
        return null;
    }

    constructor(owner, cfg) {
        cfg = cfg || {};
        // 事件观察者
        this._mEvents = new Events();

        // 是否需要更新
        this._m_NeedUpdate = false;

        this._m_Id = cfg.id || Globals.nextId();
        // 保存附加组件
        this._m_Components = [];
        // 保存附加组件id,用于快速查找
        this._m_ComponentIDs = {};

        // 场景
        this._m_Scene = null;

        // 表示当前组件的持有者,即当前组件附加到哪个对象上
        // scene不能附加到任何其他组件上
        this._m_Owner = owner;

        // 当前组件持有的组件
        this._m_OwnerAttachComponents = [];
        // 用于加速查询当前组件持有的组件
        this._m_OwnerAttachComponentIDs = {};

        // 如果this是一个scene,则传入的scene参数为null
        if(this.getType() == "Scene"){
            this._m_Scene = this;
        }
        else{
            this._m_Scene = owner._m_Scene;
        }
        this._m_Scene.addComponentInScene(this);
        if(this._m_Owner){
            this._m_Owner.attachComponent(this);
        }
    }

    /**
     * 注册观察者
     * @param {Object}[event 事件类型]
     * @param {Object}[callback 观察者]
     * @param {Object}[object 可选]
     */
    on(event, callback, object){
        this._mEvents.register(event, callback, object);
    }

    /**
     * 移除一个观察者
     * @param {Object}[event 事件类型]
     * @param {Object}[callback 观察者]
     * @param {Object}[object 可选]
     */
    off(event, callback, object){
        this._mEvents.unregister(event, callback, object);
    }

    /**
     * 广播事件
     * @param {Object}[event 事件类型]
     * @param {Object}[eventArguments 事件参数列表]
     * @param {Object}[object 可选]
     */
    fire(event, eventArguments, object){
        this._mEvents.trigger(event, eventArguments, object);
    }

    /**
     * 返回组件id
     * @returns {*}
     */
    getId(){
        return this._m_Id;
    }

    /**
     * 附加一个组件到当前组件中
     * @param {Component}[component]
     */
    attachComponent(component){
        if(component instanceof Component){
            if(!this._m_OwnerAttachComponentIDs[component.getId()]){
                this._m_OwnerAttachComponentIDs[component.getId()] = component;
                this._m_OwnerAttachComponents.push(component);
            }
        }
        else{
            console.error("component必须是一个组件!!");
        }
    }
    getComponent(id){
        if(this._m_OwnerAttachComponentIDs[id]){
            return this._m_OwnerAttachComponentIDs[id];
        }
        return null;
    }

    /**
     * 从当前组件移除一个附加组件
     * @param {Component}[component]
     */
    detachComponent(component){
        if(component instanceof Component){
            if(this._m_OwnerAttachComponentIDs[component.getId()]){
                this._m_OwnerAttachComponentIDs[component.getId()] = null;
                this._m_OwnerAttachComponents.remove(component);
            }
        }
    }

    /**
     * 所有组件继承这个函数,用于触发更新函数。<br/>
     * @private
     */
    _doUpdate(immediately){
        // 设置为false,如果_update()重新将该值设置为true,则表明需要下一次更新
        this._m_NeedUpdate = false;
        if(immediately){
            // Component注册
            // 在这之前做一些判断,比如是否立即调用update(),是在帧前,帧后进行的时间?
            if(this._update){
                this._update();
            }
        }
        else{
            // 添加到更新队列中
            this._m_Scene.scheduleTask(this._update, this);
        }
    }

    /**
     * 所有组件实现这个方法,用于实现具体更新逻辑。<br/>
     * @private
     */
    _update(){

    }



}
