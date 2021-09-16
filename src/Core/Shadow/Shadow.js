/**
 * Shadow。<br/>
 * 该类封装了Shadow的一些计算方法,以便可以独立调试。<br/>
 * @author Kkk
 * @date 2021年9月15日17点38分
 */
import Vector3 from "../Math3d/Vector3.js";
import Node from "../Node/Node";

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
        let dir = viewCam.getAt().sub(pos, Shadow.S_TEMP_VEC3_0).normal();
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
     * 计算当前锥体内的潜在可见性集合，这里有很多优化的地方，最基本的，可以记录每次剔除后的另一部分，因为假设目标node是整个潜在可见集合，而camera是分区锥体。<br/>
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
