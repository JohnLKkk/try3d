/**
 * Matrix44。<br/>
 * @author Kkk
 * @date 2020年10月10日11点10分
 */
export default class Matrix44 {
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

        // result[12] = -(eye._m_X * r._m_X + eye._m_Y * r._m_Y + eye._m_Z * r._m_Z);
        // result[13] = -(eye._m_X * u._m_X + eye._m_Y * u._m_Y + eye._m_Z * u._m_Z);
        // result[14] = -(eye._m_X * t._m_X + eye._m_Y * t._m_Y + eye._m_Z * t._m_Z);
        // console.log('t._m_Z:' + t._m_Z + ';eye._m_Z:' + eye._m_Z);
        result[12] = -eye._m_X;
        result[13] = -eye._m_Y;
        result[14] = -eye._m_Z;
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