import Geometry from "../Geometry.js";
import Mesh from "../../WebGL/Mesh.js";
import Tools from "../../Util/Tools.js";

/**
 * Cylinder。<br/>
 * 一个基础圆柱体，锥体形体几何。<br/>
 * 参考:http://www.e-reading-lib.com/bookreader.php/143437/Pike_-_DirectX_8_Programming_Tutorial.html。<br/>
 * @author Kkk
 * @date 2021年9月28日15点31分
 */
export default class Cylinder extends Geometry{
    /**
     * 创建一个Cylinder。<br/>
     * @param {Component}[owner]
     * @param {String}[cfg.id]
     * @param {Number}[cfg.radiusTop 顶部圆盖半径,最小为1,此时接近点]
     * @param {Number}[cfg.radiusBottom 底部圆盖半径,最小为1,此时接近点]
     * @param {Number}[cfg.height 柱体高度,默认1]
     * @param {Number}[cfg.radialSegments 半径切片数目,默认60]
     * @param {Vector3}[cfg.heightSegments 柱体切片数目,默认1]
     * @param {Vector3}[cfg.openEnded 开口,默认false]
     */
    constructor(owner, cfg) {
        super(owner, cfg);
        /* config */
        let radiusTop = cfg.radiusTop !== undefined ? cfg.radiusTop : 1;
        let radiusBottom = cfg.radiusBottom !== undefined ? cfg.radiusBottom : 1;
        let height = cfg.height !== undefined ? cfg.height : 1;

        let radialSegments   = cfg.radialSegments  || 60;
        let heightSegments   = cfg.heightSegments  || 1;

        let openEnded = cfg.openEnded || false;
        /* config end */

        let heightHalf = height / 2;
        let heightLength = height / heightSegments;

        let radialAngle = (2.0 * Math.PI / radialSegments);
        let radialLength = 1.0 / radialSegments;

        let nextRadius = this.radiusBottom;
        let radiusChange = (radiusTop-radiusBottom)/heightSegments;

        let positions = [];
        let normals = [];
        let uvs = [];
        let indices = [];

        // 创建顶点属性
        let normalY = (90.0 - (Math.atan(height / (radiusBottom - radiusTop))) * 180/Math.PI) / 90.0;

        for (let h = 0; h <= heightSegments; h++) {
            let currentRadius = radiusTop - h*radiusChange;
            let currentHeight = heightHalf - h*heightLength

            for (let i=0; i <= radialSegments; i++) {
                let x = Math.sin(i * radialAngle);
                let z = Math.cos(i * radialAngle);

                normals.push(currentRadius * x);
                normals.push(normalY); //todo
                normals.push(currentRadius * z);
                uvs.push(1 - (i*radialLength));
                uvs.push(0 + h*1/heightSegments);
                positions.push(currentRadius * x);
                positions.push(currentHeight);
                positions.push(currentRadius * z);
            }
        }

        // indices部分
        for (let h = 0; h < heightSegments; h++) {
            for (let i=0; i <= radialSegments; i++) {
                let first = h * (radialSegments + 1) + i;
                let second = first + radialSegments;
                indices.push(first);
                indices.push(second);
                indices.push(second + 1);

                indices.push(first);
                indices.push(second + 1);
                indices.push(first + 1);
            }
        }

        // 创建顶部圆盖
        if (!openEnded && radiusTop > 0) {
            let startIndex = (positions.length/3);

            // 顶部中心
            normals.push(0.0);
            normals.push(1.0);
            normals.push(0.0);
            uvs.push(0.5);
            uvs.push(0.5);
            positions.push(0);
            positions.push(heightHalf);
            positions.push(0);

            // 顶部三角形面
            for (let i=0; i <= radialSegments; i++) {
                let x = Math.sin(i * radialAngle);
                let z = Math.cos(i * radialAngle);
                let tu = (0.5 * Math.sin(i * radialAngle)) + 0.5;
                let tv = (0.5 * Math.cos(i * radialAngle)) + 0.5;

                normals.push(radiusTop * x);
                normals.push(1.0);
                normals.push(radiusTop * z);
                uvs.push(tu);
                uvs.push(tv);
                positions.push(radiusTop * x);
                positions.push(heightHalf);
                positions.push(radiusTop * z);
            }

            for (let i=0; i < radialSegments; i++) {
                let center = startIndex;
                let first = startIndex + 1 + i;
                indices.push(first);
                indices.push(first + 1);
                indices.push(center);
            }
        }

        // 创建底部圆盖
        if (!openEnded && radiusBottom > 0) {
            let startIndex = (positions.length/3);

            // 底部中心
            normals.push(0.0);
            normals.push(-1.0);
            normals.push(0.0);
            uvs.push(0.5);
            uvs.push(0.5);
            positions.push(0);
            positions.push(0-heightHalf);
            positions.push(0);

            // 底部三角形面
            for (let i=0; i <= radialSegments; i++) {
                let x = Math.sin(i * radialAngle);
                let z = Math.cos(i * radialAngle);
                let tu = (0.5 * Math.sin(i * radialAngle)) + 0.5;
                let tv = (0.5 * Math.cos(i * radialAngle)) + 0.5;

                normals.push(radiusBottom * x);
                normals.push(-1.0);
                normals.push(radiusBottom * z);
                uvs.push(tu);
                uvs.push(tv);
                positions.push(radiusBottom * x);
                positions.push(0-heightHalf);
                positions.push(radiusBottom * z);
            }

            for (let i=0; i < radialSegments; i++) {
                let center = startIndex;
                let first = startIndex + 1 + i;
                indices.push(center);
                indices.push(first + 1);
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
