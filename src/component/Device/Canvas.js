/**
 * 抽象Canvas,包装WebGL显示设备,提供WebGL上下文环境。<br/>
 * @author Kkk
 */
import Component from "../Component.js";

export default class Canvas extends Component{
    constructor(owner, cfg) {
        super(owner, cfg);
        cfg.version = cfg.version || 'webgl2';
        this._m_Canvas = cfg.canvas;
        if(this._m_Canvas){
            this._m_GL = this._m_Canvas.getContext(cfg.version, {antialias: true, depth:true});
            if(!this._m_GL){
                console.error("浏览器不支持webgl2.0标准!");
            }
            else{
                this._init();
            }
            this._sizeCanvas(this._m_Canvas.parentNode, this._m_Canvas);
        }
    }
    /**
     * 监控canvas的大小
     * @param parent
     * @param canvas
     * @private
     */
    _sizeCanvas(parent, canvas){
        let self = this;
        let resetSize = function(){
            if(parent){
                //调整为parent的大小
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
            else{
                //调整为浏览器可见窗口大小
                canvas.width = document.documentElement.clientWidth;
                canvas.height = document.documentElement.clientHeight;
            }
            console.log("改变大小:" + canvas.width + "," + canvas.height);
            self.fire('resize');
        };
        // WindowManager.getInstance().addListener(WindowManager.S_ON_WINDOW_SIZE_CHANGE, );
        window.onresize = resetSize;
        resetSize();
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
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        // <=
        gl.depthFunc(gl.LEQUAL);
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
