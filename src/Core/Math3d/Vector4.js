export default class Vector4 {
    constructor(x,y,z,w) {
        this._m_X = x || 0;
        this._m_Y = y || 0;
        this._m_Z = z || 0;
        this._m_W = (w != null && w != undefined) ? w : 1;
    }
    setTo(vec4){
        this._m_X = vec4._m_X;
        this._m_Y = vec4._m_Y;
        this._m_Z = vec4._m_Z;
        this._m_W = vec4._m_W;
    }
    setToInXYZW(x, y, z, w){
        this._m_X = x || 0;
        this._m_Y = y || 0;
        this._m_Z = z || 0;
        this._m_W = (w != null && w != undefined) ? w : 1;
    }

    /**
     * 返回两个向量的点乘。<br/>
     * @param {Vector4}[vec4]
     * @returns {number}
     */
    dot(vec4){
        return this._m_X * vec4._m_X + this._m_Y * vec4._m_Y + this._m_Z * vec4._m_Z + this._m_W * vec4._m_W;
    }

    /**
     * 返回两个向量的叉乘。<br/>
     * @param {Vector4}[vec4]
     * @param {Vector4}[result]
     */
    cross(vec4, result){
        if(result){
            result._m_X = this._m_Y * vec4._m_Z - this._m_Z * vec4._m_Y;
            result._m_Y = this._m_Z * vec4._m_X - this._m_X * vec4._m_Z;
            result._m_Z = this._m_X * vec4._m_Y - this._m_Y * vec4._m_X;
            return result;
        }
        else{
            let x = this._m_Y * vec4._m_Z - this._m_Z * vec4._m_Y;
            let y = this._m_Z * vec4._m_X - this._m_X * vec4._m_Z;
            let z = this._m_X * vec4._m_Y - this._m_Y * vec4._m_X;
            this._m_X = x;
            this._m_Y = y;
            this._m_Z = z;
            return this;
        }
    }
    crossRetNew(vec4){
        let r = new Vector4(0, 0, 0, 1);
        return this.cross(vec4, r);
    }
    divide(vec4, result){
        if(result){
            result._m_X = this._m_X / vec4._m_X;
            result._m_Y = this._m_Y / vec4._m_Y;
            result._m_Z = this._m_Z / vec4._m_Z;
            result._m_W = this._m_W / vec4._m_W;
            return result;
        }
        else{
            this._m_X /= vec4._m_X;
            this._m_Y /= vec4._m_Y;
            this._m_Z /= vec4._m_Z;
            this._m_W /= vec4._m_W;
            return this;
        }
    }
    divideRetNew(vec4){
        let r = new Vector4(0, 0, 0, 1);
        return this.divide(vec4, r);
    }
    mult(vec4, result){
        if(result){
            result._m_X = this._m_X * vec4._m_X;
            result._m_Y = this._m_Y * vec4._m_Y;
            result._m_Z = this._m_Z * vec4._m_Z;
            result._m_W = this._m_W * vec4._m_W;
            return result;
        }
        else{
            this._m_X *= vec4._m_X;
            this._m_Y *= vec4._m_Y;
            this._m_Z *= vec4._m_Z;
            this._m_W *= vec4._m_W;
            return this;
        }
    }
    multRetNew(vec4){
        let r = new Vector4(0, 0, 0, 1);
        return this.mult(vec4, r);
    }
    sub(vec4, result){
        if(result){
            result._m_X = this._m_X - vec4._m_X;
            result._m_Y = this._m_Y - vec4._m_Y;
            result._m_Z = this._m_Z - vec4._m_Z;
            return result;
        }
        else{
            this._m_X -= vec4._m_X;
            this._m_Y -= vec4._m_Y;
            this._m_Z -= vec4._m_Z;
            return this;
        }
    }
    subRetNew(vec4){
        let r = new Vector4(0, 0, 0, 1);
        return this.sub(vec4, r);
    }
    add(vec4, reslut){
        if(reslut){
            reslut._m_X = this._m_X + vec4._m_X;
            reslut._m_Y = this._m_Y + vec4._m_Y;
            reslut._m_Z = this._m_Z + vec4._m_Z;
            return reslut;
        }
        else{
            this._m_X += vec4._m_X;
            this._m_Y += vec4._m_Y;
            this._m_Z += vec4._m_Z;
            return this;
        }
    }
    addRetNew(vec4){
        let r = new Vector4(0, 0, 0, 1);
        return this.add(vec4, r);
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
            console.error("Vector3.normal异常,长度为0。");
        }
        return this;
    }
    length(){
        let d = this._m_X * this._m_X + this._m_Y * this._m_Y + this._m_Z * this._m_Z;
        d = Math.sqrt(d);
        return d;
    }
    toString(){
        return '[' + this._m_X + ',' + this._m_Y + ',' + this._m_Z + ',' + this._m_W + ']';
    }
}
