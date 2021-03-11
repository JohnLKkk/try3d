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
}
