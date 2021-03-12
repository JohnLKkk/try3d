/**
 * Skeleton。<br/>
 * 定义了蒙皮动画的骨架部分。<br/>
 * @author Kkk
 * @date 2021年3月9日10点38分
 */
import ShaderSource from "../../WebGL/ShaderSource.js";
import Log from "../../Util/Log.js";

export default class Skeleton {
    constructor(name) {
        this._m_Name = name;
        this._m_Joints = [];
        this._m_ActiveJoints = [];
        this._m_IsReady = false;
        this._m_Finished = true;

        this._m_OwnerShaders = {};
    }

    /**
     * 初始化骨架。<br/>
     * @param {WebGL}[gl]
     * @param {FrameContext}[frameContext]
     */
    init(gl, frameContext){
        if(this._m_IsReady){
            return;
        }
        this._m_IsReady = true;
        // 初始化骨骼数据
        this._m_Joints.forEach(joint=>{
            joint.setRef(frameContext.m_LastSubShader.getRef(gl, ShaderSource.S_JOINTS_SRC + "[" + joint.getNum() + "]"));
            joint.init(gl);
        });
    }

    /**
     * 是否就绪。<br/>
     * @return {Boolean}
     */
    isReady(){
        return this._m_IsReady;
    }

    /**
     * 保持关节关联。<br/>
     * @param {WebGL}[gl]
     * @param {FrameContext}[frameContext]
     * @return {Boolean}
     */
    owner(gl, frameContext){
        if(this._m_OwnerShaders[frameContext.m_LastSubShader.getSId()]){
            return true;
        }
        // 初始化骨骼数据
        this._m_Joints.forEach(joint=>{
            joint.addRef(frameContext.m_LastSubShader.getSId(), frameContext.m_LastSubShader.getRef(gl, ShaderSource.S_JOINTS_SRC + "[" + joint.getNum() + "]"));
            joint.init(gl, frameContext.m_LastSubShader.getSId());
        });
        this._m_OwnerShaders[frameContext.m_LastSubShader.getSId()] = true;
        Log.log('持有!');
        return true;
    }

    /**
     * 骨架是否完整性，在骨架不完整时将不会渲染与之关联的模型。<br/>
     * @return {Boolean}
     */
    isFinished(){
        return this._m_Finished;
    }

    /**
     * 表示骨架已经完整。<br/>
     */
    finished(){
        this._m_Finished = true;
    }

    /**
     * 返回活跃关节。<br/>
     * @return {Joint[]}
     */
    getActiveJoints(){
        return this._m_ActiveJoints;
    }

    /**
     * 添加活跃关节。<br/>
     * @param {Joint}[joint]
     */
    addActiveJoint(joint){
        this._m_ActiveJoints.push(joint);
    }

    /**
     * 设置关节数据。<br/>
     * @param {Joint[]}[joints]
     */
    setJoints(joints){
        this._m_Joints.length = 0;
        joints.forEach(joint=>{
            this._m_Joints.push(joint);
            joint.setOwnerSkeleton(this);
        });
    }

    /**
     * 返回所有关节。<br/>
     * @return {Joint[]}
     */
    getJoints(){
        return this._m_Joints;
    }

    /**
     * 添加一个关节到指定位置。<br/>
     * @param {Number}[index]
     * @param {Joint}[joint]
     */
    addJointAtIndex(index, joint){
        this._m_Joints[index] = joint;
        joint.setOwnerSkeleton(this);
    }

    /**
     * 添加一个关节。<br/>
     * @param {Joint}[joint]
     */
    addJoint(joint){
        this._m_Joints.push(joint);
        joint.setOwnerSkeleton(this);
    }

    /**
     * 更新关节数据。<br/>
     * @param {WebGL}[gl]
     * @param {FrameContext}[frameContext]
     */
    updateJoints(gl, frameContext){
        if(this._m_ActiveJoints.length > 0){
            this._m_ActiveJoints.forEach(activeJoint=>{
                activeJoint.update(gl, frameContext.m_LastSubShader.getSId());
                activeJoint.disable();
            });
            this._m_ActiveJoints.length = 0;
        }
    }

}
