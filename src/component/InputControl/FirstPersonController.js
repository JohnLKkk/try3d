/**
 * 第一人称控制器，包含以下操作：<br/>
 * 1.按住鼠标左键，同时移动鼠标旋转镜头观察3D世界(或者按下↑/↓/←/→方向键来实现同样效果)；<br/>
 * 2.按下W/S/A/D键，前进/后退/左移/右移镜头观察3D世界；<br/>
 * 3.按下Q/E键，上升/下降镜头观察3D世界；<br/>
 * @author Kkk
 * @date 2020年10月10日11点13分
 */
import Component from "../Component.js";
import Vector3 from "../Math3d/Vector3.js";
import MoreMath from "../Math3d/MoreMath.js";
import Matrix44 from "../Math3d/Matrix44.js";
import Input from "./Input.js";
import TempVars from "../Util/TempVars.js";

export default class FirstPersonController extends Component{

    static FORWARD = 1;
    static BACKWARD = FirstPersonController.FORWARD << 1;
    static LEFT = FirstPersonController.BACKWARD << 1;
    static RIGHT = FirstPersonController.LEFT << 1;

    static YAW          = -90.0;
    static PITCH        = 0.0;
    static SPEED        = 10.5;
    static SENSITIVITY  = 0.1;
    static ZOOM         = 45.0;


    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_LastExTime = 0;


        // 相交的一些属性
        this._m_Position = new Vector3();
        cfg.position = cfg.position || this._m_Scene.getMainCamera().getEye();
        if(cfg.position){
            this._m_Position.setTo(cfg.position);
        }
        this._m_Front = new Vector3(0, 0, -1);
        cfg.front = cfg.front || this._m_Scene.getMainCamera().getAt().subRetNew(cfg.position).normal();
        if(cfg.front){
            this._m_Front.setTo(cfg.front);
        }
        this._m_Up = new Vector3();
        this._m_Right = new Vector3();
        this._m_WorldUp = new Vector3(0, 1, 0);
        if(cfg.up){
            this._m_WorldUp.setTo(cfg.up);
        }

        // 欧拉角
        this._m_Yaw = cfg.yaw || FirstPersonController.YAW;           // 抬起与抬下
        this._m_Pitch = cfg.pitch || FirstPersonController.PITCH;    // 左转与右转

        // 控制器速度
        this._m_MovementSpeed = cfg.movementSpeed || FirstPersonController.SPEED;                 // 移动速率
        this._m_MouseSensitivity = cfg.mouseSensitivity || FirstPersonController.SENSITIVITY;     // 旋转速率
        this._m_Zoom = cfg.zoom || FirstPersonController.ZOOM;                                     // 缩放速率

        // 视图矩阵
        this._m_ViewMatrix = new Matrix44();
        this._m_ViewMatrix.identity();

        // 同步欧拉角
        this.synYawPitch();


        // 计算视图矩阵三个向量
        this.updateCameraVectors();
        this._updateViewMatrix();


