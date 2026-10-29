/* ==========================================================================
 * Data Systems Explainer — 30 s three.js + GSAP motion-graphics PoC
 *
 *   Scene 1  0–7 s    Glass polyhedron in an instanced GLSL particle cloud
 *   Scene 2  7–18 s   Polyhedron fractures, camera dives into a tunnel of
 *                     pulsing data lines and titanium hex rings (DOF)
 *   Scene 3  18–26 s  Pull back + orbital sweep over a grid of metallic nodes
 *                     on a reflective floor carrying light pulses
 *   Scene 4  26–30 s  Lock-in to the isometric angle (12,12,12) + CTA
 *
 * Rules (see .claude/skills/video-house-style):
 *   - Every frame is a pure function of t: one paused GSAP timeline is seeked
 *     to t, then applyState(t) derives the scene from it. No Date.now, no
 *     unseeded random, no accumulated state.
 *   - window.render(t), window.DURATION, window.FPS, window.ready for
 *     deterministic frame capture (scripts/capture.mjs). ?capture = 1920×1080.
 *   - ?debug shows the self-check report, ?t=12.5 starts at a given time.
 * ========================================================================== */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* --------------------------------------------------------------------------
 * 0. Config
 * ------------------------------------------------------------------------ */
const DURATION = 30;
const FPS = 60;

const params = new URLSearchParams(location.search);
const CAPTURE = params.has('capture');
const DEBUG = params.has('debug');
const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const START_T = clamp(parseFloat(params.get('t')) || 0, 0, DURATION);

// One palette per video; the warm accent is the only saturated colour.
const PAL = {
  obsidian: new THREE.Color('#0d0f12'),
  accent: new THREE.Color('#e9a865'), // warm amber
  key: new THREE.Color('#fff4e6'),
  rim: new THREE.Color('#a6c8ff'),
  ambient: new THREE.Color('#111622'),
  steel: new THREE.Color('#8fa3bd'),
};

const CORE = new THREE.Vector3(0, 0, -140); // centre of scenes 3–4
const FLOOR_Y = -7;
const ISO_RADIUS = Math.hypot(12, 12);      // horizontal distance of (12,12,12)

const SCENES = [
  { name: 'Concept', start: 0, hold: 5.2 },
  { name: 'Process', start: 7, hold: 13.5 },
  { name: 'Scale', start: 18, hold: 23.6 },
  { name: 'Resolve', start: 26, hold: 29.9 },
];

/** Seeded PRNG (mulberry32) — deterministic geometry and particle layout. */
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (e0, e1, x) => {
  const k = clamp((x - e0) / (e1 - e0), 0, 1);
  return k * k * (3 - 2 * k);
};
const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);

/* --------------------------------------------------------------------------
 * 1. Renderer, camera, post-processing
 * ------------------------------------------------------------------------ */
if (CAPTURE) document.body.classList.add('capture');

const stage = document.getElementById('stage');
const canvas = document.getElementById('gl');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(CAPTURE ? 1 : Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; // applied by OutputPass
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(PAL.obsidian, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 1200);

// Soft studio reflections for glass and titanium (procedural, no HDR download).
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.32;

// HDR + MSAA render target so bloom only catches real highlights.
const composerTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, composerTarget);
const renderPass = new RenderPass(scene, camera);
const bokeh = new BokehPass(scene, camera, { focus: 10, aperture: 0, maxblur: 0.009 });
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.5, 1.0);
const outputPass = new OutputPass();

/** Final grade in display space: chromatic aberration, vignette, film grain. */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uGrain: { value: 0.032 },
    uVignette: { value: 0.42 },
    uCA: { value: 0.0035 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uRes;
    uniform float uTime, uGrain, uVignette, uCA;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      vec2 off = c * uCA * (0.4 + r2 * 2.0);
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      col *= 1.0 - uVignette * smoothstep(0.08, 0.62, r2 * 1.6);
      // grain: deterministic in t (frame index), not wall clock
      float g = hash(floor(vUv * uRes) + floor(uTime * 60.0) * vec2(17.0, 29.0)) - 0.5;
      col += g * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }`,
};
const grade = new ShaderPass(GradeShader);

/** HDR sanitiser before bloom: drops NaN/Inf and clamps specular fireflies,
 *  which would otherwise be smeared across the frame by the bloom blur. */
const sanitize = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uMax: { value: 4.0 } },
  vertexShader: GradeShader.vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uMax;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);
      float m = max(c.r, max(c.g, c.b));
      c *= m > uMax ? uMax / m : 1.0;   // hue-preserving clamp
      gl_FragColor = vec4(max(c, 0.0), 1.0);
    }`,
});

composer.addPass(renderPass);
composer.addPass(sanitize);
composer.addPass(bokeh);
composer.addPass(bloom);
composer.addPass(outputPass);
composer.addPass(grade);

/* --------------------------------------------------------------------------
 * 2. Lighting: 3-point studio + warm practicals
 * ------------------------------------------------------------------------ */
const keyLight = new THREE.DirectionalLight(PAL.key, 2.5);
keyLight.position.set(10, 14, 12);
const rimLight = new THREE.DirectionalLight(PAL.rim, 4.0);
rimLight.position.set(-9, 6, -14);
const ambient = new THREE.AmbientLight(PAL.ambient, 1.0);
scene.add(keyLight, rimLight, ambient);

// Warm light that travels a few units ahead of the camera in the tunnel.
const tunnelLight = new THREE.PointLight(PAL.accent, 0, 40, 2);
// Warm light inside the core (scenes 3–4).
const coreLight = new THREE.PointLight(PAL.accent, 0, 80, 2);
coreLight.position.copy(CORE).add(new THREE.Vector3(0, 1.5, 0));
scene.add(tunnelLight, coreLight);

/* --------------------------------------------------------------------------
 * 3. Materials
 * ------------------------------------------------------------------------ */
