import Node from "./Node.js";

/**
 * Geometry继承Node,同时实现IDrawable接口,表示一个空间节点,同时表示一个可渲染的实例对象。<br/>
 * 是渲染引擎对外提供的渲染实例对象,包装内部渲染数据。<br/>
 * @author Kkk
 */
export default class Geometry extends Node{
    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_Mesh = null;
        this._m_Material = null;
        // 生成材质对象时,根据材质hash值查询是否存在对应的材质对象,有则直接引用。
    }
    setMaterial(material){
        this._m_Material = material;
    }
    getMaterial(){
        return this._m_Material;
    }
    setMesh(mesh){
        this._m_Mesh = mesh;
    }
    getMesh(){
        return this._m_Mesh;
    }
    updateBound(){
        if(this._m_Mesh){
            this._m_Mesh._updateBound(this._m_Scene.getCanvas().getGLContext());
        }
    }
    /**
     * 表示当前是否为可渲染实例
     */
    isDrawable(){
        return true;
    }

    /**
     * 是否为非透明
     */
    isOpaque(){
        return true;
    }

    /**
     * 是否为半透明。<br/>
     */
    isTranslucent(){

    }

    /**
     * 是否为透明。<br/>
     */
    isTransparent(){

    }

    /**
     * 继承IDrawable接口函数,实现绘制逻辑。<br/>
     * @param {FrameContext}[frameContext]
     */
    draw(frameContext){
        let gl = this._m_Scene.getCanvas().getGLContext();
        // 根据材质
        if(frameContext.m_LastMaterila != this._m_Material){
            frameContext.m_LastMaterila = this._m_Material;
            this._m_Material.use();
        }
        this._m_Mesh.draw(gl);
    }

}