import BasicShadowProcess from "./BasicShadowProcess.js";
import Log from "../Util/Log.js";
import Camera from "../Scene/Camera.js";
import Tools from "../Util/Tools.js";
import Vector3 from "../Math3d/Vector3.js";
import Shadow from "./Shadow.js";
import Vector4 from "../Math3d/Vector4.js";
import Node from "../Node/Node.js";
import ShaderSource from "../WebGL/ShaderSource.js";

/**
 * DirectionalLightShadowProcess基于Parallel Split Shadows Mapping实现。具体参考:<br/>
 * <a href="https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch10.html">https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch10.html</a><br/>
 * @author Kkk
 * @date 2021年9月15日11点26分
 */
export default class DirectionalLightShadowProcess extends BasicShadowProcess{
    // PSSM分割级别（rgba分别存储各级别信息）
    _m_SplitsVec4 = new Vector4();
    // PSSM分区数据
    _m_SplitsArray = null;
    // 光锥视点
    _m_ShadowCam = null;
    // 覆盖光锥的8个顶点
    _m_Points = new Array(8);
    // 临时变量
    _m_TempVec3 = new Vector3();
    _m_Lambda = 0.65;
    // 防止突然消失的阴影
    _m_Stabilize = true;

    /**
     * DirectionalLightShadowProcess。<br/>
     * @param {Comment}[owner]
     * @param {Number}[cfg.id]
     * @param {Number}[cfg.nbSplits]
     * @param {Number}[cfg.shadowMapSize]
     * @param {Boolean}[cfg.debug]
     * @param {Boolean}[cfg.backfaceShadows]
     */
    constructor(owner, cfg) {
        cfg.nbShadowMaps = cfg.nbSplits;
        super(owner, cfg);
        this.init(cfg.nbSplits, cfg.shadowMapSize);
    }
    init(nbSplits, shadowMapSize){
        // 最多4级分割
        this._m_NbShadowMaps = Math.max(Math.min(nbSplits, 4), 1);
        if(this._m_NbShadowMaps != nbSplits){
            Log.error('PSSM分割级别只能为1-4之间,指定的分割级别为:' + nbSplits);
        }
        this._m_SplitsArray = new Array(this._m_NbShadowMaps + 1);
        this._m_ShadowCam = new Camera(this._m_Scene, {id:'DirectionalLightShadowProcess_' + Tools.nextId(), width:shadowMapSize, height:shadowMapSize, fixedSize:true, parallelProjection:true});
        this._m_ShadowCam.setEye(new Vector3(0, 0, 0));
        for(let i = 0;i < 8;i++){
            this._m_Points[i] = new Vector3();
        }
    }
    initMat() {
        super.initMat();
        // 追加材质定义
        this._m_PostShadowMat.addDefine(ShaderSource.S_PSSM_SRC, false);
    }

    _uploadInfo(gl, frameContext){
        super._uploadInfo(gl, frameContext);
        // 更新PSSM信息
        let conVars = frameContext.m_LastSubShader.getContextVars();
        let rd = null;
        rd = conVars[BasicShadowProcess.S_LIGHT_DIR];
        if(rd){
            let dir = this._m_Light.getDirection();
            gl.uniform3f(rd.loc, dir._m_X, dir._m_Y, dir._m_Z);
        }
        rd = conVars[BasicShadowProcess.S_SPLITS];
        if(rd){
            gl.uniform4f(rd.loc, this._m_SplitsVec4._m_X, this._m_SplitsVec4._m_Y, this._m_SplitsVec4._m_Z, this._m_SplitsVec4._m_W);
        }
    }
    updateShadowCams(){
        if(this._m_Light == null){
            Log.warn('无效光源!');
            return;
        }
        const mainCamera = this._m_Scene.getMainCamera();

        let zFar = this._m_ZFarOverride;
        if(zFar == 0){
            zFar = mainCamera.getFar();
        }

        let zNear = Math.max(mainCamera.getNear(), 0.001);
        Shadow.calculateLightConeScope(mainCamera, zNear, zFar, 1.0, this._m_Points);

        this._m_ShadowCam.setFar(zFar);
        let e = this._m_ShadowCam.getEye();
        this._m_ShadowCam.lookAt(e, e.add(this._m_Light.getDirection(), this._m_TempVec3), this._m_ShadowCam.getUp());
        // 强制更新
        this._m_ShadowCam._updateFrustum();
        this._m_ShadowCam.forceUpdateProjection();
        this._m_ShadowCam.getProjectViewMatrix(true);

        Shadow.calculateSplits(this._m_SplitsArray, zNear, zFar, this._m_Lambda);

        if(mainCamera.isParallelProjection()){
            // 对于平行投影，shadow位置规范在[0,1]
            // 实际上对于DirectionalLight默认下就是平行投影
            // 但是为了灵活性，仍然根据实际情况进行归一化
            let fn = (zFar - zNear) * 1.0;
            for(let i = 0;i < this._m_NbShadowMaps;i++){
                this._m_SplitsArray[i] /= fn;
            }
        }

        switch (this._m_SplitsArray.length) {
            case 5:
                this._m_SplitsVec4._m_W = this._m_SplitsArray[4];
            case 4:
                this._m_SplitsVec4._m_Z = this._m_SplitsArray[3];
            case 3:
                this._m_SplitsVec4._m_Y = this._m_SplitsArray[2];
            case 2:
            case 1:
                this._m_SplitsVec4._m_X = this._m_SplitsArray[1];
                break;
        }
    }
    getShadowCam(shadowMapIndex){
        return this._m_ShadowCam;
    }
    getShadowGeometryCasts(shadowMapIndex, shadowGeometryCasts){
        // 计算当前ShadowMap下光锥边界体
        Shadow.calculateLightConeScope(this._m_MainCamera, this._m_SplitsArray[shadowMapIndex], this._m_SplitsArray[shadowMapIndex + 1], 1.0, this._m_Points);
        if(this._m_ShadowGeometryReceivers.length == 0){
            // 我们需要根据receivers集合来计算完整的casts集合
            // 简而言之,这里根据收集当前可见视锥下需要参与receiver的物体
            // 此时仅需从潜在可见集合中中计算子集
            Shadow.calculateGeometriesInFrustum(this._m_Scene.getRender().getVisDrawables(), this._m_MainCamera, Node.S_SHADOW_RECEIVE, this._m_ShadowGeometryReceivers);
        }
        Shadow.calculateShadowCamera(this._m_Scene.getSceneNodes(), this._m_ShadowGeometryReceivers, this._m_ShadowCam, this._m_Points, shadowGeometryCasts, this._m_Stabilize ? this._m_ShadowMapSize : 0.0);
        return shadowGeometryCasts;
    }
    getShadowGeometryReceivers(shadowGeometryReceivers){
        if(shadowGeometryReceivers.length == 0){
            Shadow.calculateGeometriesInFrustum(this._m_Scene.getRender().getVisDrawables(), this._m_MainCamera, Node.S_SHADOW_RECEIVE, shadowGeometryReceivers);
        }
    }
}
