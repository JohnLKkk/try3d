import Component from "../../Component.js";
import Node from "../../Node/Node.js";
import Log from "../../Util/Log.js";
import Vector3 from "../../Math3d/Vector3.js";

/**
 * FixedControl提供对指定节点的固定大小控制，不随着距离相机距离而发生变化。<br/>
 * @author Kkk
 * @date 2022年6月9日14点26分
 */
export default class FixedControl extends Component{
    constructor(owner, cfg) {
        super(owner, cfg);
        if(!(owner instanceof Node)){
            Log.error('owner必须是Geometry或其子类!');
        }
        this._m_TempVec3_1 = new Vector3();
        this._m_LastDist = -1;
        this._m_WorldSizeFactor = 0.07;
        this._m_Scene.on('render', (exTime)=>{
            this._doUpdate();
        });
    }

    /**
     * 设置世界缩放因子。<br/>
     * @param {Number}[factor]
     */
    setWorldSizeFactor(factor){
        this._m_WorldSizeFactor = factor;
    }

    /**
     * 重载_update方法。<br/>
     * @private
     */
    _update(){
        let currentMainCamera = this._m_Scene.getComponent('mainCamera');
        this._m_Owner.getWorldTranslation().sub(currentMainCamera.getEye(), this._m_TempVec3_1);
        const dist = Math.abs(this._m_TempVec3_1.length());
        if(dist !== this._m_LastDist){
            if(currentMainCamera.isParallelProjection()){

            }
            else{
                // 暂时只处理透射投影
                const worldWidthSize = Math.tan(currentMainCamera.getFovy() * 0.5) * dist;
                const size = this._m_WorldSizeFactor * worldWidthSize;
                // 更新缩放
                this._m_Owner.setLocalScaleXYZ(size, size, size);
                this._m_LastDist = dist;
            }
        }
    }

}
