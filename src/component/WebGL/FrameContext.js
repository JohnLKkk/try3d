/**
 * 保存一些帧上下文信息,以便在渲染时进行传递访问。<br/>
 * 同时为了减少对GL的API访问,使用状态机记录加速渲染调用。<br/>
 * @author Kkk
 */
import RenderState from "./RenderState.js";

export default class FrameContext {
    constructor() {
        this.m_LastMaterila = null;
        this.m_LastIDrawable = null;
        this.m_LastSubShader = null;
        // 当前需要的上下文
        this.m_Contexts = {};
        // 保存已计算的当前需要的上下文变量
        this.m_CalcContexts = {};
        // 渲染状态
        this.m_RenderState = new RenderState();
    }

    /**
     * 渲染状态。<br/>
     * @return {RenderState}
     */
    getRenderState(){
        return this.m_RenderState;
    }

    /**
     * 添加当前需要的上下文。<br/>
     * @param {String}[context]
     */
    addContext(context){
        this.m_Contexts[context] = true;
    }

    /**
     * 返回是否存在该上下文变量。<br/>
     * @param {String}[context]
     * @return {Boolean}
     */
    getContext(context){
        return this.m_Contexts[context];
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
     * 保存指定的上下文变量值。<br/>
     * @param {String}[name 变量名]
     * @param {Object}[value 值]
     */
    setCalcContext(name, value){
        this.m_CalcContexts[name] = value;
    }

    /**
     * 重置上下文信息。
     */
    reset(){

    }

}
