/**
 * Joint定义了骨骼关节。<br/>
 * @author Kkk
 * @date 2021年3月8日16点06分
 */
import Matrix44 from "../../Math3d/Matrix44.js";

export default class Joint {
    static S_TEMP_MAT4 = new Matrix44();
    static S_TEMP_MAT42 = new Matrix44();
    constructor(bone) {
        this._m_Bone = bone;
        this._m_Bone.bind(this);
        // 相对矩阵(bone.getLocalMatrix())
        this._m_RelMat4 = new Matrix44();
        this._m_RelMat4.set(bone.getLocalMatrix());
        // 绝对空间矩阵
        this._m_AbsMat4 = new Matrix44();
        // 关节空间矩阵
        this._m_InverseMat4 = new Matrix44();
        // 关节矩阵
        this._m_JointMat4 = new Matrix44();
    }

    /**
     * 设置关节空间。<br/>
     * @param {Number[]}[array]
     */
    setJointSpace(array){
        this._m_InverseMat4.setArray(array);
        Matrix44.multiplyMM(this._m_AbsMat4, 0, this._m_RelMat4, 0, this._m_InverseMat4, 0);
    }

    /**
     * 返回骨骼矩阵。<br/>
     * @return {Matrix44}
     */
    getJointMat4(){
        return this._m_JointMat4;
    }

    /**
     * 更新关节。<br/>
     * @param {Number}[exTime]
     */
    update(exTime){
        // 骨骼变换是Bone的localMatrix
        // 从根骨骼开始
        // jointMat4 = parentJointMat4 * absMat4 * bone.getLocalMatrix() * inverseMat4;
        Matrix44.multiplyMM(Joint.S_TEMP_MAT4, 0, this._m_Bone.getLocalMatrix(), 0, this._m_InverseMat4, 0);
        if(this._m_Bone.getParent()){
            Matrix44.multiplyMM(Joint.S_TEMP_MAT42, 0, this._m_AbsMat4, 0, Joint.S_TEMP_MAT4, 0);
            Matrix44.multiplyMM(this._m_JointMat4, 0, this._m_Bone.getBind().getJointMat4(), 0, Joint.S_TEMP_MAT42, 0);
        }
        else{
            Matrix44.multiplyMM(this._m_JointMat4, 0, this._m_AbsMat4, 0, Joint.S_TEMP_MAT4, 0);
        }
    }

}
