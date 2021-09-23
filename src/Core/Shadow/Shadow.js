/**
 * Shadows。<br/>
 * 该类封装了Shadow的一些计算方法,以便可以独立调试。<br/>
 * @author Kkk
 * @date 2021年9月15日17点38分
 */
import Vector3 from "../Math3d/Vector3.js";
import Node from "../Node/Node.js";
import Matrix44 from "../Math3d/Matrix44.js";
import AABBBoundingBox from "../Math3d/Bounding/AABBBoundingBox.js";
import SplitOccluders from "./SplitOccluders.js";
import Light from "../Light/Light.js";

export default class Shadow {
    static S_TEMP_VEC3_0 = new Vector3();
    static S_TEMP_VEC3_1 = new Vector3();
    static S_TEMP_VEC3_2 = new Vector3();
    static S_TEMP_VEC3_3 = new Vector3();
    static S_TEMP_VEC3_4 = new Vector3();
    static S_TEMP_VEC3_5 = new Vector3();
    static S_TEMP_VEC3_6 = new Vector3();
    static S_TEMP_VEC3_7 = new Vector3();
    static S_TEMP_VEC3_8 = new Vector3();
    static S_TEMP_VEC3_00 = new Vector3();
    static S_TEMP_VEC3_11 = new Vector3();
    static S_TEMP_VEC3_22 = new Vector3();
    static S_TEMP_VEC3_33 = new Vector3();
    static S_TEMP_VEC3_44 = new Vector3();
    static S_TEMP_VEC3_55 = new Vector3();
    static S_TEMP_MAT44_0 = new Matrix44();
    static S_TEMP_MAT44_1 = new Matrix44();
    static S_AABB_BOUNDARY_BOX0 = new AABBBoundingBox();
    static S_AABB_BOUNDARY_BOX1 = new AABBBoundingBox();
    /**
     * 计算光锥边界范围，这里的思路是根据near,far将光锥代表的范围计算到一个边界体中。<br/>
     * @param {Camera}[viewCam 通常是渲染主相机]
     * @param {Number}[newNear]
     * @param {Number}[newFar]
     * @param {Number}[scale]
     * @param {Array}[result 存放边界体结果，这里其实统一为8个点标记的边界体]
     */
    static calculateLightConeScope(viewCam, newNear, newFar, scale, result){
        let depthHeightRatio = viewCam.getTop() * 1.0 / viewCam.getNear();
        let near = newNear * 1.0;
        let far = newFar * 1.0;
        let top = viewCam.getTop() * 1.0;
        let right = viewCam.getRight() * 1.0;
        let ratio = right / top;

        let near_height = -1, near_width = -1, far_height = -1, far_width = -1;

        if(viewCam.isParallelProjection()){
            near_height = top;
            near_width = near_height * ratio;
            far_height = top;
            far_width = far_height * ratio;
        }
        else{
            near_height = depthHeightRatio * near;
            near_width = near_height * ratio;
            far_height = depthHeightRatio * far;
            far_width = far_height * ratio;
        }

        // 计算光锥包围体
        let pos = viewCam.getEye();
        let dir = viewCam.getDir();
        let up = viewCam.getUp();

        let r = dir.cross(up, Shadow.S_TEMP_VEC3_1).normal();
        // near,far中点计算
        let farCenter = dir.multLength(far, Shadow.S_TEMP_VEC3_2).add(pos);
        let nearCenter = dir.multLength(near, Shadow.S_TEMP_VEC3_3).add(pos);

        let nearUp = up.multLength(near_height, Shadow.S_TEMP_VEC3_4);
        let farUp = up.multLength(far_height, Shadow.S_TEMP_VEC3_5);
        let nearRight = r.multLength(near_width, Shadow.S_TEMP_VEC3_6);
        let farRight = r.multLength(far_width, Shadow.S_TEMP_VEC3_7);

        nearCenter.sub(nearUp, result[0]).sub(nearRight);
        nearCenter.add(nearUp, result[1]).sub(nearRight);
        nearCenter.add(nearUp, result[2]).add(nearRight);
        nearCenter.sub(nearUp, result[3]).add(nearRight);

        farCenter.sub(farUp, result[4]).sub(farRight);
        farCenter.add(farUp, result[5]).sub(farRight);
        farCenter.add(farUp, result[6]).add(farRight);
        farCenter.sub(farUp, result[7]).add(farRight);

        if(scale != 1.0){
            // 找到光锥体的中心
            let center = Shadow.S_TEMP_VEC3_8.setToInXYZ(0, 0, 0);
            for(let i = 0;i < 8;i++){
                center.add(result[i]);
            }
            center.multLength(1.0 / 8);

            let cDir = Shadow.S_TEMP_VEC3_0;
            for(let i = 0;i < 8;i++){
                result[i].sub(center, cDir);
                cDir.multLength(scale - 1.0);
                result[i].add(cDir);
            }
        }
    }

