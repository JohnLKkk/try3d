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
    static S_TEMP_MAT4 = new Matrix44();
    static S_TEMP_VEC3 = new Vector3();
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
        this._m_ProjectViewMatrixUpdate = false;


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

        gl.bindBufferRange(gl.UNIFORM_BUFFER, ShaderSource.BLOCKS['MAT'].blockIndex, MAT, 0, 3 * 16 * 4);

        let VIEW = gl.createBuffer();
        this.VIEW = VIEW;
        gl.bindBuffer(gl.UNIFORM_BUFFER, VIEW);
        gl.bufferData(gl.UNIFORM_BUFFER, 3 * 4, gl.STATIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);

        gl.bindBufferRange(gl.UNIFORM_BUFFER, ShaderSource.BLOCKS['VIEW'].blockIndex, VIEW, 0, 3 * 4);

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
        let updateCamera = this._m_ViewMatrixUpdate;

        if(this._m_ViewMatrixUpdate){
            this._m_ProjectViewMatrixUpdate = true;
            if(frameContext.getContext(ShaderSource.S_VIEW_MATRIX_SRC) || frameContext.getContext(ShaderSource.S_VP_SRC) || frameContext.getContext(ShaderSource.S_MVP_SRC)){
                gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this._m_ViewMatrix.getBufferData());
                frameContext.setCalcContext(ShaderSource.S_VIEW_MATRIX_SRC, this._m_ViewMatrix);
                this._m_ViewMatrixUpdate = false;
            }
        }
        if(this._m_ProjectMatrixUpdate){
            this._m_ProjectViewMatrixUpdate = true;
            if(frameContext.getContext(ShaderSource.S_PROJECT_MATRIX_SRC) || frameContext.getContext(ShaderSource.S_VP_SRC) || frameContext.getContext(ShaderSource.S_MVP_SRC)){
                gl.bufferSubData(gl.UNIFORM_BUFFER, 16 * 4, this._m_ProjectMatrix.getBufferData());
                frameContext.setCalcContext(ShaderSource.S_PROJECT_MATRIX_SRC, this._m_ProjectMatrix);
                this._m_ProjectMatrixUpdate = false;
            }
        }

        // 检测其他需要的context
        if(this._m_ProjectViewMatrixUpdate && frameContext.getContext(ShaderSource.S_VP_SRC)){
            Matrix44.multiplyMM(this._m_ProjectViewMatrix, 0, this._m_ProjectMatrix, 0, this._m_ViewMatrix, 0);
            gl.bufferSubData(gl.UNIFORM_BUFFER, 32 * 4, this._m_ProjectViewMatrix.getBufferData());
            frameContext.setCalcContext(ShaderSource.S_VP_SRC, this._m_ProjectViewMatrix);
            this._m_ProjectViewMatrixUpdate = false;
        }
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);

        // view
        if(updateCamera){
            if(frameContext.getContext(ShaderSource.S_CAMERA_POSITION_SRC)){
                gl.bindBuffer(gl.UNIFORM_BUFFER, this.VIEW);
                gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this._m_Eye.getBufferData());
                gl.bindBuffer(gl.UNIFORM_BUFFER, null);
            }
        }

        if(this._m_ViewMatrixUpdate || this._m_ProjectMatrixUpdate){
            this._doUpdate();
        }
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
     * 返回相机高度。<br/>
     * @return {Number}
     */
    getHeight(){
        let canvas = this._m_Scene.getCanvas();
        return canvas.getHeight();
    }

    /**
     * 返回当前相机宽度。<br/>
     * @return {Number}
     */
    getWidth(){
        let canvas = this._m_Scene.getCanvas();
        return canvas.getWidth();
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

    /**
     * 从平面空间坐标以及z投射计算并返回世界中的坐标。<br/>
     * screenPosition.x表示屏幕上面0-width之间的位置值,screenPosition.y表示屏幕上面0-height之间的位置值。<br/>
     * 其中中心点在屏幕中间，对于z投射，0-1表示分布在近截面与远界面的非线性投射，为1时表示完全投射到屏幕边界，为0时表示投射到屏幕中心点。<br/>
     * @param {Vector2}[screenPosition 屏幕空间坐标]
     * @param {Number}[projectionZPos z投射]
     * @param {Boolean}[viewSpace true表示计算基于viewSpace]
     * @param {Vector3}[result 计算结果]
     * @return {Vector3}
     */
    getWorldCoordinates(screenPosition, projectionZPos, viewSpace, result){
        if(!result){
            result = new Vector3();
        }

        // 由于没有强制更新ProjectViewMatrix,所以需要在这里进行计算(这一部分可以优化)
        if(viewSpace){
            Matrix44.multiplyMM(this._m_ProjectViewMatrix, 0, this._m_ProjectMatrix, 0, this._m_ViewMatrix, 0);
            Camera.S_TEMP_MAT4.set(this._m_ProjectViewMatrix);
        }
        else{
            Camera.S_TEMP_MAT4.set(this._m_ProjectMatrix);
        }
        // 逆矩阵
        Camera.S_TEMP_MAT4.inert();

        // 计算世界坐标
        let w = this.getWidth();
        let h = this.getHeight();
        // 视口以左下角原点(但位于屏幕中心)
        let viewPortLeft = 0.0;
        let viewPortBottom = 0.0;
        let viewPortRight = 1.0;
        let viewPortTop = 1.0;
        // 变换回NDC空间
        Camera.S_TEMP_VEC3.setToInXYZ((screenPosition._m_X / w - viewPortLeft) / (viewPortRight - viewPortLeft) * 2 - 1, (screenPosition._m_Y / h - viewPortBottom) / (viewPortTop - viewPortBottom) * 2 - 1, projectionZPos * 2.0 - 1.0);
        // 变换回世界空间(这里直接执行pv逆变换似乎会导致错误,不知道为啥,难道是我求逆矩阵的逻辑有问题？)
        // 所以先变换会投影空间
        let pw = Matrix44.multiplyMV3(result, Camera.S_TEMP_VEC3, Camera.S_TEMP_MAT4);
        result.multLength(1.0 / pw);
        return result;
    }

}
