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
    static S_PRE_FRAME_FILTER = "PreFrame";
    static S_POST_FILTER = "PostFilter";
    constructor(owner, cfg) {
        super(owner, cfg);
        // 由于js的缺陷,必须在这里实现继承,防止Component初始化导致无法访问继承的FilterFramePicture
        class FilterFramePicture extends Picture{
            getType() {
                return 'FramePicture';
            }

            constructor(owner, cfg) {
                super(owner, cfg);
            }
            isFramePicture(){
                return true;
            }
        }
        this._m_Enable = true;
        // Js的执行顺序,导致这里无法new FramePicture,所以这里new Picture
        this._m_FramePicture = new FilterFramePicture(owner, {id:Tools.nextId()});
        this._m_PreFrames = null;
        this._m_PostFilters = null;
    }

    /**
     * 准备就绪。<br/>
     */
    finish(){
        this._init();
    }

    /**
     * 初始化。<br/>
     * @private
     */
    _init(){
        if(this._m_FramePicture.getMaterial().getCurrentTechnology().getSubPasss(Filter.S_PRE_FRAME_FILTER)){
            this._m_PreFrames = {};
            this._m_PostFilters[this._m_FramePicture.getMaterial().getId()] = [];
            this._m_PostFilters[this._m_FramePicture.getMaterial().getId()].push(this._m_FramePicture);
        }
        if(this._m_FramePicture.getMaterial().getCurrentTechnology().getSubPasss(Filter.S_POST_FILTER)){
            this._m_PostFilters = {};
            this._m_PostFilters[this._m_FramePicture.getMaterial().getId()] = [];
            this._m_PostFilters[this._m_FramePicture.getMaterial().getId()].push(this._m_FramePicture);
        }
    }

    /**
     * 执行preFrame阶段。<br/>
     * @param {RenderQueue}[renderQueue]
     */
    preFrame(renderQueue){
        if(this._m_PreFrames){
            // 渲染指定pass
        }
    }

    /**
     * 执行postFilter阶段。<br/>
     */
    postFilter(){
        if(this._m_PostFilters){
            let gl = this._m_Scene.getCanvas().getGLContext();
            this._m_Scene.getRender().draw(gl, Filter.S_POST_FILTER, this._m_PostFilters);
        }
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
        filter.finish();
        return filter;
    }

    /**
     * 是否激活该Filter。<br/>
     * @return {Boolean}
     */
    isEnable(){
        return this._m_Enable;
    }

    /**
     * 激活该Filter。<br/>
     */
    enable(){
        this._m_Enable = true;
    }

    /**
     * 禁用该Filter。<br/>
     */
    disable(){
        this._m_Enable = false;
    }
}

