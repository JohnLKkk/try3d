/**
 * 八叉树节点。<br/>
 * @author Kkk
 * @date 2021年2月23日17点05分
 */
import AABBBoundingBox from "../Math3d/Bounding/AABBBoundingBox.js";
import Camera from "../Scene/Camera.js";

export default class OctNode {
    // 叶子节点编号
    static S_LEAF_TBL = 0;
    static S_LEAF_TFL = 1;
    static S_LEAF_TBR = 2;
    static S_LEAF_TFR = 3;
    static S_LEAF_BBL = 4;
    static S_LEAF_BFL = 5;
    static S_LEAF_BBR = 6;
    static S_LEAF_BFR = 7;
    /**
     * 八叉树节点。<br/>
     * @param {Object[]}[refs 这里一般指向一个Geometry列表]
     * @param {AABBBoundingBox}[aabbBoundingBox]
     */
    constructor(refs, aabbBoundingBox) {
        // OctNode可能不包含Ref列表,但其叶子包含,所以仍然可能是有效节点
        this._m_Valid = false;
        this._m_Refs = refs;
        this._m_AABBBoundingBox = new AABBBoundingBox();
        this._m_AABBBoundingBox.setTo(aabbBoundingBox);
        this._m_Leafs = null;
        // 剔除状态
        this._m_FrustumContain = null;
    }
    /**
     * 检测是否处于视锥体中。<br/>
     * @param camera
     * @return {boolean}
     */
    inFrustum(camera){
        // 执行视锥剔除
        this._m_FrustumContain = camera.frustumContains(this.getAABBBoundingBox());
        return this._m_FrustumContain != Camera.S_FRUSTUM_INTERSECT_OUTSIDE;
    }

    /**
     * 设置为有效节点。<br/>
     * @param {Boolean}[valid]
     */
    setValid(valid){
        this._m_Valid = valid;
    }

    /**
     * 是否为有效节点。<br/>
     * @return {Boolean}
     */
    isValid(){
        return this._m_Valid;
    }

    /**
     * 添加一个ref。<br/>
     * @param {Object}[ref]
     */
    addRef(ref){
        if(!this._m_Refs){
            this._m_Refs = [];
        }
        this._m_Refs.push(ref);
    }

    /**
     * 返回所有ref。<br/>
     * @return {Object[]}
     */
    getRefs(){
        return this._m_Refs;
    }

    /**
     * 返回AABBBoundingBox。<br/>
     * @return {AABBBoundingBox}
     */
    getAABBBoundingBox(){
        return this._m_AABBBoundingBox;
    }

    /**
     * 返回指定叶子。<br/>
     * @param {Number}[number]
     * @return {OctNode}
     */
    getLeaf(number){
        return this._m_Leafs[number];
    }

    /**
     * 返回叶子列表。<br/>
     * @return {OctNode[]}
     */
    getLeafs(){
        return this._m_Leafs;
    }
    initLeafs(){
        // 不一定8个子节点,可变性
        this._m_Leafs = [];
    }

}
