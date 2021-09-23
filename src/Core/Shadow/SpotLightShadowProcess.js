import BasicShadowProcess from "./BasicShadowProcess.js";
import Camera from "../Scene/Camera.js";
import Tools from "../Util/Tools.js";
import Vector3 from "../Math3d/Vector3.js";
import Log from "../Util/Log.js";
import Shadow from "./Shadow.js";
import MoreMath from "../Math3d/MoreMath.js";
import ShaderSource from "../WebGL/ShaderSource.js";

/**
 * SpotLightShadowProcess。<br/>
 * 用于实现SpotLight光源阴影。<br/>
 * @author Kkk
 * @date 2021年9月23日17点11分
 */
export default class SpotLightShadowProcess extends BasicShadowProcess{
    _m_ShadowCam;
    _m_Points = new Array(8);

    // 临时变量
    _m_TempVec3 = new Vector3();

    constructor(owner, cfg) {
        cfg.nbShadowMaps = 1;
        super(owner, cfg);
        this.init(cfg.shadowMapSize);
    }
    init(shadowMapSize){
        this._m_ShadowCam = new Camera(this._m_Scene, {id:this._m_Id + "_" + Tools.nextId(), width:shadowMapSize, height:shadowMapSize, fixedSize:true});
        for(let i = 0;i < 8;i++){
            this._m_Points[i] = new Vector3();
        }
    }
    initMat() {
        super.initMat();
        // 追加材质定义
        this._m_PostShadowMat.addDefine(ShaderSource.S_SPOTLIGHT_SHADOWS_SRC, false);
    }

    _uploadInfo(gl, frameContext){
        super._uploadInfo(gl, frameContext);
        // 更新SpotLight信息
        let conVars = frameContext.m_LastSubShader.getContextVars();
        let rd = null;
        rd = conVars[BasicShadowProcess.S_LIGHT_DIR];
        if(rd){
            let dir = this._m_Light.getDirection();
            gl.uniform3f(rd.loc, dir._m_X, dir._m_Y, dir._m_Z);
        }
        rd = conVars[BasicShadowProcess.S_LIGHT_POS];
        if(rd){
            let pos = this._m_Light.getPosition();
            gl.uniform3f(rd.loc, pos._m_X, pos._m_Y, pos._m_Z);
        }
    }

    getShadowCam(shadowMapIndex){
        return this._m_ShadowCam;
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

        this._m_ShadowCam.setFrustumPerspective(this._m_Light.getOuterAngle() * MoreMath.S_RAD_TO_DEG * 2.0, 1.0, 1.0, this._m_Light.getSpotRange());
        this._m_ShadowCam.lookAt(this._m_Light.getPosition(), this._m_Light.getPosition().add(this._m_Light.getDirection(), this._m_TempVec3), this._m_ShadowCam.getUp());
        // 强制更新
        this._m_ShadowCam._updateFrustum();
        this._m_ShadowCam.forceUpdateProjection();
        this._m_ShadowCam.getProjectViewMatrix(true);
    }

    getShadowGeometryCasts(shadowMapIndex, shadowGeometryCasts){
        // 从场景图中查找当前shadowCam要进行投射的物体
        let scenes = this._m_Scene.getSceneNodes();
        scenes.forEach(scene=>{
            Shadow.calculateNodeInFrustum(scene, this._m_ShadowCam, Node.S_SHADOW_CAST, shadowGeometryCasts);
        });
        return shadowGeometryCasts;
    }

}
