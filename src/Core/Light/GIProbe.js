import Probe from "./Probe.js";

/**
 * GIProbe。<br/>
 * GI探头，用于全局光照的探头捕捉器，以便能够在险隘空间为物体提供更加精确的全局光。<br/>
 * GI探头需要设置位置，范围（目前仅实现球形探头，后续再考虑拓展到边界探头），目前未实现探头混合（但预留了符号名，以便后续完善）。<br/>
 * @author Kkk
 * @date 2021年3月20日13点07分
 */
export default class GIProbe extends Probe{
    getType() {
        return 'GIProbe';
    }
    getTypeId() {
        return 4;
    }

    constructor(owner, cfg) {
        super(owner, cfg);
    }


}
