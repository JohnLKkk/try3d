import Component from "../Component.js";
import Matrix44 from "../Math3d/Matrix44.js";
import Vector3 from "../Math3d/Vector3.js";
import Quaternion from "../Math3d/Quaternion.js";
import AABBBoundingBox from "../Math3d/Bounding/AABBBoundingBox.js";
import Camera from "../Scene/Camera.js";
import Tools from "../Util/Tools.js";
import Log from "../Util/Log.js";

/**
 * 节点组件表示场景的一个关节，用于对场景进行场景图管理。<br/>
 * @author Kkk
 */
export default class Node extends Component{
    // Events
    static S_WORLD_MATRIX_UPDATE = 'S_WORLD_MATRIX_UPDATE';
    // 默认视锥剔除
    static S_DEFAULT_FRUSTUM_CULLING = 1 << 1;
    // 动态剔除
    static S_DYNAMIC = 1 << 2;
    // 总是剔除
    static S_ALWAYS = 1 << 3;
    // 永不
    static S_NEVER = 1 << 4;
    // 接受阴影
    static S_SHADOW_RECEIVE = 1 << 1;
    // 计算阴影
    static S_SHADOW_CAST = 1 << 2;
    // 计算并接受阴影
    static S_SHADOW_CAST_AND_RECEIVE = 1 << 3;
    // 关闭阴影
    static S_SHADOW_NONE = 0;
    static S_TEMP_VEC3 = new Vector3();
    static S_TEMP_Q = new Quaternion();
    static S_TEMP_VEC3_2 = new Vector3();
    getType() {
        return 'Node';
    }

    constructor(owner, cfg) {
        // 在不同叶子中,可能存在同名NodeName
        // 为了区别componentId和NodeName,并使得componentId唯一,这里使用生成算法生成componentId
        // 后续改为NodeName和componentId分开设置
        super(owner, {id:Tools.nextId() + cfg.id});
        this._m_Name = cfg.id;
        this._m_CurrentLod = 0;
        // 变换信息
        this._m_LocalMatrix = new Matrix44();
        this._m_WorldMatrix = new Matrix44();
        this._m_Parent = null;
        this._m_Children = [];
        this._m_ChildrenIDs = {};

        // local
        // 缩放
        this._m_LocalScale = new Vector3(1, 1, 1);
        // 旋转
        this._m_LocalRotation = new Quaternion(0, 0, 0, 1);
        // 平移
        this._m_LocalTranslation = new Vector3();

        // world
        // 缩放
        this._m_WorldScale = new Vector3(1, 1, 1);
        // 旋转
        this._m_WorldRotation = new Quaternion(0, 0, 0, 1);
        // 平移
        this._m_WorldTranslation = new Vector3();

        // 两种可能,本地矩阵发生变化时,需要更新本地矩阵,然后更新世界矩阵
        // 本地矩阵没有发生变化时,只需要更新世界矩阵
        this._m_UpdateLocalMatrix = false;
        this._m_UpdateWorldMatrix = false;

        // 包围盒(Node的包围盒由所有子节点合并得到)
        this._m_BoudingVolume = null;
        // 设置为true,确保第一次调用getBoundingVolume()时可以获得有效BoundingVolume
        this._m_UpdateBoundingVolume = true;

        // 与视锥体的状态
        this._m_FrustumContain = Camera.S_FRUSTUM_INTERSECT_INTERSECTS;
        // 剔除模式(动态,总不,总是)
        this._m_CullMode = null;
        // 剔除标记
        this._m_CullingFlags = 1;
        this._m_CullingFlags |= Node.S_DEFAULT_FRUSTUM_CULLING;
        // 过滤标记
        this._m_FilterFlag = Node.S_DYNAMIC;
        // 阴影模式
        this._m_ShadowMode = 1;
        this._m_ShadowMode |= Node.S_SHADOW_CAST_AND_RECEIVE;
    }

    /**
     * 设置是否计算阴影。<br/>
     * @param {Boolean}[cast]
     */
    castShadow(cast){
        if(cast && ((this._m_ShadowMode & Node.S_SHADOW_CAST) == 0 || (this._m_ShadowMode & Node.S_SHADOW_CAST_AND_RECEIVE) == 0)){
            this._m_ShadowMode |= Node.S_SHADOW_CAST;
        }
        else{
            if((this._m_ShadowMode & Node.S_SHADOW_CAST) != 0){
                this._m_ShadowMode ^= Node.S_SHADOW_CAST;
            }
            if((this._m_ShadowMode & Node.S_SHADOW_CAST_AND_RECEIVE) != 0){
                this._m_ShadowMode ^= Node.S_SHADOW_CAST_AND_RECEIVE;
                console.log('_m_ShadowMode:' + this._m_ShadowMode);
                if(this._m_ShadowMode & Node.S_SHADOW_RECEIVE == 0){
                    this._m_ShadowMode |= Node.S_SHADOW_RECEIVE;
                }
            }
        }
        this._m_Children.forEach(c=>{
            c.castShadow(cast);
        });
    }

