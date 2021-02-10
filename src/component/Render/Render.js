/**
 * 渲染器用于管理渲染对象和执行渲染优化(如排序)，以及对渲染列表调用渲染绘制。<br/>
 * @author Kkk
 */
import FrameContext from "../WebGL/FrameContext.js";
import Component from "../Component.js";
import RenderState from "../WebGL/RenderState.js";

export default class Render extends Component{
    // 渲染路径
    static FORWARD = 'Forward';
    static DEFERRED_SHADING = 'DeferredShading';
    static DEFERRED_SHADING_G_BUFFER_PASS = "GBufferPass";
    static DEFERRED_SHADING_DEFERRED_SHADING_PASS = "DeferredShadingPass";
    static DEFERRED_SHADING_PASS_GROUP = [Render.DEFERRED_SHADING_G_BUFFER_PASS, Render.DEFERRED_SHADING_DEFERRED_SHADING_PASS];

    // Event
    // 一帧渲染开始
    static PRE_FRAME = "preFrame";
    // 获得待渲染列表后
    static POST_QUEUE = "postQueue";
    // 在一帧渲染提交后
    static POST_FRAME = "postFrame";


    getType(){
        return "Render";
    }
    constructor(owner, cfg) {
        super(owner, cfg);

        // 保存所有需要渲染的元素
        this._m_Drawables = [];
        this._m_DrawableIDs = {};

        this._m_FrameContext = new FrameContext();

        // 不透明队列的默认渲染状态
        this._m_OpaqueRenderState = new RenderState();
        // 半透明队列的默认渲染状态
        this._m_TranslucentRenderState = new RenderState();
        // 开启blend模式
        this._m_TranslucentRenderState.setFlag(RenderState.S_STATES[4], 'On');
        // 关闭深度写入
        this._m_TranslucentRenderState.setFlag(RenderState.S_STATES[1], 'Off');
        // 设置默认blend方程
    }

    /**
     * 返回上下文。<br/>
     * @return {FrameContext}
     */
    getFrameContext(){
        return this._m_FrameContext;
    }

    /**
     * 添加一个IDrawable对象,该对象必须实现IDrawable接口。<br/>
     * @param {IDrawable}[iDrawable]
     */
    addDrawable(iDrawable){
        // 每次添加一个drawable时,根据材质提前做好分区
        if(!this._m_DrawableIDs[iDrawable.getId()]){
            this._m_DrawableIDs[iDrawable.getId()] = iDrawable;
            this._m_Drawables.push(iDrawable);
        }
    }

    /**
     * 移除一个IDrawable对象,该对象必须实现IDrawable接口。<br/>
     * @param {IDrawable}[iDrawable]
     */
    removeDrawable(iDrawable){
        if(this._m_DrawableIDs[iDrawable.getId()]){
            this._m_DrawableIDs[iDrawable.getId()] = null;
            this._m_Drawables.remove(iDrawable);
        }
    }

