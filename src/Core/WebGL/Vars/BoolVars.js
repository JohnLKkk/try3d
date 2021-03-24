import Vars from "./Vars.js";

/**
 * BoolVars。<br/>
 * 布尔变量。<br/>
 * @author Kkk
 * @date 2021年3月19日21点44分
 */
export default class BoolVars extends Vars{
    constructor(props) {
        super(props);
        this._m_Bool = false;
    }
    valueOf(bool){
        this._m_Bool = bool;
        return this;
    }
    /**
     * 比较值。<br/>
     * @param {BoolVars}[boolVars]
     * @return {Boolean}
     */
    compare(boolVars) {
        // return this._m_Bool == boolVars._m_Bool;
        return false;
    }
    _upload(gl, loc, fun){
        gl.uniform1i(loc, this._m_Bool);
    }

}
