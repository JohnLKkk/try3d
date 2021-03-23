export default class Internal {
    static S_DEFAULT_OUT_COLOR_DEF_DATA = "// 输出颜色缓冲材质\n" +
        "Def DefaultOutColorDef{\n" +
        "    SubTechnology DefaultOutColor{\n" +
        "        Vars{\n" +
        "            vec2 uv0;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutPosition = vec4(Context.InPosition, 1.0f);\n" +
        "                uv0 = Context.InUv0;\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutColor = texture(Context.InForwardColorMap, uv0);\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass{\n" +
        "            Pass DefaultOutColor{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}";
    static S_DEFAULT_SKY_BOX_DEF = "// 天空盒材质定义\n" +
        "Def SkyBoxDef{\n" +
        "    Params{\n" +
        "        // 启用cubeMap通道\n" +
        "        bool useCubeMap;\n" +
        "        // 启用envMap通道\n" +
        "        bool useEnvMap;\n" +
        "        // 启用高动态映射\n" +
        "        bool useHDR;\n" +
        "        samplerCube cubeMap;\n" +
        "        sampler2D envMap;\n" +
        "    }\n" +
        "    SubTechnology SkyBox{\n" +
        "        Vars{\n" +
        "            vec3 wPosition;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                wPosition = Context.InPosition;\n" +
        "                // 只需要旋转部分\n" +
        "                vec4 pos = Context.ViewMatrix * vec4(Context.InPosition, 0.0f);\n" +
        "                // 应用投影变换\n" +
        "                pos.w = 1.0f;\n" +
        "                pos = Context.ProjectMatrix * pos;\n" +
        "                Context.OutPosition = pos.xyww;\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            vec2 Optics_SphereCoord(in vec3 dir){\n" +
        "                float dzplus1 = dir.z + 1.0f;\n" +
        "\n" +
        "                // 计算 1/2p\n" +
        "                // NOTE: 仅当dir归一化时，此简化才有效。\n" +
        "                float inv_two_p = 1.414f * sqrt(dzplus1);\n" +
        "                //float inv_two_p = sqrt(dir.x * dir.x + dir.y * dir.y + dzplus1 * dzplus1);\n" +
        "                inv_two_p *= 2.0f;\n" +
        "                inv_two_p = 1.0f / inv_two_p;\n" +
        "\n" +
        "                // 计算texcoord\n" +
        "                return (dir.xy * vec2(inv_two_p)) + vec2(0.5f);\n" +
        "            }\n" +
        "            const vec2 invAtan = vec2(0.159154943091895f, 0.318309886183790f);\n" +
        "            #define PI 3.14159265358979323846264\n" +
        "            // 转换环境纹理映射纹理坐标\n" +
        "            vec2 fractTexcoord(const in vec3 v)\n" +
        "            {\n" +
        "                vec2 uv = vec2(atan(v.z, v.x) + PI, acos(v.y));\n" +
        "                uv *= invAtan;\n" +
        "                return uv;\n" +
        "            }\n" +
        "            void main(){\n" +
        "                #ifdef Params.useCubeMap\n" +
        "                    // 立方体纹理\n" +
        "                    Context.OutColor = texture( Params.cubeMap, normalize( wPosition ) );\n" +
        "                #else\n" +
        "                    #ifdef Params.useEnvMap\n" +
        "                        // 环境纹理\n" +
        "                        vec2 uv = fractTexcoord( normalize( wPosition ) );\n" +
        "                        #ifdef Params.useHDR\n" +
        "                            // 解码hdr数据,也可以使用硬件RGB9_E5\n" +
        "                            vec4 rgbe = texture( Params.envMap, uv );\n" +
        "                            rgbe.rgb *= pow(2.0f,rgbe.a*255.0f-128.0f);\n" +
        "                            // 色调映射(后续在后处理统一进行)\n" +
        "                            rgbe.rgb = rgbe.rgb / (rgbe.rgb + vec3(1.0f));\n" +
        "                            // 伽马(后续在后处理统一进行)\n" +
        "                            rgbe.rgb = pow(rgbe.rgb, vec3(1.0f / 2.2f));\n" +
        "                            Context.OutColor.rgb = rgbe.rgb;\n" +
        "                            Context.OutColor.a = 1.0f;\n" +
        "                        #else\n" +
        "                            Context.OutColor = texture( Params.envMap, uv );\n" +
        "                        #endif\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass{\n" +
        "            Pass SkyBox{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
    static S_PREFILTER_DEF = "// 预过滤EnvMap\n" +
        "Def PrefilterDef{\n" +
        "    Params{\n" +
        "        float roughness;\n" +
        "        float resolution;\n" +
        "        samplerCube envMap;\n" +
        "    }\n" +
        "    SubTechnology Prefilter{\n" +
        "        Vars{\n" +
        "            vec3 wPosition;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                wPosition = Context.InPosition;\n" +
        "                // 只需要旋转部分\n" +
        "                vec4 pos = Context.ViewMatrix * vec4(Context.InPosition, 0.0f);\n" +
        "                // 应用投影变换\n" +
        "                pos.w = 1.0f;\n" +
        "                pos = Context.ProjectMatrix * pos;\n" +
        "                Context.OutPosition = pos.xyww;\n" +
        "            }\n" +
        "        }\n" +
        "\n" +
        "        Fs_Shader{\n" +
        "            const float PI = 3.14159265359f;\n" +
        "            // ----------------------------------------------------------------------------\n" +
        "            float DistributionGGX(vec3 N, vec3 H, float roughness)\n" +
        "            {\n" +
        "                float a = roughness*roughness;\n" +
        "                float a2 = a*a;\n" +
        "                float NdotH = max(dot(N, H), 0.0f);\n" +
        "                float NdotH2 = NdotH*NdotH;\n" +
        "\n" +
        "                float nom   = a2;\n" +
        "                float denom = (NdotH2 * (a2 - 1.0f) + 1.0f);\n" +
        "                denom = PI * denom * denom;\n" +
        "\n" +
        "                return nom / denom;\n" +
        "            }\n" +
        "            // ----------------------------------------------------------------------------\n" +
        "            // http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html\n" +
        "            // 高效的VanDerCorpus计算。\n" +
        "            float RadicalInverse_VdC(uint bits)\n" +
        "            {\n" +
        "                 bits = (bits << 16u) | (bits >> 16u);\n" +
        "                 bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);\n" +
        "                 bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);\n" +
        "                 bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);\n" +
        "                 bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);\n" +
        "                 return float(bits) * 2.3283064365386963e-10; // / 0x100000000\n" +
        "            }\n" +
        "            // ----------------------------------------------------------------------------\n" +
        "            vec2 Hammersley(uint i, uint N)\n" +
        "            {\n" +
        "                return vec2(float(i)/float(N), RadicalInverse_VdC(i));\n" +
        "            }\n" +
        "            // ----------------------------------------------------------------------------\n" +
        "            vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness)\n" +
        "            {\n" +
        "                float a = roughness*roughness;\n" +
        "\n" +
        "                float phi = 2.0f * PI * Xi.x;\n" +
        "                float cosTheta = sqrt((1.0 - Xi.y) / (1.0f + (a*a - 1.0f) * Xi.y));\n" +
        "                float sinTheta = sqrt(1.0 - cosTheta*cosTheta);\n" +
        "\n" +
        "                // 从球坐标到笛卡尔坐标-半角向量\n" +
        "                vec3 H;\n" +
        "                H.x = cos(phi) * sinTheta;\n" +
        "                H.y = sin(phi) * sinTheta;\n" +
        "                H.z = cosTheta;\n" +
        "\n" +
        "                // 从切线空间H向量到世界空间样本向量\n" +
        "                vec3 up          = abs(N.z) < 0.999 ? vec3(0.0f, 0.0f, 1.0f) : vec3(1.0f, 0.0f, 0.0f);\n" +
        "                vec3 tangent   = normalize(cross(up, N));\n" +
        "                vec3 bitangent = cross(N, tangent);\n" +
        "\n" +
        "                vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;\n" +
        "                return normalize(sampleVec);\n" +
        "            }\n" +
        "            void main(){\n" +
        "                vec3 N = normalize(wPosition);\n" +
        "\n" +
        "                // 做出简化的假设，即V等于R等于法线\n" +
        "                vec3 R = N;\n" +
        "                vec3 V = R;\n" +
        "\n" +
        "                const uint SAMPLE_COUNT = 1024u;\n" +
        "                vec3 prefilteredColor = vec3(0.0f);\n" +
        "                float totalWeight = 0.0f;\n" +
        "\n" +
        "                for(uint i = 0u; i < SAMPLE_COUNT; ++i)\n" +
        "                {\n" +
        "                    // 生成偏向首选对齐方向的采样矢量（重要性采样）。\n" +
        "                    vec2 Xi = Hammersley(i, SAMPLE_COUNT);\n" +
        "                    vec3 H = ImportanceSampleGGX(Xi, N, Params.roughness);\n" +
        "                    vec3 L  = normalize(2.0 * dot(V, H) * H - V);\n" +
        "\n" +
        "                    float NdotL = max(dot(N, L), 0.0f);\n" +
        "                    if(NdotL > 0.0)\n" +
        "                    {\n" +
        "                        // 基于粗糙度/ pdf从环境的mip级别采样\n" +
        "                        float D   = DistributionGGX(N, H, Params.roughness);\n" +
        "                        float NdotH = max(dot(N, H), 0.0f);\n" +
        "                        float HdotV = max(dot(H, V), 0.0f);\n" +
        "                        float pdf = D * NdotH / (4.0f * HdotV) + 0.0001f;\n" +
        "\n" +
        "                        float saTexel  = 4.0f * PI / (6.0f * Params.resolution * Params.resolution);\n" +
        "                        float saSample = 1.0f / (float(SAMPLE_COUNT) * pdf + 0.0001f);\n" +
        "\n" +
        "                        float mipLevel = Params.roughness == 0.0f ? 0.0f : 0.5f * log2(saSample / saTexel);\n" +
        "\n" +
        "                        prefilteredColor += textureLod(Params.envMap, L, mipLevel).rgb * NdotL;\n" +
        "                        totalWeight      += NdotL;\n" +
        "                    }\n" +
        "                }\n" +
        "\n" +
        "                prefilteredColor = prefilteredColor / totalWeight;\n" +
        "\n" +
        "                Context.OutColor = vec4(prefilteredColor, 1.0f);\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass{\n" +
        "            Pass Prefilter{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
}
