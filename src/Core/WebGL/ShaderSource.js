/**
 * 着色器源码,定义一个着色器程序源码,一个着色器程序至少应该包含vertex_shader源码和fragment_shader源码。<br/>
 * @author Kkk
 */
export default class ShaderSource {
    static VERTEX_SHADER = "vertex_shader";
    static FRAGMENT_SHADER = "fragment_shader";
    static SOURCE_ENUM = {"vertex_shader":"vertex_shader","fragment_shader":"fragment_shader"};


    // 枚举,这些是作为引擎内置可能存在的输入属性，变量
    static S_BARYCENTRIC = 0x000;
    static S_POSITION = 0x001;
    static S_COLOR = 0x002;
    static S_NORMAL = 0x003;
    static S_TANGENT = 0x004;
    static S_UV0 = 0x005;
    static S_UV1 = 0x006;
    static S_UV2 = 0x007;
    static S_UV3 = 0x008;
    static S_JOINT_0 = 0x009;
    static S_WEIGHT_0 = 0x00A;
    static S_MODEL_MATRIX = 0x011;
    static S_VIEW_MATRIX = 0x012;
    static S_PROJECT_MATRIX = 0x013;
    static S_MVP = 0x014;
    static S_MV = 0x015;
    static S_VP = 0x016;
    static S_NDP = 0x017;
    static S_G_BUFFER0 = 0;
    static S_G_BUFFER1 = 1;
    static S_G_BUFFER2 = 2;
    static S_G_DEPTH = 3;


    static S_BARYCENTRIC_SRC = "_barycentric";
    static S_POSITION_SRC = "_position";
    static S_COLOR_SRC = "_color";
    static S_NORMAL_SRC = "_normal";
    static S_TANGENT_SRC = "_tangent";
    static S_UV0_SRC = "_uv0";
    static S_UV1_SRC = "_uv1";
    static S_UV2_SRC = "_uv2";
    static S_UV3_SRC = "_uv3";
    static S_JOINT_0_SRC = "_joint_0";
    static S_WEIGHT_0_SRC = "_weight_0";
    static S_JOINTS_SRC = "_joints";
    static S_OUT_COLOR = "_outColor";
    static S_OUT_POSITION = "gl_Position";
    static S_MODEL_MATRIX_SRC = "_model_matrix";
    static S_VIEW_MATRIX_SRC = "_view_matrix";
    static S_PROJECT_MATRIX_SRC = "_project_matrix";
    static S_MVP_SRC = "_model_view_project_matrix";
    static S_MV_SRC = "_model_view_matrix";
    static S_VP_SRC = "_view_project_matrix";
    static S_NDP = "";

    // 着色选项
    // 唯一shading阶段
    static S_UNIQUE_SHADING_SRC = '_uniqueShading';
    // 灯光系统
    static S_V_LIGHT_DATA_SRC = '_vLightData';
    static S_W_LIGHT_DATA_SRC = '_wLightData';
    // multi pass 下每个光源的三个信息
    static S_MULTI_ID_SRC = '_multiId';
    static S_BLEND_GI_PROBES = '_blend_gi_probes';
    static S_V_LIGHT_DATA0_SRC = '_vLight_Data_0';
    static S_V_LIGHT_DATA1_SRC = '_vLight_Data_1';
    static S_V_LIGHT_DATA2_SRC = '_vLight_Data_2';
    static S_W_LIGHT_DATA0_SRC = '_wLight_Data_0';
    static S_W_LIGHT_DATA1_SRC = '_wLight_Data_1';
    static S_W_LIGHT_DATA2_SRC = '_wLight_Data_2';
    static S_AMBIENT_LIGHT_COLOR = '_ambientLightColor';
    static S_CUR_LIGHT_COUNT_SRC = '_curLightCount';
    static S_NB_LIGHTS = '_NB_LIGHTS';
    // 默认为4个灯光批次
    static S_BATCH_LIGHT_SIZE = 4 * 3;
    static resizeBatchLightSize(size){
        if(size != ShaderSource.S_BATCH_LIGHT_SIZE){
            ShaderSource.S_BATCH_LIGHT_SIZE = size * 3;
            ShaderSource.Context_Data["Context.VLightData"].modifier = '[' + ShaderSource.S_BATCH_LIGHT_SIZE + ']';
            ShaderSource.Context_Data["Context.WLightData"].modifier = '[' + ShaderSource.S_BATCH_LIGHT_SIZE + ']';
        }
    }

    static S_CAMERA_POSITION_SRC = "_cameraPosition";

    // Skin
    static S_MAX_BONE = 256;
    static S_SKINS_SRC = '_C_SKINS';

    // 常用宏
    static S_SRGB_SRC = '_C_SRGB';
    static S_GIPROBES_SRC = '_C_GIPROBES';
    static S_PSSM_SRC = '_C_PSSM';
    static S_POINTLIGHT_SHADOWS_SRC = '_C_POINTLIGHT_SHADOWS';
    static S_SPOTLIGHT_SHADOWS_SRC = '_C_SPOTLIGHT_SHADOWS';
    static S_FADE_SRC = '_C_FADE';

    static S_G_BUFFER0_SRC = "_gBuffer0";
    static S_G_BUFFER1_SRC = "_gBuffer1";
    static S_G_BUFFER2_SRC = "_gBuffer2";
    // 纹理深度(目前webGL2.0不支持深度纹理,但作为标记,仍然在这里提供)
    static S_G_DEPTH_SRC = "_gDepth";
    static S_G_DEPTH_RENDER_BUFFER_SRC = "_gDepthRenderBuffer";
    static S_SCREEN_SRC = "_screen";

