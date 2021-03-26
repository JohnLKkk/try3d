# TEORT_WebGL

#### 介绍
这是我在名为TEORT系列项目的WebGL的一次尝试，出于好玩，该项目主要是我近期研究的一些新思路而设计而成的渲染器。目前，该渲染器还在初期阶段，但以包含一些可见成果。最初该项目作为私人项目托管在gite上，现在我同时将其更新到github上。

#### 特性
1.  基本
    1.  场景管理
        1.  基于场景图
        2.  基于Component
    2.  纹理映射
        1.  支持多通道uv
        2.  支持lightMap
        3.  支持主流的纹理映射(法线映射，视察映射，AO等等，主要跟材质相关，这里的设计是支持多通道uv，以便可以自由使用所需要的映射通道)
    3.  优化
        1.  默认下,对场景使用FrustumCulling(一种快速的方案,注意,物体默认使用AABBBounding,你也可以修改为其他BoundingVolume)
        2.  可以为指定的节点添加OctCullingControl,这将对其节点(该节点下的所有物体)使用Octree加速过滤(不会与默认的FrustumCulling冲突)
        3.  可以为物体(通常是继承自Geometry的节点)添加LodControl,这将获得“细节层次过滤”,注意,目前未集成创建Lod数据的API(理论上,不应该在web上实现这个,所以这里我假设数据是建模阶段完成的)
        4.  遮挡剔除(目前删掉了软件遮挡剔除和硬件遮挡剔除,我认为这实现不好,所以还有待改进这一步)
        5.  实例化渲染(预计封装实例化渲染,以便可以方便进行数据实例化,对于动画,目前不能使用实例化)
        6.  改进的batch技术(预计实现一种改进思路的batch技术,以便在webGL上实现上千亿几何渲染并同时保证其移动性和光照)
        7.  纹理流(原本计划这一块,但是留到下一个项目再尝试)
    3.  一些常用
        1.  FirstPersonController(用于漫游)
        2.  Path(实现路径动画)
        3.  自动计算和修复Tangents(以便渲染需要)
        4.  没有依赖其他数学库,而是自己封装的一套(尽可能独立)
    4.  支持的外部格式
        1.  支持GLTF模型
        2.  支持OBJ模型
2.  多渲染路径(这部分未独立抽象封装,预计加入LightPrePass和Forward+)
    1.  Forward
    2.  Deferred
3.  Material定义
    1.  对比其他WebGL渲染器,提供更良好自定义材质定义的接口,以便使用者可以更加方便的定义材质
    2.  一个Material定义可以包含多个技术块(Technology),以便在实现在不同策略需求下的技术支持
    3.  一个技术块(Technology)可以包含多个渲染块(SubPass),每个渲染块可以指定其所使用的渲染路径(RenderPath),以便实现高级复杂的渲染需要
    4.  一个渲染块(SubPass)可以包含多个渲染阶段(Pass),复杂的渲染通常需要多阶段渲染
    5.  一个渲染阶段(Pass)可以指定其渲染状态,以便在指定渲染状态下完成渲染
    6.  一个材质定义可以包含自定义全局变量,这些全局变量在整个渲染器都可以被访问,所以可以在不同的Material之间共享并访问
4.  Material
    1.  内置了多个材质定义,以便提供常用的材质实例构建需要
    2.  BasicLightingDef,用于兼容旧时代的光照需要
    3.  PrincipledLightingDef,用于创建次世代的光照需要
4.  光照
    1.  支持DirectionalLight,PointLight,SpotLight(预计加入AreaLight)
    2.  支持RefProbe(反射探头)和GIProbe(光探头),但目前未实现探针混合(实际上我实现过,不过效果不佳,所以不使用该方案)
    3.  支持SinglePass和MultiPass完成多光源渲染
    4.  对光源管理,使得你可以很方便的操作灯光,以及在着色器中访问灯光信息(这需要高级部分,你可能需要检查MaterialDef的定义方法)
5.  阴影(目前未实现)
    1.  预计实现CSM和PSSM
    2.  预计加入PCF和其他过滤方式
    3.  预计实现PreShadow和PostShadow
6.  动画
    1.  支持属性动画，形变动画和骨骼动画(硬件)
    2.  多动画剪辑，多动画通道以及动画混合
    3.  附件绑定，你可以将装备或附件附加到指定关节上
7.  地形(待实现)
    1.  预计加入基于QuadTree和TerrainLod的地形管理
    2.  预计加入基于多数据来源(heightmap,噪声图,alphamap,分型数据)创建地形
    3.  预计加入多通道混合创建地形,以便创建包含植被,道路,河流覆盖的地形纹理

#### 安装教程

1.  目前,仅打包了普通的js包,意味着你只能通过script标签引入该库
2.  你也可以clone该项目,然后使用webpack打包为amd或umd库

#### 使用说明

1.  以下是一个快速使用案例:
    1.  由于这是WebGL(意味着在Web上面运行),你需要提供渲染设备(通常是Canvas):
        ```html
        <div style="width: 40%;height: 100%;position:fixed">
                <canvas id="canvas" style="position:absolute;left: 0px;top: 0px;background-color: aliceblue" tabindex="0"></canvas>
            </div>
        ```
    2.  然后创建一个场景(Scene),并将场景加入到渲染器中,然后启动渲染器:
        ```javascript
        let scene = new Scene({cavnas:document.getElementById('canvas')});
        let renderEngine = new RenderEngine();
        renderEngine.addScene(scene);
        renderEngine.launch();
        ```
    3.  此时,canvas应该显示为灰色(默认clearColor为灰色),你现在可以添加渲染实例到场景中了,为了方便管理,我添加了如下的数据(其中名为rootNode作为根节点,然后添加一个geometry,注意需要为该geometry):
        ```javascript
        
        // 创建一个geometry
        let geometry = new Geometry(scene, {id:'testGeometry'});
    
        // 为该geometry创建其mesh
        let mesh = new Mesh();
        mesh.setData(Mesh.S_POSITIONS, [
            -5, 5, 0,
            -5, -5, 0,
            5, 5, 0,
            5, -5, 0
        ]);
        mesh.setData(Mesh.S_INDICES, [
            0, 1, 2,
            1, 2, 3
        ]);
        // 绑定geometry的mesh
        geometry.setMesh(mesh);
        geometry.updateBound();
    
        // 加载一个材质定义
        let materialDef = MaterialDef.load("./MyDef");
        // 创建一个材质
        let mat = new Material(scene, {id:"colorMat", materialDef});
        // 设置geometry使用的材质
        geometry.setMaterial(mat);
        
        // 创建一个根节点
        let rootNode = new Node(scene, {id:'rootNode'});
        // 将geometry添加为rootNode的子节点
        rootNode.addChildren(geometry);
        ```
    4.  你还需要将渲染数据加入到scene中,否则,这些数据仅仅只是创建而不参与渲染:
        ```javascript
        scene.addSceneNode(rootNode);
        ```
2.  关于更多细节,请检查wiki
3.  还可以参考examples
#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request


#### 联系我

如果你有好玩的点或者想找我吐槽技术,可以通过如下方式与我联系:
1.  qq:1724624287
2.  email:18402012144@163.com
3.  wechat:18402012144

