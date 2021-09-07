import Component from "../Component.js";
import SubShader from "./SubShader.js";
import Technology from "./Technology.js";
import ShaderSource from "../WebGL/ShaderSource.js";
import Log from "../Util/Log.js";
import FrameBuffer from "../WebGL/FrameBuffer.js";

/**
 * 材质定义，材质定义定义了相关物体渲染时的着色材质属性，通过MaterialShaderSource完成对材质的实现。<br/>
 * @author Kkk
 * @date 2020年12月25日8点25分
 * @lastdata 2021年3月17日15点27分
 */
export default class Material extends Component{
    getType(){
        return "Material";
    }

    /**
     * 创建一个材质实例。<br/>
     * @param {Component}[owner]
     * @param {String}[cfg.id]
     * @param {MaterialDef}[cfg.materialDef]
     */
    constructor(owner, cfg) {
        super(owner, cfg);
        // // 根据当前材质类型获取对应的着色器源码定义，并生成对应的着色器程序
        // this._m_MaterialSource = new SubShaderSource(cfg.materialSourceDef);
        // // 根据materialShaderSource,创建着色器程序,然后根据材质定义,获取着色器变量
        // this._m_ShaderProgram = new ShaderProgram(this._m_Scene.getCanvas().getGLContext(), this._m_MaterialSource.getShaderSource());
        // 材质参数
        this._m_Params = {};
        // 参数值列表
        this._m_ParamValues = {};
        // 可定义材质参数
        this._m_CanDefineParams = {};
        // 已定义材质参数
        this._m_AleadyDefinedParams = {};
        // 发生变化的材质参数值
        this._m_ChangeParams = [];
        this._init();




        // 记录当前激活的subShader
        this._m_CurrentSubShader = null;
        // 记录不同路径中的Shader
        // key:TechnologyName,value:Technology
        this._m_RenderTechnologys = {};
        // 当前实用的技术
        this._m_CurrentTechnology = null;

        // 解析材质定义
        if(cfg.materialDef){
            let gl = this._m_Scene.getCanvas().getGLContext();
            // 获取技术块
            let materialDef = cfg.materialDef;
            // 开始解析
            let mp = materialDef.getParams();
            for(let p in mp){
                // 默认所有参数值为null
                this._m_ParamValues[mp[p].getName()] = null;
                this._m_Params[mp[p].getName()] = true;
                this._m_CanDefineParams[mp[p].getName()] = true;
            }
            let subShaderDefs = materialDef.getSubShaderDefs();
            let subShaders = {};
            for(let sS in subShaderDefs){
                this._initGlobals(materialDef, subShaderDefs[sS]);
                subShaders[subShaderDefs[sS].getName()] = new SubShader(gl, cfg.frameContext || this._m_Scene.getRender().getFrameContext(), subShaderDefs[sS]);
            }
            let technologyDefs = materialDef.getTechnologyDefs();
            let technologyDef = null;
            let rpSubPass = null;
            let subPass = null;
            for(let tE in technologyDefs){
                technologyDef = technologyDefs[tE];
                this._m_RenderTechnologys[technologyDef.getName()] = new Technology(technologyDef.getName());
                rpSubPass = technologyDef.getSubPass();
                for(let renderPath in rpSubPass){
                    subPass = rpSubPass[renderPath];
                    subPass.forEach(sub=>{
                        sub.getPass().forEach(pass=>{
                            // 这里,原本的思路是直接建立renderPath->subShader[]
                            // 但是为了完整性,这里使用了renderPath->subPass(包含一个subShader[])
                            // 其中每个subShader可以指定使用的FB
                            this._m_RenderTechnologys[technologyDef.getName()].addSubPass(renderPath, subShaders[pass.pass.getName()], pass.renderState);
                        });
                        // this._m_RenderTechnologys[technologyDef.getName()].addSubShader(renderPath, subShaders[sub.pass.getName()]);
                    });
                }
            }
            // 设置默认技术
            this.selectTechnology(this._m_Scene.getRender().getPriorityTechnology());
        }
        else{
            // 错误
            console.log("找不到materialDef...");
        }
    }

    /**
     * 创建指定附件。<br/>
     * @param {WebGL}[gl]
     * @param {FrameBuffer}[gfb]
     * @param {String}[type]
     * @param {String}[name]
     * @param {Number}[loc]
     * @private
     */
    _newAtc(gl, gfb, type, name, loc){
        // 暂时只处理这两种
        if(type == 'color'){
            gfb.addTexture(gl, name, gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.COLOR_ATTACHMENT0 + Number(loc), true);
        }
        else if(type == 'depth24_stencil8'){
            gfb.addBuffer(gl, name, gl.DEPTH24_STENCIL8, gl.DEPTH_STENCIL_ATTACHMENT);
        }
    }

