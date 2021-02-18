import Light from "./Light.js";

/**
 * 聚光灯。<br/>
 * 包含位置,朝向,内外角等信息。<br/>
 * @author Kkk
 * @date 2021年2月17日14点41分
 */
export default class SpotLight extends Light{
    getType() {
        return 'SpotLight';
    }
    getTypeId() {
        return 2;
    }

    constructor(owner, cfg) {
        super(owner, cfg);

    }

}
