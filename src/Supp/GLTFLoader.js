import Node from "../Core/Node/Node.js";
import Tools from "../Core/Util/Tools.js";
import AssetLoader from "../Core/Util/AssetLoader.js";
import Log from "../Core/Util/Log.js";
import Geometry from "../Core/Node/Geometry.js";
import Mesh from "../Core/WebGL/Mesh.js";
import MaterialDef from "../Core/Material/MaterialDef.js";
import Material from "../Core/Material/Material.js";

/**
 * GLTFLoader。<br/>
 * 提供GLTF模型加载支持,支持二进制glb,gltf+bin,嵌入式gltf。<br/>
 * @author Kkk
 * @date 2021年3月5日13点43分
 */
export default class GLTFLoader {
    load(scene, src, callback){
        this._m_Scene = scene;
        this._m_DefaultMatDef = null;
        this._m_Mats = {};
        this._m_BasePath = AssetLoader.getBasePath(src);
        this._loadGLTF(src, callback);
    }
    _loadBIN(gltf, buffers, i, length, ok){
        if(length > 0){
            AssetLoader.loadFile(this._m_BasePath + gltf.buffers[i].uri, (data)=>{
                length--;
                buffers.push({data, byteLength:gltf.buffers[i].byteLength});
                this._loadBIN(gltf, buffers, ++i, length, ok);
            }, null, {inflate:true});
        }
        else{
            // 结束
            if(ok){
                ok();
            }
        }
    }

