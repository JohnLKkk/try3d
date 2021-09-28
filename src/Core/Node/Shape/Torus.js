import Geometry from "../Geometry.js";
import Mesh from "../../WebGL/Mesh.js";
import Tools from "../../Util/Tools.js";

/**
 * Torus。<br/>
 * 一个圆环形体。<br/>
 * @author Kkk
 * @date 2021年9月28日15点50分
 */
export default class Torus extends Geometry{
    /**
     * @param {Component}[owner]
     * @param {Number}[cfg.tube 管宽,默认0.3]
     * @param {Vector3}[cfg.center 中心点]
     * @param {Number}[cfg.radius 半径,默认为1]
     * @param {Number}[cfg.segmentsR R切片数目默认32]
     * @param {Number}[cfg.segmentsT T切片数目默认24
     * @param {Number}[cfg.arc 弧度,默认pi/2]
     */
    constructor(owner, cfg) {
        super(owner, cfg);
        let radius = cfg.radius || 1;
        let tube = cfg.tube || 0.3;
        let segmentsR = cfg.segmentsR || 32;
        let segmentsT = cfg.segmentsT || 24;
        let arc = cfg.arc || Math.PI * 2;

        let positions = [];
        let normals = [];
        let uvs = [];
        let indices = [];

        let u;
        let v;
        let centerX;
        let centerY;
        let centerZ = 0;
        let x;
        let y;
        let z;
        let vec;

        for (let j = 0; j <= segmentsR; j++) {
            for (let i = 0; i <= segmentsT; i++) {

                u = i / segmentsT * arc;
                v = j / segmentsR * Math.PI * 2;

                centerX = radius * Math.cos(u);
                centerY = radius * Math.sin(u);

                x = (radius + tube * Math.cos(v) ) * Math.cos(u);
                y = (radius + tube * Math.cos(v) ) * Math.sin(u);
                z = tube * Math.sin(v);

                positions.push(x);
                positions.push(y);
                positions.push(z);

                uvs.push(i / segmentsT);
                uvs.push(1 - j / segmentsR);

                vec = this.normalize(this.sub([x, y, z], [centerX, centerY, centerZ], []), []);

                normals.push(vec[0]);
                normals.push(vec[1]);
                normals.push(vec[2]);
            }
        }

        let a;
        let b;
        let c;
        let d;

        for (let j = 1; j <= segmentsR; j++) {
            for (let i = 1; i <= segmentsT; i++) {

                a = ( segmentsT + 1 ) * j + i - 1;
                b = ( segmentsT + 1 ) * ( j - 1 ) + i - 1;
                c = ( segmentsT + 1 ) * ( j - 1 ) + i;
                d = ( segmentsT + 1 ) * j + i;

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

        this.setMesh(mesh);
        this.updateBound();
    }

    normalize(v, dest) {
        let f = 1.0 / len(v);
        return this.mul(v, f, dest);
    }

    len(v) {
        return Math.sqrt(this.sqLen(v));
    }

    sqLen(v) {
        return this.dot(v, v);
    }

    dot(u, v) {
        return (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]);
    }

    mul(v, s, dest) {
        dest[0] = v[0] * s;
        dest[1] = v[1] * s;
        dest[2] = v[2] * s;
        return dest;
    }

    sub(u, v, dest) {
        dest[0] = u[0] - v[0];
        dest[1] = u[1] - v[1];
        dest[2] = u[2] - v[2];
        return dest;
    }

}