    /**
     * 检测渲染状态切换。<br/>
     * @param {WebGLContext}[gl]
     * @param {RenderState}[renderState 目标渲染状态]
     * @param {RenderState}[currentRenderState 当前渲染状态]
     * @private
     */
    _checkRenderState(gl, renderState, currentRenderState){
        let state = renderState.getState();
        for(let k in state){
            if(currentRenderState.getFlag(k) != state[k]){
                // 更新状态机
                // console.log("更新渲染状态[" + k + ":" + currentRenderState.getFlag(k) + "=>" + state[k] + "]");
                currentRenderState.setFlag(k, state[k]);
                switch (k) {
                    case RenderState.S_STATES[0]:
                        switch (state[k]) {
                            case RenderState.S_FACE_CULL_BACK:
                                gl.enable(gl.CULL_FACE);
                                gl.cullFace(gl.BACK);
                                break;
                            case RenderState.S_FACE_CULL_FRONT:
                                gl.enable(gl.CULL_FACE);
                                gl.cullFace(gl.FRONT);
                                break;
                            case RenderState.S_FACE_CULL_FRONT_AND_BACK:
                                gl.enable(gl.CULL_FACE);
                                gl.cullFace(gl.FRONT_AND_BACK);
                                break;
                            case RenderState.S_FACE_CULL_OFF:
                                gl.disable(gl.CULL_FACE);
                                break;
                        }
                        break;
                    case RenderState.S_STATES[1]:
                        if(state[k] == 'On'){
                            gl.depthMask(true);
                        }
                        else if(state[k] == 'Off'){
                            gl.depthMask(false);
                        }
                        break;
                    case RenderState.S_STATES[2]:
                        if(state[k] == 'On'){
                            gl.colorMask(true, true, true, true);
                        }
                        else if(state[k] == 'Off'){
                            gl.colorMask(false, false, false, false);
                        }
                        break;
                    case RenderState.S_STATES[3]:
                        if(state[k] == 'On'){
                            gl.enable(gl.DEPTH_TEST);
                        }
                        else if(state[k] == 'Off'){
                            gl.disable(gl.DEPTH_TEST);
                        }
                        break;
                }
            }
        }
    }
    // 后期开发渲染路径模块时,把_draw2开发完成然后删掉_draw函数
    _draw(exTime){
        // 一帧的开始
        this.fire(Render.PRE_FRAME, [exTime]);
        // 视锥剔除,遮挡查询
        // 从所有可见drawable列表中,进行剔除,得到剔除后的列表
        // 这里暂时还没实现剔除,所以直接就是全部的drawables
        let visDrawables = this._m_Drawables;

        // 按材质分类
        // 1.实时创建分类列表
        // 2.另一种方案是,在添加和删除一个drawable的函数中提前分类材质
        // 然后在剔除阶段设置每个drawable的cull标记
        // 然后在路径渲染时根据cull跳过,这样虽然会遍历所有材质的所有几何,但是可以避免实时创建分类列表
        // 暂时使用方法1
        let hasOpaque = false;
        let hasTranslucent = false;
        let matDrawables = {};
        // 不透明队列
        let opaqueBucket = {};
        // 半透明队列
        let translucentBucket = {};
        visDrawables.forEach(drawable=>{
            if(!matDrawables[drawable.getMaterial().getId()]){
                matDrawables[drawable.getMaterial().getId()] = [];
            }
            matDrawables[drawable.getMaterial().getId()].push(drawable);
            if(drawable.isOpaque()){
                hasOpaque = true;
                if(!opaqueBucket[drawable.getMaterial().getId()]){
                    opaqueBucket[drawable.getMaterial().getId()] = [];
                }
                opaqueBucket[drawable.getMaterial().getId()].push(drawable);
            }
            else if(drawable.isTranslucent()){
                hasTranslucent = true;
                if(!translucentBucket[drawable.getMaterial().getId()]){
                    translucentBucket[drawable.getMaterial().getId()] = [];
                }
                translucentBucket[drawable.getMaterial().getId()].push(drawable);
            }
        });

        // 排队,各种剔除之后(考虑设计一个RenderQueue,保存剔除后的待渲染的不透明，半透明，透明列表，然后作为参数传递到postQueue中)
        this.fire(Render.POST_QUEUE,[exTime]);

        let gl = this._m_Scene.getCanvas().getGLContext();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // 不透明物体渲染默认默认开启深度测试,深度写入(但是仍然可以通过具体的SubPass控制渲染状态)
        if(hasOpaque){
            this._checkRenderState(gl, this._m_OpaqueRenderState, this._m_FrameContext.getRenderState());
        }
        // 延迟路径部分...
        for(let matId in opaqueBucket){
            opaqueBucket[matId].forEach(geo=>{
                // 获取当前选中的技术
                let mat = this._m_Scene.getComponent(matId);
                let currentTechnology = mat.getCurrentTechnology();
                // 获取当前技术所有DeferredShading路径下的SubShaders
                let deferredShadingSubShaders = currentTechnology.getSubShaders(Render.DEFERRED_SHADING);
                // 如果该物体存在DeferredShading路径渲染的需要,则执行DeferredShading渲染
                if(deferredShadingSubShaders){
                    // 获取GBuffPass
                    // 执行渲染
                    for(let subShader in Render.DEFERRED_SHADING_PASS_GROUP){
                        // 检测是否需要切换FrameBuffer
                        // 检测是否需要更新渲染状态
                        if(deferredShadingSubShaders[subShader].renderState){
                            // 依次检测所有项
                            this._checkRenderState(gl, deferredShadingSubShaders[subShader].renderState, this._m_FrameContext.getRenderState());
                        }
                        // 指定subShader
                        mat._selectSubShader(deferredShadingSubShaders[subShader].subShader);
                        geo.draw(this._m_FrameContext);
                    }
                }
            });
        }

        // 正向路径部分...
        // 先渲染不透明队列
        for(let matId in opaqueBucket){
            opaqueBucket[matId].forEach(geo=>{
                // 获取当前选中的技术
                let mat = this._m_Scene.getComponent(matId);
                let currentTechnology = mat.getCurrentTechnology();
                // 获取当前技术所有Forward路径下的SubShaders
                let forwardSubShaders = currentTechnology.getSubShaders(Render.FORWARD);
                // 如果该物体存在Forward路径渲染的需要,则执行Forward渲染
                if(forwardSubShaders){
                    // 执行渲染
                    for(let subShader in forwardSubShaders){
                        // 检测是否需要更新渲染状态
                        if(forwardSubShaders[subShader].renderState){
                            // 依次检测所有项
                            this._checkRenderState(gl, forwardSubShaders[subShader].renderState, this._m_FrameContext.getRenderState());
                        }
                        // 指定subShader
                        mat._selectSubShader(forwardSubShaders[subShader].subShader);
                        geo.draw(this._m_FrameContext);
                    }
                }
            });
        }
        // 接着渲染半透明队列
        // 半透明物体默认关闭深度写入(但是仍然可通过具体的SubPass控制渲染状态)
        if(hasTranslucent){
            this._checkRenderState(gl, this._m_TranslucentRenderState, this._m_FrameContext.getRenderState());
            // 排序半透明队列
            // 这里有个问题,可以按照材质组作为整体组进行排序
            // 也可分开成独立物体进行排序
            // 由于默认关闭了深度写入,所有理论上所有面片都会渲染
        }
        for(let matId in translucentBucket){
            translucentBucket[matId].forEach(geo=>{
                // 获取当前选中的技术
                let mat = this._m_Scene.getComponent(matId);
                let currentTechnology = mat.getCurrentTechnology();
                // 获取当前技术所有Forward路径下的SubShaders
                let forwardSubShaders = currentTechnology.getSubShaders(Render.FORWARD);
                // 如果该物体存在Forward路径渲染的需要,则执行Forward渲染
                if(forwardSubShaders){
                    // 执行渲染
                    for(let subShader in forwardSubShaders){
                        // 检测是否需要更新渲染状态
                        if(forwardSubShaders[subShader].renderState){
                            // 依次检测所有项
                            this._checkRenderState(gl, forwardSubShaders[subShader].renderState, this._m_FrameContext.getRenderState());
                        }
                        // 指定subShader
                        mat._selectSubShader(forwardSubShaders[subShader].subShader);
                        geo.draw(this._m_FrameContext);
                    }
                }
            });
        }

        // 一帧结束后
        this.fire(Render.POST_FRAME, [exTime]);
    }
    // _draw(exTime){
    //     // 一帧的开始
    //     this.fire('preFrame', [exTime]);
    //
    //     // 重置上下文信息
    //     this._m_FrameContext.reset();
    //     // 半透明列表
    //     let translucentBucket = [];
    //     // 透明列表
    //     let transparentBucket = [];
    //     // 绘制渲染列表
    //
    //     // 排队,各种剔除之后(考虑设计一个RenderQueue,保存剔除后的待渲染的不透明，半透明，透明列表，然后作为参数传递到postQueue中)
    //     this.fire('postQueue',[exTime]);
    //
    //     let gl = this._m_Scene.getCanvas().getGLContext();
    //     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //
    //
    //     // 1.首先绘制不透明元素,把半透明和透明分别归入不同的列表中,在后一个步骤中渲染。
    //     this._m_Drawables.forEach(iDrawable=>{
    //         // 绘制不透明元素
    //         if(iDrawable.isOpaque()){
    //             iDrawable.draw(this._m_FrameContext);
    //         }
    //         else if(iDrawable.isTranslucent()){
    //             // 添加到半透明列表
    //             translucentBucket.push(iDrawable);
    //         }
    //         else if(iDrawable.isTransparent()){
    //             // 添加到透明列表
    //             transparentBucket.push(iDrawable);
    //         }
    //     });
    //     // 2.绘制半透明列表
    //     // 设置gl状态机,开始混合模式
    //     for(let iDrawable in translucentBucket){
    //
    //     }
    //     // 3.绘制透明列表
    //     for(let iDrawable in transparentBucket){
    //
    //     }
    //
    //     // 一帧结束后
    //     this.fire('postFrame', [exTime]);
    // }

    /**
     * 执行渲染调用,先判断是否需要重新构建渲染列表,然后判断是否需要优化排序,以便把所有材质一致的渲染元素排列在一起,加速渲染调用。<br/>
     * @param exTime
     */
    render(exTime){
        if(true){
            this._draw(exTime);
        }
    }

    /**
     * 排序渲染列表,这里根据材质对象进行优化排序渲染列表,以便加速渲染调用。<br/>
     * @private
     */
    _sortDrawList(){

    }

}
