/**
 * vec3
 * @author kkk
 * @date 2020年10月10日10点53分
 */
export default class Vector3 {
    constructor(x,y,z) {
        this._m_X = x || 0;
        this._m_Y = y || 0;
        this._m_Z = z || 0;
    }
    setTo(vec3){
        this._m_X = vec3._m_X;
        this._m_Y = vec3._m_Y;
        this._m_Z = vec3._m_Z;
    }
    setToInXYZ(x, y, z){
        this._m_X = x || 0;
        this._m_Y = y || 0;
        this._m_Z = z || 0;
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
    divideRetNew(vec3){
        let r = new Vector3(0, 0, 0);
        return this.divide(vec3, r);
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
    multRetNew(vec3){
        let r = new Vector3(0, 0, 0);
        return this.mult(vec3, r);
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
    subRetNew(vec3){
        let r = new Vector3(0, 0, 0);
        return this.sub(vec3, r);
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
    addRetNew(vec3){
        let r = new Vector3(0, 0, 0);
        return this.add(vec3, r);
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
        return '[' + this._m_X + ',' + this._m_Y + ',' + this._m_Z + ']';
    }

}