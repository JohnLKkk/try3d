import Node from "../Core/Node/Node.js";
import Tools from "../Core/Util/Tools.js";
import AssetLoader from "../Core/Util/AssetLoader.js";
import Log from "../Core/Util/Log.js";
import Geometry from "../Core/Node/Geometry.js";
import Mesh from "../Core/WebGL/Mesh.js";
import MaterialDef from "../Core/Material/MaterialDef.js";
import Material from "../Core/Material/Material.js";
import Bone from "../Core/Animation/Bone.js";
import SkinGeometry from "../Core/Animation/Skin/SkinGeometry.js";
import AnimationAction from "../Core/Animation/AnimationAction.js";
import TrackMixer from "../Core/Animation/Mixer/TrackMixer.js";
import ActionClip from "../Core/Animation/ActionClip.js";
import TrackBinding from "../Core/Animation/Mixer/TrackBinding.js";
import AnimKeyframeEnum from "../Core/Animation/Keyframe/AnimKeyframeEnum.js";
import Skeleton from "../Core/Animation/Skin/Skeleton.js";
import Joint from "../Core/Animation/Skin/Joint.js";
import AnimationProcessor from "../Core/Animation/AnimationProcessor.js";
import ShaderSource from "../Core/WebGL/ShaderSource.js";

/**
 * GLTFLoader。<br/>
 * 提供GLTF模型加载支持,支持二进制glb,gltf+bin,嵌入式gltf。<br/>
 * @author Kkk
 * @date 2021年3月5日13点43分
 */
