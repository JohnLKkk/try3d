export default class Internal {
    static S_POST_SHADOW_DEF_DATA = "// PostShadowDef\n" +
        "Def PostShadowDef{\n" +
        "    Params{\n" +
        "        // ShadowInfo\n" +
        "        float shadowIntensity;\n" +
        "        int filterMode;\n" +
        "        bool hardwareShadow;\n" +
        "        bool backfaceShadows;\n" +
        "    }\n" +
        "    SubTechnology PostShadowPass{\n" +
        "        Vars{\n" +
        "            vec2 wUv0;\n" +
        "            mat4 pvInverse;\n" +
        "            vec4 pvRow2;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutPosition = vec4(Context.InPosition, 1.0f);\n" +
        "                pvInverse = inverse(Context.ProjectViewMatrix);\n" +
        "                pvRow2 = Context.ProjectViewMatrix[2];\n" +
        "                wUv0 = Context.InUv0;\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            //#extension GL_ARB_gpu_shader5 : enable\n" +
        "            float shadowBorderScale = 1.0f;\n" +
        "            #ifdef HARDWARE_SHADOWS\n" +
        "                #define SHADOWMAP sampler2DShadow\n" +
        "                #define SHADOWCOMPAREOFFSET(tex,coord,offset) textureProjOffset(tex, coord, offset)\n" +
        "                #define SHADOWCOMPARE(tex,coord) textureProj(tex, coord)\n" +
        "                #define SHADOWGATHER(tex,coord) textureGather(tex, coord.xy, coord.z)\n" +
        "            #else\n" +
        "                #define SHADOWMAP sampler2D\n" +
        "                #define SHADOWCOMPAREOFFSET(tex,coord,offset) step(coord.z, textureProjOffset(tex, coord, offset).r)\n" +
        "                #define SHADOWCOMPARE(tex,coord) step(coord.z, textureProj(tex, coord).r)\n" +
        "                #define SHADOWGATHER(tex,coord) step(coord.z, textureGather(tex, coord.xy))\n" +
        "            #endif\n" +
        "\n" +
        "            float Shadow_DoShadowCompare(in SHADOWMAP tex,in vec4 projCoord){\n" +
        "                return SHADOWCOMPARE(tex, projCoord);\n" +
        "            }\n" +
        "\n" +
        "            float Shadow_BorderCheck(in vec2 coord){\n" +
        "                // 最快的“hack”方法（使用 4-5 条指令）\n" +
        "                vec4 t = vec4(coord.xy, 0.0f, 1.0f);\n" +
        "                t = step(t.wwxy, t.xyzz);\n" +
        "                return dot(t,t);\n" +
        "            }\n" +
        "\n" +
        "            float Shadow_Nearest(in SHADOWMAP tex,in vec4 projCoord){\n" +
        "                float border = Shadow_BorderCheck(projCoord.xy);\n" +
        "                if (border > 0.0f){\n" +
        "                    return 1.0f;\n" +
        "                }\n" +
        "                return SHADOWCOMPARE(tex, projCoord);\n" +
        "            }\n" +
        "            vec3 getPosition(in float depth, in vec2 newTexCoord){\n" +
        "\n" +
        "                vec4 pos;\n" +
        "                pos.xy = (newTexCoord * vec2(2.0f)) - vec2(1.0f);\n" +
        "                pos.z  = depth * 2.0f - 1.0f;\n" +
        "                pos.w  = 1.0f;\n" +
        "                pos    = pvInverse * pos;\n" +
        "                pos.xyz /= pos.w;\n" +
        "                return pos.xyz;\n" +
        "            }\n" +
        "            #define GETSHADOW Shadow_Nearest\n" +
        "            // 基于PSSM实现的CSM\n" +
        "            float getDirectionalLightShadows(in vec4 splits,in float shadowPosition, in SHADOWMAP shadowMap0, in SHADOWMAP shadowMap1, in SHADOWMAP shadowMap2,in SHADOWMAP shadowMap3, in vec4 projCoord0,in vec4 projCoord1,in vec4 projCoord2,in vec4 projCoord3){\n" +
        "                float shadow = 1.0f;\n" +
        "                if(shadowPosition < splits.x){\n" +
        "                    shadow = GETSHADOW(shadowMap0, projCoord0 );\n" +
        "                }\n" +
        "                else if( shadowPosition <  splits.y){\n" +
        "                    shadowBorderScale = 0.5f;\n" +
        "                    shadow = GETSHADOW(shadowMap1, projCoord1);\n" +
        "                }\n" +
        "                else if( shadowPosition <  splits.z){\n" +
        "                    shadowBorderScale = 0.25f;\n" +
        "                    shadow = GETSHADOW(shadowMap2, projCoord2);\n" +
        "                }\n" +
        "                else if( shadowPosition <  splits.w){\n" +
        "                    shadowBorderScale = 0.125f;\n" +
        "                    shadow = GETSHADOW(shadowMap3, projCoord3);\n" +
        "                }\n" +
        "                return shadow;\n" +
        "            }\n" +
        "            vec3 approximateNormal(in vec4 worldPos,in vec2 texCoord){\n" +
        "                float step = Context.ResolutionInverse.x;\n" +
        "                float stepy = Context.ResolutionInverse.y;\n" +
        "                float depth2 = texture(Context.InGDepth, texCoord + vec2(step, -stepy)).r;\n" +
        "                float depth3 = texture(Context.InGDepth, texCoord + vec2(-step, -stepy)).r;\n" +
        "                vec4 worldPos2 = vec4(getPosition(depth2, texCoord + vec2(step, -stepy)),1.0f);\n" +
        "                vec4 worldPos3 = vec4(getPosition(depth3, texCoord + vec2(-step, -stepy)),1.0f);\n" +
        "\n" +
        "                vec3 v1 = (worldPos - worldPos2).xyz;\n" +
        "                vec3 v2 = (worldPos3 - worldPos2).xyz;\n" +
        "                return normalize(cross(v1, v2));\n" +
        "            }\n" +
        "            const mat4 biasMat = mat4(0.5f, 0.0f, 0.0f, 0.0f,\n" +
        "                                      0.0f, 0.5f, 0.0f, 0.0f,\n" +
        "                                      0.0f, 0.0f, 0.5f, 0.0f,\n" +
        "                                      0.5f, 0.5f, 0.5f, 1.0f);\n" +
        "            void main(){\n" +
        "                float depth = texture(Context.InDepth, wUv0).r;\n" +
        "                Context.OutColor = texture(Context.InScreen, wUv0);\n" +
        "\n" +
        "                // 跳过不需要的部分,depth为1.0的基本上是背景或sky部分\n" +
        "                if(depth >= 1.0f){\n" +
        "                    return;\n" +
        "                }\n" +
        "\n" +
        "                // 深度重建世界坐标\n" +
        "                vec4 wPosition = vec4(getPosition(depth, wUv0), 1.0f);\n" +
        "\n" +
        "                vec3 lightDir;\n" +
        "                #ifdef PSSM\n" +
        "                    lightDir = Context.LightDir;\n" +
        "                #else\n" +
        "                    lightDir = wPosition.xyz - Context.LightPos;\n" +
        "                #endif\n" +
        "\n" +
        "                #ifndef Params.backfaceShadows\n" +
        "                    if(Params.backfaceShadows){\n" +
        "                        vec3 normal = approximateNormal(wPosition, wUv0);\n" +
        "                        float ndotl = dot(normal, lightDir);\n" +
        "                        if(ndotl > -0.0f){\n" +
        "                            return;\n" +
        "                        }\n" +
        "                    }\n" +
        "                #endif\n" +
        "\n" +
        "                #if !defined(Context.PointLightShadows)\n" +
        "                    #if !defined(Context.Pssm)\n" +
        "                        if( dot(Context.LightDir, lightDir) < 0.0f){\n" +
        "                            return;\n" +
        "                        }\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "\n" +
        "                // 将坐标转换到光源空间\n" +
        "                vec4 projCoord0 = biasMat * Context.LightViewProjectMatrix0 * wPosition;\n" +
        "                vec4 projCoord1 = biasMat * Context.LightViewProjectMatrix1 * wPosition;\n" +
        "                vec4 projCoord2 = biasMat * Context.LightViewProjectMatrix2 * wPosition;\n" +
        "                vec4 projCoord3 = biasMat * Context.LightViewProjectMatrix3 * wPosition;\n" +
        "                #ifdef POINTLIGHT\n" +
        "                   vec4 projCoord4 = biasMat * Context.LightViewProjectMatrix4 * wPosition;\n" +
        "                   vec4 projCoord5 = biasMat * Context.LightViewProjectMatrix5 * wPosition;\n" +
        "                #endif\n" +
        "\n" +
        "                // 计算阴影\n" +
        "                float shadow = 1.0f;\n" +
        "\n" +
        "                #if defined(Context.Pssm)\n" +
        "                    float shadowPosition = pvRow2.x * wPosition.x +  pvRow2.y * wPosition.y +  pvRow2.z * wPosition.z +  pvRow2.w;\n" +
        "                #else\n" +
        "                    #if defined(Context.Fade)\n" +
        "                        float shadowPosition = pvRow2.x * wPosition.x +  pvRow2.y * wPosition.y +  pvRow2.z * wPosition.z +  pvRow2.w;\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Context.PointLightShadows\n" +
        "                #else\n" +
        "                    #ifdef Context.Pssm\n" +
        "                        // directionalLight shadow\n" +
        "                        shadow = getDirectionalLightShadows(Context.Splits, shadowPosition, Context.InShadowMap0, Context.InShadowMap1, Context.InShadowMap2, Context.InShadowMap3, projCoord0, projCoord1, projCoord2, projCoord3);\n" +
        "                    #else\n" +
        "                        // spotLight shadow\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Context.Fade\n" +
        "                    shadow = clamp(max(0.0f, mix(shadow, 1.0f,(shadowPosition - Context.FadeInfo.x) * Context.FadeInfo.y)), 0.0f, 1.0f);\n" +
        "                #endif\n" +
        "                #ifdef Params.shadowIntensity\n" +
        "                    shadow = shadow * Params.shadowIntensity + (1.0f - Params.shadowIntensity);\n" +
        "                #else\n" +
        "                    shadow = shadow * 0.5f + 0.5f;\n" +
        "                #endif\n" +
        "                Context.OutColor = Context.OutColor * vec4(shadow, shadow, shadow, 1.0f);\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass PostFilter{\n" +
        "            Pass PostShadowPass{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
    static S_PRE_SHADOW_DEF_DATA = "// PreShadowDef\n" +
        "// 这个材质定义用于捕获ShadowMap,因此,它很简单,只是简单的将深度信息渲染到指定缓冲中\n" +
        "Def PreShadowDef{\n" +
        "    Params{\n" +
        "        bool debug;\n" +
        "    }\n" +
        "    SubTechnology PreShadowPass{\n" +
        "        Vars{\n" +
        "            vec2 wUv0;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                #ifdef Context.Skins\n" +
        "                    mat4 skinMat =\n" +
        "                            Context.InWeight0.x * Context.Joints[int(Context.InJoint0.x)] +\n" +
        "                            Context.InWeight0.y * Context.Joints[int(Context.InJoint0.y)] +\n" +
        "                            Context.InWeight0.z * Context.Joints[int(Context.InJoint0.z)] +\n" +
        "                            Context.InWeight0.w * Context.Joints[int(Context.InJoint0.w)];\n" +
        "                    // vec4 pos = Context.ModelMatrix * skinMat * vec4(Context.InPosition, 1.0f);\n" +
        "                    vec4 pos = skinMat * vec4(Context.InPosition, 1.0f);\n" +
        "                #else\n" +
        "                    vec4 pos = Context.ModelMatrix * vec4(Context.InPosition, 1.0f);\n" +
        "                #endif\n" +
        "                wUv0 = Context.InUv0;\n" +
        "                Context.OutPosition = Context.ProjectViewMatrix * pos;\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            void main(){\n" +
        "                #ifdef Params.debug\n" +
        "                    if(Params.debug){\n" +
        "                        Context.OutColor = vec4(vec3(gl_FragCoord.z), 1.0f);\n" +
        "                    }\n" +
        "                #endif\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass PreFrame{\n" +
        "            Pass PreShadowPass{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
    static S_PICTURE_DEF_DATA = "// 颜色材质,提供指定颜色或颜色纹理并渲染\n" +
        "Def PictureDef{\n" +
        "    Params{\n" +
        "        vec4 color;\n" +
        "        sampler2D colorMap;\n" +
        "        float alphaDiscard;\n" +
        "    }\n" +
        "    SubTechnology DefaultPass{\n" +
        "        Vars{\n" +
        "            vec2 uv0;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutPosition = Context.ModelMatrix * vec4(Context.InPosition, 1.0f);\n" +
        "                uv0 = Context.InUv0;\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            void main(){\n" +
        "                // 使用自定义颜色输出\n" +
        "                #ifdef Params.color\n" +
        "                    Context.OutColor = Params.color;\n" +
        "                #else\n" +
        "                    // 使用纹理\n" +
        "                    #ifdef Params.colorMap\n" +
        "                        Context.OutColor = texture(Params.colorMap, uv0);\n" +
        "                        #ifdef Params.alphaDiscard\n" +
        "                            if(Context.OutColor.a < Params.alphaDiscard){\n" +
        "                                discard;\n" +
        "                            }\n" +
        "                        #endif\n" +
        "                    #else\n" +
        "                        Context.OutColor = vec4(1.0f, 1.0f, 1.0f, 1.0f);\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass{\n" +
        "            Pass DefaultPass{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
    static S_GAMMA_CORRECTION_DEF_DATA = "// gamma矫正\n" +
        "// 由于webGL不支持硬件gamma矫正,只能通过后处理进行\n" +
        "Def GammaCorrectionFilterDef{\n" +
        "    Params{\n" +
        "        float gammaFactor;\n" +
        "        bool toneMapping;\n" +
        "    }\n" +
        "    SubTechnology GammaCorrectionFilter{\n" +
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
        "                Context.OutColor = texture(Context.InScreen, uv0);\n" +
        "                #ifdef Params.toneMapping\n" +
        "                    if(Params.toneMapping){\n" +
        "                        Context.OutColor.rgb = Context.OutColor.rgb / (Context.OutColor.rgb + vec3(1.0f));\n" +
        "                    }\n" +
        "                #endif\n" +
        "                #ifdef Params.gammaFactor\n" +
        "                    Context.OutColor.rgb = pow(Context.OutColor.rgb, vec3(Params.gammaFactor));\n" +
        "                #endif\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass PostFilter{\n" +
        "            Pass GammaCorrectionFilter{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
    static S_DEFAULT_OUT_COLOR_DEF_DATA = "// 输出颜色缓冲材质\n" +
        "Def DefaultOutColorDef{\n" +
        "    Params{\n" +
        "        float gammaFactor;\n" +
        "        bool toneMapping;\n" +
        "    }\n" +
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
        "                #ifdef Params.toneMapping\n" +
        "                    if(Params.toneMapping){\n" +
        "                        Context.OutColor.rgb = Context.OutColor.rgb / (Context.OutColor.rgb + vec3(1.0f));\n" +
        "                    }\n" +
        "                #endif\n" +
        "                #ifdef Params.gammaFactor\n" +
        "                    Context.OutColor.rgb = pow(Context.OutColor.rgb, vec3(Params.gammaFactor));\n" +
        "                #endif\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass{\n" +
        "            Pass DefaultOutColor{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
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
        "                            //rgbe.rgb *= pow(2.0f,rgbe.a*255.0f-128.0f);\n" +
        "                            // 色调映射(后续在后处理统一进行)\n" +
        "                            //rgbe.rgb = rgbe.rgb / (rgbe.rgb + vec3(1.0f));\n" +
        "                            // 伽马(后续在后处理统一进行)\n" +
        "                            //rgbe.rgb = pow(rgbe.rgb, vec3(1.0f / 2.2f));\n" +
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
    static S_ENV_CAPTURE_OUT_DEF = "// 将环境捕捉数据渲染并查看\n" +
        "// 同时,也支持将IBL作为SkyEnv进行场景环境渲染\n" +
        "Def EnvCaptureOutDef{\n" +
        "    Params{\n" +
        "        samplerCube envCaptureMap;\n" +
        "        float lod;\n" +
        "    }\n" +
        "    SubTechnology EnvCaptureOut{\n" +
        "        Vars{\n" +
        "            vec3 wPosition;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                wPosition = Context.InPosition;\n" +
        "                Context.OutPosition = Context.ProjectMatrix * Context.ViewMatrix * Context.ModelMatrix * vec4(Context.InPosition, 1.0f);\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            void main(){\n" +
        "                #ifdef Params.envCaptureMap\n" +
        "                    #ifdef Params.lod\n" +
        "                        Context.OutColor = textureLod(Params.envCaptureMap, normalize(wPosition), Params.lod);\n" +
        "                    #else\n" +
        "                        Context.OutColor = texture(Params.envCaptureMap, normalize(wPosition));\n" +
        "                    #endif\n" +
        "                #else\n" +
        "                    Context.OutColor = vec4(1.0f);\n" +
        "                #endif\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    SubTechnology EnvSkyOut{\n" +
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
        "            void main(){\n" +
        "                #ifdef Params.envCaptureMap\n" +
        "                    #ifdef Params.lod\n" +
        "                        Context.OutColor = textureLod(Params.envCaptureMap, normalize(wPosition), Params.lod);\n" +
        "                    #else\n" +
        "                        Context.OutColor = texture(Params.envCaptureMap, normalize(wPosition));\n" +
        "                    #endif\n" +
        "                #else\n" +
        "                    Context.OutColor = vec4(1.0f);\n" +
        "                #endif\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass{\n" +
        "            Pass EnvCaptureOut{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology EnvSky{\n" +
        "        Sub_Pass{\n" +
        "            Pass EnvSkyOut{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
}
