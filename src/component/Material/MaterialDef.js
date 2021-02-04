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
    addSubBlock(subBlock){
        this.m_SubBlock.push(subBlock);
    }
    setStart(start){
        this.m_Start = start;
    }
    setEnd(end){
        this.m_End = end;
    }
    toString(){
        return "type:" + this.m_Type + "\n" + "" +
            "id:" + this.m_Id + "\n" +
            "data:\n" + this.m_Data + "\n";
    }

}

/**
 * 材质定义。
 */
export default class MaterialDef extends Component{
    getType(){
        return "MaterialDef";
    }
    constructor(owner, cfg) {
        super(owner, cfg);
        // 解析
    }
    read(src){
        AssetLoader.loadMaterialSourceDef(src, (data)=>{MaterialDef.parse(data)});
    }
    static trim(str){
        return str.replace(/(^\s*)|(\s*$)/g, "");
    }
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
            console.log("data:\n",data);
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
                            console.log("blockDef:",blockDef);
                            break;
                        }
                    }
                }
            }
        }
    }

}
