import Component from "../Component.js";
import Render from "../Render/Render.js";
import Canvas from "../Device/Canvas.js";
import Camera from "./Camera.js";
import Queue from "../Util/Queue.js";
import Light from "../Light/Light.js";
import Node from "../Node/Node.js";
import Picture from "../Node/Picture.js";

/**
 * Scene表示渲染一个3D世界的容器，包含各种组件，但它不能作为其他组件的子组件。<br/>
 * @author JhonKkk
 */
export default class Scene extends Component{
    getType(){
        return "Scene";
    }

    /**
     * 创建一个场景。<br/>
     * @param {String}[cfg.id]
     * @param {DOM}[cfg.canvas]
     */
    constructor(cfg) {
        super(null, cfg);
        // 创建一个默认渲染器组件,一个场景可以附加多个渲染器组件
        // 但是每次应该只激活其中一个渲染器
        // 这样,场景可以根据需要,使用不同的渲染器进行渲染
        // 所有该场景的渲染器共享同一个场景实例的好处是:
        // 可以添加一个实时渲染器,用于实时交互
        // 然后添加一个光追渲染器,用于渲染高质量图片
        this._m_TaskQueue = new Queue();
        this._m_Canvas = new Canvas(this, {id:"default_canvas", canvas:cfg.cavnas});
        this._m_Render = new Render(this, {id:"default_render"});
        this._m_MainCamera = new Camera(this, {id:"mainCamera"});
        this._m_FrustumCullingCamera = this._m_MainCamera;
        this._m_MainCamera.setIsRenderingCamera(true);

        // 场景节点
        this._m_Nodes = [];
        // 场景节点名称映射列表
        this._m_NodeIds = {};

        // 灯光列表
        this._m_Lights = [];
        // 灯光名称映射列表
        this._m_LightIds = {};

        // 初始化
        this._m_Render.startUp();
    }

    /**
     * 返回所有灯光。<br/>
     * @return {Light[]}
     */
    getLights(){
        return this._m_Lights;
    }

    /**
     * 返回指定灯光。<br/>
     * @param {Object}[lightId]
     * @return {Light}
     */
    getLight(lightId){
        return this._m_LightIds[lightId];
    }

    /**
     * 添加一个更新任务到更新队列中。<br/>
     * @param {Object}[callback]
     * @param {Object}[scope]
     */
    scheduleTask(callback, scope) {
        this._m_TaskQueue.push(callback);
        this._m_TaskQueue.push(scope);
    }

