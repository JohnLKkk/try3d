import GIProbe from "./GIProbe.js";
import Vector3 from "../Math3d/Vector3.js";

/**
 * GI探头集合，用于模拟光场信息，提供光场中任意物体表面可达的光照信息，<br/>
 * 不同于GIProbe,GIProbes提供了更加精细的探头布置,以便提供更加精确的光场信息。<br/>
 * @author Kkk
 * @date 2022年6月9日21点47分
 */
export default class GIProbes extends GIProbe{
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

}