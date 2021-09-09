import DefaultRenderProgram from "./DefaultRenderProgram.js";
import Matrix44 from "../../Math3d/Matrix44.js";
import RenderState from "../../WebGL/RenderState.js";
import TempVars from "../../Util/TempVars.js";
import Vector3 from "../../Math3d/Vector3.js";
import Vector4 from "../../Math3d/Vector4.js";

/**
 * TilePassLightingRenderProgram。<br/>
 * @author Kkk
 * @date 2021年9月8日16点43分
 */
export default class TilePassLightingRenderProgram extends DefaultRenderProgram{
    static PROGRAM_TYPE = 'TilePassLighting';
    // Global
    static S_CUR_LIGHT_COUNT = '_curLightCount';
    static S_AMBIENT_LIGHT_COLOR = '_ambientLightColor';
    static S_V_LIGHT_DATA = '_vLightData';
    static S_W_LIGHT_DATA = '_wLightData';
    // Tile
    static S_LIGHT_NUM_SRC = "_lightNum";
    // Tile中ppx编码的光源检索
    static S_TILE_LIGHT_DECODE_SRC = "_tileLightDecode";
    // Tile中ppx编码的光源id
    static S_TILE_LIGHT_INDEX_SRC = "_tileLightIndex";
    // Tile中采样偏移大小
    static S_TILE_LIGHT_OFFSET_SIZE = "_tileLightOffsetSize";
    // Tile中光源编码信息0
    static S_TILE_W_LIGHT_DATA_0 = "_tileWLightData0";
    static S_TILE_V_LIGHT_DATA_0 = "_tileVLightData0";
    // Tile中光源编码信息1
    static S_TILE_W_LIGHT_DATA_1 = "_tileWLightData1";
    static S_TILE_V_LIGHT_DATA_1 = "_tileVLightData1";
    // Tile中光源编码信息2
    static S_TILE_W_LIGHT_DATA_2 = "_tileWLightData2";
    static S_TILE_V_LIGHT_DATA_2 = "_tileVLightData2";



    // 分块信息
    _m_Tiles = [];
    // 光源索引
    _m_LightsIndex = [];
    // 光源编码数据
    _m_LightsDecode = [];
    // 光源编码数据纹理(rgb)
    _m_LightsDecodeData = null;
    // 光源索引数据纹理(后续改为rgba,rgb存储光源spotLight第三部分信息)
    _m_LightsIndexData = null;
    _m_LightsData0 = null;
    _m_LightsData1 = null;
    _m_LightsData2 = null;
    _m_LightsData0Array = [];
    _m_LightsData1Array = [];
    _m_LightsData2Array = [];

    // 临时变量
    _m_PV = null;
    _m_Temp_Vec3 = new Vector3();
    _m_Temp_Vec4 = new Vector4();
    _m_Temp_Vec4_2 = new Vector4();
    _m_Temp_Vec4_3 = new Vector4();
    _m_Cam_Up = new Vector4();
    _m_Cam_Left = new Vector4();
    _m_Light_Left = new Vector4();
    _m_Light_Up = new Vector4();
    _m_Light_Center = new Vector4();
    _m_ViewPortWidth = -1;
    _m_ViewPortHeight = -1;
    _m_CamLeftCoeff = -1;
    _m_CamTopCoeff = -1;
    constructor(props) {
        super(props);
        this._m_AccumulationLights = new RenderState();
        this._m_AccumulationLights.setFlag(RenderState.S_STATES[4], 'On');
        this._m_AccumulationLights.setFlag(RenderState.S_STATES[1], 'Off');
        // 不使用SRC_ALPHA，ONE的原因在于，如果第一个光源是point或spot，则会导致累计光源渲染一个DirLight时，对于材质半透明的物体会出现累加错误的情况，因为混合了alpha
        this._m_AccumulationLights.setFlag(RenderState.S_STATES[5], ['ONE', 'ONE']);
    }
    _createTexture(gl){
        let tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        return tex;
    }

