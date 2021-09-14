/**
 * BasicShadowProcess是所有ShadowProcess的基类。<br/>
 * @author Kkk
 * @date 2021年9月14日14点35分
 */
import Component from "../Component.js";
import Light from "../Light/Light.js";

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
    _m_ShadowGeometryList = [];
    // 光源矩阵
    _m_LVPM = [];
    _m_ShadowFB = [];
    constructor(owner, cfg) {
        super(owner, cfg);

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
     * @param {Number}[shadowMapIndex]
     */
    generateShadowMap(shadowMapIndex){
        // 获取当前光锥范围内的可见性集合
        this._m_ShadowGeometryList.length = 0;
        this._m_ShadowGeometryList = this.getShadowGeometryList(shadowMapIndex, this._m_ShadowGeometryList);

        // 当前光锥
        let shadowCam = this.getShadowCam(shadowMapIndex);

        // 用于post pass
        this._m_LVPM[shadowMapIndex].set(shadowCam.getProjectViewMatrix(true));

        // 渲染当前光锥生成shadowMap
        let mainCamera = this._m_Scene.getMainCamera();
        this._m_Scene.setMainCamera(shadowCam);
        const gl = this._m_Scene.getCanvas().getGLContext();
        this._m_ShadowFB[shadowMapIndex].use(this._m_Scene.getRender());
        this._m_ShadowFB[shadowMapIndex].clear(gl);
        this._m_Scene.setMainCamera(mainCamera);
        this._m_Scene.getRender().useDefaultFrame();
        // render.setViewPort(gl, 0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight());
    }

    /**
     * 返回指定shadowMap的潜在可见性集合，这里有几种优化方案，具体参考我的开发日志。<br/>
     * @param {Number}[shadowMapIndex]
     * @param {Array}[shadowGeometryList]
     * @return {Array}
     */
    getShadowGeometryList(shadowMapIndex, shadowGeometryList){
        return shadowGeometryList;
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
        for(let i = 0;i < this._m_NbShadowMaps;i++){
            this.generateShadowMap(i);
        }
    }
    postFrame(){
        // draw shadow
    }
}