const glassMat = new THREE.MeshPhysicalMaterial({
  color: '#f3f6fa',
  metalness: 0,
  roughness: 0.25,
  transmission: 0.9,
  ior: 1.5,
  thickness: 1.6,
  dispersion: 0.25,
  attenuationColor: new THREE.Color('#d3dbe8'),
  attenuationDistance: 5,
  clearcoat: 0.25,
  clearcoatRoughness: 0.2,
  envMapIntensity: 0.8,
  flatShading: true,
});

// Brushed dark titanium: anisotropic metal.
const titaniumMat = new THREE.MeshPhysicalMaterial({
  color: '#787d85',
  metalness: 1,
  roughness: 0.34,
  anisotropy: 0.7,
  clearcoat: 0.15,
  clearcoatRoughness: 0.4,
});
const polishedTitaniumMat = titaniumMat.clone();
polishedTitaniumMat.roughness = 0.18;
polishedTitaniumMat.color.set('#9a9fa7');

const emberMat = new THREE.MeshStandardMaterial({ color: '#000000', emissive: PAL.accent, emissiveIntensity: 2.6 });

/* --------------------------------------------------------------------------
 * 4. Backdrop dome (GLSL): obsidian with two muted light blobs
 * ------------------------------------------------------------------------ */
const dome = new THREE.Mesh(
  new THREE.SphereGeometry(500, 48, 24),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uBase: { value: PAL.obsidian },
      uWarm: { value: PAL.accent.clone().multiplyScalar(0.05) },
      uCool: { value: PAL.rim.clone().multiplyScalar(0.03) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position.z = gl_Position.w; // pin to the far plane
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBase, uWarm, uCool;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float w = pow(max(dot(d, normalize(vec3(0.55, 0.25, -0.8))), 0.0), 5.0);
        float c = pow(max(dot(d, normalize(vec3(-0.7, 0.35, -0.35))), 0.0), 4.0);
        float lift = mix(0.75, 1.1, smoothstep(-0.6, 0.4, d.y));
        gl_FragColor = vec4(uBase * lift + uWarm * w + uCool * c, 1.0);
      }`,
  }),
);
dome.renderOrder = -10;
dome.frustumCulled = false;
scene.add(dome);

/* --------------------------------------------------------------------------
 * 5. Scene 1 — glass polyhedron built from 20 tetrahedral shards
 *    (an icosahedron is exactly 20 tetrahedra meeting at its centre, so it
 *     looks whole at explode = 0 and can fracture without a model swap)
 * ------------------------------------------------------------------------ */
const poly = new THREE.Group();
scene.add(poly);

const shards = [];
{
  const rand = prng(11);
  const ico = new THREE.IcosahedronGeometry(2.2, 0);
  const p = ico.getAttribute('position');
  const O = new THREE.Vector3();
  for (let f = 0; f < p.count / 3; f++) {
    const a = new THREE.Vector3().fromBufferAttribute(p, f * 3);
    const b = new THREE.Vector3().fromBufferAttribute(p, f * 3 + 1);
    const c = new THREE.Vector3().fromBufferAttribute(p, f * 3 + 2);
    const pivot = a.clone().add(b).add(c).add(O).multiplyScalar(0.25);
    // outer face + three inner faces, wound outward
    const tris = [a, b, c, O, b, a, O, c, b, O, a, c];
    const arr = new Float32Array(tris.length * 3);
    tris.forEach((v, i) => arr.set([v.x - pivot.x, v.y - pivot.y, v.z - pivot.z], i * 3));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, glassMat);
    mesh.position.copy(pivot);
    poly.add(mesh);
    const axis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    shards.push({
      mesh,
      pivot,
      dir: a.clone().add(b).add(c).normalize(),
      axis,
      spin: 1.5 + rand() * 3,
      dist: 5 + rand() * 7,
    });
  }
}
const ember = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 16), emberMat);
poly.add(ember);

/* --------------------------------------------------------------------------
 * 6. GPU-instanced particle cloud (custom GLSL billboards)
 * ------------------------------------------------------------------------ */
const P_COUNT = 2600;
const particles = (() => {
  const rand = prng(23);
  const quad = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = quad.index;
  geo.setAttribute('position', quad.getAttribute('position'));
  geo.setAttribute('uv', quad.getAttribute('uv'));
  const off = new Float32Array(P_COUNT * 3);
  const seed = new Float32Array(P_COUNT * 4);
  for (let i = 0; i < P_COUNT; i++) {
    // shell distribution, slightly flattened, denser mid-radius
    const u = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 0.3 + 0.7 * Math.pow(rand(), 0.7);
    off.set([Math.cos(th) * s * r, u * r * 0.7, Math.sin(th) * s * r], i * 3);
    seed.set([rand(), rand(), rand(), rand()], i * 4);
  }
  geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 3));
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  geo.instanceCount = P_COUNT;

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uCenter: { value: new THREE.Vector3() },
      uSpread: { value: 14 },
      uDrift: { value: 1 },
      uSize: { value: 0.06 },
      uOpacity: { value: 0 },
      uWarm: { value: PAL.accent.clone().multiplyScalar(2.2) },
      uCool: { value: PAL.rim.clone().multiplyScalar(1.1) },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aOffset;
      attribute vec4 aSeed;   // phase, speed, size, hue
      uniform float uTime, uSpread, uDrift, uSize, uOpacity;
      uniform vec3 uCenter;
      varying vec2 vUv;
      varying float vAlpha, vHue;
      void main() {
        float ph = aSeed.x * 6.2831853;
        float sp = 0.15 + aSeed.y * 0.45;
        vec3 p = aOffset * uSpread;
        p += uDrift * (0.5 + aSeed.y) * vec3(
          sin(uTime * sp + ph),
          cos(uTime * sp * 0.8 + ph * 1.3),
          sin(uTime * sp * 0.6 + ph * 0.7));
        vec4 mv = viewMatrix * vec4(uCenter + p, 1.0);
        mv.xy += position.xy * uSize * (0.35 + aSeed.z * 1.1);  // camera-facing billboard
        gl_Position = projectionMatrix * mv;
        vUv = uv;
        vHue = aSeed.w;
        float twinkle = 0.55 + 0.45 * sin(uTime * (1.0 + aSeed.y * 2.0) + ph * 3.0);
        vAlpha = uOpacity * twinkle * smoothstep(0.8, 3.5, -mv.z);  // no blobs at the lens
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uWarm, uCool;
      varying vec2 vUv;
      varying float vAlpha, vHue;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.0, r);
        a *= a;
        vec3 col = mix(uCool, uWarm, step(0.72, vHue));
        gl_FragColor = vec4(col, a * vAlpha);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
})();

/* --------------------------------------------------------------------------
 * 7. Scene 2 — data lines (GLSL pulses) + titanium hex rings
 * ------------------------------------------------------------------------ */
const LINE_COUNT = 44;
const LINE_START = 1;   // near end (z)
const LINE_END = -90;   // far end (z)
const LINE_LEN = LINE_START - LINE_END;

const lines = (() => {
  const rand = prng(37);
  const geo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
  const aLine = new Float32Array(LINE_COUNT * 4);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uOpacity: { value: 0 },
      uLen: { value: LINE_LEN },
      uColor: { value: PAL.steel.clone().multiplyScalar(0.55) },
      uHot: { value: PAL.accent.clone().multiplyScalar(3.2) },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aLine;   // speed (units/s), phase, intensity, unused
      varying float vAlong, vDepth, vFacing;
      varying vec4 vLine;
      void main() {
        vAlong = position.y + 0.5;                      // 0 near end → 1 far end
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vec4 mv = viewMatrix * wp;
        vec3 n = normalize(normalMatrix * mat3(instanceMatrix) * normal);
        vFacing = abs(dot(n, normalize(-mv.xyz)));
        vDepth = -mv.z;
        vLine = aLine;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uReveal, uOpacity, uLen;
      uniform vec3 uColor, uHot;
      varying float vAlong, vDepth, vFacing;
      varying vec4 vLine;
      void main() {
        if (vAlong > uReveal) discard;                    // draw-on from the core outward
        float s = vAlong * uLen;                          // distance along the line
        float x = (s - uTime * vLine.x) / 9.0 + vLine.y;  // pulses every 9 units
        float p = fract(x);
        float pulse = pow(p, 14.0);                       // bright head, soft tail
        float head = smoothstep(uReveal - 0.025, uReveal, vAlong);
        float core = pow(vFacing, 1.6);
        vec3 col = uColor * (0.35 + 0.65 * core)
                 + uHot * pulse * vLine.z * (0.4 + 0.6 * core)
                 + uHot * head * 0.8;
        float nearFade = smoothstep(0.4, 2.2, vDepth);
        gl_FragColor = vec4(col * uOpacity * nearFade, 1.0);
      }`,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, LINE_COUNT);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2); // +y → −z
  for (let i = 0; i < LINE_COUNT; i++) {
    const ang = (i / LINE_COUNT) * Math.PI * 2 + rand() * 0.12;
    const r = 2.5 + rand() * 1.3;
    const w = 0.018 + rand() * 0.022;
    m.compose(
      new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, (LINE_START + LINE_END) / 2),
      q,
      new THREE.Vector3(w, LINE_LEN, w),
    );
    mesh.setMatrixAt(i, m);
    aLine.set([14 + rand() * 14, rand(), 0.5 + rand() * 0.8, 0], i * 4);
  }
  geo.setAttribute('aLine', new THREE.InstancedBufferAttribute(aLine, 4));
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
})();

