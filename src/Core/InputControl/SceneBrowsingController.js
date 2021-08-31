/**
 * 场景浏览控制器，包含以下操作：<br/>
 * 1.鼠标左键按住，同时移动鼠标绕当前旋转点旋转场景；<br/>
 * 2.鼠标左键双击场景，设置旋转点；<br/>
 * 3.鼠标右键双击场景，飞行定位到场景指定位置，同时设置旋转点为双击点；<br/>
 * 4.鼠标滚轮缩放场景；<br/>
 * 5.鼠标右键按住，同时移动鼠标拖动场景；<br/>
 * @author Kkk
 * @date 2020年10月10日11点15分
 */
import Vector3 from "../Math3d/Vector3.js";
import MoreMath from "../Math3d/MoreMath.js";
import Component from "../Component.js";
import Input from "./Input.js";
import CameraIps from "./CameraIps.js";

export default class SceneBrowsingController extends Component{
    _m_Enabled = true;
    _m_Rotating = true;
    _m_VRotating = true;
    _m_CanRotate = true;
    _m_Rotation = 0.0;
    _m_VRotation = Math.PI / 6.0;
    _m_PreviousTargetRotation = 0.0;
    _m_TargetRotation = this._m_Rotation;
    _m_TargetVRotation = this._m_VRotation;
    _m_RotationSpeed = 0.001;
    _m_ZoomSensitivity = 2.0;
    _m_ZoomSpeed = 1.0;
    _m_VeryCloseRotation = true;
    _m_MaxVerticalRotation = Math.PI / 2.0;
    _m_MinVerticalRotation = -Math.PI / 2.0;
    _m_Distance = 1;
    _m_TargetDistance = this._m_Distance;
    _m_MinDistance = 1.0;
    _m_MaxDistance = 10.0;
    _m_Chasing = true;
    _m_Zooming = true;
    _m_Zoomin = false;
    _m_TrailingRotationInertia = 0.05;
    _m_DistanceLerpFactor = 0.0;
    _m_TrailingLerpFactor = 0.0;
    _m_TrailingSensitivity = 5.0;
    _m_RotationSensitivity = 5.0;
    _m_TrailingEnabled = true;
    _m_SmoothMotion = true;
    _m_TargetLocation = new Vector3();
    _m_TargetDir = new Vector3();
    _m_OffsetDistance = 0.002;
    _m_Target = new Vector3();
    _m_LookAtOffset = new Vector3();
    _m_PrevPos = new Vector3();
    temp = new Vector3();
    temp2 = new Vector3();
    _m_Pos = new Vector3();
    _m_InitialUpVec = new Vector3().setTo(Vector3.S_UNIT_AXIS_Y);
    _m_Cam;
    _m_ChasingSensitivity = 5.0;
    _m_Input;
    _m_TargetMoves = false;
    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_Cam = cfg.camera || this._m_Scene.getMainCamera();