    /**
     * 初始化全局变量,以便在整个渲染上下文中共享可访问的块。<br/>
     * @param {MaterialDef}[materialDef]
     * @private
     */
    _initGlobals(materialDef){
        let frameContext = this._m_Scene.getRender().getFrameContext();
        let globals = materialDef.getGlobals();
        let gl = this._m_Scene.getCanvas().getGLContext();
        let loc = null, fun = null;
        let w = this._m_Scene.getCanvas().getWidth();
        let h = this._m_Scene.getCanvas().getHeight();
        for(let global in globals){
            if(!frameContext.getFrameBuffer(global)){
                let gf = globals[global];
                let gfb = new FrameBuffer(gl, global, w, h);
                frameContext.addFrameBuffer(global, gfb);
                if(gf){
                    for(let atc in gf){
                        gf[atc][0].type
                        if(gf[atc].length > 1){
                            this._newAtc(gl, gfb, gf[atc][1].type, gf[atc][1].name, gf[atc][1].loc);
                        }
                        else if(gf[atc].length > 0){
                            this._newAtc(gl, gfb, gf[atc][0].type, gf[atc][0].name);
                        }
                        else{
                            Log.log('错误的atc!');
                        }
                    }
                    gfb.finish(gl, this._m_Scene, true);
                }
                Log.log('create global ' + global);
            }
        }
    }

    /**
     * 返回指定的渲染技术。<br/>
     * @param {String}[renderPathType]
     * @return {Technology}
     */
    getRenderTechnology(renderPathType){
        return this._m_RenderTechnologys.get(renderPathType);
    }

    /**
     * 添加一个技术。<br/>
     * @param {String}[technologyName 技术名称]
     * @param {String}[technology 技术]
     */
    addTechnology(technologyName, technology){
        this._m_RenderTechnologys[technologyName] = technology;
    }

    /**
     * 选中指定技术作为该材质渲染。<br/>
     * @param {String}[technologyName Technology名称]
     */
    selectTechnology(technologyName){
        if(this._m_CurrentTechnology != null && this._m_RenderTechnologys[technologyName] == this._m_CurrentTechnology)return;
        let lastTechnology = this._m_CurrentTechnology;
        let p = this._m_CurrentTechnology != null;
        this._m_CurrentTechnology = this._m_RenderTechnologys[technologyName];
        if(this._m_CurrentTechnology == null){
            this._m_CurrentTechnology = lastTechnology != null ? lastTechnology : this._m_RenderTechnologys[''];
        }
        // 如果是第一次创建Technology,则不需要进行参数定义重设
        // 否则,在切换技术时,需要检测是否需要参数定义重设
        // 另外，不需要保存每个technology是否重设过参数定义，因为AleadyDefinedParams随时可能发生变更，会导致已经定义的technology仍然可能缺少最新的参数定义，所以
        // 只要切换technology，并且不是该Material的首个Technology，就执行一次参数定义重设检测
        // 不必担心重复定义，因为subShader.addDefine()内部会进行剔除
        if(p){
            let subPass = null;
            for(let paramName in this._m_AleadyDefinedParams){
                for(let p in this._m_CurrentTechnology.getSubPassList()){
                    subPass = this._m_CurrentTechnology.getSubPasss(p);
                    subPass.getSubShaders().forEach(sb=>{
                        sb.subShader.addDefine(paramName);
                    });
                }
            }
        }
    }

    /**
     * 返回当前选中的技术。<br/>
     * @return {Technology}
     */
    getCurrentTechnology(){
        return this._m_CurrentTechnology;
    }

    /**
     * 预加载材质。<br/>
     */
    preload(){
        let subPassList = this.getCurrentTechnology().getSubPassList();
        if(subPassList){
            let subPasss = null;
            let currentSubShader = null;
            let gl = this._m_Scene.getCanvas().getGLContext();
            let frameContext = this._m_Scene.getRender().getFrameContext();
            for(let path in subPassList){
                subPasss = subPassList[path];
                subPasss.getSubShaders().forEach(subPass=>{
                    if(subPass.subShader.needCompile()){
                        subPass.subShader._compile(gl, frameContext);
                        // 然后提交参数
                    }
                });
            }
        }
    }

