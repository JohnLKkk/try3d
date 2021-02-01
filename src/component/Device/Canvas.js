/**
 * 抽象Canvas,包装WebGL显示设备,提供WebGL上下文环境。<br/>
 * @author Kkk
 */
export default class Canvas {
    constructor(canvas, version) {
        version = version || 'webgl2';
        this._m_Canvas = canvas;
        if(this._m_Canvas){
            this._m_GL = this._m_Canvas.getContext(version);
            if(!this._m_GL){
                console.error("浏览器不支持webgl2.0标准!");
            }
            else{
                this._init();
            }
        }
    }

    /**
     * 返回canvas元素
     * @returns {Document}
     */
    getCanvasElement(){
        return this._m_Canvas;
    }
    _init(){
        let gl = this._m_GL;
        gl.clearColor(.3, .3, .3, 1.0);
        gl.enable(gl.DEPTH_TEST);
    }
    getWidth(){
        return this._m_Canvas.width;
    }
    getHeight(){
        return this._m_Canvas.height;
    }

    /**
     * 返回GL上下文
     * @returns {CanvasRenderingContext2D | WebGLRenderingContext | *}
     */
    getGLContext(){
        return this._m_GL;
    }

}
