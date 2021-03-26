/**
 * Filter。<br/>
 * 提供后处理。<br/>
 * @author Kkk
 * @date 2021年3月26日16点32分
 */
import Component from "../Component.js";
import Tools from "../Util/Tools.js";
import Picture from "../Node/Picture.js";

export default class Filter extends Component{
    constructor(owner, cfg) {
        super(owner, cfg);

        // Js的执行顺序,导致这里无法new FramePicture,所以这里new Picture
        this._m_FramePicture = new Picture(owner, {id:Tools.nextId()});
        this._m_PreFrames = [];
        this._m_PostFilters = [];
    }
    preFrame(renderQueue){
        let gl = this._m_Scene.getCanvas().getGLContext();
        // 只渲染当前可见物体,并只渲染包含指定pass的物体
        // 检测该物体是否包含指定pass
    }

    postFilter(){
        let gl = this._m_Scene.getCanvas().getGLContext();
        // 对屏幕帧进行处理
    }

    /**
     * 使用给定的材质创建一个Filter。<br/>
     * @param {Component}[owner]
     * @param {Material}[material]
     * @return {Filter}
     */
    static newFilterFromMaterial(owner, material){
        let filter = new Filter(owner, {id:Tools.nextId()});
        filter._m_FramePicture.setMaterial(material);
        return filter;
    }
}