    /**
     * 基于PSSM计算锥体分区。<br/>
     * @param {Array}[splits 分区结果信息]
     * @param {Number}[near]
     * @param {Number}[far]
     * @param {Number}[lambda]
     */
    static calculateSplits(splits, near, far, lambda){
        let IDM = -1, log = -1, u = -1;
        let nf = (far * 1.0 / near);
        let nf2 = far - near;
        for(let i = 0, len = splits.length;i < len;i++){
            IDM = i * 1.0 / len;
            log = near * Math.pow(nf, IDM);
            u = near + nf2 * IDM;
            splits[i] = log * lambda + u * (1.0 - lambda);
        }

        // 这用于提高计算的正确性。 无论发生什么，camera的主要近平面和远平面始终保持不变。
        splits[0] = near;
        splits[splits.length - 1] = far;
    }

    /**
     * 更新shadowCam确保视锥体包含指定的视锥边界体,同时计算锥体下的潜在可见集合。<br/>
     * @param {Node[]}[sceneNodes]
     * @param {Geometry[]}[splitShadowGeometryReceivers]
     * @param {Camera}[shadowCam]
     * @param {Vector3[]}[points]
     * @param {Geometry[]}[splitShadowGeometryCasts]
     * @param {Number}[shadowMapSize]
     */
    static calculateShadowCamera(sceneNodes, splitShadowGeometryReceivers, shadowCam, points, splitShadowGeometryCasts, shadowMapSize){
        if(shadowCam.isParallelProjection()){
            shadowCam.setFrustum(-1, 1, 1, -1, -shadowCam.getFar(), shadowCam.getFar());
            shadowCam.forceUpdateProjection();
        }
        let vp = shadowCam.getProjectViewMatrix(true);
        let splitBoundary = Shadow.calculateBoundaryFromPoints(points, vp, Shadow.S_AABB_BOUNDARY_BOX0);

        let casterBoundary = new AABBBoundingBox();
        let receiverBoundary = new AABBBoundingBox();

        let casterCount = 0, receiverCount = 0;

        // 计算receiver包围体
        let bv = null, recvBox = null;
        let c = null;
        splitShadowGeometryReceivers.forEach(geometry=>{
            bv = geometry.getBoundingVolume();
            recvBox = Shadow.S_AABB_BOUNDARY_BOX1;
            bv.transformFromMat44(vp, Shadow.S_AABB_BOUNDARY_BOX1);
            if(splitBoundary.contains(recvBox)){
                c = recvBox.getCenter();
                if(Math.abs(c._m_X) != Number.MAX_VALUE && !Number.isNaN(c._m_X) && Number.isFinite(c._m_X)){
                    receiverBoundary.merge(recvBox);
                    receiverCount++;
                }
            }
        });

        // 遍历整个场景（实际上仅遍历场景潜在可见集合）
        // 获取分区下的潜在可见集合
        let ext = new SplitOccluders(vp, casterCount, splitBoundary, casterBoundary, splitShadowGeometryCasts);
        sceneNodes.forEach(sceneNode=>{
            ext.calculate(sceneNode);
        });
        casterCount = ext._m_CasterCount;
        if(casterCount != receiverCount){
            casterBoundary.setHalfInXYZ(casterBoundary.getXHalf() + 2.0, casterBoundary.getYHalf() + 2.0, casterBoundary.getZHalf() + 2.0);
        }
        let casterMin = casterBoundary.getMin(Shadow.S_TEMP_VEC3_00);
        let casterMax = casterBoundary.getMax(Shadow.S_TEMP_VEC3_11);

        let receiverMin = receiverBoundary.getMin(Shadow.S_TEMP_VEC3_22);
        let receiverMax = receiverBoundary.getMax(Shadow.S_TEMP_VEC3_33);

        let splitMin = splitBoundary.getMin(Shadow.S_TEMP_VEC3_44);
        let splitMax = splitBoundary.getMax(Shadow.S_TEMP_VEC3_55);

        splitMin._m_Z = 0.0;

        let p = shadowCam.getProjectMatrix();

        // 为了避免使用重复,这里使用倒数临时变量
        let cropMin = Shadow.S_TEMP_VEC3_8;
        let cropMax = Shadow.S_TEMP_VEC3_7;

        cropMin._m_X = Math.max(Math.max(casterMin._m_X, receiverMin._m_X), splitMin._m_X);
        cropMax._m_X = Math.min(Math.min(casterMax._m_X, receiverMax._m_X), splitMax._m_X);

        cropMin._m_Y = Math.max(Math.max(casterMin._m_Y, receiverMin._m_Y), splitMin._m_Y);
        cropMax._m_Y = Math.min(Math.min(casterMax._m_Y, receiverMax._m_Y), splitMax._m_Y);

        // Z 值的特殊处理
        cropMin._m_Z = Math.min(casterMin._m_Z, splitMin._m_Z);
        cropMax._m_Z = Math.min(receiverMax._m_Z, splitMax._m_Z);

        // 创建cropMatrix
        let scaleX, scaleY, scaleZ;
        let offsetX, offsetY, offsetZ;

        scaleX = (2.0) / (cropMax._m_X - cropMin._m_X);
        scaleY = (2.0) / (cropMax._m_Y - cropMin._m_Y);

        // 这里的思路来自ShaderX7,用于稳定的PSSM(尽管这是一个比较古老的方案)
        let halfTS = shadowMapSize * 0.5;

        if(halfTS != 0 && scaleX > 0 && scaleY > 0){
            let scaleQuantizer = 0.1;
            scaleX = 1.0 / Math.ceil(1.0 / scaleX * scaleQuantizer) * scaleQuantizer;
            scaleY = 1.0 / Math.ceil(1.0 / scaleY * scaleQuantizer) * scaleQuantizer;
        }

        offsetX = -0.5 * (cropMax._m_X + cropMin._m_X) * scaleX;
        offsetY = -0.5 * (cropMax._m_Y + cropMin._m_Y) * scaleY;

        if(halfTS != 0 && scaleX > 0 && scaleY > 0){
            offsetX = Math.ceil(offsetX * halfTS) * 1.0 / halfTS;
            offsetY = Math.ceil(offsetY * halfTS) * 1.0 / halfTS;
        }

        scaleZ = 1.0 / (cropMax._m_Z - cropMin._m_Z);
        offsetZ = -cropMin._m_Z * scaleZ;

        let cropMatrix = Shadow.S_TEMP_MAT44_0;
        cropMatrix.setArray([
            scaleX, 0, 0, 0,
            0, scaleY, 0, 0,
            0, 0, scaleZ, 0,
            offsetX, offsetY, offsetZ, 1
        ]);

        let pr = Shadow.S_TEMP_MAT44_1;
        Matrix44.multiplyMM(pr, 0, cropMatrix, 0, p, 0);

        shadowCam.setProjectMatrix(pr);
    }

