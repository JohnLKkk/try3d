export default class Texture {
    constructor(name, loc, internalformat, w, h, border, format, type, data) {
        this._m_Name = name;
        this._m_Loc = loc;
        this._m_InternalFormat = internalformat;
        this._m_Widht = w;
        this._m_Height = h;
        this._m_Border = border;
        this._m_Format = format;
        this._m_Type = type;
        this._m_Data = data;
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
    setInternalFormat(internalFormat){
        this._m_InternalFormat = internalFormat;
    }
    getInternalFormat(){
        return this._m_InternalFormat;
    }
    setWidth(w){
        this._m_Widht = w;
    }
    getWidth(){
        return this._m_Widht;
    }
    setHeihgt(h){
        this._m_Height = h;
    }
    getHeight(){
        return this._m_Height;
    }
    setBorder(border){
        this._m_Border = border;
    }
    getBorder(){
        return this._m_Border;
    }
    setFormat(format){
        this._m_Format = format;
    }
    getFormat(){
        return this._m_Format;
    }
    setType(type){
        this._m_Type = type;
    }
    getType(){
        return this._m_Type;
    }
    setData(data){
        this._m_Data = data;
    }
    getData(){
        return this._m_Data;
    }

}
