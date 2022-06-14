import DefaultRenderProgram from "./DefaultRenderProgram.js";
import RenderState from "../../WebGL/RenderState.js";
import DirectionalLight from "../../Light/DirectionalLight.js";
import TempVars from "../../Util/TempVars.js";
import Matrix44 from "../../Math3d/Matrix44.js";
import Log from "../../Util/Log.js";
import ShaderSource from "../../WebGL/ShaderSource.js";
import GIProbes from "../../Light/GIProbes.js";

/**
 * 在单个pass中批量处理多个灯光。<br/>
 * @author Kkk
 * @date 2021年3月21日19点20分
 * @update 2021年8月28日21点44分
 */
export default class SinglePassIBLLightingRenderProgram extends DefaultRenderProgram{
    static PROGRAM_TYPE = 'SinglePassIBLLighting';
    static S_CUR_LIGHT_COUNT = '_curLightCount';
    static S_AMBIENT_LIGHT_COLOR = '_ambientLightColor';
    static S_BLEND_GI_PROBES = '_blend_gi_probes';
    static S_V_LIGHT_DATA = '_vLightData';
    static S_W_LIGHT_DATA = '_wLightData';
    static S_PREF_ENV_MAP_SRC = '_prefEnvMap';
    static S_WGIPROBE_SRC = '_wGIProbe';
    static S_SH_COEFFS_SRC = "_ShCoeffs";
    static S_WGIPROBE_GROUP_SRC = '_wGIProbesGroup';
    constructor(props) {
        super(props);
        this._m_AccumulationLights = new RenderState();
        this._m_AccumulationLights.setFlag(RenderState.S_STATES[4], 'On');
        this._m_AccumulationLights.setFlag(RenderState.S_STATES[1], 'Off');
        // 不使用SRC_ALPHA，ONE的原因在于，如果第一个光源是point或spot，则会导致累计光源渲染一个DirLight时，对于材质半透明的物体会出现累加错误的情况，因为混合了alpha
        this._m_AccumulationLights.setFlag(RenderState.S_STATES[5], ['ONE', 'ONE']);
        // 记住这个参数必须在每次frame开始时重新设置,防止累计帧
        this._m_m_LastSubShader = null;
    }
    reset(){
        this._m_m_LastSubShader = null;
    }

