/**
 * 一组Camera控制相关的状态机。<br/>
 * @author Kkk
 * @date 2021年6月22日10点58分
 */
export default class CameraIps {
    /**
     * 追逐相机映射以向下移动。 默认分配给<br/>
     * MouseInput.AXIS_Y 方向取决于 invertYaxis 配置<br/>
     * @type {string}
     */
    static CHASECAM_DOWN = "ChaseCamDown";
    /**
     * 追逐相机映射向上移动。 默认分配给 MouseInput.AXIS_Y<br/>
     * 方向取决于 invertYaxis 配置<br/>
     * @type {string}
     */
    static CHASECAM_UP = "ChaseCamUp";
    /**
     * 用于放大的追逐相机映射。默认分配给<br/>
     * MouseInput.AXIS_WHEEL 方向为正<br/>
     */
    static CHASECAM_ZOOMIN = "ChaseCamZoomIn";
    /**
     * 追逐相机映射以缩小。 默认分配给<br/>
     * MouseInput.AXIS_WHEEL 方向为负<br/>
     * @type {string}
     */
    static CHASECAM_ZOOMOUT = "ChaseCamZoomOut";
    /**
     * 追逐相机映射以向左移动。 默认分配给<br/>
     * MouseInput.AXIS_X 方向取决于 invertXaxis 配置<br/>
     * @type {string}
     */
    static CHASECAM_MOVELEFT = "ChaseCamMoveLeft";
    /**
     * 追逐相机映射向右移动。 默认分配给<br/>
     * MouseInput.AXIS_X 方向取决于 invertXaxis 配置<br/>
     * @type {string}
     */
    static CHASECAM_MOVERIGHT = "ChaseCamMoveRight";
    /**
     * 追逐相机映射以启动凸轮的旋转。 默认分配<br/>
     * 到 MouseInput.BUTTON_LEFT 和 MouseInput.BUTTON_RIGHT<br/>
     * @type {string}
     */
    static CHASECAM_TOGGLEROTATE = "ChaseCamToggleRotate";
    /**
     * 相机左移。<br/>
     * @type {string}
     */
    static CAMERA_MOVELEFT = "CameraMoveLeft";
    /**
     * 相机右移。<br/>
     * @type {string}
     */
    static CAMERA_MOVERIGHT = "CameraMoveRight";
    /**
     * 相机前移。<br/>
     * @type {string}
     */
    static CAMERA_MOVEFRONT = "CameraMoveFront";
    /**
     * 相机后移。<br/>
     * @type {string}
     */
    static CAMERA_MOVEBACK = "CameraMoveBack";



    //fly cameara constants
    /**
     * 飞行相机映射向左看。 默认分配给 MouseInput.AXIS_X，<br/>
     * 方向为负<br/>
     * @type {string}
     */
    static FLYCAM_LEFT = "FLYCAM_Left";
    /**
     * 飞行相机映射向有看。 默认分配给 MouseInput.AXIS_X，<br/>
     * 方向为正<br/>
     * @type {string}
     */
    static FLYCAM_RIGHT = "FLYCAM_Right";
    /**
     * 飞行相机映射向上看。 默认分配给 MouseInput.AXIS_Y，<br/>
     * 方向为正<br/>
     * @type {string}
     */
    static FLYCAM_UP = "FLYCAM_Up";
    /**
     * 飞相机映射往下看。 默认分配给 MouseInput.AXIS_Y，<br/>
     * 方向为负<br/>
     * @type {string}
     */
    static FLYCAM_DOWN = "FLYCAM_Down";
    /**
     * 飞行相机映射向左移动。 默认分配给 KeyInput.KEY_A<br/>
     * @type {string}
     */
    static FLYCAM_STRAFELEFT = "FLYCAM_StrafeLeft";
    /**
     * 飞行相机映射向右移动。 默认分配给 KeyInput.KEY_D<br/>
     * @type {string}
     */
    static FLYCAM_STRAFERIGHT = "FLYCAM_StrafeRight";
    /**
     * 飞行相机映射向前移动。 默认分配给 KeyInput.KEY_W<br/>
     * @type {string}
     */
    static FLYCAM_FORWARD = "FLYCAM_Forward";
    /**
     * 飞行相机映射向后移动。 默认分配给 KeyInput.KEY_S<br/>
     * @type {string}
     */
    static FLYCAM_BACKWARD = "FLYCAM_Backward";
    /**
     * 飞行相机映射zoom in。默认分配给 MouseInput.AXIS_WHEEL，<br/>
     * 方向为正<br/>
     * @type {string}
     */
    static FLYCAM_ZOOMIN = "FLYCAM_ZoomIn";
    /**
     * 飞行相机映射zoom out。默认分配给 MouseInput.AXIS_WHEEL，<br/>
     * 方向为负<br/>
     * @type {string}
     */
    static FLYCAM_ZOOMOUT = "FLYCAM_ZoomOut";
    /**
     * 飞行相机映射以切换旋转。 默认分配给<br/>
     * MouseInput.BUTTON_LEFT<br/>
     * @type {string}
     */
    static FLYCAM_ROTATEDRAG = "FLYCAM_RotateDrag";
    /**
     * 飞行相机映射向上移动。 默认分配给 KeyInput.KEY_Q<br/>
     * @type {string}
     */
    static FLYCAM_RISE = "FLYCAM_Rise";
    /**
     * 飞行相机映射向下移动。 默认分配给 KeyInput.KEY_W<br/>
     * @type {string}
     */
    static FLYCAM_LOWER = "FLYCAM_Lower";

    static FLYCAM_INVERTY = "FLYCAM_InvertY";
}
