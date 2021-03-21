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
}
