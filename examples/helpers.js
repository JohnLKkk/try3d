var Stats=function(){var l=Date.now(),m=l,g=0,n=Infinity,o=0,h=0,p=Infinity,q=0,r=0,s=0,f=document.createElement("div");f.id="stats";f.addEventListener("mousedown",function(b){b.preventDefault();t(++s%2)},!1);f.style.cssText="width:80px;opacity:0.9;cursor:pointer";var a=document.createElement("div");a.id="fps";a.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#002";f.appendChild(a);var i=document.createElement("div");i.id="fpsText";i.style.cssText="color:#0ff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";
    i.innerHTML="FPS";a.appendChild(i);var c=document.createElement("div");c.id="fpsGraph";c.style.cssText="position:relative;width:74px;height:30px;background-color:#0ff";for(a.appendChild(c);74>c.children.length;){var j=document.createElement("span");j.style.cssText="width:1px;height:30px;float:left;background-color:#113";c.appendChild(j)}var d=document.createElement("div");d.id="ms";d.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#020;display:none";f.appendChild(d);var k=document.createElement("div");
    k.id="msText";k.style.cssText="color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";k.innerHTML="MS";d.appendChild(k);var e=document.createElement("div");e.id="msGraph";e.style.cssText="position:relative;width:74px;height:30px;background-color:#0f0";for(d.appendChild(e);74>e.children.length;)j=document.createElement("span"),j.style.cssText="width:1px;height:30px;float:left;background-color:#131",e.appendChild(j);var t=function(b){s=b;switch(s){case 0:a.style.display=
        "block";d.style.display="none";break;case 1:a.style.display="none",d.style.display="block"}};return{REVISION:11,domElement:f,setMode:t,begin:function(){l=Date.now()},end:function(){var b=Date.now();g=b-l;n=Math.min(n,g);o=Math.max(o,g);k.textContent=g+" MS ("+n+"-"+o+")";var a=Math.min(30,30-30*(g/200));e.appendChild(e.firstChild).style.height=a+"px";r++;b>m+1E3&&(h=Math.round(1E3*r/(b-m)),p=Math.min(p,h),q=Math.max(q,h),i.textContent=h+" / s",a=Math.min(30,30-30*(h/100)),c.appendChild(c.firstChild).style.height=
            a+"px",m=b,r=0);return b},update:function(){l=this.end()}}};