    /**
     * 返回是否计算阴影。<br/>
     * @return {Boolean}
     */
    isCastShadow(){
        return ((this._m_ShadowMode & Node.S_SHADOW_CAST) != 0) || ((this._m_ShadowMode & Node.S_SHADOW_CAST_AND_RECEIVE) != 0);
    }

    /**
     * 设置是否接受阴影。<br/>
     * @param {Boolean}[receive]
     */
    receiveShadow(receive){
        if(receive && ((this._m_ShadowMode & Node.S_SHADOW_RECEIVE) == 0 || (this._m_FilterFlag & Node.S_SHADOW_CAST_AND_RECEIVE) == 0)){
            this._m_ShadowMode |= Node.S_SHADOW_RECEIVE;
        }
        else{
            if((this._m_ShadowMode & Node.S_SHADOW_RECEIVE) != 0){
                this._m_ShadowMode ^= Node.S_SHADOW_RECEIVE;
            }
            if((this._m_ShadowMode & Node.S_SHADOW_CAST_AND_RECEIVE) != 0){
                this._m_ShadowMode ^= Node.S_SHADOW_CAST_AND_RECEIVE;
                if(this._m_ShadowMode & Node.S_SHADOW_CAST == 0){
                    this._m_ShadowMode |= Node.S_SHADOW_CAST;
                }
            }
        }
        this._m_Children.forEach(c=>{
            c.receiveShadow(receive);
        });
    }

    /**
     * 返回是否接受阴影。<br/>
     * @return {Boolean}
     */
    isReceiveShadow(){
        return ((this._m_ShadowMode & Node.S_SHADOW_RECEIVE) != 0) || ((this._m_ShadowMode & Node.S_SHADOW_CAST_AND_RECEIVE) != 0);
    }

    /**
     * 表示当前是否为可渲染实例
     */
    isDrawable(){
        return false;
    }

    /**
     * 设置当前分支下所有渲染实例的细节层次。<br/>
     * @param {Number}[lod]
     */
    lod(lod){
        if(this._m_CurrentLod == lod)return;
        // 提前判断可以减少forEach空列表带来的开销
        if(this._m_Children.getChildren().length > 0){
            this._m_Children.forEach(c=>{
                c.lod(lod);
            });
        }
    }

    /**
     * 设置过滤标记。<br/>
     * @param {Number}[filterFlag]
     */
    setFilterFlag(filterFlag){
        this._m_FilterFlag = filterFlag;
    }

    /**
     * 返回过滤标记，为Node.S_DYNAMIC,Node.S_ALWAYS和Node.S_NEVER之一。<br/>
     * @return {Number}
     */
    getFilterFlag(){
        return this._m_FilterFlag;
    }

    /**
     * 返回剔除标记。<br/>
     * @return {Number}
     */
    getCullingFlags(){
        return this._m_CullingFlags;
    }

    /**
     * 清楚指定剔除标记。<br/>
     * @param {Number}[flags 指定的剔除标记位]
     */
    clearCullingFlags(flags){
        this._m_CullingFlags ^= flags;
    }

    /**
     * 添加指定剔除标记位。<br/>
     * @param {Number}[flags]
     */
    addCullingFlags(flags){
        this._m_CullingFlags |= flags;
    }

    /**
     * 检测是否处于视锥体中。<br/>
     * @param camera
     * @return {boolean}
     */
    inFrustum(camera){
        // 跳过不需要剔除的节点

        // 检测父节点是否被剔除(因为可能由外部调用该方法而非引擎调用)
        this._m_FrustumContain = this._m_Parent == null ? Camera.S_FRUSTUM_INTERSECT_INTERSECTS : this._m_Parent._m_FrustumContain;

        if(this._m_FrustumContain == Camera.S_FRUSTUM_INTERSECT_INTERSECTS){
            // 跳过一些特殊对象

            // 执行视锥剔除
            this._m_FrustumContain = camera.frustumContains(this.getBoundingVolume());
        }

        return this._m_FrustumContain != Camera.S_FRUSTUM_INTERSECT_OUTSIDE;
    }

