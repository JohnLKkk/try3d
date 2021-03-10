/**
 * Joint定义了骨骼关节。<br/>
 * @author Kkk
 * @date 2021年3月8日16点06分
 */
import Matrix44 from "../../Math3d/Matrix44.js";
import Log from "../../Util/Log.js";
import Quaternion from "../../Math3d/Quaternion.js";
import MoreMath from "../../Math3d/MoreMath.js";

export default class Joint {
    static S_TEMP_MAT4 = new Matrix44();
    static S_TEMP_MAT42 = new Matrix44();
    constructor(id) {
        // 持有骨架
        this._m_OwnerSkeleton = null;
        // 骨骼节点
        this._m_Bone = null;
        this._m_Ref = -1;
        // 关节Id
        this._m_Id = id;
        // 相对矩阵(bone.getLocalMatrix())
        this._m_RelMat4 = new Matrix44();
        // 绝对空间矩阵
        this._m_AbsMat4 = new Matrix44();
        // 关节空间矩阵
        this._m_InverseMat4 = new Matrix44();
        // 关节矩阵
        this._m_JointMat4 = new Matrix44();
        // 活跃状态
        this._m_IsActive = false;
    }

    /**
     * 激活为活跃关节。<br/>
     */
    actived(){
        if(this._m_IsActive){
            return;
        }
        this._m_IsActive = true;
        this._m_OwnerSkeleton.addActiveJoint(this);
    }

    /**
     * 关闭活跃状态。<br/>
     */
    disable(){
        this._m_IsActive = false;
    }

    /**
     * 设置Ref。<br/>
     * @param {WebGLUniformLocation}[ref]
     */
    setRef(ref){
        this._m_Ref = ref;
    }
    init(gl){
        this.update(gl);
        // Log.log('joint_' + this.getId() + ";jointMat4:" + this._m_JointMat4.toString());
        // gl.uniformMatrix4fv(this._m_Ref, false, this._m_JointMat4.getBufferData());
    }

    /**
     * 返回关节ID。<br/>
     * @return {Number}
     */
    getId(){
        return this._m_Id;
    }

    /**
     * 设置持有骨架。<br/>
     * @param {Skeleton}[ownerSkeleton]
     */
    setOwnerSkeleton(ownerSkeleton){
        this._m_OwnerSkeleton = ownerSkeleton;
    }

    /**
     * 链接到骨骼。<br/>
     * @param {Bone}[bone]
     */
    link(bone){
        this._m_Bone = bone;
        this._m_Bone.bind(this);
        // 相对矩阵(bone.getLocalMatrix())
        this._m_RelMat4.set(bone.getLocalMatrix());
        Log.log('link ' + bone.getId());
    }

    /**
     * 设置关节空间。<br/>
     * @param {Number[]}[array]
     */
    setJointSpace(array){
        this._m_InverseMat4.setArray(array);
        // 假设inverseMat4存储了绝对逆矩阵
        // 所以mAbs = inverse(inverseMat4);
        // Matrix44.multiplyMM(this._m_AbsMat4, 0, this._m_RelMat4, 0, this._m_InverseMat4, 0);
        this._m_InverseMat4.inertRetNew(this._m_AbsMat4);
        Log.log('_m_InverseMat4:\n' + this._m_InverseMat4.toString());
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
     */
    update(gl){
        // Log.log("更新关节!");
        // 骨骼变换是Bone的localMatrix
        // 从根骨骼开始
        // jointMat4 = parentJointMat4 * absMat4 * bone.getLocalMatrix() * inverseMat4;
        Matrix44.multiplyMM(Joint.S_TEMP_MAT4, 0, this._m_Bone.getLocalMatrix(), 0, this._m_InverseMat4, 0);
        // if(this.getId() == 0){
        //     let q = new Quaternion();
        //     q.fromEuler(0, MoreMath.toRadians(25), 0);
        //     Matrix44.multiplyMM(Joint.S_TEMP_MAT4, 0, Matrix44.fromQuaternion(q, new Matrix44()), 0, this._m_InverseMat4, 0);
        // }
        // else{
        //     let q = new Quaternion();
        //     q.fromEuler(0, MoreMath.toRadians(15), 0);
        //     Matrix44.multiplyMM(Joint.S_TEMP_MAT4, 0, Matrix44.fromQuaternion(q, new Matrix44()), 0, this._m_InverseMat4, 0);
        // }
        // Log.log("this._m_Bone.getLocalMatrix():" + this._m_Bone.getLocalMatrix().toString());
        if(this._m_Bone.getParent() && this._m_Bone.getParent().getType() == 'Bone'){
            Matrix44.multiplyMM(Joint.S_TEMP_MAT42, 0, this._m_AbsMat4, 0, Joint.S_TEMP_MAT4, 0);
            Matrix44.multiplyMM(this._m_JointMat4, 0, this._m_Bone.getParent().getBind().getJointMat4(), 0, Joint.S_TEMP_MAT42, 0);
        }
        else{
            Matrix44.multiplyMM(this._m_JointMat4, 0, this._m_AbsMat4, 0, Joint.S_TEMP_MAT4, 0);
        }
        gl.uniformMatrix4fv(this._m_Ref, false, this._m_JointMat4.getBufferData());
    }

}
