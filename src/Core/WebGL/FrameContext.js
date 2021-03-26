/**
 * 保存一些帧上下文信息,以便在渲染时进行传递访问。<br/>
 * 同时为了减少对GL的API访问,使用状态机记录加速渲染调用。<br/>
 * @author Kkk
 */
import RenderState from "./RenderState.js";

export default class FrameContext {
    constructor() {
        this.m_LastMaterial = null;
        this.m_LastIDrawable = null;
        this.m_LastSubShader = null;
        this.m_LastSubShaderId = null;
        this.m_LastFrameBuffer = null;
        // 统计
        // 每帧切换的材质
        this.m_SM = 0;
        // 每帧切换的shader
        this.m_SS = 0;
        // 默认帧缓存(只存在forward渲染路径时,为null,否则创建一个fbo)
        this._m_DefaultFrameBuffer = null;
        // 当前需要的上下文
        this.m_Contexts = {};
        // 保存已计算的当前需要的上下文变量
        this.m_CalcContexts = {};
        // 渲染状态
        this.m_RenderState = new RenderState();
        // 渲染frameBuffer(key:id,value:fb}
        this.m_FrameBuffers = {};
        // 内存中所有的shader
        this.m_Shaders = {};
        // 内存中所有的Blocks
        this._m_ContextBlocks = {};
    }

    /**
     * 返回当前上下文block。<br/>
     * @param {String}[id]
     * @return {*}
     */
    getContextBlock(id){
        return this._m_ContextBlocks[id];
    }

    /**
     * 添加一个上下文block。<br/>
     * @param {String}[id]
     * @param {Object}[block]
     */
    addContextBlock(id, block){
        this._m_ContextBlocks[id] = block;
    }

    /**
     * 返回指定的frameBuffer。<br/>
     * @param {String}[id]
     * @return {*}
     */
    getFrameBuffer(id){
        return this.m_FrameBuffers[id];
    }

    /**
     * 添加指定的frameBuffer。<br/>
     * @param {String}[id]
     * @param {*}[fb]
     */
    addFrameBuffer(id, fb){
        this.m_FrameBuffers[id] = fb;
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
        this.m_LastMaterial = null;
        this.m_LastSubShader = null;
        this.m_LastSubShaderId = null;
        this.m_LastFrameBuffer = null;
        this.m_SM = 0;
        this.m_SS = 0;
    }

}
