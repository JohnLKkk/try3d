import Vars from "./Vars.js";

/**
 * FloatVars。<br/>
 * Float变量。<br/>
 * @author Kkk
 * @date 2021年3月15日20点43分
 */
export default class FloatVars extends Vars{
    constructor(props) {
        super(props);
        this._m_Float = 0;
    }
    valueOf(float){
        this._m_Float = float;
        return this;
    }

    /**
     * 比较值。<br/>
     * @param {FloatVars}[floatVars]
     * @return {Boolean}
     */
    compare(floatVars) {
        // return this._m_Float == floatVars._m_Float;
        return false;
    }
    _upload(gl, loc, fun){
        gl.uniform1f(loc, this._m_Float);
    }

}
