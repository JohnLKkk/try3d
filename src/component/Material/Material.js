import Component from "../Component.js";
import SubShaderSource from "./SubShaderSource.js";
import ShaderProgram from "../WebGL/ShaderProgram.js";
import SubShader from "./SubShader.js";
import Technology from "./Technology.js";

/**
 * 材质定义，材质定义定义了相关物体渲染时的着色材质属性，通过MaterialShaderSource完成对材质的实现。<br/>
 * @author Kkk
 */
export default class Material extends Component{
    getType(){
        return "Material";
    }
    constructor(owner, cfg) {
        super(owner, cfg);
        // // 根据当前材质类型获取对应的着色器源码定义，并生成对应的着色器程序
        // this._m_MaterialSource = new SubShaderSource(cfg.materialSourceDef);
        // // 根据materialShaderSource,创建着色器程序,然后根据材质定义,获取着色器变量
        // this._m_ShaderProgram = new ShaderProgram(this._m_Scene.getCanvas().getGLContext(), this._m_MaterialSource.getShaderSource());
        // 变量参数
        this._m_SystemParams = {};
        this._m_Params = {};
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
            for(let p in materialDef.getParams()){
                // 默认所有参数值为null
                this._m_Params[materialDef.getParams[p]] = null;
            }
            let subShaderDefs = materialDef.getSubShaderDefs();
            let subShaders = {};
            for(let sS in subShaderDefs){
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
            this.selectTechnology("");
        }
        else{
            // 错误
            console.log("找不到materialDef...");
        }
    }
    getRenderTechnology(renderPathType){
        return this._m_RenderTechnologys.get(renderPathType);
    }
    use(){
        // let gl = this._m_Scene.getCanvas().getGLContext();
        // this._m_ShaderProgram.use(gl);
        // if(this._m_SystemParams){
        //     // 更新系统参数
        // }
        // if(this._m_Params){
        //     // 更新参数
        //     for(let key in this._m_Params){
        //     }
        // }
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
        this._m_CurrentTechnology = this._m_RenderTechnologys[technologyName];
    }

    /**
     * 返回当前选中的技术。<br/>
     * @return {Technology}
     */
    getCurrentTechnology(){
        return this._m_CurrentTechnology;
    }

    /**
     * 使用指定subShader进行材质着色。<br/>
     * @param {SubShader}[subShader]
     */
    _selectSubShader(subShader){
        this._m_CurrentSubShader = subShader;
        let frameContext = this._m_Scene.getRender().getFrameContext();
        let gl = this._m_Scene.getCanvas().getGLContext();
        // 1.先检测是否需要切换subShader(根据shader种类)(这里检测可能与理论不一样，打印出id来调试...)
        if(frameContext.m_LastSubShaderId != subShader.getDefId()){
            // 切换
            subShader.use(gl);
            frameContext.m_LastSubShaderId = subShader.getDefId();
        }
        // 2.检测是否需要更新参数到subShader中(同种类型subShaderId,但存在不同具体实力化subShader对象,所以参数不同需要更新)
        if(frameContext.m_LastSubShader != subShader){
            frameContext.m_LastSubShader = subShader;
            // 更新参数到subShader中?
            // modelMatrix,蒙皮骨骼变换这些信息,只能由具体的Geometry去传递,所以应该在Geometry中更新modelMatrix,但由于是提交数据时仅需要local,所以Geometry需要持有mat SubShader,这样才能直到更新到哪个shader句柄中。
            // 而灯光的一些信息,应该由灯光模块系统去执行更新(如果使用ubo block,则可以不需要引用mat就可以独立更新,mat subShader只需要绑定指定的ubo block即可)

            // for(let paramName in subShader.getParams()){
            //     if(subShader.getParamValue(paramName) != this._m_Params[paramName]){
            //         // 更新新的值到subShader中
            //     }
            // }

        }
    }
    _init(){
        // let gl = this._m_Scene.getCanvas().getGLContext();
        // this.use();
        // let mI = gl.getUniformLocation(this._m_ShaderProgram.getProgram(), "modelMatrix");
        // gl.uniformMatrix4fv(mI, false, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
        // let ubi = gl.getUniformBlockIndex(this._m_ShaderProgram.getProgram(), "VP");
        // gl.uniformBlockBinding(this._m_ShaderProgram.getProgram(), ubi, 0x001);
        // gl.useProgram(null);
    }

}
