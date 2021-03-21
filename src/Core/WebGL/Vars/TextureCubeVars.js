import Vars from "./Vars.js";
import UniformBufferI from "../UniformBufferI.js";

/**
 * TextureCubeVars。<br/>
 * TextureCube立方体纹理，其数据可以由环境图像(HDR或球形纹理)或6张环境纹理图像定义。<br/>
 * @author Kkk
 * @date 2021年3月20日16点46分
 */
export default class TextureCubeVars extends Vars{
    static _S_TEMP_COLOR = new UniformBufferI(4);
    /**
     * 面标记，如下:<br/>
     * 1    --  Positive X (+x)<br/>
     * 2    --  Negative X (-x)<br/>
     * 3    --  Positive Y (+y)<br/>
     * 4    --  Negative Y (-y)<br/>
     * 5    --  Positive Z (+z)<br/>
     * 6    --  Negative Z (-z)<br/>
     * @type {{PositiveY: number, PositiveZ: number, NegativeY: number, NegativeZ: number, PositiveX: number, NegativeX: number}}
     */
    static S_FACE = {
        PositiveX : '1',
        NegativeX : '2',
        PositiveY : '3',
        NegativeY : '4',
        PositiveZ : '5',
        NegativeZ : '6'
    };
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
        // 数据
        this._m_CubeMaps = {};
        this._m_UpdateImage = false;
        // 翻转y(需要在设置图像之前设置)
        this._m_FlipY = false;
        this._m_WrapS = null;
        this._m_WrapT = null;
        this._m_WrapR = null;
        this._m_MinFilter = TextureCubeVars.S_FILTERS.S_LINEAR;
        this._m_MagFilter = TextureCubeVars.S_FILTERS.S_LINEAR;
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
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._m_Texture);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }

    /**
     * 设置纹理滤波。<br/>
     * @param {Scene}[scene]
     * @param {Number}[minfilter TextureCubeVars.S_FILTERS常量枚举之一]
     * @param {Number}[magfilter TextureCubeVars.S_FILTERS常量枚举之一]
     */
    setFilter(scene, minfilter, magfilter){
        this._m_MinFilter = minfilter;
        this._m_MagFilter = magfilter;
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
            case TextureCubeVars.S_FILTERS.S_LINEAR:
                return gl.LINEAR;
            case TextureCubeVars.S_FILTERS.S_NEAREST:
                return gl.NEAREST;
            case TextureCubeVars.S_FILTERS.S_LINEAR_MIPMAP_NEAREST:
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
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._m_Texture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, texEnum, filter);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }

    /**
     * 设置纹理边缘处理。<br/>
     * @param {Scene}[scene]
     * @param {Number}[wrapS TextureCubeVars.S_WRAP枚举常量之一]
     * @param {Number}[wrapT TextureCubeVars.S_WRAP枚举常量之一]
     * @param {Number}[wrapR TextureCubeVars.S_WRAP枚举常量之一]
     */
    setWrap(scene, wrapS, wrapT, wrapR){
        this._m_WrapS = wrapS;
        this._m_WrapT = wrapT;
        this._m_WrapR = wrapR;
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
            case TextureCubeVars.S_WRAPS.S_CLAMP:
                return gl.CLAMP;
            case TextureCubeVars.S_WRAPS.S_REPEAT:
                return gl.REPEAT;
            case TextureCubeVars.S_WRAPS.S_CLAMP_TO_EDGE:
                return gl.CLAMP_TO_EDGE;
            case TextureCubeVars.S_WRAPS.S_CLAMP_TO_BORDER:
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
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._m_Texture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, texEnum, wrap);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }

    /**
     * 设置预设颜色值,由于web纹理需要异步加载,所以可以提供一个预设颜色纹理。<br/>
     * @param {Scene}[scene]
     * @param {Vector4}[value]
     */
    setPreloadColor(scene, value){
        let color = TextureCubeVars._S_TEMP_COLOR.getArray();
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
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._m_Texture);
        for(let i = 0;i < 6;i++){
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, TextureCubeVars._S_TEMP_COLOR.getBufferData());
        }
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }

    /**
     * 设置纹理图素路径。<br/>
     * @param {Scene}[scene]
     * @param {Number}[TextureCubeVars.Face]
     * @param {String}[src]
     * @param {Boolean}[options.rgbe 表示rgbe数据的辐射度纹理]
     */
    setImageSrc(scene, face, src, options){
        // 加载完毕设置纹理图素
        let image = (options && options.rgbe) ? RadianceLoader.rgbeImg() : new Image();
        image.onload = ()=>{
            this._m_UpdateImage = true;
            // 某些图形驱动api规范仅支持2的幂次方
            // image = Tools.ensureImageSizePowerOfTwo(image, scene.getCanvas());
            this._m_CubeMaps[face] = {imgData:((options && options.rgbe) ? image.dataRGBE : image)};
            if(options && options.rgbe){
                this._m_CubeMaps[face].rgbe = true;
            }
            this._m_CubeMaps[face].width = image.width;
            this._m_CubeMaps[face].height = image.height;
            this._m_CubeMaps[face].updateImage = true;
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
     * @param {Number}[TextureCubeVars.Face]
     * @param {BufferData}[imgData]
     * @param {Boolean}[options.rgbe 表示rgbe数据的辐射度纹理]
     */
    setImage(scene, face, imgData, options){
        this._m_UpdateImage = true;
        this._m_CubeMaps[face] = {imgData:(options && options.rgbe) ? imgData.dataRGBE : imgData};
        if(options && options.rgbe){
            this._m_CubeMaps[face].rgbe = true;
            this._m_CubeMaps[face].width = imgData.width;
            this._m_CubeMaps[face].height = imgData.height;
        }
        this._m_CubeMaps[face].updateImage = true;
        // 刷新所有材质持有
        for(let owner in this._m_OwnerFlags){
            this._m_OwnerFlags[owner].owner.setParam(this._m_OwnerFlags[owner].flag, this);
        }
    }

    /**
     * 设置纹理的图素数据。<br/>
     * @param {Scene}[scene]
     * @param {Number}[face]
     * @param {ImgData}[image]
     * @param {Object}[props]
     */
    _setImage(scene, face, image, props) {
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._m_Texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this._m_FlipY);
        if(image.rgbe){
            gl.texImage2D(this._parseFace(gl, face), 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image.imgData);
        }
        else{
            gl.texImage2D(this._parseFace(gl, face), 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image.imgData);
        }
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }

    /**
     * 返回对应的cubeMapFace。<br/>
     * @param {WebGL}[gl]
     * @param {Number}[TextureCubeVars.Face]
     * @return {number | GLenum}
     * @private
     */
    _parseFace(gl, face){
        switch (face) {
            case TextureCubeVars.S_FACE.PositiveX:
                return gl.TEXTURE_CUBE_MAP_POSITIVE_X;
            case TextureCubeVars.S_FACE.NegativeX:
                return gl.TEXTURE_CUBE_MAP_NEGATIVE_X;
            case TextureCubeVars.S_FACE.PositiveY:
                return gl.TEXTURE_CUBE_MAP_POSITIVE_Y;
            case TextureCubeVars.S_FACE.NegativeY:
                return gl.TEXTURE_CUBE_MAP_NEGATIVE_Y;
            case TextureCubeVars.S_FACE.PositiveZ:
                return gl.TEXTURE_CUBE_MAP_POSITIVE_Z;
            case TextureCubeVars.S_FACE.NegativeZ:
                return gl.TEXTURE_CUBE_MAP_NEGATIVE_Z;
        }
    }

    _upload(gl, loc, fun){
        gl.activeTexture(gl.TEXTURE0 + loc);

        if(this._m_UpdateImage){
            // 某些图形驱动api规范仅支持2的
            //self._image = image; // 为了更快地恢复WebGL上下文-内存效率低下？
            for(let face in this._m_CubeMaps){
                if(this._m_CubeMaps[face]){
                    this._setImage(this._m_Scene, face, this._m_CubeMaps[face]);
                    this._m_CubeMaps[face] = null;
                }
            }
            // 为该image生成硬件mipmap
            if(this._m_MinFilter == TextureCubeVars.S_FILTERS.S_LINEAR_MIPMAP_NEAREST || this._m_MagFilter == TextureCubeVars.S_FILTERS.S_LINEAR_MIPMAP_NEAREST){
                this.genMipmap(this._m_Scene);
            }
            // 设置默认纹理滤波
            const gl = this._m_Scene.getCanvas().getGLContext();
            if(this._m_WrapS){
                this._setWrap(this._m_Scene, gl.TEXTURE_WRAP_S, this._parseWrap(gl, this._m_WrapS));
            }
            if(this._m_WrapT){
                this._setWrap(this._m_Scene, gl.TEXTURE_WRAP_T, this._parseWrap(gl, this._m_WrapT));
            }
            if(this._m_WrapR){
                this._setWrap(this._m_Scene, gl.TEXTURE_WRAP_R, this._parseWrap(gl, this._m_WrapR));
            }
            if(this._m_MinFilter){
                this._setFilter(this._m_Scene, gl.TEXTURE_MIN_FILTER, this._parseFilter(gl, this._m_MinFilter));
            }
            if(this._m_MagFilter){
                this._setFilter(this._m_Scene, gl.TEXTURE_MAG_FILTER, this._parseFilter(gl, this._m_MagFilter));
            }
            this._m_UpdateImage = false;
        }

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._m_Texture);
    }

    /**
     * 暂时未想好比较方式。<br/>
     * @param {TextureCubeVars}[textureCubeVars]
     * @return {Boolean}
     */
    compare(textureCubeVars){
        return false;
    }

}
