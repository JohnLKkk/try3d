/**
 * TextImage。<br/>
 * 使用HTML canvas实现文本纹理。<br/>
 * @author Kkk
 * @data 2021年9月27日17点12分
 */
export default class TextImage {
    _m_TextureCanvas;
    _m_Context;
    _m_Pixelsize;
    _m_Width;
    _m_Height;
    _m_BackgroundColor = '#a0d7ff';
    _m_TextColor = "black";
    _m_AlignLeftOffset = 0.5;
    _m_AlignTopOffset = 0.7;
    _m_CurLabel = null;
    constructor(width, height, label, pixelsize, backgroundColor) {
        this._m_Pixelsize = pixelsize || 60;
        this._m_BackgroundColor = backgroundColor || this._m_BackgroundColor;
        this._m_Width = width;
        this._m_Height = height;
        this._m_TextureCanvas = document.createElement('canvas');
        this._m_TextureCanvas.width = width;
        this._m_TextureCanvas.height = height;
        this._m_TextureCanvas.style.width = width + "px";
        this._m_TextureCanvas.style.height = height + "px";
        this._m_TextureCanvas.style.padding = "0";
        this._m_TextureCanvas.style.margin = "0";
        this._m_TextureCanvas.style.top = "0";
        this._m_TextureCanvas.style.background = this._m_BackgroundColor;
        this._m_TextureCanvas.style.position = "absolute";
        this._m_TextureCanvas.style.opacity = "1.0";
        this._m_TextureCanvas.style.visibility = "hidden";
        this._m_TextureCanvas.style["z-index"] = 1;
        const body = document.getElementsByTagName("body")[0];
        body.appendChild(this._m_TextureCanvas);

        this._m_Context = this._m_TextureCanvas.getContext("2d");
        this._m_Context.translate(this._m_Width, this._m_Height);
        this._m_Context.scale(-1, -1);
        this.setText(label);
    }

    /**
     * 返回图像。<br/>
     * @return {ImageData}
     */
    getImage(){
        return this._m_TextureCanvas;
    }

    /**
     * 设置文本字体像素大小。<br/>
     * @param {Number}[pixelsize 默认60px]
     */
    setPixelSize(pixelsize){
        this._m_Pixelsize = pixelsize;
        this.setText(this._m_CurLabel);
    }

    /**
     * 设置背景颜色，默认为#a0d7ff。<br/>
     * @param {Object}[backgroundColor 可以为十六位颜色表示法，也可以为颜色符号]
     */
    setBackgroundColor(backgroundColor){
        this._m_BackgroundColor = backgroundColor;
        this.setText(this._m_CurLabel);
    }

    /**
     * 设置文本。<br/>
     * @param {String}[text]
     */
    setText(text){
        this._m_CurLabel = text;
        this._m_Context.fillStyle = this._m_BackgroundColor;
        let xmin = 0, ymin = 0;
        this._m_Context.fillRect(xmin, ymin, this._m_Width, this._m_Height);
        this._m_Context.fillStyle = this._m_TextColor;
        this._m_Context.font = this._m_Pixelsize + 'px sans-serif';
        this._m_Context.textAlign = "center";
        let xcenter = xmin + (this._m_Width * this._m_AlignLeftOffset);
        let ycenter = ymin + (this._m_Height * this._m_AlignTopOffset);
        this._m_Context.fillText(text, xcenter, ycenter, this._m_Width);
    }

    /**
     * 设置文本颜色，默认为black。<br/>
     * @param {Object}[textColor 可以是十六位颜色表示法，也可以是颜色符号]
     */
    setTextColor(textColor){
        this._m_TextColor = textColor;
        this.setText(this._m_CurLabel);
    }

    /**
     * 设置文字对齐偏移，默认下leftOffset为0.5，topOffset为0.7，意味着文本绘制在水平中心，垂直百分之三十位置。<br/>
     * @param {Number}[leftOffset 0.0-1.0]
     * @param {Number}[topOffset 0.0-1.0]
     */
    setAlign(leftOffset, topOffset){
        this._m_AlignLeftOffset = leftOffset;
        this._m_AlignTopOffset = topOffset;
        this.setText(this._m_CurLabel);
    }

}