    _reset(gl, tileNum){
        if(!this._m_LightsIndexData){
            this._m_LightsIndexData = this._createTexture(gl);
        }
        if(!this._m_LightsDecodeData){
            this._m_LightsDecodeData = this._createTexture(gl);
        }
        if(!this._m_LightsData0){
            this._m_LightsData0 = this._createTexture(gl);
        }
        this._m_LightsData0Array.length = 0;
        if(!this._m_LightsData1){
            this._m_LightsData1 = this._createTexture(gl);
        }
        this._m_LightsData1Array.length = 0;
        if(!this._m_LightsData2){
            this._m_LightsData2 = this._createTexture(gl);
        }
        this._m_LightsData2Array.length = 0;
        // 每个tile保存对应的光源信息
        for(let i = 0;i < tileNum;i++){
            this._m_Tiles[i] = [];
        }
        this._m_LightsDecode.length = 0;
        this._m_LightsIndex.length = 0;
    }
    /**
     * 光锥裁剪。<br/>
     * @param {GLContext}[gl]
     * @param {Light}[light 只能是PointLight或SpotLight]
     * @return {Object}[返回光锥范围]
     */
    _lightClip(gl, light){
        let bounding = light.getBoundingVolume();
        let r = bounding.getRadius();
        let lr = r * this._m_CamLeftCoeff;
        let tr = r * this._m_CamTopCoeff;
        let center = bounding.getCenter(this._m_Temp_Vec3);
        center = this._m_Temp_Vec4.setToInXYZW(center._m_X, center._m_Y, center._m_Z, 1.0);
        this._m_Temp_Vec4._m_W = 1.0;
        this._m_Temp_Vec4_2._m_W = 1.0;
        this._m_Temp_Vec4_3._m_W = 1.0;

        let lightFrustumLeft = this._m_Cam_Left.multLength(lr, this._m_Temp_Vec4_2).add(center);
        let lightFrustumUp = this._m_Cam_Up.multLength(tr, this._m_Temp_Vec4_3).add(center);
        Matrix44.multiplyMV(this._m_Light_Left, lightFrustumLeft, this._m_PV);
        Matrix44.multiplyMV(this._m_Light_Up, lightFrustumUp, this._m_PV);
        Matrix44.multiplyMV(this._m_Light_Center, center, this._m_PV);
        this._m_Light_Left._m_X /= this._m_Light_Left._m_W;
        this._m_Light_Left._m_Y /= this._m_Light_Left._m_W;
        this._m_Light_Up._m_X /= this._m_Light_Up._m_W;
        this._m_Light_Up._m_Y /= this._m_Light_Up._m_W;
        this._m_Light_Center._m_X /= this._m_Light_Center._m_W;
        this._m_Light_Center._m_Y /= this._m_Light_Center._m_W;
        this._m_Light_Left._m_X = this._m_ViewPortWidth * (1.0 + this._m_Light_Left._m_X);
        this._m_Light_Up._m_X = this._m_ViewPortWidth * (1.0 + this._m_Light_Up._m_X);
        this._m_Light_Center._m_X = this._m_ViewPortWidth * (1.0 + this._m_Light_Center._m_X);
        this._m_Light_Left._m_Y = this._m_ViewPortHeight * (1.0 - this._m_Light_Left._m_Y);
        this._m_Light_Up._m_Y = this._m_ViewPortHeight * (1.0 - this._m_Light_Up._m_Y);
        this._m_Light_Center._m_Y = this._m_ViewPortHeight * (1.0 - this._m_Light_Center._m_Y);
        // 计算光锥裁剪区
        // 视口映射后原点在左上角
        let lw = Math.abs(this._m_Light_Left._m_X - this._m_Light_Center._m_X);
        let lh = Math.abs(this._m_Light_Center._m_Y - this._m_Light_Up._m_Y);
        let left = -1, btm = -1;
        if(this._m_Light_Center._m_Z < -this._m_Light_Center._m_W){
            left = -this._m_Light_Center._m_X - lw;
            btm = -this._m_Light_Center._m_Y + lh;
        }
        else{
            left = this._m_Light_Center._m_X - lw;
            btm = this._m_Light_Center._m_Y + lh;
        }
        let bottom = this._m_ViewPortHeight * 2.0 - btm;
        // 这里可以简化计算的,不过呢,这并不影响多少性能
        return {
            left,
            right:lw * 2 + left,
            top:lh * 2 + bottom,
            bottom
        }
    }

