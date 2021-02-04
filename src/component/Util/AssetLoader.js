/**
 * 资源加载器,管理资源加载,提供流数据异步加载,诸如:纹理载入，模型加载，材质定义文件加载等。<br/>
 * @author Kkk
 */
export default class AssetLoader {
    constructor() {
    }
    static _get(src, ok, type, options){
        const request = new XMLHttpRequest();
        // request.open('GET', src, true);//默认请求方式
        request.open(type || 'POST', src, true);
        let inflate = options && options.inflate;
        if(inflate)
            request.responseType = 'arraybuffer';
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    ok(request.response);
                } else {
                    error('get error : ' + request.response);
                }
            }
        };
        request.send(null);
    }

    /**
     * 加载材质定义文件。<br/>
     * @param {String}[filePath]
     * @param {Function}[callback]
     */
    static loadMaterialSourceDef(filePath, callback){
        // 使用materialSourceDef加载器
        AssetLoader._get(filePath, callback);
    }

}
