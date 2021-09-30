const aTr = 1.0 / 180.0 * Math.PI;
const rTa = 180.0 / Math.PI;
const pD = 180.0;
const pDN = 1.0 / pD;
const ppD = 1.0 / Math.PI;
/**
 * 增强js没有的数学部分。<br/>
 * @author Kkk
 * @date 2021年2月2日15点25分
 */
export default class MoreMath {
    static S_HALF_PI = 0.5 * Math.PI;
    static S_DEG_TO_RAD = 0.0174532925;
    static S_RAD_TO_DEG = 57.295779513;
    static S_TWO_PI = Math.PI * 2;
    constructor() {
    }

    /**
     * 将角度转为弧度。<br/>
     * @param {Number}[angdeg 角度值]
     * @returns {Number}[返回转换的弧度值]
     */
    static toRadians(angdeg){
        return angdeg * pDN * Math.PI;
    }

    /**
     * 将弧度转为角度。<br/>
     * @param {Number}[radians 弧度值]
     * @returns {Number}[返回转换的角度值]
     */
    static toAngle(radians){
        return radians * pD * ppD;
    }

    /**
     * 对单值进行线性插值。<br/>
     * @param {Number}[scale 0-1插值阈值]
     * @param {Number}[startValue 起始值]
     * @param {Number}[endValue 结束值]
     * @return {Number}[返回startValue~endValue之间的插值]
     */
    static interpolateLinear(scale, startValue, endValue) {
        if (startValue == endValue) {
            return startValue;
        }
        if (scale <= 0.0) {
            return startValue;
        }
        if (scale >= 1.0) {
            return endValue;
        }
        return ((1.0 - scale) * startValue) + (scale * endValue);
    }

    /**
     * 对Vector3进行插值。<br/>
     * @param {Number}[scale 0-1插值阈值]
     * @param {Vector3}[startValue 起始值]
     * @param {Vector3}[endValue 结束值]
     * @return {Vector3}[返回startValue~endValue之间的插值]
     */
    static interpolateLinearVec3(scale, startValue, endValue) {
        if (startValue == endValue) {
            return startValue;
        }
        if (scale <= 0.0) {
            return startValue;
        }
        if (scale >= 1.0) {
            return endValue;
        }
        startValue.multLength(1.0 - scale);
        startValue.add(endValue.mulReturn(scale));
        return startValue;
    }

    /**
     * 返回(a,b)之间的随机数。<br/>
     * @param {Number}[a]
     * @param {Number}[b]
     * @return {*}
     */
    static random(a, b){
        if(a > b)a = b;
        return Math.random() * (b - a) + a;
    }
}
