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
    // 修复接缝的方案
    static _S_FIX_SEAMS_METHOD = {
        // wrap纹理坐标
        Wrap : 0,
        // 延伸纹理坐标
        Stretch : 1,
        // 不修复
        None : 2
    };
    static _S_SQRT_PI = Math.sqrt(Math.PI);
    static _S_SQRT_3PI = Math.sqrt(3.0 / Math.PI);
    static _S_SQRT_5PI = Math.sqrt(5.0 / Math.PI);
    static _S_SQRT_15PI = Math.sqrt(15.0 / Math.PI);
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

    /**
     * 返回此立方体贴图的球谐系数。<br/>
     * @param {ArrayBuffer}[cubeMapPixels]
     * @param {Number}[ProbeTools._FIX_SEAMS_METHOD]
     * @return {Vector3[]}[9个向量的数组，代表每个RGB通道的系数]
     */
    static getSHCoeffs(width, height, cubeMapPixels, fixSeamsMethod){
        let shCoef = [9];
        for(let i = 0;i < 9;i++){
            shCoef.push(new Vector3());
        }

        let shDir = [9];
        let weightAccum = 0.0;
        let weight;

        let texelVect = new Vector3();
        let color = new Vector4();
        for(let f = 0;f < 6;i++){
            for(let y = 0;y < height;y++){
                for(let x = 0;x < width;x++){
                    weight = ProbeTools.getSAAV(x, y, width, f, texelVect, fixSeamsMethod);
                    ProbeTools.evalShBasis(texelVect, shDir);
                    ProbeTools._getPixelColor(x, y, cubeMapPixels[f], color);

                    for (let i = 0; i < 9; i++) {
                        shCoef[i].setToInXYZ(shCoef[i]._m_X + color._m_X * shDir[i] * weight, shCoef[i]._m_Y + color._m_Y * shDir[i] * weight, shCoef[i]._m_Z + color._m_Z * shDir[i] * weight);
                    }

                    weightAccum += weight;
                }
            }
        }

        // 归一化-立体角的总和应等于球体的立体角（4 PI），因此进行归一化以使我们的weightAccum精确匹配4 PI。
        for (let i = 0; i < 9; ++i) {
            shCoef[i].multLength(4.0 * Math.PI / weightAccum);
        }

        return shCoef;
    }

    /**
     * 从指定像素数据中读取(x,y)像素颜色值。<br/>
     * @param {Number}[x 坐标0-width]
     * @param {Number}[y 坐标0-height]
     * @param {ArrayBuffer}[pixels]
     * @param {Vector4}[store]
     * @private
     */
    static _getPixelColor(x, y, pixels, store){

    }

    /**
     * 计算给定图素的球谐系数。<br/>
     * @param {Number}[texelVect]
     * @param {Number[]}[shDir]
     */
    static evalShBasis(texelVect, shDir){
        let xV = texelVect.x;
        let yV = texelVect.y;
        let zV = texelVect.z;

        let x2 = xV * xV;
        let y2 = yV * yV;
        let z2 = zV * zV;

        const sqrtPi = ProbeTools._S_SQRT_PI;
        const sqrt3Pi = ProbeTools._S_SQRT_3PI;
        const sqrt5Pi = ProbeTools._S_SQRT_5PI;
        const sqrt15Pi = ProbeTools._S_SQRT_15PI;

        shDir[0] = (1.0 / (2.0 * sqrtPi));
        shDir[1] = -(sqrt3Pi * yV) / 2.0;
        shDir[2] = (sqrt3Pi * zV) / 2.0;
        shDir[3] = -(sqrt3Pi * xV) / 2.0;
        shDir[4] = (sqrt15Pi * xV * yV) / 2.0;
        shDir[5] = -(sqrt15Pi * yV * zV) / 2.0;
        shDir[6] = (sqrt5Pi * (-1.0 + 3.0 * z2)) / 4.0;
        shDir[7] = -(sqrt15Pi * xV * zV) / 2.0;
        shDir[8] = sqrt15Pi * (x2 - y2) / 4.0;
    }

    /**
     * 返回立体角和向量。<br/>
     * 为给定的x，y纹理坐标和给定的立方体贴图面计算向量坐标。<br/>
     * 还计算这些坐标的立体角并返回。<br/>
     * @param {Number}[x 0-1纹理坐标]
     * @param {Number}[y 0-1纹理坐标]
     * @param {Number}[mapSize 立方体贴图大小,一般用width]
     * @param {Number}[立方体贴图的face id,这里已0-5指定]
     * @param {Vector3}[store 将存储矢量的位置。 不要为此参数提供null]
     * @param {Number}[ProbeTools._S_FIX_SEAMS_METHOD]
     * @return {Number}[给定参数的立体角]
     */
    static getSAAV(x, y, mapSize, face, store, fixSeamsMethod){
        mapSize *= 1.0;
        let u = (2.0 * ( x + 0.5) / mapSize) - 1.0;
        let v = (2.0 * ( y + 0.5) / mapSize) - 1.0;
        ProbeTools._getVFCFTC(x, y, mapSize, face, store, fixSeamsMethod);
        // 立体角重量近似值：
        // U和V是当前面上的-1..1纹理坐标。
        // 获取此纹理像素的投影面积
        let x0, y0, x1, y1;
        let invRes = 1.0 / mapSize;
        x0 = u - invRes;
        y0 = v - invRes;
        x1 = u + invRes;
        y1 = v + invRes;

        return ProbeTools._areaElement(x0, y0) - ProbeTools._areaElement(x0, y1) - ProbeTools._areaElement(x1, y0) + ProbeTools._areaElement(x1, y1);
    }

    /**
     * 用于计算立体角。<br/>
     * @param {Number}[x 纹理坐标]
     * @param {Number}[y 纹理坐标]
     * @return {Number}
     * @private
     */
    static _areaElement(x, y){
        return Math.atan2(x * y, Math.sqrt(x * x + y * y + 1));
    }

    /**
     * 计算给定面和坐标的3个分量矢量坐标。<br/>
     * @param {Number}[x 0-1纹理坐标]
     * @param {Number}[y 0-1纹理坐标]
     * @param {Number}[mapSize 立方体贴图大小,一般用width]
     * @param {Number}[立方体贴图的face id,这里已0-5指定]
     * @param {Vector3}[store 将存储矢量的位置。 不要为此参数提供null]
     * @param {Number}[ProbeTools._S_FIX_SEAMS_METHOD]
     * @return [Vector3]
     */
    static _getVFCFTC(x, y, mapSize, face, store, fixSeamsMethod){

        let u, v;
        x *= 1.0;
        y *= 1.0;
        mapSize *= 1.0;

        if(fixSeamsMethod == ProbeTools._S_FIX_SEAMS_METHOD.Stretch){
            // 参考Nvidia的代码:https://github.com/castano/nvidia-texture-tools/blob/master/src/nvtt/CubeSurface.cpp#L77
            u = (2.0 * x / (mapSize - 1.0)) - 1.0;
            v = (2.0 * y / (mapSize - 1.0)) - 1.0;
        }
        else{
            u = (2.0 * (x + 0.5) / (mapSize)) - 1.0;
            v = (2.0 * (y + 0.5) / (mapSize)) - 1.0;
        }
        if(fixSeamsMethod == ProbeTools._S_FIX_SEAMS_METHOD.Wrap){
            // wrap纹理像素在边缘附近居中。
            let a = Math.pow(mapSize, 2.0) / pow((mapSize - 1.0), 3.0);
            u = a * Math.pow(u, 3.0) + u;
            v = a * Math.pow(v, 3.0) + v;
        }

        // 根据face id计算向量
        switch (face) {
            case 0:
                store.setToInXYZ(1, -v, -u);
                break;
            case 1:
                store.setToInXYZ(-1, -v, u);
                break;
            case 2:
                store.setToInXYZ(u, 1, v);
                break;
            case 3:
                store.setToInXYZ(u, -1, -v);
                break;
            case 4:
                store.setToInXYZ(u, -v, 1);
                break;
            case 5:
                store.setToInXYZ(-u, -v, -1.0);
                break;
        }

        store.normal();
        return store;
    }
}
