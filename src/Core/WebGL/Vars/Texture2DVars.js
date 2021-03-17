import Vars from "./Vars.js";
import UniformBufferI from "../UniformBufferI.js";
import Tools from "../../Util/Tools.js";

/**
 * Texture2DVars。<br/>
 * 表示2D纹理数据。<br/>
 * @author Kkk
 * @date 2021年3月3日16点39分
 * @lastdate 2021年3月17日14点53分
 */
export default class Texture2DVars extends Vars{
    static _S_TEMP_COLOR = new UniformBufferI(4);
    // 纹理滤波常量
    static S_FILTERS = {S_NEAREST:0x001, S_LINEAR:0x002, S_LINEAR_MIPMAP_NEAREST:0x003};
    // 纹理参数常量
    static S_WRAPS = {S_REPEAT:0x001, S_CLAMP:0X002, S_CLAMP_TO_EDGE:0x003, S_CLAMP_TO_BORDER:0x004};
    constructor(scene) {
        super(scene);
        this._m_Scene = scene;
        const gl = scene.getCanvas().getGLContext();
        // 创建纹理目标
        this._m_Texture = gl.createTexture();
        // 设置默认纹理滤波
        this._setFilter(scene, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        this._setFilter(scene, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // 数据更新标记
        this._m_UpdateImage = false;
        this._m_Image = null;
        // 翻转y(需要在设置图像之前设置)
        this._m_FlipY = false;
        this._m_WrapS = null;
        this._m_WrapT = null;
        this._m_MinFilter = Texture2DVars.S_FILTERS.S_LINEAR_MIPMAP_NEAREST;
        this._m_MagFilter = Texture2DVars.S_FILTERS.S_LINEAR;
    }

    /**
     * 翻转图像。<br/>
     * 需要在设置图像数据之前设置。<br/>
     * @param {Boolean}[flipY true表示翻转,默认为false]
     */
    setFlipY(flipY){
        this._m_FlipY = flipY;
    }

    /**
     * 硬件mipmap。<br/>
     * @param {Scene}[scene]
     */
    genMipmap(scene){
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * 设置纹理滤波。<br/>
     * @param {Scene}[scene]
     * @param {Number}[minfilter Texture2DVars.S_FILTERS常量枚举之一]
     * @param {Number}[magfilter Texture2DVars.S_FILTERS常量枚举之一]
     */
    setFilter(scene, minfilter, magfilter){
        this._m_MinFilter = minfilter;
        this._m_MagFilter = magfilter;
        // const gl = scene.getCanvas().getGLContext();
        // this._setFilter(scene, gl.TEXTURE_MIN_FILTER, this._parseFilter(gl, minfilter));
        // this._setFilter(scene, gl.TEXTURE_MAG_FILTER, this._parseFilter(gl, magfilter));
    }

    /**
     * 解析纹理滤波枚举常量。<br/>
     * @param {WebGL}[gl]
     * @param {Number}[filterEnum]
     * @return {WebGLObject}
     * @private
     */
    _parseFilter(gl, filterEnum){
        switch (filterEnum) {
            case Texture2DVars.S_FILTERS.S_LINEAR:
                return gl.LINEAR;
            case Texture2DVars.S_FILTERS.S_NEAREST:
                return gl.NEAREST;
            case Texture2DVars.S_FILTERS.S_LINEAR_MIPMAP_NEAREST:
                return gl.LINEAR_MIPMAP_NEAREST;
        }
        return null;
    }

    /**
     * 设置纹理滤波。<br/>
     * @param {Scene}[scene]
     * @param {Number}[texEnum]
     * @param {Number}[filter]
     */
    _setFilter(scene, texEnum, filter){
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.texParameteri(gl.TEXTURE_2D, texEnum, filter);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * 设置纹理边缘处理。<br/>
     * @param {Scene}[scene]
     * @param {Number}[wrapS Texture2DVars.S_WRAP枚举常量之一]
     * @param {Number}[wrapT Texture2DVars.S_WRAP枚举常量之一]
     */
    setWrap(scene, wrapS, wrapT){
        this._m_WrapS = wrapS;
        this._m_WrapT = wrapT;
        // const gl = scene.getCanvas().getGLContext();
        // this._setWrap(scene, gl.TEXTURE_WRAP_S, this._parseWrap(gl, wrapS));
        // this._setWrap(scene, gl.TEXTURE_WRAP_T, this._parseWrap(gl, wrapT));
    }

    /**
     * 解析纹理边缘处理枚举常量。<br/>
     * @param {WebGL}[gl]
     * @param {Number}[wrapEnum]
     * @return {Number}
     * @private
     */
    _parseWrap(gl, wrapEnum){
        switch (wrapEnum) {
            case Texture2DVars.S_WRAPS.S_CLAMP:
                return gl.CLAMP;
            case Texture2DVars.S_WRAPS.S_REPEAT:
                return gl.REPEAT;
            case Texture2DVars.S_WRAPS.S_CLAMP_TO_EDGE:
                return gl.CLAMP_TO_EDGE;
            case Texture2DVars.S_WRAPS.S_CLAMP_TO_BORDER:
                return gl.CLAMP_TO_BORDER;
        }
        return null;
    }

    /**
     * 设置纹理边缘处理。<br/>
     * @param {Scene}[scene]
     * @param {Number}[texEnum]
     * @param {Number}[wrap]
     * @private
     */
    _setWrap(scene, texEnum, wrap){
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.texParameteri(gl.TEXTURE_2D, texEnum, wrap);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * 设置预设颜色值,由于web纹理需要异步加载,所以可以提供一个预设颜色纹理。<br/>
     * @param {Scene}[scene]
     * @param {Vector4}[value]
     */
    setPreloadColor(scene, value){
        let color = Texture2DVars._S_TEMP_COLOR.getArray();
        if (!value) {
            color[0] = 0;
            color[1] = 0;
            color[2] = 0;
            color[3] = 255;
        } else {
            color[0] = Math.floor(value._m_X * 255);
            color[1] = Math.floor(value._m_Y * 255);
            color[2] = Math.floor(value._m_Z * 255);
            color[3] = Math.floor(value._m_W * 255);
        }
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, Texture2DVars._S_TEMP_COLOR.getBufferData());
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * 设置纹理图素路径。<br/>
     * @param {Scene}[scene]
     * @param {String}[src]
     */
    setImageSrc(scene, src){
        // 加载完毕设置纹理图素
        let image = new Image();
        image.onload = ()=>{
            // 某些图形驱动api规范仅支持2的幂次方
            // image = Tools.ensureImageSizePowerOfTwo(image, scene.getCanvas());
            this._m_Image = image;
            this._m_UpdateImage = true;
            // //self._image = image; // For faster WebGL context restore - memory inefficient?
            // this.setImage(scene, image);
            // // 为该image生成硬件mipmap
            // this.genMipmap(scene);
            // // 设置默认纹理滤波
            // const gl = scene.getCanvas().getGLContext();
            // this.setFilter(scene, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            // this.setFilter(scene, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            // 刷新所有材质持有
            for(let owner in this._m_OwnerFlags){
                this._m_OwnerFlags[owner].owner.setParam(this._m_OwnerFlags[owner].flag, this);
            }
        };
        image.src = src;
    }

    /**
     * 直接设置已加载的图像数据。<br/>
     * @param {Scene}[scene]
     * @param {BufferData}[imgData]
     */
    setImage(scene, imgData){
        this._m_Image = imgData;
        this._m_UpdateImage = true;
        // 刷新所有材质持有
        for(let owner in this._m_OwnerFlags){
            this._m_OwnerFlags[owner].owner.setParam(this._m_OwnerFlags[owner].flag, this);
        }
    }

    /**
     * 设置纹理的图素数据。<br/>
     * @param {Scene}[scene]
     * @param {ImgData}[image]
     * @param props
     */
    _setImage(scene, image, props) {
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this._m_FlipY);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    _upload(gl, loc, fun){
        gl.activeTexture(gl.TEXTURE0 + loc);

        if(this._m_UpdateImage){
            // 某些图形驱动api规范仅支持2的
            //self._image = image; // For faster WebGL context restore - memory inefficient?
            this._setImage(this._m_Scene, this._m_Image);
            // 为该image生成硬件mipmap
            this.genMipmap(this._m_Scene);
            // 设置默认纹理滤波
            const gl = this._m_Scene.getCanvas().getGLContext();
            if(this._m_WrapS){
                this._setWrap(this._m_Scene, gl.TEXTURE_WRAP_S, this._parseWrap(gl, this._m_WrapS));
            }
            if(this._m_WrapT){
                this._setWrap(this._m_Scene, gl.TEXTURE_WRAP_T, this._parseWrap(gl, this._m_WrapT));
            }
            if(this._m_MinFilter){
                this._setFilter(this._m_Scene, gl.TEXTURE_MIN_FILTER, this._parseFilter(gl, this._m_MinFilter));
            }
            if(this._m_MagFilter){
                this._setFilter(this._m_Scene, gl.TEXTURE_MAG_FILTER, this._parseFilter(gl, this._m_MagFilter));
            }
            this._m_UpdateImage = false;
            this._m_Image = null;
        }

        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
    }

    /**
     * 暂时未想好比较方式。<br/>
     * @param {Texture2DVars}[texture2DVars]
     * @return {Boolean}
     */
    compare(texture2DVars){
        return false;
    }

}