const RING_COUNT = 10;
const ringZ = Array.from({ length: RING_COUNT }, (_, i) => -6 - i * 9);
// TorusGeometry with 6 tubular segments = hexagonal frame (echoes the final emblem).
const rings = new THREE.InstancedMesh(new THREE.TorusGeometry(5, 0.14, 14, 6), titaniumMat, RING_COUNT);
scene.add(rings);

/* --------------------------------------------------------------------------
 * 8. Scene 3 — node grid, reflective floor, core + emblem
 * ------------------------------------------------------------------------ */
const pulseUniforms = {
  uTime: { value: 0 },
  uPulse: { value: 0 },
  uAccent: { value: PAL.accent.clone() },
  uCore: { value: new THREE.Vector2(CORE.x, CORE.z) },
};

// Node material: titanium with light pulses injected into the emissive term.
// The pulse ring function is shared with the floor shader so both stay in sync.
const nodeMat = titaniumMat.clone();
nodeMat.color.set('#4d525a');
nodeMat.roughness = 0.42;
nodeMat.onBeforeCompile = (shader) => {
  Object.assign(shader.uniforms, pulseUniforms);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vNodeWorld;\nvarying float vNodeTop;')
    .replace(
      '#include <project_vertex>',
      `#include <project_vertex>
       vNodeWorld = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
       vNodeTop = step(0.5, normal.y);`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
       uniform float uTime, uPulse;
       uniform vec3 uAccent;
       uniform vec2 uCore;
       varying vec3 vNodeWorld;
       varying float vNodeTop;`,
    )
    .replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       float nd = length(vNodeWorld.xz - uCore);
       float nr = fract(nd * 0.045 - uTime * 0.35);
       float np = smoothstep(0.80, 1.0, nr) * (1.0 - smoothstep(0.985, 1.0, nr));
       totalEmissiveRadiance += uAccent * np * uPulse * (0.5 + 3.0 * vNodeTop);`,
    );
};

const GRID_N = 41;
const GRID_STEP = 2.4;
const nodeData = [];
{
  const rand = prng(53);
  const half = (GRID_N - 1) / 2;
  for (let ix = 0; ix < GRID_N; ix++) {
    for (let iz = 0; iz < GRID_N; iz++) {
      const x = (ix - half) * GRID_STEP;
      const z = (iz - half) * GRID_STEP;
      const d = Math.hypot(x, z);
      const r = rand();
      if (d < 7.5) continue; // keep a plaza around the core
      nodeData.push({ x: CORE.x + x, z: CORE.z + z, d, h: 0.35 + 2.8 * r * r * (0.4 + 0.6 * smooth(10, 40, d)) });
    }
  }
}
const nodeGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
const nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeData.length);
nodes.frustumCulled = false;
scene.add(nodes);

