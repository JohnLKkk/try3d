import Geometry from "./Geometry.js";
import Mesh from "../WebGL/Mesh.js";

/**
 * Picture用于提供图像输出需要,一般而言,用它作为GUI元素或Frame输出结果。<br/>
 * @author Kkk
 * @data 2021年2月14日615点32分
 */
export default class Picture extends Geometry{
    getType() {
        return 'Picture';
    }

    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_Width = cfg.width || this._m_Scene.getCanvas().getWidth();
        this._m_Height = cfg.height || this._m_Scene.getCanvas().getHeight();
        // 创建mesh
        let mesh = new Mesh();
        // 创建一个最远的picture
        mesh.setData(Mesh.S_POSITIONS, [
            -1, 1, 1,
            -1, -1, 1,
            1, 1, 1,
            1, -1, 1
        ]);
        mesh.setData(Mesh.S_UV0, [
            0, 1,
            0, 0,
            1, 1,
            1, 0
        ]);
        mesh.setData(Mesh.S_INDICES, [
            0, 1, 2,
            2, 1, 3
        ]);
        this.setMesh(mesh);
        this.updateBound();
    }
    isDrawable() {
        return true;
    }

}
