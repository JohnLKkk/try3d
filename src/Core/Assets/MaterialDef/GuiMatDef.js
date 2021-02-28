/**
 * GuiMatDef,这个材质定义用于渲染Picture。<br/>
 * @author Kkk
 * @date 2020年10月10日10点27分
 */
export default class GuiMatDef {
    constructor() {
        this._m_Vs_Src = '#version 300 es\n' +
            'layout (location=0x001) in vec3 position;\n' +
            'void main(){\n' +
            '   gl_Position = vec4(position, 1.0);\n' +
            '}\n';
        this._m_Fs_Src = '#version 300 es\n' +
            'precision mediump float;\n' +
            'out vec4 outColor;\n' +
            'void main(){\n' +
            '   outColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
            '}\n';
    }
    getVsSrc(){
        return this._m_Vs_Src;
    }
    getFsSrc(){
        return this._m_Fs_Src;
    }

}