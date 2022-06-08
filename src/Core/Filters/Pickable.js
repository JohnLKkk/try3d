import Filter from "./Filter.js";
import FrameBuffer from "../WebGL/FrameBuffer.js";
import Material from "../Material/Material.js";
import MaterialDef from "../Material/MaterialDef.js";
import Internal from "../Render/Internal.js";
import Camera from "../Scene/Camera.js";
import RenderState from "../WebGL/RenderState.js";
import Vec4Vars from "../WebGL/Vars/Vec4Vars.js";
import Events from "../Util/Events.js";

/**
 * Pickable用于提供拾取操作的功能，包含两个部分，生成拾取数据和绘制拾取数据，绘制拾取数据可以使用材质参数验收forward管线渲染,也可以在postFrame阶段以后处理方式<br/>
 * 进行，为了能够在不同管线下兼容，并且为了不添加多余的强制材质参数。<br/>
 * 最后决定将Pickable作为单独的Filter,将Outline作为单独的Filter。<br/>
 * @author Kkk
 * @date 2022年6月6日17点05分
 */
export default class Pickable extends Filter{
    static S_PARAM_ID = 'id';
    static S_EVENT_PICK_LISTENER = 'S_EVENT_PICK_LISTENER';
    // PickableMat
    _m_PickableMat;
    _m_PickableFB;
    _m_PickableDrawables = [];
    _m_PickableDrawableMap = {};
    _m_PickableResults = [];
    _m_PickStart;
    _m_PickPointer;
    _m_PickCamera;
    _m_PickableRenderState = new RenderState();

    // pickable Range
    _m_PickLeft;
    _m_PickBottom;
    _m_PickWidth;
    _m_PickHeight;

    // listener
    _m_Events;
    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_PickStart = false;
        this._m_PickPointer = {x:0,y:0};
        this._m_PickableMat = new Material(this._m_Scene, {id:'pickableMat', materialDef:MaterialDef.parse(Internal.S_PICKABLE_DEF_DATA)});


        const gl = this._m_Scene.getCanvas().getGLContext();
        this._m_PickableFB = new FrameBuffer(gl, 'PickableFB', 1, 1);
        this._m_PickableFB.addTexture(gl, 'PickableFBDefaultColorAttachment', gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT0, false);
        this._m_PickableFB.addTexture(gl, "PickableFBDefaultDepthAttachment", gl.DEPTH_COMPONENT16, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, gl.DEPTH_ATTACHMENT, false);
        this._m_PickableFB.finish(gl, this._m_Scene, false);

        this._m_PickCamera = new Camera(this._m_Scene, {id:'pickableCamera'});

        this._m_Events = new Events();
    }

    /**
     * 注册观察者
     * @param {Object}[event 事件类型]
     * @param {Object}[callback 观察者]
     * @param {Object}[object 可选]
     */
    on(event, callback, object){
        this._mEvents.register(event, callback, object);
    }

    /**
     * 移除一个观察者
     * @param {Object}[event 事件类型]
     * @param {Object}[callback 观察者]
     * @param {Object}[object 可选]
     */
    off(event, callback, object){
        this._mEvents.unregister(event, callback, object);
    }

    /**
     * 屏幕空间(x,y)坐标。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     */
    pick(x, y){
        this._m_PickStart = true;

        let mainCamera = this._m_Scene.getMainCamera();
        let canvas = this._m_Scene.getCanvas();
        const aspect = canvas.getWidth() / canvas.getHeight();
        const top = Math.tan(mainCamera.getFovy() * 0.5) * mainCamera.getNear();
        const bottom = -top;
        const left = aspect * bottom;
        const right = aspect * top;
        const width = Math.abs(right - left);
        const height = Math.abs(top - bottom);

        y = canvas.getHeight() - y - 1;
        this._m_PickPointer.x = x, this._m_PickPointer.y = y;

        this._m_PickWidth = width / canvas.getWidth();
        this._m_PickHeight = height / canvas.getHeight();
        this._m_PickLeft = left + x * this._m_PickWidth;
        this._m_PickBottom = bottom + y * this._m_PickHeight;
    }

    /**
     * 收集可拾取物体列表。<br/>
     * @private
     */
    _gatherPickables(){
        let visDrawables = this._m_Scene.getRender().getVisDrawables();
        this._m_PickableDrawables.length = 0;
        visDrawables.forEach(drawable=>{
            if(drawable.isPickable && drawable.isPickable()){
                // 收集
                this._m_PickableDrawables.push(drawable);
                this._m_PickableDrawableMap[drawable.getDrawableId()] = drawable;
            }
        });
    }

    preFrame(){
        // 只在pick时执行绘制
        if(this._m_PickStart){
            this._m_PickStart = false;
            this._gatherPickables();
            if(this._m_PickableDrawables.length){
                // 保存状态
                let render = this._m_Scene.getRender();
                let mainCamera = this._m_Scene.getMainCamera();
                let frameContext = render.getFrameContext();
                const gl = this._m_Scene.getCanvas().getGLContext();
                frameContext.getRenderState().store();
                // render._checkRenderState(gl, this._m_PickableRenderState, frameContext.getRenderState());
                let clearColor = this._m_Scene.getCanvas().getClearColor();

                // pick drawing...
                this._m_PickCamera.setFrustum(this._m_PickLeft, this._m_PickLeft + this._m_PickWidth, this._m_PickBottom + this._m_PickHeight, this._m_PickBottom, mainCamera.getNear(), mainCamera.getFar());
                this._m_PickCamera.setViewMatrix(mainCamera.getViewMatrix());
                this._m_Scene.setMainCamera(this._m_PickCamera);
                this._m_PickableFB.use(render);
                this._m_Scene.getCanvas().setClearColor(0, 0, 0, 1);
                this._m_PickableFB.clear(gl);
                let drawableId = null;
                this._m_PickableDrawables.forEach(iDrawable=>{
                    // set PickDrawableId
                    drawableId = iDrawable.getDrawableId();
                    this._m_PickableMat.setParam(Pickable.S_PARAM_ID, new Vec4Vars().valueFromXYZW(
                        ((drawableId >>  0) & 0xFF) / 0xFF,
                        ((drawableId >>  8) & 0xFF) / 0xFF,
                        ((drawableId >> 16) & 0xFF) / 0xFF,
                        ((drawableId >> 24) & 0xFF) / 0xFF
                    ));
                    // 由于这里使用同一个材质实例来执行pickdrawing,所有更新参数后需要强制上载一次
                    render.useForcedMat('PreFrame', this._m_PickableMat, 0);
                    iDrawable.draw(frameContext);
                });
                let pick = this._m_PickableFB.readPixels(gl, '', gl.RGBA, gl.UNSIGNED_BYTE, 0, 0, 1, 1);
                const id = pick[0] + (pick[1] << 8) + (pick[2] << 16) + (pick[3] << 24);
                let pickResult = this._m_PickableDrawableMap[id];
                if(pickResult){
                    console.log('pickResult:' + id);
                    this._mEvents.trigger(Pickable.S_EVENT_PICK_LISTENER, [id, pickResult]);
                }

                // 恢复状态
                this._m_Scene.getCanvas().setClearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
                this._m_Scene.setMainCamera(mainCamera);
                this._m_Scene.getRender().useDefaultFrame();
                render.setViewPort(gl, 0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight());
                render._checkRenderState(gl, frameContext.getRenderState().restore(), frameContext.getRenderState());
            }
        }
    }

}
