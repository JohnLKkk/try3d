import Component from "../Component.js";
import AssetLoader from "../Util/AssetLoader.js";

class Block{
    /**
     * 块数据包含。
     * @param {String}[type 块类型]
     * @param {String}[id 块id]
     * @param {String[]}[data 字符串串数组]
     * @param {Number}[start 块开始索引]
     * @param {Number}[end 块结束索引]
     */
    constructor(type, id, data, start, end) {
        this.m_Type = type;
        this.m_Id = id;
        this.m_Data = data;
        this.m_Start = start;
        this.m_End = end;
        this.m_SubBlock = [];
    }
    getType(){
        return this.m_Type;
    }
    addSubBlock(subBlock){
        this.m_SubBlock.push(subBlock);
    }
    getSubBlock(){
        return this.m_SubBlock;
    }
    setStart(start){
        this.m_Start = start;
    }
    getStart(){
        return this.m_Start;
    }
    setEnd(end){
        this.m_End = end;
    }
    getEnd(){
        return this.m_End;
    }
    getData(){
        return this.m_Data;
    }
    toString(){
        return "type:" + this.m_Type + "\n" + "" +
            "id:" + this.m_Id + "\n" +
            "data:\n" + this.m_Data + "\n";
    }

}
class Param{
    constructor() {
        this.m_Name = null;
        this.m_Type = null;
        this.m_DefaultValue = null;
    }
    setName(name){
        this.m_Name = name;
    }
    getName(){
        return this.m_Name;
    }
    setType(type){
        this.m_Type = type;
    }
    getType(){
        return this.m_Type;
    }
    setDefaultValue(defaultValue){
        this.m_DefaultValue = defaultValue;
    }
    getDefaultVaule(){
        return this.m_DefaultValue;
    }

}
class SubTechnology{
    constructor() {
        this.m_Name = null;
        this.m_Shaders = {};
    }
    setName(name){
        this.m_Name = name;
    }
    getName(){
        return this.m_Name;
    }
    addShader(type, shader){
        this.m_Shaders[type] = shader;
    }
    getShaders(){
        return this.m_Shaders;
    }

}
/**
 * 材质定义。
 */
export default class MaterialDef{
    constructor() {
        // 解析
        // 材质名称
        this._m_Name = "";
        // 材质参数(元素类型Param)
        this._m_Params = {};
    }
    addParam(param){
        this._m_Params[param.getName()] = param;
    }
    setName(name){
        this._m_Name = name;
    }
    read(src){
        AssetLoader.loadMaterialSourceDef(src, (data)=>{MaterialDef.parse(data)});
    }
    static trim(str){
        return str.replace(/(^\s*)|(\s*$)/g, "");
    }

    /**
     * 解析材质参数块。<br/>
     * @param {MaterialDef}[matDef 结果材质定义]
     * @param {Block}[blockDef 定义块]
     */
    static parseParams(matDef, blockDef){
        // 解析材质参数
        let data = blockDef.getData();
        let line = null;
        let param = null;
        for(let i = blockDef.getStart() + 1;i < blockDef.getEnd() - 1;i++){
            line = data[i];
            // 按空格分割(去掉最后的;号)
            line = line.substring(0, line.length - 1).split(" ");
            param = new Param();
            param.setName(line[1]);
            param.setType(line[0]);
            if(line.length > 2){
                // 默认值
                param.setDefaultValue(line[3]);
            }
            matDef.addParam(param);
        }
    }

    /**
     * 解析SubTechnology。<br/>
     * @param {MaterialDef}[matDef 结果材质定义]
     * @param {Block}[blockDef 定义块]
     */
    static parseSubTechnology(matDef, blockDef){
        let subTechnology = new SubTechnology();
        blockDef.getSubBlock().forEach(subBlockDef=>{
            MaterialDef.parseBlockDef(subTechnology, subBlockDef);
        });
    }
    static parseBlockDef(blockObj, blockDef){
        if(blockDef){
            switch (blockDef.getType()) {
                case "Def":
                    // 创建一个材质定义
                    blockObj.setName(blockDef.getName());
                    break;
                case "Params":
                    // 材质参数
                    // 解析材质参数列表
                    MaterialDef.parseParams(blockObj, blockDef);
                    break;
                case "SubTechnology":
                    // 子技术块
                    break;
            }
            blockDef.getSubBlock().forEach(subBlockDef=>{
                MaterialDef.parseBlockDef(blockObj, subBlockDef);
            });
        }
    }

    /**
     * 获取块定义
     * @param {Block}[blockDef 块定义,结果将报错到这里]
     * @param {String}[data Def文件内容]
     * @param {Number}[startOffset 块定义起始偏移量]
     */
    static getBlockDef(blockDef, data, startOffset){
        let start = 1;
        let line = null;
        for(let i = startOffset + 1;i < data.length;i++){
            line = MaterialDef.trim(data[i]);
            if(!line.startsWith("//")){
                if(line.endsWith("{")){
                    // 增加了一个块
                    start++;

                    let block = line.substring(0, line.indexOf("{"));
                    // 块类型解析
                    let bsa = block.split(" ");
                    let blockType = bsa[0];
                    if(blockType != "void"){
                        let blockId = "";
                        if(bsa.length > 1){
                            blockId = bsa[bsa.length - 1];
                        }
                        // 开始一个块
                        let subBlockDef = new Block(blockType, blockId, data, i);
                        if(start == 2){
                            // 只添加直接子块
                            blockDef.addSubBlock(subBlockDef);
                        }
                        // 查找该子块定义
                        this.getBlockDef(subBlockDef, data, i);
                    }
                }
                else if(line.endsWith("}")){
                    start--;
                }
                if(start == 0){
                    // 找到块定义
                    blockDef.setEnd(i);
                    break;
                }
            }
        }
    }
    static parse(data){
        // 解析每一行
        let startBlocks = {};
        let endBlocks = {};
        if(data){
            // 分割每一行
            data = data.split("\n");
            // console.log("data:\n",data);
            for(let i = 0;i < data.length;i++){
                let _line = MaterialDef.trim(data[i]);
                if(!_line.startsWith("//")){
                    if(_line.endsWith("{")){
                        let block = _line.substring(0, _line.indexOf("{"));

                        // 块类型解析
                        let bsa = block.split(" ");
                        let blockType = bsa[0];
                        if(blockType != "void"){
                            let blockId = "";
                            if(bsa.length > 1){
                                blockId = bsa[bsa.length - 1];
                            }
                            // 开始一个块
                            let blockDef = new Block(blockType, blockId, data, i);
                            MaterialDef.getBlockDef(blockDef, data, i);
                            // 开始解析块定义
                            MaterialDef.parseBlockDef(blockDef);
                            // console.log("blockDef:",blockDef);
                            break;
                        }
                    }
                }
            }
        }
    }

}
