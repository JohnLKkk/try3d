import BoundingVolume from "../Math3d/Bounding/BoundingVolume.js";
import Vector3 from "../Math3d/Vector3.js";
import Vector2 from "../Math3d/Vector2.js";

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
    static find2(str, pattern){
        return str.search(pattern);
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

    /**
     * 使用给定的positions和uvs计算切线数据。<br/>
     * @param {Number[]}[positions]
     * @param {Number}[uvs]
     * @return {Number[]}[tangents]
     */
    static generatorTangents(indices, positions, uvs){
        // 计算公式
        // E1 = dietaryU1 * T + dietaryV1 * B;
        // E2 = dietaryU2 * T + dietaryV2 * B;
        // 可以联立方程计算T,B;但常规做法使用矩阵乘法求解
        // 如下:
        // [E1x, E1y, E1z,   =   [U1, V1,    *   [Tx, Ty, Tz,
        //  E2x, E2y, E2z]        U2, V2]         Bx, By, Bz]
        // 可得:
        // [Tx, Ty, Tz,      =   [U1, V1,^-1 *   [E1x, E1y, E1z,
        //  Bx, By, Bz]           U2, V2]         E2x, E2y, E2z]

        let e1 = new Vector3();
        let e2 = new Vector3();
        let dUV = new Array(4).fill(0);
        let ti = 0;
        let tx = 0, ty = 0, tz = 0;
        let tangents = [];
        let tangentMaps = {};

        let p0 = new Vector3();
        let p1 = new Vector3();
        let p2 = new Vector3();
        let uv0 = new Vector2();
        let uv1 = new Vector2();
        let uv2 = new Vector2();
        let uv = new Vector2();
        let du1 = 0, dv1 = 0, du2 = 0, dv2 = 0;
        for(let i = 0;i < indices.length;i+=3){
            p0.setToInXYZ(positions[indices[i]], positions[indices[i] + 1], positions[indices[i] + 2]);
            p1.setToInXYZ(positions[indices[i + 1]], positions[indices[i + 1] + 1], positions[indices[i + 1] + 2]);
            p2.setToInXYZ(positions[indices[i + 2]], positions[indices[i + 2] + 1], positions[indices[i + 2] + 2]);
            uv0.setToInXY(uvs[indices[i]], uvs[indices[i] + 1]);
            uv1.setToInXY(uvs[indices[i + 1]], uvs[indices[i + 1] + 1]);
            uv2.setToInXY(uvs[indices[i + 2]], uvs[indices[i + 2] + 1]);

            p1.sub(p0, e1);
            p1.sub(p2, e2);
            uv1.sub(uv0, uv);
            du1 = uv._m_X;
            dv1 = uv._m_Y;
            uv1.sub(uv2, uv);
            du2 = uv._m_X;
            dv2 = uv._m_Y;

            Tools._generatorDietaryUVMat(du1, dv1, du2, dv2, dUV);
            // 计算加权切线数据
            tx = dUV[0] * e1._m_X + dUV[1] * e2._m_X;
            ty = dUV[0] * e1._m_Y + dUV[1] * e2._m_Y;
            tz = dUV[0] * e1._m_Z + dUV[1] * e2._m_Z;
            Tools._generatorWeightedTangent(indices[i], indices[i + 1], indices[i + 2], tx, ty, tz, tangentMaps);
        }

        // 计算加权顶点切线数据
        for(let i = 0;i < indices.length;i+=3){
            tangents[ti++] = tangentMaps[indices[i]][0];
            tangents[ti++] = tangentMaps[indices[i]][1];
            tangents[ti++] = tangentMaps[indices[i]][2];

            tangents[ti++] = tangentMaps[indices[i + 1]][0];
            tangents[ti++] = tangentMaps[indices[i + 1]][1];
            tangents[ti++] = tangentMaps[indices[i + 1]][2];

            tangents[ti++] = tangentMaps[indices[i + 1]][0];
            tangents[ti++] = tangentMaps[indices[i + 1]][1];
            tangents[ti++] = tangentMaps[indices[i + 1]][2];
        }
        return tangents;
    }

    /**
     * 计算加权切线数据。<br/>
     * @param {Number}[p0 顶点]
     * @param {Number}[p1 顶点]
     * @param {Number}[p2 顶点]
     * @param {Number}[tx 切线x]
     * @param {Number}[ty 切线y]
     * @param {Number}[tz 切线z]
     * @param {Map}[tangentMaps]
     * @private
     */
    static _generatorWeightedTangent(p0, p1, p2, tx, ty, tz, tangentMaps){
        if(!Tools.checkIsNull(tangentMaps[p0])){
            tangentMaps[p0] = [tx, ty, tz];
        }
        else{
            tangentMaps[p0] = [(tx + tangentMaps[p0][0]) * 0.5, (ty + tangentMaps[p0][1]) * 0.5, (tz + tangentMaps[p0][2]) * 0.5];
        }

        if(!Tools.checkIsNull(tangentMaps[p1])){
            tangentMaps[p1] = [tx, ty, tz];
        }
        else{
            tangentMaps[p1] = [(tx + tangentMaps[p1][0]) * 0.5, (ty + tangentMaps[p1][1]) * 0.5, (tz + tangentMaps[p1][2]) * 0.5];
        }

        if(!Tools.checkIsNull(tangentMaps[p2])){
            tangentMaps[p2] = [tx, ty, tz];
        }
        else{
            tangentMaps[p2] = [(tx + tangentMaps[p2][0]) * 0.5, (ty + tangentMaps[p2][1]) * 0.5, (tz + tangentMaps[p2][2]) * 0.5];
        }
    }

    /**
     * 构建uv矩阵。<br/>
     * @param {Number}[du1]
     * @param {Number}[dv1]
     * @param {Number}[du2]
     * @param {Number}[dv2]
     * @param {Number[]}[result]
     * @return {Number[]}
     * @private
     */
    static _generatorDietaryUVMat(du1, dv1, du2, dv2, result){
        let t = 1.0 / (du1 * dv2 - du2 * dv1);
        result[0] = dv2 * t;
        result[1] = -dv1 * t;
        result[2] = -du2 * t;
        result[3] = du1 * t;
        return result;
    }
}
