import Vars from "./Vars.js";
import UniformBufferI from "../UniformBufferI.js";
import Tools from "../../Util/Tools.js";

/**
 * Texture2DVars。<br/>
 * 表示2D纹理数据。<br/>
 * @author Kkk
 * @date 2021年3月3日16点39分
 */
export default class Texture2DVars extends Vars{
    static S_TEMP_COLOR = new UniformBufferI(4);
    constructor(scene) {
        super(scene);
        const gl = scene.getCanvas().getGLContext();
        // 创建纹理目标
        this._m_Texture = gl.createTexture();
        // 设置默认纹理滤波
        this.setFilter(scene, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        this.setFilter(scene, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // this.genMipmap(scene);
    }
    genMipmap(scene){
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * 设置纹理滤波。<br/>
     * @param {Scene}[scene]
     * @param {Number}[texEnum]
     * @param {Number}[filter]
     */
    setFilter(scene, texEnum, filter){
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.texParameteri(gl.TEXTURE_2D, texEnum, filter);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * 设置预设颜色值,由于web纹理需要异步加载,所以可以提供一个预设颜色纹理。<br/>
     * @param {Scene}[scene]
     * @param {Vector4}[value]
     */
    setPreloadColor(scene, value){
        let color = Texture2DVars.S_TEMP_COLOR.getArray();
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
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, Texture2DVars.S_TEMP_COLOR.getBufferData());
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
            image = Tools.ensureImageSizePowerOfTwo(image, scene.getCanvas());
            //self._image = image; // For faster WebGL context restore - memory inefficient?
            this.setImage(scene, image);
            // 刷新所有材质持有
            for(let owner in this._m_OwnerFlags){
                this._m_OwnerFlags[owner].owner.setParam(this._m_OwnerFlags[owner].flag, this);
            }
        };
        image.src = src;
    }

    /**
     * 设置纹理的图素数据。<br/>
     * @param {Scene}[scene]
     * @param {ImgData}[image]
     * @param props
     */
    setImage(scene, image, props) {
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    _upload(gl, loc, fun){
        gl.activeTexture(gl.TEXTURE0 + loc);
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
