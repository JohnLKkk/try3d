/**
 * Mesh包含GL渲染需要的数据,其数据由用于包装GL数据块的GLVBO和GLVAO表示。<br/>
 * @author Kkk
 */
import ArrayBuf from "./ArrayBuf.js";
import ShaderSource from "./ShaderSource.js";

export default class Mesh {
    static S_POSITIONS = "positions";
    static S_NORMALS = "normals";
    static S_INDICES = "indices";
    static S_DATAS = {"positions":"positions", "normals":"normals", "indices":"indices"};

    constructor() {
        this._m_Datas = {};
        this._m_Bufs = {};
        this._m_VAO = null;
        this._m_GL = null;
        this._m_ElementCount = 0;
    }
    _checkDataType(type){
        if(Mesh.S_DATAS[type]){
            return true;
        }
        else{
            console.error('type is undefined:' + type);
            return false;
        }
    }
    setData(type, data, options){
        if(this._checkDataType(type)){
            this._m_Datas[type] = data;
        }
        else{
            //根据options来指定参数
            this._m_Datas[type] = data;
        }
    }
    _refreshBufLocal(gl, customAttrs){
        // 更新几何属性列表local属性
        let buf = null;
        customAttrs.forEach(attr=>{
            buf = this._m_Bufs[attr.name];
            if(buf){

            }
        });
    }

    /**
     * 更新数据列表<br/>
     * @param {Object}[gl]
     * @private
     */
    _updateBound(gl){
        if(this._m_Datas){
            if(!this._m_VAO){
                this._m_VAO = gl.createVertexArray();
            }
            for(let key in this._m_Datas){
                switch (key) {
                    case Mesh.S_POSITIONS:
                        ArrayBuf.setVertexBuf(gl, this._m_VAO, gl.ARRAY_BUFFER, new Float32Array(this._m_Datas[key]), gl.STATIC_DRAW, ShaderSource.S_POSITION, 3, gl.FLOAT, this._m_Datas[key].length, 0);
                        break;
                    case Mesh.S_NORMALS:
                        ArrayBuf.setVertexBuf(gl, this._m_VAO, gl.ARRAY_BUFFER, new Float32Array(this._m_Datas[key]), gl.STATIC_DRAW, ShaderSource.S_NORMAL, 3, gl.FLOAT, this._m_Datas[key].length, 0);
                        break;
                    case Mesh.S_INDICES:
                        this._m_ElementCount = this._m_Datas[key].length;
                        ArrayBuf.setIndicesBuf(gl, this._m_VAO, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._m_Datas[key]), gl.STATIC_DRAW);
                        break;
                    default:
                        //自定义,由于自定义的属性在没有绑定着色器之前,是无法显式知道属性位置的,所以需要在绑定着色器后,设定属性位置。
                        // ArrayBuf.setVertexBuf(gl, this._m_VAO, gl.ARRAY_BUFFER, new Float32Array(this._m_Datas[key]), gl.STATIC_DRAW, ShaderSource.S_NORMAL, 3, gl.FLOAT, this._m_Datas[key].length, 0);
                        break;
                }
            }
        }
    }
    draw(gl){
        gl.bindVertexArray(this._m_VAO);
        gl.drawElements(gl.TRIANGLES, this._m_ElementCount, gl.UNSIGNED_SHORT, 0);
    }

}