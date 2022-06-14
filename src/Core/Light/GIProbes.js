import Vector3 from "../Math3d/Vector3.js";
import Probe from "./Probe.js";
import BoundingSphere from "../Math3d/Bounding/BoundingSphere.js";
import UniformBuffer from "../WebGL/UniformBuffer.js";
import Vec3ArrayVars from "../WebGL/Vars/Vec3ArrayVars.js";
import ShaderSource from "../WebGL/ShaderSource.js";

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
        this._m_ProbeCount = new Vector3(4, 4, 4);
        this._m_ProbeStep = new Vector3(2, 2, 2);
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
        this._m_PrefilterEnvMap = null;
        this._m_PrefilterMipmap = 0;
        this._m_Bounding = new BoundingSphere();
    }

    /**
     * 设置PrefilterMipmap级别数量。<br/>
     * @param {Number}[pfmm]
     */
    setPrefilterMipmap(pfmm){
        this._m_PrefilterMipmap = pfmm;
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
     * 返回探头数目。<br/>
     * @returns {Vector3}
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
    flush(){
        let count = this._m_ProbeCount._m_X * this._m_ProbeCount._m_Y * this._m_ProbeCount._m_Z;
        if(count){
            this._m_ShCoeffs = [9 * 3 * count];
            this._m_ShCoeffsBufferData = new UniformBuffer(9 * 3 * count);
            // 预建缓存
            let frameContext = this._m_Scene.getRender().getFrameContext();
            let gl = this._m_Scene.getCanvas().getGLContext();
            if(!frameContext.getContextBlock('GI_PROBES_GROUP')){
                let GI_PROBES_GROUP = gl.createBuffer();
                this.GI_PROBES_GROUP = GI_PROBES_GROUP;
                gl.bindBuffer(gl.UNIFORM_BUFFER, GI_PROBES_GROUP);
                gl.bufferData(gl.UNIFORM_BUFFER, 8256, gl.STATIC_DRAW);
                gl.bindBuffer(gl.UNIFORM_BUFFER, null);

                gl.bindBufferRange(gl.UNIFORM_BUFFER, ShaderSource.BLOCKS['GI_PROBES_GROUP'].blockIndex, GI_PROBES_GROUP, 0, 8256);
                gl.bindBuffer(gl.UNIFORM_BUFFER, GI_PROBES_GROUP);
                let vec3 = new Vector3(1, 1, 0);
                gl.bufferSubData(gl.UNIFORM_BUFFER, 0, vec3.getBufferData());
                frameContext.addContextBlock('GI_PROBES_GROUP', this.GI_PROBES_GROUP);
            }
        }
    }
    /**
     * 设置球谐系数。<br/>
     * @param {Number}[index]
     * @param {Vector3[]}[shCoeffs 9个球谐系数]
     */
    setShCoeffsIndex(index, shCoeffs){
        if(!this._m_ShCoeffsBufferData){
            this.flush();
        }
        this._m_ShCoeffs[index] = new Vec3ArrayVars({length:9 * 3});
        let array = this._m_ShCoeffsBufferData.getArray();
        for(let i = 0,t = index * 9 * 3;i < shCoeffs.length;i++){
            array[t++] = shCoeffs[i]._m_X;
            array[t++] = shCoeffs[i]._m_Y;
            array[t++] = shCoeffs[i]._m_Z;

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

}
