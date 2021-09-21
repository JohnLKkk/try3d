import Geometry from "./Geometry.js";
import Node from "./Node.js";
import Mesh from "../WebGL/Mesh.js";
import Internal from "../Render/Internal.js";
import MaterialDef from "../Material/MaterialDef.js";
import Material from "../Material/Material.js";
import Tools from "../Util/Tools.js";

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
        this._m_Width = cfg.width || 1.0;
        this._m_Height = cfg.height || 1.0;
        this._m_Zindex = 1;
        this._m_Left = 0;
        this._m_Top = 0;
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
        // 过滤标记
        this._m_FilterFlag = Node.S_NEVER;
        // 阴影模式
        this._m_ShadowMode = Node.S_SHADOW_NONE;
    }

    /**
     * 使用默认材质。<br/>
     */
    useDefaultMat(){
        this.setMaterial(new Material(this._m_Scene, {id:'picture_gui_' + Tools.nextId(), materialDef:MaterialDef.parse(Internal.S_PICTURE_DEF_DATA)}));
    }

    /**
     * 设置大小。<br/>
     * @param {Number}[w 值为0.0-1.0]
     * @param {Number}[h 值为0.0-1.0]
     */
    setSize(w, h){
        if(this._m_Width != w || this._m_Height != h){
            this.setLocalScaleXYZ(w, h, 1);
        }
    }

    /**
     * 设置左上角位置，即绘制开始点，以左上角为起始位置。<br/>
     * @param {Number}[left 0.0-1.0]
     * @param {Number}[top 0.0-1.0]
     */
    setLeftTop(left, top){
        if(this._m_Left != left || this._m_Top != top){
            this._m_Left = left;
            this._m_Top = top;
            this.setLocalTranslationXYZ(this._m_Left, this._m_Top, 2.0 * this._m_Zindex - 1.0);
        }
    }

    /**
     * 设置深度位置，默认为1，最顶层为0，最底层为1。<br/>
     * @param {Number}[zIndex 0-1]
     */
    setZIndex(zIndex){
        if(this._m_Zindex != zIndex){
            this._m_Zindex = Math.min(Math.max(0, zIndex), 1);
            let w = this._m_Scene.getCanvas().getWidth();
            let h = this._m_Scene.getCanvas().getHeight();
            this.setLocalTranslationXYZ(this._m_Left, this._m_Top, 2.0 * this._m_Zindex - 1.0);
        }
    }

    /**
     * 返回宽度。<br/>
     * @return {Number}[值为像素单位]
     */
    getWidthSize(){
        return this._m_Width * this._m_Scene.getCanvas().getWidth();
    }

    /**
     * 返回宽度。<br/>
     * @return {Number}[值为0.0-1.0]
     */
    getWidth(){
        return this._m_Width;
    }

    /**
     * 返回高度。<br/>
     * @return {Number}[值为像素单位]
     */
    getHeightSize(){
        return this._m_Height * this._m_Scene.getCanvas().getHeight();
    }

    /**
     * 返回高度。<br/>
     * @return {Number}[值为0.0-1.0]
     */
    getHeight(){
        return this._m_Height;
    }
    isDrawable() {
        return true;
    }
    isGUI(){
        return true;
    }

}
