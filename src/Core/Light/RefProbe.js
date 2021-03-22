import Probe from "./Probe.js";

/**
 * RefProbe。<br/>
 * 反射探头用于反射环境光，典型的用法是用于模拟菲涅尔效应。<br/>
 * @author Kkk
 * @date 2021年3月22日17点17分
 */
export default class RefProbe extends Probe{
    getType(){
        return 'RefProbe';
    }
    getTypeId(){
        return 5;
    }
    constructor(owner, cfg) {
        super(owner, cfg);
    }

}