    /**
     * 返回BoundingVolume。<br/>
     * 如果当前是Node节点，并且没有子节点或者子节点没有包围体，则返回null。<br/>
     * @return {BoundingVolume}
     */
    getBoundingVolume(){
        if(this._m_UpdateBoundingVolume){
            // 更新包围盒
            // 如果存在子节点,则合并子节点
            if(this._m_Children.length > 0){
                let aabb = null;
                // 清空包围体(避免保留上次结果)
                this._m_Children.forEach(children=>{
                    aabb = children.getBoundingVolume();
                    if(aabb){
                        // 说明存在子节点包围盒
                        if(!this._m_BoudingVolume){
                            // 说明是初次获取,则创建该Node的包围盒
                            this._m_BoudingVolume = new AABBBoundingBox();
                        }
                        // 合并子节点包围体
                        this._m_BoudingVolume.merge(aabb);
                    }
                });
            }
            this._m_UpdateBoundingVolume = false;
        }
        return this._m_BoudingVolume;
    }

    /**
     * 返回子节点列表。<br/>
     * @return {Node[]}
     */
    getChildren(){
        return this._m_Children;
    }

    /**
     * 返回指定名称的节点，将搜索整科树。<br/>
     * @param {String}[name]
     * @return {Node}
     */
    getChildrenAtName(name){
        let c = this._m_ChildrenIDs[name];
        if(c){
            return c;
        }
        else{
            // 遍历子节点
            let count = this._m_Children.length;
            for(let i = 0;i < count;i++){
                c = this._m_Children[i].getChildrenAtName(name);
                if(c){
                    return c;
                }
            }
        }
        return null;
    }

    /**
     * 返回指定索引的子节点。<br/>
     * @param {Number}[i]
     * @return {Node}
     */
    getChildrenAtIndex(i){
        if(i >= this._m_Children.length){
            return null;
        }
        return this._m_Children[i];
    }

    /**
     * 返回父节点。<br/>
     * @return {Node/Null}
     */
    getParent(){
        return this._m_Parent;
    }

    /**
     * 缩放。<br/>
     * @param {Vector3}[scale]
     */
    scale(scale){
        this._m_LocalScale.mult(scale);
        this._updateLocalMatrix();
    }

    /**
     * 缩放。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     */
    scaleXYZ(x, y, z){
        this._m_LocalScale.multInXYZ(x, y, z);
        this._updateLocalMatrix();
    }

    /**
     * 设置局部缩放。<br/>
     * @param {Vector3}[scale]
     */
    setLocalScale(scale){
        this._m_LocalScale.setTo(scale);
        this._updateLocalMatrix();
    }

    /**
     * 设置缩放。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     */
    setLocalScaleXYZ(x, y, z){
        this._m_LocalScale.setToInXYZ(x, y, z);
        this._updateLocalMatrix();
    }

    /**
     * 返回缩放。<br/>
     * @returns {Vector3}
     */
    getLocalScale(){
        return this._m_LocalScale;
    }

    /**
     * 返回world缩放。<br/>
     * @returns {Vector3}
     */
    getWorldScale(){
        // 调用一次用于计算当前最新的变换
        this.getWorldMatrix();
        return this._m_WorldScale;
    }

    /**
     * 根据指定四元数旋转。<br/>
     * @param {Quaternion}[q]
     */
    rotate(q){
        this._m_LocalRotation.multLocal(q);
        this._updateLocalMatrix();
    }

    /**
     * 根据指定欧拉角旋转。<br/>
     * @param {Number}[x 弧度]
     * @param {Number}[y 弧度]
     * @param {Number}[z 弧度]
     */
    rotateFromEuler(x, y, z){
        Node.S_TEMP_Q.fromEuler(x, y, z);
        // 累加到当前旋转。
        this._m_LocalRotation.multLocal(Node.S_TEMP_Q);
        this._updateLocalMatrix();
    }

    /**
     * 设置旋转。<br/>
     * @param {Quaternion}[rotation]
     */
    setLocalRotation(rotation){
        this._m_LocalRotation.setTo(rotation);
        this._updateLocalMatrix();
    }

    /**
     * 设置旋转。<br/>
     * @param {Vector3}[zDirection]
     */
    setLocalRotationFromZDirection(zDirection){
        this._m_LocalRotation.fromDirectionAtZ(zDirection);
        this._updateLocalMatrix();
    }

    /**
     * 根据基向量设置旋转。<br/>
     * @param {Vector3}[xAxis]
     * @param {Vector3}[yAxis]
     * @param {Vector3}[zAxis]
     */
    setLocalRotationFromAxis(xAxis, yAxis, zAxis){
        this._m_LocalRotation.fromAxis(xAxis, yAxis, zAxis);
        this._updateLocalMatrix();
    }

