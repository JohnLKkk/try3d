import Component from "../../Component.js";
import Matrix44 from "../../Math3d/Matrix44.js";
import Vector3 from "../../Math3d/Vector3.js";
import Node from "../../Node/Node.js";
import Log from "../../Util/Log.js";
import Quaternion from "../../Math3d/Quaternion.js";

/**
 * BillboardControl提供对scene中指定node的Billboard化操作。<br/>
 * @author Kkk
 * @date 2022年5月29日14点24分
 */
export default class BillboardControl extends Component{
    static Alignment = {
        // 将此广告牌与屏幕对齐。
        Screen : 0x001,
        // 将此广告牌与摄像机位置对齐。
        Camera : 0x002,
        // 将此广告牌与屏幕对齐，但保持 Y 轴固定。
        AxialY : 0x003,
        // 将此广告牌与屏幕对齐，但保持 Z 轴固定。
        AxialZ : 0x004
    };
    constructor(owner, cfg) {
        super(owner, cfg);
        if(!(owner instanceof Node)){
            Log.error('owner必须是Geometry或其子类!');
        }
        this._m_Orient = new Matrix44();
        this._m_Look = new Vector3();
        this._m_Left = new Vector3();
        this._m_Alignment = BillboardControl.Alignment.Screen;
        this._m_TempQ = new Quaternion();
        this._m_TempQ2 = new Quaternion();
        this._m_TempVec3_1 = new Vector3();
        this._m_TempVec3_2 = new Vector3();
        // 默认的对齐相机为主场景主相机
        this._m_AlignmentCamera = this._m_Scene.getComponent('mainCamera');
        this._m_Scene.on('render', (exTime)=>{
            this._doUpdate();
        });
    }

    /**
     * 设置对齐相机,只有当对齐模式是Camera时才有效。<br/>
     * @param {Camera}[alignmentCamera]
     */
    setAlignmentCamera(alignmentCamera){
        this._m_AlignmentCamera = alignmentCamera;
    }

    /**
     * 返回对齐相机，默认为主场景主相机。<br/>
     * @returns {Camera}
     */
    getAlignmentCamera(){
        return this._m_AlignmentCamera;
    }

    /**
     * 设置对齐模式,必须是BillboardControl.Alignment有效枚举之一。<br/>
     * @param {BillboardControl.Alignment}[alignment]
     */
    setAlignment(alignment){
        this._m_Alignment = alignment;
    }

    /**
     * 返回对齐模式，是BillboardControl.Alignment有效枚举之一，默认为Screen。<br/>
     * @returns {BillboardControl.Alignment}
     */
    getAlignment(){
        return this._m_Alignment;
    }

    /**
     * 重载_update方法。<br/>
     * @private
     */
    _update(){
        this._rotateBillboard();
    }
    _rotateBillboard(){
        switch (this._m_Alignment) {
            case BillboardControl.Alignment.Screen:
                this._rotateScreenAligned();
                break;
            case BillboardControl.Alignment.Camera:
                break;
            case BillboardControl.Alignment.AxialY:
                this._rotateAxial(Vector3.S_UNIT_AXIS_Y);
                break;
            case BillboardControl.Alignment.AxialZ:
                this._rotateAxial(Vector3.S_UNIT_AXIS_Z);
                break;
        }
    }
    _rotateScreenAligned(){
        this._m_Look.setTo(this._m_AlignmentCamera.getDir()).negateLocal();
        this._m_Look.cross(this._m_AlignmentCamera.getUp(), this._m_Left);
        this._m_Left.negateLocal();
        this._m_Orient.fromAxis(this._m_Left, this._m_AlignmentCamera.getUp(), this._m_Look);
        this._m_TempQ.fromMat44(this._m_Orient);
        let parent = this._m_Owner.getParent();
        if(parent){
            // 消除父节点旋转部分
            // 解析变换信息
            Matrix44.decomposeMat4(parent.getWorldMatrix(), this._m_TempVec3_1, this._m_TempQ2, this._m_TempVec3_2);
            this._m_TempQ = this._m_TempQ2.inverse().mult(this._m_TempQ);
        }
        this._m_Owner.setLocalRotation(this._m_TempQ);
    }
    _rotateAxial(axis){
        // 计算广告牌面向相机所需的额外旋转。 为此，必须将相机逆变换到广告牌的模型空间中。
        Matrix44.decomposeMat4(this._m_Owner.getWorldMatrix(), this._m_TempVec3_1, this._m_TempQ2, this._m_TempVec3_2);
        this._m_Look.setTo(this._m_AlignmentCamera.getEye()).sub(this._m_TempVec3_1);
        let parent = this._m_Owner.getParent();
        if(parent){
            Matrix44.decomposeMat4(parent.getWorldMatrix(), this._m_TempVec3_1, this._m_TempQ2, this._m_TempVec3_2);
            this._m_TempQ2.multVec3(this._m_Look, this._m_Left);
            this._m_Left._m_X *= 1.0 / this._m_TempVec3_2._m_X;
            this._m_Left._m_Y *= 1.0 / this._m_TempVec3_2._m_Y;
            this._m_Left._m_Z *= 1.0 / this._m_TempVec3_2._m_Z;

            // xz 平面中相机投影的平方长度
            let lengthSquared = this._m_Left._m_X * this._m_Left._m_X + this._m_Left._m_Z * this._m_Left._m_Z;
            if(lengthSquared < 1.1920928955078125E-7){
                // 广告牌轴上的相机，未定义旋转
                return;
            }

            // 统一投影
            let invLength = 1.0 / Math.sqrt(lengthSquared);
            if(axis._m_Y == 1){
                this._m_Left._m_X *= invLength;
                this._m_Left._m_Y = 0.0;
                this._m_Left._m_Z *= invLength;

                // 计算广告牌的局部方向矩阵
                this._m_Orient.setRC(0, 0, this._m_Left._m_Z);
                this._m_Orient.setRC(0, 1, 0);
                this._m_Orient.setRC(0, 2, -this._m_Left._m_X);
                this._m_Orient.setRC(1, 0, 0);
                this._m_Orient.setRC(1, 1, 1);
                this._m_Orient.setRC(1, 2, 0);
                this._m_Orient.setRC(2, 0, this._m_Left._m_X);
                this._m_Orient.setRC(2, 1, 0);
                this._m_Orient.setRC(2, 2, this._m_Left._m_Z);
            }
            else if(axis._m_Z == 1){
                this._m_Left._m_X *= invLength;
                this._m_Left._m_Y *= invLength;
                this._m_Left._m_Z = 0.0;

                // 计算广告牌的局部方向矩阵
                this._m_Orient.setRC(0, 0, this._m_Left._m_Y);
                this._m_Orient.setRC(0, 1, -this._m_Left._m_X);
                this._m_Orient.setRC(0, 2, 0);
                this._m_Orient.setRC(1, 0, -this._m_Left._m_Y);
                this._m_Orient.setRC(1, 1, this._m_Left._m_X);
                this._m_Orient.setRC(1, 2, 0);
                this._m_Orient.setRC(2, 0, 0);
                this._m_Orient.setRC(2, 1, 0);
                this._m_Orient.setRC(2, 2, 1);
            }

            // 在将广告牌转换为世界之前，广告牌必须面向相机。
            this._m_TempQ.fromMat44(this._m_Orient);
            this._m_Owner.setLocalRotation(this._m_TempQ);
        }
    }

}