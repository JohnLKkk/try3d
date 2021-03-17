import Node from '../Core/Node/Node.js';
import MaterialDef from "../Core/Material/MaterialDef.js";
import Material from "../Core/Material/Material.js";
import Mesh from "../Core/WebGL/Mesh.js";
import Geometry from "../Core/Node/Geometry.js";
import Tools from "../Core/Util/Tools.js";
import Log from "../Core/Util/Log.js";
import Vec4Vars from "../Core/WebGL/Vars/Vec4Vars.js";
import FloatVars from "../Core/WebGL/Vars/FloatVars.js";
import Vector4 from "../Core/Math3d/Vector4.js";
import Texture2DVars from "../Core/WebGL/Vars/Texture2DVars.js";

/**
 * OBJLoader。<br/>
 * 提供OBJ模型加载支持,未来将提供将OBJ模型材质强制转为PBR材质的选项。<br/>
 * @author Kkk
 * @date 2021年2月28日13点34分
 */
export default class OBJLoader {
    /**
     * 加载一个OBJ模型。<br/>
     * @param {Scene}[scene]
     * @param {String}[modelId 可选的ID,表示加载OBJ模型后返回的根节点的ID,如果为null则系统自动分配]
     * @param {String}[src]
     * @param {Function}[callback]
     */
    load(scene, modelId, src, callback){
        this._m_Scene = scene;
        this._m_DefaultMatDef = null;
        this._m_Mats = {};
        this._m_CurrentMat = null;
        let modelNode = new Node(scene, {id:modelId || Tools.nextId()});
        // 加载obj模型
        this._load(modelNode, src, callback);
    }

