import {Buffer} from "./Buffer.js";
import Texture from "./Texture.js";
import Picture from "../Node/Picture.js";
import FramePicture from "../Node/FramePicture.js";

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
        // 当前帧图像输出
        this._m_FramePicture = null;
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
    }

    /**
     * 返回所有缓存区。<br/>
     * @return {Buffer[]}
     */
    getBuffers(){
        return this._m_Buffers;
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
    addTexture(gl, name, internalformat, border, format, type, attachId, toDrawBuffer){
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._m_Framebuffer);

        let loc = gl.createTexture();
        let texture = new Texture(name, loc, internalformat, this._m_Width, this._m_Height, border, format, type, null);
        gl.bindTexture(gl.TEXTURE_2D, loc);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalformat, this._m_Width, this._m_Height, 0, format, type, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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
    }

    /**
     * 返回所有纹理附件。<br/>
     * @return {Texture[]}
     */
    getTextures(){
        return this._m_Textures;
    }
    getTexture(name){
        return this._m_NameTextures[name];
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
            console.log("[[" + this._m_Name + "]]无效frameBuffer!");
        }
        switch (gl.checkFramebufferStatus(gl.FRAMEBUFFER)) {
            case gl.FRAMEBUFFER_COMPLETE:
                console.log("[[" + this._m_Name + "]]帧缓冲区已准备好显示。");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                console.log("[[" + this._m_Name + "]]附件类型不匹配或不是所有的帧缓冲附件点都已完成。");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                console.log("[[" + this._m_Name + "]]没有附件。");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                console.log("[[" + this._m_Name + "]]附件的高度和宽度不同。");
                break;
            case gl.FRAMEBUFFER_UNSUPPORTED:
                console.log("[[" + this._m_Name + "]]不支持附件的格式，或者深度和模板附件的渲染缓冲区不同。");
                break;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        if(makeFramePicture){
            this._m_FramePicture = new FramePicture(scene, {id:this._m_Name + "_picture"});
        }
    }

}
