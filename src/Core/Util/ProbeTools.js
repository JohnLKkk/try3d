import FrameBuffer from "../WebGL/FrameBuffer.js";
import Vector3 from "../Math3d/Vector3.js";
import Camera from "../Scene/Camera.js";
import Tools from "./Tools.js";
import ShaderSource from "../WebGL/ShaderSource.js";
import TextureCubeVars from "../WebGL/Vars/TextureCubeVars.js";
import Vector4 from "../Math3d/Vector4.js";
import Log from "./Log.js";

/**
 * EnvCapture。<br/>
 * 环境捕捉对象，用于将环境数据捕捉到一个CubeMap中，以便提供反射探头或GI探头参考数据。<br/>
 * @author Kkk
 * @date 2021年3月22日13点36分
 */
class EnvCapture {
    static _S_CAPTURE_CONFIG = [
        // PositiveX
        {dir:new Vector3(1, 0, 0), up:new Vector3(0, -1, 0)},
        // NegativeX
        {dir:new Vector3(-1, 0, 0), up:new Vector3(0, -1, 0)},
        // PositiveY
        {dir:new Vector3(0, 1, 0), up:new Vector3(0, 0, 1)},
        // NegativeY
        {dir:new Vector3(0, -1, 0), up:new Vector3(0, 0, -1)},
        // PositiveZ
        {dir:new Vector3(0, 0, 1), up:new Vector3(0, -1, 0)},
        // NegativeZ
        {dir:new Vector3(0, 0, -1), up:new Vector3(0, -1, 0)}
    ];
    static _S_CAPTURE_FACE = {
        0 : TextureCubeVars.S_FACE.PositiveX,
        1 : TextureCubeVars.S_FACE.NegativeX,
        2 : TextureCubeVars.S_FACE.PositiveY,
        3 : TextureCubeVars.S_FACE.NegativeY,
        4 : TextureCubeVars.S_FACE.PositiveZ,
        5 : TextureCubeVars.S_FACE.NegativeZ
    };

    /**
     * 创建一个EnvCapture。<br/>
     * @param {Scene}[scene]
     * @param {Number}[resoulte]
     * @param {Vector3}[position]
     */
    constructor(scene, resoulte, position) {
        this._m_Scene = scene;
        this._m_Resoulte = resoulte;
        this._m_CaptureCameres = [];
        this._m_CaptureFrames = [];
        this._m_CaptureResult = new TextureCubeVars(scene);
        this._m_Position = new Vector3();
        if(position){
            this._m_Position.setTo(position);
        }

        // 初始化
        this._init();
    }

    /**
     * 初始化。<br/>
     * @private
     */
    _init(){
        let at = new Vector3();
        const gl = this._m_Scene.getCanvas().getGLContext();
        for(let i = 0;i < 6;i++){
            this._m_CaptureCameres[i] = new Camera(this._m_Scene, {id:'capture_' + i + "_" + Tools.nextId(), fovy:90.0, aspect:1.0});
            EnvCapture._S_CAPTURE_CONFIG[i].dir.sub(this._m_Position, at);
            this._m_CaptureCameres[i].lookAt(this._m_Position, at, EnvCapture._S_CAPTURE_CONFIG[i].up);
            this._m_CaptureFrames[i] = new FrameBuffer(gl, 'capture_frame_' + i + "_" + Tools.nextId(), this._m_Resoulte, this._m_Resoulte);
            this._m_CaptureFrames[i].addTexture(gl, 'capture_texture_' + i, gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT0, false);
            this._m_CaptureFrames[i].addBuffer(gl, 'capture_depth_' + i, gl.DEPTH24_STENCIL8, gl.DEPTH_STENCIL_ATTACHMENT);
            this._m_CaptureFrames[i].finish(gl, this._m_Scene, false);
        }

        // 设置默认数据
        this._m_CaptureResult.setPreloadColor(this._m_Scene, new Vector4(0.5, 0.5, 0.5, 1.0));
    }

    /**
     * 设置捕捉位置。<br/>
     * @param {Vector3}[pos]
     */
    setPosition(pos){
        this._m_Position.setTo(pos);
    }

    /**
     * 返回捕捉位置。<br/>
     * @return {Vector3}
     */
    getPosition(){
        return this._m_Position;
    }

    /**
     * 捕捉环境数据。<br/>
     */
    capture(){
        const gl = this._m_Scene.getCanvas().getGLContext();
        // 以便编译材质
        this._m_Scene.getRender()._drawEnv(gl);
        let mainCamera = this._m_Scene.getMainCamera();
        let render = this._m_Scene.getRender();
        let pixels = null;

        render.setViewPort(gl, 0, 0, this._m_Resoulte, this._m_Resoulte);
        for(let i = 0;i < 6;i++){
            this._m_Scene.setMainCamera(this._m_CaptureCameres[i]);
            this._m_CaptureFrames[i].use(render);
            this._m_CaptureFrames[i].clear(gl);
            // 目前仅支持捕捉环境（后续完善对场景的捕捉）
            this._m_Scene.getRender()._drawEnv(gl);

            pixels = this._m_CaptureFrames[i].readPixels(gl, '', gl.RGBA, gl.UNSIGNED_BYTE);
            // Log.log('pixels:',pixels);
            // 将像素数据设置到结果纹理中
            this._m_CaptureResult.setImage(this._m_Scene, EnvCapture._S_CAPTURE_FACE[i], pixels, {width:this._m_Resoulte, height:this._m_Resoulte});
        }
        this._m_CaptureResult.setWrap(this._m_Scene, TextureCubeVars.S_WRAPS.S_CLAMP_TO_EDGE, TextureCubeVars.S_WRAPS.S_CLAMP_TO_EDGE, TextureCubeVars.S_WRAPS.S_CLAMP_TO_EDGE);

        this._m_Scene.setMainCamera(mainCamera);
        this._m_Scene.getRender().useDefaultFrame();
        render.setViewPort(gl, 0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight());
    }

    /**
     * 返回捕获数据。<br/>
     * @return {TextureCubeVars}
     */
    getCaptureTextureCube(){
        return this._m_CaptureResult;
    }

}
/**
 * ProbeTools。<br/>
 * 提供一系列RefProbe,GIProbe工具函数。<br/>
 * @author Kkk
 * @date 2021年3月20日16点21分
 */
export default class ProbeTools {
    // 默认捕获分辨率
    static _S_DEFAULT_CAPTURE_RESOLUTE = 256;
    /**
     * 捕获环境数据到探头中。<br/>
     * @param {Scene}[scene]
     * @param {Probe}[probe]
     * @param {Number}[options.resolute 分辨率,默认256]
     */
    static captureProbe(scene, probe, options){
        // 创建捕捉镜头
        const gl = scene.getCanvas().getGLContext();
        let resolute = (options && options.resolute != null) ? options.resolute : ProbeTools._S_DEFAULT_CAPTURE_RESOLUTE;
        let envCapture = new EnvCapture(scene, resolute, probe.getPosition());
        // 开始捕捉
        Log.time('capture!');
        envCapture.capture();
        Log.timeEnd('capture!');
        return envCapture;
    }
}