    /**
     * 设置Assets路径。<br/>
     * @param {String}[assetsPath]
     */
    setAssetsPath(assetsPath){
        this._m_AssetsPath = assetsPath;
    }
    _load(modelNode, src, callback) {
        // 解析OBJ数据块
        this.loadOBJ(modelNode, src, (state)=>{
            if(!this._m_DefaultMatDef){
                this._m_DefaultMatDef = MaterialDef.load(this._m_AssetsPath + "BasicLightingDef");
            }
            // 加载完实例材质后再创建obj实体
            this.loadMTLs(modelNode, state, ()=>{

                this.createMeshes(modelNode, state);


                // 加载完成
                if(callback){
                    callback(modelNode);
                }
            });
        });
    }
    loadOBJ(modelNode, url, ok) {
        this.loadFile(url, (text)=>{
            let state = this.parseOBJ(modelNode, text, url);
            ok(state);
        },
        (error)=>{
            Log.error(error);
        });
    };
    parseOBJ(modelNode, text, url){
        const regexp = {
            // v float float float
            vertex_pattern: /^v\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,
            // vn float float float
            normal_pattern: /^vn\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,
            // vt float float
            uv_pattern: /^vt\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,
            // f vertex vertex vertex
            face_vertex: /^f\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)(?:\s+(-?\d+))?/,
            // f vertex/uv vertex/uv vertex/uv
            face_vertex_uv: /^f\s+(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)(?:\s+(-?\d+)\/(-?\d+))?/,
            // f vertex/uv/normal vertex/uv/normal vertex/uv/normal
            face_vertex_uv_normal: /^f\s+(-?\d+)\/(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\/(-?\d+)(?:\s+(-?\d+)\/(-?\d+)\/(-?\d+))?/,
            // f vertex//normal vertex//normal vertex//normal
            face_vertex_normal: /^f\s+(-?\d+)\/\/(-?\d+)\s+(-?\d+)\/\/(-?\d+)\s+(-?\d+)\/\/(-?\d+)(?:\s+(-?\d+)\/\/(-?\d+))?/,
            // o object_name | g group_name
            object_pattern: /^[og]\s*(.+)?/,
            // s boolean
            smoothing_pattern: /^s\s+(\d+|on|off)/,
            // mtllib file_reference
            material_library_pattern: /^mtllib /,
            // usemtl material_name
            material_use_pattern: /^usemtl /
        };
        url = url || "";

        let state = {
            src: url,
            basePath: this.getBasePath(url),
            objects: [],
            object: {},
            positions: [],
            normals: [],
            uv: [],
            materialLibraries: {}
        };

        this.startObject(state, "", false);

        // 解析逻辑一部分移植自:
        // https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/OBJLoader.js

        if (text.indexOf('\r\n') !== -1) {
            // 这比使用regex的String.split更快，后者将两者都拆分
            text = text.replace('\r\n', '\n');
        }

        let lines = text.split('\n');
        let line = '', lineFirstChar = '', lineSecondChar = '';
        let lineLength = 0;
        let result = [];

        // 更快地修剪线的左侧。 如果可用，请使用。
        let trimLeft = (typeof ''.trimLeft === 'function');

        for (let i = 0, l = lines.length; i < l; i++) {

            line = lines[i];

            line = trimLeft ? line.trimLeft() : line.trim();

            lineLength = line.length;

            if (lineLength === 0) {
                continue;
            }

            lineFirstChar = line.charAt(0);

            if (lineFirstChar === '#') {
                continue;
            }

            if (lineFirstChar === 'v') {

                lineSecondChar = line.charAt(1);

                if (lineSecondChar === ' ' && (result = regexp.vertex_pattern.exec(line)) !== null) {

                    // 0                  1      2      3
                    // ['v 1.0 2.0 3.0', '1.0', '2.0', '3.0']

                    state.positions.push(
                        parseFloat(result[1]),
                        parseFloat(result[2]),
                        parseFloat(result[3])
                    );

                } else if (lineSecondChar === 'n' && (result = regexp.normal_pattern.exec(line)) !== null) {

                    // 0                   1      2      3
                    // ['vn 1.0 2.0 3.0', '1.0', '2.0', '3.0']

                    state.normals.push(
                        parseFloat(result[1]),
                        parseFloat(result[2]),
                        parseFloat(result[3])
                    );

                } else if (lineSecondChar === 't' && (result = regexp.uv_pattern.exec(line)) !== null) {

                    // 0               1      2
                    // ['vt 0.1 0.2', '0.1', '0.2']

                    state.uv.push(
                        parseFloat(result[1]),
                        parseFloat(result[2])
                    );

                } else {

                    Log.error('Unexpected vertex/normal/uv line: \'' + line + '\'');
                    return;
                }

            } else if (lineFirstChar === 'f') {

                if ((result = regexp.face_vertex_uv_normal.exec(line)) !== null) {

                    // f vertex/uv/normal vertex/uv/normal vertex/uv/normal
                    // 0                        1    2    3    4    5    6    7    8    9   10         11         12
                    // ['f 1/1/1 2/2/2 3/3/3', '1', '1', '1', '2', '2', '2', '3', '3', '3', undefined, undefined, undefined]

                    this.addFace(state,
                        result[1], result[4], result[7], result[10],
                        result[2], result[5], result[8], result[11],
                        result[3], result[6], result[9], result[12]
                    );

                } else if ((result = regexp.face_vertex_uv.exec(line)) !== null) {

                    // f vertex/uv vertex/uv vertex/uv
                    // 0                  1    2    3    4    5    6   7          8
                    // ['f 1/1 2/2 3/3', '1', '1', '2', '2', '3', '3', undefined, undefined]

                    this.addFace(state,
                        result[1], result[3], result[5], result[7],
                        result[2], result[4], result[6], result[8]
                    );

                } else if ((result = regexp.face_vertex_normal.exec(line)) !== null) {

                    // f vertex//normal vertex//normal vertex//normal
                    // 0                     1    2    3    4    5    6   7          8
                    // ['f 1//1 2//2 3//3', '1', '1', '2', '2', '3', '3', undefined, undefined]

                    this.addFace(state,
                        result[1], result[3], result[5], result[7],
                        undefined, undefined, undefined, undefined,
                        result[2], result[4], result[6], result[8]
                    );

                } else if ((result = regexp.face_vertex.exec(line)) !== null) {

                    // f vertex vertex vertex
                    // 0            1    2    3   4
                    // ['f 1 2 3', '1', '2', '3', undefined]

                    this.addFace(state, result[1], result[2], result[3], result[4]);
                } else {
                    Log.error('Unexpected face line: \'' + line + '\'');
                    return;
                }

            } else if (lineFirstChar === 'l') {

                let lineParts = line.substring(1).trim().split(' ');
                let lineVertices = [], lineUVs = [];

                if (line.indexOf('/') === -1) {

                    lineVertices = lineParts;

                } else {
                    for (let li = 0, llen = lineParts.length; li < llen; li++) {
                        let parts = lineParts[li].split('/');
                        if (parts[0] !== '') {
                            lineVertices.push(parts[0]);
                        }
                        if (parts[1] !== '') {
                            lineUVs.push(parts[1]);
                        }
                    }
                }
                this.addLineGeometry(state, lineVertices, lineUVs);

            } else if ((result = regexp.object_pattern.exec(line)) !== null) {

                // o object_name
                // or
                // g group_name

                let id = result[0].substr(1).trim();
                this.startObject(state, id, true);

            } else if (regexp.material_use_pattern.test(line)) {

                // material

                let id = line.substring(7).trim();
                state.object.material.id = id;

            } else if (regexp.material_library_pattern.test(line)) {

                // mtl file

                state.materialLibraries[line.substring(7).trim()] = true;

            } else if ((result = regexp.smoothing_pattern.exec(line)) !== null) {

                // smooth shading

                let value = result[1].trim().toLowerCase();
                state.object.material.smooth = (value === '1' || value === 'on');

            } else {

                // 跳过空白文件指令
                if (line === '\0') {
                    continue;
                }

                Log.error('Unexpected line: \'' + line + '\'');
                return;
            }
        }

        return state;
    }
    getBasePath(src) {
        let n = src.lastIndexOf('/');
        return (n === -1) ? src : src.substring(0, n + 1);
    }

