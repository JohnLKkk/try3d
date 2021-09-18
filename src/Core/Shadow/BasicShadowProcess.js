/**
 * BasicShadowProcess是所有ShadowProcess的基类。<br/>
 * @author Kkk
 * @date 2021年9月14日14点35分
 */
import Component from "../Component.js";
import Light from "../Light/Light.js";
import RenderState from "../WebGL/RenderState.js";
import Matrix44 from "../Math3d/Matrix44.js";
import FrameBuffer from "../WebGL/FrameBuffer.js";
import ShaderSource from "../WebGL/ShaderSource.js";

export default class BasicShadowProcess extends Component{
    // Pre ShadowMap
    _m_PreShadowMat;
    // Post Shadow
    _m_PostShadowMat;
    // shadowMap数目
    _m_NbShadowMaps;
    // 要进行shadow的光源
    _m_Light;
    // 跳过处理
    _m_SkipPass;
    // shadowMap潜在可见性集合
    _m_ShadowGeometryCasts = [];
    // shadow潜在可见性集合
    _m_ShadowGeometryReceivers = [];
    // 过渡远处阴影
    _m_ZFarOverride = 0;
    // 光源矩阵
    _m_LVPM = [];
    _m_ShadowFB = [];
    _m_NbShadowMaps = 1;
    // ShadowMapSize
    _m_ShadowMapSize = 512;
    // 所需的渲染状态
    _m_ShadowRenderState = new RenderState();
    _m_ShadowRenderState2 = new RenderState();

    /**
     * @param {Comment}[owner]
     * @param {Number}[cfg.id]
     * @param {Number}[cfg.nbShadowMaps]
     * @param {Number}[cfg.shadowMapSize]
     */
    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_NbShadowMaps = cfg.nbShadowMaps;
        this._m_ShadowMapSize = cfg.shadowMapSize;

        const gl = this._m_Scene.getCanvas().getGLContext();
        // 这里的设计有一些架构上的改进,具体参考开发日志
        for(let i = 0;i < this._m_NbShadowMaps;i++){
            this._m_LVPM[i] = new Matrix44();
            this._m_ShadowFB[i] = new FrameBuffer(gl, 'ShadowFB_' + i, this._m_ShadowMapSize, this._m_ShadowMapSize);
            this._m_ShadowFB[i].setFixedSize(true);

            // 添加一个颜色附件（原因是为了防止部分webGL实现对FB的支持需要）
            this._m_ShadowFB[i].addTexture(gl, 'ShadowFBDefaultColor', gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT0, false);
            // 添加一个深度缓冲区
            this._m_ShadowFB[i].addTexture(gl, ShaderSource.S_SHADOW_MAP_ARRAY_SRC[i], gl.DEPTH_COMPONENT24 , 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, gl.DEPTH_ATTACHMENT, false);
            this._m_ShadowFB[i].finish(gl, this._m_Scene, false);
        }





