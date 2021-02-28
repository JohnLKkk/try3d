/**
 * 输入控制包装器,提供抽象输入控制事件监听(以便在标准web浏览器或mobile上都可以用统一接口访问事件)。<br/>
 * @author Kkk
 * @date 2021年2月1日16点10分
 */
import Component from "../Component.js";

export default class Input extends Component{
    static s_Inputs = {};
    // keyCode
    static S_KEY_0 = 0;
    static S_KEY_1 = 1;
    static S_KEY_2 = 2;
    static S_KEY_3 = 3;
    static S_KEY_4 = 4;
    static S_KEY_5 = 5;
    static S_KEY_6 = 6;
    static S_KEY_7 = 7;
    static S_KEY_8 = 8;
    static S_KEY_9 = 9;
    static S_KEY_A = 10;
    static S_KEY_B = 11;
    static S_KEY_C = 12;
    static S_KEY_D = 13;
    static S_KEY_E = 14;
    static S_KEY_F = 15;
    static S_KEY_G = 16;
    static S_KEY_H = 17;
    static S_KEY_I = 18;
    static S_KEY_J = 19;
    static S_KEY_K = 20;
    static S_KEY_L = 21;
    static S_KEY_M = 22;
    static S_KEY_N = 23;
    static S_KEY_O = 24;
    static S_KEY_P = 25;
    static S_KEY_Q = 26;
    static S_KEY_R = 27;
    static S_KEY_S = 28;
    static S_KEY_T = 29;
    static S_KEY_U = 30;
    static S_KEY_V = 31;
    static S_KEY_W = 32;
    static S_KEY_X = 33;
    static S_KEY_Y = 34;
    static S_KEY_Z = 35;
    static S_KEYS = {
        '0':Input.S_KEY_0,
        '1':Input.S_KEY_1,
        '2':Input.S_KEY_2,
        '3':Input.S_KEY_3,
        '4':Input.S_KEY_4,
        '5':Input.S_KEY_5,
        '6':Input.S_KEY_6,
        '7':Input.S_KEY_7,
        '8':Input.S_KEY_8,
        '9':Input.S_KEY_9,
        'a':Input.S_KEY_A,
        'b':Input.S_KEY_B,
        'c':Input.S_KEY_C,
        'd':Input.S_KEY_D,
        'e':Input.S_KEY_E,
        'f':Input.S_KEY_F,
        'g':Input.S_KEY_G,
        'h':Input.S_KEY_H,
        'i':Input.S_KEY_I,
        'j':Input.S_KEY_J,
        'k':Input.S_KEY_K,
        'l':Input.S_KEY_L,
        'm':Input.S_KEY_M,
        'n':Input.S_KEY_N,
        'o':Input.S_KEY_O,
        'p':Input.S_KEY_P,
        'q':Input.S_KEY_Q,
        'r':Input.S_KEY_R,
        's':Input.S_KEY_S,
        't':Input.S_KEY_T,
        'u':Input.S_KEY_U,
        'v':Input.S_KEY_V,
        'w':Input.S_KEY_W,
        'x':Input.S_KEY_X,
        'y':Input.S_KEY_Y,
        'z':Input.S_KEY_Z
    }
    static S_MOUSE_BUTTON0_DOWN = 36;
    static S_MOUSE_BUTTON1_DOWN = 37;
    static S_MOUSE_BUTTON2_DOWN = 38;
    static S_MOUSE_BUTTON0_UP = 39;
    static S_MOUSE_BUTTON1_UP = 40;
    static S_MOUSE_BUTTON2_UP = 41;
    static S_MOUSE_BUTTON0 = 42;
    static S_MOUSE_BUTTON1 = 43;
    static S_MOUSE_BUTTON2 = 44;

    static S_INPUTS = {};
    static getInput(owner, cfg){
        if(Input.S_INPUTS[cfg.id]){
            return Input.S_INPUTS[cfg.id];
        }
        else{
            let input = new Input(owner, cfg);
            Input.S_INPUTS[cfg.id] = input;
            return input;
        }
    }

