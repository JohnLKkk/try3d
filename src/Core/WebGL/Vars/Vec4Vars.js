import Vars from "./Vars.js";

/**
 * Vec4Vars。<br/>
 * 定义vec4变量。<br/>
 * @author Kkk
 * @date 2021年3月3日14点12分
 */
export default class Vec4Vars extends Vars{
    constructor(props) {
        super(props);
        this._m_X = 0;
        this._m_Y = 0;
        this._m_Z = 0;
        this._m_W = 1;
    }
    valueFromXYZW(x, y, z, w){
        this._m_X = x;
        this._m_Y = y;
        this._m_Z = z;
        this._m_W = w;
        return this;
    }

    /**
     * 比较变量。<br/>
     * @param {Vec4Vars}[vec4Vars]
     * @return {Boolean}
     */
    compare(vec4Vars){
        return this._m_X == vec4Vars._m_X && this._m_Y == vec4Vars._m_X && this._m_Z == vec4Vars._m_Z && this._m_W == vec4Vars._m_W;
    }
    _upload(gl, loc, fun){
        gl.uniform4f(loc, this._m_X, this._m_Y, this._m_Z, this._m_W);
    }
}