        let sceneInput = Input.getInput(this._m_Scene, {id:this._m_Scene.getId()});
        // 监听update事件
        this._m_Scene.on('update', (exTime)=>{
            this._m_LastExTime = exTime;

            let needUpdateViewMatrix = false;

            // 旋转视点部分
            if(sceneInput.getMouseButtonDown(Input.S_MOUSE_BUTTON0)){
                // 在按住鼠标左键时,我们在进行旋转视点
                this.processMouseMovement(sceneInput.getAmountX(), sceneInput.getAmountY(), true);
                this.updateCameraVectors();
                needUpdateViewMatrix = true;
            }

            // 移动视点部分
            let direction = null;
            if(sceneInput.getKeyDown(Input.S_KEY_W)){
                direction = FirstPersonController.FORWARD;
            }
            else if(sceneInput.getKeyDown(Input.S_KEY_S)){
                direction = FirstPersonController.BACKWARD;
            }
            if(sceneInput.getKeyDown(Input.S_KEY_A)){
                direction = FirstPersonController.LEFT;
            }
            else if(sceneInput.getKeyDown(Input.S_KEY_D)){
                direction = FirstPersonController.RIGHT;
            }

            if(direction != null){
                needUpdateViewMatrix = true;
                this.processKeyboard(direction, this._m_LastExTime);
            }

            if(needUpdateViewMatrix){
                this._doUpdate(true);
            }
        });
        sceneInput.on("mousewheel", (offset)=>{
            // 滚动部分
            if(offset){
                this.processMouseScroll(offset);
                this._m_Scene.getMainCamera().scroll(this._m_Zoom);
            }
        });
    }
    refresh(){
        this._m_Position.setTo(this._m_Scene.getMainCamera().getEye());
        this._m_Front.setTo(this._m_Scene.getMainCamera().getAt().subRetNew(this._m_Position).normal());
        this.synYawPitch();
    }

    /**
     * 同步yaw,pitch欧拉角数据。<br/>
     * 当我们从主相机获得viewMatrix时,或者从其他地方更新了front,up,position等,我们需要反向计算出yaw,pitch欧拉角。<br/>
     * 以便控制器可以同步控制相机。<br/>
     */
    synYawPitch(){
        // 这里只计算当worldUp == (0, 1, 0)时的情况
        this._m_Pitch = MoreMath.toAngle(Math.asin(this._m_Front._m_Y));
        let t = Math.cos(MoreMath.toRadians(this._m_Pitch));
        //this.mFront.z = Math.sin(MoreMath.toRadians(this.mYaw)) * t;
        //let g = this.mFront.z / t;
        let g = this._m_Front._m_Z / t;
        if(g >= 1){
            g = 1;
        }
        else if(g <= -1){
            g = -1;
        }
        this._m_Yaw = MoreMath.toAngle(Math.asin(g));

        //确保yaw在正确的角度内
        let ts = Math.cos(MoreMath.toRadians(this._m_Yaw)) * t;
        if(ts * this._m_Front._m_X < 0){
            this._m_Yaw = 180 + (-this._m_Yaw);
        }
    }

    /**
     * 处理从任何类似键盘的输入系统接收的输入。 接受摄像机定义的ENUM形式的输入参数（以从窗口系统中抽象出来）。<br/>
     * @param {Object}[direction 移动方向,相机移动枚举量之一]
     * @param {Number}[exTime 帧经过时间]
     */
    processKeyboard(direction, exTime){
        // 计算速率
        let velocity = this._m_MovementSpeed * exTime;
        if(direction == FirstPersonController.FORWARD){
            this._m_Front.multLength(velocity, TempVars.S_TEMP_VEC3);
            this._m_Position.add(TempVars.S_TEMP_VEC3);
        }
        else if(direction == FirstPersonController.BACKWARD){
            this._m_Front.multLength(velocity * -1, TempVars.S_TEMP_VEC3);
            this._m_Position.add(TempVars.S_TEMP_VEC3);
        }
        else if(direction == FirstPersonController.LEFT){
            this._m_Right.multLength(velocity * -1, TempVars.S_TEMP_VEC3);
            this._m_Position.add(TempVars.S_TEMP_VEC3);
        }
        else if(direction == FirstPersonController.RIGHT){
            this._m_Right.multLength(velocity, TempVars.S_TEMP_VEC3);
            this._m_Position.add(TempVars.S_TEMP_VEC3);
        }
    }

    /**
     * 处理从鼠标输入系统接收到的输入。 预期在x和y方向上的偏移值。<br/>
     * @param {Number}[xamount 鼠标x方向的移动量,非累计移动量]
     * @param {Number}[yamount 鼠标y方向的移动量,非累计移动量]
     * @param {Boolean}[constrainPitch 是否约束相机,防止过度朝上或朝下导致屏幕翻转]
     */
    processMouseMovement(xamount, yamount, constrainPitch){
        constrainPitch = (constrainPitch == undefined || constrainPitch == null) ? true : constrainPitch;

        xamount *= this._m_MouseSensitivity;
        yamount *= this._m_MouseSensitivity;

        // 计算yaw,pitch欧拉角
        this._m_Yaw += xamount;
        this._m_Pitch += yamount;

        // 限制在90度朝上和朝下,避免翻转
        if(constrainPitch){
            if(this._m_Pitch > 89.0){
                this._m_Pitch = 89;
            }
            else if(this._m_Pitch < -89.0){
                this._m_Pitch = -89;
            }
        }
    }

    /**
     * 处理从鼠标滚轮事件收到的输入。 只需要在垂直轮轴上输入。<br/>
     * @param {Number}[offset 滚动量,非累计量]
     */
    processMouseScroll(offset){
        this._m_Zoom -= offset;
        if(this._m_Zoom < 1.0){
            this._m_Zoom = 1.0;
        }
        if(this._m_Zoom > 45.0){
            this._m_Zoom = 45.0;
        }
    }

    /**
     * 更新视图矩阵。<br/>
     * @private
     */
    _updateViewMatrix(){
        this._m_Position.add(this._m_Front, TempVars.S_TEMP_VEC3);
        this._m_ViewMatrix.lookAt(this._m_Position, TempVars.S_TEMP_VEC3, this._m_Up);
    }

    /**
     * 返回视图矩阵。<br/>
     * @returns {Matrix44}[视图矩阵]
     */
    getViewMatrix(){
        return this._m_ViewMatrix;
    }

    /**
     * 返回视图矩阵数组。<br/>
     * @returns {Number[]}[16数组]
     */
    getViewMatrixArray(){
        return this.getViewMatrix().m;
    }

    /**
     * 更新相交三个主要向量
     */
    updateCameraVectors(){
        // 计算当前朝向
        TempVars.S_TEMP_VEC3._m_X = Math.cos(MoreMath.toRadians(this._m_Yaw)) * Math.cos(MoreMath.toRadians(this._m_Pitch));
        TempVars.S_TEMP_VEC3._m_Y = Math.sin(MoreMath.toRadians(this._m_Pitch));
        TempVars.S_TEMP_VEC3._m_Z = Math.sin(MoreMath.toRadians(this._m_Yaw)) * Math.cos(MoreMath.toRadians(this._m_Pitch));
        this._m_Front.setTo(TempVars.S_TEMP_VEC3);
        this._m_Front.normal();

        // 计算视图矩阵当前right和up部分
        this._m_Front.cross(this._m_WorldUp, this._m_Right);
        this._m_Right.normal();
        this._m_Right.cross(this._m_Front, this._m_Up);
        this._m_Up.normal();
    }

    _update(){
        // 更新矩阵
        this._updateViewMatrix();

        // 更新camera
        // 为了加速,尽量不使用直接setViewMatrix
        // this._m_Scene.getMainCamera().setViewMatrix(this._m_ViewMatrix);
        this._m_Scene.getMainCamera().lookAt(this._m_Position, this._m_Position.add(this._m_Front, TempVars.S_TEMP_VEC3), this._m_Up);
    }
}
