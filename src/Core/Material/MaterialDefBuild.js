import Tools from "../Util/Tools.js";
import ShaderSource from "../WebGL/ShaderSource.js";

/**
 * MaterialDefBuild。<br/>
 * 用于构建优化的MaterialDef代码。<br/>
 * @author Kkk
 * @date 2021年10月6日16点29分
 */
export default class MaterialDefBuild {
    constructor(props) {
        this._m_funs = {};
        this._m_vars = {};
    }
    static trim(str){
        return str.replace(/(^\s*)|(\s*$)/g, "");
    }

    /**
     * 进行栈解退收集调用链。<br/>
     * @param {Array[]}[data]
     * @param {Object}[allVars]
     * @param {Object}[allFuns]
     * @param {String}[fun]
     * @return {Object}
     * @private
     */
    _getFun(data, allVars, allFuns, fun){
        let src = [];
        let call = {};
        let svars = null;
        let sfun = fun;
        let bd = (s, e, vars)=>{
            let v = allVars[vars];
            let c = [];
            let line = null;
            for(let i = s;i <= e;i++){
                line = data[i];
                if(v){
                    line = Tools.repSrc(line, v.pattern, v.tagPattern, '');
                }
                c.push(line + '\n');
            }
            return c;
        };
        let finds = (fun)=>{
            let curFun = allFuns[fun];
            if(curFun && !call[fun]){
                call[fun] = true;
                let calls = curFun.calls;
                if(calls && calls.length){
                    for(let nextFun in calls){
                        finds(calls[nextFun]);
                    }
                }
                if(!this._m_funs[fun]){
                    this._m_funs[fun] = bd(curFun.s, curFun.e, curFun.vars);
                    if(curFun.vars && svars && curFun.vars != svars){
                        console.error('函数链' + sfun + '使用了多个vars!');
                    }
                }
                if(curFun.vars){
                    svars = curFun.vars;
                }
                for(let i = 0;i < this._m_funs[fun].length;i++){
                    src.push(this._m_funs[fun][i]);
                }
            }
        };
        // 栈解退
        finds(fun);
        if(svars){
            if(!this._m_vars[svars]){
                let v = [];
                v.push('Vars{\n');
                let nv = allVars[svars];
                for(let i = nv.s + 1;i <= nv.e;i++){
                    v.push(data[i] + '\n');
                }
                this._m_vars[svars] = v;
            }
            let c = [];
            for(let i = 0;i < this._m_vars[svars].length;i++){
                c.push(this._m_vars[svars][i]);
            }
            svars = c;
        }
        return {src, svars};
    }
    build(data){
        let vars = {};
        let allVars = {};
        let functions = {};
        let funDefId = null;
        let allFuns = {};
        let v = 0, f = 0;
        // 解析每一行
        let startBlocks = {};
        let includes = {};
        let endBlocks = {};
        let find = false;
        let def = null;
        if(data){
            // 分割每一行
            data = data.split("\n");

            // 导入库函数
            // 检测是否导入库
            let result = [];
            for(let i = 1;i < data.length;i++){
                let _line = MaterialDefBuild.trim(data[i]);
                if(_line.startsWith('#include')){
                    let lib = _line.split(" ")[1];
                    // 插入库代码
                    if(ShaderSource.Context_Data[lib] && !includes[lib]){
                        includes[lib] = true;
                        // 系统库代码
                        lib = ShaderSource.Context_Data[lib];
                        lib = lib.split("\n");
                        for(let g = 0;g < lib.length;g++){
                            result.push(lib[g]);
                        }
                    }
                    else{
                        // 自定义库代码
                    }
                }
                else{
                    result.push(data[i]);
                }
            }
            data = result;
            // for(let i = 0;i < result.length;i++){
            //     console.log(result[i]);
            // }


            for(let i = 0;i < data.length;i++){
                let _line = MaterialDefBuild.trim(data[i]);
                find = false;
                def = null;
                if(!_line.startsWith("//")){
                    // 查找所有Vars和Functions,由于下一个阶段生成优化代码
                    let nextDef = null;
                    if(_line.startsWith('Vars')){
                        nextDef = vars;
                        v++;
                    }
                    else if(_line.startsWith('Functions')){
                        nextDef = functions;
                        f++;
                    }
                    if(nextDef){
                        find = true;
                        // Vars
                        let block = _line.substring(0, _line.indexOf("{"));
                        def = {s:i, e:null};

                        // Vars/Functions定义
                        let bsa = block.split(" ");
                        let blockId = "";
                        if(bsa.length > 1){
                            blockId = bsa[bsa.length - 1];
                        }
                        nextDef[blockId] = def;
                        if(nextDef == vars){
                            // pattern:eval("/" + name + "/"), pattern2:eval("/" + name + "[\\s+-;.,\\*\\\\]{1,}/")
                            def.pattern = eval("/" + blockId + "./");
                            def.pattern2 = eval("/" + blockId + ".[\\s+-;.,\\*\\\\]{1,}/");
                            def.tagPattern = eval("/" + blockId + "./g");
                        }
                        else{
                            funDefId = blockId;
                            // pattern:eval("/" + name + "/"), pattern2:eval("/" + name + "[\\s+-;.,\\*\\\\]{1,}/")
                            def.pattern = eval("/" + blockId + "./");
                            def.pattern2 = eval("/" + blockId + ".[\\s+-;.,\\*\\\\]{1,}/");
                        }
                        // end
                    }
                    if(find){
                        let start = 1;
                        let nextFun = null;
                        let cf = false;
                        let cfstart = 0;
                        do {
                            i++;
                            _line = MaterialDefBuild.trim(data[i]);
                            // 可能存在表达式
                            if(_line.endsWith('{')){
                                if((_line.startsWith('{') || _line.startsWith('for') || _line.startsWith('if') || _line.startsWith('else') || _line.startsWith('while'))){
                                    cfstart++;
                                }
                                else{
                                    start++;
                                    let block = _line.substring(0, _line.indexOf("("));
                                    let bsa = block.split(" ");
                                    nextFun = bsa[bsa.length - 1];
                                    if(!allFuns[nextFun]){
                                        allFuns[nextFun] = {pattern:eval("/" + nextFun + "/"), pattern2:eval("/" + nextFun + "[\\s+-;.,\\*\\\\]{1,}/")};
                                        allFuns[nextFun].s = i;
                                        allFuns[nextFun].funDefId = funDefId;
                                    }
                                }
                            }
                            else if(_line.startsWith('}')){
                                if(cfstart > 0){
                                    cfstart--;
                                }
                                else{
                                    start--;
                                    if(nextFun){
                                        allFuns[nextFun].e = i;
                                    }
                                    nextFun = null;
                                }
                            }
                            else if(nextFun){
                                // 索引vars
                                for(let v in vars){
                                    let pr = Tools.find2(_line, vars[v].pattern);
                                    if(pr != -1) {
                                        // 为了正确匹配一行的重复,再这里二次匹配并判断
                                        let pr2 = Tools.find2(_line, vars[v].pattern2);
                                        if (pr2 != null) {
                                            if(allFuns[nextFun]){
                                                if(allFuns[nextFun].vars && allFuns[nextFun].vars != v){
                                                    console.error('函数' + nextFun + '使用了不同的vars!');
                                                }
                                                allFuns[nextFun].vars = v;
                                            }
                                        }
                                    }
                                }
                                // 索引调用链
                                for(let f in allFuns){
                                    let pr = Tools.find2(_line, allFuns[f].pattern);
                                    if(pr != -1) {
                                        // 为了正确匹配一行的重复,再这里二次匹配并判断
                                        let pr2 = Tools.find2(_line, allFuns[f].pattern2);
                                        if (pr2 != null) {
                                            if(!allFuns[nextFun]){
                                                console.error('当前上下文不存在调用函数:' + nextFun);
                                            }
                                            // 稳妥一点,这里再检测一边(其实是多余的,但部分浏览器在error()后会继续执行
                                            if(allFuns[nextFun]){
                                                if(!allFuns[nextFun].calls){
                                                    allFuns[nextFun].calls = [];
                                                }
                                                allFuns[nextFun].calls.push(f);
                                            }
                                        }
                                    }
                                }
                            }
                            if(start == 0)break;
                        }while(true);
                        def.e = i;
                    }
                }
            }
            if(v || f){
                let res = [];
                // 删除多余代码
                // 首先删除v
                let nv = null;
                for(let vs in vars){
                    nv = vars[vs];
                    for(let t = nv.s;t <= nv.e;t++){
                        res[t] = true;
                    }
                }
                // 紧接着删除f
                for(let fs in functions){
                    nv = functions[fs];
                    for(let t = nv.s;t <= nv.e;t++){
                        res[t] = true;
                    }
                }
                let result = [];
                for(let i = 0;i < data.length;i++){
                    if(!res[i]){
                        result.push(data[i] + '\n');
                    }
                }
                // for(let i = 0;i < result.length;i++){
                //     console.log(result[i]);
                // }
                // 生成下一个阶段的代码
                let curSub = null;
                let ncode = {};
                let nc = 0;
                for(let i = 0;i < result.length;i++){
                    let _line = MaterialDefBuild.trim(result[i]);
                    if(!_line.startsWith("//")){
                        if(_line.startsWith('SubTechnology')){
                            let block = _line.substring(0, _line.indexOf("{"));
                            let bsa = block.split(" ");
                            let blockId = "";
                            if(bsa.length > 1){
                                blockId = bsa[bsa.length - 1];
                            }
                            curSub = blockId;
                        }
                        else if(_line.startsWith('Vs_Shader')){
                            let bsa = _line.split(":");
                            if(bsa.length > 1){
                                let fun = ((bsa[1].split('.'))[1]).split(';')[0];
                                let d = this._getFun(data, vars, allFuns, fun);
                                ncode[i] = {curSub, type:'Vs_Shader', src:d.src, vars:d.svars, fun};
                                nc++;
                            }
                        }
                        else if(_line.startsWith('Fs_Shader')){
                            let bsa = _line.split(":");
                            if(bsa.length > 1){
                                let fun = ((bsa[1].split('.'))[1]).split(';')[0];
                                let d = this._getFun(data, vars, allFuns, fun);
                                ncode[i] = {curSub, type:'Fs_Shader', src:d.src, vars:d.svars, fun};
                                nc++;
                            }
                        }
                    }
                }
                data = [];
                // 构建代码
                if(nc){
                    let subVars = {};
                    let code = null;
                    for(let i = 0;i < result.length;i++){
                        code = ncode[i];
                        if(code){
                            // 生成代码
                            if(code.vars && !subVars[code.curSub]){
                                for(let i = 0;i < code.vars.length;i++){
                                    data.push(code.vars[i]);
                                }
                            }
                            if(code.type == 'Vs_Shader'){
                                data.push('Vs_Shader{\n');
                            }
                            else if(code.type == 'Fs_Shader'){
                                data.push('Fs_Shader{\n');
                            }
                            for(let i = 0;i < code.src.length;i++){
                                data.push(code.src[i]);
                            }
                            // 主函数
                            data.push('void main(){\n');
                            data.push(code.fun + '();\n');
                            data.push('}\n');
                            data.push('}\n');
                        }
                        else{
                            data.push(result[i]);
                        }
                    }
                }


                // console.log('vars:' , vars);
                // console.log('functions:' , functions);
                // // 测试调用function3
                // let fun = 'function3';
                // let d = this._getFun(data, vars, allFuns, fun);
                // console.log('src:\n' + d.src);
                // console.log('vars:\n' + d.svars);
                // let calls = (fun)=>{
                //     if(allFuns[fun]){
                //         console.log('调用' + fun);
                //         if(allFuns[fun].calls && allFuns[fun].calls.length){
                //             for(let nextFun in allFuns[fun].calls){
                //                 calls(allFuns[fun].calls[nextFun]);
                //             }
                //         }
                //     }
                // };
                // calls(fun);
            }
            // console.log('src:\n');
            // for(let i = 0;i < data.length;i++){
            //     console.log(data[i])
            // }
        }
        return data;
    }

}
