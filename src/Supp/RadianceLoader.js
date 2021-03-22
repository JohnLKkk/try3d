/**
 * RadianceLoader。<br/>
 * 辐射度纹理加载支持，使用hdrpng.js进行加载。<br/>
 * @see https://enkimute.github.io/hdrpng.js/<br/>
 * @author Kkk
 * @date 2021年3月21日12点16分
 */
import hdrpng from "../TPLibs/hdrpng.js";

export default class RadianceLoader {
    static rgbeImg(){
        return new hdrpng().HDRImage();
    }

    /**
     * 加载HDR纹理数据。<br/>
     * @param {String}[src]
     * @param {Function}[callback]
     */
    loadHDR(src, callback){
        let image = RadianceLoader.rgbeImg();
        image.onload = ()=>{
            callback(image);
        };
        image.src = src;
    }
}
