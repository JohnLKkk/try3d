/**
 * 默认渲染程序,其他渲染程序继承该类。<br/>
 * 在该级别下直接渲染物体。<br/>
 * @author Kkk
 * @date 2021年2月17日15点58分
 */
export default class DefaultRenderProgram {
    static PROGRAM_TYPE = null;
    constructor(props) {

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
