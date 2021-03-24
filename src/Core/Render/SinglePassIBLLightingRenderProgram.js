import DefaultRenderProgram from "./DefaultRenderProgram.js";
import RenderState from "../WebGL/RenderState.js";
import DirectionalLight from "../Light/DirectionalLight.js";
import TempVars from "../Util/TempVars.js";
import Matrix44 from "../Math3d/Matrix44.js";
import Log from "../Util/Log.js";
import ShaderSource from "../WebGL/ShaderSource.js";

/**
 * 在当个pass中批量处理多个灯光。<br/>
 * @author Kkk
 * @date 2021年3月21日19点20分
 */
export default class SinglePassIBLLightingRenderProgram extends DefaultRenderProgram{
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
        this._m_m_LastSubShader = null;
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
        // 探头信息
        let probeLoc = null;
        if(conVars[SinglePassIBLLightingRenderProgram.S_WGIPROBE_SRC]){
            if(this._m_m_LastSubShader != frameContext.m_LastSubShader){
                // 提取相交的探头
                // 并更新探头数据进行混合渲染(但这里未实现,先记录下)
                // Log.log('提交探头!');
                let giProbe = scene.getGIProbes()[0];
                let giData = TempVars.S_TEMP_VEC4;
                // 探头位置
                giData.setToInXYZW(giProbe.getPosition()._m_X, giProbe.getPosition()._m_Y, giProbe.getPosition()._m_Z, 1.0 / giProbe.getRadius() + giProbe.getPrefilterMipmap());
                gl.uniform4fv(conVars[SinglePassIBLLightingRenderProgram.S_WGIPROBE_SRC].loc, giData.getBufferData(), 0, 4);
                // 球谐系数
                giData = giProbe.getShCoeffsBufferData();
                gl.uniform3fv(conVars[SinglePassIBLLightingRenderProgram.S_SH_COEFFS_SRC].loc, giData.getBufferData(), 0, 9 * 3);
                // prefilterEnvMap
                giProbe.getPrefilterEnvMap()._upload(gl, conVars[SinglePassIBLLightingRenderProgram.S_PREF_ENV_MAP_SRC].loc);
                this._m_m_LastSubShader = frameContext.m_LastSubShader;
            }
            else{
                // 说明提交过探头数据
                // 这里,检测已经提交的探头数据,然后分析是否与之相交,否则关闭探头数据,避免错误的渲染和额外的渲染
            }
        }
        else{
            // 检测探头
            let giProbes = scene.getGIProbes();
            if(giProbes && giProbes.length > 0){
                // 找出与之相交的探头
                // 首次,更新材质定义
                frameContext.m_LastMaterial.addDefine(ShaderSource.S_GIPROBES_SRC);
            }
        }


        // 灯光信息
        let lightSpaceLoc = null;
        let lightSpace = null;
        if(conVars[SinglePassIBLLightingRenderProgram.S_V_LIGHT_DATA]){
            lightSpace = 1;
            lightSpaceLoc = conVars[SinglePassIBLLightingRenderProgram.S_V_LIGHT_DATA].loc;
        }
        else{
            lightSpace = 0;
            lightSpaceLoc = conVars[SinglePassIBLLightingRenderProgram.S_W_LIGHT_DATA].loc;
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
        gl.uniform1i(conVars[SinglePassIBLLightingRenderProgram.S_CUR_LIGHT_COUNT].loc, curLightCount * 3);
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
    drawArrays(gl, scene, frameContext, iDrawables, lights){
        // 如果灯光数量为0,则直接执行渲染
        if(lights.length == 0){
            iDrawables.forEach(iDrawable=>{
                iDrawable.draw(frameContext);
            });
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
            iDrawables.forEach(iDrawable=>{
                iDrawable.draw(frameContext);
            });
        }

    }

}
