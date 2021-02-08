/**
 * 保存一些帧上下文信息,以便在渲染时进行传递访问。<br/>
 * 同时为了减少对GL的API访问,使用状态机记录加速渲染调用。<br/>
 * @author Kkk
 */
export default class FrameContext {
    constructor() {
        this.m_LastMaterila = null;
        this.m_LastIDrawable = null;
        this.m_LastSubShader = null;
        // 保持上下文变量
        this.m_CalcContexts = {};
    }

    /**
     * 返回上下文变量值列表。<br/.
     * @return {{}|*}
     */
    getCalcContexts(){
        return this.m_CalcContexts;
    }

    /**
     * 返回指定的上下文变量值。<br/>
     * @param {String}[name 变量名]
     * @return {*}
     */
    getCalcContext(name){
        return this.m_CalcContexts[name];
    }

    /**
     * 重置上下文信息。
     */
    reset(){

    }

}