    /**
     * 在给定的毫秒数之前弹出并处理队列中的任务。<br/>
     * @param until
     * @return {number}
     */
    runTasks(until = -1) {
        let time = until > 0 ? (new Date()).getTime() : 0;
        let callback;
        let scope;
        let tasksRun = 0;
        let l = this._m_TaskQueue.length;
        while (l > 0 && (until < 0 || time < until)) {
            callback = this._m_TaskQueue.shift();
            scope = this._m_TaskQueue.shift();
            l -= 2;
            if (scope) {
                callback.call(scope);
            } else {
                callback();
            }
            if(until > 0){
                time = (new Date()).getTime();
            }
            tasksRun++;
        }
        return tasksRun;
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
     * 设置主摄像机。<br/>
     * @param {Camera}[mainCamera]
     */
    setMainCamera(mainCamera){
        this._m_MainCamera = mainCamera;
        this._m_MainCamera.setIsRenderingCamera(true);
    }

    /**
     * 设置剔除相机。<br/>
     * @param {Camera}[frustumCullingCamera]
     */
    setFrustumCullingCamera(frustumCullingCamera){
        this._m_FrustumCullingCamera = frustumCullingCamera;
    }

    /**
     * 返回视锥体剔除相机。<br/>
     * @return {Camera}
     */
    getFrustumCullingCamera(){
        return this._m_FrustumCullingCamera;
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
     * 设置天空盒。<br/>
     * @param {Sky}[sky]
     */
    setSky(sky){
        if(sky.getType() == 'SkyBox' || sky.getType() == 'SkyDome'){
            this._m_Render.setSky(sky);
        }
    }

    /**
     * 返回天空盒。<br/>
     * @return {Sky}
     */
    getSky(){
        return this._m_Render.getSky();
    }

    /**
     * 添加场景节点。<br/>
     * @param {Node}[node]
     */
    addSceneNode(node){
        // 检测是否为Node(后面要进行场景管理,剔除,需要对类型为Node的组件进行收集)
        if(node instanceof Node && !(node instanceof Picture)){
            if(!this._m_NodeIds[node.getId()]){
                this._m_Nodes.push(node);
                this._m_NodeIds[node.getId()] = node;
            }
        }
    }
    /**
     * 载入一个组件到scene中,场景对象将包含所有组件。<br/>
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


                // 检测是否为drawable
                // 其实应该在scene组件中维护drawables列表而不是render组件
                if(component.isDrawable && component.isDrawable()){
                    this._m_Render.addDrawable(component);
                }

                // 检测是否为light类型组件
                if(component instanceof Light){
                    if(!this._m_LightIds[component.getId()]){
                        this._m_Lights.push(component);
                        this._m_LightIds[component.getId()] = component;
                    }
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
    _gatherVisDrawable(node, visDrawables){
        if(node.isDrawable && node.isDrawable()){
            visDrawables.push(node);
        }
        else{
            if(node.getChildren().length > 0){
                node.getChildren().forEach(c=>{
                    this._gatherVisDrawable(c, visDrawables);
                });
            }
        }
    }

    /**
     * 检测当前node是否处于Frustum中，如果是，递归其子节点继续判断，如果当前node已经是叶子节点(叶子节点理论上是Geometry或其子类，但也可以是一个node，如果是一个node叶子节点，表明空节点树)，则将其添加到visDrawables。<br/>
     * @param {Node}[node]
     * @param {Array}[visDrawables]
     * @private
     */
    _frustumCulling(node, visDrawables){
        // 检测视锥剔除
        if(!node.inFrustum(this._m_FrustumCullingCamera)){
            return;
        }

        // 判断是否为iDrawable
        if(node.isDrawable && node.isDrawable()){
            // 添加到visDrawable中,然后退出
            visDrawables.push(node);
        }
        else{
            // 执行子节点剔除
            if(node.getChildren().length > 0){
                let resetFrustumMask = this._m_FrustumCullingCamera.getFrustumMask();
                node.getChildren().forEach(node=>{
                    if(node.getFilterFlag() == Node.S_DYNAMIC){
                        // 检测是否需要默认剔除
                        if(node.getCullingFlags() & Node.S_DEFAULT_FRUSTUM_CULLING){
                            // 对于每个同级节点设置同样剔除掩码
                            this._m_FrustumCullingCamera.setFrustumMask(resetFrustumMask);
                            // 执行默认剔除
                            this._frustumCulling(node, visDrawables);
                        }
                    }
                    else if(node.getFilterFlag() == Node.S_NEVER){
                        // 直接渲染
                        this._gatherVisDrawable(node, visDrawables);
                    }
                });
            }
        }
    }
    update(exTime){
        // 执行所有更新队列
        this.runTasks();
        // 通知所有观察者
        this.fire('update', [exTime]);
        // 然后执行其他操作
    }
    render(exTime){
        // 更新visDrawables
        let visDrawables = this._m_Render.getVisDrawables();
        // 最快的清楚方式
        visDrawables.length = 0;
        // 通知一帧开始
        this.fire('render', [exTime]);

        // 然后更新visDrawables
        this._m_Nodes.forEach(node=>{
            if(node.getFilterFlag() == Node.S_DYNAMIC){
                // 检测是否执行默认视锥剔除
                if(node.getCullingFlags() & Node.S_DEFAULT_FRUSTUM_CULLING){
                    // 需要执行默认视锥剔除
                    this._m_FrustumCullingCamera.setFrustumMask(0);
                    this._frustumCulling(node, visDrawables);
                }
            }
            else if(node.getFilterFlag() == Node.S_NEVER){
                // 直接渲染
                this._gatherVisDrawable(node, visDrawables);
            }
        });

        this._m_Render.render(exTime);
        // console.log("剔除:" + (this._m_Render._m_Drawables.length - visDrawables.length) + ";渲染:" + visDrawables.length);
    }

}
