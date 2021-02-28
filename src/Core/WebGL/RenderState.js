/**
 * 渲染状态。<br/>
 * @author Kkk
 * @date 2021年2月9日15点41分
 */
export default class RenderState {
    static S_FACE_CULL_OFF = 'Off';
    static S_FACE_CULL_BACK = 'Back';
    static S_FACE_CULL_FRONT = 'Front';
    static S_FACE_CULL_FRONT_AND_BACK = 'FrontAndBack';
    static S_STATES = [
        "FaceCull",
        "DepthWrite",
        "ColorWrite",
        "DepthTest",
        "Blend"
    ];
    constructor() {
        this._m_State = {
        };
        this._init();
    }
    getState(){
        return this._m_State;
    }
    getFlag(flag){
        return this._m_State[flag];
    }
    setFlag(flag, data){
        this._m_State[flag] = data;
    }
    _init(){
        this._m_State[RenderState.S_STATES[0]] = RenderState.S_FACE_CULL_BACK;
        this._m_State[RenderState.S_STATES[1]] = 'On';
        this._m_State[RenderState.S_STATES[2]] = 'On';
        this._m_State[RenderState.S_STATES[3]] = 'On';
        this._m_State[RenderState.S_STATES[4]] = 'Off';
    }

}
