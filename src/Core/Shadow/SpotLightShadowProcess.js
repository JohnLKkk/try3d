import BasicShadowProcess from "./BasicShadowProcess.js";
import Camera from "../Scene/Camera.js";
import Node from "../Node/Node.js";
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
    _m_OutAngle = -1;
    _m_SpotRange = -1;
    _m_Position = new Vector3();
    _m_Direction = new Vector3();
    _m_UpdateCasterCam = false;

    // 临时变量
    _m_TempVec3 = new Vector3();

    constructor(owner, cfg) {
        cfg.nbShadowMaps = 1;
        super(owner, cfg);
        this.init(cfg.shadowMapSize);
    }
    init(shadowMapSize){
        this._m_ShadowCam = new Camera(this._m_Scene, {id:this._m_Id + "_" + Tools.nextId(), width:shadowMapSize, height:shadowMapSize, fixedSize:true});
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
        if(this._m_OutAngle != this._m_Light.getOuterAngle() || this._m_SpotRange != this._m_Light.getSpotRange() || !this._m_Position.equals(this._m_Light.getPosition()) || !this._m_Direction.equals(this._m_Light.getDirection())){
            this._m_OutAngle = this._m_Light.getOuterAngle();
            this._m_SpotRange = this._m_Light.getSpotRange();
            this._m_Position.setTo(this._m_Light.getPosition());
            this._m_Direction.setTo(this._m_Light.getDirection());
            this._m_ShadowCam.setFrustumPerspective(this._m_OutAngle * MoreMath.S_RAD_TO_DEG * 2.0, 1.0, 1.0, this._m_SpotRange);
            this._m_ShadowCam.lookAt(this._m_Position, this._m_Position.add(this._m_Direction, this._m_TempVec3), this._m_ShadowCam.getUp());
            // 强制更新
            this._m_ShadowCam._updateFrustum();
            this._m_ShadowCam.getProjectViewMatrix(true);
        }
        else if(this._m_UpdateCasterCam){
            this._m_UpdateCasterCam = false;
            this._m_ShadowCam.setFrustumPerspective(this._m_OutAngle * MoreMath.S_RAD_TO_DEG * 2.0, 1.0, 1.0, this._m_SpotRange);
            this._m_ShadowCam._updateFrustum();
        }

    }

    getShadowGeometryCasts(shadowMapIndex, shadowGeometryCasts){
        // 从场景图中查找当前shadowCam要进行投射的物体
        let scenes = this._m_Scene.getSceneNodes();
        scenes.forEach(scene=>{
            Shadow.calculateNodeInFrustum(scene, this._m_ShadowCam, Node.S_SHADOW_CAST, shadowGeometryCasts);
        });
        this._m_UpdateCasterCam = true;
        this._m_ShadowCam.setFrustumPerspective(this._m_OutAngle * MoreMath.S_RAD_TO_DEG * 2.0, 1.0, 1.0, 1000.0);
        this._m_ShadowCam.getProjectViewMatrix(true);
        return shadowGeometryCasts;
    }

}
