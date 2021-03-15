/**
 * 变量的根类。<br/>
 * @author Kkk
 * @date 2021年3月3日14点37分
 */
export default class Vars {
    constructor(props) {
        this._m_OwnerFlags = {};
    }

    /**
     * 比较两个变量。<br/>
     * @param {Vars}[vars]
     * @return {Boolean}
     */
    compare(vars){return false;}

    /**
     * 上载。<br/>
     * @param {WebGL}[gl]
     * @param {WebGLUniformLocation}[loc]
     * @param {WebGLFunction}[fun]
     * @private
     */
    _upload(gl, loc, fun){}

    /**
     * 设置持有者。<br/>
     * @param {Object}[owner]
     */
    owner(owner, flag){
        if(!this._m_OwnerFlags[owner.getId()]){
            this._m_OwnerFlags[owner.getId()] = {owner, flag};
        }
    }
}