    constructor(owner, cfg) {
        super(owner, cfg);
        // 注册事件
        let canvas = this._m_Scene.getCanvas();
        let canvasElement = canvas.getCanvasElement();
        this._keys = {};
        this._mouseButtons = {};
        this._mouseCoords = null;
        this._wheelDelta = 0;
        this._amountX = 0, this._amountY = 0;
        this._mouseStartDownCoords = null;
        canvasElement.oncontextmenu = function(){return false;};
        // 各种事件监听
        canvasElement.onkeydown = (event)=>{
            this._keys[Input.S_KEYS[event.key]] = true;
            this.fire('keydown', [Input.S_KEYS[event.key]]);
        };
        canvasElement.onkeyup = (event)=>{
            this._keys[Input.S_KEYS[event.key]] = false;
            this.fire('keyup', [Input.S_KEYS[event.key]]);
        };
        canvasElement.onkeypress = (event)=>{
            this.fire('keypress', [Input.S_KEYS[event.key]]);
        };
        let isMouseDown = false;
        canvasElement.onmousedown = (event)=>{
            isMouseDown = true;
            this._wheelDelta = 0;
            this._amountX = 0;
            this._amountY = 0;
            this._mouseCoords = this._getClickCoordsWithinElement(event);
            this._mouseStartDownCoords = this._mouseCoords;
            let mouseDownButton = null;
            switch (event.which || event.button + 1) {

                case 1:// Left button
                    this._mouseButtons[Input.S_MOUSE_BUTTON0] = true;
                    mouseDownButton = Input.S_MOUSE_BUTTON0_DOWN;
                    break;

                case 2:// Middle/both buttons
                    this._mouseButtons[Input.S_MOUSE_BUTTON1] = true;
                    mouseDownButton = Input.S_MOUSE_BUTTON1_DOWN;
                    break;

                case 3:// Right button
                    this._mouseButtons[Input.S_MOUSE_BUTTON2] = true;
                    mouseDownButton = Input.S_MOUSE_BUTTON2_DOWN;
                    break;

                default:
                    break;
            }
            this.fire('mousedown', [mouseDownButton]);
        };
        canvasElement.onmouseup = (event)=>{
            isMouseDown = false;
            this._wheelDelta = 0;
            this._amountX = 0;
            this._amountY = 0;
            this._mouseCoords = this._getClickCoordsWithinElement(event);
            this._mouseStartDownCoords = this._mouseCoords;
            let mouseUpButton = null;
            switch (event.which || event.button + 1) {

                case 1:// Left button
                    this._mouseButtons[Input.S_MOUSE_BUTTON0] = false;
                    mouseUpButton = Input.S_MOUSE_BUTTON0_UP;
                    break;

                case 2:// Middle/both buttons
                    this._mouseButtons[Input.S_MOUSE_BUTTON1] = false;
                    mouseUpButton = Input.S_MOUSE_BUTTON1_UP;
                    break;

                case 3:// Right button
                    this._mouseButtons[Input.S_MOUSE_BUTTON2] = false;
                    mouseUpButton = Input.S_MOUSE_BUTTON2_UP;
                    break;

                default:
                    break;
            }
            this.fire('mouseup', [mouseUpButton]);
        };
        let enter = false;
        canvasElement.onmouseenter = (event)=>{
            this._wheelDelta = 0;
            this._amountX = 0;
            this._amountY = 0;
            enter = true;
            this._mouseCoords = this._getClickCoordsWithinElement(event);
        };
        canvasElement.onmouseout = (event)=>{
            this._wheelDelta = 0;
            this._amountX = 0;
            this._amountY = 0;
            enter = false;
            this._mouseCoords = this._getClickCoordsWithinElement(event);
        };
        // 记录移动的偏移量,已经当前鼠标位置
        canvasElement.onmousemove = (event)=>{
            if(enter){
                this._wheelDelta = 0;
                this._mouseCoords = this._getClickCoordsWithinElement(event);
                // 计算按下鼠标后的偏移量
                if(isMouseDown){
                    this._amountX = this._mouseCoords[0] - this._mouseStartDownCoords[0];
                    this._amountY = this._mouseCoords[1] - this._mouseStartDownCoords[1];
                    // 可以试试注释下面的代码查看FirstPersonController的效果
                    this._mouseStartDownCoords[0] = this._mouseCoords[0];
                    this._mouseStartDownCoords[1] = this._mouseCoords[1];
                }
                this.fire('mousemove', [this._mouseCoords]);
            }
        };
        canvasElement.onmousewheel = (event)=>{
            this._amountX = 0;
            this._amountY = 0;
            this._mouseCoords = this._getClickCoordsWithinElement(event);
            // 获取滚动量
            if (event.wheelDelta) {                     //IE、chrome浏览器使用的是wheelDelta，并且值为“正负120”
                this._wheelDelta = event.wheelDelta/120;
                if (window.opera) this._wheelDelta = -this._wheelDelta;       //因为IE、chrome等向下滚动是负值，FF是正值，为了处理一致性，在此取反处理
            } else if (event.detail) {                  //FF浏览器使用的是detail,其值为“正负3”
                this._wheelDelta = -event.detail/3;
            }
            this.fire('mousewheel', [this._wheelDelta]);
        };
    }

    /**
     * 返回指定鼠标按钮是否按下。<br/>
     * @param {Input.MOUSE_KEY}[mouseButtonKey 指定的鼠标按钮枚举]
     * @returns {Boolean}
     */
    getMouseButtonDown(mouseButtonKey){
        return this._mouseButtons[mouseButtonKey];
    }

    /**
     * 返回指定按键是否按下
     * @param {Input.KEYS}[指定的按键]
     * @returns {Boolean}
     */
    getKeyDown(key){
        return this._keys[key];
    }

    /**
     * 返回指定的按键是否抬起
     * @param {Input.KEYS}[指定的按键]
     * @returns {Boolean}
     */
    getKeyUp(key){
        return !this._keys[key];
    }

    /**
     * 返回x方向的移动量
     * @returns {Number}[数值]
     */
    getAmountX(){
        return this._amountX;
    }

    /**
     * 返回y方向的移动量
     * @returns {Number}[数值]
     */
    getAmountY(){
        // 以左下角起点而不是左上角
        return -this._amountY;
    }

    /**
     * 返回最近的鼠标位置
     * @returns {Number[]}[[x,z]数组]
     */
    getMouseCoords(){
        return this._mouseCoords;
    }

    /**
     * 返回最近的滚轮滚动值
     * @returns {Number}[数值]
     */
    getWheelDelta(){
        return this._wheelDelta;
    }

    /**
     * 返回元素鼠标事件中鼠标相对于该元素的(x,y)
     * @param {Object}[event 元素鼠标事件]
     * @returns {number[]}[鼠标位置]
     * @private
     */
    _getClickCoordsWithinElement(event) {
        const coords = [0, 0];
        if (!event) {
            event = window.event;
            coords.x = event.x;
            coords.y = event.y;
        }
        else {
            let element = event.target;
            let totalOffsetLeft = 0;
            let totalOffsetTop = 0;

            while (element.offsetParent) {
                totalOffsetLeft += element.offsetLeft;
                totalOffsetTop += element.offsetTop;
                element = element.offsetParent;
            }
            coords[0] = event.pageX - totalOffsetLeft;
            coords[1] = event.pageY - totalOffsetTop;
        }
        return coords;
    }

}
