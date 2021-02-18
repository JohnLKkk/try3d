/**
 * 对Uniform数据的封制。<br/>
 * @author Kkk
 * @date 2021年2月18日15点49分
 */
export default class UniformBuffer {
    constructor(l) {
        this._m_Buffer = new Float32Array(l);
        this._m_Array = new Array(l).fill(0);
    }

    /**
     * 返回当前数据数组。<br/>
     * @return {any[] | *}
     */
    getArray(){
        return this._m_Array;
    }

    /**
     * 返回当前数据缓存。<br/>
     * @return {Float32Array}
     */
    getBufferData(){
        this._m_Buffer.set(this._m_Array);
        return this._m_Buffer;
    }

}
