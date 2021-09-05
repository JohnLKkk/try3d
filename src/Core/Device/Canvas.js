/**
 * 抽象Canvas,包装WebGL显示设备,提供WebGL上下文环境。<br/>
 * @author Kkk
 */
import Component from "../Component.js";
import Log from "../Util/Log.js";

export default class Canvas extends Component{
    constructor(owner, cfg) {
        super(owner, cfg);
        cfg.version = cfg.version || 'webgl2';
        this._m_Canvas = cfg.canvas;
        if(this._m_Canvas){
            // 默认不需要alpha缓冲区,这个缓冲区的作用详见：https://www.khronos.org/registry/webgl/specs/latest/1.0/index.html#2.4
            // 关闭它可以在fragment中输出alpha<1时正确的不透明渲染,而不是混合html页面背景
            this._m_GL = this._m_Canvas.getContext(cfg.version, {antialias: !!cfg.antialias || true, depth:true, powerPreference:!!cfg.powerPreference || 'high-performance', alpha:!!cfg.alpha || false});
            if(!this._m_GL){
                Log.error("浏览器不支持" + cfg.version + "!");
            }
            else{
                this._m_GL.getExtension("OES_texture_float_linear");

                if (cfg.version == 'webgl2') {
                    this._m_GL.getExtension("EXT_color_buffer_float");
                } else {
                    this._m_GL.getExtension("OES_texture_float");
                    this._m_GL.getExtension("OES_texture_half_float");
                    this._m_GL.getExtension("OES_texture_half_float_linear");
                    if (cfg.mobile) {
                        this._m_GL.getExtension("WEBGL_color_buffer_float");
                    }
                    let extDepth = this._m_GL.getExtension("WEBGL_depth_texture");

                    if (!extDepth) {
                        console.log("Extension Depth texture is not working");
                        alert(
                            ":( Sorry, Your browser doesn't support depth texture extension. Please browse to webglreport.com to see more information."
                        );
                        return;
                    }
                }
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
            Log.debug("改变大小:" + canvas.width + "," + canvas.height);
            self.fire('resize', [canvas.width, canvas.height]);
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
        gl.disable(gl.BLEND);
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
