/**
 * 对RenderBuffer的封制。<br/>
 * @author Kkk
 * @date 2021年2月12日15点49分
 */
export class Buffer {
    constructor(name, loc, w, h, format) {
        this._m_Name = name;
        this._m_Loc = loc || null;
        this._m_Width = w || 0;
        this._m_Height = h || 0;
        this._m_Format = format;
    }
    setName(name){
        this._m_Name = name;
    }
    getName(){
        return this._m_Name;
    }
    setLoc(loc){
        this._m_Loc = loc;
    }
    getLoc(){
        return this._m_Loc;
    }
    setWidth(w){
        this._m_Width = w;
    }
    getWidth(){
        return this._m_Width;
    }
    setHeight(h){
        this._m_Height = h;
    }
    getHeight(){
        return this._m_Height;
    }
    setFormat(format){
        this._m_Format = format;
    }
    getFormat(){
        return this._m_Format;
    }

}
