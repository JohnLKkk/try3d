import Component from "../Component.js";
import Vector3 from "../Math3d/Vector3.js";
import Matrix44 from "../Math3d/Matrix44.js";
import TempVars from "../Util/TempVars.js";
import ShaderSource from "../WebGL/ShaderSource.js";

/**
 * Camera定义了3D空间中的观察者,渲染3D世界时,3D世界中必须有一个Camera,否则无法渲染。<br/>
 * 除了用于渲染GUI的Picture元素外,3D世界的其他对象被激活的Camera渲染到用户设备中。<br/>
 * @author Kkk
 * @date 2020年10月10日10点35分
 */
export default class Camera extends Component{
    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_Eye = new Vector3(0, 0, 10);
        this._m_At = new Vector3(0, 0, -10);
        this._m_Up = new Vector3(0, 1, 0);
        this._m_ViewMatrix = new Matrix44();
        this._m_ProjectMatrix = new Matrix44();
        this._m_ProjectViewMatrix = new Matrix44();
        this._m_ViewMatrixUpdate = false;
        this._m_ProjectMatrixUpdate = false;
        this._m_ProjectVieMatrixUpdate = false;


        // 初始化
        let canvas = this._m_Scene.getCanvas();
        let gl = canvas.getGLContext();
        this._m_ViewMatrix.lookAt(this._m_Eye, this._m_At, this._m_Up);
        this._m_ProjectMatrix.perspectiveM(45.0, canvas.getWidth() * 1.0 / canvas.getHeight(), 0.1, 1000);
        this._m_ViewMatrixUpdate = true;
        this._m_ProjectMatrixUpdate = true;
        gl.viewport(0, 0, canvas.getWidth(), canvas.getHeight());
        this._init();