    static S_FORWARD_COLOR_MAP_SRC = "_forwardColorMap";
    static S_IN_SCREEN_SRC = "_inScreenMap";
    static S_IN_DEPTH_SRC = "_inDepthMap";

    // Tile
    static S_LIGHT_NUM_SRC = "_lightNum";
    // Tile中ppx编码的光源检索
    static S_TILE_LIGHT_DECODE_SRC = "_tileLightDecode";
    // Tile中ppx编码的光源id
    static S_TILE_LIGHT_INDEX_SRC = "_tileLightIndex";
    // Tile中采样偏移大小
    static S_TILE_LIGHT_OFFSET_SIZE = "_tileLightOffsetSize";
    // Tile中光源编码信息0
    static S_TILE_W_LIGHT_DATA_0 = "_tileWLightData0";
    static S_TILE_V_LIGHT_DATA_0 = "_tileVLightData0";
    // Tile中光源编码信息1
    static S_TILE_W_LIGHT_DATA_1 = "_tileWLightData1";
    static S_TILE_V_LIGHT_DATA_1 = "_tileVLightData1";
    // Tile中光源编码信息2
    static S_TILE_W_LIGHT_DATA_2 = "_tileWLightData2";
    static S_TILE_V_LIGHT_DATA_2 = "_tileVLightData2";

    // 预过滤环境光照辐射
    static S_PREF_ENV_MAP_SRC = "_prefEnvMap";
    // 光探头数据
    static S_WGIPROBE_SRC = "_wGIProbe";
    // 球谐系数
    static S_SH_COEFFS_SRC = "_ShCoeffs";

    // 分辨率倒数
    static S_RESOLUTION_INVERSE = '_ResolutionInverse';


    // Shadows
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
    static S_SHADOW_MAP_SIZE = "_shadowMapSize";
    static S_SHADOW_MAP_SIZE_INVERSE = "_sMapSizeInverse";

    // 上下文块
    static ContextBlocks = {
        S_VIEW_MATRIX_SRC:true,
        S_PROJECT_MATRIX_SRC:true,
        S_VP_SRC:true
    };
    static MAT = 'layout (std140) uniform MAT\n' +
        '{\n' +
        'mat4 ' + ShaderSource.S_VIEW_MATRIX_SRC + ';\n' +
        'mat4 ' + ShaderSource.S_PROJECT_MATRIX_SRC + ';\n' +
        'mat4 ' + ShaderSource.S_VP_SRC + ';\n' +
        '};\n';
    static VIEW = 'layout (std140) uniform VIEW\n' +
        '{\n' +
        'vec3 ' + ShaderSource.S_CAMERA_POSITION_SRC + ';\n' +
        '};\n';
    static VIEW_PORT = "layout (std140) uniform VIEW_PORT\n" +
        "{\n" +
        "vec2 " + ShaderSource.S_RESOLUTION_INVERSE + ';\n' +
        '};\n';
    static BLOCKS = {
        'MAT':{blockIndex:0x001, blockDef:ShaderSource.MAT},
        'VIEW':{blockIndex:0x002, blockDef:ShaderSource.VIEW},
        'VIEW_PORT':{blockIndex:0x003, blockDef:ShaderSource.VIEW_PORT},
    };
    static Context_RenderDataRefFBs = {
        "_gBuffer0":'DefaultDeferredShadingFrameBuffer',
        "_gBuffer1":'DefaultDeferredShadingFrameBuffer',
        "_gBuffer2":'DefaultDeferredShadingFrameBuffer',
        "_gDepth":'DefaultDeferredShadingFrameBuffer',
        "_forwardColorMap":'DefaultForwardShadingFrameBuffer',
        "_inScreenMap":'DefaultPostFilterShadingFrameBuffer',
        "_inDepthMap":'DefaultPostFilterShadingFrameBuffer',
    };

