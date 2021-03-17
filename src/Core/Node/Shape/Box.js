import Geometry from "../Geometry.js";
import Mesh from "../../WebGL/Mesh.js";
import Tools from "../../Util/Tools.js";

/**
 * Box。<br/>
 * @author Kkk
 * @date 2021年2月22日16点52分
 */
export default class Box extends Geometry{
    getType(){
        return 'Box';
    }
    /**
     * 创建一个Box。<br/>
     * @param {Component}[owner]
     * @param {String}[cfg.id]
     * @param {Number}[cfg.xHalf x方向的半长度]
     * @param {Number}[cfg.yHalf y方向的半长度]
     * @param {Number}[cfg.zHalf z方向的半长度]
     * @param {Vector3}[cfg.center 中心点]
     */
    constructor(owner, cfg) {
        super(owner, cfg);
        let xHalf = cfg.xHalf || 1;
        if (xHalf <= 0) {
            console.error("xHalf不能小于等于0!");
            xHalf *= -1;
        }

        let yHalf = cfg.yHalf || 1;
        if (yHalf <= 0) {
            console.error("yHalf不能小于等于0!");
            yHalf *= -1;
        }

        let zHalf = cfg.zHalf || 1;
        if (zHalf <= 0) {
            console.error("zHalf不能小于等于0!");
            zHalf *= -1;
        }

        const center = cfg.center;
        const centerX = center ? center._m_X : 0;
        const centerY = center ? center._m_Y : 0;
        const centerZ = center ? center._m_Z : 0;

        const xmin = -xHalf + centerX;
        const ymin = -yHalf + centerY;
        const zmin = -zHalf + centerZ;
        const xmax = xHalf + centerX;
        const ymax = yHalf + centerY;
        const zmax = zHalf + centerZ;

        let mesh = new Mesh();
        mesh.setData(Mesh.S_POSITIONS, [
            // v0-v1-v2-v3 front
            xmax, ymax, zmax,
            xmin, ymax, zmax,
            xmin, ymin, zmax,
            xmax, ymin, zmax,

            // v0-v3-v4-v1 right
            xmax, ymax, zmax,
            xmax, ymin, zmax,
            xmax, ymin, zmin,
            xmax, ymax, zmin,

            // v0-v1-v6-v1 top
            xmax, ymax, zmax,
            xmax, ymax, zmin,
            xmin, ymax, zmin,
            xmin, ymax, zmax,

            // v1-v6-v7-v2 left
            xmin, ymax, zmax,
            xmin, ymax, zmin,
            xmin, ymin, zmin,
            xmin, ymin, zmax,

            // v7-v4-v3-v2 bottom
            xmin, ymin, zmin,
            xmax, ymin, zmin,
            xmax, ymin, zmax,
            xmin, ymin, zmax,

            // v4-v7-v6-v1 back
            xmax, ymin, zmin,
            xmin, ymin, zmin,
            xmin, ymax, zmin,
            xmax, ymax, zmin
        ]);
        mesh.setData(Mesh.S_NORMALS, [
            // v0-v1-v2-v3 front
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            // v0-v3-v4-v5 right
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,

            // v0-v5-v6-v1 top
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            // v1-v6-v7-v2 left
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,

            // v7-v4-v3-v2 bottom
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,

            // v4-v7-v6-v5 back
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1
        ]);
        mesh.setData(Mesh.S_UV0, [
            // v0-v1-v2-v3 front
            1, 0,
            0, 0,
            0, 1,
            1, 1,

            // v0-v3-v4-v1 right
            0, 0,
            0, 1,
            1, 1,
            1, 0,

            // v0-v1-v6-v1 top
            1, 1,
            1, 0,
            0, 0,
            0, 1,

            // v1-v6-v7-v2 left
            1, 0,
            0, 0,
            0, 1,
            1, 1,

            // v7-v4-v3-v2 bottom
            0, 1,
            1, 1,
            1, 0,
            0, 0,

            // v4-v7-v6-v1 back
            0, 1,
            1, 1,
            1, 0,
            0, 0
        ]);
        mesh.setData(Mesh.S_INDICES, [
            0, 1, 2,
            0, 2, 3,
            // front
            4, 5, 6,
            4, 6, 7,
            // right
            8, 9, 10,
            8, 10, 11,
            // top
            12, 13, 14,
            12, 14, 15,
            // left
            16, 17, 18,
            16, 18, 19,
            // bottom
            20, 21, 22,
            20, 22, 23
        ]);

        // 切线数据
        let tangents = Tools.generatorTangents(mesh.getData(Mesh.S_INDICES), mesh.getData(Mesh.S_POSITIONS), mesh.getData(Mesh.S_UV0));
        mesh.setData(Mesh.S_TANGENTS, tangents);

        this.setMesh(mesh);
        this.updateBound();
    }

}
