import Component from "../Component.js";

/**
 * LodControl。<br/>
 * 该控制器提供了对持有对象（通常继承自Geometry）的"Level of detail"的支持。<br/>
 * @author Kkk
 * @date 2021年3月14日08点30分
 */
export default class LodControl extends Component{
    getType() {
        return 'LodControl';
    }

    constructor(owner, cfg) {
        super(owner, cfg);

    }

}
