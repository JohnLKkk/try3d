/**
 * 子着色器源码定义，从materialSourceDef中解析并读取材质着色器源码。<br/>
 * 其中vs和fs可以从外部定义的shader源码解析得到,<br/>
 * 也可以直接从js文件中读取定义的材质js脚本解析得到vs和fs。<br/>
 * @author Kkk
 */
import ShaderSource from "../WebGL/ShaderSource.js";

export default class SubShaderSource {
    constructor(materialSourceDef) {
        // 读取materialSourceDef文件,然后解析出vs和fs源码
        // 提取vs和fs源码后,创建着色器程序。
        this._m_ShaderSource = null;

        // 解析得到vs和fs源码(应该将SubShaderSource转为SubShader,渲染时直接使用SubShader)
        this._m_ShaderSource = new ShaderSource();
        this._m_ShaderSource.set(ShaderSource.VERTEX_SHADER, materialSourceDef.getVsSrc());
        this._m_ShaderSource.set(ShaderSource.FRAGMENT_SHADER, materialSourceDef.getFsSrc());
    }

    /**
     * 返回材质定义的着色器源码。<br/>
     * @returns {Object}[ShaderSource]
     */
    getShaderSource(){
        return this._m_ShaderSource;
    }

}
