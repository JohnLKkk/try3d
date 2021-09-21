/**
 * BasicShadowProcess是所有ShadowProcess的基类。<br/>
 * @author Kkk
 * @date 2021年9月14日14点35分
 */
import Component from "../Component.js";
import Light from "../Light/Light.js";
import RenderState from "../WebGL/RenderState.js";
import Render from "../Render/Render.js";
import Matrix44 from "../Math3d/Matrix44.js";
import FrameBuffer from "../WebGL/FrameBuffer.js";
import ShaderSource from "../WebGL/ShaderSource.js";
import Material from "../Material/Material.js";
import Tools from "../Util/Tools.js";
import MaterialDef from "../Material/MaterialDef.js";
import Internal from "../Render/Internal.js";
import Picture from "../Node/Picture.js";
import Texture2DTargetVars from "../WebGL/Vars/Texture2DTargetVars.js";
import BoolVars from "../WebGL/Vars/BoolVars.js";
import FramePicture from "../Node/FramePicture.js";
import Vector2 from "../Math3d/Vector2.js";
import FloatVars from "../WebGL/Vars/FloatVars.js";
import Vec2Vars from "../WebGL/Vars/Vec2Vars.js";

export default class BasicShadowProcess extends Component{
    // 二次方缩小
    static S_QUADRATIC_SCALING = 0x001;
    // 固定大小
    static S_FIXED = 0x002;


    // 阴影类型（默认为二次方缩小）
    _m_ShadowType = BasicShadowProcess.S_QUADRATIC_SCALING;
    _m_MainCamera;
    // Pre ShadowMap
    _m_PreShadowMat;
    // Post Shadow
    _m_PostShadowMat;
    // shadowMap数目
    _m_NbShadowMaps = 1;
    // 要进行shadow的光源
    _m_Light;
    // 跳过处理
    _m_SkipPass;
    // shadowMap潜在可见性集合
    _m_ShadowGeometryCasts = [];
    // shadow潜在可见性集合
    _m_ShadowGeometryReceivers = [];
    // 过渡远处阴影
    _m_FadeInfo = null;
    _m_ZFarOverride = 0;
    _m_FadeLength = 0;
    // 背面阴影
    _m_BackfaceShadows = true;
    // PCF软阴影边缘阈值
    _m_PCFEdge = 1.0;
    // 阴影强度(默认0.7)
    _m_ShadowIntensity = 0.7;
    // 分辨率倒数
    _m_ResolutionInverse = new Vector2();
    // shadowMapSize倒数
    _m_ShadowMapSizeInverse = new Vector2();
    // 光源矩阵
    _m_LVPM = [];
    // ShadowMap
    _m_ShadowFB = [];
    // ShadowMapSize(默认512)
    _m_ShadowMapSize = 512;
    // 分区ShadowMap大小
    _m_ShadowMapSizes = [];
    // 偏差修正因子
    _m_BiasFactor = 1.0;
    // 偏差修正单位
    _m_BiasUnits = 1.0;
    // 所需的渲染状态
    _m_ShadowRenderState = new RenderState();
    _m_ShadowRenderState2 = new RenderState();
    // 需要上载的shadowMap信息
    _m_UploadShadowMaps = [];
    // 需要上载的lightView信息
    _m_UploadLightViews = [];

    // 激活状态
    _m_Enable = true;

    // 调试
    _m_DebugShadowMap = [];
    _m_Debug = false;