    /**
     * 使用指定subShader进行材质着色。<br/>
     * @param {SubShader}[subShader]
     */
    _selectSubShader(subShader){
        let change = false;
        this._m_CurrentSubShader = subShader;
        let gl = this._m_Scene.getCanvas().getGLContext();
        let frameContext = this._m_Scene.getRender().getFrameContext();
        // 检测是否需要重新编译subShader
        if(this._m_CurrentSubShader.needCompile()){
            this._m_CurrentSubShader._compile(gl, frameContext);
        }
        // 1.先检测是否需要切换subShader(根据shader种类)(这里检测可能与理论不一样，打印出id来调试...)
        if(frameContext.m_LastSubShaderId != subShader.getDefId()){
            // 切换
            subShader.use(gl);
            frameContext.m_LastSubShaderId = subShader.getDefId();
            frameContext.m_LastMaterial = this;
            frameContext.m_SM++;
            change = true;
        }
        // 2.检测是否需要更新参数到subShader中(同种类型subShaderId,但存在不同具体实力化subShader对象,所以参数不同需要更新)
        if(frameContext.m_LastSubShader != subShader){
            frameContext.m_LastSubShader = subShader;
            frameContext.m_SS++;
            // Log.log('切换!');
            // 先检查材质值
            for(let n in this._m_ParamValues){
                // 有些参数值为null
                if(this._m_ParamValues[n]){
                    // 提交参数
                    this._m_CurrentSubShader.uploadParam(gl, n, this._m_ParamValues[n]);
                }
            }
        }
        // 检查最新数据值
        if(this._m_ChangeParams.length > 0){
            this._m_ChangeParams.forEach(param=>{
                // 检测是否需要更新该参数
                if(this._m_ParamValues[param.paramName]){
                    // 如果值相同就跳过
                    if(!this._m_ParamValues[param.paramName].compare(param.value)){
                        // 提交参数并保存参数
                        this._m_CurrentSubShader.uploadParam(gl, param.paramName, param.value);
                        this._m_ParamValues[param.paramName] = param.value;
                    }
                }
                else{
                    // 提交参数并保存参数
                    this._m_CurrentSubShader.uploadParam(gl, param.paramName, param.value);
                    this._m_ParamValues[param.paramName] = param.value;
                }
            });
            this._m_ChangeParams.length = 0;
        }
        return change;
    }

    /**
     * 初始化。<br/>
     * 这个函数暂时作废。<br/>
     * @private
     */
    _init(){
        // let gl = this._m_Scene.getCanvas().getGLContext();
        // this.use();
        // let mI = gl.getUniformLocation(this._m_ShaderProgram.getProgram(), "modelMatrix");
        // gl.uniformMatrix4fv(mI, false, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
        // let ubi = gl.getUniformBlockIndex(this._m_ShaderProgram.getProgram(), "VP");
        // gl.uniformBlockBinding(this._m_ShaderProgram.getProgram(), ubi, 0x001);
        // gl.useProgram(null);
    }

    /**
     * 设置参数。<br/>
     * @param {String}[paramName 参数名]
     * @param {Vars}[value 参数值]
     */
    setParam(paramName, value){
        // 检测是否有效参数
        if(this._m_Params[paramName]){
            // 检测是否已经定义
            let update = false;
            if(!this._m_AleadyDefinedParams[paramName]){
                update = true;
                this._m_AleadyDefinedParams[paramName] = true;
            }
            if(update){
                // 定义该参数
                // 重新构建当前技术所有SubShader块
                let subPass = null;
                for(let paramName in this._m_AleadyDefinedParams){
                    for(let p in this._m_CurrentTechnology.getSubPassList()){
                        subPass = this._m_CurrentTechnology.getSubPasss(p);
                        subPass.getSubShaders().forEach(sb=>{
                            sb.subShader.addDefine(paramName);
                        });
                    }
                }
            }
            // 检测是否存在已有参数(这里直接使用遍历,后续可改进,不过因为实时渲染阶段很少大规模调整参数,所以即使遍历也仅仅影响预加载阶段)
            let needAdd = true;
            if(this._m_ChangeParams.length > 0){
                let p = null;
                for(let i = 0;i < this._m_ChangeParams.length;i++){
                    if(this._m_ChangeParams[i].paramName == paramName){
                        this._m_ChangeParams[i].value = value;
                        needAdd = false;
                        break;
                    }
                }
            }
            // 将其加入参数列表
            value.owner(this, paramName);
            if(needAdd){
                this._m_ChangeParams.push({paramName, value});
            }
        }
    }

    /**
     * 添加一个定义。<br/>
     * @param {String}[name]
     */
    addDefine(name){
        let update = false;
        if(!this._m_AleadyDefinedParams[name]){
            update = true;
            this._m_AleadyDefinedParams[name] = true;
        }
        if(update){
            // 定义该参数
            // 重新构建当前技术所有SubShader块
            let subPass = null;
            for(let paramName in this._m_AleadyDefinedParams){
                for(let p in this._m_CurrentTechnology.getSubPassList()){
                    subPass = this._m_CurrentTechnology.getSubPasss(p);
                    subPass.getSubShaders().forEach(sb=>{
                        sb.subShader.addDefine(paramName, name == paramName && ShaderSource.Context_Data[name] != null);
                    });
                }
            }
        }
    }

}
