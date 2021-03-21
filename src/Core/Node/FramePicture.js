import Picture from "./Picture.js";

/**
 * FramePicture。<br/>
 * 提供后置渲染的帧数据捕捉。<br/>
 * @author Kkk
 * @date 2021年2月28日12点17分
 */
export default class FramePicture extends Picture{
    getType() {
        return 'FramePicture';
    }

    constructor(owner, cfg) {
        super(owner, cfg);
    }
    isFramePicture(){
        return true;
    }
}
