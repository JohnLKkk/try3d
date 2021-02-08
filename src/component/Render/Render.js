/**
 * 渲染器用于管理渲染对象和执行渲染优化(如排序)，以及对渲染列表调用渲染绘制。<br/>
 * @author Kkk
 */
import FrameContext from "../WebGL/FrameContext.js";
import Component from "../Component.js";

export default class Render extends Component{
    getType(){
        return "Render";
    }
    constructor(owner, cfg) {
        super(owner, cfg);

        // 保存所有需要渲染的元素
        this._m_Drawables = [];
        this._m_DrawableIDs = {};

        this._m_FrameContext = new FrameContext();
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
    // 后期开发渲染路径模块时,把_draw2开发完成然后删掉_draw函数
    // _draw2(exTime){
    //     // 视锥剔除,遮挡查询
    //     // 获取当前待渲染drawable列表
    //
    //     // 半透明桶(key : Material, value : List<Geometry>)
    //     let translucentBucket = new Map();
    //     // 透明桶
    //     let transparentBucket = new Map();
    //
    //     // 延迟路径部分...
    //
    //     // 正向路径部分...
    //     let forwardList = new Map();
    //     for(let mat in forwardList.keys()){
    //         for(let geo in forwardList.get(mat)){
    //             if(geo.isOpaque()){
    //                 // 获取当前选中的技术
    //                 let currentTechnology = mat.getCurrentTechnology();
    //                 // 获取当前技术所有Forward路径下的SubShaders
    //                 let forwardSubShaders = currentTechnology.getSubShaders('Forward');
    //                 if(forwardSubShaders){
    //                     // 执行渲染
    //                     for(let subShader in forwardSubShaders){
    //                         // 实用指定subShader
    //                         mat._selectSubShader(forwardSubShaders[subShader]);
    //                         geo.draw(this._m_FrameContext);
    //                     }
    //                 }
    //             }
    //             // 加入到对应的桶,以便后续渲染
    //         }
    //     }
    // }
    _draw(exTime){
        // 一帧的开始
        this.fire('preFrame', [exTime]);

        // 重置上下文信息
        this._m_FrameContext.reset();
        // 半透明列表
        let translucentBucket = [];
        // 透明列表
        let transparentBucket = [];
        // 绘制渲染列表

        // 排队,各种剔除之后(考虑设计一个RenderQueue,保存剔除后的待渲染的不透明，半透明，透明列表，然后作为参数传递到postQueue中)
        this.fire('postQueue',[exTime]);

        let gl = this._m_Scene.getCanvas().getGLContext();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        // 1.首先绘制不透明元素,把半透明和透明分别归入不同的列表中,在后一个步骤中渲染。
        this._m_Drawables.forEach(iDrawable=>{
            // 绘制不透明元素
            if(iDrawable.isOpaque()){
                iDrawable.draw(this._m_FrameContext);
            }
            else if(iDrawable.isTranslucent()){
                // 添加到半透明列表
                translucentBucket.push(iDrawable);
            }
            else if(iDrawable.isTransparent()){
                // 添加到透明列表
                transparentBucket.push(iDrawable);
            }
        });
        // 2.绘制半透明列表
        // 设置gl状态机,开始混合模式
        for(let iDrawable in translucentBucket){

        }
        // 3.绘制透明列表
        for(let iDrawable in transparentBucket){

        }

        // 一帧结束后
        this.fire('postFrame', [exTime]);
    }

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