    startObject(state, id, fromDeclaration) {
        if (state.object && state.object.fromDeclaration === false) {
            state.object.id = id;
            state.object.fromDeclaration = (fromDeclaration !== false);
            return;
        }
        state.object = {
            id: id || '',
            geometry: {
                positions: [],
                normals: [],
                uv: []
            },
            material: {
                id: '',
                smooth: true
            },
            fromDeclaration: (fromDeclaration !== false)
        };
        state.objects.push(state.object);
    }

    parseVertexIndex(value, len) {
        let index = parseInt(value, 10);
        return (index >= 0 ? index - 1 : index + len / 3) * 3;
    }

    parseNormalIndex(value, len) {
        let index = parseInt(value, 10);
        return (index >= 0 ? index - 1 : index + len / 3) * 3;
    }

    parseUVIndex(value, len) {
        let index = parseInt(value, 10);
        return (index >= 0 ? index - 1 : index + len / 2) * 2;
    }

    addVertex(state, a, b, c) {
        let src = state.positions;
        let dst = state.object.geometry.positions;
        dst.push(src[a + 0]);
        dst.push(src[a + 1]);
        dst.push(src[a + 2]);
        dst.push(src[b + 0]);
        dst.push(src[b + 1]);
        dst.push(src[b + 2]);
        dst.push(src[c + 0]);
        dst.push(src[c + 1]);
        dst.push(src[c + 2]);
    }

    /**
     * 添加一个VertexLine数据。<br/>
     * @param {Object}[state]
     * @param a
     */
    addVertexLine(state, a) {
        let src = state.positions;
        let dst = state.object.geometry.positions;
        dst.push(src[a + 0]);
        dst.push(src[a + 1]);
        dst.push(src[a + 2]);
    }

