/**
 * Mesh创建工具类，提供一些调试需要的Mesh创建。<br/>
 * 诸如WireFrustum，Torus等。<br/>
 * @author Kkk
 * @date 2021年2月22日17点27分
 */
import Vector2 from "../Math3d/Vector2.js";
import Mesh from "../WebGL/Mesh.js";

export default class MeshFactor {
    constructor() {

    }
    static pushVec3ToArray(array, vec3){
        array.push(vec3._m_X);
        array.push(vec3._m_Y);
        array.push(vec3._m_Z);
    }
    static createViewFrustumMeshFromCamera(camera){
        let w = camera.getWidth();
        let h = camera.getHeight();

        let positions = [];
        MeshFactor.pushVec3ToArray(positions, camera.getWorldCoordinates(new Vector2(0, 0), 0));
        MeshFactor.pushVec3ToArray(positions, camera.getWorldCoordinates(new Vector2(0, h), 0));
        MeshFactor.pushVec3ToArray(positions, camera.getWorldCoordinates(new Vector2(w, h), 0));
        MeshFactor.pushVec3ToArray(positions, camera.getWorldCoordinates(new Vector2(w, 0), 0));

        MeshFactor.pushVec3ToArray(positions, camera.getWorldCoordinates(new Vector2(0, 0), 1));
        MeshFactor.pushVec3ToArray(positions, camera.getWorldCoordinates(new Vector2(0, h), 1));
        MeshFactor.pushVec3ToArray(positions, camera.getWorldCoordinates(new Vector2(w, h), 1));
        MeshFactor.pushVec3ToArray(positions, camera.getWorldCoordinates(new Vector2(w, 0), 1));
        console.log(positions);

        // indices
        let indices = [
            0, 1,
            1, 2,
            2, 3,
            3, 0,

            4, 5,
            5, 6,
            6, 7,
            7, 4,

            0, 4,
            1, 5,
            2, 6,
            3, 7
        ];

        let mesh = new Mesh();
        mesh.setData(Mesh.S_POSITIONS, positions);
        mesh.setData(Mesh.S_INDICES, indices);
        mesh.setPrimitive(Mesh.S_PRIMITIVE_LINES);
        return mesh;
    }
}
