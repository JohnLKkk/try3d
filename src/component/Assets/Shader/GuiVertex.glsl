#version 300
layout (location=0x001) in vec3 position;
void main() {
    gl_Position = vec4(position, 1.0f);
}
