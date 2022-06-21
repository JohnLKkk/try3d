import Vector3 from "../Math3d/Vector3.js";
import Probe from "./Probe.js";
import BoundingSphere from "../Math3d/Bounding/BoundingSphere.js";
import UniformBuffer from "../WebGL/UniformBuffer.js";
import Vec3ArrayVars from "../WebGL/Vars/Vec3ArrayVars.js";
import ShaderSource from "../WebGL/ShaderSource.js";
import ProbeTools from "../Util/ProbeTools.js";
import Vector4 from "../Math3d/Vector4.js";

/**
 * GI探头集合，用于模拟光场信息，提供光场中任意物体表面可达的光照信息，<br/>
 * 不同于GIProbe,GIProbes提供了更加精细的探头布置,以便提供更加精确的光场信息。<br/>
 * @author Kkk
 * @date 2022年6月9日21点47分
 */
export default class GIProbes extends Probe{
    // 探头起始点
    _m_ProbeOrigin;
    // 探头数目
    _m_ProbeCount;
    // 探头间步进尺寸
    _m_ProbeStep;

    getType(){
        return 'GIProbes';
    }

    getTypeId(){
        return 5;
    }

    /**
     * 创建一个GIProbes。<br/>
     * @param {Object}[owner]
     * @param {Number}[cfg.id]
     * @param {Vector3}[cfg.probeOrigin]
     * @param {Vector3}[cfg.probeCount]
     * @param {Vector3}[cfg.probeStep]
     */
    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_ProbeOrigin = new Vector3();
        this._m_ProbeCount = new Vector4(4, 4, 4, 1.0);
        this._m_ProbeStep = new Vector3(2, 2, 2);
        this._m_ProbeCenter = new Vector4();
        this._m_ProbeRange = 0;
        this._m_DiffuseGIIntensity = 1.0;
        if(cfg.probeOrigin){
            this._m_ProbeOrigin.setTo(cfg.probeOrigin);
        }
        if(cfg.probeCount){
            this._m_ProbeCount.setTo(cfg.probeCount);
        }
        if(cfg.probeStep){
            this._m_ProbeStep.setTo(cfg.probeStep);
        }

