import Vars from "./Vars.js";

/**
 * Vec2Vars。<br/>
 * 定义vec2变量。<br/>
 * @author Kkk
 * @date 2021年9月21日17点06分
 */
export default class Vec2Vars extends Vars{
    constructor(props) {
        super(props);
        this._m_X = 0;
        this._m_Y = 0;
    }
    valueFromXY(x, y){
        this._m_X = x;
        this._m_Y = y;
        return this;
    }

    /**
     * 比较变量。<br/>
     * @param {Vec2Vars}[vec2Vars]
     * @return {Boolean}
     */
    compare(vec2Vars){
        return false;
    }
    _upload(gl, loc, fun){
        gl.uniform2f(loc, this._m_X, this._m_Y);
    }
}
