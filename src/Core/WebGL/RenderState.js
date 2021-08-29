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
        "Blend",
        "BlendFactor"
    ];
    constructor() {
        this._m_State = {
        };
        this._m_StoreState = {
            _state:{},
            getState:function(){
                return this._state;
            }
        };
        this._m_ResetState = {
            _state:{},
            getState:function(){
                return this._state;
            }
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
    store(){
        for(let k in this._m_State){
            this._m_StoreState._state[k] = this._m_State[k];
        }
    }
    restore(){
        return this._m_StoreState;
    }
    _init(){
        this._m_State[RenderState.S_STATES[0]] = RenderState.S_FACE_CULL_BACK;
        this._m_State[RenderState.S_STATES[1]] = 'On';
        this._m_State[RenderState.S_STATES[2]] = 'On';
        this._m_State[RenderState.S_STATES[3]] = 'On';
        this._m_State[RenderState.S_STATES[4]] = 'Off';

        this._m_ResetState._state[RenderState.S_STATES[0]] = RenderState.S_FACE_CULL_BACK;
        this._m_ResetState._state[RenderState.S_STATES[1]] = 'On';
        this._m_ResetState._state[RenderState.S_STATES[2]] = 'On';
        this._m_ResetState._state[RenderState.S_STATES[3]] = 'On';
        this._m_ResetState._state[RenderState.S_STATES[4]] = 'Off';
    }
    reset(){
        return this._m_ResetState;
    }

}
