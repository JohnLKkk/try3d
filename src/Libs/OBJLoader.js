import Node from '../Core/Node/Node.js';
import MaterialDef from "../Core/Material/MaterialDef.js";
import Material from "../Core/Material/Material.js";
import Mesh from "../Core/WebGL/Mesh.js";
import Geometry from "../Core/Node/Geometry.js";
export default class OBJLoader {
    load(scene, src, callback){
        this._m_Scene = scene;
        this._m_DefaultMatDef = null;
        this._m_Mats = {};
        let modelNode = new Node(scene, {id:'testObj'});
        // 加载obj模型
        this._load(modelNode, src, callback);
    }
    _load(modelNode, src, callback) {
        // 解析OBJ数据块
        this.loadOBJ(modelNode, src, (state)=>{
            if(!this._m_DefaultMatDef){
                this._m_DefaultMatDef = MaterialDef.load("../src/Core/Assets/MaterialDef/BasicLightingDef");
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
            console.error(error);
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

                    console.error('Unexpected vertex/normal/uv line: \'' + line + '\'');
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
                    console.error('Unexpected face line: \'' + line + '\'');
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

                console.error('Unexpected line: \'' + line + '\'');
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

    addVertexLine(state, a) {
        let src = state.positions;
        let dst = state.object.geometry.positions;
        dst.push(src[a + 0]);
        dst.push(src[a + 1]);
        dst.push(src[a + 2]);
    }

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

    addUVLine(state, a) {
        let src = state.uv;
        let dst = state.object.geometry.uv;
        dst.push(src[a + 0]);
        dst.push(src[a + 1]);
    }

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
    //--------------------------------------------------------------------------------------------
    // 加载以解析状态列出的MTL文件
    //--------------------------------------------------------------------------------------------

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

    //--------------------------------------------------------------------------------------------
    // 加载一个MTL文件
    //--------------------------------------------------------------------------------------------

    loadMTL(modelNode, basePath, src, ok) {
        this.loadFile(src, (text)=>{
                this.parseMTL(modelNode, text, basePath);
                ok();
            },
            (error)=>{
                console.error(error);
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
        let texture = new Texture(modelNode, textureCfg);
        return texture.id;
    }

    createMaterial(modelNode, materialCfg) {
        // obj模型材质使用经典phong
        if(this._m_DefaultMatDef){
            if(!this._m_Mats[materialCfg.id]){
                let basicLightingMat = new Material(this._m_Scene, {id:materialCfg.id, materialDef:this._m_DefaultMatDef});
                basicLightingMat.selectTechnology('BlinnPhongLight2');
                this._m_Mats[materialCfg.id] = basicLightingMat;
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
                    this.createMaterial(modelNode, materialCfg);
                    materialCfg = {
                        id: value
                    };
                    needCreate = true;
                    break;

                case 'ka':
                    materialCfg.ambient = this.parseRGB(value);
                    break;

                case 'kd':
                    materialCfg.diffuse = this.parseRGB(value);
                    break;

                case 'ks':
                    materialCfg.specular = this.parseRGB(value);
                    break;

                case 'map_kd':
                    if (!materialCfg.diffuseMap) {
                        materialCfg.diffuseMap = this.createTexture(modelNode, basePath, value, "sRGB");
                    }
                    break;

                case 'map_ks':
                    if (!materialCfg.specularMap) {
                        materialCfg.specularMap = this.createTexture(modelNode, basePath, value, "linear");
                    }
                    break;

                case 'map_bump':
                case 'bump':
                    if (!materialCfg.normalMap) {
                        materialCfg.normalMap = this.createTexture(modelNode, basePath, value);
                    }
                    break;

                case 'ns':
                    materialCfg.shininess = parseFloat(value);
                    break;

                case 'd':
                    alpha = parseFloat(value);
                    if (alpha < 1) {
                        materialCfg.alpha = alpha;
                        materialCfg.alphaMode = "blend";
                    }
                    break;

                case 'tr':
                    alpha = parseFloat(value);
                    if (alpha > 0) {
                        materialCfg.alpha = 1 - alpha;
                        materialCfg.alphaMode = "blend";
                    }
                    break;

                default:
            }
        }

        if (needCreate) {
            this.createMaterial(modelNode, materialCfg);
        }
    }
    createMeshes(modelNode, state){

        console.log("state.objects.length:" + state.objects.length);
        for (let j = 0, k = state.objects.length; j < k; j++) {

            let object = state.objects[j];
            let meshData = object.geometry;
            let isLine = (meshData.type === 'Line');

            if (meshData.positions.length === 0) {
                // 跳过无位置几何属性的部分
                continue;
            }

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

            // 创建Geometry
            let geometry = new Geometry(modelNode, {id:object.id});
            geometry.setMesh(mesh);

            let materialId = object.material.id;
            let material;
            // 获取引用的材质实例
            if (materialId && materialId !== "") {
                material = this._m_Mats[materialId];
                if (!material) {
                    console.error("Material not found: " + materialId);
                }
            } else {
                // 提供一个默认材质
                if(this._m_DefaultMatDef){
                    if(!this._m_Mats['Default']){
                        let basicLightingMat = new Material(this._m_Scene, {id:'Default', materialDef:this._m_DefaultMatDef});
                        basicLightingMat.selectTechnology('BlinnPhongLight2');
                        this._m_Mats['Default'] = basicLightingMat;
                    }
                    material = this._m_Mats['Default'];
                }

            }
            geometry.setMaterial(material);
            geometry.updateBound();


            modelNode.addChildren(geometry);
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
                // Some browsers return HTTP Status 0 when using non-http protocol
                // e.g. 'file://' or 'data://'. Handle as success.
                console.warn('loadFile: HTTP Status 0 received.');
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
