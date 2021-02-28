/**
 * 资源加载器,管理资源加载,提供流数据异步加载,诸如:纹理载入，模型加载，材质定义文件加载等。<br/>
 * @author Kkk
 */
export default class AssetLoader {
    constructor() {
    }
    static _get(src, ok, type, options){
        options = options || {sync: true};
        const request = new XMLHttpRequest();
        // request.open('GET', src, true);//默认请求方式
        request.open(type || 'POST', src, options.sync);
        let inflate = options && options.inflate;
        if(inflate)
            request.responseType = 'arraybuffer';
        if(options.sync == false){
            request.send(null);
            if (request.status === 200) {
                return request.responseText;
            } else {
                return null;
            }
        }
        else{
            request.onreadystatechange = function () {
                if (request.readyState === 4) {
                    if (request.status === 200) {
                        ok(request.response);
                    } else {
                    }
                }
            };
            request.send(null);
        }

    }

    /**
     * 加载材质定义文件。<br/>
     * @param {String}[filePath]
     * @param {Function}[callback]
     */
    static loadMaterialSourceDef(filePath, callback){
        // 使用materialSourceDef加载器,同步加载器
        return AssetLoader._get(filePath, null, 'GET', {sync:false});
    }

    /**
     * 加载模型。<br/>
     * 支持的模型格式:OBJ,GLTF。<br/>
     * @param {String}[filePath]
     * @param {Function}[callback]
     */
    static loadModel(filePath, callback){
        // 判断文件类型
        // 以obj进行加载
    }

}
