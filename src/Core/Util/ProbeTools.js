import FrameBuffer from "../WebGL/FrameBuffer.js";
import Vector3 from "../Math3d/Vector3.js";
import Camera from "../Scene/Camera.js";
import Tools from "./Tools.js";
import ShaderSource from "../WebGL/ShaderSource.js";
import TextureCubeVars from "../WebGL/Vars/TextureCubeVars.js";
import Vector4 from "../Math3d/Vector4.js";
import Log from "./Log.js";
import SkyBox from "../Node/Sky/SkyBox.js";
import MaterialDef from "../Material/MaterialDef.js";
import Material from "../Material/Material.js";
import Internal from "../Render/Internal.js";
import FloatVars from "../WebGL/Vars/FloatVars.js";

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
     * @param {Number}[resolute]
     * @param {Vector3}[position]
     * @param {Boolean}[mipmap]
     */
    constructor(scene, resolute, position, mipmap) {
        this._m_Scene = scene;
        this._m_MipMap = mipmap;
        this._m_Resolute = resolute;
        this._m_CaptureCameres = [];
        this._m_CaptureFrames = [];
        this._m_CaptureResult = new TextureCubeVars(scene);
        this._m_CapturePixels = [];
        this._m_Position = new Vector3();
        if(position){
            this._m_Position.setTo(position);
        }

        // 用于捕获prefilterEnvMap(关于这一点，这里有一点需要注意的是，这里虽然保留了cpu解决方案，但是使用gpu解决方案，原因是在web上启用多线程cpu解决方案不如gpu解决方案高效)
        this._m_PrefilterSky = new SkyBox(scene, {id:'prefitlerSky' + Tools.nextId()});
        this._m_PrefilterSky.setMaterial(new Material(scene, {id:'prefilterMat' + Tools.nextId(), materialDef:MaterialDef.parse(Internal.S_PREFILTER_DEF)}));
        this._m_PrefilterSky.getMaterial().setParam('roughness', new FloatVars().valueOf(0));
        this._m_PrefilterSky.getMaterial().setParam('resolution', new FloatVars().valueOf(resolute));
        this._m_PrefilterSky.getMaterial().setParam('envMap', this._m_CaptureResult);
        this._m_PrefilterMap = new TextureCubeVars(scene);
        this._m_PrefilterMap.setFilter(scene, TextureCubeVars.S_FILTERS.S_LINEAR_MIPMAP_NEAREST, TextureCubeVars.S_FILTERS.S_LINEAR);
        this._m_PrefilterMipmap = 0;
        let height = resolute;
        let width = resolute;
        while (height >= 1 || width >= 1){

            if (height == 1 || width == 1) {
                break;
            }

            height /= 2;
            width  /= 2;

            this._m_PrefilterMipmap++;
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
            EnvCapture._S_CAPTURE_CONFIG[i].dir.add(this._m_Position, at);
            this._m_CaptureCameres[i].lookAt(this._m_Position, at, EnvCapture._S_CAPTURE_CONFIG[i].up);
            this._m_CaptureFrames[i] = new FrameBuffer(gl, 'capture_frame_' + i + "_" + Tools.nextId(), this._m_Resolute, this._m_Resolute);
            this._m_CaptureFrames[i].addTexture(gl, 'capture_texture_' + i, gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT0, false, this._m_MipMap);
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
        this._m_Scene.getRender()._resetFrameContext();
        this._m_Scene.getRender()._drawEnv(gl);
        let mainCamera = this._m_Scene.getMainCamera();
        let render = this._m_Scene.getRender();
        let pixels = null;

        render.setViewPort(gl, 0, 0, this._m_Resolute, this._m_Resolute);
        for(let i = 0;i < 6;i++){
            this._m_Scene.setMainCamera(this._m_CaptureCameres[i]);
            this._m_CaptureFrames[i].use(render);
            this._m_CaptureFrames[i].clear(gl);
            // 目前仅支持捕捉环境（后续完善对场景的捕捉）
            this._m_Scene.getRender()._drawEnv(gl);

            pixels = this._m_CaptureFrames[i].readPixels(gl, '', gl.RGBA, gl.UNSIGNED_BYTE);
            this._m_CapturePixels[i] = pixels;
            // Log.log('pixels:',pixels);
            // 将像素数据设置到结果纹理中
            this._m_CaptureResult.setImage(this._m_Scene, EnvCapture._S_CAPTURE_FACE[i], pixels, {width:this._m_Resolute, height:this._m_Resolute});
        }
        this._m_CaptureResult.setWrap(this._m_Scene, TextureCubeVars.S_WRAPS.S_CLAMP_TO_EDGE, TextureCubeVars.S_WRAPS.S_CLAMP_TO_EDGE, TextureCubeVars.S_WRAPS.S_CLAMP_TO_EDGE);

        this._m_Scene.setMainCamera(mainCamera);
        this._m_Scene.getRender().useDefaultFrame();
        render.setViewPort(gl, 0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight());
    }

    /**
     * 捕获PrefilteredEnvMap
     */
    prefiltered(){
        const gl = this._m_Scene.getCanvas().getGLContext();
        let sky = this._m_Scene.getSky();
        this._m_Scene.setSky(this._m_PrefilterSky);
        // 以便编译材质
        this._m_Scene.getRender()._resetFrameContext();
        this._m_Scene.getRender()._drawEnv(gl);
        let mainCamera = this._m_Scene.getMainCamera();
        let render = this._m_Scene.getRender();
        let pixels = null;

        render.setViewPort(gl, 0, 0, this._m_Resolute, this._m_Resolute);
        let mipWidth, mipHeight;
        for(let i = 0;i < 6;i++){
            this._m_Scene.setMainCamera(this._m_CaptureCameres[i]);
            this._m_CaptureFrames[i].use(render);
            this._m_CaptureFrames[i].clear(gl);
            for(let mip = 0;mip <= this._m_PrefilterMipmap;mip++){
                mipWidth = this._m_Resolute * Math.pow(0.5, mip);
                mipHeight = this._m_Resolute * Math.pow(0.5, mip);
                // Log.log('size:(' + mipWidth + "x" + mipHeight + ")");
                this._m_PrefilterSky.getMaterial().setParam('roughness', new FloatVars().valueOf(mip * 1.0 / (this._m_PrefilterMipmap - 1.0)));
                this._m_CaptureFrames[i].clear(gl);
                // 目前仅支持捕捉环境（后续完善对场景的捕捉）
                this._m_Scene.getRender()._drawEnv(gl);

                pixels = this._m_CaptureFrames[i].readPixels(gl, '', gl.RGBA, gl.UNSIGNED_BYTE);
                // 将像素数据设置到结果纹理中
                this._m_PrefilterMap.setImage(this._m_Scene, EnvCapture._S_CAPTURE_FACE[i], pixels, {width:mipWidth, height:mipHeight, mipmapLevel:mip});
            }
        }
        this._m_PrefilterMap.setWrap(this._m_Scene, TextureCubeVars.S_WRAPS.S_CLAMP_TO_EDGE, TextureCubeVars.S_WRAPS.S_CLAMP_TO_EDGE, TextureCubeVars.S_WRAPS.S_CLAMP_TO_EDGE);

        this._m_Scene.setMainCamera(mainCamera);
        this._m_Scene.getRender().useDefaultFrame();
        this._m_Scene.setSky(sky);
        render.setViewPort(gl, 0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight());
    }

    /**
     * 返回捕获数据。<br/>
     * @return {TextureCubeVars}
     */
    getCaptureTextureCube(){
        return this._m_CaptureResult;
    }

    /**
     * 返回捕获数据。<br/>
     * @return {ArrayBuffer[]}
     */
    getCapturePixels(){
        return this._m_CapturePixels;
    }

    /**
     * 返回预过滤环境图。<br/>
     * @return {TextureCubeVars}
     */
    getPrefilterTextureCube(){
        return this._m_PrefilterMap;
    }

    /**
     * 返回PrefilterMipMap级别数量。<br/>
     * @return {Number}
     */
    getPrefilterMipMap(){
        return this._m_PrefilterMipmap;
    }

}
/**
 * ProbeTools。<br/>
 * 提供一系列RefProbe,GIProbe工具函数。<br/>
 * @author Kkk
 * @date 2021年3月20日16点21分
 */
