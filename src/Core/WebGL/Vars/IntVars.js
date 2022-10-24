import Vars from "./Vars.js";

/**
 * IntVars。<br/>
 * Int变量。<br/>
 * @author Kkk
 * @date 2022年8月12日17点40分
 */
export default class IntVars extends Vars{
    constructor(props) {
        super(props);
        this._m_Int = 0;
    }
    valueOf(int){
        this._m_Int = int;
        return this;
    }

    /**
     * 比较值。<br/>
     * @param {IntVars}[intVars]
     * @return {Boolean}
     */
    compare(intVars) {
        // return this._m_Float == intVars._m_Float;
        return false;
    }
    _upload(gl, loc, fun){
        gl.uniform1i(loc, this._m_Int);
    }

}
