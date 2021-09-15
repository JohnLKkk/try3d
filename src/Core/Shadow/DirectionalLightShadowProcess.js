import BasicShadowProcess from "./BasicShadowProcess.js";
import Log from "../Util/Log.js";
import Vec4Vars from "../WebGL/Vars/Vec4Vars.js";
import Camera from "../Scene/Camera.js";
import Tools from "../Util/Tools.js";
import Vector3 from "../Math3d/Vector3.js";

/**
 * DirectionalLightShadowProcess基于Parallel Split Shadow Mapping实现。具体参考:<br/>
 * <a href="https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch10.html">https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch10.html</a><br/>
 * @author Kkk
 * @date 2021年9月15日11点26分
 */
export default class DirectionalLightShadowProcess extends BasicShadowProcess{
    // PSSM分割级别（rgba分别存储各级别信息）
    _m_Splits = new Vec4Vars();
    // PSSM分区数据
    _m_SplitsArray = null;
    // 光锥视点
    _m_ShadowCam = null;
    // 覆盖光锥的8个顶点
    _m_Points = new Array(8);
    // 临时变量
    _m_TempVec3 = new Vector3();
    constructor(owner, cfg) {
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
        this._m_ShadowCam.setFar(zFar);
        let e = this._m_ShadowCam.getEye();
        this._m_ShadowCam.lookAt(e, e.add(this._m_Light.getDirection(), this._m_TempVec3), this._m_ShadowCam.getUp());
        // 强制更新
        this._m_ShadowCam._updateFrustum();
        this._m_ShadowCam.getProjectViewMatrix(true);
    }
}