    /**
     * 添加Normal。<br/>
     * @param {Object}[state]
     * @param a
     * @param b
     * @param c
     */
    addNormal(state, a, b, c) {
        let src = state.normals;
        let dst = state.object.geometry.normals;
        dst.push(src[a + 0]);
        dst.push(src[a + 1]);
        dst.push(src[a + 2]);
        dst.push(src[b + 0]);
        dst.push(src[b + 1]);
        dst.push(src[b + 2]);
        dst.push(src[c + 0]);
        dst.push(src[c + 1]);
        dst.push(src[c + 2]);
    }

    /**
     * 添加一个UV。<br/>
     * @param {Object}[state]
     * @param a
     * @param b
     * @param c
     */
    addUV(state, a, b, c) {
        let src = state.uv;
        let dst = state.object.geometry.uv;
        dst.push(src[a + 0]);
        dst.push(src[a + 1]);
        dst.push(src[b + 0]);
        dst.push(src[b + 1]);
        dst.push(src[c + 0]);
        dst.push(src[c + 1]);
    }

    /**
     * 添加一个UVLine。<br/>
     * @param {Object}[state]
     * @param a
     */
    addUVLine(state, a) {
        let src = state.uv;
        let dst = state.object.geometry.uv;
        dst.push(src[a + 0]);
        dst.push(src[a + 1]);
    }

    /**
     * 添加一个Face。<br/>
     * @param {Object}[state]
     * @param a
     * @param b
     * @param c
     * @param d
     * @param ua
     * @param ub
     * @param uc
     * @param ud
     * @param na
     * @param nb
     * @param nc
     * @param nd
     */
    addFace(state, a, b, c, d, ua, ub, uc, ud, na, nb, nc, nd) {
        let vLen = state.positions.length;
        let ia = this.parseVertexIndex(a, vLen);
        let ib = this.parseVertexIndex(b, vLen);
        let ic = this.parseVertexIndex(c, vLen);
        let id;
        if (d === undefined) {
            this.addVertex(state, ia, ib, ic);

        } else {
            id = this.parseVertexIndex(d, vLen);
            this.addVertex(state, ia, ib, id);
            this.addVertex(state, ib, ic, id);
        }

        if (ua !== undefined) {

            let uvLen = state.uv.length;

            ia = this.parseUVIndex(ua, uvLen);
            ib = this.parseUVIndex(ub, uvLen);
            ic = this.parseUVIndex(uc, uvLen);

            if (d === undefined) {
                this.addUV(state, ia, ib, ic);

            } else {
                id = this.parseUVIndex(ud, uvLen);
                this.addUV(state, ia, ib, id);
                this.addUV(state, ib, ic, id);
            }
        }

        if (na !== undefined) {

            // 法线多次相同。 如果是这样，请跳过函数调用和parseInt。

            let nLen = state.normals.length;

            ia = this.parseNormalIndex(na, nLen);
            ib = na === nb ? ia : this.parseNormalIndex(nb, nLen);
            ic = na === nc ? ia : this.parseNormalIndex(nc, nLen);

            if (d === undefined) {
                this.addNormal(state, ia, ib, ic);

            } else {

                id = this.parseNormalIndex(nd, nLen);
                this.addNormal(state, ia, ib, id);
                this.addNormal(state, ib, ic, id);
            }
        }
    }

    /**
     * 添加一个Line几何数据。<br/>
     * @param {Object}[state]
     * @param {Number[]}[positions]
     * @param {Number[]}[uv]
     */
    addLineGeometry(state, positions, uv) {

        state.object.geometry.type = 'Line';

        let vLen = state.positions.length;
        let uvLen = state.uv.length;

        for (let vi = 0, l = positions.length; vi < l; vi++) {
            this.addVertexLine(state, this.parseVertexIndex(positions[vi], vLen));
        }

        for (let uvi = 0, uvl = uv.length; uvi < uvl; uvi++) {
            this.addUVLine(state, this.parseUVIndex(uv[uvi], uvLen));
        }
    }