    /**
     * 根据指定点和变换矩阵计算BoundaryVolume。<br/>
     * @param {Vector3[]}[pos]
     * @param {Matrix44}[mat]
     * @param {AABBBoundingBox}[result]
     * @return {AABBBoundingBox}
     */
    static calculateBoundaryFromPoints(pos, mat, result){
        let min = Shadow.S_TEMP_VEC3_0.setTo(Vector3.S_MIN);
        let max = Shadow.S_TEMP_VEC3_1.setTo(Vector3.S_MAX);
        let temp = Shadow.S_TEMP_VEC3_2;
        let pw = 0;
        for(let i = 0, len = pos.length;i < len;i++){
            pw = Matrix44.multiplyMV3(temp, pos[i], mat);
            temp.multLength(1.0 / pw);

            min.min(temp);
            max.max(temp);
        }

        // 计算Boundary中心和半径
        let center = min.add(max, Shadow.S_TEMP_VEC3_3).multLength(0.5);
        let r = max.sub(min, Shadow.S_TEMP_VEC3_4).multLength(0.5);
        let boundary = result || new AABBBoundingBox();
        boundary.setCenter(center);
        // 加偏移是为了修正精度范围内的误差
        boundary.setHalfInXYZ(r._m_X + 2.0, r._m_Y + 2.0, r._m_Z + 2.5);
        return boundary;
    }

