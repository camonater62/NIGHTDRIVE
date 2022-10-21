import * as THREE from 'three';
import {MTLLoader} from './three.js-master/examples/jsm/loaders/MTLLoader.js';
import {OBJLoader} from './three.js-master/examples/jsm/loaders/OBJLoader.js';
import {OrbitControls} from './three.js-master/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from './three.js-master/examples/jsm/loaders/GLTFLoader.js';
import Stats from './stats.js-r17/src/Stats.js'
import {mountainVertexShader, mountainFragmentShader, wireFragmentShader} from './Shader.js'
import {EffectComposer} from './three.js-master/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from './three.js-master/examples/jsm/postprocessing/RenderPass.js';
import {BloomPass} from './three.js-master/examples/jsm/postprocessing/BloomPass.js';
import {AfterimagePass} from './three.js-master/examples/jsm/postprocessing/AfterimagePass.js';
import {GlitchPass} from './three.js-master/examples/jsm/postprocessing/GlitchPass.js';
import {FilmPass} from './three.js-master/examples/jsm/postprocessing/FilmPass.js';
import {SMAAPass} from './three.js-master/examples/jsm/postprocessing/SMAAPass.js';

function main() {
    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.gamma

    const fov = 70;
    const aspect = 2; // the canvas default
    const near = 0.01;
    const far = 10000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    camera.position.set(3, 3, 10);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 3, 0);
    controls.update();

    const scene = new THREE.Scene();

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    // renderPass.renderToScreen = true;
    composer.addPass(renderPass);
    // const smaaPass = new SMAAPass(5120, 2880);
    // smaaPass.renderToScreen = true;
    // composer.addPass(smaaPass);
    // const afterImage = new AfterimagePass(0.5);
    //composer.addPass(afterImage);
     const filmPass = new FilmPass(0.15, 0.15, 480, false);
     filmPass.renderToScreen = true;
     composer.addPass(filmPass);

    const listener = new THREE.AudioListener();
    camera.add(listener);

    const bgm = new THREE.Audio(listener);
    bgm.autoplay = false;

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('./resources/BGM.mp3', function(buffer) {
        bgm.setBuffer(buffer);
        bgm.setLoop(true);
        bgm.setVolume(0.25);
        // bgm.play();
    });

    // Fog
    {
        const color = 0x000;
        const near = 10;
        const far = 250;
        scene.fog = new THREE.Fog(color, near, far);
    }

    // AmbientLight
    {
        const color = 0xffb3ab;
        const intensity = 0.75;
        const light = new THREE.AmbientLight(color, intensity);
        scene.add(light);
    }

    // Debug helper for 3D objects
    function dumpObject(obj, lines = [], isLast = true, prefix = '') {
        const localPrefix = isLast ? '└─' : '├─';
        lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
        const newPrefix = prefix + (isLast ? '  ' : '│ ');
        const lastNdx = obj.children.length - 1;
        obj.children.forEach((child, ndx) => {
            const isLast = ndx === lastNdx;
            dumpObject(child, lines, isLast, newPrefix);
        });
        return lines;
    }

    // Palm Tree
    let trees = [];
    {
        const objLoader = new OBJLoader();
        const mtlLoader = new MTLLoader();
        mtlLoader.load('./resources/Palm Tree/SunshinePalmTree.mtl', (mtl) => {
            mtl.preload();
            for (const material of Object.values(mtl.materials)) {
                material.side = THREE.DoubleSide;
            }
            objLoader.setMaterials(mtl);
            objLoader.load('./resources/Palm Tree/SunshinePalmTree.obj', (root) => {
                root.position.set(0, 0.85, 0);
                root.castShadow = true;
                //root.scale.set(8, 10, 8);
                scene.add(root);
                console.log(dumpObject(root).join('\n'));

                trees.push(root);
                while (trees.length < 20) {
                    const new_tree = root.clone();
                    scene.add(new_tree);
                    trees.push(new_tree);
                }
            });
        });
    }

    // Drifto
    let car;
    let wheels;
    const carShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 4.5),
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.5,
        })
    );
    carShadow.rotation.set(-Math.PI / 2, 0, 0);
    scene.add(carShadow);

    {
        const gltfLoader = new GLTFLoader();
        const url = './resources/Toyota AE86.glb';
        gltfLoader.load(url, (gltf) => {
            const root = gltf.scene;
            root.position.set(2, 0, 8);
            root.rotation.set(0, Math.PI, 0);
            root.scale.set(0.3, 0.3, 0.3);
            scene.add(root);
            root.castShadow = true;
            root.receiveShadow = true;
            car = root;
            wheels = root.getObjectByName('Car');
            console.log(dumpObject(root).join('\n'));
        });
    }


    // UFO
    const UFO = new THREE.Group();
    {
        // Top cone
        {
            const geometry = new THREE.ConeGeometry(10, 3, 8);
            const material = new THREE.MeshPhongMaterial({color: 0x101010});
            const cone = new THREE.Mesh(geometry, material);
            cone.position.set(0, 2, 0);
            UFO.add(cone);
        }
        // Bottom cone
        {
            const geometry = new THREE.ConeGeometry(10, 1, 8);
            const material = new THREE.MeshPhongMaterial({color: 0x100720});
            const cone = new THREE.Mesh(geometry, material);
            cone.position.set(0,0,0);
            cone.rotation.set(Math.PI, 0, 0);
            UFO.add(cone);
        }
        // Goddam TRACTOR BEAM
        {
            const geometry = new THREE.ConeGeometry(10, 60, 30);
            const material = new THREE.MeshBasicMaterial({
                color: 0xddefff,
                transparent: true,
                opacity: 0.05,
                side: THREE.DoubleSide,
            });
            const cone = new THREE.Mesh(geometry, material);
            cone.position.set(0,-20,-15);
            cone.rotation.set(Math.PI / 5, 0, 0);
            UFO.add(cone);
        }
        // Le opening
        {
            const geometry = new THREE.CylinderGeometry(4, 4, 1);
            const material = new THREE.MeshPhongMaterial({
                color: 0x131313,
            });
            const cylinder = new THREE.Mesh(geometry, material);
            cylinder.position.set(0, -0.1, 0);
            UFO.add(cylinder);
        }

        // Orb
        const numOrbs = 18;
        const distance = 6.5;
        for (let i = 0; i < numOrbs; i++) {
            const geometry = new THREE.SphereGeometry(0.5);
            const material = new THREE.MeshBasicMaterial({
                color: 0x9542f5,
            });

            const theta = i / numOrbs * Math.PI * 2;
            const x = distance * Math.cos(theta);
            const z = distance * Math.sin(theta);

            const orb = new THREE.Mesh(geometry, material);
            orb.position.set(x, 0.2, z);
            UFO.add(orb);
        }
    }
    UFO.position.set(0, 30, 60);
    scene.add(UFO);

    // Sky map
    {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            './resources/steeze/right.png',
            './resources/steeze/left.png',
            './resources/steeze/top.png',
            './resources/steeze/bottom.png',
            './resources/steeze/front.png',
            './resources/steeze/back.png',
        ]);

        scene.background = texture;
    }

    // Plane
    let plane;
    {
        const planeHeight = 500;
        const planeWidth = 10;

        // Texture
        const loader = new THREE.TextureLoader();
        const texture = loader.load('./resources/floor.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.LinearMipmapLinearFilter;
        texture.repeat.set(planeWidth / 2, planeHeight / 2);

        const planeGeo = new THREE.BoxGeometry(planeWidth, planeHeight, 5);
        const planeMat = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide,
         //   wireframe: true,
            wireframeLinewidth: 15
        });
        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.receiveShadow = true;
        plane = mesh;
        mesh.rotation.x = Math.PI * -.5;
        mesh.position.y = -2.5;
        scene.add(mesh);
    }

    const uniformValues = {
        uTime: {value: 0},
        uSpeed: {value: 120},
        uScale: {value: 10},
        fogColor: { type: "c", value: scene.fog.color },
        fogNear: { type: "f", value: scene.fog.near },
        fogFar: { type: "f", value: scene.fog.far },
        thickness: {value: 1},
    };

    // Mountains
    let mountains;
    let wires;
    const mountainSegs = [8,10];
    {
        const widthSegments = mountainSegs[0];
        const heightSegments = mountainSegs[1];

        const seg_width = 1.0 / widthSegments;
        const seg_height = 1.0 / heightSegments;

        const vertices = [];
        const indices = [];
        const uvs = [];
        const normals = [];

        /**
         * generate widthSegments by heightSegments grid of vertices centered on origin
         * generate uv's and normals along the way
         * */
        for (let i = 0; i < heightSegments + 1; i++) {
            const y = i * seg_height - 0.5;

            for (let j = 0; j < widthSegments + 1; j++) {
                let x = j * seg_width - 0.5;

                vertices.push(x, -y, 0);

                // facing towards camera at first
                normals.push(0, 0, 1);

                uvs.push(j / widthSegments);
                uvs.push(1 - i / heightSegments);
            }

            for (let i = 0; i < heightSegments; i++) {
                for (let j = 0; j < widthSegments; j++) {
                    let a = j + (widthSegments + 1) * i;
                    let b = j + (widthSegments + 1) * (i + 1);
                    let c = j + 1 + (widthSegments + 1) * (i + 1);
                    let d = j + 1 + (widthSegments + 1) * i;

                    // this indices compose the two triangles that create the square
                    // on the grid at [i,j]
                    indices.push(a, b, d);
                    indices.push(b, c, d);
                }
            }

        }

        const geometry = new THREE.BufferGeometry();
        const positionNumComponents = 3;
        const normalNumComponents = 3;
        const uvNumComponents = 2;
        geometry.setIndex(indices);
        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(vertices), positionNumComponents)
        );
        geometry.setAttribute(
            'normal',
            new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents)
        );
        geometry.setAttribute(
            'uv',
            new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents)
        );

        // Wireframe code from example webgl_materials_wireframe
        const vectors = [
            new THREE.Vector3( 1, 0, 0 ),
            new THREE.Vector3( 0, 1, 0 ),
            new THREE.Vector3( 0, 0, 1 )
        ];

        const position = geometry.attributes.position;
        const centers = new Float32Array( position.count * 3 );

        for (let i = 0, l = position.count; i < l; i++) {
            vectors[i % 3].toArray(centers, i * 3);
        }
        geometry.setAttribute('center', new THREE.BufferAttribute(centers, 3));
        console.log(geometry.attributes.center);

        const cubeShader = new THREE.ShaderMaterial({
            uniforms: uniformValues,
            // Shaders defined in Shader.js
            vertexShader: mountainVertexShader,
            fragmentShader: mountainFragmentShader,
            side: THREE.DoubleSide,
            fog: true,
        //    lights: true,
        });

        const wireframe = new THREE.WireframeGeometry(geometry);

        const wireShader = new THREE.ShaderMaterial({
            uniforms: uniformValues,
            // Shaders defined in Shader.js
            vertexShader: mountainVertexShader,
            fragmentShader: wireFragmentShader,
            side: THREE.DoubleSide,
          //  wireframe: true,
          //  wireframeLinewidth: 50.0,
          //  depthTest: true,
            fog: true,
        //`    lights: true
            alphaToCoverage: true
        });
        wireShader.extensions.derivatives = true;

        const cubeSize = 3;
        // const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        // const cubeMat = new THREE.MeshPhongMaterial({color: '#8AC'});
        const mesh = new THREE.Mesh(geometry, cubeShader);
        wires = new THREE.LineSegments(wireframe, wireShader);
        wires.material.linewidth = 50;
        // mesh.position.set(cubeSize + 1, cubeSize / 2, 0);
        mesh.rotation.set(Math.PI/2, 0, 0);
        wires.rotation.set(Math.PI/2, 0, 0);
        mesh.scale.set(500, 1000, 1); // Z small because rotated
        wires.scale.set(500, 1000, 1); // Z small because rotated
        mesh.position.set(0, -2 + 0.25, 0);
        wires.position.set(0, -2 + 0.25, 0);
        mesh.castShadow = true;
        wires.castShadow = true;
        mesh.receiveShadow = true;
        wires.receiveShadow = true;
        scene.add(mesh);
        scene.add(wires);
        mountains = mesh;

    }

    // Sphere
    {
        const sphereRadius = 500;
        const sphereWidthDivisions = 64;
        const sphereHeightDivisions = 64;
        const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
        // const sphereMat = new THREE.MeshPhongMaterial({color: '#ffc3bb'});
        const sphereMat = new THREE.ShaderMaterial({
            uniforms: {
                color1: {
                    value: new THREE.Color("magenta")
                },
                color2: {
                    value: new THREE.Color("#ffc3bb")
                }
            },
            vertexShader: `
                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color1;
                uniform vec3 color2;

                varying vec2 vUv;

                void main() {
                    gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
                }
            `,
            // wireframe: true
        });
        sphereMat.fog = false;
        const mesh = new THREE.Mesh(sphereGeo, sphereMat);
        mesh.position.set(0, 0, -1200);
        scene.add(mesh);
        const sun2 = mesh.clone();
        sun2.position.set(0, 0, 1200);
        scene.add(sun2);
    }

    // Sun Light
    {
        const color = 0xffb3ab;
        const intensity = 1;
        const light = new THREE.PointLight(color, intensity);
        light.position.set(250, 50, -400);
        light.castShadow = true;
        scene.add(light);
    }

    // DirectionalLight Pink
    {
        const color = 0xff21ae;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(5, 5, -10);
        light.castShadow = true;
        scene.add(light);
    }

    // DirectionalLight Purple
    {
        const color = 0x6814fa;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-5, 5, -10);
        light.castShadow = true;
        scene.add(light);
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const pixelRatio = window.devicePixelRatio;
        const width = canvas.clientWidth * pixelRatio | 0;
        const height = canvas.clientHeight * pixelRatio | 0;
        const needResize = canvas.width !== width || canvas.height !== height;
            composer.setSize(width, height);
        if (needResize) {
            renderer.setSize(width, height, false);
            //composer.setSize(width, height);
        }
        return needResize;
    }

    class PickHelper {
    constructor() {
      this.raycaster = new THREE.Raycaster();
      this.pickedObject = null;
      this.pickedObjectSavedColor = 0;
    }
    pick(normalizedPosition, scene, camera, time=0) {
      // restore the color if there is a picked object
      if (this.pickedObject) {
      //    this.pickedObject.material.wireframe = false;
        this.pickedObject = undefined;
      }

      // cast a ray through the frustum
      this.raycaster.setFromCamera(normalizedPosition, camera);
      // get the list of objects the ray intersected
      const intersectedObjects = this.raycaster.intersectObjects(scene.children);
      if (intersectedObjects.length) {
        // pick the first object. It's the closest one
        this.pickedObject = intersectedObjects[0].object;
       // this.pickedObject.material.wireframe = true;
            this.pickedObject.material.wireframe = !this.pickedObject.material.wireframe;
      }
    }
  }

  const pickPosition = {x: 0, y: 0};
  const pickHelper = new PickHelper();
  clearPickPosition();

    const tractorLight = new THREE.PointLight(0x0077ff, 0.4);
    scene.add(tractorLight);
    tractorLight.castShadow = true;

    const speed = 47;
    let then = 0;
    function render(time) {


        stats.begin();

        time *= 0.001; // convert time to seconds
        const deltaTime = time - then;
        then = time;

        uniformValues.uTime.value = time;
        uniformValues.uScale.value = mountains.scale.y / mountainSegs[1];
        uniformValues.uSpeed.value = speed;

        if (wheels) {
            let alt = [-1, -1, 1, 1];
            let index = 0;
            for (const w of wheels.children) {
                w.rotation.z = speed * time * alt[index];
                index = (index + 1) % alt.length;
            }
        }
        if (car) {
            car.position.x = 1.5 * Math.sin(time * 0.5);
            car.position.z = 2.0 * Math.cos(time * 0.1);

            UFO.position.x = car.position.x +  0 + 5 * Math.sin(time * 1.25);
            UFO.position.z = car.position.z + 45 + 5 * Math.cos(time * 1);

            tractorLight.position.set(UFO.position.x, UFO.position.y, UFO.position.z);
            tractorLight.target = car;

            carShadow.position.set(car.position.x, car.position.y + 0.05, car.position.z);
        }

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        plane.position.z = speed * time % 2.0;
        mountains.position.z =  speed * time % (mountains.scale.y / 10);
        wires.position.z =  speed * time % (mountains.scale.y / 10);

        for (let i = 0; i < trees.length; i++) {
            const tree = trees[i];
            tree.position.y = -2;
            tree.position.z = speed * time + 100 * i;
            tree.position.z = (tree.position.z + 500) % 1000 - 500;
            let offset = -5;
            if (i % 2 == 1) {
                tree.scale.set(-1, 1, 1);
                offset *= -1;
            }
            tree.position.x = offset;
        }

        // pickHelper.pick(pickPosition, scene, camera, time);

        // renderer.render(scene, camera);
        composer.render(deltaTime);

        stats.end();

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function getCanvasRelativePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width  / rect.width,
      y: (event.clientY - rect.top ) * canvas.height / rect.height,
    };
  }

  function setPickPosition(event) {
    const pos = getCanvasRelativePosition(event);
    pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
    pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
  }

  function clearPickPosition() {
    // unlike the mouse which always has a position
    // if the user stops touching the screen we want
    // to stop picking. For now we just pick a value
    // unlikely to pick something
    pickPosition.x = 100000;
    pickPosition.y = 100000;
  }
  window.addEventListener('mousemove', setPickPosition);
  window.addEventListener('mouseout', clearPickPosition);
  window.addEventListener('mouseleave', clearPickPosition);
  let drag = false;
  window.addEventListener('mousedown', function() {
    drag = false;
  });
    window.addEventListener('mousemove', function() {
        drag = true;
    });

    window.addEventListener('mouseup', function() {
        if (!drag) {
            pickHelper.pick(pickPosition, scene, camera);
        }
    });

    window.addEventListener('keyup', function(ev) {
        if (ev.keyCode === 32) {
            // Space
            if (bgm.isPlaying) {
                bgm.pause();
            } else {
                bgm.play();
            }
        }
    });

}

main();
