import Geometry from "../Geometry.js";
import Mesh from "../../WebGL/Mesh.js";
import Tools from "../../Util/Tools.js";

/**
 * Plane。<br/>
 * @author Kkk
 * @date 2021年2月22日17点18分
 */
export default class Plane extends Geometry{
    /**
     * 根据指定参数创建一个Plane。<br/>
     * @param {Component}[owner]
     * @param {Vector3}[cfg.center 中心点]
     * @param {Number}[cfg.xSize x方向半长,默认1]
     * @param {Number}[cfg.zSize z方向半长,默认1]
     * @param {Number}[cfg.xSegments x方向切片数量,默认1]
     * @param {Number}[cfg.zSegments z方向切片数量,默认1]
     */
    constructor(owner, cfg) {
        super(owner, cfg);
        // 创建Plane
        let xSize = cfg.xSize || 1;
        if (xSize <= 0) {
            console.error("xSize不能小于等于0!");
            xSize *= -1;
        }

        let zSize = cfg.zSize || 1;
        if (zSize <= 0) {
            console.error("zSize不能小于等于0!");
            zSize *= -1;
        }

        let xSegments = cfg.xSegments || 1;
        if (xSegments <= 0) {
            console.error("xSegments不能小于等于0!");
            xSegments *= -1;
        }
        if (xSegments < 1) {
            xSegments = 1;
        }

        let zSegments = cfg.zSegments || 1;
        if (zSegments < 0) {
            console.error("zSegments不能小于等于0!");
            zSegments *= -1;
        }
        if (zSegments < 1) {
            zSegments = 1;
        }

        const center = cfg.center;
        const centerX = center ? center[0] : 0;
        const centerY = center ? center[1] : 0;
        const centerZ = center ? center[2] : 0;

        const halfWidth = xSize / 2;
        const halfHeight = zSize / 2;

        const planeX = Math.floor(xSegments) || 1;
        const planeZ = Math.floor(zSegments) || 1;

        const planeX1 = planeX + 1;
        const planeZ1 = planeZ + 1;

        const segmentWidth = xSize / planeX;
        const segmentHeight = zSize / planeZ;

        const positions = new Float32Array(planeX1 * planeZ1 * 3);
        const normals = new Float32Array(planeX1 * planeZ1 * 3);
        const uvs = new Float32Array(planeX1 * planeZ1 * 2);

        let offset = 0;
        let offset2 = 0;

        let iz;
        let ix;
        let x;
        let a;
        let b;
        let c;
        let d;

        for (iz = 0; iz < planeZ1; iz++) {

            const z = iz * segmentHeight - halfHeight;

            for (ix = 0; ix < planeX1; ix++) {

                x = ix * segmentWidth - halfWidth;

                positions[offset] = x + centerX;
                positions[offset + 1] = centerY;
                positions[offset + 2] = -z + centerZ;

                normals[offset + 2] = -1;

                uvs[offset2] = (planeX - ix) / planeX;
                uvs[offset2 + 1] = ((planeZ - iz) / planeZ);

                offset += 3;
                offset2 += 2;
            }
        }

        offset = 0;

        const indices = new ((positions.length / 3) > 65535 ? Uint32Array : Uint16Array)(planeX * planeZ * 6);

        for (iz = 0; iz < planeZ; iz++) {

            for (ix = 0; ix < planeX; ix++) {

                a = ix + planeX1 * iz;
                b = ix + planeX1 * (iz + 1);
                c = (ix + 1) + planeX1 * (iz + 1);
                d = (ix + 1) + planeX1 * iz;

                indices[offset] = d;
                indices[offset + 1] = b;
                indices[offset + 2] = a;

                indices[offset + 3] = d;
                indices[offset + 4] = c;
                indices[offset + 5] = b;

                offset += 6;
            }
        }

        let mesh = new Mesh();
        mesh.setData(Mesh.S_POSITIONS, positions);
        mesh.setData(Mesh.S_NORMALS, normals);
        mesh.setData(Mesh.S_UV0, uvs);
        mesh.setData(Mesh.S_INDICES, indices);

        // 切线数据
        let tangents = Tools.generatorTangents(mesh.getData(Mesh.S_INDICES), mesh.getData(Mesh.S_POSITIONS), mesh.getData(Mesh.S_UV0));
        mesh.setData(Mesh.S_TANGENTS, tangents);

        this.setMesh(mesh);
        this.updateBound();
    }

}
