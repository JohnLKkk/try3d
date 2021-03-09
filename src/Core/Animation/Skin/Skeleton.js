/**
 * Skeleton。<br/>
 * 定义了蒙皮动画的骨架部分。<br/>
 * @author Kkk
 * @date 2021年3月9日10点38分
 */
export default class Skeleton {
    constructor(name) {
        this._m_Name = name;
        this._m_Joints = [];
        this._m_ActiveJoints = [];
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
    }

    /**
     * 添加一个关节。<br/>
     * @param {Joint}[joint]
     */
    addJoint(joint){
        this._m_Joints.push(joint);
    }

    /**
     * 更新关节数据。<br/>
     * @param {WebGL}
     */
    updateJoints(gl){
        if(this._m_ActiveJoints.length > 0){
            this._m_ActiveJoints.forEach(activeJoint=>{
                activeJoint.update(gl);
            });
            this._m_ActiveJoints = 0;
        }
    }

}