    // 尽量不要依赖外部引用
    static S_SHADOW_MAP_ARRAY_SRC = {
        0:'_shadowMap0',
        1:'_shadowMap1',
        2:'_shadowMap2',
        3:'_shadowMap3',
        4:'_shadowMap4',
        5:'_shadowMap5',
        6:'_shadowMap6'
    };
    static S_LIGHT_SHADOW_VP_ARRAY_SRC = {
        0:'_lightViewProjectMatrix0',
        1:'_lightViewProjectMatrix1',
        2:'_lightViewProjectMatrix2',
        3:'_lightViewProjectMatrix3',
        4:'_lightViewProjectMatrix4',
        5:'_lightViewProjectMatrix5',
        6:'_lightViewProjectMatrix6'
    };
    static S_LIGHT_DIR = "_lightDir";
    static S_LIGHT_POS = "_lightPos";
    static S_SPLITS = "_splits";
    static S_FADEINFO = "_fadeInfo";
    // 分辨率倒数
    static S_RESOLUTION_INVERSE = '_ResolutionInverse';
    static S_SHADOW_MAP_SIZE = "_shadowMapSize";
    // ShadowMapSize倒数
    static S_SHADOW_MAP_SIZE_INVERSE = "_sMapSizeInverse";
    /**
     * @param {Comment}[owner]
     * @param {Number}[cfg.id]
     * @param {Number}[cfg.nbShadowMaps]
     * @param {Number}[cfg.shadowMapSize]
     * @param {Boolean}[cfg.debug]
     * @param {Boolean}[cfg.backfaceShadows]
     */
    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_NbShadowMaps = cfg.nbShadowMaps;
        this._m_ShadowMapSize = cfg.shadowMapSize;
        this._m_Debug = cfg.debug != null ? cfg.debug : false;
        this._m_BackfaceShadows = cfg.backfaceShadows != null ? cfg.backfaceShadows : true;

        const gl = this._m_Scene.getCanvas().getGLContext();
        // 这里的设计有一些架构上的改进,具体参考开发日志
        let minSize = 128;
        let nextSize = this._m_ShadowMapSize;
        for(let i = 0;i < this._m_NbShadowMaps;i++){
            this._m_LVPM[i] = new Matrix44();
            if(this._m_ShadowType == BasicShadowProcess.S_QUADRATIC_SCALING){
                this._m_ShadowFB[i] = new FrameBuffer(gl, 'ShadowFB_' + i, nextSize, nextSize);
                this._m_ShadowMapSizes[i] = nextSize;
                nextSize /= 2;
                nextSize = Math.max(nextSize, minSize);
            }
            else if(this._m_ShadowType == BasicShadowProcess.S_FIXED){
                this._m_ShadowFB[i] = new FrameBuffer(gl, 'ShadowFB_' + i, this._m_ShadowMapSize, this._m_ShadowMapSize);
            }
            else{
                Log.error('错误的阴影类型!');
            }
            this._m_ShadowFB[i].setFixedSize(true);

            // 添加一个颜色附件（原因是为了防止部分webGL实现对FB的支持需要）
            if(this._m_Debug){
                this._m_ShadowFB[i].addTexture(gl, 'ShadowFBDefaultColor', gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT0, false);
            }
            // 添加一个深度缓冲区
            this._m_ShadowFB[i].addTexture(gl, BasicShadowProcess.S_SHADOW_MAP_ARRAY_SRC[i], gl.DEPTH_COMPONENT16, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, gl.DEPTH_ATTACHMENT, false);
            this._m_ShadowFB[i].finish(gl, this._m_Scene, false);

            this._m_UploadShadowMaps[i] = BasicShadowProcess.S_SHADOW_MAP_ARRAY_SRC[i];
            this._m_UploadLightViews[i] = BasicShadowProcess.S_LIGHT_SHADOW_VP_ARRAY_SRC[i];



            // debug
            if(this._m_Debug){
                this._m_DebugShadowMap[i] = new Picture(this._m_Scene, {id:'debug_shadow_map_' + i});
                this._m_DebugShadowMap[i].setSize(0.25, 0.3);
                this._m_DebugShadowMap[i].setLeftTop(-0.75 + 0.55 * i, -0.7);
                this._m_DebugShadowMap[i].useDefaultMat();
                let colorMap = new Texture2DTargetVars(this._m_Scene);
                colorMap.setTextureFormat(Texture2DTargetVars.S_TEXTURE_FORMAT.S_RGBA, Texture2DTargetVars.S_TEXTURE_FORMAT.S_RGBA, Texture2DTargetVars.S_TEXTURE_FORMAT.S_UNSIGNED_BYTE);
                colorMap.target(this._m_ShadowFB[i]);
                this._m_DebugShadowMap[i].getMaterial().setParam('colorMap', colorMap);
                this._m_DebugShadowMap[i].setZIndex(0);
            }
        }





