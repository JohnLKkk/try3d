/**
 * AABB包围盒。<br/>
 * @author Kkk
 * @date 2021年2月24日15点36分
 */
import BoundingVolume from "./BoundingVolume.js";
import Plane from "../Plane.js";
import Vector3 from "../Vector3.js";

export default class AABBBoundingBox extends BoundingVolume{
    constructor(props) {
        super(props);
        this._m_XHalf = 0;
        this._m_YHalf = 0;
        this._m_ZHalf = 0;
        this._m_Center = new Vector3();
    }

    /**
     * 从顶点位置数组初始化AABB包围盒。<br/>
     * 其中包围盒中心点为几何中心。<br/>
     * @param {Number[]}[positions]
     */
    fromPositions(positions){
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let minZ = Number.MAX_VALUE;
        let maxX = -Number.MAX_VALUE;
        let maxY = -Number.MAX_VALUE;
        let maxZ = -Number.MAX_VALUE;
        // 遍历所有顶点
        for(let i = 0;i < positions.length;i += 3){
            minX = Math.min(positions[i], minX);
            minY = Math.min(positions[i + 1], minY);
            minZ = Math.min(positions[i + 2], minZ);

            maxX = Math.max(positions[i], maxX);
            maxY = Math.max(positions[i + 1], maxY);
            maxZ = Math.max(positions[i + 2], maxZ);
        }
        // 中心点
        this._m_Center.setToInXYZ(minX + maxX, minY + maxY, minZ + maxZ);
        this._m_Center.multLength(0.5);

        // 半径
        this._m_XHalf = Math.abs(maxX - this._m_Center._m_X);
        this._m_YHalf = Math.abs(maxY - this._m_Center._m_Y);
        this._m_ZHalf = Math.abs(maxZ - this._m_Center._m_Z);
    }

    /**
     * 从min,max边界范围初始化AABB包围盒。<br/>
     * 其中包围盒中心点为min,max几何中心。<br/>
     * @param {Vector3}[min]
     * @param {Vector3}[max]
     */
    fromMinMax(min, max){
        this._m_Center.setTo(max);
        this._m_Center.add(min);
        this._m_Center.multLength(0.5);
        // 计算半径
        this._m_XHalf = Math.abs(max._m_X - this._m_Center._m_X);
        this._m_YHalf = Math.abs(max._m_Y - this._m_Center._m_Y);
        this._m_ZHalf = Math.abs(max._m_Z - this._m_Center._m_Z);
    }

    /**
     * 返回处于平面的哪一边。<br/>
     * @param {Plane}[plane]
     * @return {Number}[Plane.S_SIDE_POSITIVE/Plane.S_SIDE_NEGATIVE/Plane.NONE]
     */
    whichSide(plane){
        // 判断当前包围盒中心点到平面的距离
        let distance = plane.distance(this._m_Center);

        // 计算AABB包围盒沿着平面方向的半径
        let planeNormal = plane.getNormal();
        let radius = Math.abs(this._m_XHalf * planeNormal._m_X) + Math.abs(this._m_YHalf * planeNormal._m_Y) + Math.abs(this._m_ZHalf * planeNormal._m_Z);

        // 如果距离大于半径,说明处于平面正方向
        if(distance > radius){
            return Plane.S_SIDE_POSITIVE;
        }
        // 如果距离小于-半径,说明处于平面反方向
        else if(distance < -radius){
            return Plane.S_SIDE_NEGATIVE;
        }
        // 否则处于平面上
        else{
            return Plane.S_SIDE_NONE;
        }
    }
}