    /**
     * 设置旋转欧拉角。<br/>
     * @param {Number}[x 轴欧拉角]
     * @param {Number}[y 轴欧拉角]
     * @param {Number}[z 轴欧拉角]
     */
    setLocalRotationFromEuler(x, y, z){
        // 四元数fromEuler是绕世界x,y,z旋转,而不是绕自身基轴旋转
        // 所以这里改为依次绕自身轴旋转到指定状态
        // this._m_LocalRotation.fromEuler(x, y, z);
        // 先绕y轴旋转
        this._m_LocalRotation.fromEuler(0, y, 0);
        // 接着绕自身x轴旋转
        this.rotateFromEuler(x, 0, 0);
        // 接着绕自身z轴旋转
        this.rotateFromEuler(0, 0, z);
        this._updateLocalMatrix();
    }

    /**
     * 使用四元数值设置旋转部分。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     * @param {Number}[w]
     */
    setLocalRotationFromXYZW(x, y, z, w){
        this._m_LocalRotation.setToInXYZW(x, y, z, w);
        this._updateLocalMatrix();
    }

    /**
     * 返回旋转。<br/>
     * @returns {Quaternion}
     */
    getLocalRotation(){
        return this._m_LocalRotation;
    }

    /**
     * 返回world旋转。<br/>
     * @returns {Quaternion}
     */
    getWorldRotation(){
        // 更新当前最新的变换
        this.getWorldMatrix();
        return this._m_WorldRotation;
    }

    /**
     * 平移。<br/>
     * @param {Vector3}[translation]
     */
    translate(translation){
        this._m_LocalTranslation.add(translation);
        this._updateLocalMatrix();
    }

    /**
     * 平移。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     */
    translateXYZ(x, y, z){
        this._m_LocalTranslation.addInXYZ(x, y, z);
        this._updateLocalMatrix();
    }

    /**
     * 设置平移。<br/>
     * @param {Vector3}[translation]
     */
    setLocalTranslation(translation){
        this._m_LocalTranslation.setTo(translation);
        this._updateLocalMatrix();
    }

    /**
     * 设置平移。<br/>
     * @param {Number}[x]
     * @param {Number}[y]
     * @param {Number}[z]
     */
    setLocalTranslationXYZ(x, y, z){
        this._m_LocalTranslation.setToInXYZ(x, y, z);
        this._updateLocalMatrix();
    }

    /**
     * 返回平移。<br/>
     * @returns {Vector3}
     */
    getLocalTranslation(){
        return this._m_LocalTranslation;
    }

    /**
     * 返回world平移。<br/>
     * @returns {Vector3}
     */
    getWorldTranslation(){
        // 调用一次用于计算当前最新的变换
        this.getWorldMatrix();
        return this._m_WorldTranslation;
    }

    /**
     * 更新包围体。<br/>
     * @private
     */
    _updateBounding(){
        this._m_UpdateBoundingVolume = true;
    }

    /**
     * 更新本地矩阵。<br/>
     * @private
     */
    _updateLocalMatrix(){
        this._m_UpdateLocalMatrix = true;
        this._updateWorldMatrix();
        // 更新边界
        this._updateBounding();
        if(this._m_Parent != null){
            this._m_Parent._updateBounding();
        }
        this._m_Children.forEach(children=>{
            children._updateBounding();
        });
    }

    /**
     * 更新世界矩阵。<br/>
     * @private
     */
    _updateWorldMatrix(){
        this._m_UpdateWorldMatrix = true;
        // 通知所有子节点更新世界矩阵
        this._m_Children.forEach(children=>{
            children._updateWorldMatrix();
        });
    }

    /**
     * 返回本地矩阵。<br/>
     * @returns {Matrix44}
     */
    getLocalMatrix(){
        if(this._m_UpdateLocalMatrix){
            // 更新本地矩阵
            Matrix44.composeMat4(this._m_LocalTranslation, this._m_LocalRotation, this._m_LocalScale, this._m_LocalMatrix);
            this._m_UpdateLocalMatrix = false;
        }
        return this._m_LocalMatrix;
    }

    /**
     * 设置本地矩阵。<br/>
     * @param {Matrix44}[matrix]
     */
    setLocalMatrix(matrix){
        // 覆盖矩阵
        this._m_LocalMatrix.set(matrix);
        this._updateLocalMatrix();
        // updateLocalMatrix设置UpdateLocalMatrix为true,但是我们手动复制了matrix到localMatrix中,所以可以在updateLocalMatrix()调用后手动设置UpdateLocalMatrix为false减少计算量
        this._m_UpdateLocalMatrix = false;
        // 从矩阵提取translation,rotation,scale
        Matrix44.decomposeMat4(matrix, this._m_LocalTranslation, this._m_LocalRotation, this._m_LocalScale);
    }

