import Component from "../Component.js";
import Render from "../Render/Render.js";
import Canvas from "../Device/Canvas.js";
import Camera from "./Camera.js";

/**
 * Scene表示渲染一个3D世界的容器，包含各种组件，但它不能作为其他组件的子组件。<br/>
 * @author JhonKkk
 */
export default class Scene extends Component{
    getType(){
        return "Scene";
    }
    constructor(cfg) {
        super(null, cfg);
        // 创建一个默认渲染器组件,一个场景可以附加多个渲染器组件
        // 但是每次应该只激活其中一个渲染器
        // 这样,场景可以根据需要,使用不同的渲染器进行渲染
        // 所有该场景的渲染器共享同一个场景实例的好处是:
        // 可以添加一个实时渲染器,用于实时交互
        // 然后添加一个光追渲染器,用于渲染高质量图片
        this._m_Canvas = new Canvas(this, {id:"default_canvas", canvas:cfg.cavnas});
        this._m_Render = new Render(this, {id:"default_render"});
        this._m_MainCamera = new Camera(this, {id:"mainCamera"});
    }

    /**
     * 返回当前场景主相机。<br/>
     * 场景可以有多个相机,但是只能有一个主相机。<br/>
     * @returns {Camera}[当前场景主相机]
     */
    getMainCamera(){
        return this._m_MainCamera;
    }

    /**
     * 返回当前场景渲染器。<br/>
     * @return {Render}
     */
    getRender(){
        return this._m_Render;
    }

    /**
     * 返回当前渲染场景的呈现设备。<br/>
     * @returns {Object}[Canvas]
     */
    getCanvas(){
        return this._m_Canvas;
    }
    /**
     * 载入一个组件到scene中
     * @param {Component}[component]
     */
    addComponentInScene(component){
        if(component instanceof Component){
            if(!this._m_ComponentIDs[component.getId()]){

                // 如果是scene,则跳过这个组件,所有的组件都是附加到scene中
                if(component.getType() != "Scene"){
                    this._m_ComponentIDs[component.getId()] = component;
                    this._m_Components.push(component);
                }

                if(component.isDrawable && component.isDrawable()){
                    this._m_Render.addDrawable(component);
                }
            }
            else{
                console.warn("组件[[" + component.getId() + "]]已存在!!");
            }
        }
        else{
            console.error("component必须是一个Component对象!!");
        }
    }

    /**
     * 从场景移除一个组件
     * @param component
     */
    removeComponentInScene(component){
        if(component instanceof Component){
            if(this._m_ComponentIDs[component.getId()]){
                this._m_ComponentIDs[component.getId()] = null;
                this._m_Components.remove(component);
                if(component.isDrawable && component.isDrawable()){
                    this._m_Render.removeDrawable(component);
                }
            }
        }
    }
    update(exTime){
        // 通知所有观察者
        this.fire('update', [exTime]);
        // 然后执行其他操作
    }
    render(exTime){
        // 通知一帧开始
        this._m_Render.render(exTime);
    }

}
