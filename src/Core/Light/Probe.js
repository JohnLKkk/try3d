import Light from "./Light.js";
import Vector3 from "../Math3d/Vector3.js";

/**
 * Probe。<br/>
 * 反射探头和GI探头从该类派生。<br/>
 * @author Kkk
 * @date 2021年3月22日17点14分
 */
export default class Probe extends Light{
    getType(){
        return 'Probe';
    }
    getTypeId(){
        return 100;
    }

    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_Position = new Vector3();
    }

    /**
     * 设置光探头位置。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     */
    setPositionFromXYZ(x, y, z){
        this._m_Position.setToInXYZ(x, y, z);
    }

    /**
     * 返回光探头位置。<br/>
     * @return {Vector3}
     */
    getPosition(){
        return this._m_Position;
    }
}
