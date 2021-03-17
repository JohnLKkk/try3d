/**
 * 渲染队列。<br/>
 * 保存各个渲染队列数据。<br/>
 * @author Kkk
 * @date 2021年2月10日2021年2月10日
 * @lastdate 2021年3月17日16点48分
 */
export default class RenderQueue {
    static _TEMP_BUCKET_ARRAY = [];
    static _TEMP_ARRAY = [];
    constructor() {
        // 不透明队列
        this.m_OpaqueBucket = {};
        // 半透明队列(key : Material, value : List<Geometry>)
        this.m_TranslucentBucket = {};
        // ...其他队列(比如Sky,GUI)
    }
    addToOpaque(iDrawable){

    }

    /**
     * 次序相关的半透明排序。<br/>
     * @param {Camera}[cam]
     * @param {Array}[translucentBucket]
     * @return {Array}
     */
    static sortTranslucentBucket(cam, translucentBucket){
        let result = RenderQueue._TEMP_BUCKET_ARRAY;
        result.length = 0;
        let temp = RenderQueue._TEMP_ARRAY;
        temp.length = 0;
        let camPos = cam.getEye();
        translucentBucket.forEach(geo=>{
            temp.push([geo.getLocalTranslation().distanceSq(camPos), geo]);
        });
        // 从远往近排序
        temp.sort((a, b)=>{return b[0] - a[0];});
        // 应该还要结合材质Id进行排序,以便尽可能在物体次序正确下材质排序
        temp.forEach(t=>{
            result.push(t[1]);
        });
        return result;
    }

}
