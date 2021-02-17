import DefaultRenderProgram from "./DefaultRenderProgram.js";
import RenderState from "../WebGL/RenderState.js";
import DirectionalLight from "../Light/DirectionalLight";

/**
 * 在当个pass中批量处理多个灯光。<br/>
 * @author Kkk
 * @date 2021年2月17日16点09分
 */
export default class SinglePassLightingRenderProgram extends DefaultRenderProgram{
    static PROGRAM_TYPE = 'SinglePassLighting';
    constructor(props) {
        super(props);
        this._m_AccumulationLights = new RenderState();
    }
    _uploadLights(gl, lights, batchSize, lastIndex){
        if(lastIndex == 0){
            // 提交合计的ambientColor(场景可能添加多个ambientLight)
            // 也可以设计为场景只能存在一个ambientColor
        }
        else{
            // 开启累积缓存模式
        }
        // 计算实际需要上载的灯光
        let curLightCount = 0;
        let light = null;
        let lightColor = null;
        // 上载灯光信息
        for(let i = lastIndex;lastIndex < curLightCount + lastIndex;i++){
            light = lights[i];
            if(light.getType == 'Ambient'){
                continue;
            }
            lightColor = light.getColor();
            switch (light.getType()) {
                case 'DirectionalLight':
                    break;
                case 'PointLight':
                    break;
                case 'SpotLight':
                    break;
            }
        }
        // 上载数据
    }
    draw(gl, frameContext, iDrawable, lights) {

        // 如果灯光数量为0,则直接执行渲染
        if(lights.length == 0){
            iDrawable.draw(frameContext);
            return;
        }
        // 计算灯光是否处于iDrawable可见范围

        // 批量提交灯光
        // 应该根据引擎获取每次提交的灯光批次数量
        // 但是每个批次不应该超过8
        let batchSize = 8;
        // 最后draw
        super.draw(gl, frameContext, iDrawable, lights);
    }

}