export default class ProbeTools {
    static _S_TEMP_UNIT_X = new Vector3(1, 0, 0);
    static _S_TEMP_UNIT_Y = new Vector3(0, 1, 0);
    static _S_TEMP_UNIT_Z = new Vector3(0, 0, 1);
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
    // 有关这些系数，请参见Peter-Pike Sloan论文。
    static _S_SH_BAND_FACTOR = [
        1.0,
        2.0 / 3.0, 2.0 / 3.0, 2.0 / 3.0,
        1.0 / 4.0, 1.0 / 4.0, 1.0 / 4.0, 1.0 / 4.0, 1.0 / 4.0
    ];
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
        let envCapture = new EnvCapture(scene, resolute, probe.getPosition(), options.mipmap);
        // 开始捕捉
        Log.time('capture!');
        envCapture.capture();
        Log.timeEnd('capture!');
        return envCapture;
    }
    static bakeGIProbe(scene, giProbe, options){
        options = options || {};
        options.mipmap = true;
        let resolute = (options && options.resolute != null) ? options.resolute : ProbeTools._S_DEFAULT_CAPTURE_RESOLUTE;
        let envCapture = ProbeTools.captureProbe(scene, giProbe, options);

        // 可以在子线程中进行
        // 计算球谐系数
        Log.time('shCoeffs');
        let shCoeffs = ProbeTools.getShCoeffs(resolute, resolute, envCapture.getCapturePixels(), ProbeTools._S_FIX_SEAMS_METHOD.Wrap);
        ProbeTools.prepareShCoefs(shCoeffs);
        giProbe.setShCoeffs(shCoeffs);
        Log.timeEnd('shCoeffs');

        // 计算prefilterMap
        Log.time('prefiltered');
        envCapture.prefiltered();
        giProbe.setPrefilterEnvMap(envCapture.getPrefilterTextureCube());
        giProbe.setPrefilterMipmap(envCapture.getPrefilterMipMap());
        Log.timeEnd('prefiltered');
        return envCapture;
    }
    static _bakePrefilteredEnvMap(sEnvMap, resolute, fixSeamsMethod, pem){
        let mipMap = 4;

        let sourcePixels = sEnvMap.getCapturePixels();
        let targetPixels = pem.getCapturePixels();

        let texelVect = new Vector3();
        let color = new Vector3();
        let outColor = new Vector4();
        let targetMipMapSize = resolute;
        for(let mipLevel = 0;mipLevel < mipMap;mipLevel++){
            let roughness = ProbeTools._getRFM(mipLevel, mipMap);
            let samples = ProbeTools._getSFM(mipLevel, mipMap);

            for(let y = 0;y < targetMipMapSize;y++){
                for(let x = 0;x < targetMipMapSize;x++){
                    color.setToInXYZ(0, 0, 0);
                    ProbeTools._getVFCFTC(x, y, targetMipMapSize, face, texelVect, fixSeamsMethod);
                }
            }
        }
    }
    static _prefilterEnvMapTexel(resolute, envMapPixels, roughness, N, numSamples, mipLevel, prefilteredColor){
        let totalWeight = 0.0;

        let rotations = 1;

        let rad = 2.0 * Math.PI / rotations;
        // 偏移旋转以避免采样模式
        let gi = (Math.abs(N._m_Z + N._m_X) * 256.0);
        let offset = rad * (Math.cos((gi * 0.5) % (2.0 * Math.PI)) * 0.5 + 0.5);

        let a2 = roughness * roughness;
        a2 *= a2;

        let upVector = ProbeTools._S_TEMP_UNIT_X;
        if(Math.abs(N._m_Z) < 0.999){
            upVector = ProbeTools._S_TEMP_UNIT_Y;
        }
        let tangentX = new Vector3();
        let tangentY = new Vector3();
        tangentX.setTo(upVector);
        tangentX.cross(N);
        tangentX.normal();
        tangentY.setTo(N);
        tangentY.cross(tangentX);

        // 在模型空间视图中==normal== 0,0,1
        let V = new Vector3(0, 0, 1);

        let lWorld = new Vector3();
        let Xi = new Vector4();
        let H = new Vector3();
        for(let i = 0;i < numSamples;i++){
            Xi = ProbeTools._getHPoint(i, numSamples, Xi);
            H = ProbeTools._iSGGX(Xi, a2, H);
            H.normal();
            let VoH = H._m_Z;
            let L = H.multLength(VoH * 2.0).sub(V);
            let NoL = L._m_Z;

            let computedMipLevel = mipLevel;
            if(mipLevel != 0){
                computedMipLevel = ProbeTools._computeMipLevel(roughness, numSamples, resolute, VoH);
            }

            ProbeTools._2World(L, N, tangentX, tangentY, lWorld);
            totalWeight += 0;
        }
    }
    static _getHPoint(i, nbrSample, store){
        let phi;
        let ui = i;
        store._m_X = i * 1.0 / nbrSample;

        // Radical Inverse：范德·科普特
        ui = (ui << 16) | (ui >> 16);
        ui = ((ui & 0x55555555) << 1) | ((ui & 0xAAAAAAAA) >>> 1);
        ui = ((ui & 0x33333333) << 2) | ((ui & 0xCCCCCCCC) >>> 2);
        ui = ((ui & 0x0F0F0F0F) << 4) | ((ui & 0xF0F0F0F0) >>> 4);
        ui = ((ui & 0x00FF00FF) << 8) | ((ui & 0xFF00FF00) >>> 8);

        ui = ui & 0xffffffff;
        store._m_Y = 2.3283064365386963e-10 * (ui * 1.0);// 0x100000000

        phi = 2.0 * Math.PI * store._m_Y;
        store._m_Z = Math.cos(phi);
        store._m_W = Math.sin(phi);

        return store;
    }
    static _2World(L, N, tangentX, tangentY, store){
        store.setTo(tangentX);
        store.multLength(L._m_X);
        let tmp = new Vector3();
        tmp.set(tangentY);
        tmp.multLength(L._m_Y);
        store.add(tmp);
        tmp.set(N);
        tmp.multLength(L._m_Z);
        store.add(tmp);
    }
    static _samplePixel(resolute, envMapPixels, lWorld, NoL, computedMipLevel, store){
        if(NoL <= 0){
            return 0;
        }
        let c = new Vector4();
        store._m_X = store._m_X + c._m_X * NoL;
        store._m_Y = store._m_Y + c._m_Y * NoL;
        store._m_Z = store._m_Z + c._m_Z * NoL;

        return NoL;
    }

    /**
     * 返回重要性采样。<br/>
     * @param {Vector4}[xi]
     * @param {Number}[a2]
     * @param {Vector3}[store]
     * @return {Vector3}
     * @private
     */
    static _iSGGX(xi, a2, store){
        let cosTheta = Math.sqrt((1.0 - xi._m_X) / (1.0 + (a2 - 1.0) * xi._m_X));
        let sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);

        let sinThetaCosPhi = sinTheta * xi._m_Z;//xi._m_Z is cos(phi)
        let sinThetaSinPhi = sinTheta * xi._m_W;//xi._m_W is sin(phi)

        store._m_X = sinThetaCosPhi;
        store._m_Y = sinThetaSinPhi;
        store._m_Z = cosTheta;
        return store;
    }
    static _ggx(NoH, alpha){
        // 没啥好说的，参考迪斯尼的GGX或Ue4的GGX
        let tmp = alpha / (NoH * NoH * (alpha * alpha - 1.0) + 1.0);
        return tmp * tmp * (1.0 / Math.PI);
    }
    static _computeMipLevel(roughness, numSamples, size, voH){
        // H [2]在本地空间中为NoH
        // 添加1.e-5以避免ggx / 0.0
        let NoH = voH + 1E-5;

        // 概率分布函数
        let Pdf = ProbeTools._ggx(NoH, roughness) * NoH / (4.0 * voH);

        // 该样品代表的立体角
        let omegaS = 1.0 / (numSamples * Pdf);

        // 由1个像素覆盖的立体角，其中包含6个面，分别为EnvMapSize X EnvMapSize
        let omegaP = 4.0 * Math.PI / (6.0 * size * size);

        // 原始论文建议对Mip施加偏见以改善结果
        let mipBias = 1.0; // 我测试了偏差1的结果更好
        let maxLod = Math.log(size) / Math.log(2.0);
        let log2 = Math.log(omegaS / omegaP) / Math.log(2);
        return Math.min(Math.max(0.5 * log2 + mipBias, 0.0), 1.0 * maxLod);
    }

    /**
     * 返回线性粗糙度。<br/>
     * @param {Number}[miplevel]
     * @param {Number}[miptot]
     * @return {Number}
     * @private
     */
    static _getRFM(miplevel, miptot){
        let step = 1.0 / (miptot - 1.0);
        step *= miplevel;
        return step * step;
    }

    /**
     * 返回采样率。<br/>
     * @param {Number}[mipLevel]
     * @param {Number}[miptot]
     * @return {Number}
     * @private
     */
    static _getSFM(mipLevel, miptot){
        return mipLevel == 0 ? 1 : Math.min(1 << (miptot - 1 + (mipLevel) * 2), 8192);
    }

    /**
     * 准备球谐系数。<br/>
     * @param {Vector3[]}[shCoefs]
     */
    static prepareShCoefs(shCoefs){

        const sqrtPi = ProbeTools._S_SQRT_PI;
        const sqrt3Pi = ProbeTools._S_SQRT_3PI;
        const sqrt5Pi = ProbeTools._S_SQRT_5PI;
        const sqrt15Pi = ProbeTools._S_SQRT_15PI;

        let coef0 = (1.0 / (2.0 * sqrtPi));
        let coef1 = -sqrt3Pi / 2.0;
        let coef2 = -coef1;
        let coef3 = coef1;
        let coef4 = sqrt15Pi / 2.0;
        let coef5 = -coef4;
        let coef6 = sqrt5Pi / 4.0;
        let coef7 = coef5;
        let coef8 = sqrt15Pi / 4.0;

        shCoefs[0].multLength(coef0).multLength(ProbeTools._S_SH_BAND_FACTOR[0]);
        shCoefs[1].multLength(coef1).multLength(ProbeTools._S_SH_BAND_FACTOR[1]);
        shCoefs[2].multLength(coef2).multLength(ProbeTools._S_SH_BAND_FACTOR[2]);
        shCoefs[3].multLength(coef3).multLength(ProbeTools._S_SH_BAND_FACTOR[3]);
        shCoefs[4].multLength(coef4).multLength(ProbeTools._S_SH_BAND_FACTOR[4]);
        shCoefs[5].multLength(coef5).multLength(ProbeTools._S_SH_BAND_FACTOR[5]);
        shCoefs[6].multLength(coef6).multLength(ProbeTools._S_SH_BAND_FACTOR[6]);
        shCoefs[7].multLength(coef7).multLength(ProbeTools._S_SH_BAND_FACTOR[7]);
        shCoefs[8].multLength(coef8).multLength(ProbeTools._S_SH_BAND_FACTOR[8]);

    }

    /**
     * 返回此立方体贴图的球谐系数。<br/>
     * @param {Number}[width map宽度]
     * @param {Number}[height map高度]
     * @param {ArrayBuffer}[cubeMapPixels]
     * @param {Number}[ProbeTools._FIX_SEAMS_METHOD]
     * @return {Vector3[]}[9个向量的数组，代表每个RGB通道的系数]
     */
    static getShCoeffs(width, height, cubeMapPixels, fixSeamsMethod){
        let shCoef = [];
        for(let i = 0;i < 9;i++){
            shCoef.push(new Vector3());
        }

        let shDir = [];
        let weightAccum = 0.0;
        let weight;

        let texelVect = new Vector3();
        let color = new Vector4();
        for(let f = 0;f < 6;f++){
            for(let y = 0;y < height;y++){
                for(let x = 0;x < width;x++){
                    weight = ProbeTools.getSAAV(x, y, width, f, texelVect, fixSeamsMethod);
                    ProbeTools.evalShBasis(texelVect, shDir);
                    ProbeTools._getPixelColor(x, y, width, height, cubeMapPixels[f], color);

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
     * @param {Number}[width map宽度]
     * @param {Number}[height map高度]
     * @param {ArrayBuffer}[pixels]
     * @param {Vector4}[store]
     * @private
     */
    static _getPixelColor(x, y, width, height, pixels, store){
        store._m_X = pixels[y * width * 4 + x] / 255.0;
        store._m_Y = pixels[y * width * 4 + x + 1] / 255.0;
        store._m_Z = pixels[y * width * 4 + x + 2] / 255.0;
        store._m_W = pixels[y * width * 4 + x + 3] / 255.0;
    }

    /**
     * 计算给定图素的球谐系数。<br/>
     * @param {Number}[texelVect]
     * @param {Number[]}[shDir]
     */
    static evalShBasis(texelVect, shDir){
        let xV = texelVect._m_X;
        let yV = texelVect._m_Y;
        let zV = texelVect._m_Z;

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
            let a = Math.pow(mapSize, 2.0) / Math.pow((mapSize - 1.0), 3.0);
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