function configDefault(){
    var blackColorMaterial = new Try3d.Material(window.scene, {id:"blackColorMaterial", colorDef});
}
function addEnv(scene, rootNode){
    // 环境纹理加载完再开始创建创建
    let radianceLoader = new Try3d.RadianceLoader();
    radianceLoader.loadHDR('../Assets/Textures/hdr/env3.hdr', imageData=> {




        // 创建一个sky
        let sky = new Try3d.SkyBox(scene, {id: 'sky'});
        // 使用cubeMap作为天空盒材质
        let envMap = new Try3d.Texture2DVars(scene);
        envMap.setPreloadColor(scene, new Try3d.Vector4(0.5, 0.5, 0.5, 1.0));
        envMap.setWrap(scene, Try3d.Texture2DVars.S_WRAPS.S_CLAMP_TO_EDGE, Try3d.Texture2DVars.S_WRAPS.S_CLAMP_TO_EDGE);
        envMap.setFilter(scene, Try3d.Texture2DVars.S_FILTERS.S_LINEAR, Try3d.Texture2DVars.S_FILTERS.S_LINEAR);
        envMap.setTextureFormat(Try3d.Texture2DVars.S_TEXTURE_FORMAT.S_RGB16F, Try3d.Texture2DVars.S_TEXTURE_FORMAT.S_RGB, Try3d.Texture2DVars.S_TEXTURE_FORMAT.S_FLOAT);
        envMap.setImage(scene, imageData, {rgbe: true, linearFloat: true});
        sky.getMaterial().setParam('envMap', envMap);
        sky.getMaterial().setParam('useEnvMap', new Try3d.BoolVars().valueOf(true));
        sky.getMaterial().setParam('useHDR', new Try3d.BoolVars().valueOf(true));

        scene.setSky(sky);


        // 添加一个GI探头
        let giProbe = new Try3d.GIProbe(scene, {id:'GIProbe'});
        giProbe.setPositionFromXYZ(0, 0, 0);
        rootNode.addChildren(giProbe);
        // 捕捉环境数据
        let envCapture = Try3d.ProbeTools.bakeGIProbe(scene, giProbe, {resolute:128});
    });
}
function addFog(scene, fogNear, fogFar, fogColor){
    // 雾化
    let fogFilter = scene.getMainCamera().addFilterFromMaterial(new Try3d.Material(scene, {id:'fog', materialDef:Try3d.MaterialDef.parse(Try3d.Internal.S_FOG_FILTER_DEF_DATA)}));
    fogFilter.getMaterial().selectTechnology('LinearFog');
    fogFilter.getMaterial().setParam('vNear', new Try3d.FloatVars().valueOf(scene.getMainCamera().getNear()));
    fogFilter.getMaterial().setParam('vFar', new Try3d.FloatVars().valueOf(scene.getMainCamera().getFar()));
    fogFilter.getMaterial().setParam('fogNear', new Try3d.FloatVars().valueOf(fogNear));
    fogFilter.getMaterial().setParam('fogFar', new Try3d.FloatVars().valueOf(fogFar));
    if(fogColor){
        fogFilter.getMaterial().setParam('fogColor', new Try3d.Vec4Vars().valueFromXYZW(fogColor[0], fogColor[1], fogColor[2], fogColor[3]));
    }
}
function addFxaa(scene){
    let fxaaFilter = scene.getMainCamera().addFilterFromMaterial(new Try3d.Material(scene, {id:'fxaaFilter', materialDef:Try3d.MaterialDef.parse(Try3d.Internal.S_FXAA_FILTER_DEF_DATA)}));
    // fxaaFilter.getMaterial().setParam('subPixelShift', new Try3d.FloatVars().valueOf(0.2));
    // fxaaFilter.getMaterial().setParam('reduceMul', new Try3d.FloatVars().valueOf(0.1));
    return fxaaFilter;
}
function addBloom(scene, extractThreshold, exposurePower, bloomIntensity, blurScale){
    let bloomFilter = scene.getMainCamera().addFilterFromMaterial(new Try3d.Material(scene, {id:'bloomFilter', materialDef:Try3d.MaterialDef.parse(Try3d.Internal.S_BLOOM_FILTER_DEF_DATA)}));
    let mat = bloomFilter.getMaterial();
    mat.setParam('extractThreshold', new Try3d.FloatVars().valueOf(extractThreshold || 0.2));
    if(exposurePower){
        mat.setParam('exposurePower', new Try3d.FloatVars().valueOf(exposurePower));
    }
    if(bloomIntensity){
        mat.setParam('bloomIntensity', new Try3d.FloatVars().valueOf(bloomIntensity));
    }
    if(blurScale){
        mat.setParam('blurScale', new Try3d.FloatVars().valueOf(blurScale));
    }
}
function initOther(scene, rootNode, fogColor, gridColor){
    // 雾化
    let fogFilter = scene.getMainCamera().addFilterFromMaterial(new Try3d.Material(scene, {id:'fog', materialDef:Try3d.MaterialDef.parse(Try3d.Internal.S_FOG_FILTER_DEF_DATA)}));
    fogFilter.getMaterial().selectTechnology('LinearFog');
    fogFilter.getMaterial().setParam('vNear', new Try3d.FloatVars().valueOf(scene.getMainCamera().getNear()));
    fogFilter.getMaterial().setParam('vFar', new Try3d.FloatVars().valueOf(scene.getMainCamera().getFar()));
    let bounding = rootNode.getBoundingVolume();
    let d = Math.max(bounding.getXHalf(), Math.max(bounding.getYHalf(), bounding.getZHalf()));
    fogFilter.getMaterial().setParam('fogNear', new Try3d.FloatVars().valueOf(d * 10));
    fogFilter.getMaterial().setParam('fogFar', new Try3d.FloatVars().valueOf(d * 20));
    if(fogColor){
        fogFilter.getMaterial().setParam('fogColor', new Try3d.Vec4Vars().valueFromXYZW(fogColor[0], fogColor[1], fogColor[2], fogColor[3]));
    }

    // 轴网
    var colorDef = Try3d.MaterialDef.parse(Try3d.Internal.S_COLOR_DEF_DATA);
    let grid = new Try3d.Grid(scene, {id:'grid', width:500, height:500, widthSegments:250, heightSegments:250});
    let defaultColor = new Try3d.Material(scene, {id:"defaultColor", materialDef:colorDef});
    if(gridColor){
        defaultColor.setParam('color', new Try3d.Vec4Vars().valueFromXYZW(gridColor[0], gridColor[1], gridColor[2], gridColor[3]));
    }
    else{
        defaultColor.setParam('color', new Try3d.Vec4Vars().valueFromXYZW(0.3, 0.3, 0.3, 1.0));
    }
    grid.setMaterial(defaultColor);
    rootNode.addChildren(grid);
}
function initDirLight(scene, rootNode, lightColor){
    let dirLight = new Try3d.DirectionalLight(scene, {id:'dirLight'});
    dirLight.setDirectionXYZ(-1, -1, 1);
    lightColor = lightColor || [1.0, 1.0, 1.0, 1.0];
    dirLight.setColorRGBA(lightColor[0], lightColor[1], lightColor[2], lightColor[3]);
    rootNode.addChildren(dirLight);
}
function showStats(scene){
    // 使用stats.js统计fps
    let stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);
    scene.on('update', (exTime)=>{
        stats.update();
    });
}
// var blackColorMaterial = new Try3d.Material(window.scene, {id:"blackColorMaterial", colorDef});
