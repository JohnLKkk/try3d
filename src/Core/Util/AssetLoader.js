import Log from "./Log.js";

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
     * 返回一个路径的目录。<br/>
     * @param {String}[src]
     * @return {String}
     */
    static getBasePath(src) {
        let n = src.lastIndexOf('/');
        return (n === -1) ? src : src.substring(0, n + 1);
    }

    /**
     * 加载一个文件。<br/>
     * 对于异步加载,将通过ok或err回调获得加载的结果;对于同步加载,直接返回结果,如果加载失败返回null。<br/>
     * @param {String}[url 文件请求路径]
     * @param {Function}[ok 异步加载成功回调接口]
     * @param {Function}[err 异步加载失败回调接口]
     * @param {String}[options.type 'GET'或'POST']
     * @param {Boolean}[options.sync true表示异步/false表示同步,默认为true]
     * @param {Boolean}[options.inflate true表示加载为二进制流/默认false]
     * @return {Object}[同步加载返回的结果]
     */
    static loadFile(url, ok, err, options) {
        options = options || {type:'GET', sync: true};
        options.type = options.type || 'GET';
        options.sync = options.sync != null ? options.sync : true;
        let request = new XMLHttpRequest();
        request.open(options.type, url, options.sync);

        // 二进制数据流
        let inflate = options && options.inflate;
        Log.debug("inflate:" + inflate);
        if(inflate){
            request.responseType = 'arraybuffer';
            Log.debug("二进制");
        }

        if(options.sync == false){
            request.send(null);
            if (request.status === 200) {
                return request.responseText;
            } else {
                return null;
            }
        }
        else{
            // 异步加载
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
