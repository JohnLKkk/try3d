import BoundingVolume from "../Math3d/Bounding/BoundingVolume.js";

const o = {};
o.lz = function(i,c)
{
    if( typeof c != 'number' || c <= 0 || (typeof i != 'number' && typeof i != 'string') )
    { return i; }
    i+='';

    while( i.length < c )
    { i='0'+i; }
    return i;
}

o.getHashCode = function(s)
{
    var hash=0,c=(typeof s == 'string')?s.length:0,i=0;
    while(i<c)
    {
        hash = ((hash<<5)-hash)+s.charCodeAt(i++);
        //hash = hash & hash; // Convert to 32bit integer
    }

    return ( hash < 0 )?((hash*-1)+0xFFFFFFFF):hash; // convert to unsigned
};

o.uniqueId = function( s, bres )
{
    if( s == undefined || typeof s != 'string' )
    {
        if( !o.___uqidc )
        { o.___uqidc=0; }
        else { ++o.___uqidc; }
        var od = new Date(),
            i = s = od.getTime()+''+o.___uqidc;
    }
    else { var i = o.getHashCode( s ); }
    return ((bres)?'res:':'')+i.toString(32)+'-'+o.lz((s.length*4).toString(16),3);
};
/**
 * 提供一些常见工具函数。<br/>
 * @author Kkk
 * @date 2021年2月5日16点48分
 */
export default class Tools {
    static _s_Id = 0;
    static isPowerOfTwo(x) {
        return (x & (x - 1)) === 0;
    }

    static nextHighestPowerOfTwo(x) {
        --x;
        for (let i = 1; i < 32; i <<= 1) {
            x = x | x >> i;
        }
        return x + 1;
    }
    /**
     * 确保图像为2的幂次方。<br/>
     * 在旧的gles规范中，仅支持2的幂次方纹理图像。<br/>
     * @param {ImageData}[image]
     * @return {ImageData}
     */
    static ensureImageSizePowerOfTwo(image, canvas) {
        if (!Tools.isPowerOfTwo(image.width) || !Tools.isPowerOfTwo(image.height)) {
            canvas.width = Tools.nextHighestPowerOfTwo(image.width);
            canvas.height = Tools.nextHighestPowerOfTwo(image.height);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image,
                0, 0, image.width, image.height,
                0, 0, canvas.width, canvas.height);
            image = canvas;
        }
        return image;
    }

    /**
     * 检查o是否为有效对象。<br/>
     * @param {Object}[o]
     * @return {Boolean}
     */
    static checkIsNull(o){
        return o != null && o != undefined;
    }

    /**
     * 返回系统默认分配的唯一ID。<br/>
     * 以负数+'R3D'编码一个ID返回。<br/>
     * @return {Number}
     */
    static nextId(){
        return Tools.uniqueId(--Tools._s_Id + 'R3D');
    }
    /**
     * 插入一行到指定源中的指定位置。<br/>
     * @param {String}[source 源]
     * @param {String}[line 行]
     * @param {Number}[index 从0开始,指定插入到源的第几行]
     * @return {String}
     */
    static insertLine(source, line, index){
        source = Tools.trim(source);
        let sourceArr = source.split("\n");
        let result = '';
        for(let i = 0;i < sourceArr.length;i++){
            if(i == index){
                result += line + '\n';
            }
            result += sourceArr[i] + '\n';
        }
        return result;
    }
    /**
     * 返回string对应的唯一id。<br/>
     * @param {String}[s]
     * @return {Number}
     */
    static uniqueId(s){
        return o.uniqueId(s);
    }
    /**
     * 返回目标匹配符。<br/>
     * @param {String}[str 源]
     * @returns {TagPattern}
     */
    static getTagPattern(str){
        return eval("/" + str + "/g");
    }
    /**
     * 返回匹配符。<br/>
     * @param {String}[str 源]
     * @returns {Pattern}
     */
    static getPattern(str){
        return eval("/" + str + "/");
    }
    /**
     * 去掉字符串前后空格字符。<br/>
     * @param {String}[str 源]
     * @returns {void | string | *}
     */
    static trim(str){
        return str.replace(/(^\s*)|(\s*$)/g, "");
    }
    /**
     * 查找str中是否包含指定模板字符串。<br/>
     * @param {String}[str 源]
     * @param {Pattern}[pattern 匹配正则表达式]
     * @return {boolean}
     */
    static find(str, pattern){
        return str.search(pattern) != -1;
    }
    /**
     * 将指定字符串中所有符号匹配字符串替换为指定字符串
     * @param {String}[str 源]
     * @param {Pattern}[pattern 匹配正则表达式]
     * @param {Pattern}[tagPattern 替换正则表达式]
     * @param {String}[tag 替换的字符串内容]
     * @returns {String}
     */
    static repSrc(str, pattern, tagPattern, tag){
        if(str.search(pattern) != -1){
            return str.replace(tagPattern, tag);
        }
        return str;
    }

    /**
     * 近似计算BoundingVolume在指定视口中的面积。<br/>
     * @param {BoundingVolume}[bound]
     * @param {Number}[distance 距离cam的距离]
     * @param {Number}[viewPortWidth 视口宽度]
     * @return {Number}[返回该bound在视口中的近似像素面积]
     */
    static approxScreenArea(bound, distance, viewPortWidth){
        if(bound.getType() == BoundingVolume.S_TYPE_AABB){
            let r = bound.getXHalf() * bound.getXHalf() + bound.getYHalf() * bound.getYHalf() + bound.getZHalf() * bound.getZHalf();
            return ((r * viewPortWidth * viewPortWidth) / (distance * distance * 4)) * Math.PI;
        }
        else if(bound.getType() == BoundingVolume.S_TYPE_SPHERE){

        }
        return 0;
    }
}
