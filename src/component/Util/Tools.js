/**
 * 提供一些常见工具函数。<br/>
 * @author Kkk
 * @date 2021年2月5日16点48分
 */
export default class Tools {
    /**
     * 返回目标匹配符。<br/>
     * @param {String}[str 源]
     * @returns {TagPattern}
     */
    static getTagPattern(str){
        return eval("/" + str + "/g");
    }
    /**
     * 返回匹配符。<br/>
     * @param {String}[str 源]
     * @returns {Pattern}
     */
    static getPattern(str){
        return eval("/" + str + "/");
    }
    /**
     * 去掉字符串前后空格字符。<br/>
     * @param {String}[str 源]
     * @returns {void | string | *}
     */
    static trim(str){
        return str.replace(/(^\s*)|(\s*$)/g, "");
    }
    /**
     * 查找str中是否包含指定模板字符串。<br/>
     * @param {String}[str 源]
     * @param {Pattern}[pattern 匹配正则表达式]
     * @return {boolean}
     */
    static find(str, pattern){
        return str.search(pattern) != -1;
    }
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