// Reflective floor: three's Reflector with a custom shader (soft blur, grid
// lines, expanding light pulses). It only renders while scenes 3–4 need it.
const FloorShader = {
  name: 'FloorShader',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uFloor: { value: 0 },
    ...pulseUniforms,
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color, uAccent;
    uniform sampler2D tDiffuse;
    uniform float uTime, uPulse, uFloor;
    uniform vec2 uCore;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      float k = 0.0045 * vUv.w;
      vec3 refl = texture2DProj(tDiffuse, vUv).rgb * 0.36;
      refl += texture2DProj(tDiffuse, vUv + vec4( k, 0.0, 0.0, 0.0)).rgb * 0.16;
      refl += texture2DProj(tDiffuse, vUv + vec4(-k, 0.0, 0.0, 0.0)).rgb * 0.16;
      refl += texture2DProj(tDiffuse, vUv + vec4(0.0,  k, 0.0, 0.0)).rgb * 0.16;
      refl += texture2DProj(tDiffuse, vUv + vec4(0.0, -k, 0.0, 0.0)).rgb * 0.16;

      vec2 rel = vWorld.xz - uCore;
      float d = length(rel);
      float fade = 1.0 - smoothstep(35.0, 115.0, d);

      vec2 gv = rel / 2.4 + 0.5;                      // grid lines between nodes
      vec2 q = abs(fract(gv + 0.5) - 0.5);
      vec2 fw = fwidth(gv);
      vec2 lw = 1.0 - smoothstep(vec2(0.0), fw * 1.5, q);
      float grid = max(lw.x, lw.y);

      float ring = fract(d * 0.045 - uTime * 0.35);   // same function as the nodes
      float pulse = smoothstep(0.80, 1.0, ring) * (1.0 - smoothstep(0.985, 1.0, ring));

      vec3 col = color + refl * 0.55 * fade;
      col += vec3(0.55, 0.65, 0.85) * 0.03 * grid * fade;
      col += uAccent * (pulse * 0.5 + grid * pulse * 1.6) * uPulse * fade;
      col += uAccent * 0.22 * exp(-d * 0.12) * uPulse;
      gl_FragColor = vec4(col * uFloor, 1.0);
    }`,
};
const floor = new Reflector(new THREE.PlaneGeometry(260, 260), {
  textureWidth: 1024,
  textureHeight: 1024,
  clipBias: 0.003,
  color: PAL.obsidian,
  shader: FloorShader,
});
floor.rotation.x = -Math.PI / 2;
floor.position.set(CORE.x, FLOOR_Y, CORE.z);
// Reflector clones uniforms: re-link the shared pulse uniforms so one update drives all.
Object.assign(floor.material.uniforms, pulseUniforms);
floor.visible = false;
scene.add(floor);

// Core: glass dodecahedron + ember, framed by a titanium cube (the emblem —
// seen from the isometric angle, its outline reads as a hexagon).
const coreGroup = new THREE.Group();
coreGroup.position.copy(CORE);
scene.add(coreGroup);

const coreGlass = new THREE.Mesh(new THREE.DodecahedronGeometry(1.7, 0), glassMat);
coreGlass.geometry.computeVertexNormals();
const coreEmber = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 16), emberMat);
coreGroup.add(coreGlass, coreEmber);

const emblem = new THREE.Group();
{
  const s = 3.6;
  const t = 0.11;
  const h = s / 2;
  const edges = [
    [s, t, t, 0, h, h], [s, t, t, 0, -h, h], [s, t, t, 0, h, -h], [s, t, t, 0, -h, -h],
    [t, s, t, h, 0, h], [t, s, t, -h, 0, h], [t, s, t, h, 0, -h], [t, s, t, -h, 0, -h],
    [t, t, s, h, h, 0], [t, t, s, -h, h, 0], [t, t, s, h, -h, 0], [t, t, s, -h, -h, 0],
  ];
  for (const [sx, sy, sz, x, y, z] of edges) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(sx + t, sy + t, sz + t), polishedTitaniumMat);
    bar.position.set(x, y, z);
    emblem.add(bar);
  }
}
coreGroup.add(emblem);

/* --------------------------------------------------------------------------
 * 9. Choreography — one paused GSAP timeline, seeked to t every frame
 * ------------------------------------------------------------------------ */
/** Mutable scene state; only GSAP writes it, only applyState reads it. */
const S = {
  // camera, scene 1 (arc around the polyhedron)
  r1: 25, y1: 5, arc: 0.55, lx: -1.7, ly: -0.9, // lx/ly: frame the hero up-right of the caption
  // camera, scene 2 (tunnel)
  z: 10, weave: 0,
  // camera, scenes 3–4 (orbit around the core)
  oa: 0, oR: 35, oh: 0, lookY: 0, fov: 42,
  // scene 1 → 2
  explode: 0, shardScale: 1, ember: 1,
  lines: 0, linesOpacity: 0, rings: 0,
  pOpacity: 0, pSpread: 14, pDrift: 1,
  focus: 6, aperture: 0, tunnelLight: 0,
  // scenes 3–4
  grid: 0, floor: 0, pulse: 0, core: 0, coreLight: 0, lock: 0,
};

const tl = gsap.timeline({ paused: true });
/** Explicit from→to tween (immediateRender off) so seeking in any direction is exact. */
const tw = (from, to, at, dur, ease = 'power3.inOut') =>
  tl.fromTo(S, { ...from }, { ...to, duration: dur, ease, immediateRender: false }, at);

// Scene 1 — dolly from (0,5,25) to (0,0,10) on a slight arc
tw({ r1: 25, y1: 5, arc: 0.55 }, { r1: 10, y1: 0, arc: 0 }, 0, 6.5, 'power3.inOut');
tw({ pOpacity: 0 }, { pOpacity: 1 }, 0, 2.5, 'sine.out');
// recentre the hero once the caption has left, so the tunnel hand-off looks straight down −z
tw({ lx: -1.7, ly: -0.9 }, { lx: 0, ly: 0 }, 5.9, 1.1, 'sine.inOut');

// Scene 2 — fracture and fly-through
tw({ z: 10 }, { z: -105 }, 7.0, 11.0, 'power2.inOut');
tw({ explode: 0 }, { explode: 1 }, 7.1, 2.6, 'power2.out');
tw({ shardScale: 1 }, { shardScale: 0 }, 8.4, 1.8, 'power2.in');
tw({ ember: 1 }, { ember: 0 }, 7.6, 1.0, 'power2.in');
tw({ rings: 0 }, { rings: 1 }, 6.6, 3.2, 'power3.out');
tw({ linesOpacity: 0 }, { linesOpacity: 1 }, 6.8, 1.2, 'sine.inOut');
tw({ lines: 0 }, { lines: 1 }, 7.0, 3.8, 'power2.out');
tw({ weave: 0 }, { weave: 1 }, 8.2, 2.5, 'sine.inOut');
tw({ weave: 1 }, { weave: 0 }, 15.5, 2.5, 'sine.inOut');
tw({ pOpacity: 1 }, { pOpacity: 0 }, 8.4, 2.0, 'sine.inOut');
tw({ tunnelLight: 0 }, { tunnelLight: 1 }, 7.5, 2.0, 'sine.inOut');
tw({ tunnelLight: 1 }, { tunnelLight: 0 }, 15.5, 2.0, 'sine.inOut');
// dynamic depth of field: rack focus while weaving through the rings
tw({ aperture: 0 }, { aperture: 2.6e-4 }, 7.6, 1.4, 'sine.inOut');
tw({ focus: 6 }, { focus: 13 }, 8.0, 3.5, 'sine.inOut');
tw({ focus: 13 }, { focus: 7 }, 12.0, 2.5, 'sine.inOut');
tw({ focus: 7 }, { focus: 16 }, 14.5, 2.0, 'sine.inOut');
tw({ aperture: 2.6e-4 }, { aperture: 0 }, 16.0, 1.6, 'sine.inOut');

// Scene 3 — reveal and orbital sweep (one sweep 18→30 ends exactly at (12,12,12))
tw({ grid: 0 }, { grid: 1 }, 15.8, 5.4, 'power2.out');
tw({ floor: 0 }, { floor: 1 }, 15.0, 3.0, 'sine.inOut');
tw({ core: 0 }, { core: 1 }, 16.0, 2.6, 'power3.out');
tw({ coreLight: 0 }, { coreLight: 1 }, 16.5, 3.0, 'sine.inOut');
tw({ pulse: 0 }, { pulse: 1 }, 18.5, 2.5, 'sine.inOut');
tw({ linesOpacity: 1 }, { linesOpacity: 0.3 }, 18.0, 3.0, 'sine.inOut');
tw({ pOpacity: 0, pSpread: 14 }, { pOpacity: 0.8, pSpread: 30 }, 17.0, 3.0, 'sine.inOut');
tw({ oa: 0 }, { oa: -1.75 * Math.PI }, 18, 12, 'sine.inOut');
tw({ oR: 35 }, { oR: 50 }, 18.0, 4.5, 'sine.inOut');
tw({ oR: 50 }, { oR: 42 }, 22.5, 3.5, 'sine.inOut');
tw({ oh: 0 }, { oh: 24 }, 18.0, 4.5, 'sine.inOut');
tw({ oh: 24 }, { oh: 19 }, 22.5, 3.5, 'sine.inOut');

// Scene 4 — decelerated lock-in to the isometric angle, elements settle
tw({ oR: 42, oh: 19 }, { oR: ISO_RADIUS, oh: 12 }, 26.0, 4.0, 'power3.out');
tw({ fov: 42, lookY: 0 }, { fov: 38, lookY: -1.9 }, 26.0, 4.0, 'power3.out');
tw({ lock: 0 }, { lock: 1 }, 26.0, 3.4, 'power3.inOut');
tw({ pulse: 1, pDrift: 1 }, { pulse: 0.45, pDrift: 0.15 }, 26.0, 3.0, 'sine.inOut');

/* --- Captions: per-word fade + 3D tracking blur (never typewriter) -------- */
const caps = [...document.querySelectorAll('.cap')].map((el) => ({
  el,
  card: el.querySelector('.cap__card'),
  words: el.querySelectorAll('.w'),
  eyebrow: el.querySelector('.cap__eyebrow'),
  sub: el.querySelector('.cap__sub'),
  cta: el.querySelector('.cap__cta'),
  title: el.querySelector('.cap__title'),
}));

function captionIn(c, at) {
  const o = { immediateRender: false };
  tl.fromTo(c.el, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'sine.out', ...o }, at);
  tl.fromTo(c.eyebrow, { opacity: 0, letterSpacing: '0.7em' },
    { opacity: 1, letterSpacing: '0.28em', duration: 1.4, ease: 'power3.out', ...o }, at);
  tl.fromTo(c.words,
    { opacity: 0, filter: 'blur(14px)', z: -160, rotationX: 22, letterSpacing: '0.42em' },
    { opacity: 1, filter: 'blur(0px)', z: 0, rotationX: 0, letterSpacing: '0em',
      duration: 1.5, ease: 'power3.out', stagger: 0.09, ...o }, at + 0.1);
  if (c.sub) {
    tl.fromTo(c.sub, { opacity: 0, y: 14, filter: 'blur(6px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', ...o }, at + 0.55);
  }
  if (c.cta) {
    tl.fromTo(c.cta, { opacity: 0, y: 16, filter: 'blur(6px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out', ...o }, at + 0.8);
  }
}
function captionOut(c, at) {
  const o = { immediateRender: false };
  tl.fromTo(c.words,
    { filter: 'blur(0px)', letterSpacing: '0em', y: 0 },
    { filter: 'blur(10px)', letterSpacing: '0.18em', y: -8, duration: 0.7, ease: 'power2.in', stagger: 0.04, ...o }, at);
  tl.fromTo(c.el, { opacity: 1 }, { opacity: 0, duration: 0.7, ease: 'power2.in', ...o }, at + 0.15);
}
captionIn(caps[0], 0.9);   captionOut(caps[0], 5.9);
captionIn(caps[1], 9.6);   captionOut(caps[1], 16.4);
captionIn(caps[2], 20.0);  captionOut(caps[2], 25.2);
captionIn(caps[3], 26.9);

tl.set({}, {}, DURATION); // pin timeline length to exactly 30 s

/* --------------------------------------------------------------------------
 * 10. applyState(t) — derive every object from S and t
 * ------------------------------------------------------------------------ */
const _pos = new THREE.Vector3();
const _tgt = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _qId = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _hexQ = new THREE.Quaternion();
const BASE_ASPECT = 16 / 9;

/** Weaving path through the tunnel; w = weave amplitude envelope. */
function tunnelPoint(z, w, out) {
  return out.set(w * 1.25 * Math.sin(z * 0.07), w * 0.7 * Math.sin(z * 0.05 + 1.0), z);
}

function applyState(t) {
  /* Camera: three continuous segments with matching hand-off poses
     (t=7: (0,0,10) looking −z; t=18: (0,0,−105) looking −z). */
  let roll = 0;
  if (t < 7) {
    _pos.set(Math.sin(S.arc) * S.r1, S.y1, Math.cos(S.arc) * S.r1);
    _tgt.set(S.lx, S.ly, 0);
  } else if (t < 18) {
    tunnelPoint(S.z, S.weave, _pos);
    tunnelPoint(S.z - 10, S.weave, _tgt);
    roll = S.weave * 0.1 * Math.sin(S.z * 0.045);
  } else {
    _pos.set(CORE.x + Math.sin(S.oa) * S.oR, CORE.y + S.oh, CORE.z + Math.cos(S.oa) * S.oR);
    _tgt.set(CORE.x, CORE.y + S.lookY, CORE.z);
  }
  camera.position.copy(_pos);
  camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.lookAt(_tgt);
  // Keep the horizontal field of view on narrow/portrait screens.
  const hHalf = Math.atan(Math.tan(THREE.MathUtils.degToRad(S.fov) / 2) * BASE_ASPECT);
  camera.fov = camera.aspect < BASE_ASPECT
    ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hHalf) / camera.aspect))
    : S.fov;
  camera.updateProjectionMatrix();
  dome.position.copy(_pos);

  /* Scene 1: polyhedron float + fracture */
  poly.visible = S.shardScale > 0.001;
  poly.position.y = 0.15 * Math.sin(t * 0.8);
  poly.rotation.set(0.25 * Math.sin(t * 0.35), t * 0.22 + S.explode * 0.6, 0);
  for (const sh of shards) {
    sh.mesh.position.copy(sh.pivot).addScaledVector(sh.dir, S.explode * sh.dist);
    sh.mesh.quaternion.setFromAxisAngle(sh.axis, S.explode * sh.spin);
    sh.mesh.scale.setScalar(Math.max(S.shardScale, 1e-4));
  }
  ember.scale.setScalar(Math.max(S.ember * (1 + 0.08 * Math.sin(t * 3)), 1e-4));
  ember.visible = S.ember > 0.001;

  /* Particles: origin cloud in scenes 1–2, core cloud in scenes 3–4 */
  const pu = particles.material.uniforms;
  pu.uTime.value = t;
  pu.uOpacity.value = S.pOpacity;
  pu.uSpread.value = S.pSpread;
  pu.uDrift.value = S.pDrift;
  pu.uCenter.value.copy(t < 14 ? new THREE.Vector3(0, 0, 0) : CORE);
  particles.visible = S.pOpacity > 0.001;

  /* Tunnel */
  const lu = lines.material.uniforms;
  lu.uTime.value = t;
  lu.uReveal.value = S.lines;
  lu.uOpacity.value = S.linesOpacity;
  lines.visible = S.linesOpacity > 0.001 && S.lines > 0.001;

  rings.visible = S.rings > 0.001;
  for (let i = 0; i < RING_COUNT; i++) {
    const k = easeOutCubic(clamp(S.rings * 1.7 - i * 0.07, 0, 1));
    _hexQ.setFromAxisAngle(_fwd.set(0, 0, 1), i * 0.21 + (1 - k) * 0.8);
    _m.compose(_p.set(0, 0, ringZ[i]), _hexQ, _s.setScalar(Math.max(k, 1e-4)));
    rings.setMatrixAt(i, _m);
  }
  rings.instanceMatrix.needsUpdate = true;

  camera.getWorldDirection(_fwd);
  tunnelLight.position.copy(_pos).addScaledVector(_fwd, 6);
  tunnelLight.intensity = 45 * S.tunnelLight;

  /* Depth of field (scene 2 only) */
  bokeh.enabled = S.aperture > 1e-7;
  bokeh.uniforms.aperture.value = S.aperture;
  bokeh.uniforms.focus.value = S.focus;

  /* Grid: radial rise from the core; scene 4 locks every node to one height */
  nodes.visible = S.grid > 0.001;
  if (nodes.visible) {
    const front = S.grid * 80;
    for (let i = 0; i < nodeData.length; i++) {
      const n = nodeData[i];
      const local = easeOutCubic(clamp((front - n.d) / 12, 0, 1));
      const h = THREE.MathUtils.lerp(n.h, 0.7, S.lock) * local;
      _m.compose(_p.set(n.x, FLOOR_Y, n.z), _qId, _s.set(0.92, Math.max(h, 1e-4), 0.92));
      nodes.setMatrixAt(i, _m);
    }
    nodes.instanceMatrix.needsUpdate = true;
  }

  floor.visible = S.floor > 0.001;
  floor.material.uniforms.uFloor.value = S.floor;
  pulseUniforms.uTime.value = t;
  pulseUniforms.uPulse.value = S.pulse;

  /* Core + emblem: tumble, then slerp into axis alignment (isometric hexagon) */
  coreGroup.visible = S.core > 0.001;
  coreGroup.scale.setScalar(Math.max(S.core, 1e-4));
  coreGroup.position.set(CORE.x, CORE.y + 0.12 * Math.sin(t * 0.7) * (1 - S.lock), CORE.z);
  coreGlass.rotation.set(t * 0.21, t * 0.3, 0);
  coreEmber.scale.setScalar(1 + 0.06 * Math.sin(t * 2.4));
  _q.setFromEuler(_e.set(t * 0.5, t * 0.37 + 1.0, t * 0.21));
  emblem.quaternion.copy(_q).slerp(_qId, S.lock);
  coreLight.intensity = 35 * S.coreLight;

  /* Grade */
  grade.uniforms.uTime.value = t;
}

/* --------------------------------------------------------------------------
 * 11. render(t) — the only entry point that draws
 * ------------------------------------------------------------------------ */
let currentT = START_T;

// Additive particles carry no depth; hide them from the bokeh depth pre-pass.
const bokehRender = bokeh.render.bind(bokeh);
bokeh.render = (...args) => {
  const pv = particles.visible;
  const dv = dome.visible;
  particles.visible = false;
  dome.visible = false;
  bokehRender(...args);
  particles.visible = pv;
  dome.visible = dv;
};

function render(t) {
  currentT = clamp(t, 0, DURATION);
  tl.seek(currentT, true);
  applyState(currentT);
  composer.render();
  updateDeck(currentT);
}

/* --------------------------------------------------------------------------
 * 12. Sizing
 * ------------------------------------------------------------------------ */
function resize() {
  const w = CAPTURE ? 1920 : stage.clientWidth;
  const h = CAPTURE ? 1080 : stage.clientHeight;
  renderer.setSize(w, h, false);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(w, h);
  const pr = renderer.getPixelRatio();
  floor.getRenderTarget().setSize(Math.round(w * pr * 0.5), Math.round(h * pr * 0.5));
  grade.uniforms.uRes.value.set(w * pr, h * pr);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

/* --------------------------------------------------------------------------
 * 13. Self-check: overlap, safe area, text size, contrast (auto-fixed)
 *
 * For every scene's hold frame:
 *   - visible caption cards must not overlap each other
 *   - cards must stay inside the 5 % safe area
 *   - title and body text ≥ 3 % of frame height (eyebrow HUD exempt)
 *   - the scene's focal object (projected bounding sphere) must not sit
 *     under the caption card
 *   - WCAG contrast ≥ 4.5:1 for the dimmest text colour against the 90th-
 *     percentile background pixel under the card; if it fails, the card's
 *     scrim is raised until it passes (that is the automatic fix)
 * ------------------------------------------------------------------------ */
const FOCAL = [
  { center: new THREE.Vector3(0, 0, 0), radius: 2.6 },
  null, // tunnel: no single focal object
  { center: CORE.clone(), radius: 3.2 },
  { center: CORE.clone(), radius: 3.2 },
];
const SCRIM_MIN = 0.22;
const SCRIM_MAX = 0.9;
const SCRIM_COLOR = [13, 15, 18];

const srgbToLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const luminance = (r, g, b) =>
  0.2126 * srgbToLin(r / 255) + 0.7152 * srgbToLin(g / 255) + 0.0722 * srgbToLin(b / 255);
const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
const cssColorLum = (css) => {
  const m = css.match(/[\d.]+/g).map(Number);
  return luminance(m[0], m[1], m[2]);
};

/** Read the pixels of the last rendered frame under a DOM rect (sRGB bytes). */
function samplePixels(rect) {
  const gl = renderer.getContext();
  const cRect = canvas.getBoundingClientRect();
  const sx = gl.drawingBufferWidth / cRect.width;
  const sy = gl.drawingBufferHeight / cRect.height;
  const x0 = Math.max(0, Math.floor((rect.left - cRect.left) * sx));
  const x1 = Math.min(gl.drawingBufferWidth, Math.ceil((rect.right - cRect.left) * sx));
  const yTop = Math.max(0, Math.floor((rect.top - cRect.top) * sy));
  const yBot = Math.min(gl.drawingBufferHeight, Math.ceil((rect.bottom - cRect.top) * sy));
  const w = x1 - x0;
  const h = yBot - yTop;
  if (w <= 0 || h <= 0) return [];
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(x0, gl.drawingBufferHeight - yBot, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  const out = [];
  const step = 4 * 3; // every 3rd pixel
  for (let i = 0; i < buf.length; i += step) out.push([buf[i], buf[i + 1], buf[i + 2]]);
  return out;
}

/** 90th-percentile luminance after compositing the scrim (sRGB-space alpha blend). */
function bgLuminanceP90(pixels, a) {
  if (!pixels.length) return 0;
  const ls = pixels.map(([r, g, b]) =>
    luminance(r * (1 - a) + SCRIM_COLOR[0] * a, g * (1 - a) + SCRIM_COLOR[1] * a, b * (1 - a) + SCRIM_COLOR[2] * a));
  ls.sort((p, q) => p - q);
  return ls[Math.floor(ls.length * 0.9)];
}

const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

function selfCheck() {
  const savedT = currentT;
  const report = [];
  const sRect = stage.getBoundingClientRect();
  const safe = {
    left: sRect.left + sRect.width * 0.05,
    right: sRect.right - sRect.width * 0.05,
    top: sRect.top + sRect.height * 0.05,
    bottom: sRect.bottom - sRect.height * 0.05,
  };

  SCENES.forEach((sc, i) => {
    const c = caps[i];
    c.card.style.setProperty('--scrim', SCRIM_MIN);
    render(sc.hold);
    const issues = [];
    const rect = c.card.getBoundingClientRect();

    // 1) overlap between visible captions
    caps.forEach((o, j) => {
      if (j !== i && parseFloat(getComputedStyle(o.el).opacity) > 0.02 && intersects(rect, o.card.getBoundingClientRect())) {
        issues.push(`overlaps caption ${j + 1}`);
      }
    });
    // 2) safe area
    if (rect.left < safe.left || rect.right > safe.right || rect.top < safe.top || rect.bottom > safe.bottom) {
      issues.push('outside safe area');
    }
    // 3) text size
    const minPct = Math.min(
      ...[c.title, c.sub, c.cta?.querySelector('.pill')].filter(Boolean)
        .map((el) => parseFloat(getComputedStyle(el).fontSize) / sRect.height * 100),
    );
    if (minPct < 2.95) issues.push(`text ${minPct.toFixed(2)} % < 3 %`);
    // 4) focal object under the card
    const f = FOCAL[i];
    if (f) {
      _p.copy(f.center).project(camera);
      const cx = sRect.left + (_p.x * 0.5 + 0.5) * sRect.width;
      const cy = sRect.top + (-_p.y * 0.5 + 0.5) * sRect.height;
      const dist = f.center.distanceTo(camera.position);
      const rPx = (f.radius / (dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))) * sRect.height / 2;
      // circle–rectangle test: nearest point of the card to the projected centre
      const nx = clamp(cx, rect.left, rect.right);
      const ny = clamp(cy, rect.top, rect.bottom);
      if (Math.hypot(cx - nx, cy - ny) < rPx) issues.push('caption covers focal object');
    }
    // 5) contrast with automatic scrim fix
    const textEls = [c.eyebrow, c.title, c.sub, c.cta?.querySelector('.pill')].filter(Boolean);
    const textLum = Math.min(...textEls.map((el) => cssColorLum(getComputedStyle(el).color)));
    const pixels = samplePixels(rect);
    let a = SCRIM_MIN;
    const before = contrast(textLum, bgLuminanceP90(pixels, a));
    while (contrast(textLum, bgLuminanceP90(pixels, a)) < 4.6 && a < SCRIM_MAX) a += 0.04;
    a = Math.min(a, SCRIM_MAX);
    const after = contrast(textLum, bgLuminanceP90(pixels, a));
    c.card.style.setProperty('--scrim', a.toFixed(2));
    if (after < 4.5) issues.push(`contrast ${after.toFixed(2)}:1 even at max scrim`);

    report.push({
      scene: `${i + 1} ${sc.name}`,
      t: sc.hold,
      contrastBefore: +before.toFixed(2),
      contrastAfter: +after.toFixed(2),
      scrim: +a.toFixed(2),
      minTextPct: +minPct.toFixed(2),
      issues: issues.length ? issues.join('; ') : 'ok',
    });
  });

  render(savedT);
  window.selfCheckReport = report;
  console.table(report);
  if (DEBUG) showReport(report);
  return report;
}

function showReport(report) {
  const el = document.getElementById('check');
  el.hidden = false;
  el.innerHTML = 'SELF-CHECK\n' + report.map((r) =>
    `<span class="${r.issues === 'ok' ? 'ok' : 'warn'}">${r.scene.padEnd(11)}</span>` +
    ` contrast ${String(r.contrastBefore).padStart(5)} → ${String(r.contrastAfter).padStart(5)}` +
    `  scrim ${r.scrim.toFixed(2)}  text ${r.minTextPct}%\n    ${r.issues}`).join('\n');
}

/* --------------------------------------------------------------------------
 * 14. Review deck + playback (wall clock only advances t; render stays pure)
 * ------------------------------------------------------------------------ */
const deck = {
  play: document.getElementById('play'),
  scrub: document.getElementById('scrub'),
  time: document.getElementById('time'),
  chips: document.getElementById('chips'),
};
const chipEls = SCENES.map((sc, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = `${i + 1} ${sc.name}`;
  b.addEventListener('click', () => { setPlaying(false); render(sc.hold); });
  deck.chips.appendChild(b);
  return b;
});

function updateDeck(t) {
  if (CAPTURE) return;
  deck.scrub.value = t;
  deck.time.textContent = t.toFixed(2).padStart(5, '0');
  const active = SCENES.reduce((acc, sc, i) => (t >= sc.start ? i : acc), 0);
  chipEls.forEach((b, i) => b.classList.toggle('is-active', i === active));
}

let playing = false;
let lastNow = null;
function setPlaying(p) {
  playing = p;
  lastNow = null;
  deck.play.textContent = p ? '❚❚' : '▶';
}
deck.play.addEventListener('click', () => setPlaying(!playing));
deck.scrub.addEventListener('input', () => { setPlaying(false); render(parseFloat(deck.scrub.value)); });

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); setPlaying(!playing); }
  if (e.code === 'ArrowRight') { setPlaying(false); render(currentT + 1 / FPS); }
  if (e.code === 'ArrowLeft') { setPlaying(false); render(currentT - 1 / FPS); }
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= SCENES.length) { setPlaying(false); render(SCENES[n - 1].hold); }
});

// Hide the deck while playing and the pointer is idle.
let idleTimer = 0;
const wake = () => {
  document.body.classList.remove('idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => playing && document.body.classList.add('idle'), 2200);
};
window.addEventListener('pointermove', wake);

function loop(now) {
  if (playing) {
    if (lastNow !== null) render((currentT + (now - lastNow) / 1000) % DURATION);
    lastNow = now;
  }
  requestAnimationFrame(loop);
}

let resizeTimer = 0;
window.addEventListener('resize', () => {
  resize();
  render(currentT);
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(selfCheck, 250); // layout changed → re-run the check
});

/* --------------------------------------------------------------------------
 * 15. Boot
 * ------------------------------------------------------------------------ */
window.DURATION = DURATION;
window.FPS = FPS;
window.render = render;
window.selfCheck = selfCheck;

resize();
window.ready = (async () => {
  await document.fonts.ready;
  // Warm every shader variant by visiting each scene once.
  for (const sc of SCENES) render(sc.hold);
  selfCheck();
  render(START_T);
  document.getElementById('veil').classList.add('is-done');
})();

if (!CAPTURE) {
  window.ready.then(() => {
    // Reduced motion: open on a still hold frame and wait for the viewer.
    if (REDUCED) render(params.has('t') ? START_T : SCENES[0].hold);
    else setPlaying(true);
    wake();
    requestAnimationFrame(loop);
  });
}

// Debug handles for tuning in the console (?debug only).
if (DEBUG) window.__dbg = { THREE, scene, camera, renderer, composer, bloom, bokeh, glassMat, emberMat, lines, particles, rings, nodes, floor, S };
