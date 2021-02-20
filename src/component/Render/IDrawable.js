/**
 * IDrawable接口定义了一个渲染元素,只有实现这个接口的对象才是一个可渲染元素。<br/>
 * @author Kkk
 */
export default class IDrawable {
    constructor() {
    }

    /**
     * 表示当前是否为可渲染实例
     */
    isDrawable(){

    }

    /**
     * 是否属于Post帧提交渲染
     */
    isFramePicture(){

    }

    /**
     * 是否为非透明
     */
    isOpaque(){

    }

    /**
     * 是否为半透明。<br/>
     */
    isTranslucent(){

    }

    /**
     * 是否为透明。<br/>
     */
    isTransparent(){

    }

    /**
     * 绘制当前元素。<br/>
     * @param frameContext
     */
    draw(frameContext){

    }

}