export default class GLTFLoader {
    static DATA = {5123:Uint16Array, 5124:Uint16Array, 5125:Uint32Array, 5126:Float32Array};
    static DATA_COMPONENT = {'SCALAR':1, 'VEC3':3, 'VEC4':4, 'MAT4':16};
    load(scene, src, callback){
        this._m_Scene = scene;
        this._m_GLTFRootNode = null;
        this._m_DefaultMatDef = null;
        this._m_Joints = {};
        this._m_Bones = [];
        this._m_Nodes = {};
        this._m_Aps = [];
        this._m_Skeletons = {};
        this._m_AnimationProcessors = {};
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
                        Log.log('gltf:' ,gltf);

                        let scene = null;
                        // 开始解析场景
                        if(Tools.checkIsNull(gltf.scene)){
                            scene = this._addScene(gltf);
                        }
                        this._bindBone();

                        // 解析动画剪辑
                        if(Tools.checkIsNull(gltf.animations)){
                            this._parseAnimations(gltf);
                            this._m_Aps.forEach(ap=>{
                                ap.skeleton.finished();
                            });
                        }

                        Log.log('当前材质:' , this._m_Mats);
                        if(callback){
                            callback(scene);
                        }
                    });
                }
            }
            Log.log('gltf:',gltf);
        });
    }
    _bindBone(){
        let jis = null;
        for(let i = 0;i < this._m_Aps.length;i++){
            jis = this._m_Aps[i].skeleton.getJoints();
            for(let j = 0;j < jis.length;j++){
                if(this._m_Nodes[jis[j].getId()]){
                    jis[j].link(this._m_Nodes[jis[j].getId()]);
                }
            }
        }
    }
    _parseAnimations(gltf){
        let trackMixer = null;
        let animationAction = null;
        let actionClip = null;
        let jis = null;
        let t = false;
        gltf.animations.forEach(anim=>{
            animationAction = new AnimationAction(this._getName(anim.name));
            trackMixer = new TrackMixer();
            anim.channels.forEach(channel=>{
                let node = channel.target.node;
                actionClip = new ActionClip(channel.target.path);
                if(this._m_Nodes[node]){
                    // 创建轨迹
                    TrackBinding.createTrack(actionClip, this._m_Nodes[node]);
                    // 采样轨迹
                    let sampler = anim.samplers[channel.sampler];
                    this._parseSampler(gltf, sampler.input, sampler.output, sampler.interpolation, AnimKeyframeEnum.S_KEY_FRAME[channel.target.path], actionClip);
                    trackMixer.addClip(actionClip);

                    t = false;
                    for(let i = 0;i < this._m_Aps.length;i++){
                        jis = this._m_Aps[i].skeleton.getJoints();
                        for(let j = 0;j < jis.length;j++){
                            if(jis[j].getId() == node){
                                t = true;
                                // jis[j].link(this._m_Nodes[node]);
                                this._m_Aps[i].animationProcessor.addAnimationAction(animationAction);
                                break;
                            }
                        }
                        if(t){
                            break;
                        }
                    }
                    if(!t){
                        // 非skin动画
                        Log.log(node + '非skin动画!path:' + channel.target.path);
                        let animationProcessor = null;
                        if(!this._m_AnimationProcessors[node]){
                            let animationProcessor = new AnimationProcessor(this._m_GLTFRootNode, {id:Tools.nextId() + "_" + node + "_animationProcessor"});
                            this._m_AnimationProcessors[node] = animationProcessor;
                        }
                        animationProcessor = this._m_AnimationProcessors[node];
                        animationProcessor.addAnimationAction(animationAction);
                    }
                    // this._m_Aps[0].animationProcessor.addAnimationAction(animationAction);
                }
                else{
                    Log.log('animation_node:' + node);
                }
            });
            animationAction.setTrackMixer(trackMixer);
        });
    }
    _getAccessorData(gltf, i){
        let _accessors = gltf.accessors[i];
        let _buffers = gltf.buffers;
        let _bufferView = gltf.bufferViews[_accessors.bufferView];
        let dataCount = GLTFLoader.DATA_COMPONENT[_accessors.type];
        return new GLTFLoader.DATA[_accessors.componentType](_buffers[_bufferView.buffer].data, (_bufferView.byteOffset || 0) + (_accessors.byteOffset || 0), _accessors.count * dataCount);
    }
    _parseSampler(gltf, i, o, ip, keyframe, actionClip){
        let _i = this._getAccessorData(gltf, i);
        let _o = this._getAccessorData(gltf, o);
        let clipCount = gltf.accessors[i].count;
        let dataCount = GLTFLoader.DATA_COMPONENT[gltf.accessors[o].type];
        let _keyframe = null;
        let offset = 0;
        for(let i = 0;i < clipCount;i++){
            offset = i * dataCount;
            if(dataCount > 3){
                if(!keyframe){
                    Log.warn("未知keyframe!");
                }
                _keyframe = new keyframe(_i[i], _o[offset], _o[offset + 1], _o[offset + 2], _o[offset + 3]);
                // Log.log('_keyframe,time:' + _keyframe.getTime() + ',value:' + _keyframe.getValue().toString());
            }
            else{
                if(!keyframe){
                    Log.warn("未知keyframe!");
                }
                _keyframe = new keyframe(_i[i], _o[offset], _o[offset + 1], _o[offset + 2]);
            }
            _keyframe.setInterpolationMode(ip);
            actionClip.addKeyframe(_keyframe);
        }
    }
    _addScene(gltf){
        if(Tools.checkIsNull(gltf.scene)){
            let _scene = gltf.scenes[gltf.scene];
            let sceneNode = new Node(this._m_Scene, {id:_scene.name});
            this._m_GLTFRootNode = sceneNode;
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
    _getName(name){
        if(name == null || name == undefined || name == ''){
            return Tools.nextId();
        }
        return name;
    }
    _parseSkins(gltf, i){
        let skin = gltf.skins[i];
        let skeleton = new Skeleton(this._getName(skin.name));
        let skeletonJoint = null;
        let jointSpaceData = this._getAccessorData(gltf, skin.inverseBindMatrices);
        let ji = 0;
        let array = [];
        skin.joints.forEach(joint=>{
            this._m_Joints[joint] = true;
            array.length = 0;
            for(let i = 0, offset = ji * 16;i < 16;i++){
                array.push(jointSpaceData[i + offset]);
            }
            skeletonJoint = new Joint(joint, ji);
            skeletonJoint.setJointSpace(array);
            skeleton.addJoint(skeletonJoint);
            ji++;
        });
        return skeleton;
    }
    _addNode(gltf, parent, nodeI){
        // Log.log('nodeI:' + nodeI + ";name:" + gltf.nodes[nodeI].name);
        let _node = gltf.nodes[nodeI];
        let node = null;
        // 创建Node
        if(this._m_Joints[nodeI]){
            node = new Bone(parent, {id:this._getName(_node.name)});
            this._m_Bones.push(node);
            Log.log('添加Bone' + nodeI);
        }
        else{
            node = new Node(parent, {id:this._getName(_node.name)});
        }
        this._m_Nodes[nodeI] = node;
        parent.addChildren(node);
        if(Tools.checkIsNull(_node.children)){
            // 解析子节点
            _node.children.forEach(nodeI=>{
                this._addNode(gltf, node, nodeI);
            });
        }
        // 解析mesh结构
        if(Tools.checkIsNull(_node.mesh)){
            this._parseMesh(gltf, node, _node.mesh, Tools.checkIsNull(_node.skin));
            if(Tools.checkIsNull(_node.skin)){
                // 添加骨架
                // 如果已经存在skin则直接应用这套骨架
                let skeleton = null;
                if(this._m_Skeletons[_node.skin]){
                    skeleton = this._m_Skeletons[_node.skin];
                }
                else{
                    skeleton = this._parseSkins(gltf, _node.skin);
                    this._m_Skeletons[_node.skin] = skeleton;
                    Log.log('创建Skeleton!');
                }
                node.getChildren().forEach(skinGeometryNode=>{
                    skinGeometryNode.setSkeleton(skeleton);
                });
                // 添加AnimationProcessor
                if(this._m_AnimationProcessors[_node.skin]){
                    // 说明该ap被多个skin引用,应该将其附加到这些skin的父类
                }
                else{
                    // 这里将所有animationProcessor附加到根节点中,而不再附加到最近层级,虽然没有了层级描述性,但方便了使用和管理
                    let animationProcessor = new AnimationProcessor(this._m_GLTFRootNode, {id:Tools.nextId() + "_animationProcessor"});
                    this._m_Aps.push({skeleton, animationProcessor});
                    this._m_AnimationProcessors[_node.skin] = animationProcessor;
                }
            }
        }
        if(node){
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
            if(Tools.checkIsNull(_node.matrix)){
                node.setLocalMatrixFromArray(_node.matrix);
            }
        }
    }
    _parseMesh(gltf, parrent, meshI, isSkin){
        let _mesh = gltf.meshes[meshI];
        let _primitives = _mesh.primitives;
        let _primitive = null;
        let geometryNode = null;
        let mesh = null;
        for(let i = 0;i < _primitives.length;i++){
            _primitive = _primitives[i];
            if(isSkin){
                geometryNode = new SkinGeometry(parrent, {id:this._getName(_mesh.name) + i + "_skin_geo"});
            }
            else{
                geometryNode = new Geometry(parrent, {id:this._getName(_mesh.name) + i + "_geo"});
            }
            parrent.addChildren(geometryNode);
            // 解析mesh
            mesh = new Mesh();
            // 首先是几何属性
            if(Tools.checkIsNull(_primitive.attributes.POSITION)){
                // position属性
                let positions = this._parsePositions(gltf, _primitive.attributes.POSITION);
                mesh.setData(Mesh.S_POSITIONS, positions.data);
            }
            if(Tools.checkIsNull(_primitive.attributes.NORMAL)){
                // normal属性
                let normals = this._parseNormals(gltf, _primitive.attributes.NORMAL);
                mesh.setData(Mesh.S_NORMALS, normals.data);
            }
            if(Tools.checkIsNull(_primitive.attributes.TEXCOORD_0)){
                // 第一道texCoord属性(暂时跳过lightMap)
                let texcoords = this._parseTexcoords(gltf, _primitive.attributes.TEXCOORD_0);
                mesh.setData(Mesh.S_UV0, texcoords.data);
            }
            // skin部分
            if(isSkin){
                if(Tools.checkIsNull(_primitive.attributes.JOINTS_0)){
                    let joints_0 = this._parseJoints(gltf, _primitive.attributes.JOINTS_0);
                    mesh.setData(joints_0.bufType == 5125 ? Mesh.S_JOINTS_0_32 : Mesh.S_JOINTS_0, joints_0.data);
                }
                if(Tools.checkIsNull(_primitive.attributes.WEIGHTS_0)){
                    let weights_0 = this._parseWeights(gltf, _primitive.attributes.WEIGHTS_0);
                    mesh.setData(Mesh.S_WEIGHTS_0, weights_0.data);
                }
            }

            // 其次是索引
            if(Tools.checkIsNull(_primitive.indices)){
                // indices数据
                let indices = this._parseIndices(gltf, _primitive.indices);
                mesh.setData(indices.bufType == 5125 ? Mesh.S_INDICES_32 : Mesh.S_INDICES, indices.data);
            }
            // 然后是材质(这里先跳过PBR材质)
            if(Tools.checkIsNull(_primitive.material)){
                // 后续完善时,这里单独到一个函数中进行,因为解析PBR材质参数最好独立到一个解析函数中

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
            else{
                // 添加一个默认材质
                if(!this._m_DefaultMatDef){
                    this._m_DefaultMatDef = MaterialDef.load("../src/Core/Assets/MaterialDef/BasicLightingDef");
                }
                let matId = 'default_gltf_mat';
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
            // 如果是skinGeometry,则添加skin数据
            if(isSkin){
                geometryNode.getMaterial().addDefine(ShaderSource.S_SKINS_SRC);
                Log.log("重新编译:" , geometryNode.getMaterial());
            }
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
        let positions = new GLTFLoader.DATA[_positionsAccessors.componentType](_buffer, (_bufferView.byteOffset || 0) + (_positionsAccessors.byteOffset || 0), _positionsAccessors.count * 3);
        return {data:positions, bufType:_positionsAccessors.componentType};
    }
    _parseNormals(gltf, i){
        let _normalsAccessors = gltf.accessors[i];
        // 解析
        let _buffers = gltf.buffers;
        let _bufferView = gltf.bufferViews[_normalsAccessors.bufferView];
        let _buffer = _buffers[_bufferView.buffer].data;
        // 后续应该统一缓存,而不是每次newFloat32Array
        // 然后通过accessors.byteOffset和count来截取
        let normals = new GLTFLoader.DATA[_normalsAccessors.componentType](_buffer, (_bufferView.byteOffset || 0) + (_normalsAccessors.byteOffset || 0), _normalsAccessors.count * 3);
        return {data:normals, bufType:_normalsAccessors.componentType};
    }
    _parseTexcoords(gltf, i){
        let _texcoordsAccessors = gltf.accessors[i];
        // 解析
        let _buffers = gltf.buffers;
        let _bufferView = gltf.bufferViews[_texcoordsAccessors.bufferView];
        let _buffer = _buffers[_bufferView.buffer].data;
        // 后续应该统一缓存,而不是每次newFloat32Array
        // 然后通过accessors.byteOffset和count来截取
        let texcoords = new GLTFLoader.DATA[_texcoordsAccessors.componentType](_buffer, (_bufferView.byteOffset || 0) + (_texcoordsAccessors.byteOffset || 0), _texcoordsAccessors.count * 2);
        return {data:texcoords, bufType:_texcoordsAccessors.componentType};
    }
    _parseIndices(gltf, i){
        let _indicessAccessors = gltf.accessors[i];
        // 解析
        let _buffers = gltf.buffers;
        let _bufferView = gltf.bufferViews[_indicessAccessors.bufferView];
        let _buffer = _buffers[_bufferView.buffer].data;
        // 后续应该统一缓存,而不是每次newFloat32Array
        // 然后通过accessors.byteOffset和count来截取
        let indices = new GLTFLoader.DATA[_indicessAccessors.componentType](_buffer, (_bufferView.byteOffset || 0) + (_indicessAccessors.byteOffset || 0), _indicessAccessors.count);
        return {data:indices, bufType:_indicessAccessors.componentType};
    }
    _parseJoints(gltf, i){
        let _jointsAccessors = gltf.accessors[i];
        // 解析
        let _buffers = gltf.buffers;
        let _bufferView = gltf.bufferViews[_jointsAccessors.bufferView];
        let _buffer = _buffers[_bufferView.buffer].data;
        // 后续应该统一缓存,而不是每次newFloat32Array
        // 然后通过accessors.byteOffset和count来截取
        let joints = new GLTFLoader.DATA[_jointsAccessors.componentType](_buffer, (_bufferView.byteOffset || 0) + (_jointsAccessors.byteOffset || 0), _jointsAccessors.count * 4);
        return {data:joints, bufType:_jointsAccessors.componentType};
    }
    _parseWeights(gltf, i){
        let _weightsAccessors = gltf.accessors[i];
        // 解析
        let _buffers = gltf.buffers;
        let _bufferView = gltf.bufferViews[_weightsAccessors.bufferView];
        let _buffer = _buffers[_bufferView.buffer].data;
        // 后续应该统一缓存,而不是每次newFloat32Array
        // 然后通过accessors.byteOffset和count来截取
        let weights = new GLTFLoader.DATA[_weightsAccessors.componentType](_buffer, (_bufferView.byteOffset || 0) + (_weightsAccessors.byteOffset || 0), _weightsAccessors.count * 4);
        return {data:weights, bufType:_weightsAccessors.componentType};
    }
}
