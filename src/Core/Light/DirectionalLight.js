import Light from "./Light.js";
import Vector3 from "../Math3d/Vector3.js";
import DirectionalLightShadowProcess from "../Shadow/DirectionalLightShadowProcess.js";
import Log from "../Util/Log.js";

export default class DirectionalLight extends Light{
    // 尽量不依赖外部类枚举，所以在这里声明合适类型
    // 半过渡类型表示分区随着等级而衰减一半大小的shadowMap(也是默认模式)
    static S_SHADER_SPLIT_TYPE_HALF_TRANSITION = 0x001;
    // 固定shadowMap分辨率,表示所有分区shadowMap分辨率一致
    static S_SHADER_SPLIT_TYPE_FIXED = 0x002;


    getType() {
        return 'DirectionalLight';
    }
    getTypeId() {
        return 0;
    }

    constructor(owner, cfg) {
        super(owner, cfg);
        // 方向
        this._m_Direction = new Vector3();
    }
    _genShadow() {
        // 创建用于DirectionalLight的阴影
        this._m_ShadowCfg.id = this._m_Id + "_shadow";
        this._m_ShadowCfg.nbSplits = this._m_ShadowCfg.nbSplits || 2;
        this._m_Shadow = new DirectionalLightShadowProcess(this._m_Scene, this._m_ShadowCfg);
    }

    /**
     * 设置阴影分区数目，最大为4，最小为1，默认为2。<br/>
     * @param {Number}[splitNum]
     */
    setShadowSplitNum(splitNum){
        if(splitNum < 1 || splitNum > 4){
            Log.error('错误的分区数目:' + splitNum);
        }
        this._m_ShadowCfg.nbSplits = splitNum || 2;
    }

    /**
     * 设置分区模式，只能在第一次调用proShadow之前生效。<br/>
     * @param {Number}[type 必须是DirectionalLight的枚举之一]
     */
    setShadowSplitType(type){
        this._m_ShadowCfg.shadowSplitType = type;
    }

    /**
     * 设置方向。<br/>
     * @param {Vector3}[dir]
     */
    setDirection(dir){
        this._m_Direction.setTo(dir);
    }

    /**
     * 返回方向。<br/>
     * @return {Vector3}
     */
    getDirection(){
        return this._m_Direction;
    }

    /**
     * 设置方向。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     */
    setDirectionXYZ(x, y, z){
        this._m_Direction.setToInXYZ(x, y, z);
        this._m_Direction.normal();
    }

    /**
     * 返回DirectionalLight的AABBBoundary。<br/>
     * 这里直接返回null,表示一直可见。<br/>
     * @return {null}
     */
    getBoundingVolume(){
        return null;
    }

}
