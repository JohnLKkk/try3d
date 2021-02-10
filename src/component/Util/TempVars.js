import Vector3 from "../Math3d/Vector3.js";
import Matrix44 from "../Math3d/Matrix44.js";

/**
 * 这个类提供一系列临时变量,避免重复创建缓存。<br/>
 * @author Kkk
 * @date 2021年2月2日17点59分
 */
export default class TempVars {
    static S_TEMP_VEC3 = new Vector3();
    static S_TEMP_MAT4 = new Matrix44();
    static S_TEMP_MAT4_1 = new Matrix44();
    static S_TEMP_MAT4_2 = new Matrix44();
    static S_TEMP_MAT4_3 = new Matrix44();
    constructor() {
    }

}
