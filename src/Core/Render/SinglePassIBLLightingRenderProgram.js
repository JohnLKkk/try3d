import DefaultRenderProgram from "./DefaultRenderProgram.js";
import RenderState from "../WebGL/RenderState.js";
import DirectionalLight from "../Light/DirectionalLight.js";
import TempVars from "../Util/TempVars.js";
import Matrix44 from "../Math3d/Matrix44.js";

/**
 * 在当个pass中批量处理多个灯光。<br/>
 * @author Kkk
 * @date 2021年2月17日16点09分
 */
export default class SinglePassLightingRenderProgram extends DefaultRenderProgram{
    static PROGRAM_TYPE = 'SinglePassIBLLighting';
    static S_CUR_LIGHT_COUNT = '_curLightCount';
    static S_V_LIGHT_DATA = '_vLightData';
    static S_W_LIGHT_DATA = '_wLightData';
    static S_PREF_ENV_MAP_SRC = '_prefEnvMap';
    static S_WGIPROBE_SRC = '_wGIProbe';
    static S_SH_COEFFS_SRC = "_ShCoeffs";
    constructor(props) {
        super(props);
        this._m_AccumulationLights = new RenderState();
    }

    /**
     *
     * @param gl
     * @param scene
     * @param {FrameContext}[frameContext]
     * @param lights
     * @param batchSize
     * @param lastIndex
     * @private
     */
    _uploadLights(gl, scene, frameContext, lights, batchSize, lastIndex){
        if(lastIndex == 0){
            // 提交合计的ambientColor(场景可能添加多个ambientLight)
            // 也可以设计为场景只能存在一个ambientColor
        }
        else{
            // 开启累积缓存模式
        }
        let conVars = frameContext.m_LastSubShader.getContextVars();
        let lightSpaceLoc = null;
        let lightSpace = null;
        if(conVars[SinglePassLightingRenderProgram.S_V_LIGHT_DATA]){
            lightSpace = 1;
            lightSpaceLoc = conVars[SinglePassLightingRenderProgram.S_V_LIGHT_DATA].loc;
        }
        else{
            lightSpace = 0;
            lightSpaceLoc = conVars[SinglePassLightingRenderProgram.S_W_LIGHT_DATA].loc;
        }
        // 计算实际需要上载的灯光
        let curLightCount = (batchSize + lastIndex) > lights.length ? (lights.length - lastIndex) : batchSize;
        let light = null;
        let lightColor = null;
        // 灯光数据
        let lightData = TempVars.S_LIGHT_DATA_4;
        let array = lightData.getArray();
        let tempVec4 = TempVars.S_TEMP_VEC4;
        let tempVec42 = TempVars.S_TEMP_VEC4_2;
        // 上载灯光信息
        // 数据编码格式内容
        // 第一个元素保存光照颜色,w分量保存光照类型(0DirectionalLight,1PointLight,2SpotLight)
        for(let i = lastIndex,offset = 0,end = curLightCount + lastIndex;i < end;i++,offset+=12){
            light = lights[i];
            lightColor = light.getColor();
            array[offset] = lightColor._m_X;
            array[offset + 1] = lightColor._m_Y;
            array[offset + 2] = lightColor._m_Z;
            array[offset + 3] = light.getTypeId();
            switch (light.getType()) {
                case 'DirectionalLight':
                    // 提交灯光方向
                    if(lightSpace){
                        // 在视图空间计算光源,避免在片段着色阶段计算viewDir
                        tempVec42.setToInXYZW(light.getDirection()._m_X, light.getDirection()._m_Y, light.getDirection()._m_Z, 0);
                        Matrix44.multiplyMV(tempVec4, tempVec42, scene.getMainCamera().getViewMatrix());
                        array[offset + 4] = tempVec4._m_X;
                        array[offset + 5] = tempVec4._m_Y;
                        array[offset + 6] = tempVec4._m_Z;
                        array[offset + 7] = -1;
                    }
                    else{
                        // 在世界空间计算光源
                        array[offset + 4] = light.getDirection()._m_X;
                        array[offset + 5] = light.getDirection()._m_Y;
                        array[offset + 6] = light.getDirection()._m_Z;
                        array[offset + 7] = -1;
                    }
                    // 第三个数据占位(不要假设默认为0,因为重复使用这个缓存,所以最好主动填充0)
                    array[offset + 8] = 0;
                    array[offset + 9] = 0;
                    array[offset + 10] = 0;
                    array[offset + 11] = 0;
                    break;
                case 'PointLight':
                    if(lightSpace){
                        // view空间
                    }
                    else{
                        // 世界空间
                        array[offset + 4] = light.getPosition()._m_X;
                        array[offset + 5] = light.getPosition()._m_Y;
                        array[offset + 6] = light.getPosition()._m_Z;
                        array[offset + 7] = light.getInRadius();
                    }
                    // 第三个数据占位(不要假设默认为0,因为重复使用这个缓存,所以最好主动填充0)
                    array[offset + 8] = 0;
                    array[offset + 9] = 0;
                    array[offset + 10] = 0;
                    array[offset + 11] = 0;
                    break;
                case 'SpotLight':
                    if(lightSpace){

                    }
                    else{
                        // 世界空间
                        array[offset + 4] = light.getPosition()._m_X;
                        array[offset + 5] = light.getPosition()._m_Y;
                        array[offset + 6] = light.getPosition()._m_Z;
                        array[offset + 7] = light.getInvSpotRange();
                    }
                    // 提交spotDir其他信息
                    array[offset + 8] = light.getDirection()._m_X;
                    array[offset + 9] = light.getDirection()._m_Y;
                    array[offset + 10] = light.getDirection()._m_Z;
                    array[offset + 11] = light.getPackedAngleCos();
                    break;
            }
        }
        // 上载数据
        // gl[conVars[SinglePassLightingRenderProgram.S_LIGHT_DATA].fun]
        gl.uniform4fv(lightSpaceLoc, lightData.getBufferData(), 0, curLightCount * 12);
        gl.uniform1i(conVars[SinglePassLightingRenderProgram.S_CUR_LIGHT_COUNT].loc, curLightCount * 3);
    }
    draw(gl, scene, frameContext, iDrawable, lights) {

        // 如果灯光数量为0,则直接执行渲染
        if(lights.length == 0){
            iDrawable.draw(frameContext);
            return;
        }
        // 计算灯光是否处于iDrawable可见范围

        // 批量提交灯光
        // 应该根据引擎获取每次提交的灯光批次数量
        // 但是每个批次不应该超过4
        let batchSize = 4;
        let lastIndex = 0;
        while(lastIndex < lights.length){
            // 更新灯光信息
            lastIndex = this._uploadLights(gl, scene, frameContext, lights, batchSize, lastIndex);
            // 最后draw
            iDrawable.draw(frameContext);
        }
    }

}