    /**
     * 设置本地矩阵。<br/>
     * @param {Number[]}[mat44Array]
     */
    setLocalMatrixFromArray(mat44Array){
        // 覆盖矩阵
        this._m_LocalMatrix.setArray(mat44Array);
        this._updateLocalMatrix();
        // updateLocalMatrix设置UpdateLocalMatrix为true,但是我们手动复制了matrix到localMatrix中,所以可以在updateLocalMatrix()调用后手动设置UpdateLocalMatrix为false减少计算量
        this._m_UpdateLocalMatrix = false;
        // 从矩阵提取translation,rotation,scale
        Matrix44.decomposeMat4(this._m_LocalMatrix, this._m_LocalTranslation, this._m_LocalRotation, this._m_LocalScale);
    }

    /**
     * 返回世界矩阵。<br/>
     * @returns {Matrix44}
     */
    getWorldMatrix(){
        if(this._m_UpdateWorldMatrix){
            // 更新世界矩阵
            this._buildWorldMatrix();
            this.fire(Node.S_WORLD_MATRIX_UPDATE, [this._m_WorldMatrix]);
        }
        return this._m_WorldMatrix;
    }

    /**
     * 构建世界矩阵。<br/>
     * @private
     */
    _buildWorldMatrix(){
        if(this._m_UpdateWorldMatrix){
            // 1.执行本地矩阵变换
            let localMatrix = this.getLocalMatrix();
            // 2.执行世界变换
            if(!this._m_Parent){
                // 复制,不要使用引用,因为Node可实时调整父节点
                this._m_WorldMatrix.set(this._m_LocalMatrix);
            }
            else{
                // 执行世界变换
                // 获取父变换矩阵,只要一个父节点获取了父节点变换矩阵,那么父节点变换矩阵就已经被计算了(即只会计算一次)
                // 由于渲染不会按照场景图进行渲染,而是按照排序算法，遮挡算法进行处理，所以更新节点成本很低(每个需要更新的节点只会计算一次)
                // 合并矩阵
                Matrix44.multiplyMM(this._m_WorldMatrix, 0, this._m_Parent.getWorldMatrix(), 0, this._m_LocalMatrix, 0);
            }
            // ...
            // 更新world变换信息
            Matrix44.decomposeMat4(this._m_WorldMatrix, this._m_WorldTranslation, this._m_WorldRotation, this._m_WorldScale);
            this._m_UpdateWorldMatrix = false;
        }
    }

    /**
     * 返回节点名称。<br/>
     * @return {String}
     */
    getName(){
        return this._m_Name;
    }

    /**
     * 添加一个子节点。<br/>
     * @param {Node}[children]
     */
    addChildren(children){
        if(children instanceof Node){
            // 检测children组件是否已经载入scene组件列表
            // 检测children是否已经添加过
            if(children._m_Parent == null && !this._m_ChildrenIDs[children.getName()]){
                this._m_ChildrenIDs[children.getName()] = children;
                this._m_Children.push(children);
                children._m_Parent = this;

                // 更新子节点
                children._updateWorldMatrix();
                this._updateBounding();
            }
            else{
                let nextName = children.getName() + Tools.nextId();
                Log.warn("已存在:" + children.getName() + ",重命名为:" + nextName);
                children._m_Name = nextName;
                if(children._m_Parent == null){
                    this._m_ChildrenIDs[children.getName()] = children;
                    this._m_Children.push(children);
                    children._m_Parent = this;

                    // 更新子节点
                    children._updateWorldMatrix();
                    this._updateBounding();
                }
                else{
                    Log.warn(nextName + "已存在与父节点:" + children._m_Parent.getName());
                }
            }
        }
        else{
            Log.error("children不是一个合法的Node!");
        }
    }

    /**
     * 移除一个子节点。<br/>
     * @param {Node}[children]
     */
    removeChildren(children){
        if(children instanceof Node){
            if(this._m_ChildrenIDs[children.getName()]){
                this._m_ChildrenIDs[children.getName()] = null;
                let i = this._m_Children.indexOf(children);
                if(i > -1){
                    this._m_Children.splice(i, 1);
                }
                children._m_Parent = null;
            }
        }
    }

    /**
     * 深度优先遍历场景图。<br/>
     * @param {Function}[call]
     */
    traverse(call){
        if(call){
            call(this);
        }
        this._m_Children.forEach(children=>{
            if(call){
                call(children);
            }
            children.traverse(call);
        });
    }

}