    /**
     * 加载GLTF。<br/>
     * @param {String}[src]
     * @param {Function}[callback]
     * @private
     */
    _loadGLTF(src, callback){
        AssetLoader.loadFile(src, (gltf)=>{
            gltf = JSON.parse(gltf);
            if(gltf){
                // 开始解析
                // 先把二进制数据载入内存
                // 后续改为根据优先加载策略(比如min,max非常小的可以先不加载对应的bin)
                // 还有就是可以根据需要显示的scene加载对应的bin,只应该在需要对应的bin时才去加载,但目前先全部载入内存
                if(gltf.buffers && gltf.buffers.length > 0){
                    // 假设都是分离式gltf
                    let length = gltf.buffers.length;
                    let i = 0;
                    let buffers = [];
                    this._loadBIN(gltf, buffers, i, length, ()=>{
                        // 所有二进制数据全部加载完成
                        Log.log("所有二进制加载完成!",buffers);
                        gltf.buffers = buffers;

                        // 开始解析场景
                        if(Tools.checkIsNull(gltf.scene)){
                            let scene = this._addScene(gltf);
                            if(callback){
                                callback(scene);
                            }
                        }
                    });
                }
            }
            Log.log('gltf:',gltf);
        });
    }
    _addScene(gltf){
        if(Tools.checkIsNull(gltf.scene)){
            let _scene = gltf.scenes[gltf.scene];
            let sceneNode = new Node(this._m_Scene, {id:_scene.name});
            // 检查子节点
            if(Tools.checkIsNull(_scene.nodes)){
                // 添加子节点
                _scene.nodes.forEach(node=>{
                    this._addNode(gltf, sceneNode, node);
                });
            }
            return sceneNode;
        }
        return null;
    }
    _addNode(gltf, parent, nodeI){
        let _node = gltf.nodes[nodeI];
        // 忽略其他节点
        if(Tools.checkIsNull(_node.mesh)){
            // 创建Node
            let node = new Node(parent, {id:_node.name});

            // 变换
            if(Tools.checkIsNull(_node.scale)){
                node.setLocalScaleXYZ(_node.scale[0], _node.scale[1], _node.scale[2]);
            }
            if(Tools.checkIsNull(_node.rotation)){
                node.setLocalRotationFromXYZW(_node.rotation[0], _node.rotation[1], _node.rotation[2], _node.rotation[3]);
            }
            if(Tools.checkIsNull(_node.translation)){
                node.setLocalTranslationXYZ(_node.translation[0], _node.translation[1], _node.translation[2]);
            }
            parent.addChildren(node);

            // 添加node对应的GeometryNode
            this._parseMesh(gltf, node, _node.mesh);
        }
    }
    _parseMesh(gltf, parrent, meshI){
        let _mesh = gltf.meshes[meshI];
        let _primitives = _mesh.primitives;
        let _primitive = null;
        let geometryNode = null;
        let mesh = null;
        for(let i = 0;i < _primitives.length;i++){
            _primitive = _primitives[i];
            geometryNode = new Geometry(parrent, {id:_mesh.name + i + "_geo"});
            parrent.addChildren(geometryNode);
            // 解析mesh
            mesh = new Mesh();
            // 首先是几何属性
            if(Tools.checkIsNull(_primitive.attributes.POSITION)){
                // position属性
                let positions = this._parsePositions(gltf, _primitive.attributes.POSITION);
                mesh.setData(Mesh.S_POSITIONS, positions);
            }
            if(Tools.checkIsNull(_primitive.attributes.NORMAL)){
                // normal属性
                let normals = this._parseNormals(gltf, _primitive.attributes.NORMAL);
                mesh.setData(Mesh.S_NORMALS, normals);
            }
            if(Tools.checkIsNull(_primitive.attributes.TEXCOORD_0)){
                // 第一道texCoord属性(暂时跳过lightMap)
                let texcoords = this._parseTexcoords(gltf, _primitive.attributes.TEXCOORD_0);
                mesh.setData(Mesh.S_UV0, texcoords);
            }

            // 其次是索引
            if(Tools.checkIsNull(_primitive.indices)){
                // indices数据
                let indices = this._parseIndices(gltf, _primitive.indices);
                mesh.setData(Mesh.S_INDICES, indices);
            }
            // 然后是材质(这里先跳过PBR材质)
            if(Tools.checkIsNull(_primitive.material)){
                if(!this._m_DefaultMatDef){
                    this._m_DefaultMatDef = MaterialDef.load("../src/Core/Assets/MaterialDef/BasicLightingDef");
                }
                let matId = gltf.materials[_primitive.material].name;
                let material = null;
                if(this._m_Mats[matId]){
                    material = this._m_Mats[matId];
                }
                else{
                    // 创建新材质,后续移到独立方法创建适配的pbr材质或转换phong材质
                    material = new Material(this._m_Scene, {id:matId, materialDef:this._m_DefaultMatDef});
                    material.selectTechnology('BlinnPhongLight2');
                    this._m_Mats[matId] = material;
                }
                geometryNode.setMaterial(material);
            }
            geometryNode.setMesh(mesh);
            geometryNode.updateBound();
        }
    }
    _parsePositions(gltf, i){
        let _positionsAccessors = gltf.accessors[i];
        // 解析
        let _buffers = gltf.buffers;
        let _bufferView = gltf.bufferViews[_positionsAccessors.bufferView];
        let _buffer = _buffers[_bufferView.buffer].data;
        // 后续应该统一缓存,而不是每次newFloat32Array
        // 然后通过accessors.byteOffset和count来截取
        let positions = new Float32Array(_buffer, _bufferView.byteOffset + (_positionsAccessors.byteOffset || 0), _positionsAccessors.count * 3);
        return positions;
    }
    _parseNormals(gltf, i){
        let _normalsAccessors = gltf.accessors[i];
        // 解析
        let _buffers = gltf.buffers;
        let _bufferView = gltf.bufferViews[_normalsAccessors.bufferView];
        let _buffer = _buffers[_bufferView.buffer].data;
        // 后续应该统一缓存,而不是每次newFloat32Array
        // 然后通过accessors.byteOffset和count来截取
        let normals = new Float32Array(_buffer, _bufferView.byteOffset + (_normalsAccessors.byteOffset || 0), _normalsAccessors.count * 3);
        return normals;
    }
    _parseTexcoords(gltf, i){
        let _texcoordsAccessors = gltf.accessors[i];
        // 解析
        let _buffers = gltf.buffers;
        let _bufferView = gltf.bufferViews[_texcoordsAccessors.bufferView];
        let _buffer = _buffers[_bufferView.buffer].data;
        // 后续应该统一缓存,而不是每次newFloat32Array
        // 然后通过accessors.byteOffset和count来截取
        let texcoords = new Float32Array(_buffer, _bufferView.byteOffset + (_texcoordsAccessors.byteOffset || 0), _texcoordsAccessors.count * 2);
        return texcoords;
    }
    _parseIndices(gltf, i){
        let _indicessAccessors = gltf.accessors[i];
        // 解析
        let _buffers = gltf.buffers;
        let _bufferView = gltf.bufferViews[_indicessAccessors.bufferView];
        let _buffer = _buffers[_bufferView.buffer].data;
        // 后续应该统一缓存,而不是每次newFloat32Array
        // 然后通过accessors.byteOffset和count来截取
        let indices = new Uint16Array(_buffer, _bufferView.byteOffset + (_indicessAccessors.byteOffset || 0), _indicessAccessors.count);
        return indices;
    }
}
