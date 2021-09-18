import Geometry from "../Node/Node.js";
import AABBBoundingBox from "../Math3d/Bounding/AABBBoundingBox";
import BoundingVolume from "../Math3d/Bounding/BoundingVolume";
import Vector3 from "../Math3d/Vector3";

/**
 * SplitOccluders。<br/>
 * 用于计算锥体内潜在可见集合的辅助类。<br/>
 * @author Kkk
 * @date 2021年9月17日16点15分
 */
export default class SplitOccluders {
    _m_VP;
    _m_CasterCount;
    _m_SplitBoundaryBox;
    _m_CasterBoundaryBox;
    _m_SplitOccluders;


    static S_TEMP_VEC3_0 = new Vector3();
    static S_TEMP_VEC3_1 = new Vector3();
    static S_TEMP_VEC3_2 = new Vector3();
    static S_AABB_BOUNDARY_BOX0 = new AABBBoundingBox();
    static S_AABB_BOUNDARY_BOX1 = new AABBBoundingBox();

    /**
     * 分区潜在可见集合计算。<br/>
     * @param {Matrix44}[props.pv]
     * @param {Number}[props.casterCount]
     * @param {AABBBoundingBox}[props.splitBoundaryBox]
     * @param {AABBBoundingBox}[props.casterBoundaryBox]
     * @param {Geometry[]}[props.splitOccluders]
     */
    constructor(props) {
        this._m_VP = props.pv;
        this._m_CasterCount = props.casterCount;
        this._m_SplitBoundaryBox = props.splitBoundaryBox;
        this._m_CasterBoundaryBox = props.casterBoundaryBox;
        this._m_SplitOccluders = props.splitOccluders;
    }

    /**
     * 计算潜在可见集合。<br/>
     * @param {Node}[rootNode]
     */
    calculate(rootNode){
        this._calculate(rootNode);
        return this._m_CasterCount;
    }
    _calculate(node){
        if(node.getFilterFlag() == Node.S_ALWAYS)return;

        if(node.isDrawable && node.isDrawable()){
            if(node.isCastShadow()){
                let bv = node.getBoundingVolume();
                let obv = bv.transformFromMat44(this._m_VP, SplitOccluders.S_AABB_BOUNDARY_BOX0);

                let intersects = this._m_SplitBoundaryBox.contains(obv);
                if(!intersects && bv.getType() == BoundingVolume.S_TYPE_AABB){
                    // 将包围体延伸到光锥体内
                    // 尽管物体不在光锥内，但是阴影仍然可能在光锥内
                    // 50只是一个经验值
                    obv.setZHalf(obv.getZHalf() + 50);
                    obv.setCenter(obv.getCenter(SplitOccluders.S_TEMP_VEC3_0).addInXYZ(0, 0, 25));
                    // 再次测试
                    if(this._m_SplitBoundaryBox.contains(obv)){
                        let x = obv.getCenter(SplitOccluders.S_TEMP_VEC3_1)._m_X;
                        if(Math.abs(x) != Number.MAX_VALUE && !Number.isNaN(x) && !Number.isFinite(x)){
                            // 通过测试后,将边界体重设为原始状态并添加
                            // 防止用新的偏移边界体扩大了深度范围
                            obv.setZHalf(obv.getZHalf() - 50);
                            obv.setCenter(obv.getCenter(SplitOccluders.S_TEMP_VEC3_0).subInXYZ(0, 0, 25));
                            this._m_CasterBoundaryBox.merge(obv);
                            this._m_CasterCount++;
                        }
                        if(this._m_SplitOccluders != null){
                            this._m_SplitOccluders.push(node);
                        }
                    }
                }
                else if(intersects){
                    this._m_CasterBoundaryBox.merge(obv);
                    this._m_CasterCount++;
                    if(this._m_SplitOccluders != null){
                        this._m_SplitOccluders.push(node);
                    }
                }
            }
        }
        else{
            let bv = node.getBoundingVolume();
            let obv = bv.transformFromMat44(this._m_VP, SplitOccluders.S_AABB_BOUNDARY_BOX0);

            let intersects = this._m_SplitBoundaryBox.contains(obv);
            if(!intersects && obv.getType() == BoundingVolume.S_TYPE_AABB){
                // 将包围体延伸到光锥体内
                // 尽管物体不在光锥内，但是阴影仍然可能在光锥内
                // 50只是一个经验值
                obv.setZHalf(obv.getZHalf() + 50);
                obv.setCenter(obv.getCenter(SplitOccluders.S_TEMP_VEC3_0).addInXYZ(0, 0, 25));
                // 再次测试
                intersects = this._m_SplitBoundaryBox.contains(obv);
            }

            if(intersects){
                // 遍历子节点
                node.getChildren().forEach(children=>{
                    this._calculate(children);
                });
            }
        }
    }

}
