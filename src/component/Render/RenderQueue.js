/**
 * 渲染队列。<br/>
 * 保存各个渲染队列数据。<br/>
 * @author Kkk
 * @date 2021年2月10日2021年2月10日
 */
export default class RenderQueue {
    constructor() {
        // 不透明队列
        this.m_OpaqueBucket = {};
        // 半透明队列(key : Material, value : List<Geometry>)
        this.m_TranslucentBucket = {};
        // ...其他队列(比如Sky,GUI)
    }
    addToOpaque(iDrawable){

    }

}
