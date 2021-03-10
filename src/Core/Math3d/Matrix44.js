/**
 * Matrix44。<br/>
 * @author Kkk
 * @date 2020年10月10日11点10分
 */
import Vector3 from "./Vector3.js";

export default class Matrix44 {
    static _S_TEMP_MAT4 = new Matrix44();
    static _S_TEMP_VEC3 = new Vector3();
    constructor() {
        this.m = [
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1
        ];
        this.bufferData = new Float32Array(16);
    }

    /**
     * 设置为单位矩阵。<br/>
     */
    identity(){
        this.m = [
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1
        ];
    }

    /**
     * 应用缩放。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     * @return {Matrix44}
     */
    scale(x, y, z){
        this.m[0] *= x;
        this.m[4] *= y;
        this.m[8] *= z;
        this.m[1] *= x;
        this.m[5] *= y;
        this.m[9] *= z;
        this.m[2] *= x;
        this.m[6] *= y;
        this.m[10] *= z;
        this.m[3] *= x;
        this.m[7] *= y;
        this.m[11] *= z;
        return this;
    }

    /**
     * 应用平移。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     * @return {Matrix44}
     */
    translate(x, y, z){
        const m3 = this.m[3];
        this.m[0] += m3 * x;
        this.m[1] += m3 * y;
        this.m[2] += m3 * z;

        const m7 = this.m[7];
        this.m[4] += m7 * x;
        this.m[5] += m7 * y;
        this.m[6] += m7 * z;

        const m11 = this.m[11];
        this.m[8] += m11 * x;
        this.m[9] += m11 * y;
        this.m[10] += m11 * z;

        const m15 = this.m[15];
        this.m[12] += m15 * x;
        this.m[13] += m15 * y;
        this.m[14] += m15 * z;
        return this;
    }
    /**
     * 计算视图矩阵。<br/>
     * @param {Vector3}[eye]
     * @param {Vector3}[at]
     * @param {Vector3}[up]
     * @param {Array}[result]
     * @returns {Matrix44}[viewMatrix]
     */
    static lookAt(eye, at, up, result){
        // ndc是右手系
        let t = eye.subRetNew(at).normal();
        let r = up.crossRetNew(t).normal();
        let u = t.crossRetNew(r).normal();
        result = result || new Array(16).fill(0);
        result[0] = r._m_X;
        result[4] = r._m_Y;
        result[8] = r._m_Z;
        result[3] = 0;

        result[1] = u._m_X;
        result[5] = u._m_Y;
        result[9] = u._m_Z;
        result[7] = 0;

        result[2] = t._m_X;
        result[6] = t._m_Y;
        result[10] = t._m_Z;
        result[11] = 0;

        result[12] = -(eye._m_X * r._m_X + eye._m_Y * r._m_Y + eye._m_Z * r._m_Z);
        result[13] = -(eye._m_X * u._m_X + eye._m_Y * u._m_Y + eye._m_Z * u._m_Z);
        result[14] = -(eye._m_X * t._m_X + eye._m_Y * t._m_Y + eye._m_Z * t._m_Z);
        result[15] = 1;
        return result;
    }

    /**
     * 计算视图矩阵。<br/>
     * @param {Vector3}[eye]
     * @param {Vector3}[at]
     * @param {Vector3}[up]
     * @returns {Matrix44}[viewMatrix]
     */
    lookAt(eye, at, up){
        this.m = Matrix44.lookAt(eye, at, up, this.m);
        return this;
    }

    /**
     * 矩阵求逆。
     */
    inert(){
        let ok = Matrix44.invert(this.m, Matrix44._S_TEMP_MAT4.m);
        if(ok){
            this.set(Matrix44._S_TEMP_MAT4);
        }
    }

    /**
     * 矩阵求逆并返回求逆后的结果。
     * @param {Matrix44}[result 结果矩阵]
     * @returns {Matrix44}[结果矩阵,求逆失败返回null]
     */
    inertRetNew(result){
        let ok = Matrix44.invert(this.m, Matrix44._S_TEMP_MAT4.m);
        if(ok){
            result = result || new Matrix44();
            result.set(Matrix44._S_TEMP_MAT4);
            return result;
        }
        return null;
    }

