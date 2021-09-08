import DefaultRenderProgram from "./DefaultRenderProgram.js";
import Matrix44 from "../../Math3d/Matrix44.js";

/**
 * TilePassLightingRenderProgram。<br/>
 * @author Kkk
 * @date 2021年9月8日16点43分
 */
export default class TilePassLightingRenderProgram extends DefaultRenderProgram{
    // Tile
    static S_LIGHT_NUM_SRC = "_lightNum";
    // Tile中ppx编码的光源检索
    static S_TILE_LIGHT_GRID_SRC = "_tileLightGrid";
    // Tile中ppx编码的光源id
    static S_TILE_LIGHT_INDEX_SRC = "_tileLightIndex";
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
    _reset(gl, tileNum){
        if(!this._m_LightsIndexData){
            this._m_LightsIndexData = gl.createTexture();
        }
        if(!this._m_LightsDecodeData){
            this._m_LightsDecodeData = gl.createTexture();
        }
        if(!this._m_LightsData0){
            this._m_LightsData0 = gl.createTexture();
        }
        this._m_LightsData0Array.length = 0;
        if(!this._m_LightsData1){
            this._m_LightsData1 = gl.createTexture();
        }
        this._m_LightsData1Array.length = 0;
        if(!this._m_LightsData2){
            this._m_LightsData2 = gl.createTexture();
        }
        this._m_LightsData2Array.length = 0;
        // 每个tile保存对应的光源信息
        for(let i in tileNum){
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
    _tileLightDecode(gl, frameContext, tileNum, tiles, lights){
        let len = -1;
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
        let conVars = frameContext.m_LastSubShader.getContextVars();
        // lightIndexData
        let lightIndexDataVec3 = [];
        for(let i = 0,len = this._m_LightsIndexData.length;i < len;i++){
            lightIndexDataVec3[i * 3] = this._m_LightsIndexData[i];
            lightIndexDataVec3[i * 3 + 1] = 0;
            lightIndexDataVec3[i * 3 + 2] = 0;
        }
        this._m_LightsIndexData = lightIndexDataVec3;
        // lightsData0,1,2
        let lightSpace = null;
        let light = null;
        let lightColor = null;
        len = lights.length;
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
        if(conVars[TilePassLightingRenderProgram.S_TILE_W_LIGHT_DATA_0] != undefined){
            // 上载lightData0
        }
        // 返回1表示渲染
        return 1;
    }
    _uploadDecodeTexture(gl, tex, loc, internalformat, w, h, format, type, data){
        gl.activeTexture(gl.TEXTURE0 + loc);
        gl.bindTexture(gl.TEXTURE_2D, tex);
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
    drawArrays(gl, scene, frameContext, iDrawables, lights, pass){
        if(lights.length == 0){
            // 绘制
            return;
        }

        frameContext.getRenderState().store();
        if(pass == 0){
            // global shading
        }
        else if(pass == 1){
            // tile based shading
            this._reset();
            let lightFrustum = null;
            let tileInfo = scene.getRender().getTileInfo();
            let tileSize = tileInfo.tileSize;
            let tileWidth = tileInfo.tileWidth;
            let tileHeight = tileInfo.tileHeight;
            let tileNum = tileInfo.tileNum;

            // tile 检索
            for(let i = 0, len = lights.length;i < len;i++){
                lightFrustum = this._lightClip(gl, lights[i]);
                if(lightFrustum){
                    this._tile(tileSize, tileWidth, tileHeight, tileNum, this._m_Tiles, lightFrustum, i);
                }
            }

            // 编码光源信息
        }
    }
}
