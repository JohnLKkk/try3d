import Component from "../Component.js";

/**
 * 节点组件表示场景的一个关节，用于对场景进行场景图管理。<br/>
 * @author Kkk
 */
export default class Node extends Component{
    constructor(owner, cfg) {
        super(owner, cfg);
        this._m_LocalMatrix = null;
        this._m_WorldMatrix = null;
        this._m_Parent = null;
        this._m_Children = [];
        this._m_ChildrenIDs = {};

        // 两种可能,本地矩阵发生变化时,需要更新本地矩阵,然后更新世界矩阵
        // 本地矩阵没有发生变化时,只需要更新世界矩阵
        this._m_UpdateLocalMatrix = false;
        this._m_UpdateWorldMatrix = false;
    }
    setScale(scale){
        // 设置缩放状态量
        // 标记更新本地矩阵
        this._updateLocalMatrix();
    }
    _updateLocalMatrix(){
        this._m_UpdateLocalMatrix = true;
        this._updateWorldMatrix();
    }
    _updateWorldMatrix(){
        this._m_UpdateWorldMatrix = true;
        // 通知所有子节点更新世界矩阵
        this._m_Children.forEach(children=>{
            children._updateWorldMatrix();
        });
    }
    getLocalMatrix(){
        if(this._m_UpdateLocalMatrix){
            // 更新本地矩阵
        }
        return this._m_LocalMatrix;
    }
    setLocalMatrix(matrix){
        this._m_UpdateLocalMatrix = false;
        // 覆盖矩阵
        // 从矩阵提取position,rotate,scale
    }
    getWorldMatrix(){
        if(this._m_UpdateWorldMatrix){
            // 更新世界矩阵
            this._buildWorldMatrix();
        }
        return this._m_WorldMatrix;
    }
    _buildWorldMatrix(){
        if(this._m_UpdateWorldMatrix){
            // 1.执行本地矩阵变换
            let localMatrix = this.getLocalMatrix();
            // 2.执行世界变换
            if(!this._m_Parent){
                this._m_WorldMatrix = localMatrix;
            }
            else{
                // 执行世界变换
            }
            // ...
            this._m_UpdateWorldMatrix = false;
        }
    }
    addChildren(children){
        if(children instanceof Node){
            // 检测children组件是否已经载入scene组件列表
            // 检测children是否已经添加过
            if(children._m_Parent == null && !this._m_ChildrenIDs[children.getId()]){
                this._m_ChildrenIDs[children.getId()] = children;
                this._m_Children.push(children);
                children._m_Parent = this;
            }
        }
        else{
            console.error("children不是一个合法的Node!");
        }
    }
    removeChildren(children){
        if(children instanceof Node){
            if(this._m_ChildrenIDs[children.getId()]){
                this._m_ChildrenIDs[children.getId()] = null;
                this._m_Children.remove(children);
                children._m_Parent = null;
            }
        }
    }

}