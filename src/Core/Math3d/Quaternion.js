/**
 * 四元数。<br/>
 * 用于表示旋转部分。<br/>
 * @author Kkk
 * @date 2021年2月22日13点51分
 */
import MoreMath from "./MoreMath.js";

export default class Quaternion {
    // 内部缓存
    static _S_TEMP_QUATERNION = new Quaternion();
    static _S_TEMP_QUATERNION_2 = new Quaternion();
    constructor(x, y, z, w) {
        this._m_X = x || 0;
        this._m_Y = y || 0;
        this._m_Z = z || 0;
        this._m_W = w || 1;
    }

    /**
     * 设置四元数为指定四元数。<br/>
     * @param {Quaternion}[quaternion]
     */
    setTo(quaternion){
        this._m_X = quaternion._m_X;
        this._m_Y = quaternion._m_Y;
        this._m_Z = quaternion._m_Z;
        this._m_W = quaternion._m_W;
    }

    /**
     * 设置四元数为指定分量值。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     * @param {Number}[w]
     */
    setToInXYZW(x, y, z, w){
        this._m_X = x || 0;
        this._m_Y = y || 0;
        this._m_Z = z || 0;
        this._m_W = w || 0;
    }

    /**
     * 获取该四元数表示的欧拉角,由于欧拉角的应用顺序,其结果不一定百分百正确。<br/>
     * @see <a href="http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/index.htm">http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/index.htm</a><br/>
     * @param {Number[]}[angles]
     * @return {Number[]}[返回欧拉角,注意是弧度]
     */
    toAngles(angles){
        angles = angles || new Array(3);
        let sqw = this._m_W * this._m_W;
        let sqx = this._m_X * this._m_X;
        let sqy = this._m_Y * this._m_Y;
        let sqz = this._m_Z * this._m_Z;
        let unit = sqx + sqy + sqz + sqw; // 归一化
        // 计算修正因子
        let test = this._m_X * this._m_Y + this._m_Z * this._m_W;
        if (test > 0.499 * unit) { // 朝北极值
            angles[1] = 2 * Math.atan2(this._m_X, this._m_W);
            angles[2] = MoreMath.S_HALF_PI;
            angles[0] = 0;
        } else if (test < -0.499 * unit) { // 朝南极值
            angles[1] = -2 * Math.atan2(this._m_X, this._m_W);
            angles[2] = -MoreMath.S_HALF_PI;
            angles[0] = 0;
        } else {
            angles[1] = Math.atan2(2 * this._m_Y * this._m_W - 2 * this._m_X * this._m_Z, sqx - sqy - sqz + sqw); // yaw
            angles[2] = Math.asin(2 * test / unit); // roll
            angles[0] = Math.atan2(2 * this._m_X * this._m_W - 2 * this._m_Y * this._m_Z, -sqx + sqy - sqz + sqw); // pitch
        }
        return angles;
    }

    /**
     * 使用欧拉角初始化四元数。<br/>
     * 注意:这里按yzx应用欧拉角，但为了方便传值，对x,y,z参数进行排序提供。<br/>
     * @param {Number}[x pitch方位角，弧度值]
     * @param {Number}[y yaw方位角，弧度值]
     * @param {Number}[z roll方位角，弧度值]
     */
    fromEuler(x, y, z){
        let angle = -1;

        angle = x * 0.5;
        let c1 = Math.cos(angle);
        let s1 = Math.sin(angle);

        angle = y * 0.5;
        let c2 = Math.cos(angle);
        let s2 = Math.sin(angle);

        angle = z * 0.5;
        let c3 = Math.cos(angle);
        let s3 = Math.sin(angle);

        let c2c3 = c2 * c3;
        let s2s3 = s2 * s3;
        let c2s3 = c2 * s3;
        let s2c3 = s2 * c3;

        this._m_X = c2c3 * s1 + s2s3 * c1;
        this._m_Y = s2c3 * c1 + c2s3 * s1;
        this._m_Z = c2s3 * c1 - s2c3 * s1;
        this._m_W = c2c3 * c1 - s2s3 * s1;
    }

    /**
     * 从Matrix44初始化四元数。<br/>
     * @param {Matrix44}[mat44]
     */
    fromMat44(mat44){
        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
        // 假设mat44的3x3部分只有旋转(不包含缩放)

        const m11 = mat44.m[0];
        const m12 = mat44.m[4];
        const m13 = mat44.m[8];
        const m21 = mat44.m[1];
        const m22 = mat44.m[5];
        const m23 = mat44.m[9];
        const m31 = mat44.m[2];
        const m32 = mat44.m[6];
        const m33 = mat44.m[10];
        let s;

        const trace = m11 + m22 + m33;

        if (trace > 0) {

            s = 0.5 / Math.sqrt(trace + 1.0);

            this._m_W = 0.25 / s;
            this._m_X = (m32 - m23) * s;
            this._m_Y = (m13 - m31) * s;
            this._m_Z = (m21 - m12) * s;

        } else if (m11 > m22 && m11 > m33) {

            s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

            this._m_W = (m32 - m23) / s;
            this._m_X = 0.25 * s;
            this._m_Y = (m12 + m21) / s;
            this._m_Z = (m13 + m31) / s;

        } else if (m22 > m33) {

            s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

            this._m_W = (m13 - m31) / s;
            this._m_X = (m12 + m21) / s;
            this._m_Y = 0.25 * s;
            this._m_Z = (m23 + m32) / s;

        } else {

            s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

            this._m_W = (m21 - m12) / s;
            this._m_X = (m13 + m31) / s;
            this._m_Y = (m23 + m32) / s;
            this._m_Z = 0.25 * s;
        }
    }

