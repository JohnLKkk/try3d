import BoundingVolume from "../Math3d/Bounding/BoundingVolume.js";
import Vector3 from "../Math3d/Vector3.js";
import Vector2 from "../Math3d/Vector2.js";
import Log from "./Log.js";

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
     * @param {Number[]}[indices]
     * @param {Number[]}[positions]
     * @param {Number[]}[uvs]
     * @param {Number[]}[normals]
     * @return {Float32Array}
     */
    static generatorTangents2(indices, positions, uvs, normals){
        // 每个顶点的切线数据
        let nVertices = positions.length / 3;
        let tangents = new Float32Array(4 * nVertices);

        let tan1 = [], tan2 = [];

        for(let i = 0;i < nVertices;i++){
            tan1[i] = new Vector3();
            tan2[i] = new Vector3();
        }

        let vA = new Vector3(),
            vB = new Vector3(),
            vC = new Vector3(),

            uvA = new Vector2(),
            uvB = new Vector2(),
            uvC = new Vector2(),

            sdir = new Vector3(),
            tdir = new Vector3();

        let handleTriangle = ( a, b, c )=>{

            vA.setToInXYZ(positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]);
            vB.setToInXYZ(positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]);
            vC.setToInXYZ(positions[c * 3], positions[c * 3 + 1], positions[c * 3 + 2]);

            uvA.setToInXY(uvs[a * 2], uvs[a * 2 + 1]);
            uvB.setToInXY(uvs[b * 2], uvs[b * 2 + 1]);
            uvC.setToInXY(uvs[c * 2], uvs[c * 2 + 1]);

            vB.sub( vA );
            vC.sub( vA );

            uvB.sub( uvA );
            uvC.sub( uvA );

            let r = 1.0 / ( uvB._m_X * uvC._m_Y - uvC._m_X * uvB._m_Y );

            // 忽略具有重合或共线顶点的uv三角形

            if ( ! isFinite( r ) ) return;

            sdir.setTo(vB);
            sdir.multLength(uvC._m_Y);
            sdir.addInXYZ(vC._m_X * -uvB._m_Y, vC._m_Y * -uvB._m_Y, vC._m_Z * -uvB._m_Y);
            sdir.multLength(r);

            tdir.setTo(vC);
            tdir.multLength(uvB._m_X);
            tdir.addInXYZ(vB._m_X * -uvC._m_X, vB._m_Y * -uvC._m_X, vB._m_Z * -uvC._m_X);
            tdir.multLength(r);

            tan1[ a ].add( sdir );
            tan1[ b ].add( sdir );
            tan1[ c ].add( sdir );

            tan2[ a ].add( tdir );
            tan2[ b ].add( tdir );
            tan2[ c ].add( tdir );

        };

        for(let i = 0;i < indices.length;i+=3){
            handleTriangle(
                indices[ i + 0 ],
                indices[ i + 1 ],
                indices[ i + 2 ]
            );
        }

        let tmp = new Vector3(), tmp2 = new Vector3();
        let n = new Vector3(), n2 = new Vector3();
        let w, t, test;

        let handleVertex = ( v )=>{

            n.setToInXYZ(normals[v * 3], normals[v * 3 + 1], normals[v * 3 + 2]);
            n2.setTo(n);

            t = tan1[ v ];

            // 格拉姆-施密特正交化

            tmp.setTo( t );
            tmp.sub( n.multLength( n.dot( t ) ) ).normal();

            // 计算up

            n2.cross(t, tmp2);
            test = tmp2.dot( tan2[ v ] );
            w = ( test < 0.0 ) ? - 1.0 : 1.0;

            tangents[ v * 4 ] = tmp._m_X;
            tangents[ v * 4 + 1 ] = tmp._m_Y;
            tangents[ v * 4 + 2 ] = tmp._m_Z;
            tangents[ v * 4 + 3 ] = w;

        };

        for(let i = 0;i < indices.length;i+=3){
            handleVertex( indices[ i + 0 ] );
            handleVertex( indices[ i + 1 ] );
            handleVertex( indices[ i + 2 ] );
        }

        return tangents;
    }

    /**
     * 返回与positions内存对齐的切线数据。<br/>
     * @param {Number[]}[positions]
     * @return {Number[]}[tangents]
     */
    static generatorFillTangents2(positions){
        let nVertices = positions.length / 3;
        let l = 4 * nVertices;
        let tangents = [];
        for(let i = 0;i < l;i++){
            tangents[i] = 0.0;
        }
        return tangents;
    }

    /**
     * 返回与positions内存对齐的切线数据。<br/>
     * @param {Number[]}[positions]
     * @return {Number[]}[tangents]
     */
    static generatorFillTangents(positions){
        let tangents = [];
        for(let i = 0;i < positions.length;i++){
            tangents[i] = positions[i];
        }
        return tangents;
    }

    /**
     * 使用给定的positions和uvs计算切线数据。<br/>
     * @param {Number[]}[indices]
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
            p0.setToInXYZ(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
            p1.setToInXYZ(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
            p2.setToInXYZ(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);
            uv0.setToInXY(uvs[indices[i] * 2], uvs[indices[i] * 2 + 1]);
            uv1.setToInXY(uvs[indices[i + 1] * 2], uvs[indices[i + 1] * 2 + 1]);
            uv2.setToInXY(uvs[indices[i + 2] * 2], uvs[indices[i + 2] * 2 + 1]);

            p1.sub(p0, e1);
            p2.sub(p0, e2);
            uv1.sub(uv0, uv);
            du1 = uv._m_X;
            dv1 = uv._m_Y;
            uv2.sub(uv0, uv);
            du2 = uv._m_X;
            dv2 = uv._m_Y;

            Tools._generatorDietaryUVMat(du1, dv1, du2, dv2, dUV);
            // 计算加权切线数据
            tx = dUV[0] * e1._m_X + dUV[1] * e2._m_X;
            ty = dUV[0] * e1._m_Y + dUV[1] * e2._m_Y;
            tz = dUV[0] * e1._m_Z + dUV[1] * e2._m_Z;
            let l = tx * tx + ty * ty + tz * tz;
            l = 1.0 / Math.sqrt(l);
            tx *= l;
            ty *= l;
            tz *= l;
            Tools._generatorWeightedTangent(indices[i], indices[i + 1], indices[i + 2], tx, ty, tz, tangentMaps);
        }

        Tools._normalizedTangents(tangentMaps);
        // 计算加权顶点切线数据
        for(let i in tangentMaps){
            tangents[ti++] = tangentMaps[i][0];
            tangents[ti++] = tangentMaps[i][1];
            tangents[ti++] = tangentMaps[i][2];
        }
        // Log.log('tangents:\n',tangents);
        return tangents;
    }

    /**
     * 归一化切线数据。<br/>
     * @param {Map}[tangentMaps]
     * @private
     */
    static _normalizedTangents(tangentMaps){
        let temp = [];
        let l = 0;
        for(let i in tangentMaps){
            temp[0] = tangentMaps[i][0];
            temp[1] = tangentMaps[i][1];
            temp[2] = tangentMaps[i][2];

            l = temp[0] * temp[0] + temp[1] * temp[1] + temp[2] * temp[2];
            if(l > 0){
                l = Math.sqrt(1.0 * l);
                temp[0] /= l;
                temp[1] /= l;
                temp[2] /= l;
            }
            else{
                temp[0] = temp[1] = temp[2] = 0;
            }

            tangentMaps[i][0] = temp[0];
            tangentMaps[i][1] = temp[1];
            tangentMaps[i][2] = temp[2];
        }
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
