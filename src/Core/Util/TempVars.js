import Vector3 from "../Math3d/Vector3.js";
import Matrix44 from "../Math3d/Matrix44.js";
import UniformBuffer from "../WebGL/UniformBuffer.js";
import Vector4 from "../Math3d/Vector4.js";

/**
 * 这个类提供一系列临时变量,避免重复创建缓存。<br/>
 * @author Kkk
 * @date 2021年2月2日17点59分
 */
export default class TempVars {
    static S_TEMP_VEC3 = new Vector3();
    static S_TEMP_VEC4 = new Vector4();
    static S_TEMP_VEC4_2 = new Vector4();
    static S_TEMP_MAT4 = new Matrix44();
    static S_TEMP_MAT4_1 = new Matrix44();
    static S_TEMP_MAT4_2 = new Matrix44();
    static S_TEMP_MAT4_3 = new Matrix44();

    // 最大缓存4个灯光,每个灯光3个数据段,每个段是一个vec4(4个float)
    static S_LIGHT_DATA_4 = new UniformBuffer(4 * 3 * 4);
    // 最大缓存8个灯光,每个灯光3个数据段,每个段是一个vec4(4个float)
    static S_LIGHT_DATA_8 = new UniformBuffer(8 * 3 * 4);
    // 9个球谐系数,每个系数3个float
    static S_SH_COEFFS = new UniformBuffer(9 * 3);
    constructor() {
    }

}
