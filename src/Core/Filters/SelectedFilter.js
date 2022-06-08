import Filter from "./Filter.js";
import Material from "../Material/Material.js";
import MaterialDef from "../Material/MaterialDef.js";
import Internal from "../Render/Internal.js";
import RenderState from "../WebGL/RenderState.js";
import Geometry from "../Node/Geometry.js";
import MeshFactor from "../Util/MeshFactor.js";
import AABBBoundingBox from "../Math3d/Bounding/AABBBoundingBox.js";
import Vector3 from "../Math3d/Vector3.js";

/**
 * SelectedFilter定义了用于绘制某个物体标记为选中的功能。<br/>
 * @author Kkk
 * @date 2022年6月8日12点43分
 */
export default class SelectedFilter extends Filter{
    // 边框模式选中
    static S_SELECTED_MODE_BOUNDING = 'S_SELECTED_MODE_BOUNDING';
    // 外轮廓模式选中
    static S_SELECTED_MODE_OUTLINE = 'S_SELECTED_MODE_OUTLINE';
    // 自定义模式选中
    static S_SELECTED_MODE_CUSTOM = 'S_SELECTED_MODE_CUSTOM';

    _m_SelectedMat;
    _m_SelectedDrawables;
    _m_SelectedMode = SelectedFilter.S_SELECTED_MODE_BOUNDING;
    _m_SelectedRenderState = new RenderState();

    _m_SelectedBoundingBox;

    // temp
    _m_TempVec30; _m_TempVec31; _m_TempVec32;
    constructor(owner, cfg) {
        super(owner, cfg);

        this._m_SelectedDrawables = [];
        this._m_SelectedMat = new Material(this._m_Scene, {id:'defaultSelectedMat', materialDef:MaterialDef.parse(Internal.S_SELECTED_FILTER_DEF_DATA)});
        // this._m_SelectedRenderState.setFlag(RenderState.S_STATES[0], RenderState.S_FACE_CULL_FRONT);
        this._m_SelectedRenderState.setFlag(RenderState.S_STATES[1], 'Off');
        this._m_SelectedRenderState.setFlag(RenderState.S_STATES[3], 'On');
        // this._m_SelectedRenderState.setFlag(RenderState.S_STATES[8], 'LEQUAL');

        // 目前仅支持边框选中模式
        if(this._m_SelectedMode == SelectedFilter.S_SELECTED_MODE_BOUNDING){
            this._m_TempVec30 = new Vector3();
            this._m_TempVec31 = new Vector3();
            this._m_TempVec32 = new Vector3();
            this._m_SelectedBoundingBox = new Geometry(this._m_Scene, {id:MeshFactor.nextId() + "_oct"});
            this._m_SelectedBoundingBox.setIsPickable(false);
            let tempAABB = new AABBBoundingBox();
            tempAABB.setHalfInXYZ(1, 1, 1);
            this._m_SelectedBoundingBox.setMesh(MeshFactor.createAABBBoundingBoxMeshFromAABBBoundingBox(tempAABB));
            this._m_SelectedBoundingBox.setMaterial(this._m_SelectedMat);
            this._m_SelectedBoundingBox.updateBound();
        }
    }

    /**
     * 返回材质。<br/>
     * @return {Material}
     */
    getMaterial(){
        return this._m_SelectedMat;
    }

    /**
     * 添加一个iDrawable到outlineDrawables中。<br/>
     * @param {Object}[iDrawable]
     */
    pushOutlineDrawable(iDrawable){
        this._m_SelectedDrawables.push(iDrawable);
    }

    /**
     * 清楚outlineDrawables。<br/>
     */
    clearOutlineDrawables(){
        this._m_SelectedDrawables.length = 0;
    }

    /**
     * 更新边界体。<br/>
     * @param {AABBBoundingBox}[boundingBox]
     * @private
     */
    _updateSelectedBoundingBox(boundingBox){
        // 计算scale
        let min = boundingBox.getMin(this._m_TempVec30);
        let max = boundingBox.getMax(this._m_TempVec31);
        let d = max.sub(min, this._m_TempVec32).multLength(0.5, this._m_TempVec30);
        this._m_SelectedBoundingBox.setLocalScale(d);
        // 计算平移
        this._m_SelectedBoundingBox.setLocalTranslation(boundingBox.getCenter());
    }

    /**
     * 执行postFilter阶段。<br/>
     */
    postFilter(){
        if(this._m_SelectedDrawables.length && this._m_SelectedMode == SelectedFilter.S_SELECTED_MODE_BOUNDING){
            // 保存状态
            let render = this._m_Scene.getRender();
            let mainCamera = this._m_Scene.getMainCamera();
            let frameContext = render.getFrameContext();
            const gl = this._m_Scene.getCanvas().getGLContext();
            frameContext.getRenderState().store();
            // outline
            render._checkRenderState(gl, this._m_SelectedRenderState, frameContext.getRenderState());
            gl.enable(gl.DEPTH_TEST);
            render.useForcedMat('PostFilter', this._m_SelectedMat, 0);
            this._m_SelectedDrawables.forEach(iDrawable=>{
                // this._m_SelectedBoundingBox.getWorldMatrix().set(iDrawable.getWorldMatrix());
                this._updateSelectedBoundingBox(iDrawable.getBoundingVolume());
                this._m_SelectedBoundingBox.draw(frameContext);
                // iDrawable.draw(frameContext);
            });
            // 恢复状态
            // this._m_Scene.setMainCamera(mainCamera);
            // this._m_Scene.getRender().useDefaultFrame();
            render.setViewPort(gl, 0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight());
            render._checkRenderState(gl, frameContext.getRenderState().restore(), frameContext.getRenderState());
        }
    }

}
