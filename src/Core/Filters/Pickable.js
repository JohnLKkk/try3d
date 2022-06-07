import Filter from "./Filter.js";
import FrameBuffer from "../WebGL/FrameBuffer.js";
import Material from "../Material/Material.js";
import MaterialDef from "../Material/MaterialDef.js";
import Internal from "../Render/Internal.js";

/**
 * Pickable用于提供拾取操作的功能，包含两个部分，生成拾取数据和绘制拾取数据，绘制拾取数据可以使用材质参数验收forward管线渲染,也可以在postFrame阶段以后处理方式<br/>
 * 进行，为了能够在不同管线下兼容，并且为了不添加多余的强制材质参数。<br/>
 * @author Kkk
 * @date 2022年6月6日17点05分
 */
export default class Pickable extends Filter{
    // PickableMat
    _m_PickableMat;
    _m_PickableFB;
    _m_PickableDrawables = [];
    _m_PickableDrawableMap = {};
    _m_PickableResults = [];
    _m_PickStart;
    _m_PickPointer;
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
    }

    /**
     * 屏幕空间(x,y)坐标。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     */
    pick(x, y){
        this._m_PickStart = true;
        this._m_PickPointer.x = x, this._m_PickPointer.y = y;
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
                // pick...
            }
        }
    }

}
