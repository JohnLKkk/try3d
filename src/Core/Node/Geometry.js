import Node from "./Node.js";
import ShaderSource from "../WebGL/ShaderSource.js";
import Mesh from "../WebGL/Mesh.js";
import Matrix44 from "../Math3d/Matrix44.js";
import TempVars from "../Util/TempVars.js";
import AABBBoundingBox from "../Math3d/Bounding/AABBBoundingBox.js";

/**
 * Geometry继承Node,同时实现IDrawable接口,表示一个空间节点,同时表示一个可渲染的实例对象。<br/>
 * 是渲染引擎对外提供的渲染实例对象,包装内部渲染数据。<br/>
 * @author Kkk
 */
export default class Geometry extends Node{
    getType(){
        return 'Geometry';
    }
    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_Mesh = null;
        this._m_ModelAABBBoundingBox = null;
        this._m_Material = null;


        // 生成材质对象时,根据材质hash值查询是否存在对应的材质对象,有则直接引用。
    }

    /**
     * 设置当前Geometry使用的材质。<br/>
     * @param {Material}[material]
     */
    setMaterial(material){
        this._m_Material = material;
        if(this._m_Mesh){
            this._refreshBufLocal();
        }
    }

    /**
     * 返回当前Geometry使用的材质。<br/>
     * @return {Material}
     */
    getMaterial(){
        return this._m_Material;
    }

    /**
     * 设置Geometry的Mesh。<br/>
     * @param {Mesh}[mesh]
     */
    setMesh(mesh){
        this._m_Mesh = mesh;
        if(this._m_Material){
            this._refreshBufLocal();
        }
    }

    /**
     * 返回Geometry的Mesh。<br/>
     * @return {Mesh}
     */
    getMesh(){
        return this._m_Mesh;
    }
    updateBound(){
        if(this._m_Mesh){
            this._m_Mesh._updateBound(this._m_Scene.getCanvas().getGLContext());
            // 在至少包含Mesh之后再创建AABBBoudingBox,因为可能Geometry还没有设置Mesh
            if(!this._m_ModelAABBBoundingBox){
                this._m_ModelAABBBoundingBox = new AABBBoundingBox();
                // 这里假设每个Geometry只设置一次Mesh(后面应该改善这里的逻辑,每次修改Mesh后都应该重新调用fromPositions重建AABB)
                this._m_ModelAABBBoundingBox.fromPositions(this._m_Mesh.getData(Mesh.S_POSITIONS));
                if(!this._m_AABBBoudingBox){
                    this._m_AABBBoudingBox = new AABBBoundingBox();
                }
                this._m_AABBBoudingBox.setTo(this._m_ModelAABBBoundingBox);
            }
        }
    }
    getAABBBoundingBox(){
        // Geometry不应该包含子节点(因为Geometry应该只是叶子节点)
        // 所以Geometry应该直接返回最新状态的AABBBoundingBox
        // 当Mesh数据没有发生变更时,AABB只与变换更新有关
        // 当Mesh数据发生变更时,将在fromPositions重建AABB
        if(this._m_UpdateAABBBoundingBox){
            // 更新AABBBoundingBox
            Matrix44.decomposeMat4(this.getWorldMatrix(), Node.S_TEMP_VEC3, Node.S_TEMP_Q, Node.S_TEMP_VEC3_2);
            this._m_ModelAABBBoundingBox.transform(Node.S_TEMP_VEC3_2, Node.S_TEMP_Q, Node.S_TEMP_VEC3, this._m_AABBBoudingBox);
            this._m_UpdateAABBBoundingBox = false;
        }
        return this._m_AABBBoudingBox;
    }

    /**
     * 在设置材质后,更新自定义几何属性的位置属性
     * @private
     */
    _refreshBufLocal(){
        // 获取材质的自定义几何属性
        let customAttrs = null;
        if(customAttrs){
            this._m_Mesh._refreshBufLocal(this._m_Scene.getCanvas().getGLContext(), customAttrs);
        }
    }
    /**
     * 表示当前是否为可渲染实例
     */
    isDrawable(){
        return true;
    }
    isFramePicture(){
        return false;
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
     * 属于GUI元素。<br/>
     */
    isGUI(){

    }
    draw(frameContext){
        let gl = this._m_Scene.getCanvas().getGLContext();
        // 提交模型矩阵到材质中
        let contextVars = frameContext.m_LastSubShader.getContextVars();
        let viewMatrix = null, projectMatrix = null;
        for(let vN in contextVars){
            switch (vN) {
                case ShaderSource.S_MODEL_MATRIX_SRC:
                    // contextVars[vN].fun(contextVars[vN].loc, false, this.getWorldMatrix().getBufferData());
                    gl[contextVars[vN].fun](contextVars[vN].loc, false, this.getWorldMatrix().getBufferData());
                    break;
                case ShaderSource.S_MV_SRC:
                    viewMatrix = frameContext.getCalcContext(ShaderSource.S_VIEW_MATRIX_SRC);
                    Matrix44.multiplyMM(TempVars.S_TEMP_MAT4, 0, viewMatrix, 0, this.getWorldMatrix(), 0);
                    contextVars[vN].fun(contextVars[vN].loc, false, TempVars.S_TEMP_MAT4.getBufferData());
                    break;
                case ShaderSource.S_MVP_SRC:
                    viewMatrix = frameContext.getCalcContext(ShaderSource.S_VIEW_MATRIX_SRC);
                    projectMatrix = frameContext.getCalcContext(ShaderSource.S_PROJECT_MATRIX_SRC);
                    Matrix44.multiplyMM(TempVars.S_TEMP_MAT4, 0, viewMatrix, 0, this.getWorldMatrix(), 0);
                    Matrix44.multiplyMM(TempVars.S_TEMP_MAT4_1, 0, projectMatrix, 0, viewMatrix, 0);
                    gl[contextVars[vN].fun](contextVars[vN].loc, false, TempVars.S_TEMP_MAT4_1.getBufferData());
                    break;
            }
        }
        // 通过getW
        this._m_Mesh.draw(gl);
    }

    /**
     * 继承IDrawable接口函数,实现绘制逻辑。<br/>
    //  * @param {FrameContext}[frameContext]
    //  */
    // draw(frameContext){
    //     let gl = this._m_Scene.getCanvas().getGLContext();
    //
    //     // 提交该Geometry的modelMatrix到当前上下文中
    //     // // mI应该提前记录下来(记录到SubShader的local列表中,SubShader的local列表不用记录ubo blocks,因为ubo blocks不需要)
    //     // let mI = gl.getUniformLocation(frameContext.m_SubShader.getProgram(), "modelMatrix");
    //     // // 检测如果更新了变换矩阵才需要更新数据块
    //     // gl.uniformMatrix4fv(mI, false, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
    //     // 根据材质
    //     if(frameContext.m_LastMaterila != this._m_Material){
    //         frameContext.m_LastMaterila = this._m_Material;
    //         // 查看材质参数,将视图,投影矩阵等矩阵提交到材质中
    //         this._m_Material.use();
    //     }
    //     // 通过getW
    //     this._m_Mesh.draw(gl);
    // }

}
