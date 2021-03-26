/**
 * FilterUtils。<br/>
 * 包含一些工具方法。<br/>
 * @author Kkk
 * @date 2021年3月26日17点56分
 */
import FramePicture from "../Node/FramePicture.js";
import Tools from "../Util/Tools.js";

export default class FilterUtils {
    /**
     * 创建一个FilterFramePicture。<br/>
     * 为了避免js继承循环,所以不能在Filter类中封装。<br/>
     * @param {Component}[owner]
     * @return {Picture}
     */
    static newFilterPicture(owner){
        return new FramePicture(owner, {id:Tools.nextId()});
    }
}
