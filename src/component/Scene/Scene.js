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
        this._m_Render = new Render(this);
        this._m_Canvas = new Canvas(cfg.cavnas);
        this._m_MainCamera = new Camera(this, {id:"mainCamera"});
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

    }
    render(exTime){
        this._m_Render.render(exTime);
    }

}