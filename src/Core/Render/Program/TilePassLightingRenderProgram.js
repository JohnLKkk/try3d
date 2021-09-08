import DefaultRenderProgram from "./DefaultRenderProgram.js";
import Matrix44 from "../../Math3d/Matrix44.js";

/**
 * TilePassLightingRenderProgram。<br/>
 * @author Kkk
 * @date 2021年9月8日16点43分
 */
export default class TilePassLightingRenderProgram extends DefaultRenderProgram{
    // 分块信息
    _m_Tiles = [];
    // 光源索引
    _m_LightsIndex = [];
    // 光源编码数据
    _m_LightsDecode = [];
    _reset(tileNum){
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
    _tileLightDecode(tileNum, tiles){
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

            // 上载光源信息
        }
    }
}
