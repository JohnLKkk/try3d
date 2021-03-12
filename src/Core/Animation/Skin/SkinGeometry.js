import Geometry from "../../Node/Geometry.js";
import ShaderSource from "../../WebGL/ShaderSource.js";
import Matrix44 from "../../Math3d/Matrix44.js";
import TempVars from "../../Util/TempVars.js";
import Log from "../../Util/Log.js";

/**
 * SkinGeometry。<br/>
 * 蒙皮动画中的皮肤几何定义，与Geometry相比，SkinGeometry定义了它的蒙皮骨骼部分。<br/>
 * @author Kkk
 * @date 2021年3月9日10点59分
 */
export default class SkinGeometry extends Geometry{
    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_Skeleton = null;
    }
    setSkeleton(skeleton){
        this._m_Skeleton = skeleton;
    }
    draw(frameContext){
        let gl = this._m_Scene.getCanvas().getGLContext();

        // 更新骨架
        if(this._m_Skeleton){
            if(!this._m_Skeleton.isFinished()){
                return;
            }
            if(!this._m_Skeleton.owner(gl, frameContext)){
                Log.log('错误持有!');
            }
            this._m_Skeleton.updateJoints(gl, frameContext);
        }

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
        this._m_Mesh.draw(gl);
    }

}
