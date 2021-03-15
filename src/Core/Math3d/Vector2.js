export default class Vector2 {
    constructor(x,y) {
        this._m_X = x || 0;
        this._m_Y = y || 0;
    }
    setTo(vec2){
        this._m_X = vec2._m_X;
        this._m_Y = vec2._m_Y;
    }
    setToInXY(x, y){
        this._m_X = x || 0;
        this._m_Y = y || 0;
    }

    /**
     * 返回两个向量的点乘。<br/>
     * @param {Vector2}[vec2]
     * @returns {number}
     */
    dot(vec2){
        return this._m_X * vec2._m_X + this._m_Y * vec2._m_Y;
    }

    /**
     * 返回两个向量的叉乘。<br/>
     * @param {Vector2}[vec2]
     * @param {Vector2}[result]
     */
    cross(vec2, result){
        if(result){
            result._m_X = this._m_Y * vec2._m_Z - this._m_Z * vec2._m_Y;
            result._m_Y = this._m_Z * vec2._m_X - this._m_X * vec2._m_Z;
            return result;
        }
        else{
            let x = this._m_Y * vec2._m_Z - this._m_Z * vec2._m_Y;
            let y = this._m_Z * vec2._m_X - this._m_X * vec2._m_Z;
            this._m_X = x;
            this._m_Y = y;
            return this;
        }
    }
    crossRetNew(vec2){
        let r = new Vector2(0, 0);
        return this.cross(vec2, r);
    }
    divide(vec2, result){
        if(result){
            result._m_X = this._m_X / vec2._m_X;
            result._m_Y = this._m_Y / vec2._m_Y;
            return result;
        }
        else{
            this._m_X /= vec2._m_X;
            this._m_Y /= vec2._m_Y;
            return this;
        }
    }
    divideRetNew(vec2){
        let r = new Vector2(0, 0);
        return this.divide(vec2, r);
    }
    mult(vec2, result){
        if(result){
            result._m_X = this._m_X * vec2._m_X;
            result._m_Y = this._m_Y * vec2._m_Y;
            return result;
        }
        else{
            this._m_X *= vec2._m_X;
            this._m_Y *= vec2._m_Y;
            return this;
        }
    }
    multRetNew(vec2){
        let r = new Vector2(0, 0);
        return this.mult(vec2, r);
    }
    sub(vec2, result){
        if(result){
            result._m_X = this._m_X - vec2._m_X;
            result._m_Y = this._m_Y - vec2._m_Y;
            return result;
        }
        else{
            this._m_X -= vec2._m_X;
            this._m_Y -= vec2._m_Y;
            return this;
        }
    }
    subRetNew(vec2){
        let r = new Vector2(0, 0);
        return this.sub(vec2, r);
    }
    add(vec2, reslut){
        if(reslut){
            reslut._m_X = this._m_X + vec2._m_X;
            reslut._m_Y = this._m_Y + vec2._m_Y;
            return reslut;
        }
        else{
            this._m_X += vec2._m_X;
            this._m_Y += vec2._m_Y;
            return this;
        }
    }
    addRetNew(vec2){
        let r = new Vector2(0, 0);
        return this.add(vec2, r);
    }
    multLength(l, result){
        if(result){
            result._m_X = this._m_X * l;
            result._m_Y = this._m_Y * l;
            return result;
        }
        else{
            this._m_X *= l;
            this._m_Y *= l;
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
        }
        else{
            console.error("Vector3.normal异常,长度为0。");
        }
        return this;
    }
    length(){
        let d = this._m_X * this._m_X + this._m_Y * this._m_Y;
        d = Math.sqrt(d);
        return d;
    }
    toString(){
        return '[' + this._m_X + ',' + this._m_Y + ']';
    }
}
