# try3D

#### 介绍
正式命名为Try3d.js(早期为TEORT_WebGL),是我在webGL上的一次尝试,有一些功能尚未实现(可以查看下面的待完善清单),这个渲染器包含一些曾经流行且目前流行的一些技术,我参考了一些引擎,并尝试设计高层材质系统,以及CorePipeline架构的初步实现。

#### 展示

![image](https://github.com/JohnLKkk/try3d/tree/master/Screenshot/a.jpg)
![image](https://github.com/JohnLKkk/try3d/tree/master/Screenshot/b.jpg)
![image](https://github.com/JohnLKkk/try3d/tree/master/Screenshot/c.jpg)
![image](https://github.com/JohnLKkk/try3d/tree/master/Screenshot/d.jpg)
![image](https://github.com/JohnLKkk/try3d/tree/master/Screenshot/e.jpg)


#### 特性
1.  基本
    1.  场景管理
        1.  基于场景图
        2.  基于Component
    2.  优化
        1.  默认下,对场景使用FrustumCulling
        2.  可以为指定的节点添加OctCullingControl,这将对其节点(该节点下的所有物体)使用Octree加速过滤(不会与默认的FrustumCulling冲突)
        3.  可以为物体(通常是继承自Geometry的节点)添加LodControl,这将获得“细节层次过滤”,注意,目前未集成创建Lod数据的API(理论上,不应该在web上实现这个,所以这里我假设数据是建模阶段完成的)
        4.  遮挡剔除(目前删掉了,有待改进这一步)
        5.  材质合并渲染与shaderHash缓存
        6.  实例化渲染(待实现,预计封装实例化渲染,以便可以方便进行数据实例化,对于动画,目前不能使用实例化)
        7.  改进的batch技术,预计实现一种改进思路的batch技术(待实现)
        8.  VirtualTexture(待实现)
    3.  一些常用
        1.  FirstPersonController
        2.  SceneBrowsingController
        3.  自动计算和修复Tangents(以便渲染需要)
        4.  没有依赖其他数学库,而是自己封装的一套(尽可能独立)
    4.  支持的外部格式
        1.  支持glTF模型(包括动画,拓展的几种核心材质)
        2.  支持Obj模型
2.  Pipeline
    1.  CorePipeline
        1.  支持几种主流RenderPipeline(包含Forward,ForwardPlus(待实现),Deferred,TileDeferred,Clustered(待实现))
        2.  支持几种RenderProgram(包含SinglePass,MultiPass等)
        3.  支持混合Pipeline,可以同时在一帧渲染中包含以上提到的组合Pipeline
    2.  ShadowPipeline
        1.  独立ShadowPipeline,以便于CorePipeline分离,可以使得任意材质(即使是用户自定义的简单输出颜色的材质定义)下都可以获得Shadow
        2.  阴影Cast集合裁剪与Receiver集合裁剪
        3.  基于Pssm实时阴影
    3.  FilterPipeline
        1.  将PostFilter独立于CorePipeline,以便使得PostFilter可以尽可能不受CorePipeline影响
        2.  内置几种常见的PostFilter(BloomFilter,DofFilter,FogFilter,FxaaFilter等)
3.  MaterialDef
    1.  对比其他WebGL渲染器,提供更良好自定义材质定义的接口,以便使用者可以更加方便的定义材质
    2.  一个Material定义可以包含多个技术块(Technology),以便在实现在不同策略需求下的技术支持
    3.  一个技术块(Technology)可以包含多个渲染块(SubPass),每个渲染块可以指定其所使用的渲染路径(RenderPath),以便实现高级复杂的渲染需要
    4.  一个渲染块(SubPass)可以包含多个渲染阶段(Pass),复杂的渲染通常需要多阶段渲染
    5.  一个渲染阶段(Pass)可以指定其渲染状态,以便在指定渲染状态下完成渲染
    6.  一个材质定义可以包含自定义全局变量,这些全局变量在整个渲染器都可以被访问,所以可以在不同的Material之间共享并访问
4.  Material
    1.  内置了多个材质定义,以便提供常用的材质实例构建需要
    2.  BasicLightingDef,用于经验光照
    3.  PrincipledLightingDef,基于更加真实的brdf实现的光照模型
    4.  还有一些常用的内置材质,包括ColorDef等
4.  光照
    1.  支持DirectionalLight,PointLight,SpotLight
    2.  RefProbe(反射探头,待添加)和GIProbe(光探头,只实现了全局GI探头,待实现混合GI探头)
    3.  实现了基于IBL的全局光照,LPV(待实现)
    4.  支持SinglePass和MultiPass完成多光源渲染
    5.  光源裁剪,包括快速锥体剔除与光锥裁剪
    6.  对光源管理,使得你可以很方便的操作灯光,以及在着色器中访问灯光信息
5.  阴影
    1.  支持Pssm实时阴影,支持点阴影与聚光阴影
    2.  内置了基本的软阴影过滤
    3.  用户编写的自定义材质不需要包含阴影或光照的函数逻辑,Shadow在独立Pipeline处理
6.  动画
    1.  支持节点动画和骨骼动画(硬件蒙皮)
    2.  多动画剪辑，多动画通道以及动画混合(待实现)
    3.  附件绑定，你可以将装备或附件附加到指定关节上(待测试)
7.  地形(待实现)
    1.  预计加入基于QuadTree和TerrainLod的地形管理
    2.  预计加入基于多数据来源(heightmap,噪声图,alphamap,分型数据)创建地形
    3.  预计加入多通道混合创建地形,以便创建包含植被,道路,河流覆盖的地形纹理

#### 安装教程

1.  通过script标签引入该库
2.  通过npm install try3d

#### 使用说明

1.  以下是一个快速使用案例:
    1.  添加一个Canvas:
        ```html
        <div style="width: 100%;height: 100%;position:fixed">
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
    
        // 加载一个材质定义(加载你自定义的材质定义或系统内置的)
        let materialDef = MaterialDef.load("./MyDef");
        // 根据材质定义创建一个材质实例
        let mat = new Material(scene, {id:"myMat", materialDef});
        // 设置geometry使用的材质
        geometry.setMaterial(mat);
        // 设置材质参数
        mat.setParam('color', new Vec4Vars().valueFromXYZW(0.5, 1.0, 0.5, 1.0));
        
        // 创建一个根节点
        let rootNode = new Node(scene, {id:'rootNode'});
        // 将geometry添加为rootNode的子节点
        rootNode.addChildren(geometry);
        ```
    4.  你还需要将渲染数据加入到scene中,否则,这些数据仅仅只是创建而不参与渲染:
        ```javascript
        scene.addSceneNode(rootNode);
        ```
2.  一个简单的MaterialDef:
     ```javascript
        #type module
        // 有两种材质定义方式
        // #type module表示该材质定义以模块化方式组织,必须是材质定义的第一行
        // 如果不是模块化定义,则不必添加该行
        
        
        
        // 一个简单的材质定义
        // 演示了如何编写一个材质定义
        // 注意,如果你的材质定义,SubTechnology完全与另一个材质定义计算的hashId一致,系统会自动选择最后一次那个
        // 所以,最好为你的材质定义设置一个不太可能冲突的路径名
        // 定义材质名为My/ColorDef
        Def My/ColorDef{
            // 定义材质参数
            Params{
                vec4 color;
            }
            // 定义一个名为info的结构体
            Vars info{
                vec4 wPosition;
            }
            // 定义一组函数库
            // 也可以单独封装到其他文件然后引入
            Functions test{
        
                // 这个函数用于变换坐标
                void transformPosition(){
                    // 将世界坐标传递到info结构体中的wPosition变量
                    info.wPosition = Context.ModelMatrix * vec4(Context.InPosition, 1.0f);
                    Context.OutPosition = Context.ProjectMatrix * Context.ViewMatrix * info.wPosition;
                }
        
                // 一个输出颜色的函数
                void drawColor(){
                    // 直接输出到Context.OutColor变量
                    // 当然,也可以返回函数值并设置返回target
                    Context.OutColor = mix(Params.color, info.wPosition, 0.5f);
                }
            }
        
            // 定义一个SubTechnology
            // 一个材质定义可以包含多个SubTechnology
            // 每个SubTechnology表示一个shading Pass
            SubTechnology ColorPass{
                // 指定VertexShader的主函数
                Vs_Shader:test.transformPosition;
                // 指定FragmentShader的主函数
                Fs_Shader:test.drawColor;
            }
        
            // 定义默认使用的Technology
            // 当Technology没有指定名称时,则为该材质定义默认启用的Technology
            Technology{
                // 一个Technology可以包含多个Sub_Pass
                // 每个Sub_Pass可以指定其渲染所在的Pipeline
                Sub_Pass{
                    // 每个Sub_Pass可以包含多个Pass
                    // 每个Pass可以设置其渲染所需的状态
                    // 如果不需要渲染状态设置
                    Pass ColorPass{
        
                    }
                }
            }
        }   
     ```
3.  关于更多细节,请参考examples
#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request


#### 联系我

如果你有好玩的点或者想找我吐槽技术,可以通过如下方式与我联系:
1.  wechat:18402012144
2.  email:18402012144@163.com
