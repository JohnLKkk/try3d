import {Buffer} from "./Buffer.js";
import Texture from "./Texture.js";
import Picture from "../Node/Picture.js";
import FramePicture from "../Node/FramePicture.js";
import Log from "../Util/Log.js";

/**
 * FrameBuffer。<br/>
 * @author Kkk
 * @date 2021年2月28日5点28分
 */
export default class FrameBuffer {
    constructor(gl, name, w, h) {
        this._m_Name = name;
        this._m_Framebuffer = gl.createFramebuffer();
        // texture列表
        this._m_Textures = [];
        // textureName:texture
        this._m_NameTextures = {};
        // key:attachId,value:texture
        this._m_MapTextures = {};
        // buffer列表
        this._m_Buffers = [];
        // key:attachId,value:buffer
        this._m_MapBuffers = {};
        // 所有启用的drawBuffer
        this._m_DrawBuffers = [];
        this._m_Width = w;
        this._m_Height = h;
        this._m_RelativeWidth = 1;
        this._m_RelativeHeight = 1;
        // frameBuffer元素信息
        this._m_RData = {};
        // 当前帧图像输出
        this._m_FramePicture = null;
        // 固定尺寸
        this._m_FixedSize = false;
        // 相对尺寸
        this._m_RelativeSize = false;
    }

    /**
     * 返回FrameBuffer宽度。<br/>
     * @returns {Number}
     */
    getWidth(){
        return this._m_Width;
    }

    /**
     * 返回FrameBuffer高度。<br/>
     * @returns {Number}
     */
    getHeight(){
        return this._m_Height;
    }

    /**
     * 设置是否为相对尺寸。<br/>
     * @param {Boolean}[relativeSize]
     */
    setRelativeSize(relativeSize){
        this._m_RelativeSize = relativeSize;
    }

    /**
     * 设置相对尺寸比例。<br/>
     * @param {Number}[w 0.0-1.0]
     * @param {Number}[h 0.0-1.0]
     */
    setRelativeWidthHeight(w, h){
        this._m_RelativeWidth = w;
        this._m_RelativeHeight = h;
    }

    /**
     * 是否为相对尺寸的FrameBuffer。<br/>
     * @returns {Boolean}
     */
    isRelativeSize(){
        return this._m_RelativeSize;
    }

    /**
     * 设置是否为固定尺寸。<br/>
     * @param {Boolean}[fixedSize]
     */
    setFixedSize(fixedSize){
        this._m_FixedSize = fixedSize;
    }

    /**
     * 是否为固定尺寸的FrameBuffer。<br/>
     * @return {Boolean}
     */
    isFixedSize(){
        return this._m_FixedSize;
    }

    /**
     * 读取指定frameBuffer的像素数据。<br/>
     * @param {WebGL}[gl]
     * @param {String}[name 读取缓存名称]
     * @param {WebGLEnum}[format]
     * @param {WebGLEnum}[type]
     * @param {Number}[x 开始偏移量]
     * @param {Number}[y 开始偏移量]
     * @param {Number}[w 读取宽度]
     * @param {Number}[h 读取高度]
     * @param {Number}[attachmentId 附件id]
     */
    readPixels(gl, name, format, type, x, y, w, h, attachmentId){
        x = x || 0;
        y = y || 0;
        w = w || this._m_Width;
        h = h || this._m_Height;

        let pixelUnit = -1;
        let pixelType = null;
        // 根据类型读取转换
        switch (format) {
            case gl.RGBA16F:
                pixelType = Float32Array;
                pixelUnit = 4;
                break;
            case gl.RGBA8:
            case gl.RGBA:
                pixelType = type != gl.FLOAT ? Uint8Array : Float32Array;
                pixelUnit = 4;
                break;
            case gl.RGB16F:
                pixelType = Float32Array;
                pixelUnit = 3;
                break;
            case gl.RGB8:
            case gl.RGB:
                pixelType = type != gl.FLOAT ? Uint8Array : Float32Array;
                pixelUnit = 3;
                break;
        }
        const _format = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
        const _type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
        let pixels = new pixelType(w * h * pixelUnit);
        if(attachmentId != undefined){
            gl.readBuffer(gl.COLOR_ATTACHMENT0 + attachmentId);
        }
        gl.readPixels(x, y, w, h, format, type, pixels);
        return pixels;
    }

    /**
     * 返回当前FramePicture。<br/>
     * @return {Picture}
     */
    getFramePicture(){
        return this._m_FramePicture;
    }

    /**
     * 返回当前帧缓冲区。<br/>
     * @return {WebGLFramebuffer | *}
     */
    getFrameBuffer(){
        return this._m_Framebuffer;
    }