        this._m_Input = Input.getInput(this._m_Scene, {id:this._m_Scene.getId()});
        // 监听update事件
        let lastTPF = 0;
        this._m_Scene.on('update', (exTime)=>{
            lastTPF = exTime;
            this.updateCamera(exTime);
        });
        this._m_Input.on("mousewheel", (offset)=>{
            // 滚动部分
            if(offset){
                this.analog(offset > 0 ? CameraIps.CHASECAM_ZOOMIN : CameraIps.CHASECAM_ZOOMOUT, (offset > 0 ? offset : -offset) * this._m_ZoomSpeed, lastTPF);
            }
        });
    }

    /**
     * 设置聚焦速率。<br/>
     * @param {Number}[zoomSpeed]
     */
    setZoomSpeed(zoomSpeed){
        this._m_ZoomSpeed = zoomSpeed;
    }

    /**
     * 返回聚焦速率。<br/>
     * @return {Number}
     */
    getZoomSpeed(){
        return this._m_ZoomSpeed;
    }

    /**
     * 设置当前相机距离Target的距离。<br/>
     * @param {Number}[distance]
     */
    setTargetDistance(distance){
        this._m_TargetDistance = distance;
    }

    /**
     * 返回当前相机距离Target的距离。<br/>
     * @return {Number}
     */
    getDistance(){
        return this._m_Distance;
    }

    /**
     * 观察场景。<br/>
     * @param {Node}[scene]
     */
    lookScene(scene){
        if(scene){
            let aabb = scene.getAABBBoundingBox();
            let distanceX = aabb.getXHalf() * 2;
            let distanceY = aabb.getYHalf() * 2;
            let distanceZ = aabb.getZHalf() * 2;
            let diagonal = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2) + Math.pow(distanceZ, 2));
            let far = diagonal * 5; // 5是一个被猜测的常数，应该与最大缩小因子一致
            let near = far / 5000;
            let d = (far - near);
            let maxDistance = Math.max(distanceX,distanceY,distanceZ);
            this.setTargetDistance((maxDistance - near) * 0.5 + near);
            this.setMaxDistance(maxDistance);
            this.setMinDistance(near);
            this.setZoomSpeed(d * 0.001);
            let v = new Vector3();
            aabb.getCenter(v);
            this.setTarget(v);
        }
    }

    /**
     * 设置追随目标。<br/>
     * @param {Vector3D}[target]
     */
    setTarget(target){
        this._m_Target.setTo(target);
    }

    /**
     * 同步状态为指定导航朝向。<br/>
     * @param {Number[]}[dir]
     * @param {boolean}[zoomMaxDis 聚焦于最大距离观察]
     */
    syncNavDir(dir, zoomMaxDis){
        //目标方向的计算
        this._m_TargetDir.setToInXYZ(dir[0], dir[1], dir[2]);
        this._m_TargetDir.normal();
        // 计算Elur
        this._m_TargetVRotation = Math.asin(this._m_TargetDir.y);
        let t = Math.cos(this._m_TargetVRotation);
        let g = this._m_TargetDir.z / t;
        if(g >= 1){
            g = 1;
        }
        else if(g <= -1){
            g = -1;
        }
        this._m_TargetRotation = Math.asin(g);

        //确保yaw在正确的角度内
        let ts = Math.cos(this._m_TargetRotation) * t;
        if(ts * this._m_TargetDir.x < 0){
            this._m_TargetRotation = Math.PI + (-this._m_TargetRotation);
        }
        this._m_Rotating = true;
        this._m_VRotating = true;

        if(zoomMaxDis){
            this._m_Zooming = true;
            this.setTargetDistance(this._m_MaxDistance);
        }
    }

    /**
     * 旋转指定弧度。<br/>
     * @param h
     * @param v
     */
    rotate(h, v){
        let rs = this._m_RotationSpeed;
        this._m_RotationSpeed = Math.PI / 100;
        this._rotate1(h);
        this._rotate2(v);
        this._m_RotationSpeed = rs;
    }

    /**
     * 水平旋转相机。<br/>
     * @param {Number}[val]
     * @private
     */
    _rotate1(val){
        if(!this._m_CanRotate || !this._m_Enabled){
            return;
        }
        this._m_Rotating = true;
        this._m_TargetRotation += val * this._m_RotationSpeed;
    }

    /**
     * 垂直旋转相机。<br/>
     * @param {Number}[val]
     * @private
     */
    _rotate2(val){
        if(!this._m_CanRotate || !this._m_Enabled){
            return;
        }
        this._m_VRotating = true;
        let lastGoodRot = this._m_TargetVRotation;
        this._m_TargetVRotation += val * this._m_RotationSpeed;
        if (this._m_TargetVRotation > this._m_MaxVerticalRotation) {
            this._m_TargetVRotation = lastGoodRot;
        }
        if (this._m_VeryCloseRotation) {
            if ((this._m_TargetVRotation < this._m_MinVerticalRotation) && (this._m_TargetDistance > (this._m_MinDistance + 1.0))) {
                this._m_TargetVRotation = this._m_MinVerticalRotation;
            } else if (this._m_TargetVRotation < -MoreMath.S_DEG_TO_RAD * 90) {
                this._m_TargetVRotation = lastGoodRot;
            }
        } else {
            if ((this._m_TargetVRotation < this._m_MinVerticalRotation)) {
                this._m_TargetVRotation = lastGoodRot;
            }
        }
    }

    /**
     * 焦距相机。<br/>
     * @param {Number}[val]
     */
    _zoomCamera(val){
        if (!this._m_Enabled) {
            return;
        }

        this._m_Zooming = true;
        this._m_TargetDistance += val * this._m_ZoomSensitivity;
        if (this._m_TargetDistance > this._m_MaxDistance) {
            this._m_TargetDistance = this._m_MaxDistance;
        }
        if (this._m_TargetDistance < this._m_MinDistance) {
            this._m_TargetDistance = this._m_MinDistance;
        }
        if (this._m_VeryCloseRotation) {
            if ((this._m_TargetVRotation < this._m_MinVerticalRotation) && (this._m_TargetDistance > (this._m_MinDistance + 1.0))) {
                this._m_TargetVRotation = this._m_MinVerticalRotation;
            }
        }
    }

    /**
     * 检查输入处理。<br/>
     * @param {Number}[tpf]
     * @private
     */
    _checkInput(tpf){
        if(this._m_Input.getMouseButtonDown(Input.S_MOUSE_BUTTON0)){
            let dx = this._m_Input.getAmountX();
            let dy = this._m_Input.getAmountY();
            if(dx != 0){
                this.analog(dx > 0 ? CameraIps.CHASECAM_MOVERIGHT : CameraIps.CHASECAM_MOVELEFT, dx > 0 ? dx : -dx, tpf);
            }
            if(dy != 0){
                this.analog(dy > 0 ? CameraIps.CHASECAM_DOWN : CameraIps.CHASECAM_UP, dy > 0 ? dy : -dy, tpf);
            }
        }
    }

    /**
     * 更新相机，外部调用。<br/>
     * @param {Number}[tpf]
     */
    updateCamera(tpf){
        if(this._m_Enabled){
            this._checkInput(tpf);
            this._updateCamera(tpf);
        }
    }

    /**
     * 更新相机，内部调用。<br/>
     * @param {Number}[tpf]
     * @private
     */
    _updateCamera(tpf){
        if (this._m_Enabled) {
            this._m_TargetLocation.setTo(this._m_Target).add(this._m_LookAtOffset);
            let update = false;
            if (this._m_SmoothMotion) {

                //目标方向的计算
                this._m_TargetDir.setTo(this._m_TargetLocation).sub(this._m_PrevPos);
                let dist = this._m_TargetDir.length();

                //启用物理时，对目标位置进行低通滤波以避免晃动。
                if (this._m_OffsetDistance < dist) {
                    //目标移动，开始追逐。
                    this._m_Chasing = true;
                    //目标移动，如果必须，开始跟踪。
                    if (this._m_TrailingEnabled) {
                        this._m_Trailing = true;
                    }
                    //目标移动...
                    this._m_TargetMoves = true;
                } else {
                    //如果目标在动，我计算的轻微旋转偏移，以避免cam的粗糙停止
                    //如果玩家正在旋转cam，这里便不会执行
                    if (this._m_TargetMoves && !this._m_CanRotate) {
                        if (this._m_TargetRotation - this._m_Rotation > this._m_TrailingRotationInertia) {
                            this._m_TargetRotation = this._m_Rotation + this._m_TrailingRotationInertia;
                        } else if (this._m_TargetRotation - this._m_Rotation < -this._m_TrailingRotationInertia) {
                            this._m_TargetRotation = this._m_Rotation - this._m_TrailingRotationInertia;
                        }
                    }
                    //目标停止
                    this._m_TargetMoves = false;
                }

                //用户通过拖动鼠标来旋转cam
                if (this._m_CanRotate) {
                    //重置尾随 lerp 因子
                    this._m_TrailingLerpFactor = 0;
                    //停止追踪用户拥有控制权
                    this._m_Trailing = false;
                }


                if (this._m_TrailingEnabled && this._m_Trailing) {
                    if (this._m_TargetMoves) {
                        //计算目标方向是否反转
                        let a = this._m_TargetDir.negate().normal();
                        //x 单位向量
                        let b = Vector3.S_UNIT_AXIS_X;
                        //2d就够了
                        a.y = 0;
                        //计算 x 轴和轨迹之间的旋转角度
                        if (this._m_TargetDir.z > 0) {
                            this._m_TargetRotation = MoreMath.S_TWO_PI - Math.acos(a.dot(b));
                        } else {
                            this._m_TargetRotation = Math.acos(a.dot(b));
                        }
                        if (this._m_TargetRotation - this._m_Rotation > Math.PI || this._m_TargetRotation - this._m_Rotation < -Math.PI) {
                            this._m_TargetRotation -= MoreMath.S_TWO_PI;
                        }

                        //如果在跟踪 lerp 因子的重置过程中方向发生重要变化以避免跳动
                        if (this._m_TargetRotation != this._m_PreviousTargetRotation && Math.abs(this._m_TargetRotation - this._m_PreviousTargetRotation) > Math.PI / 8) {
                            this._m_TrailingLerpFactor = 0;
                        }
                        this._m_PreviousTargetRotation = this._m_TargetRotation;
                    }
                    //计算 lerp 因子
                    this._m_TrailingLerpFactor = Math.min(this._m_TrailingLerpFactor + tpf * tpf * this._m_TrailingSensitivity, 1);
                    //通过线性插值计算旋转
                    this._m_Rotation = MoreMath.interpolateLinear(this._m_TrailingLerpFactor, this._m_Rotation, this._m_TargetRotation);

                    //如果旋转接近目标旋转，那就结束了
                    if (this._m_TargetRotation + 0.01 >= this._m_Rotation && this._m_TargetRotation - 0.01 <= this._m_Rotation) {
                        this._m_Trailing = false;
                        this._m_TrailingLerpFactor = 0;
                    }
                }

                //追逐时距离的线性插值
                if (this._m_Chasing) {
                    this.temp2.setTo(this._m_Cam.getEye());
                    this._m_Distance = this.temp.setTo(this._m_TargetLocation).sub(this.temp2).length();
                    this._m_DistanceLerpFactor = Math.min(this._m_DistanceLerpFactor + (tpf * tpf * this._m_ChasingSensitivity * 0.05), 1);
                    this._m_Distance = MoreMath.interpolateLinear(this._m_DistanceLerpFactor, this._m_Distance, this._m_TargetDistance);
                    if (this._m_TargetDistance + 0.01 >= this._m_Distance && this._m_TargetDistance - 0.01 <= this._m_Distance) {
                        this._m_DistanceLerpFactor = 0;
                        this._m_Chasing = false;
                    }
                }

                //缩放时距离的线性插值
                if (this._m_Zooming) {
                    this._m_DistanceLerpFactor = Math.min(this._m_DistanceLerpFactor + (tpf * tpf * this._m_ZoomSensitivity), 1);
                    this._m_Distance = MoreMath.interpolateLinear(this._m_DistanceLerpFactor, this._m_Distance, this._m_TargetDistance);
                    if (this._m_TargetDistance + 0.1 >= this._m_Distance && this._m_TargetDistance - 0.1 <= this._m_Distance) {
                        this._m_Zooming = false;
                        this._m_DistanceLerpFactor = 0;
                    }
                }

                //水平旋转时旋转的线性插值
                if (this._m_Rotating) {
                    this._m_RotationLerpFactor = Math.min(this._m_RotationLerpFactor + tpf * tpf * this._m_RotationSensitivity, 1);
                    this._m_Rotation = MoreMath.interpolateLinear(this._m_RotationLerpFactor, this._m_Rotation, this._m_TargetRotation);
                    if (this._m_TargetRotation + 0.01 >= this._m_Rotation && this._m_TargetRotation - 0.01 <= this._m_Rotation) {
                        this._m_Rotating = false;
                        this._m_RotationLerpFactor = 0;
                    }
                }

                //垂直旋转时旋转的线性插值
                if (this._m_VRotating) {
                    this._m_VRotationLerpFactor = Math.min(this._m_VRotationLerpFactor + tpf * tpf * this._m_RotationSensitivity, 1);
                    this._m_VRotation = MoreMath.interpolateLinear(this._m_VRotationLerpFactor, this._m_VRotation, this._m_TargetVRotation);
                    if (this._m_TargetVRotation + 0.01 >= this._m_VRotation && this._m_TargetVRotation - 0.01 <= this._m_VRotation) {
                        this._m_VRotating = false;
                        this._m_VRotationLerpFactor = 0;
                    }
                }
                //计算pos
                this.computePosition();
                //设置当前pos
                this._m_Pos.add(this._m_LookAtOffset);
                update = true;
            } else {
                //容易没有平滑的运动
                this._m_VRotation = this._m_TargetVRotation;
                this._m_Rotation = this._m_TargetRotation;
                this._m_Distance = this._m_TargetDistance;
                this.computePosition();
                this._m_Pos.add(this._m_LookAtOffset);
                update = true;
            }
            //跟踪目标的先前位置
            this._m_PrevPos.setTo(this._m_TargetLocation);

            //cam朝向目标
            this._m_Cam.lookAt(this._m_Pos, this._m_TargetLocation, this._m_InitialUpVec);

        }
    }
    computePosition() {

        let hDistance = (this._m_Distance) * Math.sin((Math.PI / 2) - this._m_VRotation);
        this._m_Pos.setToInXYZ(hDistance * Math.cos(this._m_Rotation), (this._m_Distance) * Math.sin(this._m_VRotation), hDistance * Math.sin(this._m_Rotation));
        this._m_Pos.add(this._m_Target);
    }

    /**
     * 信号处理。<br/>
     * @param {string}[name]
     * @param {number}[val]
     * @param {number}[tpf]
     */
    analog(name, val, tpf){
        if (name == CameraIps.CHASECAM_MOVELEFT) {
            this._rotate1(-val);
        } else if (name == CameraIps.CHASECAM_MOVERIGHT) {
            this._rotate1(val);
        } else if (name == CameraIps.CHASECAM_UP) {
            this._rotate2(val);
        } else if (name == CameraIps.CHASECAM_DOWN) {
            this._rotate2(-val);
        } else if (name == CameraIps.CHASECAM_ZOOMIN) {
            this._zoomCamera(-val);
            if (this._m_Zoomin == false) {
                this._m_DistanceLerpFactor = 0;
            }
            this._m_Zoomin = true;
        } else if (name == CameraIps.CHASECAM_ZOOMOUT) {
            this._zoomCamera(+val);
            if (this._m_Zoomin == true) {
                this._m_DistanceLerpFactor = 0;
            }
            this._m_Zoomin = false;
        }
    }

    /**
     * 返回控制器激活与否状态。<br/>
     * @return {boolean}
     */
    isEnabled(){
        return this._m_Enabled;
    }

    /**
     * 设置控制器激活状态。<br/>
     * @param {boolean}[enabled]
     */
    setEnabled(enabled){
        this._m_Enabled = enabled;
        this._m_CanRotate = enabled;
    }

    /**
     * 返回最大焦距，默认40。<br/>
     * @return {number}
     */
    getMaxDistance(){
        return this._m_MaxDistance;
    }

    /**
     * 设置最大焦距，默认40。<br/>
     * @param {Number}[md]
     */
    setMaxDistance(md){
        this._m_MaxDistance = md;
        if(md < this._m_Distance){
            this._zoomCamera(md - this._m_Distance);
        }
    }

    /**
     * 返回最小焦距，默认1。<br/>
     * @return {number}
     */
    getMinDistance(){
        return this._m_MinDistance;
    }

    /**
     * 设置最小焦距，默认1。<br/>
     * @param {Number}[md]
     */
    setMinDistance(md){
        this._m_MinDistance = md;
        if(md > this._m_Distance){
            this._zoomCamera(this._m_Distance - md);
        }
    }

}
