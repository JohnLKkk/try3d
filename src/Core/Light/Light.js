/**
 * 灯光组件,所有灯光节点继承该组件。<br/>
 * @author Kkk
 */
import Node from "../Node/Node.js";
import Vector4 from "../Math3d/Vector4.js";

export default class Light extends Node{
    static S_VISIBLE_LIGHT = 0x001;
    static S_STATIC_LIGHT = 0x002;
    static S_DYNAMIC = 0x003;
    getType() {
        return 'Light';
    }
    getTypeId(){
        return -1;
    }

    constructor(owner, cfg) {
        super(owner, cfg);
        // 灯光可以附加在任何节点中
        this._m_Color = new Vector4();
        this._m_Enable = true;
        this._m_Scene.enableLight(this);
        this._m_ProShadow = false;
        this._m_ResetProShadow = this._m_ProShadow;
        this._m_Shadow = null;
        this._m_ShadowCfg = {shadowMapSize:512, backfaceShadows:false};
        this._m_Mark = 0;
        this._init();
    }

    /**
     * 初始化。<br/>
     * @private
     */
    _init(){
        this._m_Mark |= Light.S_VISIBLE_LIGHT;
        this._m_Mark |= Light.S_DYNAMIC;
    }

    /**
     * 激活该灯光。<br/>
     */
    enable(){
        if(this._m_Enable)return;
        this._m_Enable = true;
        this._m_Scene.enableLight(this);

        if(this._m_ResetProShadow){
            this._m_ResetProShadow = false;
            this.proShadow(true);
        }
    }

    /**
     * 返回阴影。<br/>
     * @return {Object}
     */
    getShadow(){
        return this._m_Shadow;
    }

    /**
     * 设置阴影贴图分辨率，只能在第一次调用proShadow时生效。<br/>
     * @param {Number}[shadowMapSize]
     */
    setShadowMapSize(shadowMapSize){
        this._m_ShadowCfg.shadowMapSize = shadowMapSize;
    }

    /**
     * 是否投射阴影。<br/>
     * @param {Boolean}[proShadow]
     */
    proShadow(proShadow){
        this._m_ProShadow = proShadow;
        if(this._m_ProShadow && !this._m_Shadow){
            this._genShadow();
            if(this._m_Shadow){
                this._m_Shadow.setLight(this);
            }
        }
        if(this._m_Shadow){
            this._m_Shadow.enable(proShadow);
        }
    }

    /**
     * 是否投射阴影。<br/>
     * @return {Boolean}
     */
    isProShadow(){
        return this._m_ProShadow;
    }

    /**
     * 创建阴影。<br/>
     * @private
     */
    _genShadow(){
        // 由子类实现
    }

    /**
     * 禁用该灯光。<br/>
     */
    disable(){
        if(this._m_Enable){
            this._m_Enable = false;
            this._m_Scene.disableLight(this);

            if(this._m_ProShadow){
                this._m_ResetProShadow = this._m_ProShadow;
                this.proShadow(false);
            }
        }
    }

    /**
     * 判断该灯是否激活。<br/>
     * @return {Boolean}
     */
    isEnable(){
        return this._m_Enable;
    }

    /**
     * 设置颜色。<br/>
     * @param {Vector4}[color]
     */
    setColor(color){
        this._m_Color.setTo(color);
    }

    /**
     * 返回颜色。<br/>
     * @return {Vector4}
     */
    getColor(){
        return this._m_Color;
    }

    /**
     * 设置颜色rgba。<br/>
     * @param {Number}[r 介于0-1]
     * @param {Number}[g 介于0-1]
     * @param {Number}[b 介于0-1]
     * @param {Number}[a 介于0-1]
     */
    setColorRGBA(r, g, b, a){
        this._m_Color.setToInXYZW(r, g, b, a);
    }

    /**
     * 强制更新包围体。<br/>
     */
    updateBounding(){
        this._updateBounding();
    }

}
