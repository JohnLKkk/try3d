/**
 * vec3
 * @author kkk
 * @date 2020年10月10日10点53分
 */
export default class Vector3 {
    // 内部缓存
    static _S_TEMP_VEC3 = new Vector3();
    static S_ZERO = new Vector3(0, 0, 0);

    // 单位向量
    static S_UNIT_AXIS_X = new Vector3(1, 0, 0);
    static S_UNIT_AXIS_Y = new Vector3(0, 1, 0);
    static S_UNIT_AXIS_Z = new Vector3(0, 0, 1);
    static S_UNIT_AXIS_NEGATIVE_X = new Vector3(-1, 0, 0);
    static S_UNIT_AXIS_NEGATIVE_Y = new Vector3(0, -1, 0);
    static S_UNIT_AXIS_NEGATIVE_Z = new Vector3(0, 0, -1);
    static S_POSITIVE_INFINITY = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    static S_NEGATIVE_INFINITY = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    static S_MAX = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    static S_MIN = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    constructor(x,y,z) {
        this._m_X = x || 0;
        this._m_Y = y || 0;
        this._m_Z = z || 0;
        this.bufferData = new Float32Array(3);
    }
    getBufferData(){
        this.bufferData.set([this._m_X, this._m_Y, this._m_Z]);
        return this.bufferData;
    }
    toArray(){
        return [this._m_X, this._m_Y, this._m_Z];
    }
    setTo(vec3){
        this._m_X = vec3._m_X;
        this._m_Y = vec3._m_Y;
        this._m_Z = vec3._m_Z;
        return this;
    }
    setToInXYZ(x, y, z){
        this._m_X = x || 0;
        this._m_Y = y || 0;
        this._m_Z = z || 0;
        return this;
    }

    /**
     * 返回两个向量的点乘。<br/>
     * @param {Vector3}[vec3]
     * @returns {number}
     */
    dot(vec3){
        return this._m_X * vec3._m_X + this._m_Y * vec3._m_Y + this._m_Z * vec3._m_Z;
    }

    /**
     * 计算与指定Vector3之间的最小值。<br/>
     * @param {Vector3}[vec3]
     * @param {Vector3}[result]
     * @return {Vector3}
     */
    min(vec3, result){
        // 之所以不用Math.min是为了减少大量频繁js函数调用开销
        // 另外这里完全可以result = result || this;但是对于高性能算法来说,分支预测比||快,直接展开代码是效率最快的
        // 在整个项目里会看到很多展开的代码而不是封装成调用函数
        // 不要怀疑代码的封装性，所谓的封装只会影响性能（性能第一）
        if(result){
            result._m_X = vec3._m_X < this._m_X ? vec3._m_X : this._m_X;
            result._m_Y = vec3._m_Y < this._m_Y ? vec3._m_Y : this._m_Y;
            result._m_Z = vec3._m_Z < this._m_Z ? vec3._m_Z : this._m_Z;
            return result;
        }
        else{
            this._m_X = vec3._m_X < this._m_X ? vec3._m_X : this._m_X;
            this._m_Y = vec3._m_Y < this._m_Y ? vec3._m_Y : this._m_Y;
            this._m_Z = vec3._m_Z < this._m_Z ? vec3._m_Z : this._m_Z;
            return this;
        }
    }

    /**
     * 计算与指定Vector3之间的最大值。<br/>
     * @param {Vector3}[vec3]
     * @param {Vector3}[result]
     * @return {Vector3}
     */
    max(vec3, result){
        // 之所以不用Math.max是为了减少大量频繁js函数调用开销
        // 另外这里完全可以result = result || this;但是对于高性能算法来说,分支预测比||快,直接展开代码是效率最快的
        // 在整个项目里会看到很多展开的代码而不是封装成调用函数
        // 不要怀疑代码的封装性，所谓的封装只会影响性能（性能第一）
        if(result){
            result._m_X = vec3._m_X > this._m_X ? vec3._m_X : this._m_X;
            result._m_Y = vec3._m_Y > this._m_Y ? vec3._m_Y : this._m_Y;
            result._m_Z = vec3._m_Z > this._m_Z ? vec3._m_Z : this._m_Z;
            return result;
        }
        else{
            this._m_X = vec3._m_X > this._m_X ? vec3._m_X : this._m_X;
            this._m_Y = vec3._m_Y > this._m_Y ? vec3._m_Y : this._m_Y;
            this._m_Z = vec3._m_Z > this._m_Z ? vec3._m_Z : this._m_Z;
            return this;
        }
    }

