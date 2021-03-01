import Component from "../Component.js";
import Node from "../Node/Node.js";
import OctNode from "./OctNode.js";
import Geometry from "../Node/Geometry.js";
import AABBBoundingBox from "../Math3d/Bounding/AABBBoundingBox.js";
import Vector3 from "../Math3d/Vector3.js";
import MeshFactor from "../Util/MeshFactor.js";

/**
 * OctCullingControl。<br/>
 * 对有界场景树提供基于动态八叉树优化策略。<br/>
 * @author Kkk
 * @date 2021年2月26日16点21分
 */
export default class OctCullingControl extends Component{
    static S_TEMP_AABBBOUNDINGBOX = new AABBBoundingBox();
    static S_TEMP_MIN = new Vector3();
    static S_TEMP_MAX = new Vector3();
    getType(){
        return 'OctCullingControl';
    }
    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_OctNode = null;

        // 判断当前持有对象是否为有效的Node类型
        if(owner instanceof Node){
            // 以该owner为树根节点构建八叉树
            owner.clearCullingFlags(Node.S_DEFAULT_FRUSTUM_CULLING);
            // 默认深度4
            this.createOct(owner, 4);
            // 在每一帧渲染时进行八叉树加速剔除
            if(this._m_OctNode){
                let visDrawables = null;
                let frustumCullingCamera = null;
                // 这里的架构有问题,理论上应该是owner来更新子组件,但是这里直接监听scene组件的render事件,后面再调整架构
                this._m_Scene.on('render', (exTime)=>{
                    // 获取剔除相机和显示列表
                    visDrawables = this._m_Scene.getRender().getVisDrawables();
                    frustumCullingCamera = this._m_Scene.getFrustumCullingCamera();
                    this.octCulling(frustumCullingCamera, visDrawables);
                });
            }
        }
    }

    /**
     * 调试OctCullingControl。<br/>
     * 将Octree叶子节点绘制到渲染器中以便查看计算正确性。<br/>
     * @param {Node}[sceneNode]
     * @param {Material}[debugMat]
     * @param {OctNode}[leaf]
     * @private
     */
    _debug(sceneNode, debugMat, leaf){
        if(leaf.isValid()){
            let leafGeo = new Geometry(sceneNode, {id:MeshFactor.nextId() + "_oct"});
            leafGeo.setMesh(MeshFactor.createAABBBoundingBoxMeshFromAABBBoundingBox(leaf.getAABBBoundingBox()));
            leafGeo.setMaterial(debugMat);
            leafGeo.updateBound();
            // leafGeo.clearCullingFlags(Node.S_DEFAULT_FRUSTUM_CULLING);
            sceneNode.addChildren(leafGeo);
            // 子列表
            if(leaf.getLeafs()){
                leaf.getLeafs().forEach(leaf=>{
                    this._debug(sceneNode, debugMat, leaf);
                });
            }
        }
    }

    /**
     * 调试OctCullingControl。<br/>
     * 通过将Octree绘制到引擎中以便调试。<br/>
     * @param {Node}[sceneNode]
     * @param {Material}[debugMat]
     */
    debug(sceneNode, debugMat){
        if(this._m_OctNode){
            // 绘制八叉树到sceneNode中
            this._debug(sceneNode, debugMat, this._m_OctNode);
            // console.log("oct:", this._m_OctNode);
        }
    }

    /**
     * 创建八叉树。<br/>
     * @param {Node}[node]
     * @param {Number}[depth]
     */
    createOct(node, depth){
        // 获取AABB边界
        let aabb = node.getAABBBoundingBox();
        if(aabb){
            // 如果存在有效边界体,则进行构建,这意味着无效根节点不会为其创建八叉树
            // 标准八叉树
            let standardAABB = new AABBBoundingBox();
            let xHalf = aabb.getXHalf();
            let yHalf = aabb.getYHalf();
            let zHalf = aabb.getZHalf();
            let d = Math.max(Math.max(xHalf, yHalf), zHalf);
            let c = aabb.getCenter();
            standardAABB.fromMinMax(new Vector3(-d + c._m_X, -d + c._m_Y, -d + c._m_Z), new Vector3(d + c._m_X, d + c._m_Y, d + c._m_Z));
            this._m_OctNode = new OctNode(null, standardAABB);
            // 用于标记根节点为有效(这里其实应该判断子节点是否有一个包含有效数据)
            this._m_OctNode.setValid(true);
            console.log("开始预建!");
            this._preBuilt(this._m_OctNode, depth);
            console.log("预建完成!");

            // 分配八叉树
            this.distrNode(node, this._m_OctNode);
        }
    }

    /**
     * 预建叶子。<br/>
     * @param {OctNode}[oct 父节点]
     * @param {Number}[depth 当前深度]
     * @private
     */
    _preBuiltOctLeaf(oct, depth){
        // 建立叶子
        // 并对每个叶子递归预建立
        let leaf = null;
        let leafs = oct.getLeafs();
        let pAABB = oct.getAABBBoundingBox();
        let pMin = pAABB.getMin();
        let pMax = pAABB.getMax();
        let pCenter = pAABB.getCenter();
        // tbl
        // min.x,center.y,min.z/center.x,max.y,center.z
        OctCullingControl.S_TEMP_MIN.setToInXYZ(pMin._m_X, pCenter._m_Y, pMin._m_Z);
        OctCullingControl.S_TEMP_MAX.setToInXYZ(pCenter._m_X, pMax._m_Y, pCenter._m_Z);
        OctCullingControl.S_TEMP_AABBBOUNDINGBOX.fromMinMax(OctCullingControl.S_TEMP_MIN, OctCullingControl.S_TEMP_MAX);
        leaf = new OctNode(null, OctCullingControl.S_TEMP_AABBBOUNDINGBOX);
        leafs.push(leaf);
        this._preBuilt(leaf, depth);

        // tfl
        // min.x,center.y,center.z/center.x,max.y,max.z
        OctCullingControl.S_TEMP_MIN.setToInXYZ(pMin._m_X, pCenter._m_Y, pCenter._m_Z);
        OctCullingControl.S_TEMP_MAX.setToInXYZ(pCenter._m_X, pMax._m_Y, pMax._m_Z);
        OctCullingControl.S_TEMP_AABBBOUNDINGBOX.fromMinMax(OctCullingControl.S_TEMP_MIN, OctCullingControl.S_TEMP_MAX);
        leaf = new OctNode(null, OctCullingControl.S_TEMP_AABBBOUNDINGBOX);
        leafs.push(leaf);
        this._preBuilt(leaf, depth);

        // tbr
        // center.x,center.y,min.z/max.x,max.y,center.z
        OctCullingControl.S_TEMP_MIN.setToInXYZ(pCenter._m_X, pCenter._m_Y, pMin._m_Z);
        OctCullingControl.S_TEMP_MAX.setToInXYZ(pMax._m_X, pMax._m_Y, pCenter._m_Z);
        OctCullingControl.S_TEMP_AABBBOUNDINGBOX.fromMinMax(OctCullingControl.S_TEMP_MIN, OctCullingControl.S_TEMP_MAX);
        leaf = new OctNode(null, OctCullingControl.S_TEMP_AABBBOUNDINGBOX);
        leafs.push(leaf);
        this._preBuilt(leaf, depth);

        // tfr
        // center.x,center.y,center.z/max.x,max.y,max.z
        OctCullingControl.S_TEMP_MIN.setToInXYZ(pCenter._m_X, pCenter._m_Y, pCenter._m_Z);
        OctCullingControl.S_TEMP_MAX.setToInXYZ(pMax._m_X, pMax._m_Y, pMax._m_Z);
        OctCullingControl.S_TEMP_AABBBOUNDINGBOX.fromMinMax(OctCullingControl.S_TEMP_MIN, OctCullingControl.S_TEMP_MAX);
        leaf = new OctNode(null, OctCullingControl.S_TEMP_AABBBOUNDINGBOX);
        leafs.push(leaf);
        this._preBuilt(leaf, depth);

        // bbl
        // min.x,min.y,min.z/center.x,center.y,center.z
        OctCullingControl.S_TEMP_MIN.setToInXYZ(pMin._m_X, pMin._m_Y, pMin._m_Z);
        OctCullingControl.S_TEMP_MAX.setToInXYZ(pCenter._m_X, pCenter._m_Y, pCenter._m_Z);
        OctCullingControl.S_TEMP_AABBBOUNDINGBOX.fromMinMax(OctCullingControl.S_TEMP_MIN, OctCullingControl.S_TEMP_MAX);
        leaf = new OctNode(null, OctCullingControl.S_TEMP_AABBBOUNDINGBOX);
        leafs.push(leaf);
        this._preBuilt(leaf, depth);

        // bfl
        // min.x,min.y,center.z/center.x,center.y,max.z
        OctCullingControl.S_TEMP_MIN.setToInXYZ(pMin._m_X, pMin._m_Y, pCenter._m_Z);
        OctCullingControl.S_TEMP_MAX.setToInXYZ(pCenter._m_X, pCenter._m_Y, pMax._m_Z);
        OctCullingControl.S_TEMP_AABBBOUNDINGBOX.fromMinMax(OctCullingControl.S_TEMP_MIN, OctCullingControl.S_TEMP_MAX);
        leaf = new OctNode(null, OctCullingControl.S_TEMP_AABBBOUNDINGBOX);
        leafs.push(leaf);
        this._preBuilt(leaf, depth);

        // bbr
        // center.x,min.y,min.z/max.x,center.y,center.z
        OctCullingControl.S_TEMP_MIN.setToInXYZ(pCenter._m_X, pMin._m_Y, pMin._m_Z);
        OctCullingControl.S_TEMP_MAX.setToInXYZ(pMax._m_X, pCenter._m_Y, pCenter._m_Z);
        OctCullingControl.S_TEMP_AABBBOUNDINGBOX.fromMinMax(OctCullingControl.S_TEMP_MIN, OctCullingControl.S_TEMP_MAX);
        leaf = new OctNode(null, OctCullingControl.S_TEMP_AABBBOUNDINGBOX);
        leafs.push(leaf);
        this._preBuilt(leaf, depth);

        // bfr
        // center.x,min.y,center.z/max.x,center.y,max.z
        OctCullingControl.S_TEMP_MIN.setToInXYZ(pCenter._m_X, pMin._m_Y, pCenter._m_Z);
        OctCullingControl.S_TEMP_MAX.setToInXYZ(pMax._m_X, pCenter._m_Y, pMax._m_Z);
        OctCullingControl.S_TEMP_AABBBOUNDINGBOX.fromMinMax(OctCullingControl.S_TEMP_MIN, OctCullingControl.S_TEMP_MAX);
        leaf = new OctNode(null, OctCullingControl.S_TEMP_AABBBOUNDINGBOX);
        leafs.push(leaf);
        this._preBuilt(leaf, depth);
    }

    /**
     * 根据深度预建Oct。<br/>
     * @param {OctNode}[oct]
     * @param {Number}[depth]
     * @private
     */
    _preBuilt(oct, depth){
        // 递归建立八叉树
        if(depth > 0){
            depth--;
            oct.initLeafs();
            // 创建叶子
            this._preBuiltOctLeaf(oct, depth);
        }
    }

    /**
     * 分配Node到Octree中。<br/>
     * @param {Node}[node]
     * @param {OctNode}[oct]
     */
    distrNode(node, oct){
        let children = node.getChildren();
        if(children && children.length > 0){
            // 将子节点分配到合适的八叉树节点中
            children.forEach(cn=>{
                this.distrNode(cn, oct);
            });
        }
        else if(node instanceof Geometry){
            // 默认ref到Geometry
            // 理论上也应该只ref到Geometry
            this.distrOct(node, oct);
        }
    }

    /**
     * 分配ref到octree中。<br/>
     * @param {Object}[ref 一般是Geometry]
     * @param {OctNode}[oct]
     * @return {Boolean}
     */
    distrOct(ref, oct){
        let refAABB = ref.getAABBBoundingBox();
        if(oct.getAABBBoundingBox().contains(refAABB)){
            // 递归leaf
            let leafs = oct.getLeafs();
            if(leafs != null){
                let distrToLeaf = false;
                for(let i = 0;i < 8;i++){
                    // 只要有一个leaf包含该ref则退出(因为包含是完全包含)
                    if(this.distrOct(ref, leafs[i])){
                        // 将此节点标记为有效,以便加速剔除
                        distrToLeaf = true;
                        oct.setValid(true);
                        break;
                    }
                }
                // 说明无法被leaf包含
                // 则添加到当前oct
                if(!distrToLeaf){
                    oct.addRef(ref);
                    oct.setValid(true);
                }
                return true;
            }
            else{
                // 已经是leaf,包含该ref并返回true
                oct.addRef(ref);
                oct.setValid(true);
                return true;
            }
        }
        // 当前节点无法包含ref
        return false;
    }

    /**
     * 剔除叶子节点。<br/>
     * @param {OctNode}[leaf]
     * @param {Camera}[frustumCamera]
     * @param {Drawable[]}[visDrawables]
     */
    cullingLeafs(leaf, frustumCamera, visDrawables){
        // 只检测有效叶子
        if(leaf.isValid()){
            if(leaf.inFrustum(frustumCamera)){
                if(leaf.getRefs()){
                    // 加入渲染列表
                    let restoreFrustumMask = frustumCamera.getFrustumMask();
                    leaf.getRefs().forEach(ref=>{
                        // 对这些ref进行精确FrustumCulling
                        // 似乎有bug
                        if(ref.inFrustum(frustumCamera)){
                            visDrawables.push(ref);
                        }
                        // visDrawables.push(ref);
                        frustumCamera.setFrustumMask(restoreFrustumMask);
                    });
                }
                // 判断是否为叶子节点
                if(leaf.getLeafs()){
                    // 递归检测其叶子列表
                    let restoreFrustumMask = frustumCamera.getFrustumMask();
                    leaf.getLeafs().forEach(leaf=>{
                        frustumCamera.setFrustumMask(restoreFrustumMask);
                        this.cullingLeafs(leaf, frustumCamera, visDrawables);
                    });
                }
            }
        }
    }

    /**
     * 进行octCulling。<br/>
     * @param {Camera}[frustumCamera]
     * @param {Drawables[]}[visDrawables]
     */
    octCulling(frustumCamera, visDrawables){
        let restoreFrustumMask = frustumCamera.getFrustumMask();
        // 从oct根节点开始
        frustumCamera.setFrustumMask(0);
        this.cullingLeafs(this._m_OctNode, frustumCamera, visDrawables);
        // 恢复
        frustumCamera.setFrustumMask(restoreFrustumMask);
    }


}