        this._m_ShCoeffs = null;
        this._m_ShCoeffsBufferData = null;
        this._m_DistShCoeffs = null;
        this._m_DistShCoeffsBufferData = null;
        this._m_PrefilterEnvMap = null;
        this._m_PrefilterMipmap = 0;
        this._m_Bounding = new BoundingSphere();
        this._m_Change = false;
    }

    /**
     * 设置漫反射GI强度。<br/>
     * @param {Number}[giIntensity]
     */
    setDiffuseGIIntensity(giIntensity){
        this._m_DiffuseGIIntensity = giIntensity;
        this._m_ProbeCount._m_W = this._m_DiffuseGIIntensity;
    }

    /**
     * 设置探针组范围。<br/>
     * @param {Number}[probeRange]
     */
    setProbeRange(probeRange){
        this._m_ProbeRange = probeRange;
    }

    /**
     * 设置PrefilterMipmap级别数量。<br/>
     * @param {Number}[pfmm]
     */
    setPrefilterMipmap(pfmm){
        this._m_PrefilterMipmap = pfmm;
        if(this._m_ProbeRange){
            this._m_ProbeCenter._m_W = 1.0 / this._m_ProbeRange + pfmm;
        }
    }

    /**
     * 返回PrefilterMipmap级别数量。<br/>
     * @return {Number}
     */
    getPrefilterMipmap(){
        return this._m_PrefilterMipmap;
    }

    /**
     * 设置预过滤环境纹理。<br/>
     * @param {TextureCubeVars}[prefilterEnvMap]
     */
    setPrefilterEnvMap(prefilterEnvMap){
        this._m_PrefilterEnvMap = prefilterEnvMap;
    }

    /**
     * 返回预过滤环境纹理。<br/>
     * @return {TextureCubeVars}
     */
    getPrefilterEnvMap(){
        return this._m_PrefilterEnvMap;
    }

    /**
     * 返回探头起始点。<br/>
     * @returns {Vector3}
     */
    getProbeOrigin(){
        return this._m_ProbeOrigin;
    }

    /**
     * 返回探头中心。<br/>
     * @return {Vector4}
     */
    getProbeCenter(){
        return this._m_ProbeCenter;
    }

    /**
     * 返回探头数目。<br/>
     * @returns {Vector4}
     */
    getProbeCount(){
        return this._m_ProbeCount;
    }

    /**
     * 返回探头之间步进。<br/>
     * @returns {Vector3}
     */
    getProbeStep(){
        return this._m_ProbeStep;
    }

    /**
     * 上载数据。<br/>
     */
    upload(){
        let frameContext = this._m_Scene.getRender().getFrameContext();
        this.GI_PROBES_GROUP = frameContext.getContextBlock('GI_PROBES_GROUP');
        if(this.GI_PROBES_GROUP && this._m_Change){
            let gl = this._m_Scene.getCanvas().getGLContext();
            gl.bindBuffer(gl.UNIFORM_BUFFER, this.GI_PROBES_GROUP);
            let offsetP = 16;
            let offsetD = 0;
            // probeCount
            gl.bufferSubData(gl.UNIFORM_BUFFER, offsetP * offsetD, this._m_ProbeCount.getBufferData());
            // probeOrigin
            offsetD++;
            gl.bufferSubData(gl.UNIFORM_BUFFER, offsetP * offsetD, this._m_ProbeOrigin.getBufferData());
            // probeStep
            offsetD++;
            gl.bufferSubData(gl.UNIFORM_BUFFER, offsetP * offsetD, this._m_ProbeStep.getBufferData());
            // probeCenter
            offsetD++;
            gl.bufferSubData(gl.UNIFORM_BUFFER, offsetP * offsetD, this._m_ProbeCenter.getBufferData());
            // lowResolutionDownsampleFactor
            offsetD++;
            // gl.bufferSubData(gl.UNIFORM_BUFFER, offsetP * offsetD, this._m_ProbeCenter.getBufferData());
            // probeGrid
            offsetD++;
            gl.bufferSubData(gl.UNIFORM_BUFFER, offsetP * offsetD, this._m_ShCoeffsBufferData.getBufferData());
            // probeDist
            offsetP = 18512;
            gl.bufferSubData(gl.UNIFORM_BUFFER, offsetP, this._m_DistShCoeffsBufferData.getBufferData());
            this._m_Change = false;
        }
        {
            let frameContext = this._m_Scene.getRender().getFrameContext();
            let gl = this._m_Scene.getCanvas().getGLContext();
            let conVars = frameContext.m_LastSubShader.getContextVars();
            // prefilterEnvMap
            if(conVars[ShaderSource.S_PREF_ENV_MAP_SRC] != null && this.getPrefilterEnvMap())
                this.getPrefilterEnvMap()._upload(gl, conVars[ShaderSource.S_PREF_ENV_MAP_SRC].loc);
        }
    }
    static preBuild(scene){
        // 预建全局缓存
        let frameContext = scene.getRender().getFrameContext();
        let gl = scene.getCanvas().getGLContext();
        if(!frameContext.getContextBlock('GI_PROBES_GROUP')){
            let GI_PROBES_GROUP = gl.createBuffer();
            this.GI_PROBES_GROUP = GI_PROBES_GROUP;
            gl.bindBuffer(gl.UNIFORM_BUFFER, GI_PROBES_GROUP);
            gl.bufferData(gl.UNIFORM_BUFFER, 36944, gl.STATIC_DRAW);
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);

            gl.bindBufferRange(gl.UNIFORM_BUFFER, ShaderSource.BLOCKS['GI_PROBES_GROUP'].blockIndex, GI_PROBES_GROUP, 0, 36944);
            frameContext.addContextBlock('GI_PROBES_GROUP', this.GI_PROBES_GROUP);
            return true;
        }
        return false;
    }

    /**
     * 预建缓存。<br/>
     */
    preCache(){
        let count = this._m_ProbeCount._m_X * this._m_ProbeCount._m_Y * this._m_ProbeCount._m_Z;
        if(count){
            this._m_ShCoeffs = [count];
            this._m_ShCoeffsBufferData = new UniformBuffer(9 * 4 * count);
            this._m_DistShCoeffs = [count];
            this._m_DistShCoeffsBufferData = new UniformBuffer(9 * 4 * count);
            if(GIProbes.preBuild(this._m_Scene)){
                this.reset();
            }
            ProbeTools.placeProbes(this._m_ProbeOrigin, this._m_ProbeCount, this._m_ProbeStep, this._m_ProbeCenter);
            this._m_ProbeRange = this._m_ProbeCenter._m_W;
        }
    }
    /**
     * 设置球谐距离系数。<br/>
     * @param {Number}[index]
     * @param {Vector3[]}[distShCoeffs 9个球谐距离系数]
     */
    setDistShCoeffsIndex(index, distShCoeffs){
        if(!this._m_DistShCoeffsBufferData){
            this.preCache();
        }
        this._m_DistShCoeffs[index] = new Vec3ArrayVars({length:9});
        let array = this._m_DistShCoeffsBufferData.getArray();
        for(let i = 0,t = index * 9 * 4;i < distShCoeffs.length;i++){
            array[t++] = distShCoeffs[i]._m_X;
            array[t++] = distShCoeffs[i]._m_Y;
            array[t++] = distShCoeffs[i]._m_Z;
            // 跳过w
            t++;

            this._m_DistShCoeffs[index].valueFromXYZ(i, distShCoeffs[i]._m_X, distShCoeffs[i]._m_Y, distShCoeffs[i]._m_Z);
        }
    }

    /**
     * 返回指定探头的球谐距离系数。<br/>
     * @param {Number}[index]
     * @return {Array}
     */
    getDistShCoeffsIndex(index){
        return this._m_DistShCoeffs[index];
    }

    /**
     * 设置球谐系数。<br/>
     * @param {Number}[index]
     * @param {Vector3[]}[shCoeffs 9个球谐系数]
     */
    setShCoeffsIndex(index, shCoeffs){
        if(!this._m_ShCoeffsBufferData){
            this.preCache();
        }
        this._m_ShCoeffs[index] = new Vec3ArrayVars({length:9});
        let array = this._m_ShCoeffsBufferData.getArray();
        for(let i = 0,t = index * 9 * 4;i < shCoeffs.length;i++){
            array[t++] = shCoeffs[i]._m_X;
            array[t++] = shCoeffs[i]._m_Y;
            array[t++] = shCoeffs[i]._m_Z;
            // 跳过w
            t++;

            this._m_ShCoeffs[index].valueFromXYZ(i, shCoeffs[i]._m_X, shCoeffs[i]._m_Y, shCoeffs[i]._m_Z);
        }
    }

    /**
     * 返回指定探头的球谐系数。<br/>
     * @param {Number}[index]
     * @return {Array}
     */
    getShCoeffsIndex(index){
        return this._m_ShCoeffs[index];
    }

    /**
     * 重置，以便重新烘焙。<br/>
     */
    reset(){
        if(this.GI_PROBES_GROUP){
            let frameContext = this._m_Scene.getRender().getFrameContext();
            let gl = this._m_Scene.getCanvas().getGLContext();
            gl.bindBuffer(gl.UNIFORM_BUFFER, this.GI_PROBES_GROUP);
            let tempCount = new Vector3(0, 0, 0);
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, tempCount.getBufferData());
            this._m_Change = false;
        }
    }

    /**
     * 表明更新。<br/>
     */
    flush(){
        this._m_Change = true;
    }

}
