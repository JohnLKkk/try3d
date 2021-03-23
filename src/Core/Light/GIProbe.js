import Probe from "./Probe.js";
import BoundingSphere from "../Math3d/Bounding/BoundingSphere.js";
import UniformBuffer from "../WebGL/UniformBuffer.js";

/**
 * GIProbe。<br/>
 * GI探头，用于全局光照的探头捕捉器，以便能够在险隘空间为物体提供更加精确的全局光。<br/>
 * GI探头需要设置位置，范围（目前仅实现球形探头，后续再考虑拓展到边界探头），目前未实现探头混合（但预留了符号名，以便后续完善）。<br/>
 * @author Kkk
 * @date 2021年3月20日13点07分
 */
export default class GIProbe extends Probe{
    getType() {
        return 'GIProbe';
    }
    getTypeId() {
        return 4;
    }

    constructor(owner, cfg) {
        super(owner, cfg);
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
     * 设置半径范围。<br/>
     * @param {Number}[radius]
     */
    setRadius(radius){
        this._m_Bounding.setRaiuds(radius);
    }

    /**
     * 返回半径。<br/>
     * @return {Number}
     */
    getRadius(){
        return this._m_Bounding.getRadius();
    }

    /**
     * 设置球谐系数。<br/>
     * @param {Vector3[]}[shCoeffs 9个球谐系数]
     */
    setShCoeffs(shCoeffs){
        this._m_ShCoeffs = shCoeffs;
        this._m_ShCoeffsBufferData = new UniformBuffer(9 * 3);
        let array = this._m_ShCoeffsBufferData.getArray();
        for(let i = 0,t = 0;i < shCoeffs.length;i++){
            array[t++] = shCoeffs[i]._m_X;
            array[t++] = shCoeffs[i]._m_Y;
            array[t++] = shCoeffs[i]._m_Z;
        }
    }

    /**
     * 返回球谐系数。<br/>
     * @return {Vector3[]}
     */
    getShCoeffs(){
        return this._m_ShCoeffs;
    }
    getShCoeffsBufferData(){
        return this._m_ShCoeffsBufferData;
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


}