    /**
     * 使用该FrameBuffer。<br/>
     * @param {Render}[render]
     */
    use(render){
        let frameContext = render.getFrameContext();
        if(frameContext.m_LastFrameBuffer != this._m_Framebuffer){
            let gl = render._m_Scene.getCanvas().getGLContext();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._m_Framebuffer);
            frameContext.m_LastFrameBuffer = this._m_Framebuffer;
        }
    }

    /**
     * 清楚frameBuffer。<br/>
     * @param gl
     * @private
     */
    clear(gl){
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    /**
     * 附加一个缓存区。<br/>
     * @param {GLContext}[gl]
     * @param {String}[name]
     * @param {GLenum}[format]
     * @param {GLenum}[* @param {GLenum}[format]]
     */
    addBuffer(gl, name, format, attachId){
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._m_Framebuffer);

        let loc = null;
        loc = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, loc);
        let buffer = new Buffer(name, loc, this._m_Width, this._m_Height, format);
        gl.renderbufferStorage(gl.RENDERBUFFER, format, this._m_Width, this._m_Height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachId, gl.RENDERBUFFER, loc);
        this._m_MapBuffers[attachId] = buffer;
        this._m_Buffers.push(buffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        this._rData('buffer', {name, format, attachId});
    }

    /**
     * FrameBuffer元素信息。<br/>
     * @param {String}[type]
     * @param {Object}[cfg]
     * @private
     */
    _rData(type, cfg){
        if(!this._m_RData[type]){
            this._m_RData[type] = {
                keys:{},
                values:[]
            };
        }
        if(!this._m_RData[type].keys[cfg.name]){
            this._m_RData[type].keys[cfg.name] = true;
            this._m_RData[type].values.push(cfg);
        }
    }

    /**
     * 返回所有缓存区。<br/>
     * @return {Buffer[]}
     */
    getBuffers(){
        return this._m_Buffers;
    }

    /**
     * 设置渲染使用的mipmap。<br/>
     * 作废，webGL不支持。<br/>
     * @param {WebGL}[gl]
     * @param {String}[name]
     * @param {WebGLEnum}[attachId]
     * @param {Number}[mipmapLevel]
     */
    setMipMap(gl, name, attachId, mipmapLevel){
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachId, gl.TEXTURE_2D, this._m_NameTextures[name].getLoc(), mipmapLevel);
    }

    /**
     * 添加一个纹理缓冲。<br/>
     * @param {GLContext}[gl]
     * @param {String}[name]
     * @param {GLenum}[internalformat]
     * @param {GLenum}[border]
     * @param {GLenum}[format]
     * @param {GLenum}[type]
     * @param {GLenum}[attachId]
     * @param {Boolean}[toDrawBuffer true表示启用该颜色输出缓存]
     */
    addTexture(gl, name, internalformat, border, format, type, attachId, toDrawBuffer, genMipmap){
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._m_Framebuffer);

        let loc = gl.createTexture();
        let texture = new Texture(name, loc, internalformat, this._m_Width, this._m_Height, border, format, type, null);
        gl.bindTexture(gl.TEXTURE_2D, loc);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalformat, this._m_Width, this._m_Height, 0, format, type, null);
        if(genMipmap){
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
        else{
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachId, gl.TEXTURE_2D, loc, 0);
        this._m_MapTextures[attachId] = texture;
        this._m_Textures.push(texture);
        this._m_NameTextures[name] = texture;

        if(toDrawBuffer){
            this._m_DrawBuffers.push(attachId);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        this._rData('texture', {name, internalformat, border, format, type, attachId, toDrawBuffer, genMipmap});
    }

    /**
     * 返回所有纹理附件。<br/>
     * @return {Texture[]}
     */
    getTextures(){
        return this._m_Textures;
    }

    /**
     * 返回指定名称的纹理附件。<br/>
     * @param {String}[name]
     * @return {Texture}
     */
    getTexture(name){
        return this._m_NameTextures[name];
    }

    /**
     * 重新设置frameBuffer大小。<br/>
     * @param {GLContext}[gl]
     * @param {Number}[w]
     * @param {Number}[h]
     */
    resize(gl, w, h){
        if(this._m_FixedSize)return;
        if(this._m_RelativeSize){
            w = w * this._m_RelativeWidth;
            h = h * this._m_RelativeHeight;
        }
        if(this._m_Width != w || this._m_Height != h){
            this._m_Width = w;
            this._m_Height = h;

            // 删除掉当前帧缓冲
            gl.deleteFramebuffer(this._m_Framebuffer);
            // 重新创建
            this._m_Framebuffer = gl.createFramebuffer();
            // texture列表
            this._m_Textures = [];
            // textureName:texture
            this._m_NameTextures = {};
            // key:attachId,value:texture
            this._m_MapTextures = {};
            // buffer列表
            this._m_Buffers = [];
            // key:attachId,value:buffer
            this._m_MapBuffers = {};
            // 所有启用的drawBuffer
            this._m_DrawBuffers = [];
            let data = null;
            for(let type in this._m_RData){
                data = this._m_RData[type].values;
                if(type == 'buffer'){
                    data.forEach(d=>{
                        this.addBuffer(gl, d.name, d.format, d.attachId);
                    });
                }
                else if(type == 'texture'){
                    data.forEach(d=>{
                        this.addTexture(gl, d.name, d.internalformat, d.border, d.format, d.type, d.attachId, d.toDrawBuffer, d.genMipmap);
                    });
                }
            }
            this.finish(gl);
        }
    }

    /**
     * 生成FrameBuffer。<br/>
     * @param {GLContext}[gl]
     */
    finish(gl, scene, makeFramePicture){
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._m_Framebuffer);
        if(this._m_DrawBuffers.length > 0)
            gl.drawBuffers(this._m_DrawBuffers);
        if(!gl.isFramebuffer(this._m_Framebuffer)){
            Log.error("[[" + this._m_Name + "]]无效frameBuffer!");
        }
        switch (gl.checkFramebufferStatus(gl.FRAMEBUFFER)) {
            case gl.FRAMEBUFFER_COMPLETE:
                Log.log("[[" + this._m_Name + "]]帧缓冲区已准备好显示。");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                Log.error("[[" + this._m_Name + "]]附件类型不匹配或不是所有的帧缓冲附件点都已完成。");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                Log.error("[[" + this._m_Name + "]]没有附件。");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                Log.error("[[" + this._m_Name + "]]附件的高度和宽度不同。");
                break;
            case gl.FRAMEBUFFER_UNSUPPORTED:
                Log.error("[[" + this._m_Name + "]]不支持附件的格式，或者深度和模板附件的渲染缓冲区不同。");
                break;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        if(makeFramePicture){
            this._m_FramePicture = new FramePicture(scene, {id:this._m_Name + "_picture"});
        }
    }

}