    /**
     * 矩阵求逆。
     * @param {Number[]}[a 输入矩阵数组]
     * @param {Number[]}[out 输出矩阵数组]
     * @returns {Number[]}[如果求逆失败,返回null]
     */
    static invert(a, out){
        let a00 = a[0],
            a01 = a[1],
            a02 = a[2],
            a03 = a[3],
            a10 = a[4],
            a11 = a[5],
            a12 = a[6],
            a13 = a[7],
            a20 = a[8],
            a21 = a[9],
            a22 = a[10],
            a23 = a[11],
            a30 = a[12],
            a31 = a[13],
            a32 = a[14],
            a33 = a[15],

            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,
            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,
            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,
            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32,

            // Calculate the determinant
            det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

        if (!det) {
            return null;
        }
        det = 1.0 / det;

        out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
        return out;
    }

    /**
     * 将当前矩阵设置为指定矩阵。<br/>
     * @param {Matrix44}[mat44]
     */
    set(mat44){
        for(let i = 0;i < 16;i++){
            this.m[i] = mat44.m[i];
        }
    }

    /**
     * 将当前矩阵设置为指定矩阵数组。<br/>
     * @param {Number[]}[array]
     */
    setArray(array){
        for(let i = 0;i < 16;i++){
            this.m[i] = array[i];
        }
    }

    /**
     * 将当前矩阵设置为指定矩阵数组的转置。<br/>
     * @param {Number[]}[array]
     */
    setArrayTranspose(array){
        for(let i = 0, t = 0;i < 4;i++){
            for(let j = 0;j < 4;j++){
                this.m[t++] = array[j * 4 + i];
            }
        }
    }

    /**
     * 将矩阵所有值设置为正。<br/>
     */
    absLocal(){
        for(let i = 0;i < 16;i++){
            this.m[i] = Math.abs(this.m[i]);
        }
    }

    /**
     * 根据视场角度定义投影矩阵，纵横比和Z剪裁平面。
     * @param {Array}[m保存透视矩阵的浮点数组]
     * @param {Number}[offset将偏移量偏移到写入透视矩阵数据的浮点数组m中]
     * @param {Number}[fovyY方向的视野，以度为单位]
     * @param {Number}[aspect视区的纵横比]
     * @param {Number}[zNear]
     * @param {Number}[zFar]
     */
    static perspectiveM(m, offset,
                        fovy, aspect, zNear, zFar){
        let f = 1.0 / Math.tan(fovy * (Math.PI / 360.0));
        let rangeReciprocal = 1.0 / (zNear - zFar);

        m[offset + 0] = f / aspect;
        m[offset + 1] = 0.0;
        m[offset + 2] = 0.0;
        m[offset + 3] = 0.0;

        m[offset + 4] = 0.0;
        m[offset + 5] = f;
        m[offset + 6] = 0.0;
        m[offset + 7] = 0.0;

        m[offset + 8] = 0.0;
        m[offset + 9] = 0.0;
        m[offset + 10] = (zFar + zNear) * rangeReciprocal;
        m[offset + 11] = -1.0;

        m[offset + 12] = 0.0;
        m[offset + 13] = 0.0;
        m[offset + 14] = 2.0 * zFar * zNear * rangeReciprocal;
        m[offset + 15] = 0.0;
    }
    /**
     * 两个矩阵相乘,结果存放于result
     * @param result
     * @param resultOffset
     * @param lhs
     * @param lhsOffset
     * @param rhs
     * @param rhsOffset
     */
    static multiplyMM(result, resultOffset, lhs, lhsOffset, rhs, rhsOffset){
        result.m[resultOffset + 0] = rhs.m[0] * lhs.m[0] + rhs.m[1] * lhs.m[4] + rhs.m[2] * lhs.m[8] + rhs.m[3] * lhs.m[12];
        result.m[resultOffset + 1] = rhs.m[0] * lhs.m[1] + rhs.m[1] * lhs.m[5] + rhs.m[2] * lhs.m[9] + rhs.m[3] * lhs.m[13];
        result.m[resultOffset + 2] = rhs.m[0] * lhs.m[2] + rhs.m[1] * lhs.m[6] + rhs.m[2] * lhs.m[10] + rhs.m[3] * lhs.m[14];
        result.m[resultOffset + 3] = rhs.m[0] * lhs.m[3] + rhs.m[1] * lhs.m[7] + rhs.m[2] * lhs.m[11] + rhs.m[3] * lhs.m[15];

        result.m[resultOffset + 4] = rhs.m[4] * lhs.m[0] + rhs.m[5] * lhs.m[4] + rhs.m[6] * lhs.m[8] + rhs.m[7] * lhs.m[12];
        result.m[resultOffset + 5] = rhs.m[4] * lhs.m[1] + rhs.m[5] * lhs.m[5] + rhs.m[6] * lhs.m[9] + rhs.m[7] * lhs.m[13];
        result.m[resultOffset + 6] = rhs.m[4] * lhs.m[2] + rhs.m[5] * lhs.m[6] + rhs.m[6] * lhs.m[10] + rhs.m[7] * lhs.m[14];
        result.m[resultOffset + 7] = rhs.m[4] * lhs.m[3] + rhs.m[5] * lhs.m[7] + rhs.m[6] * lhs.m[11] + rhs.m[7] * lhs.m[15];

        result.m[resultOffset + 8] = rhs.m[8] * lhs.m[0] + rhs.m[9] * lhs.m[4] + rhs.m[10] * lhs.m[8] + rhs.m[11] * lhs.m[12];
        result.m[resultOffset + 9] = rhs.m[8] * lhs.m[1] + rhs.m[9] * lhs.m[5] + rhs.m[10] * lhs.m[9] + rhs.m[11] * lhs.m[13];
        result.m[resultOffset + 10] = rhs.m[8] * lhs.m[2] + rhs.m[9] * lhs.m[6] + rhs.m[10] * lhs.m[10] + rhs.m[11] * lhs.m[14];
        result.m[resultOffset + 11] = rhs.m[8] * lhs.m[3] + rhs.m[9] * lhs.m[7] + rhs.m[10] * lhs.m[11] + rhs.m[11] * lhs.m[15];

        result.m[resultOffset + 12] = rhs.m[12] * lhs.m[0] + rhs.m[13] * lhs.m[4] + rhs.m[14] * lhs.m[8] + rhs.m[15] * lhs.m[12];
        result.m[resultOffset + 13] = rhs.m[12] * lhs.m[1] + rhs.m[13] * lhs.m[5] + rhs.m[14] * lhs.m[9] + rhs.m[15] * lhs.m[13];
        result.m[resultOffset + 14] = rhs.m[12] * lhs.m[2] + rhs.m[13] * lhs.m[6] + rhs.m[14] * lhs.m[10] + rhs.m[15] * lhs.m[14];
        result.m[resultOffset + 15] = rhs.m[12] * lhs.m[3] + rhs.m[13] * lhs.m[7] + rhs.m[14] * lhs.m[11] + rhs.m[15] * lhs.m[15];
    }