    // code
    // 后期改为库文件
    static S_TRY3D_LIGHTING_LIB = '// 计算光照方向\n' +
        '            // 对于DirLight,PointLight以及SpotLight,lightType依次为0.0,1.0,2.0\n' +
        '            // 输出光照方向\n' +
        '            // lightDir.w存储衰减率(对于DirLight,衰减值一直为1,对于Point或Spot,衰减值随着半径而变小,衰减值越小,表示衰减度越大)\n' +
        '            void ComputeLightDir(in vec3 worldPos, in float lightType, in vec4 position, out vec4 lightDir, out vec3 lightVec){\n' +
        '                // 只有lightType = 0.0时,posLight为0.0,否则posLight为1.0\n' +
        '                float posLight = step(0.5f, lightType);\n' +
        '\n' +
        '                // 计算光照位置\n' +
        '                // 对于DirLight,lightVec = position.xyz * sign(-0.5f) = position.xyz * -1.0f;其中position代表DirLight的方向\n' +
        '                // 对于PointLight和SpotLight,lightVec = position.xyz * sign(1.0f - 0.5f) - (worldPos * 1.0f) = positions.xyz * 1.0f - worldPos;其中position代表Light的位置\n' +
        '                lightVec = position.xyz * sign(posLight - 0.5f) - (worldPos * posLight);\n' +
        '                float dist = length(lightVec);\n' +
        '\n' +
        '                // 对于DirLight,lightDir.w = 1.0f\n' +
        '                //lightDir.w = clamp(1.0f - position.w * dist * posLight, 0.0f, 1.0f);\n' +
        '\n' +
        '                lightDir.w = (1.0f - position.w * dist) / (1.0f + position.w * dist * dist);\n' +
        '                lightDir.w = clamp(lightDir.w, 1.0f - posLight, 1.0f);\n' +
        '\n' +
        '                // 归一化\n' +
        '                lightDir.xyz = lightVec / vec3(dist);\n' +
        '            }\n' +
        '            // 基于BlinnPhong光照模型计算光照因子\n' +
        '            // brdf.x保存漫反射部分;brdf.y保存镜面反射部分\n' +
        '            void ComputeLighting(in vec3 normal, in vec3 viewDir, in vec3 lightDir, in float attenuation, in float shininess, out vec2 brdf){\n' +
        '                // diffuse部分\n' +
        '                float diffuseBRDF = max(0.0f, dot(normal, lightDir));\n' +
        '                // specular部分\n' +
        '                // 半角向量代替viewDir参与光照计算\n' +
        '                vec3 H = normalize(viewDir + lightDir);\n' +
        '                float HdotN = max(0.0f, dot(H, normal));\n' +
        '                float specularBRDF = pow( HdotN, shininess );\n' +
        '\n' +
        '                // 衰减,对于PointLight和SpotLight来说有效,对于DirLight而言,attenuation一直为1\n' +
        '                brdf.x = diffuseBRDF * attenuation;\n' +
        '                brdf.y = specularBRDF * attenuation;\n' +
        '            }\n' +
        '            // 返回Spot范围衰减\n' +
        '            float ComputeSpotFalloff(in vec4 spotDirection, in vec3 lightDir){\n' +
        '                float curAngleCos = dot(lightDir, -spotDirection.xyz);\n' +
        '                float innerAngleCos = floor(spotDirection.w) * 0.001f;\n' +
        '                float outerAngleCos = fract(spotDirection.w);\n' +
        '                float innerMinusOuter = innerAngleCos - outerAngleCos;\n' +
        '                float falloff = clamp((curAngleCos - outerAngleCos) / innerMinusOuter, 0.0f, 1.0f);\n' +
        '                //if(curAngleCos > innerMinusOuter)\n' +
        '                //    falloff = 1.0f;\n' +
        '                //else\n' +
        '                //    falloff = 0.0f;\n' +
        '\n' +
        '                #ifdef SRGB\n' +
        '                    // Use quadratic falloff (notice the ^4)\n' +
        '                    return pow(clamp((curAngleCos - outerAngleCos) / innerMinusOuter, 0.0, 1.0), 4.0);\n' +
        '                #else\n' +
        '                    // Use linear falloff\n' +
        '                    return falloff;\n' +
        '                #endif\n' +
        '            }\n';

