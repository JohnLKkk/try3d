export default class Internal {
    static S_FXAA_FILTER_DEF_DATA = "// Fast Approximate Anti-Aliasing (FXAA)\n" +
        "// 来自https://www.geeks3d.com/20110405/fxaa-fast-approximate-anti-aliasing-demo-glsl-opengl-test-radeon-geforce/3/\n" +
        "Def FxaaFilterDef{\n" +
        "    Params{\n" +
        "        float spanMax;\n" +
        "        float reduceMul;\n" +
        "        float subPixelShift;\n" +
        "    }\n" +
        "    SubTechnology Fxaa{\n" +
        "        Vars{\n" +
        "            vec4 pos;\n" +
        "            vec2 resolutionInverse;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutPosition = vec4(Context.InPosition, 1.0f);\n" +
        "                pos.xy = Context.InUv0;\n" +
        "                #ifdef Params.subPixelShift\n" +
        "                    float _subPixelShift = Params.subPixelShift;\n" +
        "                #else\n" +
        "                    float _subPixelShift = 1.0f / 4.0f;\n" +
        "                #endif\n" +
        "                resolutionInverse = Context.ResolutionInverse;\n" +
        "                pos.zw = Context.InUv0 - (resolutionInverse * vec2(0.5f + _subPixelShift));\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            #define FxaaTex(t, p) texture(t, p)\n" +
        "            #define OffsetVec(a, b) ivec2(a, b)\n" +
        "            #define FxaaTexOff(t, p, o, r) textureOffset(t, p, o)\n" +
        "            vec3 FXAA(vec4 posPos,sampler2D tex,vec2 rcpFrame){\n" +
        "\n" +
        "                #define FXAA_REDUCE_MIN   (1.0f/128.0f)\n" +
        "                //#define FXAA_REDUCE_MUL   (1.0/8.0)\n" +
        "                //#define FXAA_SPAN_MAX     8.0\n" +
        "\n" +
        "                vec3 rgbNW = FxaaTex(tex, posPos.zw).xyz;\n" +
        "                vec3 rgbNE = FxaaTexOff(tex, posPos.zw, OffsetVec(1,0), rcpFrame.xy).xyz;\n" +
        "                vec3 rgbSW = FxaaTexOff(tex, posPos.zw, OffsetVec(0,1), rcpFrame.xy).xyz;\n" +
        "                vec3 rgbSE = FxaaTexOff(tex, posPos.zw, OffsetVec(1,1), rcpFrame.xy).xyz;\n" +
        "\n" +
        "                vec3 rgbM  = FxaaTex(tex, posPos.xy).xyz;\n" +
        "\n" +
        "                vec3 luma = vec3(0.299f, 0.587f, 0.114f);\n" +
        "                float lumaNW = dot(rgbNW, luma);\n" +
        "                float lumaNE = dot(rgbNE, luma);\n" +
        "                float lumaSW = dot(rgbSW, luma);\n" +
        "                float lumaSE = dot(rgbSE, luma);\n" +
        "                float lumaM  = dot(rgbM,  luma);\n" +
        "\n" +
        "                float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\n" +
        "                float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\n" +
        "\n" +
        "                vec2 dir;\n" +
        "                dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n" +
        "                dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n" +
        "\n" +
        "                #ifdef Params.reduceMul\n" +
        "                    float _reduceMul = Params.reduceMul;\n" +
        "                #else\n" +
        "                    float _reduceMul = 1.0f / 8.0f;\n" +
        "                #endif\n" +
        "                float dirReduce = max(\n" +
        "                    (lumaNW + lumaNE + lumaSW + lumaSE) * (0.25f * _reduceMul),FXAA_REDUCE_MIN);\n" +
        "                float rcpDirMin = 1.0f/(min(abs(dir.x), abs(dir.y)) + dirReduce);\n" +
        "                #ifdef Params.spanMax\n" +
        "                    float _spanMax = Params.spanMax;\n" +
        "                #else\n" +
        "                    float _spanMax = 8.0f;\n" +
        "                #endif\n" +
        "                dir = min(vec2( _spanMax,  spanMax),max(vec2(-spanMax, -spanMax),dir * rcpDirMin)) * rcpFrame.xy;\n" +
        "\n" +
        "                vec3 rgbA = (1.0f/2.0f) * (FxaaTex(tex, posPos.xy + dir * vec2(1.0f/3.0f - 0.5f)).xyz +FxaaTex(tex, posPos.xy + dir * vec2(2.0f/3.0f - 0.5f)).xyz);\n" +
        "                vec3 rgbB = rgbA * (1.0f/2.0f) + (1.0f/4.0f) * (FxaaTex(tex, posPos.xy + dir * vec2(0.0f/3.0f - 0.5f)).xyz +FxaaTex(tex, posPos.xy + dir * vec2(3.0f/3.0f - 0.5f)).xyz);\n" +
        "\n" +
        "                float lumaB = dot(rgbB, luma);\n" +
        "\n" +
        "                if ((lumaB < lumaMin) || (lumaB > lumaMax))\n" +
        "                {\n" +
        "                    return rgbA;\n" +
        "                }\n" +
        "                else\n" +
        "                {\n" +
        "                    return rgbB;\n" +
        "                }\n" +
        "            }\n" +
        "            void main(){\n" +
        "                Context.OutColor = vec4(FXAA(pos, Context.InScreen, resolutionInverse), 1.0f);\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass PostFilter{\n" +
        "            Pass Fxaa{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
    static S_BLOOM_FILTER_DEF_DATA = "// Bloom\n" +
        "Def BloomFilterDef{\n" +
        "    Globals BloomExtract{\n" +
        "        color0 vec4 extractTexture;\n" +
        "        depth24_stencil8 inner depthAndStencil;\n" +
        "    }\n" +
        "    Globals VBlur{\n" +
        "        color0 vec4 color;\n" +
        "        depth24_stencil8 inner depthAndStencil;\n" +
        "    }\n" +
        "    Globals HBlur{\n" +
        "        color0 vec4 color;\n" +
        "        depth24_stencil8 inner depthAndStencil;\n" +
        "    }\n" +
        "    Params{\n" +
        "        // 辉光阈值\n" +
        "        float extractThreshold;\n" +
        "        // 曝光程度(默认2)\n" +
        "        float exposurePower;\n" +
        "        // 辉光强度\n" +
        "        float bloomIntensity;\n" +
        "        // 模糊缩放(默认1.5)\n" +
        "        float blurScale;\n" +
        "\n" +
        "\n" +
        "        // 使用辉光纹理(应该继承具体的Def下只需,后续完善)\n" +
        "        bool useGlowMap;\n" +
        "    }\n" +
        "    SubTechnology ExtractPass{\n" +
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
        "            const vec3 DEFAULT_GRAY = vec3(0.2126f, 0.7152f, 0.0722f);\n" +
        "            #define DEFAULT_EXTRACT_THRESHOLD 0.5f\n" +
        "            #define GAMMA 2.2f\n" +
        "            #define GAMMA_T 1.0f / GAMMA\n" +
        "            void main(){\n" +
        "                ivec2 iTexC = ivec2(uv0 * vec2(textureSize(Context.InScreen, 0)));\n" +
        "                vec4 screenColor = texelFetch(Context.InScreen, iTexC, 0);\n" +
        "\n" +
        "                float threshold = 0.0f;\n" +
        "                float power = 2.0f;\n" +
        "                #ifdef Params.extractThreshold\n" +
        "                    threshold = Params.extractThreshold;\n" +
        "                #else\n" +
        "                    threshold = DEFAULT_EXTRACT_THRESHOLD;\n" +
        "                #endif\n" +
        "                #ifdef Params.exposurePower\n" +
        "                    power = Params.exposurePower;\n" +
        "                #endif\n" +
        "\n" +
        "                if( (screenColor.r + screenColor.g + screenColor.b) / 3.0f < threshold ){\n" +
        "                    GlobalsBloomExtract.OutextractTexture = vec4(0.0f, 0.0f, 0.0f, 1.0f);\n" +
        "                }\n" +
        "                else{\n" +
        "                    GlobalsBloomExtract.OutextractTexture = pow( screenColor, vec4(power) );\n" +
        "                }\n" +
        "\n" +
        "                //vec4 screenColor = texture(Context.InScreen, uv0);\n" +
        "                //screenColor.rgb = pow(screenColor.rgb, vec3(GAMMA));\n" +
        "                // 记住我们在线性空间计算,所以这里需要映射回来\n" +
        "                //float threshold = dot(screenColor.rgb, DEFAULT_GRAY);\n" +
        "                //#ifdef Params.extractThreshold\n" +
        "                //    if(threshold > Params.extractThreshold){\n" +
        "                //        GlobalsBloomExtract.OutextractTexture = screenColor;\n" +
        "                //    }\n" +
        "                //    else{\n" +
        "                //        GlobalsBloomExtract.OutextractTexture = vec4(0.0f, 0.0f, 0.0f, 1.0f);\n" +
        "                //    }\n" +
        "                //#else\n" +
        "                //    if(threshold > DEFAULT_EXTRACT_THRESHOLD){\n" +
        "                //        GlobalsBloomExtract.OutextractTexture = screenColor;\n" +
        "                //    }\n" +
        "                //    else{\n" +
        "                //        GlobalsBloomExtract.OutextractTexture = vec4(0.0f, 0.0f, 0.0f, 1.0f);\n" +
        "                //    }\n" +
        "                //#endif\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    SubTechnology FirstHBlurPass{\n" +
        "            Vars{\n" +
        "                vec2 uv0;\n" +
        "            }\n" +
        "            Vs_Shader{\n" +
        "                void main(){\n" +
        "                    Context.OutPosition = vec4(Context.InPosition, 1.0f);\n" +
        "                    uv0 = Context.InUv0;\n" +
        "                }\n" +
        "            }\n" +
        "            Fs_Shader{\n" +
        "                #define DEFAULT_BLUR_SCALE 1.5f\n" +
        "                void main(){\n" +
        "                    #ifdef Params.blurScale\n" +
        "                        float blurSize = Params.blurScale / float(textureSize(GlobalsBloomExtract.InextractTexture, 0).x);\n" +
        "                    #else\n" +
        "                        float blurSize = DEFAULT_BLUR_SCALE / float(textureSize(GlobalsBloomExtract.InextractTexture, 0).x);\n" +
        "                    #endif\n" +
        "                    vec4 sum = vec4(0.0f);\n" +
        "\n" +
        "                    // 水平方向模糊\n" +
        "                    // 采样9个部分\n" +
        "                    sum += texture(GlobalsBloomExtract.InextractTexture, vec2(uv0.x - 4.0f*blurSize, uv0.y )) * 0.06f;\n" +
        "                    sum += texture(GlobalsBloomExtract.InextractTexture, vec2(uv0.x - 3.0f*blurSize, uv0.y )) * 0.09f;\n" +
        "                    sum += texture(GlobalsBloomExtract.InextractTexture, vec2(uv0.x - 2.0f*blurSize, uv0.y)) * 0.12f;\n" +
        "                    sum += texture(GlobalsBloomExtract.InextractTexture, vec2(uv0.x - blurSize, uv0.y )) * 0.15f;\n" +
        "                    sum += texture(GlobalsBloomExtract.InextractTexture, vec2(uv0.x, uv0.y)) * 0.16f;\n" +
        "                    sum += texture(GlobalsBloomExtract.InextractTexture, vec2(uv0.x + blurSize, uv0.y )) * 0.15f;\n" +
        "                    sum += texture(GlobalsBloomExtract.InextractTexture, vec2(uv0.x + 2.0f*blurSize, uv0.y )) * 0.12f;\n" +
        "                    sum += texture(GlobalsBloomExtract.InextractTexture, vec2(uv0.x + 3.0f*blurSize, uv0.y )) * 0.09f;\n" +
        "                    sum += texture(GlobalsBloomExtract.InextractTexture, vec2(uv0.x + 4.0f*blurSize, uv0.y )) * 0.06f;\n" +
        "\n" +
        "                    GlobalsHBlur.Outcolor = sum;\n" +
        "                }\n" +
        "            }\n" +
        "        }\n" +
        "    SubTechnology HBlurPass{\n" +
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
        "            #define DEFAULT_BLUR_SCALE 1.5f\n" +
        "            void main(){\n" +
        "                #ifdef Params.blurScale\n" +
        "                    float blurSize = Params.blurScale / float(textureSize(GlobalsVBlur.Incolor, 0).x);\n" +
        "                #else\n" +
        "                    float blurSize = DEFAULT_BLUR_SCALE / float(textureSize(GlobalsVBlur.Incolor, 0).x);\n" +
        "                #endif\n" +
        "\n" +
        "                vec4 sum = vec4(0.0f);\n" +
        "\n" +
        "                // 水平方向模糊\n" +
        "                // 采样9个部分\n" +
        "                sum += texture(GlobalsVBlur.Incolor, vec2(uv0.x - 4.0f*blurSize, uv0.y )) * 0.06f;\n" +
        "                sum += texture(GlobalsVBlur.Incolor, vec2(uv0.x - 3.0f*blurSize, uv0.y )) * 0.09f;\n" +
        "                sum += texture(GlobalsVBlur.Incolor, vec2(uv0.x - 2.0f*blurSize, uv0.y)) * 0.12f;\n" +
        "                sum += texture(GlobalsVBlur.Incolor, vec2(uv0.x - blurSize, uv0.y )) * 0.15f;\n" +
        "                sum += texture(GlobalsVBlur.Incolor, vec2(uv0.x, uv0.y)) * 0.16f;\n" +
        "                sum += texture(GlobalsVBlur.Incolor, vec2(uv0.x + blurSize, uv0.y )) * 0.15f;\n" +
        "                sum += texture(GlobalsVBlur.Incolor, vec2(uv0.x + 2.0f*blurSize, uv0.y )) * 0.12f;\n" +
        "                sum += texture(GlobalsVBlur.Incolor, vec2(uv0.x + 3.0f*blurSize, uv0.y )) * 0.09f;\n" +
        "                sum += texture(GlobalsVBlur.Incolor, vec2(uv0.x + 4.0f*blurSize, uv0.y )) * 0.06f;\n" +
        "\n" +
        "                GlobalsHBlur.Outcolor = sum;\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    SubTechnology VBlurPass{\n" +
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
        "            #define DEFAULT_BLUR_SCALE 1.5f\n" +
        "            void main(){\n" +
        "                #ifdef Params.blurScale\n" +
        "                    float blurSize = Params.blurScale / float(textureSize(GlobalsHBlur.Incolor, 0).y);\n" +
        "                #else\n" +
        "                    float blurSize = DEFAULT_BLUR_SCALE / float(textureSize(GlobalsHBlur.Incolor, 0).y);\n" +
        "                #endif\n" +
        "                vec4 sum = vec4(0.0f);\n" +
        "\n" +
        "                // 垂直方向模糊\n" +
        "                // 采样9个部分\n" +
        "                sum += texture(GlobalsHBlur.Incolor, vec2(uv0.x, uv0.y - 4.0f*blurSize)) * 0.06f;\n" +
        "                sum += texture(GlobalsHBlur.Incolor, vec2(uv0.x, uv0.y - 3.0f*blurSize)) * 0.09f;\n" +
        "                sum += texture(GlobalsHBlur.Incolor, vec2(uv0.x, uv0.y - 2.0f*blurSize)) * 0.12f;\n" +
        "                sum += texture(GlobalsHBlur.Incolor, vec2(uv0.x, uv0.y - blurSize)) * 0.15f;\n" +
        "                sum += texture(GlobalsHBlur.Incolor, vec2(uv0.x, uv0.y)) * 0.16f;\n" +
        "                sum += texture(GlobalsHBlur.Incolor, vec2(uv0.x, uv0.y + blurSize)) * 0.15f;\n" +
        "                sum += texture(GlobalsHBlur.Incolor, vec2(uv0.x, uv0.y + 2.0f*blurSize)) * 0.12f;\n" +
        "                sum += texture(GlobalsHBlur.Incolor, vec2(uv0.x, uv0.y + 3.0f*blurSize)) * 0.09f;\n" +
        "                sum += texture(GlobalsHBlur.Incolor, vec2(uv0.x, uv0.y + 4.0f*blurSize)) * 0.06f;\n" +
        "\n" +
        "                GlobalsVBlur.Outcolor = sum;\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    SubTechnology BloomPass{\n" +
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
        "            #define GAMMA 2.2f\n" +
        "            #define GAMMA_T 1.0f / GAMMA\n" +
        "            void main(){\n" +
        "                // 1.对ExtractTexture应用某种模糊(Blur)处理\n" +
        "                // 2.结合ExtractTexture和ScreenColor实现bloom\n" +
        "                vec4 screenColor = texture(Context.InScreen, uv0);\n" +
        "                vec3 blurColor = texture(GlobalsVBlur.Incolor, uv0).rgb;\n" +
        "                screenColor.rgb += blurColor;\n" +
        "                const float exposure = 0.5f;\n" +
        "                //vec3 result = vec3(1.0f) - exp(-screenColor.rgb * exposure);\n" +
        "                //result = pow(result, vec3(GAMMA_T));\n" +
        "                //Context.OutColor = vec4(result, screenColor.a);\n" +
        "                Context.OutColor = screenColor;\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    SubTechnology FastBloomPass{\n" +
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
        "                vec4 screenColor = texture(Context.InScreen, uv0);\n" +
        "                //vec3 blurColor = pow(texture(GlobalsVBlur.Incolor, uv0).rgb, vec3(1.0f / 2.0f));\n" +
        "                //blurColor = vec3(1.0f) - exp(-blurColor.rgb * 0.5f);\n" +
        "                vec3 blurColor = texture(GlobalsVBlur.Incolor, uv0).rgb;\n" +
        "\n" +
        "                float _bInd = 2.0f;\n" +
        "                #ifdef Params.bloomIntensity\n" +
        "                    _bInd = Params.bloomIntensity;\n" +
        "                #endif\n" +
        "\n" +
        "                screenColor.rgb += blurColor * _bInd;\n" +
        "                Context.OutColor = screenColor;\n" +
        "                //测试\n" +
        "                //Context.OutColor = vec4(blurColor, 1.0f);\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass PostFilter{\n" +
        "            Pass ExtractPass{\n" +
        "            }\n" +
        "            Pass FirstHBlurPass{\n" +
        "            }\n" +
        "            Pass VBlurPass{\n" +
        "            }\n" +
        "            Pass FastBloomPass{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology MultiBloom{\n" +
        "        //Sub_Pass PreFrame{\n" +
        "        //    Pass ExtractPass{\n" +
        "        //    }\n" +
        "        //}\n" +
        "        Sub_Pass PostFilter{\n" +
        "            Pass ExtractPass{\n" +
        "            }\n" +
        "            Pass FirstHBlurPass{\n" +
        "            }\n" +
        "            Pass VBlurPass{\n" +
        "            }\n" +
        "            Pass HBlurPass{\n" +
        "            }\n" +
        "            Pass VBlurPass{\n" +
        "            }\n" +
        "            Pass HBlurPass{\n" +
        "            }\n" +
        "            Pass VBlurPass{\n" +
        "            }\n" +
        "            Pass BloomPass{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
    static S_WIREFRAME_DEF_DATA = "// 由于webGL基于openGLES3.x,其不存在openGL线框模式,所以在这里通过shader实现线框\n" +
        "Def WireframeDef{\n" +
        "    Params{\n" +
        "        vec4 color;\n" +
        "        float wireframeWidth;\n" +
        "    }\n" +
        "    SubTechnology Wireframe{\n" +
        "        Vars{\n" +
        "            vec3 bary;\n" +
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
        "                bary = Context.InBarycentric;\n" +
        "\n" +
        "\n" +
        "\n" +
        "                Context.OutPosition = Context.ProjectViewMatrix * pos;\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            void main(){\n" +
        "                #ifdef Params.color\n" +
        "                    vec4 _wireframeColor = Params.color;\n" +
        "                #else\n" +
        "                    vec4 _wireframeColor = vec4(0.2f, 0.2f, 0.2f, 1.0f);\n" +
        "                #endif\n" +
        "                #ifdef Params.wireframeWidth\n" +
        "                    float _wireframeWidth = Params.wireframeWidth;\n" +
        "                #else\n" +
        "                    float _wireframeWidth = 0.01f;\n" +
        "                #endif\n" +
        "                if(any(lessThan(bary, vec3(_wireframeWidth)))){\n" +
        "                    Context.OutColor = _wireframeColor;\n" +
        "                }\n" +
        "                else{\n" +
        "                    discard;\n" +
        "                }\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass{\n" +
        "            Pass Wireframe{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
    static S_COLOR_DEF_DATA = "// 颜色材质,提供指定颜色或颜色纹理并渲染\n" +
        "Def ColorDef{\n" +
        "    Params{\n" +
        "        vec4 color;\n" +
        "        sampler2D colorMap;\n" +
        "        float alphaDiscard;\n" +
        "    }\n" +
        "    SubTechnology ScalePass{\n" +
        "        Vars{\n" +
        "            vec4 wordPosition;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                //Context.OutPosition = Context.ProjectViewModelMatrix * vec4(Context.InPosition, 1.0f);\n" +
        "                mat4 scaleMat4 = mat4(\n" +
        "                    0.2f, 0.0f, 0.0f, 0.0f,\n" +
        "                    0.0f, 0.2f, 0.0f, 0.0f,\n" +
        "                    0.0f, 0.0f, 0.2f, 0.0f,\n" +
        "                    0.0f, 0.0f, 0.0f, 1.0f\n" +
        "                );\n" +
        "                Context.OutPosition = Context.ProjectMatrix * Context.ViewMatrix * Context.ModelMatrix * vec4(Context.InPosition, 1.0f);\n" +
        "                wordPosition = Context.OutPosition;\n" +
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
        "                        Context.OutColor = texture(Params.colorMap, Context.InUv0);\n" +
        "                        #ifdef Params.alphaDiscard\n" +
        "                            if(Context.OutColor.a < Params.alphaDiscard){\n" +
        "                                discard;\n" +
        "                            }\n" +
        "                        #endif\n" +
        "                    #else\n" +
        "                        Context.OutColor = vec4(1.0f, 1.0f, 0.0f, 1.0f);\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "                vec4 wPosition = wordPosition;\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    SubTechnology ColorPass{\n" +
        "        Vars{\n" +
        "            vec4 wordPosition;\n" +
        "            vec2 uv0;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                //Context.OutPosition = Context.ProjectViewModelMatrix * vec4(Context.InPosition, 1.0f);\n" +
        "                Context.OutPosition = Context.ProjectMatrix * Context.ViewMatrix * Context.ModelMatrix * vec4(Context.InPosition, 1.0f);\n" +
        "                wordPosition = Context.OutPosition;\n" +
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
        "    SubTechnology GreenPass{\n" +
        "        Vars{\n" +
        "            vec4 wordPosition;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutPosition = Context.ProjectMatrix * Context.ViewMatrix * Context.ModelMatrix * vec4(Context.InPosition, 1.0f);\n" +
        "                wordPosition = Context.OutPosition;\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            void main(){\n" +
        "                // 先判断Params.color是否有值\n" +
        "                #ifdef Params.color\n" +
        "                    Context.OutColor = Params.color;\n" +
        "                #else\n" +
        "                    Context.OutColor = vec4(0.0f, 1.0f, 0.0f, 1.0f);\n" +
        "                #endif\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass{\n" +
        "            Pass ColorPass{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology Green{\n" +
        "        Sub_Pass{\n" +
        "            Pass GreenPass{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    // ScaleColorPass\n" +
        "    Technology ScaleColor{\n" +
        "        Sub_Pass{\n" +
        "            //第一个pass不应该写入深度,否则第二个pass被剔除\n" +
        "            //可以指定每个pass的写入状态,比如关闭深度,开启深度之类的\n" +
        "            Pass ScalePass{\n" +
        "                // 这个pass剔除前面\n" +
        "                FaceCull Front;\n" +
        "            }\n" +
        "            Pass ColorPass{\n" +
        "                // 这个pass剔除背面\n" +
        "                FaceCull Back;\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
    static S_POST_SHADOW_DEF_DATA = "// PostShadowDef\n" +
        "Def PostShadowDef{\n" +
        "    Params{\n" +
        "        // ShadowInfo\n" +
        "        float shadowIntensity;\n" +
        "        int filterMode;\n" +
        "        bool hardwareShadow;\n" +
        "        bool backfaceShadows;\n" +
        "        float pcfEdge;\n" +
        "        vec2 fadeInfo;\n" +
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
        "                // glsl是列矩阵,这里我获取第二行(只需要变换得到z即可测试PSSM)\n" +
        "                pvRow2 = vec4(Context.ProjectViewMatrix[0][2], Context.ProjectViewMatrix[1][2], Context.ProjectViewMatrix[2][2], Context.ProjectViewMatrix[3][2]);\n" +
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
        "            #define FILTER_MODE 1\n" +
        "\n" +
        "            #if FILTER_MODE == 10\n" +
        "                #define GETSHADOW Shadow_Nearest\n" +
        "                #define KERNEL 1.0\n" +
        "            #elif FILTER_MODE == 1\n" +
        "                #ifdef HARDWARE_SHADOWS\n" +
        "                    #define GETSHADOW Shadow_Nearest\n" +
        "                #else\n" +
        "                    #define GETSHADOW Shadow_DoBilinear_2x2\n" +
        "                #endif\n" +
        "                #define KERNEL 1.0\n" +
        "            #endif\n" +
        "\n" +
        "            #if (FILTER_MODE == 2)\n" +
        "                #define GETSHADOW Shadow_DoDither_2x2\n" +
        "                #define KERNEL 1.0\n" +
        "            #elif FILTER_MODE == 3\n" +
        "                #define GETSHADOW Shadow_DoPCF\n" +
        "                #define KERNEL 4.0\n" +
        "            #elif FILTER_MODE == 4\n" +
        "                #define GETSHADOW Shadow_DoPCFPoisson\n" +
        "                #define KERNEL 4.0\n" +
        "            #elif FILTER_MODE == 5\n" +
        "                #define GETSHADOW Shadow_DoPCF\n" +
        "                #define KERNEL 8.0\n" +
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
        "\n" +
        "            //----------------------------------ShadowFilter--------------------------------------\n" +
        "            float Shadow_DoShadowCompareOffset(in SHADOWMAP tex,in vec4 projCoord,in vec2 offset){\n" +
        "                vec4 coord = vec4(projCoord.xy + offset.xy * Context.SMapSizeInverse * shadowBorderScale, projCoord.zw);\n" +
        "                return SHADOWCOMPARE(tex, coord);\n" +
        "            }\n" +
        "\n" +
        "\n" +
        "            float Shadow_DoDither_2x2(in SHADOWMAP tex, in vec4 projCoord){\n" +
        "                float border = Shadow_BorderCheck(projCoord.xy);\n" +
        "                if (border > 0.0f)\n" +
        "                    return 1.0f;\n" +
        "\n" +
        "                float shadow = 0.0f;\n" +
        "                vec2 o = vec2(ivec2(mod(floor(gl_FragCoord.xy), 2.0f))); //Strict type checking in GLSL ES\n" +
        "                shadow += Shadow_DoShadowCompareOffset(tex, projCoord, (vec2(-1.5f, 1.5f)+o));\n" +
        "                shadow += Shadow_DoShadowCompareOffset(tex, projCoord, (vec2( 0.5f, 1.5f)+o));\n" +
        "                shadow += Shadow_DoShadowCompareOffset(tex, projCoord, (vec2(-1.5f, -0.5f)+o));\n" +
        "                shadow += Shadow_DoShadowCompareOffset(tex, projCoord, (vec2( 0.5f, -0.5f)+o));\n" +
        "                shadow *= 0.25f;\n" +
        "                return shadow;\n" +
        "            }\n" +
        "\n" +
        "            float Shadow_DoBilinear_2x2(in SHADOWMAP tex, in vec4 projCoord){\n" +
        "                float border = Shadow_BorderCheck(projCoord.xy);\n" +
        "                if (border > 0.0f){\n" +
        "                    return 1.0f;\n" +
        "                }\n" +
        "\n" +
        "                vec4 gather = vec4(0.0f);\n" +
        "                #if defined GL_ARB_gpu_shader5 || defined GL_OES_gpu_shader5\n" +
        "                    vec4 coord = vec4(projCoord.xyz / projCoord.www, 0.0f);\n" +
        "                    gather = SHADOWGATHER(tex, coord);\n" +
        "                #else\n" +
        "                    gather.x = SHADOWCOMPAREOFFSET(tex, projCoord, ivec2(0, 1));\n" +
        "                    gather.y = SHADOWCOMPAREOFFSET(tex, projCoord, ivec2(1, 1));\n" +
        "                    gather.z = SHADOWCOMPAREOFFSET(tex, projCoord, ivec2(1, 0));\n" +
        "                    gather.w = SHADOWCOMPAREOFFSET(tex, projCoord, ivec2(0, 0));\n" +
        "                #endif\n" +
        "\n" +
        "               vec2 f = fract( projCoord.xy * Context.ShadowMapSize );\n" +
        "               vec2 mx = mix( gather.wx, gather.zy, f.x );\n" +
        "               return mix( mx.x, mx.y, f.y );\n" +
        "            }\n" +
        "\n" +
        "            float Shadow_DoPCF(in SHADOWMAP tex,in vec4 projCoord){\n" +
        "\n" +
        "                float shadow = 0.0f;\n" +
        "                float border = Shadow_BorderCheck(projCoord.xy);\n" +
        "                if (border > 0.0f)\n" +
        "                    return 1.0f;\n" +
        "\n" +
        "                float bound = KERNEL * 0.5f - 0.5f;\n" +
        "                bound *= Params.pcfEdge;\n" +
        "                for (float y = -bound; y <= bound; y += Params.pcfEdge){\n" +
        "                    for (float x = -bound; x <= bound; x += Params.pcfEdge){\n" +
        "                        shadow += Shadow_DoShadowCompareOffset(tex, projCoord, vec2(x,y));\n" +
        "                    }\n" +
        "                }\n" +
        "\n" +
        "                shadow = shadow / (KERNEL * KERNEL);\n" +
        "                return shadow;\n" +
        "            }\n" +
        "\n" +
        "            //12 tap poisson disk\n" +
        "            const vec2 poissonDisk0 =  vec2(-0.1711046f, -0.425016f);\n" +
        "            const vec2 poissonDisk1 =  vec2(-0.7829809f, 0.2162201f);\n" +
        "            const vec2 poissonDisk2 =  vec2(-0.2380269f, -0.8835521f);\n" +
        "            const vec2 poissonDisk3 =  vec2(0.4198045f, 0.1687819f);\n" +
        "            const vec2 poissonDisk4 =  vec2(-0.684418f, -0.3186957f);\n" +
        "            const vec2 poissonDisk5 =  vec2(0.6026866f, -0.2587841f);\n" +
        "            const vec2 poissonDisk6 =  vec2(-0.2412762f, 0.3913516f);\n" +
        "            const vec2 poissonDisk7 =  vec2(0.4720655f, -0.7664126f);\n" +
        "            const vec2 poissonDisk8 =  vec2(0.9571564f, 0.2680693f);\n" +
        "            const vec2 poissonDisk9 =  vec2(-0.5238616f, 0.802707f);\n" +
        "            const vec2 poissonDisk10 = vec2(0.5653144f, 0.60262f);\n" +
        "            const vec2 poissonDisk11 = vec2(0.0123658f, 0.8627419f);\n" +
        "\n" +
        "\n" +
        "            float Shadow_DoPCFPoisson(in SHADOWMAP tex, in vec4 projCoord){\n" +
        "                float shadow = 0.0f;\n" +
        "                float border = Shadow_BorderCheck(projCoord.xy);\n" +
        "                if (border > 0.0f){\n" +
        "                    return 1.0f;\n" +
        "                }\n" +
        "\n" +
        "                vec2 texelSize = Context.SMapSizeInverse * 4.0f * Params.pcfEdge * shadowBorderScale;\n" +
        "\n" +
        "                shadow += SHADOWCOMPARE(tex, vec4(projCoord.xy + poissonDisk0 * texelSize, projCoord.zw));\n" +
        "                shadow += SHADOWCOMPARE(tex, vec4(projCoord.xy + poissonDisk1 * texelSize, projCoord.zw));\n" +
        "                shadow += SHADOWCOMPARE(tex, vec4(projCoord.xy + poissonDisk2 * texelSize, projCoord.zw));\n" +
        "                shadow += SHADOWCOMPARE(tex, vec4(projCoord.xy + poissonDisk3 * texelSize, projCoord.zw));\n" +
        "                shadow += SHADOWCOMPARE(tex, vec4(projCoord.xy + poissonDisk4 * texelSize, projCoord.zw));\n" +
        "                shadow += SHADOWCOMPARE(tex, vec4(projCoord.xy + poissonDisk5 * texelSize, projCoord.zw));\n" +
        "                shadow += SHADOWCOMPARE(tex, vec4(projCoord.xy + poissonDisk6 * texelSize, projCoord.zw));\n" +
        "                shadow += SHADOWCOMPARE(tex, vec4(projCoord.xy + poissonDisk7 * texelSize, projCoord.zw));\n" +
        "                shadow += SHADOWCOMPARE(tex, vec4(projCoord.xy + poissonDisk8 * texelSize, projCoord.zw));\n" +
        "                shadow += SHADOWCOMPARE(tex, vec4(projCoord.xy + poissonDisk9 * texelSize, projCoord.zw));\n" +
        "                shadow += SHADOWCOMPARE(tex, vec4(projCoord.xy + poissonDisk10 * texelSize, projCoord.zw));\n" +
        "                shadow += SHADOWCOMPARE(tex, vec4(projCoord.xy + poissonDisk11 * texelSize, projCoord.zw));\n" +
        "\n" +
        "                // 除以 12\n" +
        "                return shadow * 0.08333333333f;\n" +
        "            }\n" +
        "            //----------------------------------ShadowFilter--------------------------------------\n" +
        "\n" +
        "\n" +
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
        "            #ifdef Context.Pssm\n" +
        "                // 基于PSSM实现的DirectionalLightShadows\n" +
        "                float getDirectionalLightShadows(in vec4 splits,in float shadowPosition, in SHADOWMAP shadowMap0, in SHADOWMAP shadowMap1, in SHADOWMAP shadowMap2,in SHADOWMAP shadowMap3, in vec4 projCoord0,in vec4 projCoord1,in vec4 projCoord2,in vec4 projCoord3){\n" +
        "                    float shadow = 1.0f;\n" +
        "                    if(shadowPosition < splits.x){\n" +
        "                        shadow = GETSHADOW(shadowMap0, projCoord0 );\n" +
        "                    }\n" +
        "                    else if( shadowPosition <  splits.y){\n" +
        "                        shadowBorderScale = 0.5f;\n" +
        "                        shadow = GETSHADOW(shadowMap1, projCoord1);\n" +
        "                    }\n" +
        "                    else if( shadowPosition <  splits.z){\n" +
        "                        shadowBorderScale = 0.25f;\n" +
        "                        shadow = GETSHADOW(shadowMap2, projCoord2);\n" +
        "                    }\n" +
        "                    else if( shadowPosition <  splits.w){\n" +
        "                        shadowBorderScale = 0.125f;\n" +
        "                        shadow = GETSHADOW(shadowMap3, projCoord3);\n" +
        "                    }\n" +
        "                    return shadow;\n" +
        "                }\n" +
        "            #endif\n" +
        "            #ifdef Context.PointLightShadows\n" +
        "                float getPointLightShadows(in vec4 worldPos,in vec3 lightPos, in SHADOWMAP shadowMap0, in SHADOWMAP shadowMap1, in SHADOWMAP shadowMap2, in SHADOWMAP shadowMap3, in SHADOWMAP shadowMap4, in SHADOWMAP shadowMap5, in vec4 projCoord0,in vec4 projCoord1,in vec4 projCoord2,in vec4 projCoord3,in vec4 projCoord4,in vec4 projCoord5){\n" +
        "                    float shadow = 1.0f;\n" +
        "                    vec3 vect = worldPos.xyz - lightPos;\n" +
        "                    vec3 absv = abs(vect);\n" +
        "                    float maxComp = max(absv.x,max(absv.y,absv.z));\n" +
        "                    if(maxComp == absv.y){\n" +
        "                       if(vect.y < 0.0f){\n" +
        "                           shadow = GETSHADOW(shadowMap0, projCoord0 / projCoord0.w);\n" +
        "                       }\n" +
        "                       else{\n" +
        "                           shadow = GETSHADOW(shadowMap1, projCoord1 / projCoord1.w);\n" +
        "                       }\n" +
        "                    }\n" +
        "                    else if(maxComp == absv.z){\n" +
        "                       if(vect.z < 0.0f){\n" +
        "                           shadow = GETSHADOW(shadowMap2, projCoord2 / projCoord2.w);\n" +
        "                       }\n" +
        "                       else{\n" +
        "                           shadow = GETSHADOW(shadowMap3, projCoord3 / projCoord3.w);\n" +
        "                       }\n" +
        "                    }\n" +
        "                    else if(maxComp == absv.x){\n" +
        "                       if(vect.x < 0.0f){\n" +
        "                           shadow = GETSHADOW(shadowMap4, projCoord4 / projCoord4.w);\n" +
        "                       }\n" +
        "                       else{\n" +
        "                           shadow = GETSHADOW(shadowMap5, projCoord5 / projCoord5.w);\n" +
        "                       }\n" +
        "                    }\n" +
        "                    return shadow;\n" +
        "                }\n" +
        "            #endif\n" +
        "            #ifdef Context.SpotLightShadows\n" +
        "                float getSpotLightShadows(in SHADOWMAP shadowMap, in  vec4 projCoord){\n" +
        "                    float shadow = 1.0f;\n" +
        "                    projCoord /= projCoord.w;\n" +
        "                    shadow = GETSHADOW(shadowMap, projCoord);\n" +
        "\n" +
        "                    // 一个小的衰减，使阴影很好地融入暗部，将纹理坐标值转换为 -1,1 范围，因此纹理坐标向量的长度实际上是地面上变亮区域的半径\n" +
        "                    projCoord = projCoord * 2.0f - 1.0f;\n" +
        "                    float fallOff = ( length(projCoord.xy) - 0.9f ) / 0.1f;\n" +
        "                    return mix(shadow, 1.0f, clamp(fallOff, 0.0f, 1.0f));\n" +
        "                }\n" +
        "            #endif\n" +
        "            vec3 approximateNormal(in vec4 worldPos,in vec2 texCoord, in sampler2D depthMap, in vec2 resolutionInverse){\n" +
        "                float step = resolutionInverse.x;\n" +
        "                float stepy = resolutionInverse.y;\n" +
        "                float depth2 = texture(depthMap, texCoord + vec2(step, -stepy)).r;\n" +
        "                float depth3 = texture(depthMap, texCoord + vec2(-step, -stepy)).r;\n" +
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
        "                #ifdef Context.Pssm\n" +
        "                    lightDir = Context.LightDir;\n" +
        "                #else\n" +
        "                    lightDir = wPosition.xyz - Context.LightPos;\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Params.backfaceShadows\n" +
        "                    // 丢弃背面时,由于在forward pipeline下无法获取该点法线,所以只能通过近似算法获取法线\n" +
        "                    // 该近似算法依赖于深度信息,所以很容易造成Shadow Acne\n" +
        "                    if(!Params.backfaceShadows){\n" +
        "                        vec3 normal = approximateNormal(wPosition, wUv0, Context.InDepth, Context.ResolutionInverse);\n" +
        "                        float ndotl = dot(normal, lightDir);\n" +
        "                        if(ndotl > 0.0f){\n" +
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
        "                #ifdef Context.PointLightShadows\n" +
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
        "                    #if defined(Params.fadeInfo)\n" +
        "                        float shadowPosition = pvRow2.x * wPosition.x +  pvRow2.y * wPosition.y +  pvRow2.z * wPosition.z +  pvRow2.w;\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Context.PointLightShadows\n" +
        "                    // pointLight shadow\n" +
        "                    shadow = getPointLightShadows(wPosition, Context.LightPos, Context.InShadowMap0, Context.InShadowMap1, Context.InShadowMap2, Context.InShadowMap3, Context.InShadowMap4, Context.InShadowMap5, projCoord0, projCoord1, projCoord2, projCoord3, projCoord4, projCoord5);\n" +
        "                #else\n" +
        "                    #ifdef Context.Pssm\n" +
        "                        // directionalLight shadow\n" +
        "                        shadow = getDirectionalLightShadows(Context.Splits, shadowPosition, Context.InShadowMap0, Context.InShadowMap1, Context.InShadowMap2, Context.InShadowMap3, projCoord0, projCoord1, projCoord2, projCoord3);\n" +
        "                    #else\n" +
        "                        #ifdef Context.SpotLightShadows\n" +
        "                            // spotLight shadow\n" +
        "                            shadow = getSpotLightShadows(Context.InShadowMap0, projCoord0);\n" +
        "                        #endif\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Params.fadeInfo\n" +
        "                    shadow = clamp(max(0.0f, mix(shadow, 1.0f,(shadowPosition - Params.fadeInfo.x) * Params.fadeInfo.y)), 0.0f, 1.0f);\n" +
        "                #endif\n" +
        "                #ifdef Params.shadowIntensity\n" +
        "                    shadow = shadow * Params.shadowIntensity + (1.0f - Params.shadowIntensity);\n" +
        "                #else\n" +
        "                    shadow = shadow * 0.7f + 0.3f;\n" +
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
    static S_FOG_FILTER_DEF_DATA = "// 雾化\n" +
        "Def FogFilterDef{\n" +
        "    Params{\n" +
        "        // 雾化距离(默认1000.0f)\n" +
        "        float fogDistance;\n" +
        "        // 通常为1.0\n" +
        "        float fogDensity;\n" +
        "        // 视锥near\n" +
        "        float vNear;\n" +
        "        // 视锥far\n" +
        "        float vFar;\n" +
        "        // 雾化near\n" +
        "        float fogNear;\n" +
        "        // 雾化far\n" +
        "        float fogFar;\n" +
        "        // 雾化颜色\n" +
        "        vec4 fogColor;\n" +
        "    }\n" +
        "    SubTechnology Fog{\n" +
        "        Vars{\n" +
        "            vec2 wUv0;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutPosition = vec4(Context.InPosition, 1.0f);\n" +
        "                wUv0 = Context.InUv0;\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            const float LOG2 = 1.442695f;\n" +
        "            void main(){\n" +
        "                Context.OutColor = texture(Context.InScreen, wUv0);\n" +
        "                float depth = texture(Context.InDepth, wUv0).r;\n" +
        "\n" +
        "                #ifdef Params.fogDistance\n" +
        "                    float _fogDistance = Params.fogDistance;\n" +
        "                #else\n" +
        "                    float _fogDistance = 1000.0f;\n" +
        "                #endif\n" +
        "                #ifdef Params.fogDensity\n" +
        "                    float _fogDensity = Params.fogDensity;\n" +
        "                #else\n" +
        "                    float _fogDensity = 1.0f;\n" +
        "                #endif\n" +
        "                #ifdef Params.fogColor\n" +
        "                    vec4 _fogColor = Params.fogColor;\n" +
        "                #else\n" +
        "                    vec4 _fogColor = vec4(1.0f);\n" +
        "                #endif\n" +
        "\n" +
        "                // 可以简单的将视锥范围作为雾化过渡范围，如下：\n" +
        "                // 此时，越靠近相机，dis越接近0，fog越接近1.0f，最终混合下Context.OutColor越清晰，远离相机时，dis小于0，fog逐渐变小，最终混合下_fogColor逐渐清晰\n" +
        "                // 但是这种雾化计算dis在一个很小的非线性范围内变化\n" +
        "                // float dis = (0.5f * depth + 0.5f);\n" +
        "                // 所以这里变化到线性深度范围(假设near恒定为1.0)\n" +
        "                float dis = 2.0f / (_fogDistance + 1.0f - depth * (_fogDistance - 1.0f));\n" +
        "\n" +
        "                // 一个经典的浓度过渡方程\n" +
        "                float fog = exp2(-_fogDensity * _fogDensity * dis * dis * LOG2);\n" +
        "                // 雾化规范到(0.0f,1.0f)\n" +
        "                fog = clamp(fog, 0.0f, 1.0f);\n" +
        "\n" +
        "                // 混合结果\n" +
        "                Context.OutColor = mix(_fogColor, Context.OutColor, fog);\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    SubTechnology LinearFog{\n" +
        "        Vars{\n" +
        "            vec2 wUv0;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutPosition = vec4(Context.InPosition, 1.0f);\n" +
        "                wUv0 = Context.InUv0;\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            const float LOG2 = 1.442695f;\n" +
        "            void main(){\n" +
        "                Context.OutColor = texture(Context.InScreen, wUv0);\n" +
        "                float depth = texture(Context.InDepth, wUv0).r;\n" +
        "\n" +
        "                #ifdef Params.vNear\n" +
        "                    float _vNear = Params.vNear;\n" +
        "                #else\n" +
        "                    float _vNear = 0.1f;\n" +
        "                #endif\n" +
        "                #ifdef Params.vFar\n" +
        "                    float _vFar = Params.vFar;\n" +
        "                #else\n" +
        "                    float _vFar = 1000.0f;\n" +
        "                #endif\n" +
        "                #ifdef Params.fogNear\n" +
        "                    float _fogNear = Params.fogNear;\n" +
        "                #else\n" +
        "                    float _fogNear = 1.0f;\n" +
        "                #endif\n" +
        "                #ifdef Params.fogFar\n" +
        "                    float _fogFar = Params.fogFar;\n" +
        "                #else\n" +
        "                    float _fogFar = 1000.0f;\n" +
        "                #endif\n" +
        "                #ifdef Params.fogColor\n" +
        "                    vec4 _fogColor = Params.fogColor;\n" +
        "                #else\n" +
        "                    vec4 _fogColor = vec4(1.0f);\n" +
        "                #endif\n" +
        "\n" +
        "\n" +
        "                // 线性雾化相对来说比较简单,仅考虑指定near,far内的过渡\n" +
        "                float dis = (2.0f * _vNear) / (_vFar + _vNear - depth * (_vFar - _vNear));\n" +
        "\n" +
        "                // 雾化规范到(0.0f,1.0f)\n" +
        "                float fog = smoothstep(_fogNear, _fogFar, dis * (_vFar - _vNear));\n" +
        "\n" +
        "                // 混合结果\n" +
        "                Context.OutColor = mix(Context.OutColor, _fogColor, fog);\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass PostFilter{\n" +
        "            Pass Fog{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology LinearFog{\n" +
        "\n" +
        "        Sub_Pass PostFilter{\n" +
        "            Pass LinearFog{\n" +
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


    // ------------------------------------Lighting-------------------------------------------
    static S_EMISSIVE_LIGHTING_DEF_DATA = "// 自发光材质定义\n" +
        "Def EmissiveLightingDef{\n" +
        "    Params{\n" +
        "        vec4 color;\n" +
        "        sampler2D colorMap;\n" +
        "        float alphaDiscard;\n" +
        "\n" +
        "        // 自发光\n" +
        "        sampler2D emissiveMap;\n" +
        "        vec4 emissive;\n" +
        "        float emissivePower;\n" +
        "        float emissiveIntensity;\n" +
        "    }\n" +
        "    SubTechnology EmissivePass{\n" +
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
        "                // 使用自定义颜色输出\n" +
        "                #ifdef Params.color\n" +
        "                    Context.OutColor = Params.color;\n" +
        "                #else\n" +
        "                    // 使用纹理\n" +
        "                    #ifdef Params.colorMap\n" +
        "                        Context.OutColor = texture(Params.colorMap, wUv0);\n" +
        "                        #ifdef Params.alphaDiscard\n" +
        "                            if(Context.OutColor.a < Params.alphaDiscard){\n" +
        "                                discard;\n" +
        "                            }\n" +
        "                        #endif\n" +
        "                    #else\n" +
        "                        Context.OutColor = vec4(1.0f, 1.0f, 1.0f, 1.0f);\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "                // 唯一shading阶段,在这里处理自发光或只shading一次的逻辑\n" +
        "                // 因为使用默认渲染程序,所以默认就是执行一次该逻辑\n" +
        "                #ifdef Params.emissive\n" +
        "                    float _emissivePower = 3.0f;\n" +
        "                    #ifdef Params.emissivePower\n" +
        "                        _emissivePower = Params.emissivePower;\n" +
        "                    #endif\n" +
        "                    float _emissiveIntensity = 2.0f;\n" +
        "                    #ifdef Params.emissiveIntensity\n" +
        "                        _emissiveIntensity = Params.emissiveIntensity;\n" +
        "                    #endif\n" +
        "                    #ifdef Params.emissiveMap\n" +
        "                        vec4 eMap = texture(Params.emissiveMap, wUv0);\n" +
        "                        Context.OutColor.rgb += Params.emissive.rgb * eMap.rgb * pow(Params.emissive.a * eMap.a, _emissivePower) * _emissiveIntensity;\n" +
        "                    #else\n" +
        "                        Context.OutColor.rgb += Params.emissive.rgb * pow(Params.emissive.a, _emissivePower) * _emissiveIntensity;\n" +
        "                    #endif\n" +
        "                #else\n" +
        "                    #ifdef Params.emissiveMap\n" +
        "                        float _emissivePower = 3.0f;\n" +
        "                        #ifdef Params.emissivePower\n" +
        "                            _emissivePower = Params.emissivePower;\n" +
        "                        #endif\n" +
        "                        float _emissiveIntensity = 2.0f;\n" +
        "                        #ifdef Params.emissiveIntensity\n" +
        "                            _emisiveIntensity = Params.emissiveIntensity;\n" +
        "                        #endif\n" +
        "                        vec4 eMap = texture(Params.emissiveMap, wUv0);\n" +
        "                        Context.OutColor.rgb += eMap.rgb * pow(eMap.a, _emissivePower) * _emissiveIntensity;\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass{\n" +
        "            Pass EmissivePass{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
    static S_BASIC_LIGHTING_DEF_DATA = "// 基础光照材质定义\n" +
        "Def BasicLightingDef{\n" +
        "    Params{\n" +
        "        sampler2D diffuseMap;\n" +
        "        sampler2D normalMap;\n" +
        "        sampler2D specularMap;\n" +
        "        vec4 ambientColor;\n" +
        "        vec4 diffuseColor;\n" +
        "        vec4 specularColor;\n" +
        "        float shininess;\n" +
        "        // lightMap或AO或OCC\n" +
        "        sampler2D lightMap;\n" +
        "        bool lightMapTexCoord;\n" +
        "        // 完全透明剔除因子(0-1),低于该值的透明片段被完全剔除而不进行混合\n" +
        "        float alphaDiscard;\n" +
        "\n" +
        "        // 自发光\n" +
        "        sampler2D emissiveMap;\n" +
        "        vec4 emissive;\n" +
        "        float emissivePower;\n" +
        "        float emissiveIntensity;\n" +
        "    }\n" +
        "    SubTechnology MultiPassBlinnPhongLighting{\n" +
        "        Vars{\n" +
        "            vec3 wNormal;\n" +
        "            vec4 wTangent;\n" +
        "            vec3 wPosition;\n" +
        "            vec2 wUv0;\n" +
        "            vec2 wUv1;\n" +
        "            // 三种成分用于调和光照,可来自材质颜色的定义,也可以来自vertex_light\n" +
        "            vec3 ambientSumAdjust;\n" +
        "            vec4 diffuseSumAdjust;\n" +
        "            vec3 specularSumAdjust;\n" +
        "        }\n" +
        "        Advanced{\n" +
        "            RenderProgram MultiPassLighting;\n" +
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
        "\n" +
        "\n" +
        "                wPosition = (Context.ModelMatrix * vec4(Context.InPosition, 1.0f)).xyz;\n" +
        "                mat3 nMat = mat3(transpose(inverse(Context.ModelMatrix)));\n" +
        "                vec3 norm = normalize(nMat * Context.InNormal);\n" +
        "                wTangent = vec4(normalize(nMat * Context.InTangent.xyz), Context.InTangent.w);\n" +
        "                //t = normalize(t - dot(t, norm) * norm);\n" +
        "                //vec3 b = cross(norm, t);\n" +
        "                //tbnMat = mat3(t, b, norm);\n" +
        "                wNormal = norm;\n" +
        "                wUv0 = Context.InUv0;\n" +
        "\n" +
        "                // lightMap/AO/OCC\n" +
        "                #ifdef Params.lightMapTexCoord\n" +
        "                    wUv1 = Context.InUv1;\n" +
        "                #endif\n" +
        "\n" +
        "\n" +
        "                // 如果是顶点光照,则在这里将光源变化到切线空间\n" +
        "                ambientSumAdjust = Params.ambientColor.rgb * Context.AmbientLightColor;\n" +
        "                diffuseSumAdjust = vec4(1.0f);\n" +
        "                specularSumAdjust = vec3(1.0f);\n" +
        "                Context.OutPosition = Context.ProjectViewMatrix * pos;\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            // 计算光照方向\n" +
        "            // 对于DirLight,PointLight以及SpotLight,lightType依次为0.0,1.0,2.0\n" +
        "            // 输出光照方向\n" +
        "            // lightDir.w存储衰减率(对于DirLight,衰减值一直为1,对于Point或Spot,衰减值随着半径而变小,衰减值越小,表示衰减度越大)\n" +
        "            void ComputeLightDir(in vec3 worldPos, in float lightType, in vec4 position, out vec4 lightDir, out vec3 lightVec){\n" +
        "                // 只有lightType = 0.0时,posLight为0.0,否则posLight为1.0\n" +
        "                float posLight = step(0.5f, lightType);\n" +
        "\n" +
        "                // 计算光照位置\n" +
        "                // 对于DirLight,lightVec = position.xyz * sign(-0.5f) = position.xyz * -1.0f;其中position代表DirLight的方向\n" +
        "                // 对于PointLight和SpotLight,lightVec = position.xyz * sign(1.0f - 0.5f) - (worldPos * 1.0f) = positions.xyz * 1.0f - worldPos;其中position代表Light的位置\n" +
        "                lightVec = position.xyz * sign(posLight - 0.5f) - (worldPos * posLight);\n" +
        "                float dist = length(lightVec);\n" +
        "\n" +
        "                // 对于DirLight,lightDir.w = 1.0f\n" +
        "                //lightDir.w = clamp(1.0f - position.w * dist * posLight, 0.0f, 1.0f);\n" +
        "\n" +
        "                lightDir.w = (1.0f - position.w * dist) / (1.0f + position.w * dist * dist);\n" +
        "                lightDir.w = clamp(lightDir.w, 1.0f - posLight, 1.0f);\n" +
        "\n" +
        "                // 归一化\n" +
        "                lightDir.xyz = lightVec / vec3(dist);\n" +
        "            }\n" +
        "            // 基于BlinnPhong光照模型计算光照因子\n" +
        "            // brdf.x保存漫反射部分;brdf.y保存镜面反射部分\n" +
        "            void ComputeLighting(in vec3 normal, in vec3 viewDir, in vec3 lightDir, in float attenuation, in float shininess, out vec2 brdf){\n" +
        "                // diffuse部分\n" +
        "                float diffuseBRDF = max(0.0f, dot(normal, lightDir));\n" +
        "                // specular部分\n" +
        "                // 半角向量代替viewDir参与光照计算\n" +
        "                vec3 H = normalize(viewDir + lightDir);\n" +
        "                float HdotN = max(0.0f, dot(H, normal));\n" +
        "                float specularBRDF = pow( HdotN, shininess );\n" +
        "\n" +
        "                // 衰减,对于PointLight和SpotLight来说有效,对于DirLight而言,attenuation一直为1\n" +
        "                brdf.x = diffuseBRDF * attenuation;\n" +
        "                brdf.y = specularBRDF * attenuation;\n" +
        "            }\n" +
        "            // 返回Spot范围衰减\n" +
        "            float ComputeSpotFalloff(in vec4 spotDirection, in vec3 lightDir){\n" +
        "                float curAngleCos = dot(lightDir, -spotDirection.xyz);\n" +
        "                float innerAngleCos = floor(spotDirection.w) * 0.001f;\n" +
        "                float outerAngleCos = fract(spotDirection.w);\n" +
        "                float innerMinusOuter = innerAngleCos - outerAngleCos;\n" +
        "\n" +
        "                #ifndef Context.Srgb\n" +
        "                    // 使用二次衰减（请注意^ 4）\n" +
        "                    return pow(clamp((curAngleCos - outerAngleCos) / innerMinusOuter, 0.0f, 1.0f), 4.0f);\n" +
        "                #else\n" +
        "                    // 线性空间衰减\n" +
        "                    return clamp((curAngleCos - outerAngleCos) / innerMinusOuter, step(spotDirection.w, 0.001f), 1.0f);\n" +
        "                #endif\n" +
        "            }\n" +
        "            void main(){\n" +
        "                // 计算光照\n" +
        "                vec4 lightColor;\n" +
        "                vec4 lightData1;\n" +
        "                vec4 lightDir = vec4(0.0f);\n" +
        "                vec3 lightVec = vec3(0.0f);\n" +
        "                vec2 lightBRDF = vec2(0.0f);\n" +
        "                vec3 viewDir = normalize(Context.CameraPosition.xyz - wPosition.xyz);\n" +
        "\n" +
        "                vec4 _diffuseColor = vec4(1.0f);\n" +
        "                vec4 _specularColor = vec4(1.0f);\n" +
        "\n" +
        "                #ifdef Params.diffuseColor\n" +
        "                    _diffuseColor = Params.diffuseColor;\n" +
        "                #endif\n" +
        "                #ifdef Params.diffuseMap\n" +
        "                    _diffuseColor = _diffuseColor * texture(Params.diffuseMap, wUv0);\n" +
        "                    #ifdef Params.alphaDiscard\n" +
        "                        // discard性能比较差,建议还是使用半透明渲染比较合适s\n" +
        "                        if(_diffuseColor.a < Params.alphaDiscard){\n" +
        "                            discard;\n" +
        "                        }\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Params.specularColor\n" +
        "                    _specularColor = Params.specularColor;\n" +
        "                #endif\n" +
        "                #ifdef Params.specularMap\n" +
        "                    _specularColor = _specularColor * texture(Params.specularMap, wUv0);\n" +
        "                #endif\n" +
        "\n" +
        "                vec3 normal = normalize( wNormal );\n" +
        "                #ifdef Params.normalMap\n" +
        "                    vec3 normalHeight = texture(Params.normalMap, wUv0).xyz;\n" +
        "                    vec3 tangent = normalize(wTangent.xyz);\n" +
        "                    mat3 tbnMat = mat3(tangent, wTangent.w * cross(normal, tangent), normal);\n" +
        "                    normal = normalize(tbnMat * ( normalHeight * 2.0f - 1.0f ));\n" +
        "                #endif\n" +
        "\n" +
        "                float _shininess = 32.0;\n" +
        "                #ifdef Params.shininess\n" +
        "                    _shininess = Params.shininess;\n" +
        "                #endif\n" +
        "\n" +
        "                // lightMap/AO/OCC\n" +
        "                #ifdef Params.lightMap\n" +
        "                    #ifdef Params.lightMapTexCoord\n" +
        "                        vec3 lightMapColor = texture(Params.lightMap, wUv1).rgb;\n" +
        "                    #else\n" +
        "                        vec3 lightMapColor = texture(Params.lightMap, wUv0).rgb;\n" +
        "                    #endif\n" +
        "                    _specularColor.rgb *= lightMapColor;\n" +
        "                    _diffuseColor.rgb  *= lightMapColor;\n" +
        "                #endif\n" +
        "\n" +
        "\n" +
        "                Context.OutColor.rgb = _diffuseColor.rgb * ambientSumAdjust;\n" +
        "\n" +
        "\n" +
        "                // 不必担心这个分支，不会影响性能\n" +
        "                if(Context.MultiId == 0){\n" +
        "                    for( int i = 0;i < Context.CurLightCount;i+=3 ){\n" +
        "                        // 后期改为Context.GetLightDir(Context.LightData[i]);\n" +
        "                        lightColor = Context.WLightData[i];\n" +
        "                        lightData1 = Context.WLightData[i + 1];\n" +
        "                        ComputeLightDir(wPosition, lightColor.w, lightData1, lightDir, lightVec);\n" +
        "                        //lightBRDF.x = max( 0.0f, dot( normal, lightDir.xyz ) );\n" +
        "\n" +
        "                        // BlinnPhongLighting\n" +
        "                        //vec3 h = normalize( viewDir + lightDir.xzy );\n" +
        "                        //lightBRDF.y = pow( max( 0.0f, dot( normal, h ) ), 32.0f );\n" +
        "                        // 标准PhongLighting\n" +
        "                        //vec3 refDir = reflect( lightData1.xyz, normal );\n" +
        "                        //lightBRDF.y = pow( max( 0.0f, dot( viewDir, refDir ) ), 32.0f);\n" +
        "\n" +
        "                        // 计算SpotLight的衰减\n" +
        "                        float spotFallOff = 1.0;\n" +
        "                        if( lightColor.w > 1.0f )\n" +
        "                        {\n" +
        "                            // 计算SpotLight的范围衰减\n" +
        "                            spotFallOff = ComputeSpotFalloff( Context.WLightData[i + 2], lightDir.xyz );\n" +
        "                        }\n" +
        "\n" +
        "                        // 如果存在法线纹理,则进一步计算lightDir\n" +
        "\n" +
        "                        // 计算反射率\n" +
        "                        ComputeLighting(normal, viewDir, lightDir.xyz, lightDir.w * spotFallOff, _shininess, lightBRDF);\n" +
        "\n" +
        "                        // 最终光照值\n" +
        "                        //Context.OutColor.rgb += lightColor.rgb * (vec3(lightBRDF.x) * _diffuseColor.rgb * diffuseSumAdjust.rgb + vec3(lightBRDF.y) * _specularColor.rgb * specularSumAdjust.rgb);\n" +
        "                        Context.OutColor.rgb += lightColor.rgb * ( _diffuseColor.rgb * diffuseSumAdjust.rgb * vec3( lightBRDF.x ) + _specularColor.rgb * specularSumAdjust.rgb * vec3( lightBRDF.y ));\n" +
        "                        //Context.OutColor.rgb = vec3(spotFallOff);\n" +
        "                    }\n" +
        "                }\n" +
        "                else{\n" +
        "                    // point和spot\n" +
        "                    vec4 lightColor = Context.WLight_Data_0;\n" +
        "                    vec4 lightData1 = Context.WLight_Data_1;\n" +
        "                    ComputeLightDir(wPosition, lightColor.w, lightData1, lightDir, lightVec);\n" +
        "                    //lightBRDF.x = max( 0.0f, dot( normal, lightDir.xyz ) );\n" +
        "\n" +
        "                    // BlinnPhongLighting\n" +
        "                    //vec3 h = normalize( viewDir + lightDir.xzy );\n" +
        "                    //lightBRDF.y = pow( max( 0.0f, dot( normal, h ) ), 32.0f );\n" +
        "                    // 标准PhongLighting\n" +
        "                    //vec3 refDir = reflect( lightData1.xyz, normal );\n" +
        "                    //lightBRDF.y = pow( max( 0.0f, dot( viewDir, refDir ) ), 32.0f);\n" +
        "\n" +
        "                    // 计算SpotLight的衰减\n" +
        "                    float spotFallOff = 1.0;\n" +
        "                    if( lightColor.w > 1.0f )\n" +
        "                    {\n" +
        "                        // 计算SpotLight的范围衰减\n" +
        "                        spotFallOff = ComputeSpotFalloff( Context.WLight_Data_2, lightDir.xyz );\n" +
        "                    }\n" +
        "\n" +
        "                    // 如果存在法线纹理,则进一步计算lightDir\n" +
        "\n" +
        "                    // 计算反射率\n" +
        "                    ComputeLighting(normal, viewDir, lightDir.xyz, lightDir.w * spotFallOff, _shininess, lightBRDF);\n" +
        "\n" +
        "                    // 最终光照值\n" +
        "                    //Context.OutColor.rgb += lightColor.rgb * (vec3(lightBRDF.x) * _diffuseColor.rgb * diffuseSumAdjust.rgb + vec3(lightBRDF.y) * _specularColor.rgb * specularSumAdjust.rgb);\n" +
        "                    Context.OutColor.rgb += lightColor.rgb * ( _diffuseColor.rgb * diffuseSumAdjust.rgb * vec3( lightBRDF.x ) + _specularColor.rgb * specularSumAdjust.rgb * vec3( lightBRDF.y ));\n" +
        "                }\n" +
        "                Context.OutColor.a = diffuseSumAdjust.a * _diffuseColor.a;\n" +
        "\n" +
        "                // 唯一shading阶段,在这里处理自发光或只shading一次的逻辑\n" +
        "                if(Context.UniqueShading){\n" +
        "                    #ifdef Params.emissive\n" +
        "                        float _emissivePower = 3.0f;\n" +
        "                        #ifdef Params.emissivePower\n" +
        "                            _emissivePower = Params.emissivePower;\n" +
        "                        #endif\n" +
        "                        float _emissiveIntensity = 2.0f;\n" +
        "                        #ifdef Params.emissiveIntensity\n" +
        "                            _emissiveIntensity = Params.emissiveIntensity;\n" +
        "                        #endif\n" +
        "                        #ifdef Params.emissiveMap\n" +
        "                            vec4 eMap = texture(Params.emissiveMap, wUv0);\n" +
        "                            Context.OutColor.rgb += Params.emissive.rgb * eMap.rgb * pow(Params.emissive.a * eMap.a, _emissivePower) * _emissiveIntensity;\n" +
        "                        #else\n" +
        "                            Context.OutColor.rgb += Params.emissive.rgb * pow(Params.emissive.a, _emissivePower) * _emissiveIntensity;\n" +
        "                        #endif\n" +
        "                    #else\n" +
        "                        #ifdef Params.emissiveMap\n" +
        "                            float _emissivePower = 3.0f;\n" +
        "                            #ifdef Params.emissivePower\n" +
        "                                _emissivePower = Params.emissivePower;\n" +
        "                            #endif\n" +
        "                            float _emissiveIntensity = 2.0f;\n" +
        "                            #ifdef Params.emissiveIntensity\n" +
        "                                _emisiveIntensity = Params.emissiveIntensity;\n" +
        "                            #endif\n" +
        "                            vec4 eMap = texture(Params.emissiveMap, wUv0);\n" +
        "                            Context.OutColor.rgb += eMap.rgb * pow(eMap.a, _emissivePower) * _emissiveIntensity;\n" +
        "                        #endif\n" +
        "                    #endif\n" +
        "                }\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "\n" +
        "    SubTechnology SingleBlinnPhongLighting{\n" +
        "        Vars{\n" +
        "            vec3 wNormal;\n" +
        "            vec4 wTangent;\n" +
        "            vec3 wPosition;\n" +
        "            vec2 wUv0;\n" +
        "            vec2 wUv1;\n" +
        "            // 三种成分用于调和光照,可来自材质颜色的定义,也可以来自vertex_light\n" +
        "            vec3 ambientSumAdjust;\n" +
        "            vec4 diffuseSumAdjust;\n" +
        "            vec3 specularSumAdjust;\n" +
        "        }\n" +
        "        Advanced{\n" +
        "            RenderProgram SinglePassLighting;\n" +
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
        "\n" +
        "\n" +
        "                wPosition = (Context.ModelMatrix * vec4(Context.InPosition, 1.0f)).xyz;\n" +
        "                mat3 nMat = mat3(transpose(inverse(Context.ModelMatrix)));\n" +
        "                vec3 norm = normalize(nMat * Context.InNormal);\n" +
        "                wTangent = vec4(normalize(nMat * Context.InTangent.xyz), Context.InTangent.w);\n" +
        "                //t = normalize(t - dot(t, norm) * norm);\n" +
        "                //vec3 b = cross(norm, t);\n" +
        "                //tbnMat = mat3(t, b, norm);\n" +
        "                wNormal = norm;\n" +
        "                wUv0 = Context.InUv0;\n" +
        "\n" +
        "                // lightMap/AO/OCC\n" +
        "                #ifdef Params.lightMapTexCoord\n" +
        "                    wUv1 = Context.InUv1;\n" +
        "                #endif\n" +
        "\n" +
        "\n" +
        "                // 如果是顶点光照,则在这里将光源变化到切线空间\n" +
        "                ambientSumAdjust = Params.ambientColor.rgb * Context.AmbientLightColor;\n" +
        "                diffuseSumAdjust = vec4(1.0f);\n" +
        "                specularSumAdjust = vec3(1.0f);\n" +
        "                Context.OutPosition = Context.ProjectViewMatrix * pos;\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            // 计算光照方向\n" +
        "            // 对于DirLight,PointLight以及SpotLight,lightType依次为0.0,1.0,2.0\n" +
        "            // 输出光照方向\n" +
        "            // lightDir.w存储衰减率(对于DirLight,衰减值一直为1,对于Point或Spot,衰减值随着半径而变小,衰减值越小,表示衰减度越大)\n" +
        "            void ComputeLightDir(in vec3 worldPos, in float lightType, in vec4 position, out vec4 lightDir, out vec3 lightVec){\n" +
        "                // 只有lightType = 0.0时,posLight为0.0,否则posLight为1.0\n" +
        "                float posLight = step(0.5f, lightType);\n" +
        "\n" +
        "                // 计算光照位置\n" +
        "                // 对于DirLight,lightVec = position.xyz * sign(-0.5f) = position.xyz * -1.0f;其中position代表DirLight的方向\n" +
        "                // 对于PointLight和SpotLight,lightVec = position.xyz * sign(1.0f - 0.5f) - (worldPos * 1.0f) = positions.xyz * 1.0f - worldPos;其中position代表Light的位置\n" +
        "                lightVec = position.xyz * sign(posLight - 0.5f) - (worldPos * posLight);\n" +
        "                float dist = length(lightVec);\n" +
        "\n" +
        "                // 对于DirLight,lightDir.w = 1.0f\n" +
        "                //lightDir.w = clamp(1.0f - position.w * dist * posLight, 0.0f, 1.0f);\n" +
        "\n" +
        "                lightDir.w = (1.0f - position.w * dist) / (1.0f + position.w * dist * dist);\n" +
        "                lightDir.w = clamp(lightDir.w, 1.0f - posLight, 1.0f);\n" +
        "\n" +
        "                // 归一化\n" +
        "                lightDir.xyz = lightVec / vec3(dist);\n" +
        "            }\n" +
        "            // 基于BlinnPhong光照模型计算光照因子\n" +
        "            // brdf.x保存漫反射部分;brdf.y保存镜面反射部分\n" +
        "            void ComputeLighting(in vec3 normal, in vec3 viewDir, in vec3 lightDir, in float attenuation, in float shininess, out vec2 brdf){\n" +
        "                // diffuse部分\n" +
        "                float diffuseBRDF = max(0.0f, dot(normal, lightDir));\n" +
        "                // specular部分\n" +
        "                // 半角向量代替viewDir参与光照计算\n" +
        "                vec3 H = normalize(viewDir + lightDir);\n" +
        "                float HdotN = max(0.0f, dot(H, normal));\n" +
        "                float specularBRDF = pow( HdotN, shininess );\n" +
        "\n" +
        "                // 衰减,对于PointLight和SpotLight来说有效,对于DirLight而言,attenuation一直为1\n" +
        "                brdf.x = diffuseBRDF * attenuation;\n" +
        "                brdf.y = specularBRDF * attenuation;\n" +
        "            }\n" +
        "            // 返回Spot范围衰减\n" +
        "            float ComputeSpotFalloff(in vec4 spotDirection, in vec3 lightDir){\n" +
        "                float curAngleCos = dot(lightDir, -spotDirection.xyz);\n" +
        "                float innerAngleCos = floor(spotDirection.w) * 0.001f;\n" +
        "                float outerAngleCos = fract(spotDirection.w);\n" +
        "                float innerMinusOuter = innerAngleCos - outerAngleCos;\n" +
        "                float falloff = clamp((curAngleCos - outerAngleCos) / innerMinusOuter, 0.0f, 1.0f);\n" +
        "                //if(curAngleCos > innerMinusOuter)\n" +
        "                //    falloff = 1.0f;\n" +
        "                //else\n" +
        "                //    falloff = 0.0f;\n" +
        "\n" +
        "                #ifdef SRGB\n" +
        "                    // Use quadratic falloff (notice the ^4)\n" +
        "                    return pow(clamp((curAngleCos - outerAngleCos) / innerMinusOuter, 0.0, 1.0), 4.0);\n" +
        "                #else\n" +
        "                    // Use linear falloff\n" +
        "                    return falloff;\n" +
        "                #endif\n" +
        "            }\n" +
        "            void main(){\n" +
        "                // 计算光照\n" +
        "                vec4 lightColor;\n" +
        "                vec4 lightData1;\n" +
        "                vec4 lightDir = vec4(0.0f);\n" +
        "                vec3 lightVec = vec3(0.0f);\n" +
        "                vec2 lightBRDF = vec2(0.0f);\n" +
        "                vec3 viewDir = normalize(Context.CameraPosition.xyz - wPosition.xyz);\n" +
        "\n" +
        "                vec4 _diffuseColor = vec4(1.0f);\n" +
        "                vec4 _specularColor = vec4(1.0f);\n" +
        "\n" +
        "                #ifdef Params.diffuseColor\n" +
        "                    _diffuseColor = Params.diffuseColor;\n" +
        "                #endif\n" +
        "                #ifdef Params.diffuseMap\n" +
        "                    _diffuseColor = _diffuseColor * texture(Params.diffuseMap, wUv0);\n" +
        "                    #ifdef Params.alphaDiscard\n" +
        "                        // discard性能比较差,建议还是使用半透明渲染比较合适s\n" +
        "                        if(_diffuseColor.a < Params.alphaDiscard){\n" +
        "                            discard;\n" +
        "                        }\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Params.specularColor\n" +
        "                    _specularColor = Params.specularColor;\n" +
        "                #endif\n" +
        "                #ifdef Params.specularMap\n" +
        "                    _specularColor = _specularColor * texture(Params.specularMap, wUv0);\n" +
        "                #endif\n" +
        "\n" +
        "                vec3 normal = normalize( wNormal );\n" +
        "                #ifdef Params.normalMap\n" +
        "                    vec3 normalHeight = texture(Params.normalMap, wUv0).xyz;\n" +
        "                    vec3 tangent = normalize(wTangent.xyz);\n" +
        "                    mat3 tbnMat = mat3(tangent, wTangent.w * cross(normal, tangent), normal);\n" +
        "                    normal = normalize(tbnMat * ( normalHeight * 2.0f - 1.0f ));\n" +
        "                #endif\n" +
        "\n" +
        "                float _shininess = 32.0;\n" +
        "                #ifdef Params.shininess\n" +
        "                    _shininess = Params.shininess;\n" +
        "                #endif\n" +
        "\n" +
        "                // lightMap/AO/OCC\n" +
        "                #ifdef Params.lightMap\n" +
        "                    #ifdef Params.lightMapTexCoord\n" +
        "                        vec3 lightMapColor = texture(Params.lightMap, wUv1).rgb;\n" +
        "                    #else\n" +
        "                        vec3 lightMapColor = texture(Params.lightMap, wUv0).rgb;\n" +
        "                    #endif\n" +
        "                    _specularColor.rgb *= lightMapColor;\n" +
        "                    _diffuseColor.rgb  *= lightMapColor;\n" +
        "                #endif\n" +
        "\n" +
        "\n" +
        "                Context.OutColor.rgb = _diffuseColor.rgb * ambientSumAdjust;\n" +
        "                for( int i = 0;i < Context.CurLightCount;i+=3 ){\n" +
        "                    // 后期改为Context.GetLightDir(Context.LightData[i]);\n" +
        "                    lightColor = Context.WLightData[i];\n" +
        "                    lightData1 = Context.WLightData[i + 1];\n" +
        "                    ComputeLightDir(wPosition, lightColor.w, lightData1, lightDir, lightVec);\n" +
        "                    //lightBRDF.x = max( 0.0f, dot( normal, lightDir.xyz ) );\n" +
        "\n" +
        "                    // BlinnPhongLighting\n" +
        "                    //vec3 h = normalize( viewDir + lightDir.xzy );\n" +
        "                    //lightBRDF.y = pow( max( 0.0f, dot( normal, h ) ), 32.0f );\n" +
        "                    // 标准PhongLighting\n" +
        "                    //vec3 refDir = reflect( lightData1.xyz, normal );\n" +
        "                    //lightBRDF.y = pow( max( 0.0f, dot( viewDir, refDir ) ), 32.0f);\n" +
        "\n" +
        "                    // 计算SpotLight的衰减\n" +
        "                    float spotFallOff = 1.0;\n" +
        "                    if( lightColor.w > 1.0f )\n" +
        "                    {\n" +
        "                        // 计算SpotLight的范围衰减\n" +
        "                        spotFallOff = ComputeSpotFalloff( Context.WLightData[i + 2], lightDir.xyz );\n" +
        "                    }\n" +
        "\n" +
        "                    // 如果存在法线纹理,则进一步计算lightDir\n" +
        "\n" +
        "                    // 计算反射率\n" +
        "                    ComputeLighting(normal, viewDir, lightDir.xyz, lightDir.w * spotFallOff, _shininess, lightBRDF);\n" +
        "\n" +
        "                    // 最终光照值\n" +
        "                    //Context.OutColor.rgb += lightColor.rgb * (vec3(lightBRDF.x) * _diffuseColor.rgb * diffuseSumAdjust.rgb + vec3(lightBRDF.y) * _specularColor.rgb * specularSumAdjust.rgb);\n" +
        "                    Context.OutColor.rgb += lightColor.rgb * ( _diffuseColor.rgb * diffuseSumAdjust.rgb * vec3( lightBRDF.x ) + _specularColor.rgb * specularSumAdjust.rgb * vec3( lightBRDF.y ));\n" +
        "                    //Context.OutColor.rgb = vec3(spotFallOff);\n" +
        "                }\n" +
        "                Context.OutColor.a = diffuseSumAdjust.a * _diffuseColor.a;\n" +
        "\n" +
        "                // 唯一shading阶段,在这里处理自发光或只shading一次的逻辑\n" +
        "                if(Context.UniqueShading){\n" +
        "                    #ifdef Params.emissive\n" +
        "                        float _emissivePower = 3.0f;\n" +
        "                        #ifdef Params.emissivePower\n" +
        "                            _emissivePower = Params.emissivePower;\n" +
        "                        #endif\n" +
        "                        float _emissiveIntensity = 2.0f;\n" +
        "                        #ifdef Params.emissiveIntensity\n" +
        "                            _emissiveIntensity = Params.emissiveIntensity;\n" +
        "                        #endif\n" +
        "                        #ifdef Params.emissiveMap\n" +
        "                            vec4 eMap = texture(Params.emissiveMap, wUv0);\n" +
        "                            Context.OutColor.rgb += Params.emissive.rgb * eMap.rgb * pow(Params.emissive.a * eMap.a, _emissivePower) * _emissiveIntensity;\n" +
        "                        #else\n" +
        "                            Context.OutColor.rgb += Params.emissive.rgb * pow(Params.emissive.a, _emissivePower) * _emissiveIntensity;\n" +
        "                        #endif\n" +
        "                    #else\n" +
        "                        #ifdef Params.emissiveMap\n" +
        "                            float _emissivePower = 3.0f;\n" +
        "                            #ifdef Params.emissivePower\n" +
        "                                _emissivePower = Params.emissivePower;\n" +
        "                            #endif\n" +
        "                            float _emissiveIntensity = 2.0f;\n" +
        "                            #ifdef Params.emissiveIntensity\n" +
        "                                _emisiveIntensity = Params.emissiveIntensity;\n" +
        "                            #endif\n" +
        "                            vec4 eMap = texture(Params.emissiveMap, wUv0);\n" +
        "                            Context.OutColor.rgb += eMap.rgb * pow(eMap.a, _emissivePower) * _emissiveIntensity;\n" +
        "                        #endif\n" +
        "                    #endif\n" +
        "                }\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "\n" +
        "    SubTechnology ColorSubTechnology{\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutPosition = Context.ProjectViewMatrix * Context.ModelMatrix * vec4(Context.InPosition, 1.0f);\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutColor = vec4(1.0f, 0.0f, 0.0f, 1.0f);\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    // 默认为SinglePass\n" +
        "    Technology {\n" +
        "        Sub_Pass Forward{\n" +
        "            Pass SingleBlinnPhongLighting{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology MultiPass{\n" +
        "        Sub_Pass Forward{\n" +
        "            Pass MultiPassBlinnPhongLighting{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology Color{\n" +
        "        Sub_Pass Forward{\n" +
        "            Pass ColorSubTechnology{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
    static S_PRINCIPLED_DEFERRED_LIGHTING_DEF_DATA = "// 默认的延迟光照材质定义,实现PBR材质\n" +
        "Def DeferredLightingDef{\n" +
        "    Params{\n" +
        "        // 基础参数\n" +
        "        vec4 baseColor;\n" +
        "        sampler2D baseColorMap;\n" +
        "        sampler2D normalMap;\n" +
        "\n" +
        "        // lightMap或AO\n" +
        "        sampler2D lightMap;\n" +
        "        bool aoMap;\n" +
        "        bool lightMapTexCoord;\n" +
        "\n" +
        "        // 自发光\n" +
        "        vec4 emissive;\n" +
        "        float emissivePower;\n" +
        "        float emissiveIntensity;\n" +
        "\n" +
        "        // metallic管线\n" +
        "        float metallic;\n" +
        "        float roughness;\n" +
        "        sampler2D metallicRoughnessMap;\n" +
        "        sampler2D metallicMap;\n" +
        "        sampler2D roughnessMap;\n" +
        "\n" +
        "        // specular管线\n" +
        "        bool useSpecGloss;\n" +
        "        sampler2D specularGlossinessMap;\n" +
        "        sampler2D specularMap;\n" +
        "        sampler2D glossinessMap;\n" +
        "        vec4 specular;\n" +
        "        float glossiness;\n" +
        "\n" +
        "        // alphaDiscard\n" +
        "        float alphaDiscard;\n" +
        "    }\n" +
        "    SubTechnology GBufferPass{\n" +
        "        Vars{\n" +
        "            vec3 wNormal;\n" +
        "            vec4 wTangent;\n" +
        "            vec3 wPosition;\n" +
        "            vec2 wUv0;\n" +
        "            vec2 wUv1;\n" +
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
        "\n" +
        "\n" +
        "                wPosition = (Context.ModelMatrix * vec4(Context.InPosition, 1.0f)).xyz;\n" +
        "                mat3 nMat = mat3(transpose(inverse(Context.ModelMatrix)));\n" +
        "                vec3 norm = normalize(nMat * Context.InNormal);\n" +
        "                //vec3 t = normalize(nMat * Context.InTangent);\n" +
        "                wTangent = vec4(normalize(nMat * Context.InTangent.xyz), Context.InTangent.w);\n" +
        "                //t = normalize(t - dot(t, norm) * norm);\n" +
        "                //vec3 b = cross(norm, t);\n" +
        "                //tbnMat = mat3(t, b, norm);\n" +
        "                wNormal = norm;\n" +
        "                wUv0 = Context.InUv0;\n" +
        "                #ifdef Params.lightMapTexCoord\n" +
        "                    wUv1 = Context.InUv1;\n" +
        "                #endif\n" +
        "\n" +
        "\n" +
        "                Context.OutPosition = Context.ProjectViewMatrix * pos;\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            #define GAMMA 2.2f\n" +
        "            void main(){\n" +
        "\n" +
        "                #ifdef Params.baseColor\n" +
        "                    #ifdef Params.baseColorMap\n" +
        "                        vec4 albedo = texture(Params.baseColorMap, wUv0) * Params.baseColor;\n" +
        "                    #else\n" +
        "                        vec4 albedo = Params.baseColor;\n" +
        "                    #endif\n" +
        "                #else\n" +
        "                    #ifdef Params.baseColorMap\n" +
        "                        vec4 albedo = texture(Params.baseColorMap, wUv0);\n" +
        "                    #else\n" +
        "                        vec4 albedo = vec4(1.0f);\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Params.alphaDiscard\n" +
        "                    if(albedo.a < Params.alphaDiscard){\n" +
        "                        discard;\n" +
        "                    }\n" +
        "                #endif\n" +
        "\n" +
        "                vec3 normal = wNormal;\n" +
        "                #ifdef Params.normalMap\n" +
        "                    // 这里做了一种简化,理论上应该在fs阶段计算tbn,但是从插值的角度来看,可以简化为tbn插值,减少在fs阶段计算tbn开销(虽然这么做不精确,但是折中下可以接受)\n" +
        "                    vec3 normalHeight = texture(Params.normalMap, wUv0).xyz;\n" +
        "                    vec3 tangent = normalize(wTangent.xyz);\n" +
        "                    mat3 tbnMat = mat3(tangent, wTangent.w * cross(normal, tangent), normal);\n" +
        "                    normal = normalize(tbnMat * ( normalHeight * 2.0f - 1.0f ));\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Params.metallicRoughnessMap\n" +
        "                    vec2 rm = texture(Params.metallicRoughnessMap, wUv0).gb;\n" +
        "                    #ifdef Params.roughness\n" +
        "                        float _roughness = rm.x * max(Params.roughness, 1e-4);\n" +
        "                    #else\n" +
        "                        float _roughness = rm.x;\n" +
        "                    #endif\n" +
        "                    #ifdef Params.metallic\n" +
        "                        float _metallic = rm.y * max(Params.metallic, 0.0f);\n" +
        "                    #else\n" +
        "                        float _metallic = rm.y;\n" +
        "                    #endif\n" +
        "                #else\n" +
        "                    #ifdef Params.roughnessMap\n" +
        "                        #ifdef Params.roughness\n" +
        "                            float _roughness = texture(Params.roughnessMap, wUv0).r * max(Params.roughness, 1e-4);\n" +
        "                        #else\n" +
        "                            float _roughness = texture(Params.roughnessMap, wUv0).r;\n" +
        "                        #endif\n" +
        "                    #else\n" +
        "                        #ifdef Params.roughness\n" +
        "                            float _roughness = max(Params.roughness, 1e-4);\n" +
        "                        #else\n" +
        "                            float _roughness = 1.0f;\n" +
        "                        #endif\n" +
        "                    #endif\n" +
        "                    #ifdef Params.metallicMap\n" +
        "                        #ifdef Params.metallic\n" +
        "                            float _metallic = texture(Params.metallicMap, wUv0).r * max(Params.metallic, 0.0f);\n" +
        "                        #else\n" +
        "                            float _metallic = texture(Params.metallicMap, wUv0).r;\n" +
        "                        #endif\n" +
        "                    #else\n" +
        "                        #ifdef Params.metallic\n" +
        "                            float _metallic = max(Params.metallic, 0.0f);\n" +
        "                        #else\n" +
        "                            float _metallic = 1.0f;\n" +
        "                        #endif\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Params.useSpecGloss\n" +
        "                    #ifdef Params.specularGlossinessMap\n" +
        "                        vec4 _specularColor = texture(Params.specularGlossinessMap, wUv0);\n" +
        "                        #ifdef Params.glossiness\n" +
        "                            float _glossiness = _specularColor.a * Params.glossiness;\n" +
        "                        #else\n" +
        "                            float _glossiness = _specularColor.a;\n" +
        "                        #endif\n" +
        "                        #ifdef Params.specular\n" +
        "                            _specularColor *= Params.specular;\n" +
        "                        #endif\n" +
        "                    #else\n" +
        "                        #ifdef Params.specularMap\n" +
        "                            vec4 _specularColor = texture(Params.specularMap, wUv0);\n" +
        "                        #else\n" +
        "                            vec4 _specularColor = vec4(1.0f);\n" +
        "                        #endif\n" +
        "                        #ifdef Params.specular\n" +
        "                            _specularColor *= Params.specular;\n" +
        "                        #endif\n" +
        "                        #ifdef Params.glossinessMap\n" +
        "                            #ifdef Params.glossiness\n" +
        "                                float _glossiness = texture(Params.glossinessMap, wUv0).r * Params.glossiness;\n" +
        "                            #else\n" +
        "                                float _glossiness = texture(Params.glossinessMap, wUv0).r;\n" +
        "                            #endif\n" +
        "                        #else\n" +
        "                            #ifdef Params.glossiness\n" +
        "                                float _glossiness = Params.glossiness;\n" +
        "                            #else\n" +
        "                                float _glossiness = 1.0f;\n" +
        "                            #endif\n" +
        "                        #endif\n" +
        "                    #endif\n" +
        "                    vec4 _diffuseColor = albedo;\n" +
        "                    _roughness = 1.0f - _glossiness;\n" +
        "                    vec3 fZero = _specularColor.rgb;\n" +
        "                #else\n" +
        "                    float nonMetalSpec = 0.04f;\n" +
        "                    vec4 _specularColor = (nonMetalSpec - nonMetalSpec * _metallic) + albedo * _metallic;\n" +
        "                    vec4 _diffuseColor = albedo - albedo * _metallic;\n" +
        "                    vec3 fZero = vec3( 0.5f );\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Params.lightMap\n" +
        "                    vec3 _lightMapColor;\n" +
        "                    #ifdef Params.lightMapTexCoord\n" +
        "                        _lightMapColor = texture(Params.lightMap, wUv1).rgb;\n" +
        "                    #else\n" +
        "                        _lightMapColor = texture(Params.lightMap, wUv0).rgb;\n" +
        "                    #endif\n" +
        "                    #ifdef Params.aoMap\n" +
        "                        _lightMapColor.gb = _lightMapColor.rr;\n" +
        "                        vec3 ao = _lightMapColor;\n" +
        "                    #else\n" +
        "                        _specularColor.rgb *= _lightMapColor;\n" +
        "                        _diffuseColor.rgb  *= _lightMapColor;\n" +
        "                        vec3 ao = vec3(1.0f);\n" +
        "                    #endif\n" +
        "                #else\n" +
        "                    vec3 ao = vec3(1.0f);\n" +
        "                #endif\n" +
        "\n" +
        "\n" +
        "\n" +
        "\n" +
        "                Context.OutGBuffer0.xyz = floor(_diffuseColor.rgb * 100.0f) + ao * 0.1f;\n" +
        "                Context.OutGBuffer0.w   = albedo.a;\n" +
        "                Context.OutGBuffer1.xyz = floor(normal.xyz * 1000.0f) + wNormal * 0.001f;\n" +
        "                Context.OutGBuffer2.rgb = floor(_specularColor.rgb * 100.0f) + fZero * 0.1f;\n" +
        "                Context.OutGBuffer2.a = floor(_roughness * 100.0f) + _metallic * 0.1f;\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    SubTechnology DeferredShadingPass{\n" +
        "        Vars{\n" +
        "            vec4 wordPosition;\n" +
        "            vec2 uv0;\n" +
        "            mat4 pvInverse;\n" +
        "        }\n" +
        "        Advanced{\n" +
        "            RenderProgram SinglePassIBLLighting;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutPosition = vec4(Context.InPosition, 1.0f);\n" +
        "                wordPosition = Context.OutPosition;\n" +
        "                uv0 = Context.InUv0;\n" +
        "                pvInverse = inverse(Context.ProjectViewMatrix);\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            vec3 getPosition(in float depth, in vec2 newTexCoord){\n" +
        "\n" +
        "                vec4 pos;\n" +
        "                pos.xy = (newTexCoord * vec2(2.0)) - vec2(1.0);\n" +
        "                pos.z  = depth * 2.0 - 1.0;\n" +
        "                pos.w  = 1.0;\n" +
        "                pos    = pvInverse * pos;\n" +
        "                pos.xyz /= pos.w;\n" +
        "                return pos.xyz;\n" +
        "            }\n" +
        "            // 计算光照方向\n" +
        "            // 对于DirLight,PointLight以及SpotLight,lightType依次为0.0,1.0,2.0\n" +
        "            // 输出光照方向\n" +
        "            // lightDir.w存储衰减率(对于DirLight,衰减值一直为1,对于Point或Spot,衰减值随着半径而变小,衰减值越小,表示衰减度越大)\n" +
        "            void ComputeLightDir(in vec3 worldPos, in float lightType, in vec4 position, out vec4 lightDir, out vec3 lightVec){\n" +
        "                // 只有lightType = 0.0时,posLight为0.0,否则posLight为1.0\n" +
        "                float posLight = step(0.5f, lightType);\n" +
        "\n" +
        "                // 计算光照位置\n" +
        "                // 对于DirLight,lightVec = position.xyz * sign(-0.5f) = position.xyz * -1.0f;其中position代表DirLight的方向\n" +
        "                // 对于PointLight和SpotLight,lightVec = position.xyz * sign(1.0f - 0.5f) - (worldPos * 1.0f) = positions.xyz * 1.0f - worldPos;其中position代表Light的位置\n" +
        "                lightVec = position.xyz * sign(posLight - 0.5f) - (worldPos * posLight);\n" +
        "                float dist = length(lightVec);\n" +
        "\n" +
        "                #ifndef Context.Srgb\n" +
        "                    lightDir.w = (1.0f - position.w * dist) / (1.0f + position.w * dist * dist);\n" +
        "                    lightDir.w = clamp(lightDir.w, 1.0f - posLight, 1.0f);\n" +
        "                #else\n" +
        "                    // 对于DirLight,lightDir.w = 1.0f\n" +
        "                    lightDir.w = clamp(1.0f - position.w * dist * posLight, 0.0f, 1.0f);\n" +
        "                #endif\n" +
        "\n" +
        "                // 归一化\n" +
        "                lightDir.xyz = lightVec / vec3(dist);\n" +
        "            }\n" +
        "            #define PI 3.14159265358979323846264\n" +
        "            // 镜面反射菲涅尔计算\n" +
        "            vec3 F_Shlick(float vh,\tvec3 F0){\n" +
        "                float fresnelFact = pow(2.0f, (-5.55473f * vh - 6.98316f) * vh);\n" +
        "                return mix(F0, vec3(1.0f, 1.0f, 1.0f), fresnelFact);\n" +
        "            }\n" +
        "            vec3 F_Schlick2(float cosTheta, vec3 F0)\n" +
        "            {\n" +
        "                return F0 + (1.0f - F0) * pow(1.0f - cosTheta, 5.0f);\n" +
        "            }\n" +
        "            // 计算直接光照\n" +
        "            void ComputeDirectLighting(in vec3 normal, in vec3 viewDir, in vec3 lightDir, in vec3 lightColor, in vec3 diffuseColor, in vec3 fZero, in float roughness, in float ndotv, out vec3 directLighting){\n" +
        "                vec3 h = normalize(lightDir + viewDir);\n" +
        "                float ndotl = max( dot( normal, lightDir ), 0.0f );\n" +
        "                float ndoth = max( dot( normal, h), 0.0f );\n" +
        "                float hdotv = max( dot( h, viewDir ), 0.0f );\n" +
        "\n" +
        "                // 这里,不使用c/Π计算diffuse fr(x, wi, wo)\n" +
        "                // 而假设恒定\n" +
        "                vec3 diffuse = vec3( ndotl ) * lightColor * diffuseColor;\n" +
        "\n" +
        "                // cook-torrence,BRDF : http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf\n" +
        "                float alpha = roughness * roughness;\n" +
        "\n" +
        "                // D, GGX 法线分布函数\n" +
        "                float alpha2 = alpha * alpha;\n" +
        "                float sum = (( ndoth * ndoth ) * ( alpha2 - 1.0f ) + 1.0f);\n" +
        "                float denom = PI * sum * sum;\n" +
        "                float D = alpha2 / denom;\n" +
        "\n" +
        "                // F, 菲涅尔项\n" +
        "                vec3 F = F_Shlick( hdotv, fZero );\n" +
        "\n" +
        "                // G, 几何遮挡项\n" +
        "                float k = alpha * 0.5f;\n" +
        "                float G_V = ndotv + sqrt( ( ndotv - ndotv * k ) * ndotv + k );\n" +
        "                float G_L = ndotl + sqrt( ( ndotl - ndotl * k ) * ndotl + k );\n" +
        "                float G = 1.0f / max( G_V * G_L ,0.01f );\n" +
        "\n" +
        "                // specularBRDF\n" +
        "                float t = D * G * ndotl;\n" +
        "                vec3 specular =  vec3( t ) * F * lightColor;\n" +
        "\n" +
        "                directLighting = diffuse + specular;\n" +
        "            }\n" +
        "            // 返回Spot范围衰减\n" +
        "            float ComputeSpotFalloff(in vec4 spotDirection, in vec3 lightDir){\n" +
        "                float curAngleCos = dot(lightDir, -spotDirection.xyz);\n" +
        "                float innerAngleCos = floor(spotDirection.w) * 0.001f;\n" +
        "                float outerAngleCos = fract(spotDirection.w);\n" +
        "                float innerMinusOuter = innerAngleCos - outerAngleCos;\n" +
        "\n" +
        "                #ifndef Context.Srgb\n" +
        "                    // 使用二次衰减（请注意^ 4）\n" +
        "                    return pow(clamp((curAngleCos - outerAngleCos) / innerMinusOuter, 0.0f, 1.0f), 4.0f);\n" +
        "                #else\n" +
        "                    // 线性空间衰减\n" +
        "                    return clamp((curAngleCos - outerAngleCos) / innerMinusOuter, step(spotDirection.w, 0.001f), 1.0f);\n" +
        "                #endif\n" +
        "            }\n" +
        "            // 球谐函数\n" +
        "            vec3 sphericalHarmonics( const in vec3 normal, const vec3 sph[9] ){\n" +
        "                float x = normal.x;\n" +
        "                float y = normal.y;\n" +
        "                float z = normal.z;\n" +
        "\n" +
        "                vec3 result = (\n" +
        "                    sph[0] +\n" +
        "\n" +
        "                    sph[1] * y +\n" +
        "                    sph[2] * z +\n" +
        "                    sph[3] * x +\n" +
        "\n" +
        "                    sph[4] * y * x +\n" +
        "                    sph[5] * y * z +\n" +
        "                    sph[6] * (3.0f * z * z - 1.0f) +\n" +
        "                    sph[7] * (z * x) +\n" +
        "                    sph[8] * (x*x - y*y)\n" +
        "                );\n" +
        "\n" +
        "                return max(result, vec3(0.0f));\n" +
        "            }\n" +
        "            // 镜面反射趋势朝向\n" +
        "            vec3 getSpecularDominantDir(const in vec3 N, const in vec3 R, const in float realRoughness){\n" +
        "\n" +
        "                float smoothness = 1.0f - realRoughness;\n" +
        "                float lerpFactor = smoothness * (sqrt(smoothness) + realRoughness);\n" +
        "                // 当我们在立方体贴图中获取时，结果未规范化\n" +
        "                vec3 dominant = mix(N, R, lerpFactor);\n" +
        "\n" +
        "                return dominant;\n" +
        "            }\n" +
        "            // 拟合方程\n" +
        "            // 关于镜面部分，有很多优化地方，除了常见的优化，还有很多可以替代方案，几乎可以在保证画质的前提下，在移动端35帧率提升到60帧率，详细可参考我的笔记:https://www.cnblogs.com/JhonKkk/p/14313882.html\n" +
        "            vec3 integrateBRDFApprox( const in vec3 specular, in float roughness, in float NoV ){\n" +
        "                const vec4 c0 = vec4( -1.0f, -0.0275f, -0.572f, 0.022f );\n" +
        "                const vec4 c1 = vec4( 1.0f, 0.0425f, 1.04f, -0.04f );\n" +
        "                vec4 r = roughness * c0 + c1;\n" +
        "                float a004 = min( r.x * r.x, exp2( -9.28f * NoV ) ) * r.x + r.y;\n" +
        "                vec2 ab = vec2( -1.04f, 1.04f ) * a004 + r.zw;\n" +
        "                return specular * ab.x + ab.y;\n" +
        "            }\n" +
        "            // 近似镜面IBL多项式\n" +
        "            vec3 approximateSpecularIBLPolynomial(in samplerCube envMap, in vec3 specularColor , in float roughness, in float ndotv, in vec3 refVec, in float mipMaps){\n" +
        "                float lod = sqrt( roughness ) * (mipMaps - 1.0f);\n" +
        "                vec3 prefilteredColor = textureLod(envMap, refVec.xyz, lod).rgb;\n" +
        "                return prefilteredColor * integrateBRDFApprox(specularColor, roughness, ndotv);\n" +
        "            }\n" +
        "            #define GAMMA 2.2f\n" +
        "            #define GAMMA_T 1.0f / GAMMA\n" +
        "            void main(){\n" +
        "                float depth = texture(Context.InGDepth, uv0).r;\n" +
        "                if(depth >= 1.0){\n" +
        "                    Context.OutColor = vec4(0.0f, 0.0f, 0.0f, 1.0f);\n" +
        "                    return;\n" +
        "                }\n" +
        "                vec3 wPosition = getPosition(depth, uv0);\n" +
        "                vec4 buff0 = texture(Context.InGBuffer0, uv0);\n" +
        "                vec4 buff2 = texture(Context.InGBuffer2, uv0);\n" +
        "                vec3 _diffuseColor = floor(buff0.rgb) * 0.01f * Context.AmbientLightColor;\n" +
        "                vec3 _specularColor = floor(buff2.rgb) * 0.01f;\n" +
        "                vec3 ao = min(fract(buff0.rgb) * 10.0f, vec3(1.0f));\n" +
        "                vec3 fZero = min(fract(buff2.rgb) * 10.0f, vec3(0.5f));\n" +
        "                float _roughness = floor(buff2.w) * 0.01f;\n" +
        "                vec3 n = texture(Context.InGBuffer1, uv0).xyz;\n" +
        "                vec3 normal = normalize(floor(n) * 0.001f);\n" +
        "                vec3 wNormal = normalize(fract(n) * 1000.0f);\n" +
        "                // 计算光照\n" +
        "                vec4 lightColor;\n" +
        "                vec4 lightData1;\n" +
        "                vec4 lightDir = vec4(0.0f);\n" +
        "                vec3 lightVec = vec3(0.0f);\n" +
        "                vec3 directLighting = vec3(0.0f);\n" +
        "                vec3 viewDir = normalize(Context.CameraPosition.xyz - wPosition.xyz);\n" +
        "\n" +
        "                float ndotv = max( dot( normal, viewDir ), 0.0f );\n" +
        "                for( int i = 0;i < Context.CurLightCount;i+=3 ){\n" +
        "                    lightColor = Context.WLightData[i];\n" +
        "                    lightData1 = Context.WLightData[i + 1];\n" +
        "                    ComputeLightDir(wPosition, lightColor.w, lightData1, lightDir, lightVec);\n" +
        "\n" +
        "                    // 计算PointLight的衰减\n" +
        "                    float spotFallOff = 1.0 * lightDir.w;\n" +
        "                    // 计算SpotLight的衰减\n" +
        "                    if( lightColor.w > 1.0f )\n" +
        "                    {\n" +
        "                        // 计算SpotLight的范围衰减\n" +
        "                        spotFallOff = ComputeSpotFalloff( Context.WLightData[i + 2], lightDir.xyz );\n" +
        "                    }\n" +
        "\n" +
        "                    ComputeDirectLighting(normal, viewDir, lightDir.xyz, lightColor.rgb, _diffuseColor.rgb, fZero, _roughness, ndotv, directLighting);\n" +
        "                    Context.OutColor.rgb += directLighting * spotFallOff;\n" +
        "                }\n" +
        "\n" +
        "                if(Context.BlendGiProbes){\n" +
        "                    #ifdef Context.GIProbes\n" +
        "                        // 作为webGL项目,暂时不实现探针混合(但作为可拓展,仍然加结尾s命名)\n" +
        "\n" +
        "                        // 计算反射视线\n" +
        "                        vec3 _rv = reflect( -viewDir.xyz, normal.xyz );\n" +
        "                        float _r = fract( Context.WGIProbe.w );\n" +
        "                        float _mipMaps = Context.WGIProbe.w - _r;\n" +
        "                        _rv = _r * ( wPosition.xyz - Context.WGIProbe.xyz ) + _rv;\n" +
        "\n" +
        "                        // 使用球谐计算diffuse( 避免Irr采样 )\n" +
        "                        vec3 giLighting = sphericalHarmonics(normal.xyz, Context.ShCoeffs) * _diffuseColor.rgb;\n" +
        "\n" +
        "                        float horiz = dot(_rv, wNormal);\n" +
        "                        float horizFadePower = 1.0f - _roughness;\n" +
        "                        horiz = clamp( 1.0f + horizFadePower * horiz, 0.0f, 1.0f );\n" +
        "                        horiz *= horiz;\n" +
        "\n" +
        "                        vec3 _dominantR = getSpecularDominantDir( normal, _rv.xyz, _roughness * _roughness );\n" +
        "                        giLighting += approximateSpecularIBLPolynomial(Context.InPrefEnvMap, _specularColor.rgb, _roughness, ndotv, _dominantR, _mipMaps) * vec3( horiz );\n" +
        "                        giLighting *= ao;\n" +
        "\n" +
        "                        Context.OutColor.rgb += giLighting * step( 0.0f, Context.WGIProbe.w );\n" +
        "                        // Context.OutColor.rgb = textureLod(Context.InPrefEnvMap, normal.xyz, 0.0f).rgb;\n" +
        "                    #endif\n" +
        "                }\n" +
        "\n" +
        "                Context.OutColor.a = buff0.a;\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    SubTechnology DeferredShadingPass2{\n" +
        "        Vars{\n" +
        "            vec4 wordPosition;\n" +
        "            vec2 uv0;\n" +
        "            mat4 pvInverse;\n" +
        "        }\n" +
        "        Advanced{\n" +
        "            RenderProgram MultiPassIBLLighting;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutPosition = vec4(Context.InPosition, 1.0f);\n" +
        "                wordPosition = Context.OutPosition;\n" +
        "                uv0 = Context.InUv0;\n" +
        "                pvInverse = inverse(Context.ProjectViewMatrix);\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            vec3 getPosition(in float depth, in vec2 newTexCoord){\n" +
        "\n" +
        "                vec4 pos;\n" +
        "                pos.xy = (newTexCoord * vec2(2.0)) - vec2(1.0);\n" +
        "                pos.z  = depth * 2.0 - 1.0;\n" +
        "                pos.w  = 1.0;\n" +
        "                pos    = pvInverse * pos;\n" +
        "                pos.xyz /= pos.w;\n" +
        "                return pos.xyz;\n" +
        "            }\n" +
        "            // 计算光照方向\n" +
        "            // 对于DirLight,PointLight以及SpotLight,lightType依次为0.0,1.0,2.0\n" +
        "            // 输出光照方向\n" +
        "            // lightDir.w存储衰减率(对于DirLight,衰减值一直为1,对于Point或Spot,衰减值随着半径而变小,衰减值越小,表示衰减度越大)\n" +
        "            void ComputeLightDir(in vec3 worldPos, in float lightType, in vec4 position, out vec4 lightDir, out vec3 lightVec){\n" +
        "                // 只有lightType = 0.0时,posLight为0.0,否则posLight为1.0\n" +
        "                float posLight = step(0.5f, lightType);\n" +
        "\n" +
        "                // 计算光照位置\n" +
        "                // 对于DirLight,lightVec = position.xyz * sign(-0.5f) = position.xyz * -1.0f;其中position代表DirLight的方向\n" +
        "                // 对于PointLight和SpotLight,lightVec = position.xyz * sign(1.0f - 0.5f) - (worldPos * 1.0f) = positions.xyz * 1.0f - worldPos;其中position代表Light的位置\n" +
        "                lightVec = position.xyz * sign(posLight - 0.5f) - (worldPos * posLight);\n" +
        "                float dist = length(lightVec);\n" +
        "\n" +
        "                #ifndef Context.Srgb\n" +
        "                    lightDir.w = (1.0f - position.w * dist) / (1.0f + position.w * dist * dist);\n" +
        "                    lightDir.w = clamp(lightDir.w, 1.0f - posLight, 1.0f);\n" +
        "                #else\n" +
        "                    // 对于DirLight,lightDir.w = 1.0f\n" +
        "                    lightDir.w = clamp(1.0f - position.w * dist * posLight, 0.0f, 1.0f);\n" +
        "                #endif\n" +
        "\n" +
        "                // 归一化\n" +
        "                lightDir.xyz = lightVec / vec3(dist);\n" +
        "            }\n" +
        "            #define PI 3.14159265358979323846264\n" +
        "            // 镜面反射菲涅尔计算\n" +
        "            vec3 F_Shlick(float vh,\tvec3 F0){\n" +
        "                float fresnelFact = pow(2.0f, (-5.55473f * vh - 6.98316f) * vh);\n" +
        "                return mix(F0, vec3(1.0f, 1.0f, 1.0f), fresnelFact);\n" +
        "            }\n" +
        "            vec3 F_Schlick2(float cosTheta, vec3 F0)\n" +
        "            {\n" +
        "                return F0 + (1.0f - F0) * pow(1.0f - cosTheta, 5.0f);\n" +
        "            }\n" +
        "            // 计算直接光照\n" +
        "            void ComputeDirectLighting(in vec3 normal, in vec3 viewDir, in vec3 lightDir, in vec3 lightColor, in vec3 diffuseColor, in vec3 fZero, in float roughness, in float ndotv, out vec3 directLighting){\n" +
        "                vec3 h = normalize(lightDir + viewDir);\n" +
        "                float ndotl = max( dot( normal, lightDir ), 0.0f );\n" +
        "                float ndoth = max( dot( normal, h), 0.0f );\n" +
        "                float hdotv = max( dot( h, viewDir ), 0.0f );\n" +
        "\n" +
        "                // 这里,不使用c/Π计算diffuse fr(x, wi, wo)\n" +
        "                // 而假设恒定\n" +
        "                vec3 diffuse = vec3( ndotl ) * lightColor * diffuseColor;\n" +
        "\n" +
        "                // cook-torrence,BRDF : http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf\n" +
        "                float alpha = roughness * roughness;\n" +
        "\n" +
        "                // D, GGX 法线分布函数\n" +
        "                float alpha2 = alpha * alpha;\n" +
        "                float sum = (( ndoth * ndoth ) * ( alpha2 - 1.0f ) + 1.0f);\n" +
        "                float denom = PI * sum * sum;\n" +
        "                float D = alpha2 / denom;\n" +
        "\n" +
        "                // F, 菲涅尔项\n" +
        "                vec3 F = F_Shlick( hdotv, fZero );\n" +
        "\n" +
        "                // G, 几何遮挡项\n" +
        "                float k = alpha * 0.5f;\n" +
        "                float G_V = ndotv + sqrt( ( ndotv - ndotv * k ) * ndotv + k );\n" +
        "                float G_L = ndotl + sqrt( ( ndotl - ndotl * k ) * ndotl + k );\n" +
        "                float G = 1.0f / max( G_V * G_L ,0.01f );\n" +
        "\n" +
        "                // specularBRDF\n" +
        "                float t = D * G * ndotl;\n" +
        "                vec3 specular =  vec3( t ) * F * lightColor;\n" +
        "\n" +
        "                directLighting = diffuse + specular;\n" +
        "            }\n" +
        "            // 返回Spot范围衰减\n" +
        "            float ComputeSpotFalloff(in vec4 spotDirection, in vec3 lightDir){\n" +
        "                float curAngleCos = dot(lightDir, -spotDirection.xyz);\n" +
        "                float innerAngleCos = floor(spotDirection.w) * 0.001f;\n" +
        "                float outerAngleCos = fract(spotDirection.w);\n" +
        "                float innerMinusOuter = innerAngleCos - outerAngleCos;\n" +
        "\n" +
        "                #ifndef Context.Srgb\n" +
        "                    // 使用二次衰减（请注意^ 4）\n" +
        "                    return pow(clamp((curAngleCos - outerAngleCos) / innerMinusOuter, 0.0f, 1.0f), 4.0f);\n" +
        "                #else\n" +
        "                    // 线性空间衰减\n" +
        "                    return clamp((curAngleCos - outerAngleCos) / innerMinusOuter, step(spotDirection.w, 0.001f), 1.0f);\n" +
        "                #endif\n" +
        "            }\n" +
        "            // 球谐函数\n" +
        "            vec3 sphericalHarmonics( const in vec3 normal, const vec3 sph[9] ){\n" +
        "                float x = normal.x;\n" +
        "                float y = normal.y;\n" +
        "                float z = normal.z;\n" +
        "\n" +
        "                vec3 result = (\n" +
        "                    sph[0] +\n" +
        "\n" +
        "                    sph[1] * y +\n" +
        "                    sph[2] * z +\n" +
        "                    sph[3] * x +\n" +
        "\n" +
        "                    sph[4] * y * x +\n" +
        "                    sph[5] * y * z +\n" +
        "                    sph[6] * (3.0f * z * z - 1.0f) +\n" +
        "                    sph[7] * (z * x) +\n" +
        "                    sph[8] * (x*x - y*y)\n" +
        "                );\n" +
        "\n" +
        "                return max(result, vec3(0.0f));\n" +
        "            }\n" +
        "            // 镜面反射趋势朝向\n" +
        "            vec3 getSpecularDominantDir(const in vec3 N, const in vec3 R, const in float realRoughness){\n" +
        "\n" +
        "                float smoothness = 1.0f - realRoughness;\n" +
        "                float lerpFactor = smoothness * (sqrt(smoothness) + realRoughness);\n" +
        "                // 当我们在立方体贴图中获取时，结果未规范化\n" +
        "                vec3 dominant = mix(N, R, lerpFactor);\n" +
        "\n" +
        "                return dominant;\n" +
        "            }\n" +
        "            // 拟合方程\n" +
        "            // 关于镜面部分，有很多优化地方，除了常见的优化，还有很多可以替代方案，几乎可以在保证画质的前提下，在移动端35帧率提升到60帧率，详细可参考我的笔记:https://www.cnblogs.com/JhonKkk/p/14313882.html\n" +
        "            vec3 integrateBRDFApprox( const in vec3 specular, in float roughness, in float NoV ){\n" +
        "                const vec4 c0 = vec4( -1.0f, -0.0275f, -0.572f, 0.022f );\n" +
        "                const vec4 c1 = vec4( 1.0f, 0.0425f, 1.04f, -0.04f );\n" +
        "                vec4 r = roughness * c0 + c1;\n" +
        "                float a004 = min( r.x * r.x, exp2( -9.28f * NoV ) ) * r.x + r.y;\n" +
        "                vec2 ab = vec2( -1.04f, 1.04f ) * a004 + r.zw;\n" +
        "                return specular * ab.x + ab.y;\n" +
        "            }\n" +
        "            // 近似镜面IBL多项式\n" +
        "            vec3 approximateSpecularIBLPolynomial(in samplerCube envMap, in vec3 specularColor , in float roughness, in float ndotv, in vec3 refVec, in float mipMaps){\n" +
        "                float lod = sqrt( roughness ) * (mipMaps - 1.0f);\n" +
        "                vec3 prefilteredColor = textureLod(envMap, refVec.xyz, lod).rgb;\n" +
        "                return prefilteredColor * integrateBRDFApprox(specularColor, roughness, ndotv);\n" +
        "            }\n" +
        "            #define GAMMA 2.2f\n" +
        "            #define GAMMA_T 1.0f / GAMMA\n" +
        "            void main(){\n" +
        "                float depth = texture(Context.InGDepth, uv0).r;\n" +
        "                if(depth >= 1.0){\n" +
        "                    Context.OutColor = vec4(0.0f, 0.0f, 0.0f, 1.0f);\n" +
        "                    return;\n" +
        "                }\n" +
        "                vec3 wPosition = getPosition(depth, uv0);\n" +
        "                vec4 buff0 = texture(Context.InGBuffer0, uv0);\n" +
        "                vec4 buff2 = texture(Context.InGBuffer2, uv0);\n" +
        "                vec3 _diffuseColor = floor(buff0.rgb) * 0.01f * Context.AmbientLightColor;\n" +
        "                vec3 _specularColor = floor(buff2.rgb) * 0.01f;\n" +
        "                vec3 ao = min(fract(buff0.rgb) * 10.0f, vec3(1.0f));\n" +
        "                vec3 fZero = min(fract(buff2.rgb) * 10.0f, vec3(1.0f));\n" +
        "                float _roughness = floor(buff2.w) * 0.01f;\n" +
        "                vec3 n = texture(Context.InGBuffer1, uv0).xyz;\n" +
        "                vec3 normal = normalize(floor(n) * 0.001f);\n" +
        "                vec3 wNormal = normalize(fract(n) * 1000.0f);\n" +
        "                // 计算光照\n" +
        "                vec4 lightColor;\n" +
        "                vec4 lightData1;\n" +
        "                vec4 lightDir = vec4(0.0f);\n" +
        "                vec3 lightVec = vec3(0.0f);\n" +
        "                vec3 directLighting = vec3(0.0f);\n" +
        "                vec3 viewDir = normalize(Context.CameraPosition.xyz - wPosition.xyz);\n" +
        "\n" +
        "                float ndotv = max( dot( normal, viewDir ), 0.0f );\n" +
        "                if(Context.MultiId == 0){\n" +
        "                    for( int i = 0;i < Context.CurLightCount;i+=3 ){\n" +
        "                        lightColor = Context.WLightData[i];\n" +
        "                        lightData1 = Context.WLightData[i + 1];\n" +
        "                        ComputeLightDir(wPosition, lightColor.w, lightData1, lightDir, lightVec);\n" +
        "\n" +
        "                        // 计算PointLight的衰减\n" +
        "                        float spotFallOff = 1.0 * lightDir.w;\n" +
        "                        // 计算SpotLight的衰减\n" +
        "                        if( lightColor.w > 1.0f )\n" +
        "                        {\n" +
        "                            // 计算SpotLight的范围衰减\n" +
        "                            spotFallOff = ComputeSpotFalloff( Context.WLightData[i + 2], lightDir.xyz );\n" +
        "                        }\n" +
        "\n" +
        "                        ComputeDirectLighting(normal, viewDir, lightDir.xyz, lightColor.rgb, _diffuseColor.rgb, fZero, _roughness, ndotv, directLighting);\n" +
        "                        Context.OutColor.rgb += directLighting * spotFallOff;\n" +
        "                    }\n" +
        "                }\n" +
        "                else{\n" +
        "                    lightColor = Context.WLight_Data_0;\n" +
        "                    lightData1 = Context.WLight_Data_1;\n" +
        "                    ComputeLightDir(wPosition, lightColor.w, lightData1, lightDir, lightVec);\n" +
        "\n" +
        "                    // 计算PointLight的衰减\n" +
        "                    float spotFallOff = 1.0 * lightDir.w;\n" +
        "                    // 计算SpotLight的衰减\n" +
        "                    if( lightColor.w > 1.0f )\n" +
        "                    {\n" +
        "                        // 计算SpotLight的范围衰减\n" +
        "                        spotFallOff = ComputeSpotFalloff( Context.WLight_Data_2, lightDir.xyz );\n" +
        "                    }\n" +
        "\n" +
        "                    ComputeDirectLighting(normal, viewDir, lightDir.xyz, lightColor.rgb, _diffuseColor.rgb, fZero, _roughness, ndotv, directLighting);\n" +
        "                    Context.OutColor.rgb += directLighting * spotFallOff;\n" +
        "                }\n" +
        "\n" +
        "                if(Context.BlendGiProbes){\n" +
        "                    #ifdef Context.GIProbes\n" +
        "                        // 作为webGL项目,暂时不实现探针混合(但作为可拓展,仍然加结尾s命名)\n" +
        "\n" +
        "                        // 计算反射视线\n" +
        "                        vec3 _rv = reflect( -viewDir.xyz, normal.xyz );\n" +
        "                        float _r = fract( Context.WGIProbe.w );\n" +
        "                        float _mipMaps = Context.WGIProbe.w - _r;\n" +
        "                        _rv = _r * ( wPosition.xyz - Context.WGIProbe.xyz ) + _rv;\n" +
        "\n" +
        "                        // 使用球谐计算diffuse( 避免Irr采样 )\n" +
        "                        vec3 giLighting = sphericalHarmonics(normal.xyz, Context.ShCoeffs) * _diffuseColor.rgb;\n" +
        "\n" +
        "                        float horiz = dot(_rv, wNormal);\n" +
        "                        float horizFadePower = 1.0f - _roughness;\n" +
        "                        horiz = clamp( 1.0f + horizFadePower * horiz, 0.0f, 1.0f );\n" +
        "                        horiz *= horiz;\n" +
        "\n" +
        "                        vec3 _dominantR = getSpecularDominantDir( normal, _rv.xyz, _roughness * _roughness );\n" +
        "                        giLighting += approximateSpecularIBLPolynomial(Context.InPrefEnvMap, _specularColor.rgb, _roughness, ndotv, _dominantR, _mipMaps) * vec3( horiz );\n" +
        "                        giLighting *= ao;\n" +
        "\n" +
        "                        Context.OutColor.rgb += giLighting * step( 0.0f, Context.WGIProbe.w );\n" +
        "                        // Context.OutColor.rgb = textureLod(Context.InPrefEnvMap, normal.xyz, 0.0f).rgb;\n" +
        "                    #endif\n" +
        "                }\n" +
        "\n" +
        "                Context.OutColor.a = buff0.a;\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    SubTechnology GlobalPass{\n" +
        "        Vars{\n" +
        "            vec4 wordPosition;\n" +
        "            vec2 uv0;\n" +
        "            mat4 pvInverse;\n" +
        "        }\n" +
        "        Advanced{\n" +
        "            RenderProgram TilePassIBLLighting;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutPosition = vec4(Context.InPosition, 1.0f);\n" +
        "                wordPosition = Context.OutPosition;\n" +
        "                uv0 = Context.InUv0;\n" +
        "                pvInverse = inverse(Context.ProjectViewMatrix);\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            vec3 getPosition(in float depth, in vec2 newTexCoord){\n" +
        "\n" +
        "                vec4 pos;\n" +
        "                pos.xy = (newTexCoord * vec2(2.0)) - vec2(1.0);\n" +
        "                pos.z  = depth * 2.0 - 1.0;\n" +
        "                pos.w  = 1.0;\n" +
        "                pos    = pvInverse * pos;\n" +
        "                pos.xyz /= pos.w;\n" +
        "                return pos.xyz;\n" +
        "            }\n" +
        "            // 计算光照方向\n" +
        "            // 对于DirLight,PointLight以及SpotLight,lightType依次为0.0,1.0,2.0\n" +
        "            // 输出光照方向\n" +
        "            // lightDir.w存储衰减率(对于DirLight,衰减值一直为1,对于Point或Spot,衰减值随着半径而变小,衰减值越小,表示衰减度越大)\n" +
        "            void ComputeLightDir(in vec3 worldPos, in float lightType, in vec4 position, out vec4 lightDir, out vec3 lightVec){\n" +
        "                // 只有lightType = 0.0时,posLight为0.0,否则posLight为1.0\n" +
        "                float posLight = step(0.5f, lightType);\n" +
        "\n" +
        "                // 计算光照位置\n" +
        "                // 对于DirLight,lightVec = position.xyz * sign(-0.5f) = position.xyz * -1.0f;其中position代表DirLight的方向\n" +
        "                // 对于PointLight和SpotLight,lightVec = position.xyz * sign(1.0f - 0.5f) - (worldPos * 1.0f) = positions.xyz * 1.0f - worldPos;其中position代表Light的位置\n" +
        "                lightVec = position.xyz * sign(posLight - 0.5f) - (worldPos * posLight);\n" +
        "                float dist = length(lightVec);\n" +
        "\n" +
        "                #ifndef Context.Srgb\n" +
        "                    lightDir.w = (1.0f - position.w * dist) / (1.0f + position.w * dist * dist);\n" +
        "                    lightDir.w = clamp(lightDir.w, 1.0f - posLight, 1.0f);\n" +
        "                #else\n" +
        "                    // 对于DirLight,lightDir.w = 1.0f\n" +
        "                    lightDir.w = clamp(1.0f - position.w * dist * posLight, 0.0f, 1.0f);\n" +
        "                #endif\n" +
        "\n" +
        "                // 归一化\n" +
        "                lightDir.xyz = lightVec / vec3(dist);\n" +
        "            }\n" +
        "            #define PI 3.14159265358979323846264\n" +
        "            // 镜面反射菲涅尔计算\n" +
        "            vec3 F_Shlick(float vh,\tvec3 F0){\n" +
        "                float fresnelFact = pow(2.0f, (-5.55473f * vh - 6.98316f) * vh);\n" +
        "                return mix(F0, vec3(1.0f, 1.0f, 1.0f), fresnelFact);\n" +
        "            }\n" +
        "            vec3 F_Schlick2(float cosTheta, vec3 F0)\n" +
        "            {\n" +
        "                return F0 + (1.0f - F0) * pow(1.0f - cosTheta, 5.0f);\n" +
        "            }\n" +
        "            // 计算直接光照\n" +
        "            void ComputeDirectLighting(in vec3 normal, in vec3 viewDir, in vec3 lightDir, in vec3 lightColor, in vec3 diffuseColor, in vec3 fZero, in float roughness, in float ndotv, out vec3 directLighting){\n" +
        "                vec3 h = normalize(lightDir + viewDir);\n" +
        "                float ndotl = max( dot( normal, lightDir ), 0.0f );\n" +
        "                float ndoth = max( dot( normal, h), 0.0f );\n" +
        "                float hdotv = max( dot( h, viewDir ), 0.0f );\n" +
        "\n" +
        "                // 这里,不使用c/Π计算diffuse fr(x, wi, wo)\n" +
        "                // 而假设恒定\n" +
        "                vec3 diffuse = vec3( ndotl ) * lightColor * diffuseColor;\n" +
        "\n" +
        "                // cook-torrence,BRDF : http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf\n" +
        "                float alpha = roughness * roughness;\n" +
        "\n" +
        "                // D, GGX 法线分布函数\n" +
        "                float alpha2 = alpha * alpha;\n" +
        "                float sum = (( ndoth * ndoth ) * ( alpha2 - 1.0f ) + 1.0f);\n" +
        "                float denom = PI * sum * sum;\n" +
        "                float D = alpha2 / denom;\n" +
        "\n" +
        "                // F, 菲涅尔项\n" +
        "                vec3 F = F_Shlick( hdotv, fZero );\n" +
        "\n" +
        "                // G, 几何遮挡项\n" +
        "                float k = alpha * 0.5f;\n" +
        "                float G_V = ndotv + sqrt( ( ndotv - ndotv * k ) * ndotv + k );\n" +
        "                float G_L = ndotl + sqrt( ( ndotl - ndotl * k ) * ndotl + k );\n" +
        "                float G = 1.0f / max( G_V * G_L ,0.01f );\n" +
        "\n" +
        "                // specularBRDF\n" +
        "                float t = D * G * ndotl;\n" +
        "                vec3 specular =  vec3( t ) * F * lightColor;\n" +
        "\n" +
        "                directLighting = diffuse + specular;\n" +
        "            }\n" +
        "            // 返回Spot范围衰减\n" +
        "            float ComputeSpotFalloff(in vec4 spotDirection, in vec3 lightDir){\n" +
        "                float curAngleCos = dot(lightDir, -spotDirection.xyz);\n" +
        "                float innerAngleCos = floor(spotDirection.w) * 0.001f;\n" +
        "                float outerAngleCos = fract(spotDirection.w);\n" +
        "                float innerMinusOuter = innerAngleCos - outerAngleCos;\n" +
        "\n" +
        "                #ifndef Context.Srgb\n" +
        "                    // 使用二次衰减（请注意^ 4）\n" +
        "                    return pow(clamp((curAngleCos - outerAngleCos) / innerMinusOuter, 0.0f, 1.0f), 4.0f);\n" +
        "                #else\n" +
        "                    // 线性空间衰减\n" +
        "                    return clamp((curAngleCos - outerAngleCos) / innerMinusOuter, step(spotDirection.w, 0.001f), 1.0f);\n" +
        "                #endif\n" +
        "            }\n" +
        "            // 球谐函数\n" +
        "            vec3 sphericalHarmonics( const in vec3 normal, const vec3 sph[9] ){\n" +
        "                float x = normal.x;\n" +
        "                float y = normal.y;\n" +
        "                float z = normal.z;\n" +
        "\n" +
        "                vec3 result = (\n" +
        "                    sph[0] +\n" +
        "\n" +
        "                    sph[1] * y +\n" +
        "                    sph[2] * z +\n" +
        "                    sph[3] * x +\n" +
        "\n" +
        "                    sph[4] * y * x +\n" +
        "                    sph[5] * y * z +\n" +
        "                    sph[6] * (3.0f * z * z - 1.0f) +\n" +
        "                    sph[7] * (z * x) +\n" +
        "                    sph[8] * (x*x - y*y)\n" +
        "                );\n" +
        "\n" +
        "                return max(result, vec3(0.0f));\n" +
        "            }\n" +
        "            // 镜面反射趋势朝向\n" +
        "            vec3 getSpecularDominantDir(const in vec3 N, const in vec3 R, const in float realRoughness){\n" +
        "\n" +
        "                float smoothness = 1.0f - realRoughness;\n" +
        "                float lerpFactor = smoothness * (sqrt(smoothness) + realRoughness);\n" +
        "                // 当我们在立方体贴图中获取时，结果未规范化\n" +
        "                vec3 dominant = mix(N, R, lerpFactor);\n" +
        "\n" +
        "                return dominant;\n" +
        "            }\n" +
        "            // 拟合方程\n" +
        "            // 关于镜面部分，有很多优化地方，除了常见的优化，还有很多可以替代方案，几乎可以在保证画质的前提下，在移动端35帧率提升到60帧率，详细可参考我的笔记:https://www.cnblogs.com/JhonKkk/p/14313882.html\n" +
        "            vec3 integrateBRDFApprox( const in vec3 specular, in float roughness, in float NoV ){\n" +
        "                const vec4 c0 = vec4( -1.0f, -0.0275f, -0.572f, 0.022f );\n" +
        "                const vec4 c1 = vec4( 1.0f, 0.0425f, 1.04f, -0.04f );\n" +
        "                vec4 r = roughness * c0 + c1;\n" +
        "                float a004 = min( r.x * r.x, exp2( -9.28f * NoV ) ) * r.x + r.y;\n" +
        "                vec2 ab = vec2( -1.04f, 1.04f ) * a004 + r.zw;\n" +
        "                return specular * ab.x + ab.y;\n" +
        "            }\n" +
        "            // 近似镜面IBL多项式\n" +
        "            vec3 approximateSpecularIBLPolynomial(in samplerCube envMap, in vec3 specularColor , in float roughness, in float ndotv, in vec3 refVec, in float mipMaps){\n" +
        "                float lod = sqrt( roughness ) * (mipMaps - 1.0f);\n" +
        "                vec3 prefilteredColor = textureLod(envMap, refVec.xyz, lod).rgb;\n" +
        "                return prefilteredColor * integrateBRDFApprox(specularColor, roughness, ndotv);\n" +
        "            }\n" +
        "            #define GAMMA 2.2f\n" +
        "            #define GAMMA_T 1.0f / GAMMA\n" +
        "            void main(){\n" +
        "                float depth = texture(Context.InGDepth, uv0).r;\n" +
        "                if(depth >= 1.0){\n" +
        "                    Context.OutColor = vec4(0.0f, 0.0f, 0.0f, 1.0f);\n" +
        "                    return;\n" +
        "                }\n" +
        "                vec3 wPosition = getPosition(depth, uv0);\n" +
        "                vec4 buff0 = texture(Context.InGBuffer0, uv0);\n" +
        "                vec4 buff2 = texture(Context.InGBuffer2, uv0);\n" +
        "                vec3 _diffuseColor = floor(buff0.rgb) * 0.01f * Context.AmbientLightColor;\n" +
        "                vec3 _specularColor = floor(buff2.rgb) * 0.01f;\n" +
        "                vec3 ao = min(fract(buff0.rgb) * 10.0f, vec3(1.0f));\n" +
        "                vec3 fZero = min(fract(buff2.rgb) * 10.0f, vec3(0.5f));\n" +
        "                float _roughness = floor(buff2.w) * 0.01f;\n" +
        "                vec3 n = texture(Context.InGBuffer1, uv0).xyz;\n" +
        "                vec3 normal = normalize(floor(n) * 0.001f);\n" +
        "                vec3 wNormal = normalize(fract(n) * 1000.0f);\n" +
        "                // 计算光照\n" +
        "                vec4 lightColor;\n" +
        "                vec4 lightData1;\n" +
        "                vec4 lightDir = vec4(0.0f);\n" +
        "                vec3 lightVec = vec3(0.0f);\n" +
        "                vec3 directLighting = vec3(0.0f);\n" +
        "                vec3 viewDir = normalize(Context.CameraPosition.xyz - wPosition.xyz);\n" +
        "\n" +
        "                float ndotv = max( dot( normal, viewDir ), 0.0f );\n" +
        "                for( int i = 0;i < Context.CurLightCount;i+=3 ){\n" +
        "                    lightColor = Context.WLightData[i];\n" +
        "                    lightData1 = Context.WLightData[i + 1];\n" +
        "                    ComputeLightDir(wPosition, lightColor.w, lightData1, lightDir, lightVec);\n" +
        "\n" +
        "                    // 计算PointLight的衰减\n" +
        "                    float spotFallOff = 1.0 * lightDir.w;\n" +
        "                    // 计算SpotLight的衰减\n" +
        "                    if( lightColor.w > 1.0f )\n" +
        "                    {\n" +
        "                        // 计算SpotLight的范围衰减\n" +
        "                        spotFallOff = ComputeSpotFalloff( Context.WLightData[i + 2], lightDir.xyz );\n" +
        "                    }\n" +
        "\n" +
        "                    ComputeDirectLighting(normal, viewDir, lightDir.xyz, lightColor.rgb, _diffuseColor.rgb, fZero, _roughness, ndotv, directLighting);\n" +
        "                    Context.OutColor.rgb += directLighting * spotFallOff;\n" +
        "                }\n" +
        "\n" +
        "                if(Context.BlendGiProbes){\n" +
        "                    #ifdef Context.GIProbes\n" +
        "                        // 作为webGL项目,暂时不实现探针混合(但作为可拓展,仍然加结尾s命名)\n" +
        "\n" +
        "                        // 计算反射视线\n" +
        "                        vec3 _rv = reflect( -viewDir.xyz, normal.xyz );\n" +
        "                        float _r = fract( Context.WGIProbe.w );\n" +
        "                        float _mipMaps = Context.WGIProbe.w - _r;\n" +
        "                        _rv = _r * ( wPosition.xyz - Context.WGIProbe.xyz ) + _rv;\n" +
        "\n" +
        "                        // 使用球谐计算diffuse( 避免Irr采样 )\n" +
        "                        vec3 giLighting = sphericalHarmonics(normal.xyz, Context.ShCoeffs) * _diffuseColor.rgb;\n" +
        "\n" +
        "                        float horiz = dot(_rv, wNormal);\n" +
        "                        float horizFadePower = 1.0f - _roughness;\n" +
        "                        horiz = clamp( 1.0f + horizFadePower * horiz, 0.0f, 1.0f );\n" +
        "                        horiz *= horiz;\n" +
        "\n" +
        "                        vec3 _dominantR = getSpecularDominantDir( normal, _rv.xyz, _roughness * _roughness );\n" +
        "                        giLighting += approximateSpecularIBLPolynomial(Context.InPrefEnvMap, _specularColor.rgb, _roughness, ndotv, _dominantR, _mipMaps) * vec3( horiz );\n" +
        "                        giLighting *= ao;\n" +
        "\n" +
        "                        Context.OutColor.rgb += giLighting * step( 0.0f, Context.WGIProbe.w );\n" +
        "                        // Context.OutColor.rgb = textureLod(Context.InPrefEnvMap, normal.xyz, 0.0f).rgb;\n" +
        "                    #endif\n" +
        "                }\n" +
        "                Context.OutColor.a = buff0.a;\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    SubTechnology TilePass{\n" +
        "        Vars{\n" +
        "            vec4 wordPosition;\n" +
        "            vec2 uv0;\n" +
        "            mat4 pvInverse;\n" +
        "        }\n" +
        "        Advanced{\n" +
        "            RenderProgram TilePassIBLLighting;\n" +
        "        }\n" +
        "        Vs_Shader{\n" +
        "            void main(){\n" +
        "                Context.OutPosition = vec4(Context.InPosition, 1.0f);\n" +
        "                wordPosition = Context.OutPosition;\n" +
        "                uv0 = Context.InUv0;\n" +
        "                pvInverse = inverse(Context.ProjectViewMatrix);\n" +
        "            }\n" +
        "        }\n" +
        "        Fs_Shader{\n" +
        "            vec3 getPosition(in float depth, in vec2 newTexCoord){\n" +
        "\n" +
        "                vec4 pos;\n" +
        "                pos.xy = (newTexCoord * vec2(2.0)) - vec2(1.0);\n" +
        "                pos.z  = depth * 2.0 - 1.0;\n" +
        "                pos.w  = 1.0;\n" +
        "                pos    = pvInverse * pos;\n" +
        "                pos.xyz /= pos.w;\n" +
        "                return pos.xyz;\n" +
        "            }\n" +
        "            // 计算光照方向\n" +
        "            // 对于DirLight,PointLight以及SpotLight,lightType依次为0.0,1.0,2.0\n" +
        "            // 输出光照方向\n" +
        "            // lightDir.w存储衰减率(对于DirLight,衰减值一直为1,对于Point或Spot,衰减值随着半径而变小,衰减值越小,表示衰减度越大)\n" +
        "            void ComputeLightDir(in vec3 worldPos, in float lightType, in vec4 position, out vec4 lightDir, out vec3 lightVec){\n" +
        "                // 只有lightType = 0.0时,posLight为0.0,否则posLight为1.0\n" +
        "                float posLight = step(0.5f, lightType);\n" +
        "\n" +
        "                // 计算光照位置\n" +
        "                // 对于DirLight,lightVec = position.xyz * sign(-0.5f) = position.xyz * -1.0f;其中position代表DirLight的方向\n" +
        "                // 对于PointLight和SpotLight,lightVec = position.xyz * sign(1.0f - 0.5f) - (worldPos * 1.0f) = positions.xyz * 1.0f - worldPos;其中position代表Light的位置\n" +
        "                lightVec = position.xyz * sign(posLight - 0.5f) - (worldPos * posLight);\n" +
        "                float dist = length(lightVec);\n" +
        "\n" +
        "                #ifndef Context.Srgb\n" +
        "                    lightDir.w = (1.0f - position.w * dist) / (1.0f + position.w * dist * dist);\n" +
        "                    lightDir.w = clamp(lightDir.w, 1.0f - posLight, 1.0f);\n" +
        "                #else\n" +
        "                    // 对于DirLight,lightDir.w = 1.0f\n" +
        "                    lightDir.w = clamp(1.0f - position.w * dist * posLight, 0.0f, 1.0f);\n" +
        "                #endif\n" +
        "\n" +
        "                // 归一化\n" +
        "                lightDir.xyz = lightVec / vec3(dist);\n" +
        "            }\n" +
        "            #define PI 3.14159265358979323846264\n" +
        "            // 镜面反射菲涅尔计算\n" +
        "            vec3 F_Shlick(float vh,\tvec3 F0){\n" +
        "                float fresnelFact = pow(2.0f, (-5.55473f * vh - 6.98316f) * vh);\n" +
        "                return mix(F0, vec3(1.0f, 1.0f, 1.0f), fresnelFact);\n" +
        "            }\n" +
        "            vec3 F_Schlick2(float cosTheta, vec3 F0)\n" +
        "            {\n" +
        "                return F0 + (1.0f - F0) * pow(1.0f - cosTheta, 5.0f);\n" +
        "            }\n" +
        "            // 计算直接光照\n" +
        "            void ComputeDirectLighting(in vec3 normal, in vec3 viewDir, in vec3 lightDir, in vec3 lightColor, in vec3 diffuseColor, in vec3 fZero, in float roughness, in float ndotv, out vec3 directLighting){\n" +
        "                vec3 h = normalize(lightDir + viewDir);\n" +
        "                float ndotl = max( dot( normal, lightDir ), 0.0f );\n" +
        "                float ndoth = max( dot( normal, h), 0.0f );\n" +
        "                float hdotv = max( dot( h, viewDir ), 0.0f );\n" +
        "\n" +
        "                // 这里,不使用c/Π计算diffuse fr(x, wi, wo)\n" +
        "                // 而假设恒定\n" +
        "                vec3 diffuse = vec3( ndotl ) * lightColor * diffuseColor;\n" +
        "\n" +
        "                // cook-torrence,BRDF : http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf\n" +
        "                float alpha = roughness * roughness;\n" +
        "\n" +
        "                // D, GGX 法线分布函数\n" +
        "                float alpha2 = alpha * alpha;\n" +
        "                float sum = (( ndoth * ndoth ) * ( alpha2 - 1.0f ) + 1.0f);\n" +
        "                float denom = PI * sum * sum;\n" +
        "                float D = alpha2 / denom;\n" +
        "\n" +
        "                // F, 菲涅尔项\n" +
        "                vec3 F = F_Shlick( hdotv, fZero );\n" +
        "\n" +
        "                // G, 几何遮挡项\n" +
        "                float k = alpha * 0.5f;\n" +
        "                float G_V = ndotv + sqrt( ( ndotv - ndotv * k ) * ndotv + k );\n" +
        "                float G_L = ndotl + sqrt( ( ndotl - ndotl * k ) * ndotl + k );\n" +
        "                float G = 1.0f / max( G_V * G_L ,0.01f );\n" +
        "\n" +
        "                // specularBRDF\n" +
        "                float t = D * G * ndotl;\n" +
        "                vec3 specular =  vec3( t ) * F * lightColor;\n" +
        "\n" +
        "                directLighting = diffuse + specular;\n" +
        "            }\n" +
        "            // 返回Spot范围衰减\n" +
        "            float ComputeSpotFalloff(in vec4 spotDirection, in vec3 lightDir){\n" +
        "                float curAngleCos = dot(lightDir, -spotDirection.xyz);\n" +
        "                float innerAngleCos = floor(spotDirection.w) * 0.001f;\n" +
        "                float outerAngleCos = fract(spotDirection.w);\n" +
        "                float innerMinusOuter = innerAngleCos - outerAngleCos;\n" +
        "\n" +
        "                #ifndef Context.Srgb\n" +
        "                    // 使用二次衰减（请注意^ 4）\n" +
        "                    return pow(clamp((curAngleCos - outerAngleCos) / innerMinusOuter, 0.0f, 1.0f), 4.0f);\n" +
        "                #else\n" +
        "                    // 线性空间衰减\n" +
        "                    return clamp((curAngleCos - outerAngleCos) / innerMinusOuter, step(spotDirection.w, 0.001f), 1.0f);\n" +
        "                #endif\n" +
        "            }\n" +
        "            // 球谐函数\n" +
        "            vec3 sphericalHarmonics( const in vec3 normal, const vec3 sph[9] ){\n" +
        "                float x = normal.x;\n" +
        "                float y = normal.y;\n" +
        "                float z = normal.z;\n" +
        "\n" +
        "                vec3 result = (\n" +
        "                    sph[0] +\n" +
        "\n" +
        "                    sph[1] * y +\n" +
        "                    sph[2] * z +\n" +
        "                    sph[3] * x +\n" +
        "\n" +
        "                    sph[4] * y * x +\n" +
        "                    sph[5] * y * z +\n" +
        "                    sph[6] * (3.0f * z * z - 1.0f) +\n" +
        "                    sph[7] * (z * x) +\n" +
        "                    sph[8] * (x*x - y*y)\n" +
        "                );\n" +
        "\n" +
        "                return max(result, vec3(0.0f));\n" +
        "            }\n" +
        "            // 镜面反射趋势朝向\n" +
        "            vec3 getSpecularDominantDir(const in vec3 N, const in vec3 R, const in float realRoughness){\n" +
        "\n" +
        "                float smoothness = 1.0f - realRoughness;\n" +
        "                float lerpFactor = smoothness * (sqrt(smoothness) + realRoughness);\n" +
        "                // 当我们在立方体贴图中获取时，结果未规范化\n" +
        "                vec3 dominant = mix(N, R, lerpFactor);\n" +
        "\n" +
        "                return dominant;\n" +
        "            }\n" +
        "            // 拟合方程\n" +
        "            // 关于镜面部分，有很多优化地方，除了常见的优化，还有很多可以替代方案，几乎可以在保证画质的前提下，在移动端35帧率提升到60帧率，详细可参考我的笔记:https://www.cnblogs.com/JhonKkk/p/14313882.html\n" +
        "            vec3 integrateBRDFApprox( const in vec3 specular, in float roughness, in float NoV ){\n" +
        "                const vec4 c0 = vec4( -1.0f, -0.0275f, -0.572f, 0.022f );\n" +
        "                const vec4 c1 = vec4( 1.0f, 0.0425f, 1.04f, -0.04f );\n" +
        "                vec4 r = roughness * c0 + c1;\n" +
        "                float a004 = min( r.x * r.x, exp2( -9.28f * NoV ) ) * r.x + r.y;\n" +
        "                vec2 ab = vec2( -1.04f, 1.04f ) * a004 + r.zw;\n" +
        "                return specular * ab.x + ab.y;\n" +
        "            }\n" +
        "            // 近似镜面IBL多项式\n" +
        "            vec3 approximateSpecularIBLPolynomial(in samplerCube envMap, in vec3 specularColor , in float roughness, in float ndotv, in vec3 refVec, in float mipMaps){\n" +
        "                float lod = sqrt( roughness ) * (mipMaps - 1.0f);\n" +
        "                vec3 prefilteredColor = textureLod(envMap, refVec.xyz, lod).rgb;\n" +
        "                return prefilteredColor * integrateBRDFApprox(specularColor, roughness, ndotv);\n" +
        "            }\n" +
        "            #define GAMMA 2.2f\n" +
        "            #define GAMMA_T 1.0f / GAMMA\n" +
        "            void main(){\n" +
        "                float depth = texture(Context.InGDepth, uv0).r;\n" +
        "                if(depth >= 1.0){\n" +
        "                    Context.OutColor = vec4(0.0f, 0.0f, 0.0f, 1.0f);\n" +
        "                    return;\n" +
        "                }\n" +
        "                vec3 wPosition = getPosition(depth, uv0);\n" +
        "                vec4 buff0 = texture(Context.InGBuffer0, uv0);\n" +
        "                vec4 buff2 = texture(Context.InGBuffer2, uv0);\n" +
        "                vec3 _diffuseColor = floor(buff0.rgb) * 0.01f * Context.AmbientLightColor;\n" +
        "                vec3 _specularColor = floor(buff2.rgb) * 0.01f;\n" +
        "                vec3 ao = min(fract(buff0.rgb) * 10.0f, vec3(1.0f));\n" +
        "                vec3 fZero = min(fract(buff2.rgb) * 10.0f, vec3(0.5f));\n" +
        "                float _roughness = floor(buff2.w) * 0.01f;\n" +
        "                vec3 n = texture(Context.InGBuffer1, uv0).xyz;\n" +
        "                vec3 normal = normalize(floor(n) * 0.001f);\n" +
        "                vec3 wNormal = normalize(fract(n) * 1000.0f);\n" +
        "                // 计算光照\n" +
        "                vec4 lightColor;\n" +
        "                vec4 lightData1;\n" +
        "                vec4 lightDir = vec4(0.0f);\n" +
        "                vec3 lightVec = vec3(0.0f);\n" +
        "                vec3 directLighting = vec3(0.0f);\n" +
        "                vec3 viewDir = normalize(Context.CameraPosition.xyz - wPosition.xyz);\n" +
        "\n" +
        "                Context.OutColor.rgb = vec3(0.0f);\n" +
        "                // Tile Based Shading\n" +
        "                // 获取tile信息\n" +
        "                vec3 tile = texture(Context.InTileLightDecode, uv0).xyz;\n" +
        "                int uoffset = int(tile.x);\n" +
        "                int voffset = int(tile.z);\n" +
        "                int count = int(tile.y);\n" +
        "                if(count > 0){\n" +
        "                    int lightId;\n" +
        "                    float temp;\n" +
        "                    int offset;\n" +
        "                    // lightIndex采样范围规范化单位\n" +
        "                    float uvSize = 1.0f / (Context.TileLightOffsetSize - 1.0f);\n" +
        "                    vec2 lightUV;\n" +
        "                    // lightData采样范围规范单位\n" +
        "                    float lightUVSize = 1.0f / (float(Context.TileLightNum) - 1.0f);\n" +
        "                    vec2 lightDataUV;\n" +
        "                    for(int i = 0;i < count;i++){\n" +
        "                        temp = float(uoffset + i);\n" +
        "                        offset = 0;\n" +
        "\n" +
        "                        if(temp >= Context.TileLightOffsetSize){\n" +
        "                            temp -= Context.TileLightOffsetSize;\n" +
        "                            offset++;\n" +
        "                        }\n" +
        "                        if(temp == Context.TileLightOffsetSize){\n" +
        "                            temp = 0.0f;\n" +
        "                        }\n" +
        "\n" +
        "                        // lightIndexUV\n" +
        "                        lightUV = vec2(temp * uvSize, float(voffset + offset) * uvSize);\n" +
        "                        lightId = int(texture(Context.InTileLightIndex, lightUV).x);\n" +
        "\n" +
        "                        // 光源信息\n" +
        "                        lightDataUV = vec2(float(lightId) * lightUVSize);\n" +
        "                        lightColor = texture(Context.InTileWLightData0, lightDataUV);\n" +
        "                        lightData1 = texture(Context.InTileWLightData1, lightDataUV);\n" +
        "\n" +
        "                        float ndotv = max( dot( normal, viewDir ), 0.0f );\n" +
        "                        ComputeLightDir(wPosition, lightColor.w, lightData1, lightDir, lightVec);\n" +
        "\n" +
        "                        // 计算PointLight的衰减\n" +
        "                        float spotFallOff = 1.0 * lightDir.w;\n" +
        "                        // 计算SpotLight的衰减\n" +
        "                        if( lightColor.w > 1.0f )\n" +
        "                        {\n" +
        "                            // 计算SpotLight的范围衰减\n" +
        "                            spotFallOff = ComputeSpotFalloff( texture(Context.InTileWLightData2, lightDataUV), lightDir.xyz );\n" +
        "                        }\n" +
        "\n" +
        "                        ComputeDirectLighting(normal, viewDir, lightDir.xyz, lightColor.rgb, _diffuseColor.rgb, fZero, _roughness, ndotv, directLighting);\n" +
        "                        Context.OutColor.rgb += directLighting * spotFallOff;\n" +
        "                    }\n" +
        "                }\n" +
        "                Context.OutColor.a = buff0.a;\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology{\n" +
        "        Sub_Pass DeferredShading{\n" +
        "            Pass GBufferPass{\n" +
        "            }\n" +
        "            Pass DeferredShadingPass{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology MultiPassDeferred{\n" +
        "        Sub_Pass DeferredShading{\n" +
        "            Pass GBufferPass{\n" +
        "            }\n" +
        "            Pass DeferredShadingPass2{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    Technology TileDeferred{\n" +
        "        Sub_Pass TileDeferredShading{\n" +
        "            Pass GBufferPass{\n" +
        "            }\n" +
        "            Pass GlobalPass{\n" +
        "            }\n" +
        "            Pass TilePass{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
    static S_PRINCIPLED_LIGHTING_DEF = "// 原理化光照材质定义\n" +
        "Def PrincipledLightingDef{\n" +
        "    Params{\n" +
        "        // 基础参数\n" +
        "        vec4 baseColor;\n" +
        "        sampler2D baseColorMap;\n" +
        "        sampler2D normalMap;\n" +
        "\n" +
        "        // lightMap或AO\n" +
        "        sampler2D lightMap;\n" +
        "        bool aoMap;\n" +
        "        bool lightMapTexCoord;\n" +
        "\n" +
        "        // 自发光\n" +
        "        sampler2D emissiveMap;\n" +
        "        vec4 emissive;\n" +
        "        float emissivePower;\n" +
        "        float emissiveIntensity;\n" +
        "\n" +
        "        // metallic管线\n" +
        "        float metallic;\n" +
        "        float roughness;\n" +
        "        sampler2D metallicRoughnessMap;\n" +
        "        sampler2D metallicMap;\n" +
        "        sampler2D roughnessMap;\n" +
        "\n" +
        "        // specular管线\n" +
        "        bool useSpecGloss;\n" +
        "        sampler2D specularGlossinessMap;\n" +
        "        sampler2D specularMap;\n" +
        "        sampler2D glossinessMap;\n" +
        "        vec4 specular;\n" +
        "        float glossiness;\n" +
        "\n" +
        "        // alphaDiscard\n" +
        "        float alphaDiscard;\n" +
        "    }\n" +
        "    SubTechnology SPPrincipledLighting{\n" +
        "        Vars{\n" +
        "            vec3 wNormal;\n" +
        "            vec4 wTangent;\n" +
        "            vec3 wPosition;\n" +
        "            vec2 wUv0;\n" +
        "            vec2 wUv1;\n" +
        "        }\n" +
        "        Advanced{\n" +
        "            RenderProgram SinglePassIBLLighting;\n" +
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
        "\n" +
        "\n" +
        "                wPosition = (Context.ModelMatrix * vec4(Context.InPosition, 1.0f)).xyz;\n" +
        "                mat3 nMat = mat3(transpose(inverse(Context.ModelMatrix)));\n" +
        "                vec3 norm = normalize(nMat * Context.InNormal);\n" +
        "                //vec3 t = normalize(nMat * Context.InTangent);\n" +
        "                wTangent = vec4(normalize(nMat * Context.InTangent.xyz), Context.InTangent.w);\n" +
        "                //t = normalize(t - dot(t, norm) * norm);\n" +
        "                //vec3 b = cross(norm, t);\n" +
        "                //tbnMat = mat3(t, b, norm);\n" +
        "                wNormal = norm;\n" +
        "                wUv0 = Context.InUv0;\n" +
        "                #ifdef Params.lightMapTexCoord\n" +
        "                    wUv1 = Context.InUv1;\n" +
        "                #endif\n" +
        "\n" +
        "\n" +
        "                Context.OutPosition = Context.ProjectViewMatrix * pos;\n" +
        "            }\n" +
        "        }\n" +
        "\n" +
        "        Fs_Shader{\n" +
        "            // 计算光照方向\n" +
        "            // 对于DirLight,PointLight以及SpotLight,lightType依次为0.0,1.0,2.0\n" +
        "            // 输出光照方向\n" +
        "            // lightDir.w存储衰减率(对于DirLight,衰减值一直为1,对于Point或Spot,衰减值随着半径而变小,衰减值越小,表示衰减度越大)\n" +
        "            void ComputeLightDir(in vec3 worldPos, in float lightType, in vec4 position, out vec4 lightDir, out vec3 lightVec){\n" +
        "                // 只有lightType = 0.0时,posLight为0.0,否则posLight为1.0\n" +
        "                float posLight = step(0.5f, lightType);\n" +
        "\n" +
        "                // 计算光照位置\n" +
        "                // 对于DirLight,lightVec = position.xyz * sign(-0.5f) = position.xyz * -1.0f;其中position代表DirLight的方向\n" +
        "                // 对于PointLight和SpotLight,lightVec = position.xyz * sign(1.0f - 0.5f) - (worldPos * 1.0f) = positions.xyz * 1.0f - worldPos;其中position代表Light的位置\n" +
        "                lightVec = position.xyz * sign(posLight - 0.5f) - (worldPos * posLight);\n" +
        "                float dist = length(lightVec);\n" +
        "\n" +
        "                #ifndef Context.Srgb\n" +
        "                    lightDir.w = (1.0f - position.w * dist) / (1.0f + position.w * dist * dist);\n" +
        "                    lightDir.w = clamp(lightDir.w, 1.0f - posLight, 1.0f);\n" +
        "                #else\n" +
        "                    // 对于DirLight,lightDir.w = 1.0f\n" +
        "                    lightDir.w = clamp(1.0f - position.w * dist * posLight, 0.0f, 1.0f);\n" +
        "                #endif\n" +
        "\n" +
        "                // 归一化\n" +
        "                lightDir.xyz = lightVec / vec3(dist);\n" +
        "            }\n" +
        "            #define PI 3.14159265358979323846264\n" +
        "            // 镜面反射菲涅尔计算\n" +
        "            vec3 F_Shlick(float vh,\tvec3 F0){\n" +
        "            \tfloat fresnelFact = pow(2.0f, (-5.55473f * vh - 6.98316f) * vh);\n" +
        "            \treturn mix(F0, vec3(1.0f, 1.0f, 1.0f), fresnelFact);\n" +
        "            }\n" +
        "            vec3 F_Schlick2(float cosTheta, vec3 F0)\n" +
        "            {\n" +
        "                return F0 + (1.0f - F0) * pow(1.0f - cosTheta, 5.0f);\n" +
        "            }\n" +
        "            // 计算直接光照\n" +
        "            void ComputeDirectLighting(in vec3 normal, in vec3 viewDir, in vec3 lightDir, in vec3 lightColor, in vec3 diffuseColor, in vec3 fZero, in float roughness, in float ndotv, out vec3 directLighting){\n" +
        "                vec3 h = normalize(lightDir + viewDir);\n" +
        "                float ndotl = max( dot( normal, lightDir ), 0.0f );\n" +
        "                float ndoth = max( dot( normal, h), 0.0f );\n" +
        "                float hdotv = max( dot( h, viewDir ), 0.0f );\n" +
        "\n" +
        "                // 这里,不使用c/Π计算diffuse fr(x, wi, wo)\n" +
        "                // 而假设恒定\n" +
        "                vec3 diffuse = vec3( ndotl ) * lightColor * diffuseColor;\n" +
        "\n" +
        "                // cook-torrence,BRDF : http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf\n" +
        "                float alpha = roughness * roughness;\n" +
        "\n" +
        "                // D, GGX 法线分布函数\n" +
        "                float alpha2 = alpha * alpha;\n" +
        "                float sum = (( ndoth * ndoth ) * ( alpha2 - 1.0f ) + 1.0f);\n" +
        "                float denom = PI * sum * sum;\n" +
        "                float D = alpha2 / denom;\n" +
        "\n" +
        "                // F, 菲涅尔项\n" +
        "                vec3 F = F_Shlick( hdotv, fZero );\n" +
        "\n" +
        "                // G, 几何遮挡项\n" +
        "                float k = alpha * 0.5f;\n" +
        "                float G_V = ndotv + sqrt( ( ndotv - ndotv * k ) * ndotv + k );\n" +
        "                float G_L = ndotl + sqrt( ( ndotl - ndotl * k ) * ndotl + k );\n" +
        "                float G = 1.0f / max( G_V * G_L ,0.01f );\n" +
        "\n" +
        "                // specularBRDF\n" +
        "                float t = D * G * ndotl;\n" +
        "                vec3 specular =  vec3( t ) * F * lightColor;\n" +
        "\n" +
        "                directLighting = diffuse + specular;\n" +
        "            }\n" +
        "            // 返回Spot范围衰减\n" +
        "            float ComputeSpotFalloff(in vec4 spotDirection, in vec3 lightDir){\n" +
        "                float curAngleCos = dot(lightDir, -spotDirection.xyz);\n" +
        "                float innerAngleCos = floor(spotDirection.w) * 0.001f;\n" +
        "                float outerAngleCos = fract(spotDirection.w);\n" +
        "                float innerMinusOuter = innerAngleCos - outerAngleCos;\n" +
        "\n" +
        "                #ifndef Context.Srgb\n" +
        "                    // 使用二次衰减（请注意^ 4）\n" +
        "                    return pow(clamp((curAngleCos - outerAngleCos) / innerMinusOuter, 0.0f, 1.0f), 4.0f);\n" +
        "                #else\n" +
        "                    // 线性空间衰减\n" +
        "                    return clamp((curAngleCos - outerAngleCos) / innerMinusOuter, step(spotDirection.w, 0.001f), 1.0f);\n" +
        "                #endif\n" +
        "            }\n" +
        "            // 球谐函数\n" +
        "            vec3 sphericalHarmonics( const in vec3 normal, const vec3 sph[9] ){\n" +
        "                float x = normal.x;\n" +
        "                float y = normal.y;\n" +
        "                float z = normal.z;\n" +
        "\n" +
        "                vec3 result = (\n" +
        "                    sph[0] +\n" +
        "\n" +
        "                    sph[1] * y +\n" +
        "                    sph[2] * z +\n" +
        "                    sph[3] * x +\n" +
        "\n" +
        "                    sph[4] * y * x +\n" +
        "                    sph[5] * y * z +\n" +
        "                    sph[6] * (3.0f * z * z - 1.0f) +\n" +
        "                    sph[7] * (z * x) +\n" +
        "                    sph[8] * (x*x - y*y)\n" +
        "                );\n" +
        "\n" +
        "                return max(result, vec3(0.0f));\n" +
        "            }\n" +
        "            // 镜面反射趋势朝向\n" +
        "            vec3 getSpecularDominantDir(const in vec3 N, const in vec3 R, const in float realRoughness){\n" +
        "\n" +
        "                float smoothness = 1.0f - realRoughness;\n" +
        "                float lerpFactor = smoothness * (sqrt(smoothness) + realRoughness);\n" +
        "                // 当我们在立方体贴图中获取时，结果未规范化\n" +
        "                vec3 dominant = mix(N, R, lerpFactor);\n" +
        "\n" +
        "                return dominant;\n" +
        "            }\n" +
        "            // 拟合方程\n" +
        "            // 关于镜面部分，有很多优化地方，除了常见的优化，还有很多可以替代方案，几乎可以在保证画质的前提下，在移动端35帧率提升到60帧率，详细可参考我的笔记:https://www.cnblogs.com/JhonKkk/p/14313882.html\n" +
        "            vec3 integrateBRDFApprox( const in vec3 specular, in float roughness, in float NoV ){\n" +
        "                const vec4 c0 = vec4( -1.0f, -0.0275f, -0.572f, 0.022f );\n" +
        "                const vec4 c1 = vec4( 1.0f, 0.0425f, 1.04f, -0.04f );\n" +
        "                vec4 r = roughness * c0 + c1;\n" +
        "                float a004 = min( r.x * r.x, exp2( -9.28f * NoV ) ) * r.x + r.y;\n" +
        "                vec2 ab = vec2( -1.04f, 1.04f ) * a004 + r.zw;\n" +
        "                return specular * ab.x + ab.y;\n" +
        "            }\n" +
        "            // 近似镜面IBL多项式\n" +
        "            vec3 approximateSpecularIBLPolynomial(in samplerCube envMap, in vec3 specularColor , in float roughness, in float ndotv, in vec3 refVec, in float mipMaps){\n" +
        "                float lod = sqrt( roughness ) * (mipMaps - 1.0f);\n" +
        "                vec3 prefilteredColor = textureLod(envMap, refVec.xyz, lod).rgb;\n" +
        "                return prefilteredColor * integrateBRDFApprox(specularColor, roughness, ndotv);\n" +
        "            }\n" +
        "            #define GAMMA 2.2f\n" +
        "            #define GAMMA_T 1.0f / GAMMA\n" +
        "            void main(){\n" +
        "                vec4 lightColor;\n" +
        "                vec4 lightData1;\n" +
        "                vec4 lightDir = vec4(0.0f);\n" +
        "                vec3 lightVec = vec3(0.0f);\n" +
        "                vec3 directLighting = vec3(0.0f);\n" +
        "                vec3 viewDir = normalize(Context.CameraPosition.xyz - wPosition.xyz);\n" +
        "\n" +
        "                #ifdef Params.baseColor\n" +
        "                    #ifdef Params.baseColorMap\n" +
        "                        vec4 albedo = texture(Params.baseColorMap, wUv0) * Params.baseColor * vec4(Context.AmbientLightColor, 1.0);\n" +
        "                    #else\n" +
        "                        vec4 albedo = Params.baseColor * vec4(Context.AmbientLightColor, 1.0);\n" +
        "                    #endif\n" +
        "                #else\n" +
        "                    #ifdef Params.baseColorMap\n" +
        "                        vec4 albedo = texture(Params.baseColorMap, wUv0) * vec4(Context.AmbientLightColor, 1.0);\n" +
        "                    #else\n" +
        "                        vec4 albedo = vec4(1.0f) * vec4(Context.AmbientLightColor, 1.0);\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Params.alphaDiscard\n" +
        "                    if(albedo.a < Params.alphaDiscard){\n" +
        "                        discard;\n" +
        "                    }\n" +
        "                #endif\n" +
        "\n" +
        "                vec3 normal = wNormal;\n" +
        "                #ifdef Params.normalMap\n" +
        "                    // 这里做了一种简化,理论上应该在fs阶段计算tbn,但是从插值的角度来看,可以简化为tbn插值,减少在fs阶段计算tbn开销(虽然这么做不精确,但是折中下可以接受)\n" +
        "                    vec3 normalHeight = texture(Params.normalMap, wUv0).xyz;\n" +
        "                    vec3 tangent = normalize(wTangent.xyz);\n" +
        "                    mat3 tbnMat = mat3(tangent, wTangent.w * cross(normal, tangent), normal);\n" +
        "                    normal = normalize(tbnMat * ( normalHeight * 2.0f - 1.0f ));\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Params.metallicRoughnessMap\n" +
        "                    vec2 rm = texture(Params.metallicRoughnessMap, wUv0).gb;\n" +
        "                    #ifdef Params.roughness\n" +
        "                        float _roughness = rm.x * max(Params.roughness, 1e-4);\n" +
        "                    #else\n" +
        "                        float _roughness = rm.x;\n" +
        "                    #endif\n" +
        "                    #ifdef Params.metallic\n" +
        "                        float _metallic = rm.y * max(Params.metallic, 0.0f);\n" +
        "                    #else\n" +
        "                        float _metallic = rm.y;\n" +
        "                    #endif\n" +
        "                #else\n" +
        "                    #ifdef Params.roughnessMap\n" +
        "                        #ifdef Params.roughness\n" +
        "                            float _roughness = texture(Params.roughnessMap, wUv0).r * max(Params.roughness, 1e-4);\n" +
        "                        #else\n" +
        "                            float _roughness = texture(Params.roughnessMap, wUv0).r;\n" +
        "                        #endif\n" +
        "                    #else\n" +
        "                        #ifdef Params.roughness\n" +
        "                            float _roughness = max(Params.roughness, 1e-4);\n" +
        "                        #else\n" +
        "                            float _roughness = 1.0f;\n" +
        "                        #endif\n" +
        "                    #endif\n" +
        "                    #ifdef Params.metallicMap\n" +
        "                        #ifdef Params.metallic\n" +
        "                            float _metallic = texture(Params.metallicMap, wUv0).r * max(Params.metallic, 0.0f);\n" +
        "                        #else\n" +
        "                            float _metallic = texture(Params.metallicMap, wUv0).r;\n" +
        "                        #endif\n" +
        "                    #else\n" +
        "                        #ifdef Params.metallic\n" +
        "                            float _metallic = max(Params.metallic, 0.0f);\n" +
        "                        #else\n" +
        "                            float _metallic = 1.0f;\n" +
        "                        #endif\n" +
        "                    #endif\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Params.useSpecGloss\n" +
        "                    #ifdef Params.specularGlossinessMap\n" +
        "                        vec4 _specularColor = texture(Params.specularGlossinessMap, wUv0);\n" +
        "                        #ifdef Params.glossiness\n" +
        "                            float _glossiness = _specularColor.a * Params.glossiness;\n" +
        "                        #else\n" +
        "                            float _glossiness = _specularColor.a;\n" +
        "                        #endif\n" +
        "                        #ifdef Params.specular\n" +
        "                            _specularColor *= Params.specular;\n" +
        "                        #endif\n" +
        "                    #else\n" +
        "                        #ifdef Params.specularMap\n" +
        "                            vec4 _specularColor = texture(Params.specularMap, wUv0);\n" +
        "                        #else\n" +
        "                            vec4 _specularColor = vec4(1.0f);\n" +
        "                        #endif\n" +
        "                        #ifdef Params.specular\n" +
        "                            _specularColor *= Params.specular;\n" +
        "                        #endif\n" +
        "                        #ifdef Params.glossinessMap\n" +
        "                            #ifdef Params.glossiness\n" +
        "                                float _glossiness = texture(Params.glossinessMap, wUv0).r * Params.glossiness;\n" +
        "                            #else\n" +
        "                                float _glossiness = texture(Params.glossinessMap, wUv0).r;\n" +
        "                            #endif\n" +
        "                        #else\n" +
        "                            #ifdef Params.glossiness\n" +
        "                                float _glossiness = Params.glossiness;\n" +
        "                            #else\n" +
        "                                float _glossiness = 1.0f;\n" +
        "                            #endif\n" +
        "                        #endif\n" +
        "                    #endif\n" +
        "                    vec4 _diffuseColor = albedo;\n" +
        "                    _roughness = 1.0f - _glossiness;\n" +
        "                    vec3 fZero = _specularColor.rgb;\n" +
        "                #else\n" +
        "                    float nonMetalSpec = 0.04f;\n" +
        "                    vec4 _specularColor = (nonMetalSpec - nonMetalSpec * _metallic) + albedo * _metallic;\n" +
        "                    vec4 _diffuseColor = albedo - albedo * _metallic;\n" +
        "                    vec3 fZero = vec3( 0.5f );\n" +
        "                #endif\n" +
        "\n" +
        "                #ifdef Params.lightMap\n" +
        "                    vec3 _lightMapColor;\n" +
        "                    #ifdef Params.lightMapTexCoord\n" +
        "                        _lightMapColor = texture(Params.lightMap, wUv1).rgb;\n" +
        "                    #else\n" +
        "                        _lightMapColor = texture(Params.lightMap, wUv0).rgb;\n" +
        "                    #endif\n" +
        "                    #ifdef Params.aoMap\n" +
        "                        _lightMapColor.gb = _lightMapColor.rr;\n" +
        "                        vec3 ao = _lightMapColor;\n" +
        "                    #else\n" +
        "                        _specularColor.rgb *= _lightMapColor;\n" +
        "                        _diffuseColor.rgb  *= _lightMapColor;\n" +
        "                        vec3 ao = vec3(1.0f);\n" +
        "                    #endif\n" +
        "                #else\n" +
        "                    vec3 ao = vec3(1.0f);\n" +
        "                #endif\n" +
        "\n" +
        "                float ndotv = max( dot( normal, viewDir ), 0.0f );\n" +
        "                for( int i = 0;i < Context.CurLightCount;i+=3 ){\n" +
        "                    lightColor = Context.WLightData[i];\n" +
        "                    lightData1 = Context.WLightData[i + 1];\n" +
        "                    ComputeLightDir(wPosition, lightColor.w, lightData1, lightDir, lightVec);\n" +
        "\n" +
        "                    // 计算PointLight的衰减\n" +
        "                    float spotFallOff = 1.0 * lightDir.w;\n" +
        "                    // 计算SpotLight的衰减\n" +
        "                    if( lightColor.w > 1.0f )\n" +
        "                    {\n" +
        "                        // 计算SpotLight的范围衰减\n" +
        "                        spotFallOff = ComputeSpotFalloff( Context.WLightData[i + 2], lightDir.xyz );\n" +
        "                    }\n" +
        "\n" +
        "                    ComputeDirectLighting(normal, viewDir, lightDir.xyz, lightColor.rgb, _diffuseColor.rgb, fZero, _roughness, ndotv, directLighting);\n" +
        "                    Context.OutColor.rgb += directLighting * spotFallOff;\n" +
        "                }\n" +
        "\n" +
        "                if(Context.BlendGiProbes){\n" +
        "                    #ifdef Context.GIProbes\n" +
        "                        // 作为webGL项目,暂时不实现探针混合(但作为可拓展,仍然加结尾s命名)\n" +
        "\n" +
        "                        // 计算反射视线\n" +
        "                        vec3 _rv = reflect( -viewDir.xyz, normal.xyz );\n" +
        "                        float _r = fract( Context.WGIProbe.w );\n" +
        "                        float _mipMaps = Context.WGIProbe.w - _r;\n" +
        "                        _rv = _r * ( wPosition.xyz - Context.WGIProbe.xyz ) + _rv;\n" +
        "\n" +
        "                        // 使用球谐计算diffuse( 避免Irr采样 )\n" +
        "                        vec3 giLighting = sphericalHarmonics(normal.xyz, Context.ShCoeffs) * _diffuseColor.rgb;\n" +
        "\n" +
        "                        float horiz = dot(_rv, wNormal);\n" +
        "                        float horizFadePower = 1.0f - _roughness;\n" +
        "                        horiz = clamp( 1.0f + horizFadePower * horiz, 0.0f, 1.0f );\n" +
        "                        horiz *= horiz;\n" +
        "\n" +
        "                        vec3 _dominantR = getSpecularDominantDir( normal, _rv.xyz, _roughness * _roughness );\n" +
        "                        giLighting += approximateSpecularIBLPolynomial(Context.InPrefEnvMap, _specularColor.rgb, _roughness, ndotv, _dominantR, _mipMaps) * vec3( horiz );\n" +
        "                        giLighting *= ao;\n" +
        "\n" +
        "                        Context.OutColor.rgb += giLighting * step( 0.0f, Context.WGIProbe.w );\n" +
        "                        // Context.OutColor.rgb = textureLod(Context.InPrefEnvMap, normal.xyz, 0.0f).rgb;\n" +
        "                    #endif\n" +
        "                }\n" +
        "\n" +
        "                // 唯一shading阶段,在这里处理自发光或只shading一次的逻辑\n" +
        "                if(Context.UniqueShading){\n" +
        "                    #ifdef Params.emissive\n" +
        "                        float _emissivePower = 3.0f;\n" +
        "                        #ifdef Params.emissivePower\n" +
        "                            _emissivePower = Params.emissivePower;\n" +
        "                        #endif\n" +
        "                        float _emissiveIntensity = 2.0f;\n" +
        "                        #ifdef Params.emissiveIntensity\n" +
        "                            _emissiveIntensity = Params.emissiveIntensity;\n" +
        "                        #endif\n" +
        "                        #ifdef Params.emissiveMap\n" +
        "                            vec4 eMap = texture(Params.emissiveMap, wUv0);\n" +
        "                            Context.OutColor.rgb += Params.emissive.rgb * eMap.rgb * pow(Params.emissive.a * eMap.a, _emissivePower) * _emissiveIntensity;\n" +
        "                        #else\n" +
        "                            Context.OutColor.rgb += Params.emissive.rgb * pow(Params.emissive.a, _emissivePower) * _emissiveIntensity;\n" +
        "                        #endif\n" +
        "                    #else\n" +
        "                        #ifdef Params.emissiveMap\n" +
        "                            float _emissivePower = 3.0f;\n" +
        "                            #ifdef Params.emissivePower\n" +
        "                                _emissivePower = Params.emissivePower;\n" +
        "                            #endif\n" +
        "                            float _emissiveIntensity = 2.0f;\n" +
        "                            #ifdef Params.emissiveIntensity\n" +
        "                                _emisiveIntensity = Params.emissiveIntensity;\n" +
        "                            #endif\n" +
        "                            vec4 eMap = texture(Params.emissiveMap, wUv0);\n" +
        "                            Context.OutColor.rgb += eMap.rgb * pow(eMap.a, _emissivePower) * _emissiveIntensity;\n" +
        "                        #endif\n" +
        "                    #endif\n" +
        "                }\n" +
        "\n" +
        "                Context.OutColor.a = albedo.a;\n" +
        "\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "\n" +
        "    Technology{\n" +
        "        Sub_Pass{\n" +
        "            Pass SPPrincipledLighting{\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}\n";
}
