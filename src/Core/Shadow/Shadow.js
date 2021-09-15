/**
 * Shadow。<br/>
 * 该类封装了Shadow的一些计算方法,以便可以独立调试。<br/>
 * @author Kkk
 * @date 2021年9月15日17点38分
 */
export default class Shadow {
    /**
     * 计算光锥边界范围，这里的思路是根据near,far将光锥代表的范围计算到一个边界体中。<br/>
     * @param {Camera}[viewCam 通常是渲染主相机]
     * @param {Number}[newNear]
     * @param {Number}[newFar]
     * @param {Number}[scale]
     * @param {Array}[result 存放边界体结果，这里其实统一为8个点标记的边界体]
     */
    static calculateLightConeScope(viewCam, newNear, newFar, scale, result){
        let depthHeightRatio = viewCam.getTop() * 1.0 / viewCam.getNear();
        let near = newNear * 1.0;
        let far = newFar * 1.0;
        let top = viewCam.getTop() * 1.0;
        let right = viewCam.getRight() * 1.0;
        let ratio = right / top;

        let near_height = -1, near_width = -1, far_height = -1, far_width = -1;

        if(viewCam.isParallelProjection()){
            near_height = top;
            near_width = near_height * ratio;
            far_height = top;
            far_width = far_height * ratio;
        }
        else{
            near_height = depthHeightRatio * near;
            near_width = near_height * ratio;
            far_height = depthHeightRatio * far;
            far_width = far_height * ratio;
        }
    }
}
