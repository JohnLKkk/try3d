export default class ColorMatDef {
    constructor() {
        this._m_Params = {
            "model_matrix":true,
            "view_matrix":true,
            "project_matrix":true
        };
        this._m_Vs_Src = '#version 300 es\n' +
            'layout (location=0x001) in vec3 position;\n' +
            'uniform mat4 modelMatrix;\n' +
            'layout (std140) uniform VP\n' +
            '{\n' +
            'mat4 viewMatrix;\n' +
            'mat4 projectMatrix;\n' +
            '};\n' +
            'void main(){\n' +
            '   gl_Position = projectMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);\n' +
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
    getParams(){
        return this._m_Params;
    }

}