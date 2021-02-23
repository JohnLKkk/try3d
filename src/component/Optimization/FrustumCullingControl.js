import Component from "../Component.js";

/**
 * 视锥剔除控制器。<br/>
 * @author Kkk
 * @date 2021年2月23日17点04分
 */
export default class FrustumCullingControl extends Component{
    getType(){
        return 'FrustumCullingControl';
    }
    constructor(owner, cfg) {
        super(owner, cfg);

    }

}