    /**
     * 加载以解析状态列出的MTL文件。<br/>
     * @param {Node}[modelNode]
     * @param {Object}[state]
     * @param {Function}[ok]
     */
    loadMTLs(modelNode, state, ok) {
        let basePath = state.basePath;
        let srcList = Object.keys(state.materialLibraries);
        let numToLoad = srcList.length;
        for (let i = 0, len = numToLoad; i < len; i++) {
            this.loadMTL(modelNode, basePath, basePath + srcList[i], ()=>{
                if (--numToLoad === 0) {
                    ok();
                }
            });
        }
    }

    /**
     * 加载一个MTL文件。<br/>
     * @param {Node}[modelNode]
     * @param {String}[basePath 表示obj模型的路径,用于加载mtl文件]
     * @param {String}[src obj模型路径]
     * @param {Function}[ok 回调]
     */
    loadMTL(modelNode, basePath, src, ok) {
        this.loadFile(src, (text)=>{
                this.parseMTL(modelNode, text, basePath);
                ok();
            },
            (error)=>{
                Log.error(error);
                ok();
            });
    };
    createTexture(modelNode, basePath, value, encoding) {
        let textureCfg = {};
        let items = value.split(/\s+/);
        let pos = items.indexOf('-bm');
        if (pos >= 0) {
            //matParams.bumpScale = parseFloat(items[pos + 1]);
            items.splice(pos, 2);
        }
        pos = items.indexOf('-s');
        if (pos >= 0) {
            textureCfg.scale = [parseFloat(items[pos + 1]), parseFloat(items[pos + 2])];
            items.splice(pos, 4); // 只需要3个参数
        }
        pos = items.indexOf('-o');
        if (pos >= 0) {
            textureCfg.translate = [parseFloat(items[pos + 1]), parseFloat(items[pos + 2])];
            items.splice(pos, 4); // 只需要3个参数
        }
        textureCfg.src = basePath + items.join(' ').trim();
        textureCfg.flipY = true;
        textureCfg.encoding = encoding || "linear";
        //textureCfg.wrapS = self.wrap;
        //textureCfg.wrapT = self.wrap;
        let texture = new Texture2DVars(this._m_Scene);
        texture.setPreloadColor(this._m_Scene, new Vector4(0.2, 0.2, 0.2, 1.0));
        texture.setImageSrc(this._m_Scene, textureCfg.src);
        return texture;
    }

    createMaterial(modelNode, materialCfg) {
        // obj模型材质使用经典phong
        if(this._m_DefaultMatDef){
            if(!this._m_Mats[materialCfg.id]){
                let basicLightingMat = new Material(this._m_Scene, {id:materialCfg.id, materialDef:this._m_DefaultMatDef});
                this._m_Mats[materialCfg.id] = basicLightingMat;
                this._m_CurrentMat = basicLightingMat;
                // 初始参数
                this._m_CurrentMat.setParam('diffuseColor', new Vec4Vars().valueFromXYZW(0.5, 0.5, 0.5, 1.0));
                this._m_CurrentMat.setParam('ambientColor', new Vec4Vars().valueFromXYZW(0.2, 0.2, 0.2, 1.0));
                this._m_CurrentMat.setParam('specularColor', new Vec4Vars().valueFromXYZW(1.0, 1.0, 1.0, 1.0));
                this._m_CurrentMat.setParam('shininess', new FloatVars().valueOf(32.0));
            }
        }
    }

