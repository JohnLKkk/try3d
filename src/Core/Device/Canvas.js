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
        this._m_ClearColor = [0.3, 0.3, 0.3, 1.0];
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
                let extAni = this._m_GL.getExtension('EXT_texture_filter_anisotropic');
                if(!extAni){
                    console.log('不支持各向异性拓展!');
                }
                if(extAni){
                    let maxAnisotropy = this._m_GL.getParameter(extAni.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                    console.log('maxAnisotropy:' + maxAnisotropy);
                    // this._m_GL.texParameterf(this._m_GL.TEXTURE_2D, extAni.TEXTURE_MAX_ANISOTROPY_EXT, 4);
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
        // 移动端有像素密度,所以需要使用这个
        let dpr = window.devicePixelRatio;
        console.log('dpr:' + dpr);
        let resetSize = function(){
            if(parent){
                //调整为parent的大小
                canvas.width = parent.clientWidth * dpr;
                canvas.height = parent.clientHeight * dpr;
                // 上面两行设置物理分辨率
                // 下面两行设置DIP映射缩放
                canvas.style.width = parent.clientWidth + 'px';
                canvas.style.height = parent.clientHeight + 'px';
            }
            else{
                //调整为浏览器可见窗口大小
                canvas.width = document.documentElement.clientWidth * dpr;
                canvas.height = document.documentElement.clientHeight * dpr;
                // 上面两行设置物理分辨率
                // 下面两行设置DIP映射缩放
                canvas.style.width = document.documentElement.clientWidth + 'px';
                canvas.style.height = document.documentElement.clientWidth + 'px';
            }
            Log.debug("改变大小:" + canvas.width + "," + canvas.height);
            self.fire('resize', [canvas.width, canvas.height]);
        };
        // WindowManager.getInstance().addListener(WindowManager.S_ON_WINDOW_SIZE_CHANGE, );
        window.onresize = resetSize;
        resetSize();
    }

    /**
     * 强制刷新大小。<br/>
     * @param {Number}[w]
     * @param {Number}[h]
     */
    resize(w, h){
        let self = this;
        // 移动端有像素密度,所以需要使用这个
        let dpr = window.devicePixelRatio;
        console.log('dpr:' + dpr);
        let resetSize = function(){
            if(w != undefined && h != undefined){
                //调整为parent的大小
                self._m_Canvas.width = w * dpr;
                self._m_Canvas.height = h * dpr;
                // 上面两行设置物理分辨率
                // 下面两行设置DIP映射缩放
                self._m_Canvas.style.width = w + 'px';
                self._m_Canvas.style.height = h + 'px';
            }
            else{
                //调整为浏览器可见窗口大小
                self._m_Canvas.width = document.documentElement.clientWidth * dpr;
                self._m_Canvas.height = document.documentElement.clientHeight * dpr;
                // 上面两行设置物理分辨率
                // 下面两行设置DIP映射缩放
                self._m_Canvas.style.width = document.documentElement.clientWidth + 'px';
                self._m_Canvas.style.height = document.documentElement.clientWidth + 'px';
            }
            Log.debug("改变大小:" + self._m_Canvas.width + "," + self._m_Canvas.height);
            self.fire('resize', [self._m_Canvas.width, self._m_Canvas.height]);
        };
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
        gl.clearColor(this._m_ClearColor[0], this._m_ClearColor[1], this._m_ClearColor[2], this._m_ClearColor[3]);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        gl.cullFace(gl.BACK);
        // <=
        gl.depthFunc(gl.LEQUAL);
        let MAX_UNIFORM_BLOCK_SIZE = gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE);
        console.log('MAX_UNIFORM_BLOCK_SIZE:' + MAX_UNIFORM_BLOCK_SIZE);
    }

    /**
     * 设置ClearColor。<br/>
     * @param {Number}[r]
     * @param {Number}[g]
     * @param {Number}[b]
     * @param {Number}[a]
     */
    setClearColor(r, g, b, a){
        let gl = this._m_GL;
        gl.clearColor(r, g, b, a);
        this._m_ClearColor[0] = r;
        this._m_ClearColor[1] = g;
        this._m_ClearColor[2] = b;
        this._m_ClearColor[3] = a;
    }

    /**
     * 返回ClearColor。<br/>
     * @return {Number[]}
     */
    getClearColor(){
        return this._m_ClearColor;
    }

    /**
     * 返回Canvas宽度。<br/>
     * @return {Number}
     */
    getWidth(){
        return this._m_Canvas.width;
    }

    /**
     * 返回物理密度宽度。<br/>
     * @return {Number}
     */
    getDPRWidth(){
        return this._m_Canvas.width / (1.0/window.devicePixelRatio);
    }

    /**
     * 返回Canvas高度。<br/>
     * @return {Number}
     */
    getHeight(){
        return this._m_Canvas.height;
    }

    /**
     * 返回物理密度高度。<br/>
     * @return {Number}
     */
    getDPRHeight(){
        return this._m_Canvas.height / (1.0/window.devicePixelRatio);
    }

    /**
     * 返回GL上下文
     * @returns {CanvasRenderingContext2D | WebGLRenderingContext | *}
     */
    getGLContext(){
        return this._m_GL;
    }

}