    /**
     * result = m * v。<br/>
     * @param {Vector4}[result 结果向量]
     * @param {Vector4}[v 源向量]
     * @param {Matrix44}[m 目标矩阵]
     */
    static multiplyMV(result, v, m) {
        // result._m_X = v._m_X * m.m[0] + v._m_Y * m.m[1] + v._m_Z * m.m[2] + v._m_W * m.m[3];
        // result._m_Y = v._m_X * m.m[4] + v._m_Y * m.m[5] + v._m_Z * m.m[6] + v._m_W * m.m[7];
        // result._m_Z = v._m_X * m.m[8] + v._m_Y * m.m[9] + v._m_Z * m.m[10] + v._m_W * m.m[11];
        // result._m_W = v._m_X * m.m[12] + v._m_Y * m.m[13] + v._m_Z * m.m[14] + v._m_W * m.m[15];

        result._m_X = v._m_X * m.m[0] + v._m_Y * m.m[4] + v._m_Z * m.m[8] + v._m_W * m.m[12];
        result._m_Y = v._m_X * m.m[1] + v._m_Y * m.m[5] + v._m_Z * m.m[9] + v._m_W * m.m[13];
        result._m_Z = v._m_X * m.m[2] + v._m_Y * m.m[6] + v._m_Z * m.m[10] + v._m_W * m.m[14];
        result._m_W = v._m_X * m.m[3] + v._m_Y * m.m[7] + v._m_Z * m.m[11] + v._m_W * m.m[15];
    }

    /**
     * 将一个vec3与mat44相乘,这里假设了第4个分量w存在并为1。<br/>
     * result = m * v的旋转部分,同时每个分量添加m的平移部分。<br/>
     * 这里假设了w等于1，所以各分量加上了m的平移部分，并返回计算w分量值。<br/>
     * @param {Vector3}[result]
     * @param {Vector3}[v]
     * @param {Matrix44}[m]
     * @return {Number}
     */
    static multiplyMV3(result, v, m){
        // result._m_X = v._m_X * m.m[0] + v._m_Y * m.m[1] + v._m_Z * m.m[2] + m.m[3];
        // result._m_Y = v._m_X * m.m[4] + v._m_Y * m.m[5] + v._m_Z * m.m[6] + m.m[7];
        // result._m_Z = v._m_X * m.m[8] + v._m_Y * m.m[9] + v._m_Z * m.m[10] + m.m[11];
        // return v._m_X * m.m[12] + v._m_Y * m.m[13] + v._m_Z * m.m[14] + m.m[15];

        // 在cpu计算统一用右乘
        result._m_X = v._m_X * m.m[0] + v._m_Y * m.m[4] + v._m_Z * m.m[8] + m.m[12];
        result._m_Y = v._m_X * m.m[1] + v._m_Y * m.m[5] + v._m_Z * m.m[9] + m.m[13];
        result._m_Z = v._m_X * m.m[2] + v._m_Y * m.m[6] + v._m_Z * m.m[10] + m.m[14];
        return v._m_X * m.m[3] + v._m_Y * m.m[7] + v._m_Z * m.m[11] + m.m[15];
    }

