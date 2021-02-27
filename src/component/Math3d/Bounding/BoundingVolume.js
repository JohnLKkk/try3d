/**
 * 包围体。<br/>
 * 所有包围边界体的根类。<br/>
 * @author Kkk
 * @date 2021年2月24日15点33分
 */
export default class BoundingVolume {
    static S_TYPE_AABB = 0;
    static S_TYPE_SPHERE = 1;
    constructor(props) {
        // 优先检测面
        this._m_PriorityPlane = 0;
    }

    /**
     * 返回包围体类型。<br/>
     * @return {Number}[无效包围体返回-1]
     */
    getType(){
        return -1;
    }

    /**
     * 返回处于平面的哪一边。<br/>
     * @param {Plane}[plane]
     */
    whichSide(plane){};

    /**
     * 将当前包围体初始化为指定包围体。<br/>
     * @param {BoundingVolume}
     */
    setTo(boundingVolume){};

    /**
     * 将缩放，旋转和平移变换应用到包围体。<br/>
     * @param {Vector3}[scale 缩放]
     * @param {Quaternion}[rotation 旋转]
     * @param {Vector3}[translation 平移]
     * @param {BoundingVolume}[result 存放结果,可为null]
     */
    transform(scale, rotation, translation, result){};

    /**
     * 合并一个BoundingVolume。<br/>
     * @param {BoundingVolume}[boundingVolume]
     * @return {BoundingVolume}
     */
    merge(boundingVolume){return null;};

    /**
     * 设置优先检测面。<br/>
     * 告诉引擎优先检测视锥体哪个平面。<br/>
     * @param {Number}[priorityPlane]
     */
    setPriorityPlane(priorityPlane){
        this._m_PriorityPlane = priorityPlane;
    }

    /**
     * 返回优先检测面。<br/>
     * @return {Number}
     */
    getPriorityPlane(){
        return this._m_PriorityPlane;
    }

    /**
     * 返回于指定包围体是否包含。<br/>
     * 如果完全包含，则返回true，否则返回false。<br/>
     * @param {BoundingVolume}[boundingVolume]
     * @return {Boolean}
     */
    contains(boundingVolume){
        return false;
    }
}
