/**
 * Base。<br/>
 * @author JhonKkk
 * @date 2021年8月30日20点30分
 */
export default class Base {
    _m_Render = null;
    constructor(props) {
        this._m_Render = props.render;
    }

    render(cfg){}
}
