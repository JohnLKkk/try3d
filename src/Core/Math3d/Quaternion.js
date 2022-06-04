/**
 * 四元数。<br/>
 * 用于表示旋转部分。<br/>
 * @author Kkk
 * @date 2021年2月22日13点51分
 */
import MoreMath from "./MoreMath.js";
import Matrix44 from "./Matrix44.js";
import Vector3 from "./Vector3.js";

export default class Quaternion {
    // 内部缓存
    static _S_TEMP_QUATERNION = new Quaternion();
    static _S_TEMP_QUATERNION_2 = new Quaternion();
    static _S_TEMP_MAT44 = new Matrix44();
    static _S_TEMP_VEC3_0 = new Vector3();
    static _S_TEMP_VEC3_1 = new Vector3();
    static _S_TEMP_VEC3_2 = new Vector3();
    constructor(x, y, z, w) {
        this._m_X = x || 0;
        this._m_Y = y || 0;
        this._m_Z = z || 0;
        this._m_W = w || 0;
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
     * 右手乘法下,返回旋转矩阵下的第i列表示的基轴。<br/>
     * @param {Number}[i]
     * @param {Vector3}[store]
     * @returns {Vector3}
     */
    getRotationColumn(i, store){
        if(store == null){
            store = new Vector3();
        }

        let norm = this.norm();
        if(norm != 1.0){
            norm = MoreMath.invSqrt(norm);
        }
        let x = this._m_X;
        let y = this._m_Y;
        let z = this._m_Z;
        let w = this._m_W;
        let xx = x * x * norm;
        let xy = x * y * norm;
        let xz = x * z * norm;
        let xw = x * w * norm;
        let yy = y * y * norm;
        let yz = y * z * norm;
        let yw = y * w * norm;
        let zz = z * z * norm;
        let zw = z * w * norm;

        switch (i) {
            case 0:
                store._m_X = 1 - 2 * (yy + zz);
                store._m_Y = 2 * (xy + zw);
                store._m_Z = 2 * (xz - yw);
                break;
            case 1:
                store._m_X = 2 * (xy - zw);
                store._m_Y = 1 - 2 * (xx + zz);
                store._m_Z = 2 * (yz + xw);
                break;
            case 2:
                store._m_X = 2 * (xz + yw);
                store._m_Y = 2 * (yz - xw);
                store._m_Z = 1 - 2 * (xx + yy);
                break;
            default:
        }

        return store;
    }

    /**
     * 从zAxisDirection构建一个四元数。<br/>
     * @param {Vector3}[zAxisDirection]
     */
    fromDirectionAtZ(zAxisDirection){
        zAxisDirection.normal();
        Vector3.S_UNIT_AXIS_Y.cross(zAxisDirection, Quaternion._S_TEMP_VEC3_0);
        zAxisDirection.cross(Quaternion._S_TEMP_VEC3_0, Quaternion._S_TEMP_VEC3_1);
        this.fromAxis(Quaternion._S_TEMP_VEC3_0, Quaternion._S_TEMP_VEC3_1, zAxisDirection);
    }

    /**
     * 从基向量初始化四元数。<br/>
     * @param {Vector3}[xAxis]
     * @param {Vector3}[yAxis]
     * @param {Vector3}[zAxis]
     */
    fromAxis(xAxis, yAxis, zAxis){
        Quaternion._S_TEMP_MAT44.setArray([
            xAxis._m_X, xAxis._m_Y, xAxis._m_Z, 0,
            yAxis._m_X, yAxis._m_Y, yAxis._m_Z, 0,
            zAxis._m_X, zAxis._m_Y, zAxis._m_Z, 0,
            0, 0, 0, 1
        ]);
        this.fromMat44(Quaternion._S_TEMP_MAT44);
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
     * 返回这个四元数的范数。<br/>
     * @returns {number}
     */
    norm(){
        let x = this._m_X;
        let y = this._m_Y;
        let z = this._m_Z;
        let w = this._m_W;
        return w * w + x * x + y * y + z * z;
    }
    inverse(){
        let no = this.norm();
        if(no > 0.0){
            let invNorm = 1.0 / no;
            let x = this._m_X;
            let y = this._m_Y;
            let z = this._m_Z;
            let w = this._m_W;
            return new Quaternion(-x * invNorm, -y * invNorm, -z * invNorm, w
                * invNorm);
        }
        // 返回无效结果以标记错误
        return null;
    }
    mult(q, res){
        if(!res){
            res = new Quaternion();
        }
        let qw = q._m_W, qx = q._m_X, qy = q._m_Y, qz = q._m_Z;
        let x = this._m_X;
        let y = this._m_Y;
        let z = this._m_Z;
        let w = this._m_W;
        res._m_X = x * qw + y * qz - z * qy + w * qx;
        res._m_Y = -x * qz + y * qw + z * qx + w * qy;
        res._m_Z = x * qy - y * qx + z * qw + w * qz;
        res._m_W = -x * qx - y * qy - z * qz + w * qw;
        return res;
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
    static slerp2(q1, q2, t, result){
        result = result ? result : Quaternion._S_TEMP_QUATERNION_2;
        if ( t === 0 ) {
            result.setTo(q1);
            return result;
        };
        if ( t === 1 ) {
            result.setTo(q2);
            return result;
        };

        const x = q1._m_X, y = q1._m_Y, z = q1._m_Z, w = q1._m_W;

        // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

        let cosHalfTheta = w * q2._m_W + x * q2._m_X + y * q2._m_Y + z * q2._m_Z;

        let q0 = null;
        if ( cosHalfTheta < 0 ) {
            q0 = Quaternion._S_TEMP_QUATERNION;
            q0._m_W = - q2._m_W;
            q0._m_X = - q2._m_X;
            q0._m_Y = - q2._m_Y;
            q0._m_Z = - q2._m_Z;

            cosHalfTheta = - cosHalfTheta;

        } else {

            q0 = q2;

        }

        if ( cosHalfTheta >= 1.0 ) {

            result._m_W = w;
            result._m_X = x;
            result._m_Y = y;
            result._m_Z = z;

            return result;

        }

        const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

        if ( sqrSinHalfTheta <= Number.EPSILON ) {

            const s = 1.0 - t;
            result._m_W = s * w + t * q0._m_W;
            result._m_X = s * x + t * q0._m_X;
            result._m_Y = s * y + t * q0._m_Y;
            result._m_Z = s * z + t * q0._m_Z;

            result.normal();

            return result;

        }

        const sinHalfTheta = Math.sqrt( sqrSinHalfTheta );
        const halfTheta = Math.atan2( sinHalfTheta, cosHalfTheta );
        const ratioA = Math.sin( ( 1.0 - t ) * halfTheta ) / sinHalfTheta,
            ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

        result._m_W = ( w * ratioA + q0._m_W * ratioB );
        result._m_X = ( x * ratioA + q0._m_X * ratioB );
        result._m_Y = ( y * ratioA + q0._m_Y * ratioB );
        result._m_Z = ( z * ratioA + q0._m_Z * ratioB );

        return result;
    }
    /**
     * 归一化向量。<br/>
     * @returns {Vector3}
     */
    normal(){
        let l = this.length();
        if(l){
            l = 1.0 / l;
            this._m_X *= l;
            this._m_Y *= l;
            this._m_Z *= l;
            this._m_W *= l;
        }
        else{
            console.error("Vector3.normal异常,长度为0。");
        }
        return this;
    }
    length(){
        let d = this._m_X * this._m_X + this._m_Y * this._m_Y + this._m_Z * this._m_Z + this._m_W * this._m_W;
        d = Math.sqrt(d);
        return d;
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
    toString(){
        return "[" + this._m_X + "," + this._m_Y + "," + this._m_Z + "," + this._m_W + "]";
    }

}
