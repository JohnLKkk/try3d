const sLog = console.log;
const sInfo = console.info;
const sWarn = console.warn;
const sDebug = console.debug;
const sError = console.error;
const sTime = console.time;
const sTimeEnd = console.timeEnd;
/**
 * 简单的日志系统。<br/>
 * 提供引擎内部日志控制的日志系统，用法同console一致，默认开启基本级别日志，如果需要开启或关闭级别日志，请调用enable()激活指定级别。<br/>
 * 用法:<br/>
 * Log.log("");或者Log.log("e",e);<br/>
 * Log.info("");Log.time("start");Log.timeEnd("start");<br/>
 * 开启或关闭:<br/>
 * Log.enable(Log.S_DEBUG, true/false);<br/>
 * @author Kkk
 * @date 2021年3月5日14点00分
 */
export default class Log {
    static S_DEBUG = 0;
    static S_INFO = 1;
    static S_WARN = 2;
    static S_LOG = 3;
    static S_ERROR = 4;
    static S_TIME = 5;
    static S_TIME_CALC = 6;

    //默认定义,什么也不处理
    static debug(){};
    static log(){};
    static info(){};
    static warn(){};
    static error(){};
    static time(){};
    static timeEnd(){};
    static timeCalc(){};

    static enable(level, enable){
        switch (level) {
            case Log.S_DEBUG:
                Log.debug = enable ? sDebug : ()=>{};
                break;
            case Log.S_INFO:
                Log.info = enable ? sInfo : ()=>{};
                break;
            case Log.S_LOG:
                Log.log = enable ? sLog : ()=>{};
                break;
            case Log.S_WARN:
                Log.warn = enable ? sWarn : ()=>{};
                break;
            case Log.S_ERROR:
                Log.error = enable ? sError : ()=>{};
                break;
            case Log.S_TIME:
                Log.time = enable ? sTime : ()=>{};
                Log.timeEnd = enable ? sTimeEnd : ()=>{};
                break;
            case Log.S_TIME_CALC:
                /**
                 * 用法:
                 * let timeCalc = Log.timeCalc();
                 * .....
                 * timeCalc = Log.timeCalc(timeCalc).time;
                 * @param obj
                 * @return {*}
                 */
                Log.timeCalc = enable ? function(obj){
                    if(obj){
                        obj.time = (new Date()).getTime() - obj.time;
                        return obj;
                    }
                    else{
                        obj = {};
                        obj.time = (new Date()).getTime();
                        return obj;
                    }
                } : ()=>{};
                break;
        }
    }
}
Log.enable(Log.S_LOG, true);
Log.enable(Log.S_INFO, true);
Log.enable(Log.S_DEBUG, true);
Log.enable(Log.S_ERROR, true);
Log.enable(Log.S_WARN, true);
Log.enable(Log.S_TIME, true);