    /**
     * 混合GI探头信息。<br/>
     * 暂时仅仅只是提交单个探头信息。<br/>
     * @param {WebGL}[gl]
     * @param {Scene}[scene]
     * @param {FrameContext}[frameContext]
     * @private
     */
    _blendGIProbes(gl, scene, frameContext){
        let conVars = frameContext.m_LastSubShader.getContextVars();
        // 探头信息
        let probeLoc = null;
        if(conVars[SinglePassIBLLightingRenderProgram.S_WGIPROBE_SRC] != null){
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
                if(conVars[SinglePassIBLLightingRenderProgram.S_SH_COEFFS_SRC] != null)
                    gl.uniform3fv(conVars[SinglePassIBLLightingRenderProgram.S_SH_COEFFS_SRC].loc, giData.getBufferData(), 0, 9 * 3);
                // prefilterEnvMap
                if(conVars[SinglePassIBLLightingRenderProgram.S_PREF_ENV_MAP_SRC] != null)
                    giProbe.getPrefilterEnvMap()._upload(gl, conVars[SinglePassIBLLightingRenderProgram.S_PREF_ENV_MAP_SRC].loc);
                this._m_m_LastSubShader = frameContext.m_LastSubShader;
            }
            else{
                // 说明提交过探头数据
                // 这里,检测已经提交的探头数据,然后分析是否与之相交,否则关闭探头数据,避免错误的渲染和额外的渲染
            }
        }
        else if(conVars[ShaderSource.S_PROBE_COUNTS] != null){
            if(this._m_m_LastSubShader != frameContext.m_LastSubShader){
                console.log('update...')
            }
        }
        else{
            // 检测探头
            let giProbes = scene.getGIProbes();
            if(giProbes && giProbes.length > 0){
                // 这里需要根据情况选择是GIProbes还是GIProbe
                // 然后激活对应的GIProbes/GIProbe数据
                // 但目前仅假设场景只有一个并且只有一种GIProbe/GIProbes
                if(giProbes[0] instanceof GIProbes){
                    // 光探针组
                    frameContext.m_LastMaterial.addDefine(ShaderSource.S_GI_PROBES_GROUP_SRC, true);
                }
                else{
                    // 找出与之相交的探头
                    // 首次,更新材质定义
                    frameContext.m_LastMaterial.addDefine(ShaderSource.S_GIPROBES_SRC, true);
                }
            }
        }
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
    _uploadLights(gl, scene, frameContext, lights, batchSize, lastIndex, blendGiProbes){
        let conVars = frameContext.m_LastSubShader.getContextVars();
        let enableGI = scene.enableGIProbes();
        if(conVars[SinglePassIBLLightingRenderProgram.S_BLEND_GI_PROBES] != undefined){
            gl.uniform1i(conVars[SinglePassIBLLightingRenderProgram.S_BLEND_GI_PROBES].loc, blendGiProbes && enableGI);
        }
        if(conVars[SinglePassIBLLightingRenderProgram.S_AMBIENT_LIGHT_COLOR] != null){
            if(lastIndex == 0){
                // 提交合计的ambientColor(场景可能添加多个ambientLight)
                // 也可以设计为场景只能存在一个ambientColor
                let ambientLightColor = scene.AmbientLightColor;
                gl.uniform3f(conVars[SinglePassIBLLightingRenderProgram.S_AMBIENT_LIGHT_COLOR].loc, ambientLightColor._m_X, ambientLightColor._m_Y, ambientLightColor._m_Z);
                this.uniqueShading(gl, conVars, true);
            }
            else{
                // 开启累积缓存模式
                // 我们使用result = s * 1.0 + d * 1.0
                // 所以,渲染当前pass,s部分在当前混合下应该使用一个全黑的ambientLightColor(因为第一个pass已经计算了ambientLightColor)
                gl.uniform3f(conVars[SinglePassIBLLightingRenderProgram.S_AMBIENT_LIGHT_COLOR].loc, 0.0, 0.0, 0.0);
                scene.getRender()._checkRenderState(gl, this._m_AccumulationLights, frameContext.getRenderState());
                this.uniqueShading(gl, conVars, false);
            }
        }
        // 探头信息
        if(enableGI)
            this._blendGIProbes(gl, scene, frameContext);


        // 灯光信息
        let lightSpaceLoc = null;
        let lightSpace = null;
        if(conVars[SinglePassIBLLightingRenderProgram.S_V_LIGHT_DATA] != null){
            lightSpace = 1;
            lightSpaceLoc = conVars[SinglePassIBLLightingRenderProgram.S_V_LIGHT_DATA].loc;
        }
        else if(conVars[SinglePassIBLLightingRenderProgram.S_W_LIGHT_DATA] != null){
            lightSpace = 0;
            lightSpaceLoc = conVars[SinglePassIBLLightingRenderProgram.S_W_LIGHT_DATA].loc;
        }
        // 计算实际需要上载的灯光
        let curLightCount = (batchSize + lastIndex) > lights.length ? (lights.length - lastIndex) : batchSize;
        if(lightSpaceLoc == null){
            return curLightCount + lastIndex;
        }
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
        if(conVars[SinglePassIBLLightingRenderProgram.S_CUR_LIGHT_COUNT] != null)
            gl.uniform1i(conVars[SinglePassIBLLightingRenderProgram.S_CUR_LIGHT_COUNT].loc, curLightCount * 3);
        return curLightCount + lastIndex;
    }
    draw(gl, scene, frameContext, iDrawable, lights) {

        // 如果灯光数量为0,则直接执行渲染
        if(lights.length == 0){
            let conVars = frameContext.m_LastSubShader.getContextVars();
            this.uniqueShading(gl, conVars, true);
            let enableGI = scene.enableGIProbes();
            if(enableGI)
                this._blendGIProbes(gl, scene, frameContext);
            if(conVars[SinglePassIBLLightingRenderProgram.S_BLEND_GI_PROBES] != undefined){
                gl.uniform1i(conVars[SinglePassIBLLightingRenderProgram.S_BLEND_GI_PROBES].loc, enableGI);
            }
            if(conVars[SinglePassIBLLightingRenderProgram.S_CUR_LIGHT_COUNT] != null)
                gl.uniform1i(conVars[SinglePassIBLLightingRenderProgram.S_CUR_LIGHT_COUNT].loc, 0);
            if(conVars[SinglePassIBLLightingRenderProgram.S_AMBIENT_LIGHT_COLOR] != null){
                let ambientLightColor = scene.AmbientLightColor;
                gl.uniform3f(conVars[SinglePassIBLLightingRenderProgram.S_AMBIENT_LIGHT_COLOR].loc, ambientLightColor._m_X, ambientLightColor._m_Y, ambientLightColor._m_Z);
            }
            iDrawable.draw(frameContext);
            return;
        }
        // 计算灯光是否处于iDrawable可见范围

        // 批量提交灯光
        // 应该根据引擎获取每次提交的灯光批次数量
        // 但是每个批次不应该超过4
        let batchSize = scene.getRender().getBatchLightSize();
        let lastIndex = 0;
        frameContext.getRenderState().store();
        while(lastIndex < lights.length){
            // 更新灯光信息
            lastIndex = this._uploadLights(gl, scene, frameContext, lights, batchSize, lastIndex, lastIndex == 0);
            // 最后draw
            iDrawable.draw(frameContext);
        }
        scene.getRender()._checkRenderState(gl, frameContext.getRenderState().restore(), frameContext.getRenderState());
        frameContext.BatchLightLastIndex = lastIndex;
    }
    drawArrays(gl, scene, frameContext, iDrawables, lights){
        // 如果灯光数量为0,则直接执行渲染
        if(lights.length == 0){
            let conVars = frameContext.m_LastSubShader.getContextVars();
            this.uniqueShading(gl, conVars, true);
            let enableGI = scene.enableGIProbes();
            if(enableGI)
                this._blendGIProbes(gl, scene, frameContext);
            if(conVars[SinglePassIBLLightingRenderProgram.S_BLEND_GI_PROBES] != undefined){
                gl.uniform1i(conVars[SinglePassIBLLightingRenderProgram.S_BLEND_GI_PROBES].loc, enableGI);
            }
            if(conVars[SinglePassIBLLightingRenderProgram.S_CUR_LIGHT_COUNT] != null)
                gl.uniform1i(conVars[SinglePassIBLLightingRenderProgram.S_CUR_LIGHT_COUNT].loc, 0);
            if(conVars[SinglePassIBLLightingRenderProgram.S_AMBIENT_LIGHT_COLOR] != null){
                let ambientLightColor = scene.AmbientLightColor;
                gl.uniform3f(conVars[SinglePassIBLLightingRenderProgram.S_AMBIENT_LIGHT_COLOR].loc, ambientLightColor._m_X, ambientLightColor._m_Y, ambientLightColor._m_Z);
            }
            iDrawables.forEach(iDrawable=>{
                iDrawable.draw(frameContext);
            });
            return;
        }
        // 计算灯光是否处于iDrawable可见范围

        // 批量提交灯光
        // 应该根据引擎获取每次提交的灯光批次数量
        // 但是每个批次不应该超过4
        let batchSize = scene.getRender().getBatchLightSize();
        let lastIndex = 0;
        frameContext.getRenderState().store();
        while(lastIndex < lights.length){
            // 更新灯光信息
            lastIndex = this._uploadLights(gl, scene, frameContext, lights, batchSize, lastIndex, lastIndex == 0);
            // 最后draw
            iDrawables.forEach(iDrawable=>{
                iDrawable.draw(frameContext);
            });
        }
        scene.getRender()._checkRenderState(gl, frameContext.getRenderState().restore(), frameContext.getRenderState());
        frameContext.BatchLightLastIndex = lastIndex;

    }

}