    /**
     * 分块索引。<br/>
     * @param {Number}[tileSize]
     * @param {Number}[tileWidth]
     * @param {Number}[tileHeight]
     * @param {Number}[tileNum]
     * @param {Array[][]}[tiles]
     * @param {Object}[lightFrustum]
     * @param {Number}[lightId]
     * @private
     */
    _tile(tileSize, tileWidth, tileHeight, tileNum, tiles, lightFrustum, lightId){
        // tile建立于
        //⬆
        //|
        //|
        //----------➡
        // 所以按照pixel屏幕精度,使用右上步进
        let tileLeft = Math.max(Math.floor(lightFrustum.left / tileSize), 0);
        let tileRight = Math.min(Math.ceil(lightFrustum.right / tileSize), tileWidth);
        let tileBottom = Math.max(Math.floor(lightFrustum.bottom / tileSize), 0);
        let tileTop = Math.min(Math.ceil(lightFrustum.top / tileSize), tileHeight);

        // 分块
        let tileId = 0;
        for (let l = tileLeft;l < tileRight;l++){
            for (let b = tileBottom;b < tileTop;b++){
                tileId = l + b * tileWidth;
                if(tileId >= 0 && tileId < tileNum){
                    tiles[tileId].push(lightId);
                }
            }
        }
    }
    _tileLightDecode(gl, frameContext, tileNum, tiles, tileWidth, tileHeight, lights){
        let conVars = frameContext.m_LastSubShader.getContextVars();
        let len = -1;
        len = lights.length;
        let lightSpace = null;
        if(conVars[TilePassLightingRenderProgram.S_LIGHT_NUM_SRC] != undefined){
            gl.uniform1i(conVars[TilePassLightingRenderProgram.S_LIGHT_NUM_SRC].loc, len);
        }
        if(conVars[TilePassLightingRenderProgram.S_TILE_V_LIGHT_DATA_0] != undefined){
            lightSpace = 1;
        }
        else if(conVars[TilePassLightingRenderProgram.S_TILE_W_LIGHT_DATA_0] != undefined){
            lightSpace = 0;
        }
        else{
            // 返回0表示不需要渲染
            return 0;
        }
        for(let i = 0, offset = 0, tile = null;i < tileNum;i++){
            tile = tiles[i];
            len = tile.length;
            for(let l = 0;l < len;l++){
                this._m_LightsIndex.push(tile[l]);
            }
            // u偏移
            this._m_LightsDecode.push(offset);
            // tile对应的光源数目
            this._m_LightsDecode.push(len);
            // 下个环节补充
            this._m_LightsDecode.push(-1);
            offset += len;
        }
        // 计算光源采样尺寸
        let lightIndexWidth = Math.ceil(Math.sqrt(this._m_LightsIndex.length));
        if(conVars[TilePassLightingRenderProgram.S_TILE_LIGHT_OFFSET_SIZE] != undefined){
            gl.uniform1f(conVars[TilePassLightingRenderProgram.S_TILE_LIGHT_OFFSET_SIZE].loc, lightIndexWidth);
        }
        // 填充占位
        for(let i = 0,len = lightIndexWidth * lightIndexWidth;i < len;i++){
            this._m_LightsIndex.push(-1);
        }

        // uv一维化
        for(let i = 0,len = this._m_LightsDecode.length;i < len;i+=3){
            // g分量存储v偏移
            this._m_LightsDecode[i + 2] = this._m_LightsDecode[i] / lightIndexWidth;
            // r分量存储u偏移
            this._m_LightsDecode[i] %= lightIndexWidth;
        }

        // 编码光源信息
        // lightIndexData
        let lightIndexDataVec3 = [];
        for(let i = 0,len = this._m_LightsIndex.length;i < len;i++){
            lightIndexDataVec3[i * 3] = this._m_LightsIndex[i];
            lightIndexDataVec3[i * 3 + 1] = 0;
            lightIndexDataVec3[i * 3 + 2] = 0;
        }
        this._m_LightsIndex = lightIndexDataVec3;
        if(conVars[TilePassLightingRenderProgram.S_TILE_LIGHT_DECODE_SRC] != undefined){
            this._uploadDecodeTexture(gl, this._m_LightsDecodeData, conVars[TilePassLightingRenderProgram.S_TILE_LIGHT_DECODE_SRC].loc, gl.RGB32F, tileWidth, tileHeight, gl.RGB, gl.FLOAT, new Float32Array(this._m_LightsDecode));
        }
        if(conVars[TilePassLightingRenderProgram.S_TILE_LIGHT_INDEX_SRC] != undefined){
            this._uploadDecodeTexture(gl, this._m_LightsIndexData, conVars[TilePassLightingRenderProgram.S_TILE_LIGHT_INDEX_SRC].loc, gl.RGB32F, lightIndexWidth, lightIndexWidth, gl.RGB, gl.FLOAT, new Float32Array(this._m_LightsIndex));
        }
        // lightsData0,1,2
        let light = null;
        let lightColor = null;

        len = lights.length;
        for(let i = 0;i < len;i++){
            light = lights[i];
            lightColor = light.getColor();
            this._m_LightsData0Array.push(lightColor._m_X);
            this._m_LightsData0Array.push(lightColor._m_Y);
            this._m_LightsData0Array.push(lightColor._m_Z);
            this._m_LightsData0Array.push(light.getTypeId());
            switch (light.getType()) {
                case 'PointLight':
                    if(lightSpace){

                    }
                    else{
                        this._m_LightsData1Array.push(light.getPosition()._m_X);
                        this._m_LightsData1Array.push(light.getPosition()._m_Y);
                        this._m_LightsData1Array.push(light.getPosition()._m_Z);
                        this._m_LightsData1Array.push(light.getInRadius());
                    }
                    this._m_LightsData2Array.push(0.0);
                    this._m_LightsData2Array.push(0.0);
                    this._m_LightsData2Array.push(0.0);
                    this._m_LightsData2Array.push(0.0);
                    break;
                case 'SpotLight':
                    if(lightSpace){

                    }
                    else{
                        this._m_LightsData1Array.push(light.getPosition()._m_X);
                        this._m_LightsData1Array.push(light.getPosition()._m_Y);
                        this._m_LightsData1Array.push(light.getPosition()._m_Z);
                        this._m_LightsData1Array.push(light.getInvSpotRange());
                    }
                    this._m_LightsData2Array.push(light.getDirection()._m_X);
                    this._m_LightsData2Array.push(light.getDirection()._m_Y);
                    this._m_LightsData2Array.push(light.getDirection()._m_Z);
                    this._m_LightsData2Array.push(light.getPackedAngleCos());
                    break;
            }
        }
        let data = conVars[TilePassLightingRenderProgram.S_TILE_W_LIGHT_DATA_0] ? conVars[TilePassLightingRenderProgram.S_TILE_W_LIGHT_DATA_0] : conVars[TilePassLightingRenderProgram.S_TILE_V_LIGHT_DATA_0];
        if(data){
            // 上载lightData0
            this._uploadDecodeTexture(gl, this._m_LightsData0, data.loc, gl.RGBA32F, this._m_LightsData0Array.length / 4, 1, gl.RGBA, gl.FLOAT, new Float32Array(this._m_LightsData0Array));
        }
        data = conVars[TilePassLightingRenderProgram.S_TILE_W_LIGHT_DATA_1] ? conVars[TilePassLightingRenderProgram.S_TILE_W_LIGHT_DATA_1] : conVars[TilePassLightingRenderProgram.S_TILE_V_LIGHT_DATA_1];
        if(data){
            // 上载lightData1
            this._uploadDecodeTexture(gl, this._m_LightsData1, data.loc, gl.RGBA32F, this._m_LightsData1Array.length / 4, 1, gl.RGBA, gl.FLOAT, new Float32Array(this._m_LightsData1Array));
        }
        data = conVars[TilePassLightingRenderProgram.S_TILE_W_LIGHT_DATA_2] ? conVars[TilePassLightingRenderProgram.S_TILE_W_LIGHT_DATA_2] : conVars[TilePassLightingRenderProgram.S_TILE_V_LIGHT_DATA_2];
        if(data){
            // 上载lightData2
            this._uploadDecodeTexture(gl, this._m_LightsData2, data.loc, gl.RGBA32F, this._m_LightsData2Array.length / 4, 1, gl.RGBA, gl.FLOAT, new Float32Array(this._m_LightsData2Array));
        }
        // 返回1表示渲染
        return 1;
    }
    _uploadDecodeTexture(gl, tex, loc, internalformat, w, h, format, type, data){
        gl.activeTexture(gl.TEXTURE0 + loc);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            internalformat,
            w,
            h,
            0,
            format,
            type,
            data
        );
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
        let conVars = frameContext.m_LastSubShader.getContextVars();
        if(conVars[TilePassLightingRenderProgram.S_AMBIENT_LIGHT_COLOR] != null){
            if(lastIndex == 0){
                // 提交合计的ambientColor(场景可能添加多个ambientLight)
                // 也可以设计为场景只能存在一个ambientColor
                let ambientLightColor = scene.AmbientLightColor;
                gl.uniform3f(conVars[TilePassLightingRenderProgram.S_AMBIENT_LIGHT_COLOR].loc, ambientLightColor._m_X, ambientLightColor._m_Y, ambientLightColor._m_Z);
            }
            else{
                // 开启累积缓存模式
                // 我们使用result = s * 1.0 + d * 1.0
                // 所以,渲染当前pass,s部分在当前混合下应该使用一个全黑的ambientLightColor(因为第一个pass已经计算了ambientLightColor)
                gl.uniform3f(conVars[TilePassLightingRenderProgram.S_AMBIENT_LIGHT_COLOR].loc, 0.0, 0.0, 0.0);
                scene.getRender()._checkRenderState(gl, this._m_AccumulationLights, frameContext.getRenderState());
            }
        }
        let lightSpaceLoc = null;
        let lightSpace = null;
        if(conVars[TilePassLightingRenderProgram.S_V_LIGHT_DATA] != null){
            lightSpace = 1;
            lightSpaceLoc = conVars[TilePassLightingRenderProgram.S_V_LIGHT_DATA].loc;
        }
        else if(conVars[TilePassLightingRenderProgram.S_W_LIGHT_DATA] != null){
            lightSpace = 0;
            lightSpaceLoc = conVars[TilePassLightingRenderProgram.S_W_LIGHT_DATA].loc;
        }
        // 计算实际需要上载的灯光
        let curLightCount = (batchSize + lastIndex) > lights.length ? (lights.length - lastIndex) : batchSize;
        if(lightSpaceLoc == null){
            return curLightCount + lastIndex;
        }
        let light = null;
        let lightColor = null;
        // 灯光数据
        let lightData = TempVars.S_LIGHT_DATA;
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
            }
        }
        // 上载数据
        // gl[conVars[TilePassLightingRenderProgram.S_LIGHT_DATA].fun]
        gl.uniform4fv(lightSpaceLoc, lightData.getBufferData(), 0, curLightCount * 12);
        if(conVars[TilePassLightingRenderProgram.S_CUR_LIGHT_COUNT] != null)
            gl.uniform1i(conVars[TilePassLightingRenderProgram.S_CUR_LIGHT_COUNT].loc, curLightCount * 3);
        return curLightCount + lastIndex;
    }
    draw(gl, scene, frameContext, iDrawable, lights, pass){
        frameContext.getRenderState().store();
        if(pass == 0){
            // global shading
            // 如果灯光数量为0,则直接执行渲染
            if(lights.length == 0){
                let conVars = frameContext.m_LastSubShader.getContextVars();
                if(conVars[TilePassLightingRenderProgram.S_AMBIENT_LIGHT_COLOR] != null){
                    let ambientLightColor = scene.AmbientLightColor;
                    gl.uniform3f(conVars[TilePassLightingRenderProgram.S_AMBIENT_LIGHT_COLOR].loc, ambientLightColor._m_X, ambientLightColor._m_Y, ambientLightColor._m_Z);
                }
                if(conVars[TilePassLightingRenderProgram.S_CUR_LIGHT_COUNT] != null)
                    gl.uniform1i(conVars[TilePassLightingRenderProgram.S_CUR_LIGHT_COUNT].loc, 0);
                iDrawable.draw(frameContext);
                return;
            }

            let batchSize = scene.getRender().getBatchLightSize();
            let lastIndex = 0;
            while(lastIndex < lights.length){
                // 更新灯光信息
                lastIndex = this._uploadLights(gl, scene, frameContext, lights, batchSize, lastIndex);
                // 最后draw
                iDrawable.draw(frameContext);
            }
        }
        else if(pass == 1){
            // tile based shading
            // scene.getRender()._checkRenderState(gl, this._m_AccumulationLights, frameContext.getRenderState());
            // 如果灯光数量为0,则直接执行渲染
            if(lights.length == 0){
                // 直接绘制即可
                // iDrawable.draw(frameContext);
                return;
            }



            let lightFrustum = null;
            let tileInfo = scene.getRender().getTileInfo();
            let tileSize = tileInfo.tileSize;
            let tileWidth = tileInfo.tileWidth;
            let tileHeight = tileInfo.tileHeight;
            let tileNum = tileInfo.tileNum;
            this._reset(gl, tileNum);

            if(lights.length > 0){
                scene.getRender()._checkRenderState(gl, this._m_AccumulationLights, frameContext.getRenderState());
                this._m_ViewPortWidth = scene.getMainCamera().getWidth() * 0.5;
                this._m_ViewPortHeight = scene.getMainCamera().getHeight() * 0.5;
                this._m_PV = scene.getMainCamera().getProjectViewMatrix(true);
                let v = scene.getMainCamera().getViewMatrix();
                this._m_Temp_Vec3.setToInXYZ(v.m[0], v.m[4], v.m[8]);
                this._m_CamLeftCoeff = 1.0 / scene.getMainCamera().getFrustumPlane(1).getNormal().dot(this._m_Temp_Vec3);
                this._m_Temp_Vec3.setToInXYZ(v.m[1], v.m[5], v.m[9]);
                this._m_CamTopCoeff = 1.0 / scene.getMainCamera().getFrustumPlane(2).getNormal().dot(this._m_Temp_Vec3);
                this._m_Cam_Left.setToInXYZW(v.m[0], v.m[4], v.m[8], 1.0).multLength(-1);
                this._m_Cam_Up.setToInXYZW(v.m[1], v.m[5], v.m[9], 1.0);
            }

            // tile 检索
            for(let i = 0, len = lights.length;i < len;i++){
                lightFrustum = this._lightClip(gl, lights[i]);
                if(lightFrustum){
                    this._tile(tileSize, tileWidth, tileHeight, tileNum, this._m_Tiles, lightFrustum, i);
                }
            }

            // 编码光源信息
            this._tileLightDecode(gl, frameContext, tileNum, this._m_Tiles, tileWidth, tileHeight, lights);
            iDrawable.draw(frameContext);
        }
    }
    drawArrays(gl, scene, frameContext, iDrawables, lights, pass){
        frameContext.getRenderState().store();
        if(pass == 0){
            // global shading
            // 如果灯光数量为0,则直接执行渲染
            if(lights.length == 0){
                let conVars = frameContext.m_LastSubShader.getContextVars();
                if(conVars[TilePassLightingRenderProgram.S_AMBIENT_LIGHT_COLOR] != null){
                    let ambientLightColor = scene.AmbientLightColor;
                    gl.uniform3f(conVars[TilePassLightingRenderProgram.S_AMBIENT_LIGHT_COLOR].loc, ambientLightColor._m_X, ambientLightColor._m_Y, ambientLightColor._m_Z);
                }
                if(conVars[TilePassLightingRenderProgram.S_CUR_LIGHT_COUNT] != null)
                    gl.uniform1i(conVars[TilePassLightingRenderProgram.S_CUR_LIGHT_COUNT].loc, 0);
                iDrawables.forEach(iDrawable=>{
                    iDrawable.draw(frameContext);
                });
                return;
            }

            let batchSize = scene.getRender().getBatchLightSize();
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
        else if(pass == 1){
            // tile based shading
            // 如果灯光数量为0,则直接执行渲染
            if(lights.length == 0){
                // 直接绘制即可
                // iDrawables.forEach(iDrawable=>{
                //     iDrawable.draw(frameContext);
                // });
                return;
            }



            let lightFrustum = null;
            let tileInfo = scene.getRender().getTileInfo();
            let tileSize = tileInfo.tileSize;
            let tileWidth = tileInfo.tileWidth;
            let tileHeight = tileInfo.tileHeight;
            let tileNum = tileInfo.tileNum;
            this._reset(gl, tileNum);

            if(lights.length > 0){
                scene.getRender()._checkRenderState(gl, this._m_AccumulationLights, frameContext.getRenderState());
                this._m_ViewPortWidth = scene.getMainCamera().getWidth() * 0.5;
                this._m_ViewPortHeight = scene.getMainCamera().getHeight() * 0.5;
                this._m_PV = scene.getMainCamera().getProjectViewMatrix(true);
                let v = scene.getMainCamera().getViewMatrix();
                this._m_Temp_Vec3.setToInXYZ(v.m[0], v.m[4], v.m[8]);
                this._m_CamLeftCoeff = 1.0 / scene.getMainCamera().getFrustumPlane(1).getNormal().dot(this._m_Temp_Vec3);
                this._m_Temp_Vec3.setToInXYZ(v.m[1], v.m[5], v.m[9]);
                this._m_CamTopCoeff = 1.0 / scene.getMainCamera().getFrustumPlane(2).getNormal().dot(this._m_Temp_Vec3);
                this._m_Cam_Left.setToInXYZW(v.m[0], v.m[4], v.m[8], 1.0).multLength(-1);
                this._m_Cam_Up.setToInXYZW(v.m[1], v.m[5], v.m[9], 1.0);
            }

            // tile 检索
            for(let i = 0, len = lights.length;i < len;i++){
                lightFrustum = this._lightClip(gl, lights[i]);
                if(lightFrustum){
                    this._tile(tileSize, tileWidth, tileHeight, tileNum, this._m_Tiles, lightFrustum, i);
                }
            }

            // 编码光源信息
            this._tileLightDecode(gl, frameContext, tileNum, this._m_Tiles, tileWidth, tileHeight, lights);
            iDrawables.forEach(iDrawable=>{
                iDrawable.draw(frameContext);
            });
        }
    }
}
