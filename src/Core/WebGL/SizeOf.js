/**
 * SizeOf。<br/>
 * 提供获取GL数据长度的枚举。<br/>
 * @author Kkk
 * @date 2021年3月14日13点26分
 */
export default class SizeOf {
    static S_UNSIGNED_SHORT = 0x001;
    static sizeof(src){
        switch (src) {
            case SizeOf.S_UNSIGNED_SHORT:
                return 2;
        }
        return -1;
    }
}
