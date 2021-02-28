/**
 * SubPass描述每个渲染阶段,其中可包含多个具体Pass。<br/>
 * @author Kkk
 * @date 2021年2月13日15点36分
 */
export default class SubPass {
    constructor(renderPath) {
        // 渲染路径
        this._m_RenderPath = renderPath;
        // 当前subPass指定的subShaders
        // 注意,添加的对象是{subShader,renderState}
        this._m_SubShaders = [];
        // key:subShaderName,value:{subShader,renderState}
        this._m_SubShaderMaps = {};
        // 当前SubPass使用的FrameBuffer(每个SubPass都可以使用自己的FrameBuffer,为null时使用默认的FrameBuffer)
        this._m_FBId = null;
    }

    /**
     * 设置当前SubPass使用的FrameBuffer。<br/>
     * @param {String}[fbId]
     */
    setFBId(fbId){
        this._m_FBId = fbId;
    }

    /**
     * 返回当前SubPass使用的frameBufferId。<br/>
     * @return {String}
     */
    getFBId(){
        return this._m_FBId;
    }

    /**
     * 返回当前subPass指定的渲染路径。<br/>
     * @return {String}
     */
    getRenderPath(){
        return this._m_RenderPath;
    }

    /**
     * 添加一个subShader。<br/>
     * @param {SubShader}[subShader]
     */
    addSubShader(subShader){
        this._m_SubShaders.push(subShader);
        this._m_SubShaderMaps[subShader.subShader.getName()] = subShader;
    }

    /**
     * 返回所有subShader。
     * @return {SubShader[]}
     */
    getSubShaders(){
        return this._m_SubShaders;
    }
    getSubShaderMaps(){
        return this._m_SubShaderMaps;
    }

}
