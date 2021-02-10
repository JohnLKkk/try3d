/**
 * Matrix44。<br/>
 * @author Kkk
 * @date 2020年10月10日11点10分
 */

export default class Matrix44 {
    static _S_TEMP_MAT4 = new Matrix44();
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
