/**
 * 提供一些常见工具函数。<br/>
 * @author Kkk
 * @date 2021年2月5日16点48分
 */
export default class Tools {
    /**
     * 将指定字符串中所有符号匹配字符串替换为指定字符串
     * @param {String}[str 源]
     * @param {Pattern}[pattern 匹配正则表达式]
     * @param {Pattern}[tagPattern 替换正则表达式]
     * @param {String}[tag 替换的字符串内容]
     * @returns {String}
     */
    static repSrc(str, pattern, tagPattern, tag){
        if(str.search(pattern) != -1){
            return str.replace(tagPattern, tag);
        }
        return str;
    }
}
