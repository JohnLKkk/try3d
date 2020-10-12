/**
 * 保存一些帧上下文信息,以便在渲染时进行传递访问。<br/>
 * 同时为了减少对GL的API访问,使用状态机记录加速渲染调用。<br/>
 * @author Kkk
 */
export default class FrameContext {
    constructor() {
        this.m_LastMaterila = null;
        this.m_LastIDrawable = null;
    }

    /**
     * 重置上下文信息。
     */
    reset(){

    }

}