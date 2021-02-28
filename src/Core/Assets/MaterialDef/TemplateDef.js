"Def{" +
"   GlobalParams{" +
"       mat4 g_ModelMatrix;" +
"       mat4 g_ViewMatrix;" +
"       mat4 g_ProjectMatrix;" +
"   }" +
"   MaterialParams{" +
"       float color;" +
"   }" +
"   pass0{" +
"       vs{" +
"           in{" +
"               vec3 position;" +
"           }" +
"           out{" +
"               vec4 out_position;" +
"           }" +
"           void main(){" +
"               vs_Position = g_ProjectMatrix * g_ViewMatrix * g_ModelMatrix * vec4(position, 1.0);" +
"           }" +
"       }" +
"       fs{" +
"           in{" +
"               vec4 position = vs.out_position;" +
"           }" +
"           out{" +
"           }" +
"           void main(){" +
"               fs_Color = vec4(color, color, color, 1.0);" +
"           }" +
"       }" +
"   }" +
"}";