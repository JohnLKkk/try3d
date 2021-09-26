window.onload = ()=>{
    if(window.Try3d){
        var colorDef = Try3d.MaterialDef.parse(Try3d.Internal.S_COLOR_DEF_DATA);
        let grid = new Try3d.Grid(scene, {id:'grid', width:100, height:100, widthSegments:100, heightSegments:100});
        let defaultColor = new Try3d.Material(scene, {id:"defaultColor", materialDef:colorDef});
        grid.setMaterial(defaultColor);
        rootNode.addChildren(grid);
    }
};

// var blackColorMaterial = new Try3d.Material(window.scene, {id:"blackColorMaterial", colorDef});