    /**
     * 返回两个向量的叉乘。<br/>
     * @param {Vector3}[vec3]
     * @param {Vector3}[result]
     */
    cross(vec3, result){
        if(result){
            result._m_X = this._m_Y * vec3._m_Z - this._m_Z * vec3._m_Y;
            result._m_Y = this._m_Z * vec3._m_X - this._m_X * vec3._m_Z;
            result._m_Z = this._m_X * vec3._m_Y - this._m_Y * vec3._m_X;
            return result;
        }
        else{
            let x = this._m_Y * vec3._m_Z - this._m_Z * vec3._m_Y;
            let y = this._m_Z * vec3._m_X - this._m_X * vec3._m_Z;
            let z = this._m_X * vec3._m_Y - this._m_Y * vec3._m_X;
            this._m_X = x;
            this._m_Y = y;
            this._m_Z = z;
            return this;
        }
    }
    crossRetNew(vec3){
        let r = new Vector3(0, 0, 0);
        return this.cross(vec3, r);
    }
    distance(v){
        return Math.sqrt(this.distanceSq(v));
    }
    distanceSq(v){
        let dx = this._m_X - v._m_X;
        let dy = this._m_Y - v._m_Y;
        let dz = this._m_Z - v._m_Z;
        return dx * dx + dy * dy + dz * dz;
    }
    divide(vec3, result){
        if(result){
            result._m_X = this._m_X / vec3._m_X;
            result._m_Y = this._m_Y / vec3._m_Y;
            result._m_Z = this._m_Z / vec3._m_Z;
            return result;
        }
        else{
            this._m_X /= vec3._m_X;
            this._m_Y /= vec3._m_Y;
            this._m_Z /= vec3._m_Z;
            return this;
        }
    }
    divideInXYZ(x, y, z, result){
        if(result){
            result._m_X = this._m_X / x;
            result._m_Y = this._m_Y / y;
            result._m_Z = this._m_Z / z;
            return result;
        }
        else{
            this._m_X /= x;
            this._m_Y /= y;
            this._m_Z /= z;
            return this;
        }
    }
    divideRetNew(vec3){
        let r = new Vector3(0, 0, 0);
        return this.divide(vec3, r);
    }
    divideRetNewInXYZ(x, y, z){
        let r = new Vector3(0, 0, 0);
        return this.divideInXYZ(x, y, z, r);
    }
    mult(vec3, result){
        if(result){
            result._m_X = this._m_X * vec3._m_X;
            result._m_Y = this._m_Y * vec3._m_Y;
            result._m_Z = this._m_Z * vec3._m_Z;
            return result;
        }
        else{
            this._m_X *= vec3._m_X;
            this._m_Y *= vec3._m_Y;
            this._m_Z *= vec3._m_Z;
            return this;
        }
    }
    multInXYZ(x, y, z, result){
        if(result){
            result._m_X = this._m_X * x;
            result._m_Y = this._m_Y * y;
            result._m_Z = this._m_Z * z;
            return result;
        }
        else{
            this._m_X *= x;
            this._m_Y *= y;
            this._m_Z *= z;
            return this;
        }
    }
    multRetNew(vec3){
        let r = new Vector3(0, 0, 0);
        return this.mult(vec3, r);
    }
    multRetNewInXYZ(x, y, z){
        let r = new Vector3(0, 0, 0);
        return this.multInXYZ(x, y, z, r);
    }
    sub(vec3, result){
        if(result){
            result._m_X = this._m_X - vec3._m_X;
            result._m_Y = this._m_Y - vec3._m_Y;
            result._m_Z = this._m_Z - vec3._m_Z;
            return result;
        }
        else{
            this._m_X -= vec3._m_X;
            this._m_Y -= vec3._m_Y;
            this._m_Z -= vec3._m_Z;
            return this;
        }
    }
    subInXYZ(x, y, z, result){
        if(result){
            result._m_X = this._m_X - x;
            result._m_Y = this._m_Y - y;
            result._m_Z = this._m_Z - z;
            return result;
        }
        else{
            this._m_X -= x;
            this._m_Y -= y;
            this._m_Z -= z;
            return this;
        }
    }
    subRetNew(vec3){
        let r = new Vector3(0, 0, 0);
        return this.sub(vec3, r);
    }
    subRetNewInXYZ(x, y, z){
        let r = new Vector3(0, 0, 0);
        return this.subInXYZ(x, y, z, r);
    }
    add(vec3, reslut){
        if(reslut){
            reslut._m_X = this._m_X + vec3._m_X;
            reslut._m_Y = this._m_Y + vec3._m_Y;
            reslut._m_Z = this._m_Z + vec3._m_Z;
            return reslut;
        }
        else{
            this._m_X += vec3._m_X;
            this._m_Y += vec3._m_Y;
            this._m_Z += vec3._m_Z;
            return this;
        }
    }
    addInXYZ(x, y, z, result){
        if(result){
            reslut._m_X = this._m_X + x;
            reslut._m_Y = this._m_Y + y;
            reslut._m_Z = this._m_Z + z;
            return reslut;
        }
        else{
            this._m_X += x;
            this._m_Y += y;
            this._m_Z += z;
            return this;
        }
    }
    addRetNew(vec3){
        let r = new Vector3(0, 0, 0);
        return this.add(vec3, r);
    }
    addRetNewInXYZ(x, y, z){
        let r = new Vector3(0, 0, 0);
        return this.addInXYZ(x, y, z, r);
    }
    multLength(l, result){
        if(result){
            result._m_X = this._m_X * l;
            result._m_Y = this._m_Y * l;
            result._m_Z = this._m_Z * l;
            return result;
        }
        else{
            this._m_X *= l;
            this._m_Y *= l;
            this._m_Z *= l;
            return this;
        }
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
        }
        else{
            this._m_X = this._m_Y = this._m_Z = 0;
        }
        return this;
    }
    negate(){
        return new Vector3(-this._m_X, -this._m_Y, -this._m_Z);
    }
    negateLocal(){
        this._m_X = -this._m_X;
        this._m_Y = -this._m_Y;
        this._m_Z = -this._m_Z;
        return this;
    }
    length(){
        let d = this._m_X * this._m_X + this._m_Y * this._m_Y + this._m_Z * this._m_Z;
        d = Math.sqrt(d);
        return d;
    }
    toString(){
        return '[' + this._m_X + ',' + this._m_Y + ',' + this._m_Z + ']';
    }

    /**
     * 以线性插值方式插值到v2。<br/>
     * @param {Vector3}[v2]
     * @param {Number}[t 0-1]
     * @param {Vector3}[result]
     * @return {Vector3}
     */
    inter(v2, t, result){
        return Vector3.inter(this, v2, t, result);
    }

    /**
     * 判断是否与指定的v相等。<br/>
     * @param {Vector3}[v]
     * @return {Boolean}
     */
    equals(v){
        if(v == this){
            return true;
        }
        else if(v == null)return false;
        else return this._m_X == v._m_X && this._m_Y == v._m_Y && this._m_Z == v._m_Z;
    }

    /**
     * 以线性插值方式从v1到v2。<br/>
     * @param {Vector3}[v1]
     * @param {Vector3}[v2]
     * @param {Number}[t 0-1]
     * @param {Vector3}[result]
     * @return {Vector3}
     */
    static inter(v1, v2, t, result){
        let s = 1.0 - t;
        result = result ? result : Vector3._S_TEMP_VEC3;
        result._m_X = v1._m_X * s + v2._m_X * t;
        result._m_Y = v1._m_Y * s + v2._m_Y * t;
        result._m_Z = v1._m_Z * s + v2._m_Z * t;
        return result;
    }

}
