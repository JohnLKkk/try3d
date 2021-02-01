import Component from "../Component.js";
import Vector3 from "../Math3d/Vector3.js";
import Matrix44 from "../Math3d/Matrix44.js";

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
        this._m_ViewMatrixUpdate = false;
        this._m_ProjectMatrixUpdate = false;


        // 初始化
        let canvas = this._m_Scene.getCanvas();
        this._m_ViewMatrix.lookAt(this._m_Eye, this._m_At, this._m_Up);
        this._m_ProjectMatrix.perspectiveM(45.0, canvas.getWidth() * 1.0 / canvas.getHeight(), 0.1, 1000);
        this._m_ViewMatrixUpdate = true;
        this._m_ProjectMatrixUpdate = true;
        this._init();
    }

    /**
     * 初始化。<br/>
     * @private
     */
    _init(){
        let gl = this._m_Scene.getCanvas().getGLContext();
        let ub_VP = gl.createBuffer();
        this.ub_VP = ub_VP;
        gl.bindBuffer(gl.UNIFORM_BUFFER, ub_VP);
        gl.bufferData(gl.UNIFORM_BUFFER, 2 * 16 * 4, gl.STATIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);

        gl.bindBufferRange(gl.UNIFORM_BUFFER, 0x001, ub_VP, 0, 2 * 16 * 4);

        this._doUpdate();
    }

    /**
     * 设置观察点。<br/>
     * @param {Vector3}[at]
     */
    setAt(at){
        this._m_At.setTo(at);
    }

    /**
     * 设置相机位置。<br/>
     * @param {Vector3}[eye]
     */
    setEye(eye){
        this._m_Eye.setTo(eye);
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
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.ub_VP);
        if(this._m_ViewMatrixUpdate){
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this._m_ViewMatrix.getBufferData());
            this._m_ViewMatrixUpdate = false;
        }
        if(this._m_ProjectMatrixUpdate){
            gl.bufferSubData(gl.UNIFORM_BUFFER, 16 * 4, this._m_ProjectMatrix.getBufferData());
            this._m_ProjectMatrixUpdate = false;
        }
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }

    /**
     * 获取视图矩阵。<br/>
     * @returns {Matrix44}[viewMatrix]
     */
    getViewMatrix(){
        return this._m_ViewMatrix;
    }

    /**
     * 返回投影矩阵。<br/>
     * @returns {Matrix44}[projectMatrix]
     */
    getProjectMatrix(){
        return this._m_ProjectMatrix;
    }

}