        canvas.on('resize', ()=>{
            gl.viewport(0, 0, canvas.getWidth(), canvas.getHeight());
            this._m_ProjectMatrix.perspectiveM(45.0, canvas.getWidth() * 1.0 / canvas.getHeight(), 0.1, 1000);
            this._m_ProjectMatrixUpdate = true;
            this._doUpdate();
        });
    }

    /**
     * 初始化。<br/>
     * @private
     */
    _init(){
        let gl = this._m_Scene.getCanvas().getGLContext();
        let MAT = gl.createBuffer();
        this.MAT = MAT;
        gl.bindBuffer(gl.UNIFORM_BUFFER, MAT);
        gl.bufferData(gl.UNIFORM_BUFFER, 3 * 16 * 4, gl.STATIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);

        gl.bindBufferRange(gl.UNIFORM_BUFFER, 0x001, MAT, 0, 3 * 16 * 4);

        this._doUpdate();
    }

    /**
     * 返回观察点。<br/>
     * @returns {Vector3}[at]
     */
    getAt(){
        return this._m_At;
    }

    /**
     * 设置观察点。<br/>
     * @param {Vector3}[at]
     */
    setAt(at){
        this._m_At.setTo(at);
    }

    /**
     * 返回相机位置。<br/>
     * @returns {Vector3}[eye]
     */
    getEye(){
        return this._m_Eye;
    }

    /**
     * 设置相机位置。<br/>
     * @param {Vector3}[eye]
     */
    setEye(eye){
        this._m_Eye.setTo(eye);
    }

    /**
     * 返回相机抬头朝向。<br/>
     * @returns {Vector3}[up]
     */
    getUp(){
        return this._m_Up;
    }

    /**
     * 设置相机抬头朝向。<br/>
     * @param {Vector3}[up]
     */
    setUp(up){
        this._m_Up.setTo(up);
    }

    /**
     * 设置镜头eye,at,up。<br/>
     * @param {Vector3}[eye]
     * @param {Vector3}[at]
     * @param {Vector3}[up]
     */
    lookAt(eye, at, up){
        this._m_Eye.setTo(eye);
        this._m_At.setTo(at);
        this._m_Up.setTo(up);
        this._m_ViewMatrix.lookAt(this._m_Eye, this._m_At, this._m_Up);
        this._m_ViewMatrixUpdate = true;
        this._doUpdate();
    }

    /**
     * 更新相机。<br/>
     * @private
     */
    _update(){
        let gl = this._m_Scene.getCanvas().getGLContext();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.MAT);

        let frameContext = this._m_Scene.getRender().getFrameContext();

        if(this._m_ViewMatrixUpdate){
            this._m_ProjectVieMatrixUpdate = true;
            if(frameContext.getContext(ShaderSource.S_VIEW_MATRIX_SRC) || frameContext.getContext(ShaderSource.S_VP_SRC) || frameContext.getContext(ShaderSource.S_MVP_SRC)){
                gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this._m_ViewMatrix.getBufferData());
                frameContext.setCalcContext(ShaderSource.S_VIEW_MATRIX_SRC, this._m_ViewMatrix);
                this._m_ViewMatrixUpdate = false;
            }
        }
        if(this._m_ProjectMatrixUpdate){
            this._m_ProjectVieMatrixUpdate = true;
            if(frameContext.getContext(ShaderSource.S_PROJECT_MATRIX_SRC) || frameContext.getContext(ShaderSource.S_VP_SRC) || frameContext.getContext(ShaderSource.S_MVP_SRC)){
                gl.bufferSubData(gl.UNIFORM_BUFFER, 16 * 4, this._m_ProjectMatrix.getBufferData());
                frameContext.setCalcContext(ShaderSource.S_PROJECT_MATRIX_SRC, this._m_ProjectMatrix);
                this._m_ProjectMatrixUpdate = false;
            }
        }

        // 检测其他需要的context
        if(this._m_ProjectVieMatrixUpdate && frameContext.getContext(ShaderSource.S_VP_SRC)){
            Matrix44.multiplyMM(this._m_ProjectViewMatrix, 0, this._m_ProjectMatrix, 0, this._m_ViewMatrix, 0);
            gl.bufferSubData(gl.UNIFORM_BUFFER, 32 * 4, this._m_ProjectViewMatrix.getBufferData());
            frameContext.setCalcContext(ShaderSource.S_VP_SRC, this._m_ProjectViewMatrix);
            this._m_ProjectVieMatrixUpdate = false;
        }
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }

    /**
     * 设置视图矩阵。<br/>
     * @param {Matrix44}[viewMatrix]
     */
    setViewMatrix(viewMatrix){
        this._m_ViewMatrix.set(viewMatrix);
        // 从矩阵中计算eye,at,up
        // 可能每次更新矩阵时这么去处理开销有点大,所以要更新物体时,最好调用Camera.lookAt(),而不是该方法
        let g = this._m_ViewMatrix.inertRetNew(TempVars.S_TEMP_MAT4);
        if(g){
            this._m_Eye.setToInXYZ(g.m[12], g.m[13], g.m[14]);
            this._m_Up.setToInXYZ(g.m[4], g.m[5], g.m[6]);
            // 别忘了ndc是右手
            TempVars.S_TEMP_VEC3.setToInXYZ(-g.m[8], -g.m[9], -g.m[10]);
            TempVars.S_TEMP_VEC3.add(this._m_Eye, this._m_At);
        }
        this._m_ViewMatrixUpdate = true;
        this._doUpdate();
    }

    /**
     * 获取视图矩阵。<br/>
     * @returns {Matrix44}[viewMatrix]
     */
    getViewMatrix(){
        return this._m_ViewMatrix;
    }

    /**
     * 设置投影矩阵。<br/>
     * @param {Matrix44}[projectMatrix]
     */
    setProjectMatrix(projectMatrix){
        this._m_ProjectMatrix.set(projectMatrix);
        this._m_ProjectMatrixUpdate = true;
        this._doUpdate();
    }

    /**
     * 滚动相机。
     * @param {Number}[zoom 滚动量,非累计量]
     */
    scroll(zoom){
        let canvas = this._m_Scene.getCanvas();
        this._m_ProjectMatrix.perspectiveM(zoom, canvas.getWidth() * 1.0 / canvas.getHeight(), 0.1, 1000);
        this._m_ProjectMatrixUpdate = true;
        this._doUpdate();
    }

    /**
     * 返回投影矩阵。<br/>
     * @returns {Matrix44}[projectMatrix]
     */
    getProjectMatrix(){
        return this._m_ProjectMatrix;
    }

}