    /**
     * 计算当前锥体内的潜在可见性集合，这里的优化策略是，这个方法用于查找主相机中潜在可见集合的子集，因此不必遍历场景图。<br/>
     * @param {Array}[visDrawables]
     * @param {Camera}[camera]
     * @param {Number}[mode]
     * @param {Array}[result]
     */
    static calculateGeometriesInFrustum(visDrawables, camera, mode, result){
        let restoreFrustumMask = camera.getFrustumMask();
        // 执行默认剔除
        Shadow._cull(visDrawables, camera, mode, result);
        camera.setFrustumMask(restoreFrustumMask);
    }

    /**
     * 计算当前锥体内的潜在可见集合。<br/>
     * @param {Node}[node]
     * @param {Camera}[camera]
     * @param {Number}[mode]
     * @param {Array}[result]
     */
    static calculateNodeInFrustum(node, camera, mode, result){
        let restoreFrustumMask = camera.getFrustumMask();
        // 执行默认剔除
        camera.setFrustumMask(0);
        Shadow._cull2(node, camera, mode, result);
        camera.setFrustumMask(restoreFrustumMask);
    }

    /**
     * 锥体剔除，实际上虽然可以直接使用Camera的内部方法进行，但是为了效率直接在这里实现一个函数封装，以便去掉额外的内容和增加额外的内容。<br/>
     * @param {Array}[visDrawables]
     * @param {Camera}[camera]
     * @param {Number}[mode]
     * @param {Array}[result]
     * @private
     */
    static _cull(visDrawables, camera, mode, result){
        visDrawables.forEach(visDrawable=>{
            camera.setFrustumMask(0);
            if(visDrawable.inFrustum(camera)){
                // 判断是否为指定阴影模式
                if(Shadow._parseShadowMode(visDrawable, mode)){
                    // 添加到result中
                    result.push(visDrawable);
                }
            }
        });
    }
    static _cull2(node, camera, mode, result){
        if(node.getFilterFlag() == Node.S_ALWAYS)return;

        if(node.inFrustum(camera)){
            if(node.isDrawable && node.isDrawable() && !node.isGUI()){
                // 判断是否为指定阴影模式
                if(Shadow._parseShadowMode(node, mode)){
                    // 添加到result中
                    result.push(node);
                }
            }
            else{
                if(node.getChildren().length > 0){
                    let resetFrustumMask = camera.getFrustumMask();
                    node.getChildren().forEach(node=>{
                        if(!(node instanceof Light)){
                            camera.setFrustumMask(resetFrustumMask);
                            Shadow._cull2(node, camera, mode, result);
                        }
                    });
                }
            }
        }
    }

    /**
     * 解析阴影类型。<br/>
     * @param {Node}[node]
     * @param {Number}[mode]
     * @return {Number}
     * @private
     */
    static _parseShadowMode(node, mode){
        if(mode != Node.S_SHADOW_NONE){
            switch (mode) {
                case Node.S_SHADOW_CAST:
                    return node.isCastShadow();
                case Node.S_SHADOW_RECEIVE:
                    return node.isReceiveShadow();
                case Node.S_SHADOW_CAST_AND_RECEIVE:
                    return true;
            }
        }
        return false;
    }
}
