function miaovAddEvent(oEle, sEventName, fnHandler)
{
    if(oEle.attachEvent)
    {
        oEle.attachEvent('on'+sEventName, fnHandler);
    }
    else
    {
        oEle.addEventListener(sEventName, fnHandler, false);
    }
}
window.onload = function()
{
    var oDiv=document.getElementById('miaov_float_layer');
    var oBtnMin=document.getElementById('btn_min');
    var oBtnClose=document.getElementById('btn_close');
    var oDivContent=oDiv.getElementsByTagName('div')[0];
    var iMaxHeight=0;
    var isIE6=window.navigator.userAgent.match(/MSIE 6/ig) && !window.navigator.userAgent.match(/MSIE 7|8/ig);
    oDiv.style.display='block';
    iMaxHeight=oDivContent.offsetHeight;
    if(isIE6)
    {
        oDiv.style.position='absolute';
        repositionAbsolute();
        miaovAddEvent(window, 'scroll', repositionAbsolute);
        miaovAddEvent(window, 'resize', repositionAbsolute);
    }
    else
    {
        oDiv.style.position='fixed';
        repositionFixed();
        miaovAddEvent(window, 'resize', repositionFixed);
    }
    oBtnMin.timer=null;
    oBtnMin.isMax=true;
    oBtnMin.onclick=function ()
    {
        startMove
        (
            oDivContent, (this.isMax=!this.isMax)?iMaxHeight:0,
            function ()
            {
                oBtnMin.className=oBtnMin.className=='min'?'max':'min';
            }
        );
    };
    oBtnClose.onclick=function ()
    {
        oDiv.style.display='none';
    };
};
function startMove(obj, iTarget, fnCallBackEnd)
{
    if(obj.timer)
    {
        clearInterval(obj.timer);
    }
    obj.timer=setInterval
    (
        function ()
        {
            doMove(obj, iTarget, fnCallBackEnd);
        },30
    );
}
function doMove(obj, iTarget, fnCallBackEnd)
{
    var iSpeed=(iTarget-obj.offsetHeight)/8;
    if(obj.offsetHeight==iTarget)
    {
        clearInterval(obj.timer);
        obj.timer=null;
        if(fnCallBackEnd)
        {
            fnCallBackEnd();
        }
    }
    else
    {
        iSpeed=iSpeed>0?Math.ceil(iSpeed):Math.floor(iSpeed);
        obj.style.height=obj.offsetHeight+iSpeed+'px';
        ((window.navigator.userAgent.match(/MSIE 6/ig) && window.navigator.userAgent.match(/MSIE 6/ig).length==2)?repositionAbsolute:repositionFixed)()
    }
}
function repositionAbsolute()
{
    var oDiv=document.getElementById('miaov_float_layer');
    var left=document.body.scrollLeft||document.documentElement.scrollLeft;
    var top=document.body.scrollTop||document.documentElement.scrollTop;
    var width=document.documentElement.clientWidth;
    var height=document.documentElement.clientHeight;
    oDiv.style.left=left+width-oDiv.offsetWidth+'px';
    oDiv.style.top=top+height-oDiv.offsetHeight+'px';
}
function repositionFixed()
{
    var oDiv=document.getElementById('miaov_float_layer');
    var width=document.documentElement.clientWidth;
    var height=document.documentElement.clientHeight;
    oDiv.style.left=width-oDiv.offsetWidth+'px';
    oDiv.style.top=height-oDiv.offsetHeight+'px';
}

function addInfos(title, content){
    let divInnerHTML = '<div class="float_layer" id="miaov_float_layer">\n' +
        '    <h2>\n' +
        '        <strong>' + title + '</strong>\n' +
        '        <a id="btn_min" href="javascript:;" class="min"></a>\n' +
        '        <a id="btn_close" href="javascript:;" class="close"></a>\n' +
        '    </h2>\n' +
        '    <div class="content">\n' +
        '        <div class="wrap">\n' + content +
        '        </div>\n' +
        '    </div>\n' +
        '</div>';
    let div = document.createElement('DIV');
    div.innerHTML = divInnerHTML;
    document.body.appendChild(div);
}