    parseRGB(value) {
        let delimiter_pattern = /\s+/;
        let ss = value.split(delimiter_pattern, 3);
        return [parseFloat(ss[0]), parseFloat(ss[1]), parseFloat(ss[2])];
    }
    parseMTL(modelNode, mtlText, basePath){


        let lines = mtlText.split('\n');
        let materialCfg = {
            id: "Default"
        };
        let needCreate = false;
        let line;
        let pos;
        let key;
        let value;
        let alpha;

        basePath = basePath || "";

        for (let i = 0; i < lines.length; i++) {

            line = lines[i].trim();

            if (line.length === 0 || line.charAt(0) === '#') { // 跳过注释行
                continue;
            }

            pos = line.indexOf(' ');

            key = (pos >= 0) ? line.substring(0, pos) : line;
            key = key.toLowerCase();

            value = (pos >= 0) ? line.substring(pos + 1) : '';
            value = value.trim();

            switch (key.toLowerCase()) {

                case "newmtl": // 添加一个材质实例到内存中
                    materialCfg = {
                        id: value
                    };
                    this.createMaterial(modelNode, materialCfg);
                    break;

                case 'ka':
                    materialCfg.ambient = this.parseRGB(value);
                    this._m_CurrentMat.setParam('ambientColor', new Vec4Vars().valueFromXYZW(materialCfg.ambient[0], materialCfg.ambient[1], materialCfg.ambient[2], 1.0));
                    break;

                case 'kd':
                    materialCfg.diffuse = this.parseRGB(value);
                    this._m_CurrentMat.setParam('diffuseColor', new Vec4Vars().valueFromXYZW(materialCfg.diffuse[0], materialCfg.diffuse[1], materialCfg.diffuse[2], 1.0));
                    break;

                case 'ks':
                    materialCfg.specular = this.parseRGB(value);
                    this._m_CurrentMat.setParam('specularColor', new Vec4Vars().valueFromXYZW(materialCfg.specular[0], materialCfg.specular[1], materialCfg.specular[2], 1.0));
                    break;

                case 'map_kd':
                    if (!materialCfg.diffuseMap) {
                        materialCfg.diffuseMap = this.createTexture(modelNode, basePath, value, "sRGB");
                        this._m_CurrentMat.setParam('diffuseMap', materialCfg.diffuseMap);
                    }
                    break;

                case 'map_ks':
                    if (!materialCfg.specularMap) {
                        materialCfg.specularMap = this.createTexture(modelNode, basePath, value, "linear");
                        this._m_CurrentMat.setParam('specularMap', materialCfg.specularMap);
                    }
                    break;

                case 'map_bump':
                case 'bump':
                    if (!materialCfg.normalMap) {
                        materialCfg.normalMap = this.createTexture(modelNode, basePath, value);
                        this._m_CurrentMat.setParam('normalMap', materialCfg.normalMap);
                    }
                    break;

                case 'ns':
                    materialCfg.shininess = parseFloat(value);
                    this._m_CurrentMat.setParam('shininess', new FloatVars().valueOf(materialCfg.shininess));
                    break;

                case 'd':
                    alpha = parseFloat(value);
                    this._m_CurrentMat.setParam('alphaDiscard', new FloatVars().valueOf(0.1));
                    if (alpha < 1) {
                        materialCfg.alpha = alpha;
                        materialCfg.alphaMode = "blend";
                    }
                    break;

                case 'tr':
                    alpha = parseFloat(value);
                    this._m_CurrentMat.setParam('alphaDiscard', new FloatVars().valueOf(0.1));
                    if (alpha > 0) {
                        materialCfg.alpha = 1 - alpha;
                        materialCfg.alphaMode = "blend";
                    }
                    break;

                default:
            }
        }
    }
    createMeshes(modelNode, state){

        Log.debug("state.objects.length:" + state.objects.length);
        // merge mtl
        let mtlobjs = {};
        let mo = 0;
        for (let j = 0, k = state.objects.length; j < k; j++) {

            let object = state.objects[j];
            let meshData = object.geometry;
            let isLine = (meshData.type === 'Line');
            let materialId = object.material.id;
            let material;
            if (meshData.positions.length === 0) {
                // 跳过无位置几何属性的部分
                continue;
            }
            if(!mtlobjs[materialId]){
                mo++;

                let indices = new Array(meshData.positions.length / 3); // Triangle soup
                for (let idx = 0; idx < indices.length; idx++) {
                    indices[idx] = idx;
                }

                // 创建Mesh
                let mesh = new Mesh();
                mesh.setData(Mesh.S_POSITIONS, meshData.positions);
                if(meshData.normals.length > 0){
                    mesh.setData(Mesh.S_NORMALS, meshData.normals);
                }
                if(meshData.uv.length > 0){
                    mesh.setData(Mesh.S_UV0, meshData.uv);
                }
                mesh.setData(Mesh.S_INDICES, indices);


                // 获取引用的材质实例
                if (materialId && materialId !== "") {
                    material = this._m_Mats[materialId];
                    if (!material) {
                        Log.error("Material not found: " + materialId);
                    }
                } else {
                    // 提供一个默认材质
                    if(this._m_DefaultMatDef){
                        if(!this._m_Mats['Default']){
                            let basicLightingMat = new Material(this._m_Scene, {id:'Default', materialDef:this._m_DefaultMatDef});
                            this._m_Mats['Default'] = basicLightingMat;
                        }
                        material = this._m_Mats['Default'];
                    }

                }
                mtlobjs[materialId] = {mesh, material};
            }
            else{
                let mesh = mtlobjs[materialId].mesh;
                let meshPosition = mesh.getData(Mesh.S_POSITIONS);
                let indices = new Array(meshData.positions.length / 3); // Triangle soup
                for (let idx = 0, offset = meshPosition.length / 3; idx < indices.length; idx++) {
                    indices[idx] = idx + offset;
                }
                if(meshPosition){
                    meshData.positions.forEach(p=>{
                        meshPosition.push(p);
                    });
                }
                mesh.setData(Mesh.S_POSITIONS, meshPosition);
                if(meshData.normals.length > 0){
                    let meshNormal = mesh.getData(Mesh.S_NORMALS);
                    if(meshNormal){
                        meshData.normals.forEach(n=>{
                            meshNormal.push(n);
                        });
                    }
                    mesh.setData(Mesh.S_NORMALS, meshNormal);
                }
                if(meshData.uv.length > 0){
                    let meshUV = mesh.getData(Mesh.S_UV0);
                    if(meshUV){
                        meshData.uv.forEach(uv=>{
                            meshUV.push(uv);
                        });
                    }
                    mesh.setData(Mesh.S_UV0, meshUV);
                }
                let meshIndice = mesh.getData(Mesh.S_INDICES);
                if(meshIndice){
                    indices.forEach(i=>{
                        meshIndice.push(i);
                    });
                }
                mesh.setData(Mesh.S_INDICES, meshIndice);
            }



        }
        if(mo){
            Log.debug("实体数量:" + mo);
            for(let mt in mtlobjs){
                let material = mtlobjs[mt].material;
                let mesh = mtlobjs[mt].mesh;
                // 创建切线
                let uv0s = mesh.getData(Mesh.S_UV0);
                if(uv0s){
                    // 切线数据
                    let tangents = Tools.generatorTangents(mesh.getData(Mesh.S_INDICES), mesh.getData(Mesh.S_POSITIONS), mesh.getData(Mesh.S_UV0));
                    mesh.setData(Mesh.S_TANGENTS, tangents);
                }
                else{
                    // 切线数据
                    let tangents = Tools.generatorFillTangents(mesh.getData(Mesh.S_POSITIONS));
                    mesh.setData(Mesh.S_TANGENTS, tangents);
                }
                // 创建Geometry
                let geometry = new Geometry(modelNode, {id:'Geo_' + mt});
                geometry.setMesh(mesh);
                geometry.setMaterial(material);
                geometry.updateBound();


                modelNode.addChildren(geometry);
            }
        }

    }
    loadFile(url, ok, err) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.addEventListener('load', (event)=>{
            let response = event.target.response;
            if (request.status === 200) {
                if (ok) {
                    ok(response);
                }
            } else if (request.status === 0) {
                // 某些浏览器在使用非HTTP协议时会返回HTTP状态0
                // 例如 “文件：//”或“数据：//”。 处理成功。
                Log.warn('loadFile: HTTP Status 0 received.');
                if (ok) {
                    ok(response);
                }
            } else {
                if (err) {
                    err(event);
                }
            }
        }, false);

        request.addEventListener('error', (event)=>{
            if (err) {
                err(event);
            }
        }, false);
        request.send(null);
    }
}