    /**
     * 将一个vec3与mat44的3x3部分相乘。<br/>
     * result = m3x3 * v。<br/>
     * @param {Vector3}[result]
     * @param {Vector3}[v]
     * @param {Matrix44}[m]
     */
    static multiplyMV3In3x3(result, v, m){
        result._m_X = v._m_X * m.m[0] + v._m_Y * m.m[4] + v._m_Z * m.m[8];
        result._m_Y = v._m_X * m.m[1] + v._m_Y * m.m[5] + v._m_Z * m.m[9];
        result._m_Z = v._m_X * m.m[2] + v._m_Y * m.m[6] + v._m_Z * m.m[10];
    }

    /**
     * 从指定的平移，旋转和缩放构造变换矩阵。<br/>
     * @param {Vector3}[translation 平移]
     * @param {Quaternion}[rotation 旋转]
     * @param {Vector3}[scale 缩放]
     * @param {Matrix44}[result 结果矩阵]
     * @returns {Matrix44}
     */
    static composeMat4(translation, rotation, scale, result){
        Matrix44.fromQuaternion(rotation, result);
        result.scale(scale._m_X, scale._m_Y, scale._m_Z);
        result.translate(translation._m_X, translation._m_Y, translation._m_Z);
        return result;
    }

    /**
     * 从矩阵中解析translation,rotation和scale成分。<br/>
     * @param {Matrix44}[mat44]
     * @param {Vector3}[translation]
     * @param {Quaternion}[rotation]
     * @param {Vector3}[scale]
     */
    static decomposeMat4(mat44, translation, rotation, scale){
        // 提取矩阵三个量的长度
        Matrix44._S_TEMP_VEC3.setToInXYZ(mat44.m[0], mat44.m[1], mat44.m[2]);
        let sx = Matrix44._S_TEMP_VEC3.length();

        Matrix44._S_TEMP_VEC3.setToInXYZ(mat44.m[4], mat44.m[5], mat44.m[6]);
        let sy = Matrix44._S_TEMP_VEC3.length();

        Matrix44._S_TEMP_VEC3.setToInXYZ(mat44.m[8], mat44.m[9], mat44.m[10]);
        let sz = Matrix44._S_TEMP_VEC3.length();

        // 如果det结果为negative,则需要反转一个比例
        const det = Matrix44.determinantMat4(mat44);

        if(det < 0){
            sx = -sx;
        }

        translation.setToInXYZ(mat44.m[12], mat44.m[13], mat44.m[14]);

        // 缩放以及旋转部分
        Matrix44._S_TEMP_MAT4.set(mat44);

        // 去掉缩放,得到旋转部分矩阵
        const invSX = 1.0 / sx;
        const invSY = 1.0 / sy;
        const invSZ = 1.0 / sz;

        Matrix44._S_TEMP_MAT4.m[0] *= invSX;
        Matrix44._S_TEMP_MAT4.m[1] *= invSX;
        Matrix44._S_TEMP_MAT4.m[2] *= invSX;

        Matrix44._S_TEMP_MAT4.m[4] *= invSY;
        Matrix44._S_TEMP_MAT4.m[5] *= invSY;
        Matrix44._S_TEMP_MAT4.m[6] *= invSY;

        Matrix44._S_TEMP_MAT4.m[8] *= invSZ;
        Matrix44._S_TEMP_MAT4.m[9] *= invSZ;
        Matrix44._S_TEMP_MAT4.m[10] *= invSZ;

        // 计算到四元数中
        rotation.fromMat44(Matrix44._S_TEMP_MAT4);

        // 缩放
        scale.setToInXYZ(sx, sy, sz);
    }