        this._m_ShadowRenderState.setFlag(RenderState.S_STATES[0], RenderState.S_FACE_CULL_FRONT);
        this._m_ShadowRenderState.setFlag(RenderState.S_STATES[2], 'Off');
        this._m_ShadowRenderState2.setFlag(RenderState.S_STATES[1], 'Off');
        this._m_ShadowRenderState2.setFlag(RenderState.S_STATES[4], 'On');
        this._m_ShadowRenderState2.setFlag(RenderState.S_STATES[5], ['SRC_ALPHA', 'ONE']);
    }

    /**
     * 设置渲染光源。<br/>
     * @param {Light}[light]
     */
    setLight(light){
        this._m_Light = light;
    }

    /**
     * 返回渲染光源。<br/>
     * @return {Light}
     */
    getLight(){
        return this._m_Light;
    }

    /**
     * 根据lightView更新Shadow Cameras。<br/>
     */
    updateShadowCams(){
        // ...
    }

    /**
     * 判断光源是否为可见光源。<br/>
     * @return {Boolean}
     */
    visLight(){
        return (this._m_Light._m_Mark & Light.S_VISIBLE_LIGHT) != 0;
    }

    /**
     * 生成指定的shadowMap。<br/>
     * @param {GLContext}[gl]
     * @param {Render}[render]
     * @param {FrameContext}[frameContext]
     * @param {Number}[shadowMapIndex]
     */
    generateShadowMap(gl, render, frameContext, shadowMapIndex){
        // 获取当前光锥范围内的可见性集合
        this._m_ShadowGeometryCasts.length = 0;
        this._m_ShadowGeometryCasts = this.getShadowGeometryCasts(shadowMapIndex, this._m_ShadowGeometryCasts);

        // 当前光锥
        let shadowCam = this.getShadowCam(shadowMapIndex);

        // 用于post pass
        this._m_LVPM[shadowMapIndex].set(shadowCam.getProjectViewMatrix(true));

        // 渲染当前光锥生成shadowMap
        this._m_Scene.setMainCamera(shadowCam);
        this._m_ShadowFB[shadowMapIndex].use(render);
        this._m_ShadowFB[shadowMapIndex].clear(gl);
        this._m_ShadowGeometryCasts.forEach(iDrawable=>{
            iDrawable.draw(frameContext);
        });
    }

    /**
     * 返回指定shadowMap的潜在可见性集合，这里有几种优化方案，具体参考我的开发日志。<br/>
     * @param {Number}[shadowMapIndex]
     * @param {Array}[shadowGeometryCasts]
     * @return {Array}
     */
    getShadowGeometryCasts(shadowMapIndex, shadowGeometryCasts){
        return shadowGeometryCasts;
    }

    /**
     * 返回接受阴影处理的潜在可见性集合。<br/>
     * @param {Array}[shadowGeometryReceivers]
     * @return {Array}
     */
    getShadowGeometryReceivers(shadowGeometryReceivers){
        return shadowGeometryReceivers;
    }

    /**
     * 返回指定shadowMap的cam。<br/>
     * @param {Number}[shadowMapIndex]
     * @return {Camera}[camera]
     */
    getShadowCam(shadowMapIndex){

    }

    postQueue(){
        // draw shadowMap
        this._m_SkipPass = !this.visLight();
        if(this._m_SkipPass){
            return;
        }

        // 更新shadow cams
        this.updateShadowCams();

        // shadow map shading(这里的一个优化具体参考我的开发日志)
        let render = this._m_Scene.getRender();
        let mainCamera = this._m_Scene.getMainCamera();
        let frameContext = render.getFrameContext();
        const gl = this._m_Scene.getCanvas().getGLContext();
        frameContext.getRenderState().store();
        render.setViewPort(gl, 0, 0, this._m_ShadowMapSize, this._m_ShadowMapSize);
        render._checkRenderState(gl, this._m_ShadowRenderState, frameContext.getRenderState());
        render.useForcedMat(Render.FORWARD, this._m_PreShadowMat, 0);
        for(let i = 0;i < this._m_NbShadowMaps;i++){
            this.generateShadowMap(gl, render, frameContext, i);
        }
        this._m_Scene.setMainCamera(mainCamera);
        this._m_Scene.getRender().useDefaultFrame();
        render.setViewPort(gl, 0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight());
        render._checkRenderState(gl, frameContext.getRenderState().restore(), frameContext.getRenderState());
    }
    postFrame(){
        // draw shadow
        if(this._m_SkipPass)return;

        // 获取接受阴影的潜在可见集合
        this._m_ShadowGeometryReceivers.length = 0;
        this.getShadowGeometryReceivers(this._m_ShadowGeometryReceivers);
        if(this._m_ShadowGeometryReceivers.length > 0){
            // post shadow pass
            let render = this._m_Scene.getRender();
            let frameContext = render.getFrameContext();
            const gl = this._m_Scene.getCanvas().getGLContext();
            frameContext.getRenderState().store();
            render._checkRenderState(gl, this._m_ShadowRenderState2, frameContext.getRenderState());
            render.useForcedMat(Render.FORWARD, this._m_PostShadowMat, 0);
            this._m_ShadowGeometryReceivers.forEach(iDrawable=>{
                iDrawable.draw(frameContext);
            });
            render._checkRenderState(gl, frameContext.getRenderState().restore(), frameContext.getRenderState());
        }
    }
}
