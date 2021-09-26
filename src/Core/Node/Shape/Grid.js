import Geometry from "../Geometry.js";
import Mesh from "../../WebGL/Mesh.js";
import Tools from "../../Util/Tools.js";

/**
 * Grid。<br/>
 * @author Kkk
 * @date 2021年9月26日16点35分
 */
export default class Grid extends Geometry{
    /**
     * 根据指定参数创建一个Grid。<br/>
     * @param {Component}[owner]
     * @param {String}[cfg.id]
     * @param {Number}[cfg.width x方向每个切片长度,默认1]
     * @param {Number}[cfg.height z方向每个切片长度,默认1]
     * @param {Number}[cfg.widthSegments x方向切片数量,默认1]
     * @param {Number}[cfg.heightSegments z方向切片数量,默认1]
     */
    constructor(owner, cfg) {
        super(owner, cfg);
        let width = cfg.width || 1.0;
        let height = cfg.height || 1.0;

        let widthSegments = cfg.widthSegments || 1;
        let heightSegments = cfg.heightSegments || 1;

        let positions = [];
        let normals = [];
        let uvs = [];
        let indices = [];

        let ix, iz;
        let halfWidth = width / 2;
        let halfHeight = height / 2;

        let gridX = widthSegments;
        let gridZ = heightSegments;

        let gridX1 = gridX + 1;
        let gridZ1 = gridZ + 1;

        let segWidth = width / gridX;
        let segHeight = height / gridZ;

        let x;
        let z;

        for (iz = 0; iz < gridZ1; iz++) {
            for (ix = 0; ix < gridX1; ix++) {

                x = ix * segWidth - halfWidth;
                z = iz * segHeight - halfHeight;

                positions.push(x);
                positions.push(0);
                positions.push(-z);

                normals.push(0);
                normals.push(1);
                normals.push(0);

                uvs.push(ix / gridX);
                uvs.push(1 - iz / gridZ);
            }
        }

        let a;
        let b;
        let c;
        let d;

        for (iz = 0; iz < gridZ; iz++) {
            for (ix = 0; ix < gridX; ix++) {

                a = ix + gridX1 * iz;
                b = ix + gridX1 * ( iz + 1 );
                c = ( ix + 1 ) + gridX1 * ( iz + 1 );
                d = ( ix + 1 ) + gridX1 * iz;

                indices.push(a);
                indices.push(b);
                indices.push(c);

                indices.push(c);
                indices.push(d);
                indices.push(a);
            }
        }

        let mesh = new Mesh();
        mesh.setData(Mesh.S_POSITIONS, positions);
        mesh.setData(Mesh.S_NORMALS, normals);
        mesh.setData(Mesh.S_UV0, uvs);
        mesh.setData(Mesh.S_INDICES, indices);

        // 切线数据
        let tangents = Tools.generatorTangents2(mesh.getData(Mesh.S_INDICES), mesh.getData(Mesh.S_POSITIONS), mesh.getData(Mesh.S_UV0), mesh.getData(Mesh.S_NORMALS));
        mesh.setData(Mesh.S_TANGENTS, tangents);
        mesh.setPrimitive(Mesh.S_PRIMITIVE_LINES);

        this.setMesh(mesh);
        this.updateBound();
    }

}
