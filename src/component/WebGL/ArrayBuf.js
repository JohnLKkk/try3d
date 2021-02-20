/**
 * 包装gl arrayBuf的创建，使用。<br/>
 * @author Kkk
 */
export default class ArrayBuf {
    /**
     * 设置buf属性位置
     * @param gl
     * @param buf
     * @param arrayBufType
     * @param localtion
     * @param arrayBufWidth
     * @param arrayBufValueType
     * @param arrayBufLength
     * @param arrayBufOffset
     */
    static setBufLocal(gl, buf, arrayBufType, localtion, arrayBufWidth, arrayBufValueType, arrayBufLength, arrayBufOffset){
        gl.bindBuffer(arrayBufType, buf);
        gl.vertexAttribPointer(localtion, arrayBufWidth, arrayBufValueType, false, arrayBufLength, arrayBufOffset);
        gl.enableVertexAttribArray(localtion);
        gl.bindBuffer(arrayBufType, null);
    }
    /**
     * 设置属性列表buf
     * @param gl
     * @param arrayBufType
     * @param arrayBufData
     * @param arrayBufUsage
     * @param localtion
     * @param arrayBufWidth
     * @param arrayBufValueType
     * @param arrayBufStride
     * @param arrayBufOffset
     */
    static setVertexBuf(gl, vao, arrayBufType, arrayBufData, arrayBufUsage, localtion, arrayBufWidth, arrayBufValueType, arrayBufStride, arrayBufOffset) {
        gl.bindVertexArray(vao);
        let buf = gl.createBuffer();
        gl.bindBuffer(arrayBufType, buf);
        gl.bufferData(arrayBufType, arrayBufData, arrayBufUsage);
        gl.vertexAttribPointer(localtion, arrayBufWidth, arrayBufValueType, false, arrayBufStride, arrayBufOffset);
        gl.enableVertexAttribArray(localtion);
        gl.bindBuffer(arrayBufType, null);
        gl.bindVertexArray(null);
        return buf;
    }

    /**
     * 设置索引属性列表buf
     * @param gl
     * @param vao
     * @param arrayBufType
     * @param arrayBufData
     * @param arrayBufUsage
     */
    static setIndicesBuf(gl, vao, arrayBufType, arrayBufData, arrayBufUsage){
        gl.bindVertexArray(vao);
        let buf = gl.createBuffer();
        gl.bindBuffer(arrayBufType, buf);
        gl.bufferData(arrayBufType, arrayBufData, arrayBufUsage);
        gl.bindVertexArray(null);
        gl.bindBuffer(arrayBufType, null);
        return buf;
    }

}
