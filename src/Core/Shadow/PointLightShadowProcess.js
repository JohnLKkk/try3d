import BasicShadowProcess from "./BasicShadowProcess.js";
import Camera from "../Scene/Camera.js";
import Tools from "../Util/Tools.js";
import Vector3 from "../Math3d/Vector3.js";
import TextureCubeVars from "../WebGL/Vars/TextureCubeVars.js";
import Shadow from "./Shadow.js";
import Node from "../Node/Node.js";
import ShaderSource from "../WebGL/ShaderSource.js";

/**
 * PointLightShadowProcess。<br/>
 * 这个类用于实现PointLight的Shadow,为了统一ShadowPipeline,这里使用6张texture2D来模拟传统cubeMap,尽管这样会增加额外的开销。<br/>
 */
export default class PointLightShadowProcess extends BasicShadowProcess{
    static _S_CAPTURE_CONFIG = [
        // NegativeY
        {dir:new Vector3(0, -1, 0), up:new Vector3(0, 0, -1)},
        // PositiveY
        {dir:new Vector3(0, 1, 0), up:new Vector3(0, 0, 1)},
        // NegativeZ
        {dir:new Vector3(0, 0, -1), up:new Vector3(0, 1, 0)},
        // PositiveZ
        {dir:new Vector3(0, 0, 1), up:new Vector3(0, 1, 0)},
        // NegativeX
        {dir:new Vector3(-1, 0, 0), up:new Vector3(0, 1, 0)},
        // PositiveX
        {dir:new Vector3(1, 0, 0), up:new Vector3(0, 1, 0)},
    ];




    // cubeMap 6个face
    static _S_FACE_NUMS = 6;
    // 对应的6个shadowCam
    _m_ShadowCams = new Array(PointLightShadowProcess._S_FACE_NUMS);
    // 当前光源位置
    _m_Position = new Vector3();
    // 当前光源半径
    _m_Radius = 0;
    _m_UpdateCasterCam = false;


    // 临时变量
    static _S_TEMP_VEC3_0 = new Vector3();

    /**
     * @param {Comment}[owner]
     * @param {Number}[cfg.id]
     * @param {Number}[cfg.shadowMapSize]
     * @param {Boolean}[cfg.debug]
     * @param {Boolean}[cfg.backfaceShadows]
     */
    constructor(owner, cfg) {
        cfg.nbShadowMaps = PointLightShadowProcess._S_FACE_NUMS;
        // 对于pointLight而言,必须为固定尺寸的分区
        cfg.shadowSplitType = 0x002;
        super(owner, cfg);
        this.init(cfg.shadowMapSize);
    }

    init(smSize){
        for(let i = 0;i < PointLightShadowProcess._S_FACE_NUMS;i++){
            this._m_ShadowCams[i] = new Camera(this._m_Scene, {id:this._m_Id + "_" + i + Tools.nextId(), width:smSize, height:smSize, fixedSize:true});
        }
    }
    initMat() {
        super.initMat();
        // 追加材质定义
        this._m_PostShadowMat.addDefine(ShaderSource.S_POINTLIGHT_SHADOWS_SRC, false);
    }
    _uploadInfo(gl, frameContext){
        super._uploadInfo(gl, frameContext);
        // 更新PointLight信息
        let conVars = frameContext.m_LastSubShader.getContextVars();
        let rd = null;
        rd = conVars[BasicShadowProcess.S_LIGHT_POS];
        if(rd){
            gl.uniform3f(rd.loc, this._m_Position._m_X, this._m_Position._m_Y, this._m_Position._m_Z);
        }
    }

    /**
     * 更新阴影投射相机。<br/>
     */
    updateShadowCams(){
        if(this._m_Radius != this._m_Light.getRadius() || !this._m_Position.equals(this._m_Light.getPosition())){
            this._m_Radius = this._m_Light.getRadius();
            this._m_Position.setTo(this._m_Light.getPosition());
            this._calc();
        }
        else if(this._m_UpdateCasterCam){
            this._m_UpdateCasterCam = false;
            for(let i = 0;i < PointLightShadowProcess._S_FACE_NUMS;i++){
                this._m_ShadowCams[i].setFrustumPerspective(90.0, 1.0, 0.1, this._m_Radius);
                this._m_ShadowCams[i]._updateFrustum();
            }
        }
    }

    /**
     * 返回指定的shadowCam。<br/>
     * @param {Number}[shadowMapIndex]
     * @return {Camera}
     */
    getShadowCam(shadowMapIndex){
        return this._m_ShadowCams[shadowMapIndex];
    }

    /**
     * 返回当前shadowMap要渲染的遮挡物集合。<br/>
     * @param {Number}[shadowMapIndex]
     * @param {Array}[shadowGeometryCasts]
     */
    getShadowGeometryCasts(shadowMapIndex, shadowGeometryCasts){
        // 从场景图中查找当前shadowCam要进行投射的物体
        let scenes = this._m_Scene.getSceneNodes();
        scenes.forEach(scene=>{
            Shadow.calculateNodeInFrustum(scene, this._m_ShadowCams[shadowMapIndex], Node.S_SHADOW_CAST, shadowGeometryCasts);
        });
        this._m_UpdateCasterCam = true;
        // 计算完遮挡潜在子集后，将投射相机范围拉大，以确保完整投射潜在遮挡子集
        this._m_ShadowCams[shadowMapIndex].setFrustumPerspective(90.0, 1.0, 0.1, 1000.0);
        this._m_ShadowCams[shadowMapIndex].getProjectViewMatrix(true);
        return shadowGeometryCasts;
    }

    /**
     * 计算阴影更新区域。<br/>
     * @private
     */
    _calc(){
        let at = PointLightShadowProcess._S_TEMP_VEC3_0;
        for(let i = 0;i < PointLightShadowProcess._S_FACE_NUMS;i++){
            PointLightShadowProcess._S_CAPTURE_CONFIG[i].dir.add(this._m_Position, at);
            this._m_ShadowCams[i].lookAt(this._m_Position, at, PointLightShadowProcess._S_CAPTURE_CONFIG[i].up);
            this._m_ShadowCams[i].setFrustumPerspective(90.0, 1.0, 0.1, this._m_Radius);
            this._m_ShadowCams[i]._updateFrustum();
            // this._m_ShadowCams[i].getProjectViewMatrix(true);
        }
    }

}
