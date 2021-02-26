import Component from "../Component.js";

/**
 * OctCullingControl。<br/>
 * 对有界场景树提供基于动态八叉树优化策略。<br/>
 * @author Kkk
 * @date 2021年2月26日16点21分
 */
export default class OctCullingControl extends Component{
    getType(){
        return 'OctCullingControl';
    }
    constructor(owner, cfg) {
        super(owner, cfg);

    }

}
