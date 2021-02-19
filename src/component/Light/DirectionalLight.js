import Light from "./Light.js";
import Vector3 from "../Math3d/Vector3.js";

export default class DirectionalLight extends Light{
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

}
