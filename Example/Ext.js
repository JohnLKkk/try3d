export default class Ext {
    show(text, cfg){
        let div = document.createElement('DIV');
        div.innerHTML = '<div style="position: fixed;word-break: break-all;width:270px;height:100%;line-height:' + (cfg.lineheight || 30) + 'px;left: 0px;top: 0px;color: white;background-color: rgba(128,128,128,0.34);padding-top: 10px">\n' +
            '    <pre style="white-space: pre-wrap;word-wrap: break-word;margin: 5px;margin-top:50px;position: absolute;left: 0px;top: 0px;font-size: 18px;font-style: italic">' + text + '</pre>\n' +
            '</div>';
        document.body.appendChild(div);
    }
}
