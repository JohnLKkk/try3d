# TEORT_WebGL

#### Description
This is my attempt at WebGL called TEORT series project. For fun, this project is mainly a renderer designed by some new ideas that I recently researched. Currently, the renderer is still in its infancy, but it contains some visible results. Initially the project was hosted on gite as a private project, now I also update it to github.

#### Software Architecture
1. Basic
    1. Scene management
        1. Based on the scene graph
        2. Based on Component
    2. Texture mapping
        1. Support multi-channel uv
        2. Support lightMap
        3. Support mainstream texture mapping (normal mapping, inspection mapping, AO, etc., mainly related to materials, the design here is to support multi-channel uv, so that you can freely use the required mapping channels)
    3. Optimization
        1. By default, FrustumCulling is used for the scene (a quick solution, note that the object uses AABBBounding by default, you can also modify it to other BoundingVolume)
        2. You can add OctCullingControl to the specified node, which will use Octree accelerated filtering on its node (all objects under the node) (will not conflict with the default FrustumCulling)
        3. LodControl can be added to the object (usually a node inherited from Geometry), which will obtain "level of detail filtering". Note that the API for creating Lod data is not currently integrated (in theory, this should not be implemented on the web, so here I assume that the data is completed in the modeling phase)
        4. Occlusion culling (software occlusion culling and hardware occlusion culling are currently deleted, I think this implementation is not good, so there is still room for improvement)
        5. Instantiation rendering (it is expected to encapsulate instantiation rendering so that data instantiation can be facilitated. For animation, instantiation cannot currently be used)
        6. Improved batch technology (it is expected to implement an improved batch technology to achieve hundreds of billions of geometric rendering on webGL and ensure its mobility and lighting at the same time)
        7. Texture flow (originally planned this one, but save it to the next project and try again)
    3. Some commonly used
        1. FirstPersonController (for roaming)
        2. Path (implement path animation)
        3. Automatic calculation and repair of Tangents (so that it is needed for rendering)
        4. There is no dependence on other math libraries, but a set of self-packaged (as independent as possible)
    4. Supported external formats
        1. Support GLTF model
        2. Support OBJ model
2. Multiple rendering paths (this part is not independently abstracted and packaged, and it is expected to join LightPrePass and Forward+)
    1. Forward
    2. Deferred
3. Material definition
    1. Compared with other WebGL renderers, provide a better interface for customizing material definitions so that users can define materials more conveniently
    2. A Material definition can contain multiple technology blocks (Technology) in order to achieve technical support under different strategic requirements
    3. A technology block (Technology) can contain multiple rendering blocks (SubPass), and each rendering block can specify the rendering path (RenderPath) it uses to achieve advanced and complex rendering needs
    4. A rendering block (SubPass) can contain multiple rendering stages (Pass), and complex rendering usually requires multi-stage rendering
    5. A rendering stage (Pass) can specify its rendering state to complete the rendering in the specified rendering state
    6. A material definition can contain custom global variables. These global variables can be accessed throughout the renderer, so they can be shared and accessed between different materials
4. Material
    1. Built-in multiple material definitions to provide common material instance construction needs
    2. BasicLightingDef, used to be compatible with the lighting needs of the old age
    3. PrincipledLightingDef, used to create next-generation lighting needs
4. Light
    1. Support DirectionalLight, PointLight, SpotLight (Expected to join AreaLight)
    2. Supports RefProbe (reflection probe) and GIProbe (light probe), but probe mixing is not currently implemented (actually I did it, but the effect is not good, so I don't use this solution)
    3. Support SinglePass and MultiPass to complete multi-light source rendering
    4. The light source management allows you to easily operate the light and access the light information in the shader (this requires an advanced part, you may need to check the definition method of MaterialDef)
5. Shadows (currently not implemented)
    1. Expected to achieve CSM and PSSM
    2. PCF and other filtering methods are expected to be added
    3. Expected to achieve PreShadow and PostShadow
6. Animation
    1. Support attribute animation, deformation animation and skeletal animation (hardware)
    2. Multiple animation clips, multiple animation channels and animation mixing
    3. Attachment binding, you can attach equipment or accessories to designated joints
7. Terrain (to be implemented)
    1. It is expected to join terrain management based on QuadTree and TerrainLod
    2. It is expected to add terrain based on multiple data sources (heightmap, noise map, alphamap, sub-type data)
    3. It is expected to add multi-channel mixing to create terrain in order to create a terrain texture that includes vegetation, roads, and rivers.

#### Installation

1. At present, only ordinary js packages are packaged, which means you can only import the library through the script tag
2. You can also clone the project, and then use webpack to package it as an amd or umd library

#### Instructions

1. The following is a quick use case:
    1. Since this is WebGL (meaning it runs on the Web), you need to provide a rendering device (usually Canvas):
        ```html
        <div style="width: 40%;height: 100%;position:fixed">
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
    3. At this point, the canvas should be grayed out (the default clearColor is gray), you can now add a rendering instance to the scene, for the convenience of management, I added the following data (named rootNode as the root node, and then add a geometry, pay attention to the geometry):
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
    
        // Load a material definition
        let materialDef = MaterialDef.load("./MyDef");
        // Create a material
        let mat = new Material(scene, {id:"colorMat", materialDef});
        // Set the material used by the geometry
        geometry.setMaterial(mat);
        
        // Create a root node
        let rootNode = new Node(scene, {id:'rootNode'});
        // Add geometry as a child node of rootNode
        rootNode.addChildren(geometry);
        ```
    4. You also need to add the rendering data to the scene, otherwise, these data are just created without participating in the rendering:
        ```javascript
        scene.addSceneNode(rootNode);
        ```
2. For more details, please check the wiki
3. You can also refer to examples

#### Contribution

1.  Fork the repository
2.  Create Feat_xxx branch
3.  Commit your code
4.  Create Pull Request


#### Contact me

If you have fun or want to talk to me about technology, you can contact me in the following ways:
1. qq:1724624287
2. email:18402012144@163.com
3. wechat:18402012144