    /**
     * 返回指定行列式。<br/>
     * @param {Matrix44}[mat]
     * @return {number}
     */
    static determinantMat4(mat) {
        // 缓存矩阵值,纪大提高计算速度!!
        const a00 = mat.m[0];

        const a01 = mat.m[1];
        const a02 = mat.m[2];
        const a03 = mat.m[3];
        const a10 = mat.m[4];
        const a11 = mat.m[5];
        const a12 = mat.m[6];
        const a13 = mat.m[7];
        const a20 = mat.m[8];
        const a21 = mat.m[9];
        const a22 = mat.m[10];
        const a23 = mat.m[11];
        const a30 = mat.m[12];
        const a31 = mat.m[13];
        const a32 = mat.m[14];
        const a33 = mat.m[15];
        return a30 * a21 * a12 * a03 - a20 * a31 * a12 * a03 - a30 * a11 * a22 * a03 + a10 * a31 * a22 * a03 +
            a20 * a11 * a32 * a03 - a10 * a21 * a32 * a03 - a30 * a21 * a02 * a13 + a20 * a31 * a02 * a13 +
            a30 * a01 * a22 * a13 - a00 * a31 * a22 * a13 - a20 * a01 * a32 * a13 + a00 * a21 * a32 * a13 +
            a30 * a11 * a02 * a23 - a10 * a31 * a02 * a23 - a30 * a01 * a12 * a23 + a00 * a31 * a12 * a23 +
            a10 * a01 * a32 * a23 - a00 * a11 * a32 * a23 - a20 * a11 * a02 * a33 + a10 * a21 * a02 * a33 +
            a20 * a01 * a12 * a33 - a00 * a21 * a12 * a33 - a10 * a01 * a22 * a33 + a00 * a11 * a22 * a33;
    }

    /**
     * 从四元数初始化变换矩阵。<br/>
     * @param {Quaternion}[quaternion]
     * @param {Matrix44}[result]
     * @return {Matrix44}
     */
    static fromQuaternion(quaternion, result){
        const x = quaternion._m_X;
        const y = quaternion._m_Y;
        const z = quaternion._m_Z;
        const w = quaternion._m_W;

        const x2 = x + x;
        const y2 = y + y;
        const z2 = z + z;
        const xx = x * x2;
        const xy = x * y2;
        const xz = x * z2;
        const yy = y * y2;
        const yz = y * z2;
        const zz = z * z2;
        const wx = w * x2;
        const wy = w * y2;
        const wz = w * z2;

        result.m[0] = 1 - (yy + zz);
        result.m[4] = xy - wz;
        result.m[8] = xz + wy;

        result.m[1] = xy + wz;
        result.m[5] = 1 - (xx + zz);
        result.m[9] = yz - wx;

        result.m[2] = xz - wy;
        result.m[6] = yz + wx;
        result.m[10] = 1 - (xx + yy);

        // last column
        result.m[3] = 0;
        result.m[7] = 0;
        result.m[11] = 0;

        // bottom row
        result.m[12] = 0;
        result.m[13] = 0;
        result.m[14] = 0;
        result.m[15] = 1;

        return result;
    }
    /**
     * 根据视场角度定义投影矩阵，纵横比和Z剪裁平面。
     * @param {Array}[m保存透视矩阵的浮点数组]
     * @param {Number}[offset将偏移量偏移到写入透视矩阵数据的浮点数组m中]
     * @param {Number}[fovyY方向的视野，以度为单位]
     * @param {Number}[aspect视区的纵横比]
     * @param {Number}[zNear]
     * @param {Number}[zFar]
     */
    perspectiveM(fovy, aspect, zNear, zFar){
        // console.log('fovy:' + fovy + ',aspect:' + aspect + ',zNear:' + zNear + ',zFar:' + zFar);
        Matrix44.perspectiveM(this.m, 0, fovy, aspect, zNear, zFar);
        return this;
    }

    /**
     * 返回矩阵数值。<br/>
     * @returns {number[]}
     */
    getData(){
        return this.m;
    }
    getBufferData(){
        this.bufferData.set(this.m);
        return this.bufferData;
    }
    toString(){
        return '[' + this.m[0] + ',' + this.m[1] + ',' + this.m[2] + ',' + this.m[3] + ',\n' +
            '' + this.m[4] + ',' + this.m[5] + ',' + this.m[6] + ',' + this.m[7] + ',\n' +
            '' + this.m[8] + ',' + this.m[9] + ',' + this.m[10] + ',' + this.m[11] + ',\n' +
            '' + this.m[12] + ',' + this.m[13] + ',' + this.m[14] + ',' + this.m[15] + ']';
    }

}
