/**
 * Plane。<br/>
 * 平面的数学定义，关于平面的数学定义，参考如下链接解释:<br/>
 * <a>http://www.songho.ca/math/plane/plane.html</a>,<br/>
 * 简而言之,平面由以下代数方程描述:a * x + b * y + c * z + d = 0,<br/>
 * 其中(a,b,c)表示平面的法线,而d而常量,表示平面距离原点的距离。<br/>
 * @author Kkk
 * @date 2021年2月24日16点06分
 */
import Vector3 from "./Vector3.js";

export default class Plane {
    // 平面的正方向上
    static S_SIDE_POSITIVE = 1;
    // 平面的反方向上
    static S_SIDE_NEGATIVE = Plane.S_SIDE_POSITIVE << 1;
    // 平面上
    static S_SIDE_NONE = Plane.S_SIDE_POSITIVE << 2;

    constructor() {
        // 平面的法线
        this._m_Normal = new Vector3();
        // 平面的距离原点的距离常量
        this._m_D = 0;
    }

    /**
     * 设置平面距离原点的距离常量。<br/>
     * @param {Number}[d]
     */
    setD(d){
        this._m_D = d;
    }

    /**
     * 返回平面距离原点的距离常量。<br/>
     * @return {Number}
     */
    getD(){
        return this._m_D;
    }

    /**
     * 设置平面的法线。<br/>
     * @param {Vector3}[normal 这里假设已经归一化]
     */
    setNormal(normal){
        this._m_Normal.setTo(normal);
        this._m_Normal.normal();
    }

    /**
     * 设置平面的法线。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     */
    setNormaXYZ(x, y, z){
        this._m_Normal.setToInXYZ(x, y, z);
        this._m_Normal.normal();
    }

    /**
     * 返回平面法线。<br/>
     * @return {Vector3}
     */
    getNormal(){
        return this._m_Normal;
    }

    /**
     * 返回点到平面的距离，距离包含正负，如果处于平面返回0。<br/>
     * @param {Vector3}[point]
     * @return {Number}
     */
    distance(point){
        // 带入平面定义方程
        return this._m_Normal.dot(point) - this._m_D;
    }

}
