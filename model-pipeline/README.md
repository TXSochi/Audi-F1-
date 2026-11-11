# Model pipeline

How `public/model/car.glb` was made from the 71 MB `AudiF1.glb` (1.48 M triangles, 4K textures):

1. `opt2.mjs` welds and simplifies the mesh to about 170 k triangles and finds the four wheels.
2. `split.mjs` cuts the wheels out as separate nodes (so they can spin), quantises everything and writes `car.glb` (about 4 MB).
3. `tex.mjs` resizes the three textures and writes them as WebP.

Needs `@gltf-transform/core`, `@gltf-transform/functions`, `@gltf-transform/extensions`, `meshoptimizer` and `sharp`. Paths inside the scripts point at the original working folders, adjust them before running.
