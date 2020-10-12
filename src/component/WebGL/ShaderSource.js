/**
 * 着色器源码,定义一个着色器程序源码,一个着色器程序至少应该包含vertex_shader源码和fragment_shader源码。<br/>
 * @author Kkk
 */
export default class ShaderSource {
    static VERTEX_SHADER = "vertex_shader";
    static FRAGMENT_SHADER = "fragment_shader";
    static SOURCE_ENUM = {"vertex_shader":"vertex_shader","fragment_shader":"fragment_shader"};


    // 枚举,这些是作为引擎内置可能存在的输入属性，变量
    static S_POSITION = 0x001;
    static S_NORMAL = 0x002;
    static S_UV = 0x003;
    static S_UV2 = 0x004;
    static S_UV3 = 0x005;
    static S_UV4 = 0x006;
    static S_MODEL_MATRIX = 0x007;
    static S_VIEW_MATRIX = 0x008;
    static S_PROJECT_MATRIX = 0x009;
    static S_MVP = 0x011;
    static S_MV = 0x012;
    static S_VP = 0x013;
    static S_NDP = 0x014;


    static S_POSITION_SRC = "position";
    static S_NORMAL_SRC = "normal";
    static S_UV_SRC = "uv";
    static S_UV2_SRC = "uv2";
    static S_UV3_SRC = "uv3";
    static S_UV4_SRC = "uv4";
    static S_MODEL_MATRIX_SRC = "model_matrix";
    static S_VIEW_MATRIX_SRC = "view_matrix";
    static S_PROJECT_MATRIX_SRC = "project_matrix";
    static S_MVP_SRC = "model_view_project_matrix";
    static S_MV_SRC = "model_view_matrix";
    static S_VP_SRC = "view_project_matrix";
    static S_NDP = "";

    constructor() {
        this._m_Source = {};
    }
    set(type, src){
        if(ShaderSource.SOURCE_ENUM[type]){
            this._m_Source[type] = src;
        }
        else{
            console.error("未知着色器类型:" + type);
        }
    }
    get(type){
        if(ShaderSource.SOURCE_ENUM[type]){
            return this._m_Source[type];
        }
        else{
            console.error("未知着色器类型:" + type);
            return null;
        }
    }

}