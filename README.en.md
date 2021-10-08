# try3D

#### Description
Officially named Try3d.js (Early TEORT_WebGL), it is my first attempt on webGL. Some functions have not yet been implemented (see the list of pending improvements below). This renderer contains some popular and currently popular technologies. I referenced some engines, and tried to design a high-level material system, as well as the initial implementation of the CorePipeline architecture.

#### Showcase

![image](https://gitee.com/JoyClm/try3d/tree/master/Screenshot/a.jpg)
![image](https://gitee.com/JoyClm/try3d/tree/master/Screenshot/b.jpg)
![image](https://gitee.com/JoyClm/try3d/tree/master/Screenshot/c.jpg)
![image](https://gitee.com/JoyClm/try3d/tree/master/Screenshot/d.jpg)
![image](https://gitee.com/JoyClm/try3d/tree/master/Screenshot/e.jpg)

#### Features
1. Basic
    1. Scene management
        1. Based on the scene graph
        2. Based on Component
    2. Optimization
        1. By default, FrustumCulling is used for the scene
        2. You can add OctCullingControl to the specified node, which will use Octree accelerated filtering on its node (all objects under the node) (will not conflict with the default FrustumCulling)
        3. LodControl can be added to the object (usually a node inherited from Geometry), which will obtain "level of detail filtering". Note that the API for creating Lod data is not currently integrated (in theory, this should not be implemented on the web, so here I assume that the data is completed in the modeling phase)
        4. Occlusion culling (currently deleted, this step needs to be improved)
        5. Material combined rendering and shaderHash cache
        6. Instantiation rendering (to be implemented, it is expected to encapsulate instantiation rendering so that data instantiation can be facilitated. For animation, instantiation cannot currently be used)
        7. Improved batch technology, which is expected to realize an improved batch technology (to be implemented)
        8. VirtualTexture (to be implemented)
    3. Some commonly used
        1. FirstPersonController
        2. SceneBrowsingController
        3. Automatic calculation and repair of Tangents (so that it is needed for rendering)
        4. There is no dependence on other math libraries, but a set of self-packaged (as independent as possible)
    4. Supported external formats
        1. Support glTF model (including animation, several core materials expanded)
        2. Support Obj model
2. Pipeline
    1. CorePipeline
        1. Support several mainstream RenderPipeline (including Forward, ForwardPlus (to be implemented), Deferred, TileDeferred, Clustered (to be implemented))
        2. Support several RenderPrograms (including SinglePass, MultiPass, etc.)
        3. Supports mixed pipelines, which can include the above-mentioned combined pipelines in one frame of rendering at the same time
    2. ShadowPipeline
        1. Independent ShadowPipeline, to facilitate the separation of CorePipeline, can make any material (even user-defined simple output color material definition) can get Shadow
        2. Shadow Cast collection cropping and Receiver collection cropping
        3. Real-time shadow based on Pssm
    3. FilterPipeline
        1. Separate PostFilter from CorePipeline, so that PostFilter can be as unaffected by CorePipeline as possible
        2. Built-in several common PostFilter (BloomFilter, DofFilter, FogFilter, FxaaFilter, etc.)
3. MaterialDef
    1. Compared with other WebGL renderers, provide a better interface for customizing material definitions so that users can define materials more conveniently
    2. A Material definition can contain multiple technology blocks (Technology) in order to achieve technical support under different strategic requirements
    3. A technology block (Technology) can contain multiple rendering blocks (SubPass), and each rendering block can specify the rendering path (RenderPath) it uses to achieve advanced and complex rendering needs
    4. A rendering block (SubPass) can contain multiple rendering stages (Pass), and complex rendering usually requires multi-stage rendering
    5. A rendering stage (Pass) can specify its rendering state to complete the rendering in the specified rendering state
    6. A material definition can contain custom global variables. These global variables can be accessed throughout the renderer, so they can be shared and accessed between different materials
4. Material
    1. Built-in multiple material definitions to provide common material instance construction needs
    2. BasicLightingDef, used for experience lighting
    3. PrincipledLightingDef, a lighting model based on a more realistic brdf implementation
    4. There are also some commonly used built-in materials, including ColorDef, etc.
4. Light
    1. Support DirectionalLight, PointLight, SpotLight
    2. RefProbe (reflection probe, to be added) and GIProbe (optical probe, only the global GI probe is realized, and the hybrid GI probe is to be realized)
    3. Realized global illumination based on IBL, LPV (to be implemented)
    4. Support SinglePass and MultiPass to complete multi-light source rendering
    5. Light source cutting, including fast cone culling and light cone cutting
    6. To manage the light source, you can easily operate the light and access the light information in the shader
5. Shadow
    1. Support Pssm real-time shadow, support point shadow and spot shadow
    2. Built-in basic soft shadow filtering
    3. The custom material written by the user does not need to include the function logic of shadow or lighting, and Shadow is processed in a separate pipeline
6. Animation
    1. Support node animation and skeletal animation (hardware skinning)
    2. Multiple animation clips, multiple animation channels and animation mixing (to be implemented)
    3. Attachment binding, you can attach equipment or accessories to designated joints (to be tested)
7. Terrain (to be implemented)
    1. It is expected to join terrain management based on QuadTree and TerrainLod
    2. It is expected to add terrain based on multiple data sources (heightmap, noise map, alphamap, sub-type data)
    3. It is expected to add multi-channel mixing to create terrain in order to create a terrain texture that includes vegetation, roads, and rivers.

#### Installation tutorial

1. At present, only ordinary js packages are packaged, which means you can only import the library through the script tag
2. You can also clone the project, and then use webpack to package it as an amd or umd library

#### Instructions for use

1. The following is a quick use case:
    1. Add a Canvas:
        ```html
        <div style="width: 100%;height: 100%;position:fixed">
                <canvas id="canvas" style="position:absolute;left: 0px;top: 0px;background-color: aliceblue" tabindex="0"></canvas>
            </div>
        ```
    2. Then create a scene (Scene), add the scene to the renderer, and then start the renderer:
        ```javascript
        let scene = new Scene({cavnas:document.getElementById('canvas')});
        let renderEngine = new RenderEngine();
        renderEngine.addScene(scene);
        renderEngine.launch();
        ```
    3. At this point, the canvas should be grayed out (the default clearColor is gray), you can now add a rendering instance to the scene, in order to facilitate management, I added the following data (named rootNode as the root node, and then add a geometry, note that it needs to be the geometry):
        ```javascript
        
        // Create a geometry
        let geometry = new Geometry(scene, {id:'testGeometry'});
    
        // Create its mesh for this geometry
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
        // bind geometry mesh
        geometry.setMesh(mesh);
        geometry.updateBound();
    
        // Load a material definition (load your custom material definition or built-in system)
        let materialDef = MaterialDef.load("./MyDef");
        // Create a material instance according to the material definition
        let mat = new Material(scene, {id:"myMat", materialDef});
        // Set the material used by the geometry
        geometry.setMaterial(mat);
        // Set material parameters
        mat.setParam('color', new Vec4Vars().valueFromXYZW(0.5, 1.0, 0.5, 1.0));
        
        // Create a root node
        let rootNode = new Node(scene, {id:'rootNode'});
        // Add geometry as a child node of rootNode
        rootNode.addChildren(geometry);
        ```
    4. You also need to add the rendering data to the scene, otherwise, these data are just created without participating in the rendering:
        ```javascript
        scene.addSceneNode(rootNode);
        ```
2. A simple MaterialDef:
     ```javascript
        #type module
        // There are two material definition methods
        // #type module indicates that the material definition is organized in a modular manner and must be the first line of the material definition
        // If it is not a modular definition, you do not need to add this line
        
        
        
        // A simple material definition
        // Demonstrates how to write a material definition
        // Note that if your material definition, SubTechnology is completely consistent with the hashId calculated by another material definition, the system will automatically select the last one
        // So, it is best to set a path name for your material definition that is unlikely to conflict
        // Define the material name as My/ColorDef
        Def My/ColorDef{
            // Define material parameters
            Params{
                vec4 color;
            }
            // Define a structure called info
            Vars info{
                vec4 wPosition;
            }
            // Define a set of function libraries
            // It can also be packaged separately into other files and then imported
            Functions test{
        
                // This function is used to transform coordinates
                void transformPosition(){
                    // Pass the world coordinates to the wPosition variable in the info structure
                    info.wPosition = Context.ModelMatrix * vec4(Context.InPosition, 1.0f);
                    Context.OutPosition = Context.ProjectMatrix * Context.ViewMatrix * info.wPosition;
                }
        
                // A function to output color
                void drawColor(){
                    // Directly output to the Context.OutColor variable
                    // Of course, you can also return the function value and set the return target
                    Context.OutColor = mix(Params.color, info.wPosition, 0.5f);
                }
            }
        
            // Define a SubTechnology
            // A material definition can contain multiple SubTechnology
            // Each SubTechnology represents a shading Pass
            SubTechnology ColorPass{
                // Specify the main function of VertexShader
                Vs_Shader:test.transformPosition;
                // Specify the main function of FragmentShader
                Fs_Shader:test.drawColor;
            }
        
            // Define the Technology used by default
            // When Technology does not specify a name, define the Technology that is enabled by default for the material
            Technology{
                // A Technology can contain multiple Sub_Pass
                // Each Sub_Pass can specify the Pipeline where it is rendered
                Sub_Pass{
                    // Each Sub_Pass can contain multiple Passes
                    // Each Pass can set the state required for its rendering
                    // If you don't need to set the rendering state
                    Pass ColorPass{
        
                    }
                }
            }
        }
     ```
3. For more details, please refer to examples
#### Participate in Contribution

1. Fork this warehouse
2. Create new Feat_xxx branch
3. Submit the code
4. New Pull Request


#### contact me

If you have fun or want to talk to me about technology, you can contact me in the following ways:
1. wechat:18402012144
2. email:18402012144@163.com
