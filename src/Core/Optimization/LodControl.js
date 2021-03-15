import Component from "../Component.js";
import Node from "../Node/Node.js";
import Log from "../Util/Log.js";
import Tools from "../Util/Tools.js";

/**
 * LodControl。<br/>
 * 该控制器提供了对持有对象（通常继承自Geometry）的"Level of detail"的支持。<br/>
 * 最初的思路是查找屏幕面积得到需要的lod级别，尽管该逻辑大部分正确，但是暂时使用更快的范围级别LOD。<br/>
 * @author Kkk
 * @date 2021年3月14日08点30分
 * @lastdate 2021年3月15日16点26分
 */
export default class LodControl extends Component{
    getType() {
        return 'LodControl';
    }

    /**
     * 创建LodControl。<br/>
     * @param {Geometry}[owner]
     * @param {String}[cfg.id 组件id]
     * @param {Number}[cfg.distCommonDifference 每个层次的距离公差,默认为1.0]
     * @param {Number}[cfg.trisPerPixel 每像素三角形数量,由于暂时不基于面积实现,所以忽略该参数]
     */
    constructor(owner, cfg) {
        super(owner, cfg);
        if(!(owner instanceof Node)){
            Log.error('owner必须是Geometry或其子类!');
        }

        // 记录最后的距离
        this._m_LastDistance = 0.0;
        // 记录最后的细节层次级别
        this._m_LastLodLevel = 0;
        // 距离公差
        this._m_DistCommonDifference = cfg.distCommonDifference || 1.0;
        // 每个层级距离
        this._m_LodLevelDists = [];
        // 每像素三角形大小
        this._m_TrisPerPixel = cfg.trisPerPixel || 1.0;
        // 细节层次数量
        this._m_NumLodLevels = 0;
        // 每个细节层次三角形数量
        this._m_NumTris = [];

        this.distr();
        this._m_Scene.on('render', (exTime)=>{
            this._doUpdate();
        });
    }

    /**
     * 分配数据。<br/>
     */
    distr(){
        this._m_NumLodLevels = this._m_Owner.getMesh().getLodLevelCount();
        for(let i = 0;i < this._m_NumLodLevels;i++){
            this._m_NumTris[i] = this._m_Owner.getMesh().getLodPrimitiveCount(i);
            this._m_LodLevelDists[i] = this._m_DistCommonDifference * i;
        }
    }
    _update(){
        let bv = this._m_Owner.getAABBBoundingBox();

        let mainCamera = this._m_Scene.getMainCamera();
        let atanNH = Math.atan(mainCamera.getTop() * mainCamera.getNear());
        let ratio = Math.PI / (8.0 * atanNH);
        let distance = bv.distance(mainCamera.getEye()) / ratio;
        let lodLevel = 0;
        // Log.log('distance:' + distance + ';lastDistance:' + this._m_LastDistance + ";d:" + Math.abs(distance - this._m_LastDistance));

        if(distance > this._m_LastDistance && (Math.abs(distance - this._m_LastDistance) <= this._m_DistCommonDifference)){
            // 在细节层次有效移动范围内,不改变细节层次级别
            lodLevel = this._m_LastLodLevel;
        }
        else if(this._m_LastDistance > distance && this._m_LastLodLevel == 0){
            // 已经处于最低级别,但仍在靠近物体,直接返回最低级别
            lodLevel = this._m_LastLodLevel;
        }
        else if(this._m_LastDistance < distance && this._m_LastLodLevel == this._m_NumLodLevels - 1){
            // 已经处于最远级别,但仍在远离物体,直接返回最远级别
            lodLevel = this._m_LastLodLevel;
        }
        else{
            if(distance > this._m_LastDistance){
                lodLevel = this._m_LastLodLevel+1;
            }
            else{
                lodLevel = this._m_LastLodLevel-1;
            }
            lodLevel = Math.min(lodLevel, this._m_NumLodLevels);
            lodLevel = Math.max(lodLevel, 0);
            this._m_LastDistance = this._m_LodLevelDists[lodLevel];

            // 下面是另一个实现,使用近似面积计算,但是似乎该实现有问题
            // // 近似计算边界体面积
            // // 按照最远过滤查找最匹配的细节层次级别
            // this._m_LastDistance = distance;
            //
            // let area = Tools.approxScreenArea(bv, this._m_LastDistance, mainCamera.getWidth()) * this._m_TrisPerPixel;
            // lodLevel = this._m_NumLodLevels - 1;
            // for(let i = this._m_NumLodLevels;--i >= 0;){
            //     if(area - this._m_NumTris[i] < 0){
            //         break;
            //     }
            //     lodLevel = i;
            // }

            this._m_LastLodLevel = lodLevel;
        }
        this._m_Owner.lod(lodLevel);
    }

}