        this._m_ShadowRenderState.setFlag(RenderState.S_STATES[0], RenderState.S_FACE_CULL_FRONT);
        // 调试,所以注释掉了下面这行
        if(!this._m_Debug)
            this._m_ShadowRenderState.setFlag(RenderState.S_STATES[2], 'Off');
        this._m_ShadowRenderState.setFlag(RenderState.S_STATES[7], 'On');
        this._m_ShadowRenderState.setFlag(RenderState.S_STATES[8], [this._m_BiasFactor, this._m_BiasUnits]);
        this._m_ShadowRenderState2.setFlag(RenderState.S_STATES[1], 'Off');
        // this._m_ShadowRenderState2.setFlag(RenderState.S_STATES[4], 'On');
        // this._m_ShadowRenderState2.setFlag(RenderState.S_STATES[5], ['SRC_ALPHA', 'ONE']);




        // mat
        this._m_PreShadowMat = new Material(this._m_Scene, {id:'preShadowMat_' + Tools.nextId(), materialDef:MaterialDef.parse(Internal.S_PRE_SHADOW_DEF_DATA)});
        if(this._m_Debug){
            this._m_PreShadowMat.setParam('debug', new BoolVars().valueOf(true));
        }
        this._m_PostShadowMat = new Material(this._m_Scene, {id:'postShadowMat_' + Tools.nextId(), materialDef:MaterialDef.parse(Internal.S_POST_SHADOW_DEF_DATA)});
        this._m_PostShadowMat.setParam('pcfEdge', new FloatVars().valueOf(this._m_PCFEdge));
        this._m_PostShadowMat.setParam('shadowIntensity', new FloatVars().valueOf(this._m_ShadowIntensity));
        this._m_ShadowMapSizeInverse.setToInXY(1.0 / this._m_ShadowMapSize, 1.0 / this._m_ShadowMapSize);
        let w = this._m_Scene.getCanvas().getWidth();
        let h = this._m_Scene.getCanvas().getHeight();
        this._m_ResolutionInverse.setToInXY(1.0/w, 1.0/h);
        if(this._m_BackfaceShadows){
            this._m_PostShadowMat.setParam('backfaceShadows', new BoolVars().valueOf(true));
        }
        this._m_Scene.getCanvas().on('resize', (w, h)=>{
            this._m_ResolutionInverse.setToInXY(1.0/w, 1.0/h);
        });
        this.initMat();


        this._m_FramePicture = new FramePicture(this._m_Scene, {id:this._m_Id + "_picture"});


