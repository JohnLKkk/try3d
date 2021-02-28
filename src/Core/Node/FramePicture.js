import Picture from "./Picture.js";

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
