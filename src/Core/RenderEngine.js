/**
 * 渲染引擎框架,提供启动和关闭引擎的操作。<br/>
 * 其中,包含一个主循环,以便为加入的场景实现渲染。<br/>
 * @author Kkk
 * @date 2020年9月15日15点43分
 */
export default class RenderEngine {
    constructor() {
        this._m_Scenes = [];
        this._m_SceneIds = {};
        this._m_Stop = false;
    }

    /**
     * 添加一个场景
     * @param scene
     */
    addScene(scene){
        if(!this._m_SceneIds[scene.id]){
            this._m_SceneIds[scene.id] = scene;
            this._m_Scenes.push(scene);
        }
    }

    /**
     * 移除一个场景
     * @param scene
     */
    removeScene(scene){
        if(this._m_SceneIds[scene.id]){
            this._m_SceneIds[scene.id] = null;
            this._m_Scenes.remove(scene);
        }
    }

    /**
     * 启动引擎
     */
    launch(){
        this._m_Stop = false;
        let _self = this;
        let startTime = Date.now();
        let _t = 1.0 / 1000.0;
        let _loop = ()=>{
            let time = Date.now();
            let exTime = (time - startTime) * _t;
            startTime = time;
            // 执行所有下一帧之前的任务
            // 比如组件的更新
            // 之所以这样设计,是为了避免在scene.update中遍历场景图进行更新组件
            this._m_Scenes.forEach(scene=>{
                scene.update(exTime);
                scene.render(exTime);
            });
            if(!_self._m_Stop)
                requestAnimationFrame(_loop);
        };
        requestAnimationFrame(_loop);
    }

    close(){
        this._m_Stop = true;
    }

}