    /**
     * 将一个四元数与Vector3相乘，将结果存放到result中。<br/>
     * @param {Vector3}[vec3]
     * @param {Vector3}[result 当result为null时,结果存放到vec3,对于result来说,可以与vec3相同,这是安全的]
     * @return {Vector3}
     */
    multVec3(vec3, result){
        // 如果result不存在就直接修改vec3
        result = result || vec3;
        let vx = vec3._m_X, vy = vec3._m_Y, vz = vec3._m_Z;
        let x = this._m_X;
        let y = this._m_Y;
        let z = this._m_Z;
        let w = this._m_W;
        result._m_X = w * w * vx + 2 * y * w * vz - 2 * z * w * vy + x * x
            * vx + 2 * y * x * vy + 2 * z * x * vz - z * z * vx - y
            * y * vx;
        result._m_Y = 2 * x * y * vx + y * y * vy + 2 * z * y * vz + 2 * w
            * z * vx - z * z * vy + w * w * vy - 2 * x * w * vz - x
            * x * vy;
        result._m_Z = 2 * x * z * vx + 2 * y * z * vy + z * z * vz - 2 * w
            * y * vx - y * y * vz + 2 * w * x * vy - x * x * vz + w
            * w * vz;
        return result;
    }

    /**
     * 以球面插值方式插值到q2。<br/>
     * @param {Quaternion}[q2]
     * @param {Number}[t]
     * @param {Quaternion}[result]
     * @return {Quaternion}
     */
    slerp(q2, t, result){
        return Quaternion.slerp(this, q2, t, result);
    }

    /**
     * 以球面插值方式从q1到q2。<br/>
     * @param {Quaternion}[q1]
     * @param {Quaternion}[q2]
     * @param {Number}[t]
     * @param {Quaternion}[result]
     * @return {Quaternion}
     */
    static slerp(q1, q2, t, result){
        let dot = q1._m_W * q2._m_W + q1._m_X * q2._m_X + q1._m_Y * q2._m_Y + q1._m_Z * q2._m_Z;
        let q0 = null;
        if(dot < 0.0){
            q0 = Quaternion._S_TEMP_QUATERNION;
            q0._m_W = -q1._m_W;
            q0._m_X = -q1._m_X;
            q0._m_Y = -q1._m_Y;
            q0._m_Z = -q1._m_Z;
            dot = -dot;
        }
        else{
            q0 = q1;
        }
        let k0, k1;
        if ( dot > 0.9995 ) {
            k0 = 1.0 - t;
            k1 = t;
        }
        else {
            let a = Math.acos(dot);
            let sina = Math.sin(a);
            k0 = (Math.sin((1.0 - t) * a)  / sina);
            k1 = (Math.sin(t * a) / sina);
        }
        //q0.mW * k0 + q2.mW *k1, q0.mX * k0 + q2.mX * k1, q0.mY * k0 + q2.mY * k1, q0.mZ * k0 + q2.mZ * k1
        result = result ? result : Quaternion._S_TEMP_QUATERNION_2;
        result._m_W = q0._m_W * k0 + q2._m_W * k1;
        result._m_X = q0._m_X * k0 + q2._m_X * k1;
        result._m_Y = q0._m_Y * k0 + q2._m_Y * k1;
        result._m_Z = q0._m_Z * k0 + q2._m_Z * k1;
        return result;
    }

    /**
     * 以线性插值方式插值到q2。<br/>
     * @param {Quaternion}[q2]
     * @param {Number}[t 0-1]
     * @param {Quaternion}[result]
     * @return {Quaternion}
     */
    inter(q2, t, result){
        return Quaternion.inter(this, q2, t, result);
    }
    /**
     * 以线性插值方式从q1到q2。<br/>
     * @param {Quaternion}[q1]
     * @param {Quaternion}[q2]
     * @param {Number}[t 0-1]
     * @param {Quaternion}[result]
     * @return {Quaternion}
     */
    static inter(q1, q2, t, result){
        let s = 1.0 - t;
        result = result ? result : Quaternion._S_TEMP_QUATERNION;
        result._m_X = q1._m_X * s + q2._m_X * t;
        result._m_Y = q1._m_Y * s + q2._m_Y * t;
        result._m_Z = q1._m_Z * s + q2._m_Z * t;
        result._m_W = q1._m_W * s + q2._m_W * t;
        return result;
    }

}
