import Geometry from "../Geometry.js";
import Mesh from "../../WebGL/Mesh.js";
import Tools from "../../Util/Tools.js";

/**
 * Sphere。<br/>
 * @author Kkk
 * @date 2021年2月22日17点02分
 */
export default class Sphere extends Geometry{
    getType(){
        return 'Sphere';
    }

    /**
     * 根据指定的参数创建一个Sphere。<br/>
     * @param {Component}[owner]
     * @param {Number}[cfg.lod 细节等级,默认1]
     * @param {Vector3}[cfg.center 中心点]
     * @param {Number}[cfg.radius 半径,默认为1]
     * @param {Number}[cfg.widthSegments 宽度方向的切片数量,默认18]
     * @param {Number}[cfg.heightSegments 高度方向的切片数量,默认18]
     */
    constructor(owner, cfg) {
        super(owner, cfg);
        // 创建Sphere
        const lod = cfg.lod || 1;

        const centerX = cfg.center ? cfg.center._m_X : 0;
        const centerY = cfg.center ? cfg.center._m_Y : 0;
        const centerZ = cfg.center ? cfg.center._m_Z : 0;

        let radius = cfg.radius || 1;
        if (radius <= 0) {
            console.error("radius不能小于等于0!");
            radius *= -1;
        }

        let heightSegments = cfg.heightSegments || 18;
        if (heightSegments <= 0) {
            console.error("heightSegments不能小于等于0!");
            heightSegments *= -1;
        }
        heightSegments = Math.floor(lod * heightSegments);
        if (heightSegments < 18) {
            heightSegments = 18;
        }

        let widthSegments = cfg.widthSegments || 18;
        if (widthSegments <= 0) {
            console.error("widthSegments不能小于等于0!");
            widthSegments *= -1;
        }
        widthSegments = Math.floor(lod * widthSegments);
        if (widthSegments < 18) {
            widthSegments = 18;
        }

        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        let i;
        let j;

        let theta;
        let sinTheta;
        let cosTheta;

        let phi;
        let sinPhi;
        let cosPhi;

        let x;
        let y;
        let z;

        let u;
        let v;

        let first;
        let second;

        for (i = 0; i <= heightSegments; i++) {

            theta = i * Math.PI / heightSegments;
            sinTheta = Math.sin(theta);
            cosTheta = Math.cos(theta);

            for (j = 0; j <= widthSegments; j++) {

                phi = j * 2 * Math.PI / widthSegments;
                sinPhi = Math.sin(phi);
                cosPhi = Math.cos(phi);

                x = cosPhi * sinTheta;
                y = cosTheta;
                z = sinPhi * sinTheta;
                u = 1.0 - j / widthSegments;
                v = i / heightSegments;

                normals.push(x);
                normals.push(y);
                normals.push(z);

                uvs.push(u);
                uvs.push(v);

                positions.push(centerX + radius * x);
                positions.push(centerY + radius * y);
                positions.push(centerZ + radius * z);
            }
        }

        for (i = 0; i < heightSegments; i++) {
            for (j = 0; j < widthSegments; j++) {

                first = (i * (widthSegments + 1)) + j;
                second = first + widthSegments + 1;

                indices.push(first + 1);
                indices.push(second + 1);
                indices.push(second);
                indices.push(first + 1);
                indices.push(second);
                indices.push(first);
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

        this.setMesh(mesh);
        this.updateBound();
    }

}
