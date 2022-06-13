import Vars from "./Vars.js";

/**
 * Vec3ArrayVars。<br/>
 * 定义vec3Array变量。<br/>
 * @author Kkk
 * @date 2021年9月21日17点06分
 */
export default class Vec3ArrayVars extends Vars{
    constructor(props) {
        super(props);
        if(!props){
            props = {};
        }
        if(!props.length){
            props.length = 1;
        }
        this._m_Length = props.length;
        this._m_Array = new Float32Array(this._m_Length * 3);
    }
    valueFromXYZ(index, x, y, z){
        let array = this._m_Array;
        array[index * 3 + 0] = x;
        array[index * 3 + 1] = y;
        array[index * 3 + 2] = z;
        return this;
    }

    /**
     * 比较变量。<br/>
     * @param {vec3ArrayVars}[vec3ArrayVars]
     * @return {Boolean}
     */
    compare(vec3ArrayVars){
        return false;
    }
    _upload(gl, loc, fun){
        gl.uniform3fv(loc, this._m_Array, 0, this._m_Array.length);
    }
}