    // 上下文数据
    static Context_Data = {
        "Context.InPosition":{src:ShaderSource.S_POSITION_SRC, loc:ShaderSource.S_POSITION, pattern:/Context.InPosition/, pattern2:/Context.InPosition[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InPosition/g, tag:ShaderSource.S_POSITION_SRC, type:"vec3"},
        "Context.InBarycentric":{src:ShaderSource.S_BARYCENTRIC_SRC, loc:ShaderSource.S_BARYCENTRIC, pattern:/Context.InBarycentric/, pattern2:/Context.InBarycentric[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InBarycentric/g, tag:ShaderSource.S_BARYCENTRIC_SRC, type:"vec3"},
        "Context.InNormal":{src:ShaderSource.S_NORMAL_SRC, loc:ShaderSource.S_NORMAL, pattern:/Context.InNormal/, pattern2:/Context.InNormal[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InNormal/g, tag:ShaderSource.S_NORMAL_SRC, type:"vec3"},
        "Context.InTangent":{src:ShaderSource.S_TANGENT_SRC, loc:ShaderSource.S_TANGENT, pattern:/Context.InTangent/, pattern2:/Context.InTangent[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InTangent/g, tag:ShaderSource.S_TANGENT_SRC, type:"vec4"},
        "Context.InUv0":{src:ShaderSource.S_UV0_SRC, loc:ShaderSource.S_UV0, pattern:/Context.InUv0/, pattern2:/Context.InUv0[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InUv0/g, tag:ShaderSource.S_UV0_SRC, type:"vec2"},
        "Context.InJoint0":{src:ShaderSource.S_JOINT_0_SRC, loc:ShaderSource.S_JOINT_0, pattern:/Context.InJoint0/, pattern2:/Context.InJoint0[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InJoint0/g, tag:ShaderSource.S_JOINT_0_SRC, type:"vec4"},
        "Context.InWeight0":{src:ShaderSource.S_WEIGHT_0_SRC, loc:ShaderSource.S_WEIGHT_0, pattern:/Context.InWeight0/, pattern2:/Context.InWeight0[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InWeight0/g, tag:ShaderSource.S_WEIGHT_0_SRC, type:"vec4"},
        "Context.OutPosition":{src:ShaderSource.S_OUT_POSITION, pattern:/Context.OutPosition/, pattern2:/Context.OutPosition[\s+-;.,\*\\]{1,}/, tagPattern:/Context.OutPosition/g, tag:"gl_Position"},
        "Context.ProjectViewModelMatrix":{src:ShaderSource.S_MVP_SRC, pattern:/Context.ProjectViewModelMatrix/, pattern2:/Context.ProjectViewModelMatrix[\s+-;.,\*\\]{1,}/, tagPattern:/Context.ProjectViewModelMatrix/g, tag:"_model_view_project_matrix", type:"mat4", utype:"uniform mat4"},
        "Context.ViewMatrix":{src:ShaderSource.S_VIEW_MATRIX_SRC, pattern:/Context.ViewMatrix/, pattern2:/Context.ViewMatrix[\s+-;.,\*\\]{1,}/, tagPattern:/Context.ViewMatrix/g, tag:ShaderSource.S_VIEW_MATRIX_SRC, def:'MAT'},
        "Context.ProjectMatrix":{src:ShaderSource.S_PROJECT_MATRIX_SRC, pattern:/Context.ProjectMatrix/, pattern2:/Context.ProjectMatrix[\s+-;.,\*\\]{1,}/, tagPattern:/Context.ProjectMatrix/g, tag:ShaderSource.S_PROJECT_MATRIX_SRC, def:'MAT'},
        "Context.ModelMatrix":{src:ShaderSource.S_MODEL_MATRIX_SRC, pattern:/Context.ModelMatrix/, pattern2:/Context.ModelMatrix[\s+-;.,\*\\]{1,}/, tagPattern:/Context.ModelMatrix/g, tag:ShaderSource.S_MODEL_MATRIX_SRC, type:"mat4", utype:"uniform mat4"},
        "Context.ProjectViewMatrix":{src:ShaderSource.S_VP_SRC, pattern:/Context.ProjectViewMatrix/, pattern2:/Context.ProjectViewMatrix[\s+-;.,\*\\]{1,}/, tagPattern:/Context.ProjectViewMatrix/g, tag:ShaderSource.S_VP_SRC, def:'MAT'},
        "Context.OutColor":{src:ShaderSource.S_OUT_COLOR, pattern:/Context.OutColor/, pattern2:/Context.OutColor[\s+-;.,\*\\]{1,}/, tagPattern:/Context.OutColor/g, tag:"_outColor", type:"out vec4"},
        "Context.Joints":{src:ShaderSource.S_JOINTS_SRC, pattern:/Context.Joints/, pattern2:/Context.Joints[\s+-;.,\*\\]{1,}/, tagPattern:/Context.Joints/g, tag:ShaderSource.S_JOINTS_SRC, type:"vec4", utype:"uniform mat4", modifier:'[' + ShaderSource.S_MAX_BONE + ']'},
        "Context.VLightData":{src:ShaderSource.S_V_LIGHT_DATA_SRC, pattern:/Context.VLightData/, pattern2:/Context.VLightData[\s+-;.,\*\\]{1,}/, tagPattern:/Context.VLightData/g, tag:ShaderSource.S_V_LIGHT_DATA_SRC, type:"vec4", utype:"uniform vec4", modifier:'[' + ShaderSource.S_BATCH_LIGHT_SIZE + ']'},
        "Context.MultiId":{src:ShaderSource.S_MULTI_ID_SRC, pattern:/Context.MultiId/, pattern2:/Context.MultiId[\s+-;.,\*\\]{1,}/, tagPattern:/Context.MultiId/g, tag:ShaderSource.S_MULTI_ID_SRC, type:"int", utype:"uniform int"},
        "Context.TileLightNum":{src:ShaderSource.S_LIGHT_NUM_SRC, pattern:/Context.TileLightNum/, pattern2:/Context.TileLightNum[\s+-;.,\*\\]{1,}/, tagPattern:/Context.TileLightNum/g, tag:ShaderSource.S_LIGHT_NUM_SRC, type:"int", utype:"uniform int"},
        "Context.TileLightOffsetSize":{src:ShaderSource.S_TILE_LIGHT_OFFSET_SIZE, pattern:/Context.TileLightOffsetSize/, pattern2:/Context.TileLightOffsetSize[\s+-;.,\*\\]{1,}/, tagPattern:/Context.TileLightOffsetSize/g, tag:ShaderSource.S_TILE_LIGHT_OFFSET_SIZE, type:"float", utype:"uniform float"},
        "Context.BlendGiProbes":{src:ShaderSource.S_BLEND_GI_PROBES, pattern:/Context.BlendGiProbes/, pattern2:/Context.BlendGiProbes[\s+-;.,\*\\]{1,}/, tagPattern:/Context.BlendGiProbes/g, tag:ShaderSource.S_BLEND_GI_PROBES, type:"bool", utype:"uniform bool"},
        "Context.UniqueShading":{src:ShaderSource.S_UNIQUE_SHADING_SRC, pattern:/Context.UniqueShading/, pattern2:/Context.UniqueShading[\s+-;.,\*\\]{1,}/, tagPattern:/Context.UniqueShading/g, tag:ShaderSource.S_UNIQUE_SHADING_SRC, type:"bool", utype:"uniform bool"},
        "Context.VLight_Data_0":{src:ShaderSource.S_V_LIGHT_DATA0_SRC, pattern:/Context.VLight_Data_0/, pattern2:/Context.VLight_Data_0[\s+-;.,\*\\]{1,}/, tagPattern:/Context.VLight_Data_0/g, tag:ShaderSource.S_V_LIGHT_DATA0_SRC, type:"vec4", utype:"uniform vec4"},
        "Context.VLight_Data_1":{src:ShaderSource.S_V_LIGHT_DATA1_SRC, pattern:/Context.VLight_Data_1/, pattern2:/Context.VLight_Data_1[\s+-;.,\*\\]{1,}/, tagPattern:/Context.VLight_Data_1/g, tag:ShaderSource.S_V_LIGHT_DATA1_SRC, type:"vec4", utype:"uniform vec4"},
        "Context.VLight_Data_2":{src:ShaderSource.S_V_LIGHT_DATA2_SRC, pattern:/Context.VLight_Data_2/, pattern2:/Context.VLight_Data_2[\s+-;.,\*\\]{1,}/, tagPattern:/Context.VLight_Data_2/g, tag:ShaderSource.S_V_LIGHT_DATA2_SRC, type:"vec4", utype:"uniform vec4"},
        "Context.WLightData":{src:ShaderSource.S_W_LIGHT_DATA_SRC, pattern:/Context.WLightData/, pattern2:/Context.WLightData[\s+-;.,\*\\]{1,}/, tagPattern:/Context.WLightData/g, tag:ShaderSource.S_W_LIGHT_DATA_SRC, type:"vec4", utype:"uniform vec4", modifier:'[' + ShaderSource.S_BATCH_LIGHT_SIZE + ']'},
        "Context.WLight_Data_0":{src:ShaderSource.S_W_LIGHT_DATA0_SRC, pattern:/Context.WLight_Data_0/, pattern2:/Context.WLight_Data_0[\s+-;.,\*\\]{1,}/, tagPattern:/Context.WLight_Data_0/g, tag:ShaderSource.S_W_LIGHT_DATA0_SRC, type:"vec4", utype:"uniform vec4"},
        "Context.WLight_Data_1":{src:ShaderSource.S_W_LIGHT_DATA1_SRC, pattern:/Context.WLight_Data_1/, pattern2:/Context.WLight_Data_1[\s+-;.,\*\\]{1,}/, tagPattern:/Context.WLight_Data_1/g, tag:ShaderSource.S_W_LIGHT_DATA1_SRC, type:"vec4", utype:"uniform vec4"},
        "Context.WLight_Data_2":{src:ShaderSource.S_W_LIGHT_DATA2_SRC, pattern:/Context.WLight_Data_2/, pattern2:/Context.WLight_Data_2[\s+-;.,\*\\]{1,}/, tagPattern:/Context.WLight_Data_2/g, tag:ShaderSource.S_W_LIGHT_DATA2_SRC, type:"vec4", utype:"uniform vec4"},
        "Context.AmbientLightColor":{src:ShaderSource.S_AMBIENT_LIGHT_COLOR, pattern:/Context.AmbientLightColor/, pattern2:/Context.AmbientLightColor[\s+-;.,\*\\]{1,}/, tagPattern:/Context.AmbientLightColor/g, tag:ShaderSource.S_AMBIENT_LIGHT_COLOR, type:"vec3", utype:"uniform vec3"},
        "Context.CurLightCount":{src:ShaderSource.S_CUR_LIGHT_COUNT_SRC, pattern:/Context.CurLightCount/, pattern2:/Context.CurLightCount[\s+-;.,\*\\]{1,}/, tagPattern:/Context.CurLightCount/g, tag:ShaderSource.S_CUR_LIGHT_COUNT_SRC, type:"int", utype:'uniform int'},
        "Context.CameraPosition":{src:ShaderSource.S_CAMERA_POSITION_SRC, pattern:/Context.CameraPosition/, pattern2:/Context.CameraPosition[\s+-;.,\*\\]{1,}/, tagPattern:/Context.CameraPosition/g, tag:ShaderSource.S_CAMERA_POSITION_SRC, def:'VIEW'},
        "Context.WGIProbe":{src:ShaderSource.S_WGIPROBE_SRC, pattern:/Context.WGIProbe/, pattern2:/Context.WGIProbe[\s+-;.,\*\\]{1,}/, tagPattern:/Context.WGIProbe/g, tag:ShaderSource.S_WGIPROBE_SRC, type:"vec4", utype:"uniform vec4"},
        "Context.ShCoeffs":{src:ShaderSource.S_SH_COEFFS_SRC, pattern:/Context.ShCoeffs/, pattern2:/Context.ShCoeffs[\s+-;.,\*\\]{1,}/, tagPattern:/Context.ShCoeffs/g, tag:ShaderSource.S_SH_COEFFS_SRC, type:"vec3", utype:"uniform vec3", modifier:'[' + 9 + ']'},

        // 输入类型缓存
        "Context.InGBuffer0":{src:ShaderSource.S_G_BUFFER0_SRC, pattern:/Context.InGBuffer0/, pattern2:/Context.InGBuffer0[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InGBuffer0/g, tag:ShaderSource.S_G_BUFFER0_SRC, type:"sampler2D", utype:"uniform sampler2D", flag:"renderData"},
        "Context.InGBuffer1":{src:ShaderSource.S_G_BUFFER1_SRC, pattern:/Context.InGBuffer1/, pattern2:/Context.InGBuffer1[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InGBuffer1/g, tag:ShaderSource.S_G_BUFFER1_SRC, type:"sampler2D", utype:"uniform sampler2D", flag:"renderData"},
        "Context.InGBuffer2":{src:ShaderSource.S_G_BUFFER2_SRC, pattern:/Context.InGBuffer2/, pattern2:/Context.InGBuffer2[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InGBuffer2/g, tag:ShaderSource.S_G_BUFFER2_SRC, type:"sampler2D", utype:"uniform sampler2D", flag:"renderData"},
        "Context.InGDepth":{src:ShaderSource.S_G_DEPTH_SRC, pattern:/Context.InGDepth/, pattern2:/Context.InGDepth[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InGDepth/g, tag:ShaderSource.S_G_DEPTH_SRC, type:"sampler2D", utype:"uniform sampler2D", flag:"renderData"},
        "Context.InScreen":{src:ShaderSource.S_IN_SCREEN_SRC, pattern:/Context.InScreen/, pattern2:/Context.InScreen[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InScreen/g, tag:ShaderSource.S_IN_SCREEN_SRC, type:"sampler2D", utype:"uniform sampler2D", flag:"renderData"},
        "Context.InDepth":{src:ShaderSource.S_IN_DEPTH_SRC, pattern:/Context.InDepth/, pattern2:/Context.InDepth[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InDepth/g, tag:ShaderSource.S_IN_DEPTH_SRC, type:"sampler2D", utype:"uniform sampler2D", flag:"renderData"},
        "Context.InForwardColorMap":{src:ShaderSource.S_FORWARD_COLOR_MAP_SRC, pattern:/Context.InForwardColorMap/, pattern2:/Context.InForwardColorMap[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InForwardColorMap/g, tag:ShaderSource.S_FORWARD_COLOR_MAP_SRC, type:"sampler2D", utype:"uniform sampler2D", flag:"renderData"},
        "Context.InPrefEnvMap":{src:ShaderSource.S_PREF_ENV_MAP_SRC, pattern:/Context.InPrefEnvMap/, pattern2:/Context.InPrefEnvMap[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InPrefEnvMap/g, tag:ShaderSource.S_PREF_ENV_MAP_SRC, type:"samplerCube", utype:"uniform samplerCube"},
        "Context.InTileLightDecode":{src:ShaderSource.S_TILE_LIGHT_DECODE_SRC, pattern:/Context.InTileLightDecode/, pattern2:/Context.InTileLightDecode[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InTileLightDecode/g, tag:ShaderSource.S_TILE_LIGHT_DECODE_SRC, type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InTileLightIndex":{src:ShaderSource.S_TILE_LIGHT_INDEX_SRC, pattern:/Context.InTileLightIndex/, pattern2:/Context.InTileLightIndex[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InTileLightIndex/g, tag:ShaderSource.S_TILE_LIGHT_INDEX_SRC, type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InTileWLightData0":{src:ShaderSource.S_TILE_W_LIGHT_DATA_0, pattern:/Context.InTileWLightData0/, pattern2:/Context.InTileWLightData0[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InTileWLightData0/g, tag:ShaderSource.S_TILE_W_LIGHT_DATA_0, type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InTileVLightData0":{src:ShaderSource.S_TILE_V_LIGHT_DATA_0, pattern:/Context.InTileVLightData0/, pattern2:/Context.InTileVLightData0[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InTileVLightData0/g, tag:ShaderSource.S_TILE_V_LIGHT_DATA_0, type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InTileWLightData1":{src:ShaderSource.S_TILE_W_LIGHT_DATA_1, pattern:/Context.InTileWLightData1/, pattern2:/Context.InTileWLightData1[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InTileWLightData1/g, tag:ShaderSource.S_TILE_W_LIGHT_DATA_1, type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InTileVLightData1":{src:ShaderSource.S_TILE_V_LIGHT_DATA_1, pattern:/Context.InTileVLightData1/, pattern2:/Context.InTileVLightData1[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InTileVLightData1/g, tag:ShaderSource.S_TILE_V_LIGHT_DATA_1, type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InTileWLightData2":{src:ShaderSource.S_TILE_W_LIGHT_DATA_2, pattern:/Context.InTileWLightData2/, pattern2:/Context.InTileWLightData2[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InTileWLightData2/g, tag:ShaderSource.S_TILE_W_LIGHT_DATA_2, type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InTileVLightData2":{src:ShaderSource.S_TILE_V_LIGHT_DATA_2, pattern:/Context.InTileVLightData2/, pattern2:/Context.InTileVLightData2[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InTileVLightData2/g, tag:ShaderSource.S_TILE_V_LIGHT_DATA_2, type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InShadowMap0":{src:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[0], pattern:/Context.InShadowMap0/, pattern2:/Context.InShadowMap0[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InShadowMap0/g, tag:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[0], type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InShadowMap1":{src:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[1], pattern:/Context.InShadowMap1/, pattern2:/Context.InShadowMap1[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InShadowMap1/g, tag:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[1], type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InShadowMap2":{src:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[2], pattern:/Context.InShadowMap2/, pattern2:/Context.InShadowMap2[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InShadowMap2/g, tag:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[2], type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InShadowMap3":{src:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[3], pattern:/Context.InShadowMap3/, pattern2:/Context.InShadowMap3[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InShadowMap3/g, tag:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[3], type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InShadowMap4":{src:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[4], pattern:/Context.InShadowMap4/, pattern2:/Context.InShadowMap4[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InShadowMap4/g, tag:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[4], type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InShadowMap5":{src:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[5], pattern:/Context.InShadowMap5/, pattern2:/Context.InShadowMap5[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InShadowMap5/g, tag:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[5], type:"sampler2D", utype:"uniform sampler2D"},
        "Context.InShadowMap6":{src:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[6], pattern:/Context.InShadowMap6/, pattern2:/Context.InShadowMap6[\s+-;.,\*\\]{1,}/, tagPattern:/Context.InShadowMap6/g, tag:ShaderSource.S_SHADOW_MAP_ARRAY_SRC[6], type:"sampler2D", utype:"uniform sampler2D"},
        "Context.LightViewProjectMatrix0":{src:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[0], pattern:/Context.LightViewProjectMatrix0/, pattern2:/Context.LightViewProjectMatrix0[\s+-;.,\*\\]{1,}/, tagPattern:/Context.LightViewProjectMatrix0/g, tag:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[0], type:"mat4", utype:"uniform mat4"},
        "Context.LightViewProjectMatrix1":{src:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[1], pattern:/Context.LightViewProjectMatrix1/, pattern2:/Context.LightViewProjectMatrix1[\s+-;.,\*\\]{1,}/, tagPattern:/Context.LightViewProjectMatrix1/g, tag:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[1], type:"mat4", utype:"uniform mat4"},
        "Context.LightViewProjectMatrix2":{src:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[2], pattern:/Context.LightViewProjectMatrix2/, pattern2:/Context.LightViewProjectMatrix2[\s+-;.,\*\\]{1,}/, tagPattern:/Context.LightViewProjectMatrix2/g, tag:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[2], type:"mat4", utype:"uniform mat4"},
        "Context.LightViewProjectMatrix3":{src:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[3], pattern:/Context.LightViewProjectMatrix3/, pattern2:/Context.LightViewProjectMatrix3[\s+-;.,\*\\]{1,}/, tagPattern:/Context.LightViewProjectMatrix3/g, tag:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[3], type:"mat4", utype:"uniform mat4"},
        "Context.LightViewProjectMatrix4":{src:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[4], pattern:/Context.LightViewProjectMatrix4/, pattern2:/Context.LightViewProjectMatrix4[\s+-;.,\*\\]{1,}/, tagPattern:/Context.LightViewProjectMatrix4/g, tag:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[4], type:"mat4", utype:"uniform mat4"},
        "Context.LightViewProjectMatrix5":{src:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[5], pattern:/Context.LightViewProjectMatrix5/, pattern2:/Context.LightViewProjectMatrix5[\s+-;.,\*\\]{1,}/, tagPattern:/Context.LightViewProjectMatrix5/g, tag:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[5], type:"mat4", utype:"uniform mat4"},
        "Context.LightViewProjectMatrix6":{src:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[6], pattern:/Context.LightViewProjectMatrix6/, pattern2:/Context.LightViewProjectMatrix6[\s+-;.,\*\\]{1,}/, tagPattern:/Context.LightViewProjectMatrix6/g, tag:ShaderSource.S_LIGHT_SHADOW_VP_ARRAY_SRC[6], type:"mat4", utype:"uniform mat4"},
        "Context.LightDir":{src:ShaderSource.S_LIGHT_DIR, pattern:/Context.LightDir/, pattern2:/Context.LightDir[\s+-;.,\*\\]{1,}/, tagPattern:/Context.LightDir/g, tag:ShaderSource.S_LIGHT_DIR, type:"vec3", utype:"uniform vec3"},
        "Context.LightPos":{src:ShaderSource.S_LIGHT_POS, pattern:/Context.LightPos/, pattern2:/Context.LightPos[\s+-;.,\*\\]{1,}/, tagPattern:/Context.LightPos/g, tag:ShaderSource.S_LIGHT_POS, type:"vec3", utype:"uniform vec3"},
        "Context.Splits":{src:ShaderSource.S_SPLITS, pattern:/Context.Splits/, pattern2:/Context.Splits[\s+-;.,\*\\]{1,}/, tagPattern:/Context.Splits/g, tag:ShaderSource.S_SPLITS, type:"vec4", utype:"uniform vec4"},
        "Context.Fadeinfo":{src:ShaderSource.S_FADEINFO, pattern:/Context.Fadeinfo/, pattern2:/Context.Fadeinfo[\s+-;.,\*\\]{1,}/, tagPattern:/Context.Fadeinfo/g, tag:ShaderSource.S_FADEINFO, type:"vec2", utype:"uniform vec2"},
        "Context.ResolutionInverse":{src:ShaderSource.S_RESOLUTION_INVERSE, pattern:/Context.ResolutionInverse/, pattern2:/Context.ResolutionInverse[\s+-;.,\*\\]{1,}/, tagPattern:/Context.ResolutionInverse/g, tag:ShaderSource.S_RESOLUTION_INVERSE, def:'VIEW_PORT'},
        "Context.ShadowMapSize":{src:ShaderSource.S_SHADOW_MAP_SIZE, pattern:/Context.ShadowMapSize/, pattern2:/Context.ShadowMapSize[\s+-;.,\*\\]{1,}/, tagPattern:/Context.ShadowMapSize/g, tag:ShaderSource.S_SHADOW_MAP_SIZE, type:"float", utype:"uniform float"},
        "Context.SMapSizeInverse":{src:ShaderSource.S_SHADOW_MAP_SIZE_INVERSE, pattern:/Context.SMapSizeInverse/, pattern2:/Context.SMapSizeInverse[\s+-;.,\*\\]{1,}/, tagPattern:/Context.SMapSizeInverse/g, tag:ShaderSource.S_SHADOW_MAP_SIZE_INVERSE, type:"vec2", utype:"uniform vec2"},
        // 输出类型缓存
        "Context.OutGBuffer0":{src:ShaderSource.S_G_BUFFER0_SRC, loc:ShaderSource.S_G_BUFFER0, pattern:/Context.OutGBuffer0/, pattern2:/Context.OutGBuffer0[\s+-;.,\*\\]{1,}/, tagPattern:/Context.OutGBuffer0/g, tag:ShaderSource.S_G_BUFFER0_SRC, type:"vec4"},
        "Context.OutGBuffer1":{src:ShaderSource.S_G_BUFFER1_SRC, loc:ShaderSource.S_G_BUFFER1, pattern:/Context.OutGBuffer1/, pattern2:/Context.OutGBuffer1[\s+-;.,\*\\]{1,}/, tagPattern:/Context.OutGBuffer1/g, tag:ShaderSource.S_G_BUFFER1_SRC, type:"vec4"},
        "Context.OutGBuffer2":{src:ShaderSource.S_G_BUFFER2_SRC, loc:ShaderSource.S_G_BUFFER2, pattern:/Context.OutGBuffer2/, pattern2:/Context.OutGBuffer2[\s+-;.,\*\\]{1,}/, tagPattern:/Context.OutGBuffer2/g, tag:ShaderSource.S_G_BUFFER2_SRC, type:"vec4"},
        "Context.OutGDepth":{src:ShaderSource.S_G_DEPTH_SRC, loc:ShaderSource.S_G_DEPTH, pattern:/Context.OutGDepth/, pattern2:/Context.OutGDepth[\s+-;.,\*\\]{1,}/, tagPattern:/Context.OutGDepth/g, tag:ShaderSource.S_G_DEPTH_SRC, type:"vec4"},

        // 全局变量
        "Context.Skins":{src:ShaderSource.S_SKINS_SRC, pattern:/Context.Skins/, pattern2:/Context.Skins[\s+-;.,\*\\]{1,}/, tagPattern:/Context.Skins/g, tag:ShaderSource.S_SKINS_SRC, isFlagVariable:true},
        "Context.Srgb":{src:ShaderSource.S_SRGB_SRC, pattern:/Context.Srgb/, pattern2:/Context.Srgb[\s+-;.,\*\\]{1,}/, tagPattern:/Context.Srgb/g, tag:ShaderSource.S_SRGB_SRC, isFlagVariable:true},
        "Context.GIProbes":{src:ShaderSource.S_GIPROBES_SRC, pattern:/Context.GIProbes/, pattern2:/Context.GIProbes[\s+-;.,\*\\]{1,}/, tagPattern:/Context.GIProbes/g, tag:ShaderSource.S_GIPROBES_SRC, isFlagVariable:true},
        "Context.Pssm":{src:ShaderSource.S_PSSM_SRC, pattern:/Context.Pssm/, pattern2:/Context.Pssm[\s+-;.,\*\\]{1,}/, tagPattern:/Context.Pssm/g, tag:ShaderSource.S_PSSM_SRC, isFlagVariable:true},
        "Context.PointLightShadows":{src:ShaderSource.S_POINTLIGHT_SHADOWS_SRC, pattern:/Context.PointLightShadows/, pattern2:/Context.PointLightShadows[\s+-;.,\*\\]{1,}/, tagPattern:/Context.PointLightShadows/g, tag:ShaderSource.S_POINTLIGHT_SHADOWS_SRC, isFlagVariable:true},
        "Context.SpotLightShadows":{src:ShaderSource.S_SPOTLIGHT_SHADOWS_SRC, pattern:/Context.SpotLightShadows/, pattern2:/Context.SpotLightShadows[\s+-;.,\*\\]{1,}/, tagPattern:/Context.SpotLightShadows/g, tag:ShaderSource.S_SPOTLIGHT_SHADOWS_SRC, isFlagVariable:true},
        "Context.Fade":{src:ShaderSource.S_FADE_SRC, pattern:/Context.Fade/, pattern2:/Context.Fade[\s+-;.,\*\\]{1,}/, tagPattern:/Context.Fade/g, tag:ShaderSource.S_FADE_SRC, isFlagVariable:true},

        // 上下文定义
        '_C_SKINS':"#define " + ShaderSource.S_SKINS_SRC + " " + ShaderSource.S_SKINS_SRC,
        '_C_SRGB':"#define " + ShaderSource.S_SRGB_SRC + " " + ShaderSource.S_SRGB_SRC,
        '_C_GIPROBES':"#define " + ShaderSource.S_GIPROBES_SRC + " " + ShaderSource.S_GIPROBES_SRC,
        '_C_PSSM':"#define " + ShaderSource.S_PSSM_SRC + " " + ShaderSource.S_PSSM_SRC,
        '_C_POINTLIGHT_SHADOWS':"#define " + ShaderSource.S_POINTLIGHT_SHADOWS_SRC + " " + ShaderSource.S_POINTLIGHT_SHADOWS_SRC,
        '_C_SPOTLIGHT_SHADOWS':"#define " + ShaderSource.S_SPOTLIGHT_SHADOWS_SRC + " " + ShaderSource.S_SPOTLIGHT_SHADOWS_SRC,
        '_FADE':"#define " + ShaderSource.S_FADE_SRC + " " + ShaderSource.S_FADE_SRC,

        // 系统库
        'Try3dLightingLib':ShaderSource.S_TRY3D_LIGHTING_LIB,
    };

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
