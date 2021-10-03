/**
 * 默认渲染程序,其他渲染程序继承该类。<br/>
 * 在该级别下直接渲染物体。<br/>
 * @author Kkk
 * @date 2021年2月17日15点58分
 */
export default class DefaultRenderProgram {
    static PROGRAM_TYPE = null;
    // 唯一shading阶段
    static S_UNIQUE_SHADING_SRC = '_uniqueShading';
    constructor(props) {

    }

    /**
     * 设置唯一着色阶段。<br/>
     * @param {GLContext}[gl]
     * @param {Object}[conVars]
     * @param {Boolean}[pass]
     */
    uniqueShading(gl, conVars, pass){
        if(conVars[DefaultRenderProgram.S_UNIQUE_SHADING_SRC]){
            gl.uniform1i(conVars[DefaultRenderProgram.S_UNIQUE_SHADING_SRC].loc, pass);
        }
    }

    /**
     * 每一帧开始时回调。<br/>
     */
    reset(){
        // 什么也不做
    }

    /**
     * 渲染指定iDrawable。<br/>
     * @param {WebGLContext}[gl]
     * @param {Scene}[scene]
     * @param {FrameContext}[frameContext]
     * @param {IDrawable}[iDrawable]
     * @param {Light[]}[lights灯光信息列表]
     */
    draw(gl, scene, frameContext, iDrawable, lights){
        iDrawable.draw(frameContext);
    }

    /**
     * 渲染指定iDrawable列表。<br/>
     * @param {WebGLContext}[gl]
     * @param {Scene}[scene]
     * @param {FrameContext}[frameContext]
     * @param {IDrawable[]}[iDrawables]
     * @param {Light[]}[lights]
     */
    drawArrays(gl, scene, frameContext, iDrawables, lights){
        iDrawables.forEach(iDrawable=>{
            iDrawable.draw(frameContext);
        });
    }

}