        this._m_Scene.getMainCamera().addFilter(this, 0);
    }

    /**
     * 激活状态。<br/>
     * @return {Boolean}
     */
    isEnable(){
        return this._m_Enable;
    }

    /**
     * 是否激活。<br/>
     * @param {Boolean}[enable]
     */
    enable(enable){
        this._m_Enable = enable;
    }

    /**
     * 初始化材质信息，由子类进行参数化。<br/>
     */
    initMat(){
        // 子类实现
    }

    /**
     * 设置偏差修正。<br/>
     * @param {Number}[factor 默认1.0]
     * @param {Number}[units 默认1.0]
     */
    setBias(factor, units){
        this._m_BiasFactor = factor;
        this._m_BiasUnits = units;
        this._m_ShadowRenderState.setFlag(RenderState.S_STATES[8], [this._m_BiasFactor, this._m_BiasUnits]);
    }

    /**
     * 返回偏差修正因子。<br/>
     * @return {Number}
     */
    getBiasFactor(){
        return this._m_BiasFactor;
    }

    /**
     * 返回偏差修正单位。<br/>
     * @return {Number}
     */
    getBiasUnits(){
        return this._m_BiasUnits;
    }

    /**
     * 设置阴影过渡。<br/>
     * @param {Number}[a]
     * @param {Number}[b]
     */
    setFade(a, b){
        if(!this._m_FadeInfo){
            this._m_FadeInfo = new Vec2Vars();
        }
        let value = this._m_FadeInfo.valueFromXY(a, b);
        this._m_PostShadowMat.setParam('fadeInfo', value);
    }

    /**
     * 设置过渡半程,距离视点最远的阴影距离阈值。<br/>
     * @param {Number}[fadeExtend]
     */
    setFadeExtend(fadeExtend){
        if(this._m_ZFarOverride != fadeExtend){
            this._m_ZFarOverride = fadeExtend;
        }
        if(this._m_ZFarOverride == 0){
            // 暂时未实现clearParams接口，所以暂时用下面这段逻辑
            if(this._m_FadeInfo){
                this.setFade(0, 0);
            }
        }
        else{
            this.setFade(this._m_ZFarOverride - this._m_FadeLength, 1.0 / this._m_FadeLength);
        }
    }

    /**
     * 阴影过渡阈值。<br/.
     * @return {Number}
     */
    getFadeExtend(){
        return this._m_ZFarOverride;
    }

    /**
     * 阴影渐变淡化长度。<br/>
     * @param {Number}[fadeLength]
     */
    setFadeLength(fadeLength){
        if(this._m_FadeLength != fadeLength){
            this._m_FadeLength = fadeLength;
        }
        if(this._m_ZFarOverride == 0){
            // 暂时未实现clearParams接口，所以暂时用下面这段逻辑
            if(this._m_FadeInfo){
                this.setFade(0, 0);
            }
        }
        else{
            this.setFade(this._m_ZFarOverride - this._m_FadeLength, 1.0 / this._m_FadeLength);
        }
    }

    /**
     * 阴影渐变淡化长度。<br/>
     * @return {Number}
     */
    getFadeLength(){
        return this._m_FadeLength;
    }

    /**
     * 设置PCFEdge。<br/>
     * @param {Number}[pcfEdge 默认1.0]
     */
    setPCFEdge(pcfEdge){
        if(this._m_PCFEdge != pcfEdge){
            this._m_PCFEdge = pcfEdge;
            this._m_PostShadowMat.setParam('pcfEdge', new FloatVars().valueOf(this._m_PCFEdge));
        }
    }

    /**
     * 返回PCFEdge。<br/>
     * @return {Number}
     */
    getPCFEdge(){
        return this._m_PCFEdge;
    }

    /**
     * 设置阴影强度。<br/>
     * @param {Number}[shadowIntensity 默认0.7]
     */
    setShadowIntensity(shadowIntensity){
        if(this._m_ShadowIntensity != shadowIntensity){
            this._m_ShadowIntensity = shadowIntensity;
            this._m_PostShadowMat.setParam('shadowIntensity', new FloatVars().valueOf(this._m_ShadowIntensity));
        }
    }

    /**
     * 返回阴影强度。<br/>
     * @return {Number}
     */
    getShadowIntensity(){
        return this._m_ShadowIntensity;
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
            // console.log('draw')
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
        // 由子类实现
    }

    /**
     * 上载shadowMap信息。<br/>
     * @param {GLContext}[gl]
     * @param {FrameContext}[frameContext]
     * @private
     */
    _uploadInfo(gl, frameContext){
        let conVars = frameContext.m_LastSubShader.getContextVars();
        let rd = null;
        for(let i = 0;i < this._m_NbShadowMaps;i++){
            rd = conVars[BasicShadowProcess.S_SHADOW_MAP_ARRAY_SRC[i]];
            if(rd != null){
                gl.activeTexture(gl.TEXTURE0 + rd.loc);
                gl.bindTexture(gl.TEXTURE_2D, this._m_ShadowFB[i].getTexture(BasicShadowProcess.S_SHADOW_MAP_ARRAY_SRC[i]).getLoc());
            }
            rd = conVars[BasicShadowProcess.S_LIGHT_SHADOW_VP_ARRAY_SRC[i]];
            if(rd != null){
                gl[rd.fun](rd.loc, false, this._m_LVPM[i].getBufferData());
            }
        }
        if(this._m_BackfaceShadows){
            rd = conVars[BasicShadowProcess.S_RESOLUTION_INVERSE];
            if(rd != null){
                gl.uniform2f(rd.loc, this._m_ResolutionInverse._m_X, this._m_ResolutionInverse._m_Y);
            }
        }
        rd = conVars[BasicShadowProcess.S_SHADOW_MAP_SIZE];
        if(rd != null){
            gl.uniform1f(rd.loc, this._m_ShadowMapSize);
        }
        rd = conVars[BasicShadowProcess.S_SHADOW_MAP_SIZE_INVERSE];
        if(rd != null){
            gl.uniform2f(rd.loc, this._m_ShadowMapSizeInverse._m_X, this._m_ShadowMapSizeInverse._m_Y);
        }
    }

    preFrame(){
        this._m_ShadowGeometryReceivers.length = 0;
        // draw shadowMap
        this._m_SkipPass = !this.visLight();
        if(this._m_SkipPass){
            return;
        }

        // 更新shadow cams
        this.updateShadowCams();

        // shadow map shading(这里的一个优化具体参考我的开发日志)
        let render = this._m_Scene.getRender();
        this._m_MainCamera = this._m_Scene.getMainCamera();
        let frameContext = render.getFrameContext();
        const gl = this._m_Scene.getCanvas().getGLContext();
        frameContext.getRenderState().store();
        if(this._m_ShadowType == BasicShadowProcess.S_FIXED){
            render.setViewPort(gl, 0, 0, this._m_ShadowMapSize, this._m_ShadowMapSize);
        }
        render._checkRenderState(gl, this._m_ShadowRenderState, frameContext.getRenderState());
        render.useForcedMat('PreFrame', this._m_PreShadowMat, 0);
        for(let i = 0;i < this._m_NbShadowMaps;i++){
            if(this._m_ShadowType == BasicShadowProcess.S_QUADRATIC_SCALING){
                render.setViewPort(gl, 0, 0, this._m_ShadowMapSizes[i], this._m_ShadowMapSizes[i]);
            }
            this.generateShadowMap(gl, render, frameContext, i);
        }
        this._m_Scene.setMainCamera(this._m_MainCamera);
        this._m_Scene.getRender().useDefaultFrame();
        render.setViewPort(gl, 0, 0, this._m_Scene.getCanvas().getWidth(), this._m_Scene.getCanvas().getHeight());
        render._checkRenderState(gl, frameContext.getRenderState().restore(), frameContext.getRenderState());
    }
    postFilter(){
        // draw shadow
        if(this._m_SkipPass)return;

        // // 获取接受阴影的潜在可见集合
        // this._m_ShadowGeometryReceivers.length = 0;
        // this.getShadowGeometryReceivers(this._m_ShadowGeometryReceivers);
        // if(this._m_ShadowGeometryReceivers.length > 0){
        //     // post shadow pass
        //     let render = this._m_Scene.getRender();
        //     let frameContext = render.getFrameContext();
        //     const gl = this._m_Scene.getCanvas().getGLContext();
        //     frameContext.getRenderState().store();
        //     render._checkRenderState(gl, this._m_ShadowRenderState2, frameContext.getRenderState());
        //     render.useForcedMat(Render.FORWARD, this._m_PostShadowMat, 0);
        //     this._uploadInfo();
        //     this._m_ShadowGeometryReceivers.forEach(iDrawable=>{
        //         iDrawable.draw(frameContext);
        //     });
        //     render._checkRenderState(gl, frameContext.getRenderState().restore(), frameContext.getRenderState());
        // }


        let render = this._m_Scene.getRender();
        let frameContext = render.getFrameContext();
        const gl = this._m_Scene.getCanvas().getGLContext();
        frameContext.getRenderState().store();
        render._checkRenderState(gl, this._m_ShadowRenderState2, frameContext.getRenderState());
        render.useForcedMat('PostFilter', this._m_PostShadowMat, 0);
        this._uploadInfo(gl, frameContext);
        this._m_FramePicture.draw(frameContext);
        // debug
        if(this._m_Debug){
            for(let i = 0;i < this._m_NbShadowMaps;i++){
                render.useForcedMat(Render.FORWARD, this._m_DebugShadowMap[i].getMaterial(), 0);
                // this._uploadInfo();
                this._m_DebugShadowMap[i].draw(frameContext);
            }
        }
        render._checkRenderState(gl, frameContext.getRenderState().restore(), frameContext.getRenderState());
    }
}
