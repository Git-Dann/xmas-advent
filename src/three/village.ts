import * as THREE from 'three';

/**
 * The village: a stylised miniature diorama built from the Kenney Holiday Kit (CC0), with
 * procedural geometry as a fallback if the models cannot load.
 * - 24 houses (one per day) ringed around a central Christmas tree (day 25).
 * - Instanced houses, roofs, windows, trees and tree lights: a handful of draw calls.
 * - Unlit emissive windows plus additive halos instead of real-time lights and shadows.
 * - GPU snowfall (shader-driven, no per-frame CPU work).
 * - Adaptive pixel ratio, pause when hidden, reduced-motion static mode, explicit disposal.
 */
export type HouseState = 'future' | 'locked' | 'available' | 'in_progress' | 'complete';

export interface VillageOptions {
  reducedMotion: boolean;
  onContextLost?: () => void;
  /** Called once the houses and trees are in place (kit or fallback), so the canvas can fade in. */
  onBuilt?: () => void;
  mode?: 'village' | 'christmas';
}

export interface VillageHandle {
  setStates(states: HouseState[], hasKey: boolean): void;
  focus(day: number | null): void;
  setReducedMotion(value: boolean): void;
  resize(): void;
  dispose(): void;
}

const PALETTE = ['#6b2a3a', '#2d4a3c', '#d6c9b1', '#7f776d', '#4a1d2a', '#8f7444', '#3a5246', '#b8a88f'].map((c) => new THREE.Color(c));
const WINDOW_DARK = new THREE.Color('#14201b');
const WINDOW_WARM = new THREE.Color('#ffc56e');
const WINDOW_GOLD = new THREE.Color('#ffe2a0');

function radialTexture(inner: string, outer: string, size = 64): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function prismGeometry(): THREE.BufferGeometry {
  // Triangular prism roof, unit width/depth, height 1, apex along the z axis.
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.lineTo(0.5, 0);
  shape.lineTo(0, 1);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  geo.translate(0, 0, -0.5);
  return geo;
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function createVillage(canvas: HTMLCanvasElement, options: VillageOptions): VillageHandle {
  const rand = seeded(2512);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = options.mode === 'christmas' ? 1.25 : 1.12;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const skyColour = new THREE.Color('#0c1814');
  scene.background = skyColour;
  scene.fog = new THREE.FogExp2(skyColour, 0.018);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
  const target = new THREE.Vector3(0, -1.4, 0);

  // ---------- Light ----------
  scene.add(new THREE.HemisphereLight('#a9b8c8', '#3a2a20', 1.35));
  scene.add(new THREE.AmbientLight('#5a4632', 0.55));
  const moon = new THREE.DirectionalLight('#e2e8ff', 1.7);
  moon.position.set(-8, 12, -6);
  scene.add(moon);
  const treeLight = new THREE.PointLight('#ffb060', 0, 9, 1.6);
  treeLight.position.set(0, 2.2, 0);
  scene.add(treeLight);

  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  // ---------- Plinth ----------
  const plinthSide = track(new THREE.MeshStandardMaterial({ color: '#3a271c', roughness: 0.75 }));
  const snowMat = track(new THREE.MeshStandardMaterial({ color: '#eef2f5', roughness: 0.95 }));
  const plinthGeo = track(new THREE.CylinderGeometry(7.2, 7.6, 0.9, 72, 1));
  const plinth = new THREE.Mesh(plinthGeo, [plinthSide, snowMat, plinthSide]);
  plinth.position.y = -0.45;
  scene.add(plinth);
  // Gentle snow drifts.
  const driftGeo = track(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2));
  const drifts = new THREE.InstancedMesh(driftGeo, snowMat, 26);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const s = new THREE.Vector3();
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const r = 1.6 + rand() * 5;
    m.compose(v.set(Math.cos(a) * r, -0.05, Math.sin(a) * r), q.identity(), s.set(0.5 + rand() * 0.9, 0.12 + rand() * 0.12, 0.5 + rand() * 0.9));
    drifts.setMatrixAt(i, m);
  }
  scene.add(drifts);

  // ---------- Houses ----------
  const HOUSES = 24;
  const housePositions: { x: number; z: number; angle: number; w: number; h: number; d: number }[] = [];
  for (let i = 0; i < HOUSES; i++) {
    const outer = i < 16;
    const count = outer ? 16 : 8;
    const index = outer ? i : i - 16;
    const angle = (index / count) * Math.PI * 2 + (outer ? 0 : Math.PI / 8);
    const radius = outer ? 5.6 : 3.3;
    housePositions.push({
      x: Math.sin(angle) * radius,
      z: Math.cos(angle) * radius,
      angle,
      w: 0.75 + rand() * 0.3,
      h: 0.6 + rand() * 0.35,
      d: 0.7 + rand() * 0.2,
    });
  }
  const bodyGeo = track(new THREE.BoxGeometry(1, 1, 1));
  bodyGeo.translate(0, 0.5, 0);
  const bodyMat = track(new THREE.MeshStandardMaterial({ roughness: 0.85 }));
  const bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, HOUSES);
  const roofGeo = track(prismGeometry());
  const roofMat = track(new THREE.MeshStandardMaterial({ color: '#f4f6f8', roughness: 0.9 }));
  const roofs = new THREE.InstancedMesh(roofGeo, roofMat, HOUSES);
  const eaveMat = track(new THREE.MeshStandardMaterial({ color: '#2a1d17', roughness: 0.9 }));
  const eaves = new THREE.InstancedMesh(roofGeo, eaveMat, HOUSES);
  const chimneyGeo = track(new THREE.BoxGeometry(0.14, 0.4, 0.14));
  const chimneys = new THREE.InstancedMesh(chimneyGeo, eaveMat, HOUSES);
  const windowGeo = track(new THREE.PlaneGeometry(0.22, 0.26));
  const windowMat = track(new THREE.MeshBasicMaterial({ toneMapped: false }));
  const windows = new THREE.InstancedMesh(windowGeo, windowMat, HOUSES * 3);
  const haloTex = track(radialTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)'));
  const haloPos = new Float32Array(HOUSES * 3);
  housePositions.forEach((p, i) => {
    const rot = new THREE.Euler(0, p.angle, 0);
    q.setFromEuler(rot);
    bodies.setMatrixAt(i, m.compose(v.set(p.x, 0, p.z), q, s.set(p.w, p.h, p.d)));
    bodies.setColorAt(i, PALETTE[i % PALETTE.length]!);
    roofs.setMatrixAt(i, m.compose(v.set(p.x, p.h, p.z), q, s.set(p.w * 1.18, 0.5, p.d * 1.12)));
    eaves.setMatrixAt(i, m.compose(v.set(p.x, p.h - 0.04, p.z), q, s.set(p.w * 1.22, 0.5, p.d * 1.16)));
    const offset = new THREE.Vector3(p.w * 0.25, p.h + 0.3, -p.d * 0.2).applyEuler(rot);
    chimneys.setMatrixAt(i, m.compose(v.set(p.x + offset.x, offset.y, p.z + offset.z), q, s.set(1, 1, 1)));
    // Two front windows and one back window. Front faces outward.
    const out = new THREE.Vector3(Math.sin(p.angle), 0, Math.cos(p.angle));
    const side = new THREE.Vector3(out.z, 0, -out.x);
    const front = (dx: number, k: number) => {
      const pos = new THREE.Vector3(p.x, p.h * 0.5, p.z).addScaledVector(out, p.d / 2 + 0.002).addScaledVector(side, dx);
      windows.setMatrixAt(i * 3 + k, m.compose(pos, q, s.set(1, 1, 1)));
    };
    front(-p.w * 0.22, 0);
    front(p.w * 0.22, 1);
    const backPos = new THREE.Vector3(p.x, p.h * 0.5, p.z).addScaledVector(out, -(p.d / 2 + 0.002));
    const backQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.angle + Math.PI, 0));
    windows.setMatrixAt(i * 3 + 2, m.compose(backPos, backQ, s.set(1.3, 1, 1)));
    const haloAt = new THREE.Vector3(p.x, p.h * 0.5, p.z).addScaledVector(out, p.d / 2 + 0.25);
    haloPos.set([haloAt.x, haloAt.y, haloAt.z], i * 3);
  });
  // Light spilling from windows: sprites (point sprites are size-limited on some mobile GPUs).
  const haloWarmMat = track(new THREE.SpriteMaterial({ map: haloTex, color: '#ff9a3c', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }));
  const haloGoldMat = track(new THREE.SpriteMaterial({ map: haloTex, color: '#ffe2a0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
  const haloSprites = housePositions.map((_, i) => {
    const sprite = new THREE.Sprite(haloWarmMat);
    sprite.position.fromArray(haloPos, i * 3);
    sprite.scale.set(1.5, 1.5, 1);
    sprite.visible = false;
    scene.add(sprite);
    return sprite;
  });
  scene.add(bodies, roofs, eaves, chimneys, windows);

  // ---------- Trees around the rim ----------
  const coneGeo = track(new THREE.ConeGeometry(1, 1, 7));
  coneGeo.translate(0, 0.5, 0);
  const pineMat = track(new THREE.MeshStandardMaterial({ color: '#1d3a2d', roughness: 0.9, flatShading: true }));
  const pineSnowMat = track(new THREE.MeshStandardMaterial({ color: '#dfe7ea', roughness: 0.95, flatShading: true }));
  const RIM = 38;
  const pines = new THREE.InstancedMesh(coneGeo, pineMat, RIM * 2);
  const pineCaps = new THREE.InstancedMesh(coneGeo, pineSnowMat, RIM);
  for (let i = 0; i < RIM; i++) {
    const a = (i / RIM) * Math.PI * 2 + rand() * 0.08;
    const r = 6.6 + rand() * 0.4;
    const h = 0.9 + rand() * 0.9;
    const x = Math.sin(a) * r;
    const z = Math.cos(a) * r;
    pines.setMatrixAt(i * 2, m.compose(v.set(x, 0, z), q.identity(), s.set(0.42 * h, h, 0.42 * h)));
    pines.setMatrixAt(i * 2 + 1, m.compose(v.set(x, h * 0.45, z), q.identity(), s.set(0.32 * h, h * 0.75, 0.32 * h)));
    pineCaps.setMatrixAt(i, m.compose(v.set(x, h * 0.85, z), q.identity(), s.set(0.16 * h, h * 0.4, 0.16 * h)));
  }
  scene.add(pines, pineCaps);

  // ---------- Central Christmas tree (day 25) ----------
  const tree = new THREE.Group();
  const treeMat = track(new THREE.MeshStandardMaterial({ color: '#1f4231', roughness: 0.85, flatShading: true }));
  [[1.25, 1.4, 0.2], [1.0, 1.2, 0.95], [0.72, 1.0, 1.6], [0.45, 0.8, 2.15]].forEach(([r, h, y]) => {
    const mesh = new THREE.Mesh(coneGeo, treeMat);
    mesh.scale.set(r!, h!, r!);
    mesh.position.y = y!;
    tree.add(mesh);
  });
  const trunk = new THREE.Mesh(track(new THREE.CylinderGeometry(0.14, 0.18, 0.4, 8)), eaveMat);
  trunk.position.y = 0.1;
  tree.add(trunk);
  const LIGHTS = 72;
  const bulbGeo = track(new THREE.SphereGeometry(0.045, 8, 6));
  const bulbMat = track(new THREE.MeshBasicMaterial({ toneMapped: false }));
  const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, LIGHTS);
  const bulbPalette = [new THREE.Color('#ffd27a'), new THREE.Color('#ff8f6b'), new THREE.Color('#fff1c9'), new THREE.Color('#e9b45a')];
  for (let i = 0; i < LIGHTS; i++) {
    const t = i / LIGHTS;
    const y = 0.35 + t * 2.4;
    const radius = (1.25 * (1 - t) + 0.12) * 0.92;
    const a = t * Math.PI * 2 * 6.5;
    bulbs.setMatrixAt(i, m.compose(v.set(Math.cos(a) * radius, y, Math.sin(a) * radius), q.identity(), s.set(1, 1, 1)));
    bulbs.setColorAt(i, WINDOW_DARK);
  }
  tree.add(bulbs);
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.26 : 0.11;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  starShape.closePath();
  const starMat = track(new THREE.MeshBasicMaterial({ color: '#ffe3a1', toneMapped: false }));
  const star = new THREE.Mesh(track(new THREE.ExtrudeGeometry(starShape, { depth: 0.05, bevelEnabled: false })), starMat);
  star.position.set(0, 3.15, 0);
  star.visible = false;
  tree.add(star);
  const starHaloMat = track(new THREE.SpriteMaterial({ map: haloTex, color: '#ffcf7a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
  const starHalo = new THREE.Sprite(starHaloMat);
  starHalo.scale.set(1.6, 1.6, 1);
  starHalo.position.copy(star.position);
  starHalo.visible = false;
  tree.add(starHalo);
  scene.add(tree);

  // ---------- Sky: stars and moon ----------
  const starCount = 260;
  const starsGeo = track(new THREE.BufferGeometry());
  const starsPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const a = rand() * Math.PI * 2;
    const e = 0.15 + rand() * 1.2;
    starsPos.set([Math.cos(a) * Math.cos(e) * 60, Math.sin(e) * 60, Math.sin(a) * Math.cos(e) * 60], i * 3);
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
  const skyStars = new THREE.Points(starsGeo, track(new THREE.PointsMaterial({ color: '#c8d3e6', size: 0.25, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.8 })));
  scene.add(skyStars);
  const moonSprite = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: track(radialTexture('rgba(245,240,226,1)', 'rgba(245,240,226,0)')), fog: false, transparent: true, depthWrite: false })));
  moonSprite.position.set(-22, 26, -40);
  moonSprite.scale.set(9, 9, 1);
  scene.add(moonSprite);

  // ---------- Snowfall (GPU) ----------
  const snowCount = window.innerWidth < 600 ? 450 : 800;
  const snowGeo = track(new THREE.BufferGeometry());
  const seeds = new Float32Array(snowCount * 4);
  const snowPos = new Float32Array(snowCount * 3);
  for (let i = 0; i < snowCount; i++) seeds.set([rand() * 18 - 9, rand() * 10, rand() * 18 - 9, rand()], i * 4);
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  snowGeo.setAttribute('seed', new THREE.BufferAttribute(seeds, 4));
  const snowMatShader = track(new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uScale: { value: window.devicePixelRatio || 1 } },
    vertexShader: `
      attribute vec4 seed;
      uniform float uTime;
      uniform float uScale;
      varying float vAlpha;
      void main() {
        float speed = 0.35 + seed.w * 0.45;
        float y = mod(seed.y - uTime * speed, 10.0) - 0.3;
        vec3 p = vec3(seed.x + sin(uTime * 0.6 + seed.w * 6.28) * 0.35, y, seed.z + cos(uTime * 0.5 + seed.w * 6.28) * 0.25);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.6 + seed.w * 2.2) * uScale * (12.0 / -mv.z);
        vAlpha = smoothstep(-0.3, 0.6, y) * (0.55 + seed.w * 0.45);
      }`,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha * smoothstep(0.5, 0.1, d));
      }`,
  }));
  const snow = new THREE.Points(snowGeo, snowMatShader);
  snow.frustumCulled = false;
  scene.add(snow);

  // ---------- Kenney Holiday Kit (CC0) ----------
  // The procedural houses and trees above are the fallback. They stay hidden while the kit
  // loads, and are shown only if loading fails, so the village never pops between styles.
  const proceduralTree = tree.children.filter((child) => child !== bulbs && child !== star && child !== starHalo);
  const procedural: THREE.Object3D[] = [bodies, roofs, eaves, chimneys, pines, pineCaps, ...proceduralTree];
  procedural.forEach((o) => (o.visible = false));
  let kitLoaded = false;
  const kitMeshes: THREE.InstancedMesh[] = [];
  let kitMaterial: THREE.Material | null = null;

  import('./kit')
    .then(({ loadKit }) => loadKit())
    .then((kit) => {
      if (disposed) {
        Object.values(kit.geometries).forEach((g) => g.dispose());
        kit.material.dispose();
        return;
      }
      kitMaterial = kit.material;
      const placements = new Map<string, THREE.Matrix4[]>();
      const place = (piece: string, matrix: THREE.Matrix4) => {
        const list = placements.get(piece) ?? [];
        list.push(matrix.clone());
        placements.set(piece, list);
      };
      const local = (x: number, y: number, z: number, rotY: number, scale = 1) =>
        new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0)), new THREE.Vector3(scale, scale, scale));
      const HOUSE_SCALE = 0.82;
      const fronts = ['cabin-window-a', 'cabin-doorway', 'cabin-window-c', 'cabin-window-b'];
      const hidden = new THREE.Matrix4().makeScale(0, 0, 0);

      housePositions.forEach((p, i) => {
        // Fronts face the Christmas tree, so lit doorways read across the square.
        const house = local(p.x, 0, p.z, p.angle + Math.PI, HOUSE_SCALE);
        const at = (m2: THREE.Matrix4) => house.clone().multiply(m2);
        const front = fronts[i % fronts.length]!;
        const sideWindow = i % 2 === 0;
        place(front, at(local(0, 0, 0, 0)));
        const backWindow = i % 5 !== 2;
        place(backWindow ? (i % 2 ? 'cabin-window-c' : 'cabin-window-a') : 'cabin-wall-wreath', at(local(0, 0, 0, Math.PI)));
        place(sideWindow ? 'cabin-window-b' : 'cabin-wall', at(local(0, 0, 0, Math.PI / 2)));
        place('cabin-wall', at(local(0, 0, 0, -Math.PI / 2)));
        for (let c = 0; c < 4; c++) place('cabin-corner-logs', at(local(0, 0, 0, (c * Math.PI) / 2)));
        place('cabin-roof-snow-point', at(local(0, 1, 0, 0)));
        place('cabin-wall-roof-center', at(local(0, 1, 0, 0)));
        place('cabin-wall-roof-center', at(local(0, 1, 0, Math.PI)));
        // Window glow sits just inside each opening, so it shows through the frame.
        const doorway = front === 'cabin-doorway';
        const glowFront = local(0, doorway ? 0.45 : 0.55, 0.69, 0).multiply(new THREE.Matrix4().makeScale(1.8, doorway ? 2.7 : 1.75, 1));
        windows.setMatrixAt(i * 3, at(glowFront));
        windows.setMatrixAt(i * 3 + 1, sideWindow ? at(local(0, 0, 0, Math.PI / 2).multiply(local(0, 0.55, 0.69, 0)).multiply(new THREE.Matrix4().makeScale(1.8, 1.75, 1))) : hidden);
        windows.setMatrixAt(i * 3 + 2, backWindow ? at(local(0, 0, 0, Math.PI).multiply(local(0, 0.55, 0.69, 0)).multiply(new THREE.Matrix4().makeScale(1.8, 1.75, 1))) : hidden);
        haloSprites[i]!.position.copy(new THREE.Vector3(0, 0.55, 1.15).applyMatrix4(house));
      });
      windows.instanceMatrix.needsUpdate = true;

      // Snowy pines around the rim.
      const RIM_TREES = 40;
      for (let i = 0; i < RIM_TREES; i++) {
        const a = (i / RIM_TREES) * Math.PI * 2 + rand() * 0.06;
        const r = 6.55 + rand() * 0.45;
        place(['tree-snow-a', 'tree-snow-b', 'tree-snow-c'][i % 3]!, local(Math.sin(a) * r, 0, Math.cos(a) * r, rand() * Math.PI * 2, 0.75 + rand() * 0.55));
      }
      // The Christmas tree at the centre (Day 25).
      const TREE_SCALE = 1.75;
      place('tree-decorated-snow', local(0, 0, 0, 0.4, TREE_SCALE));
      for (let i = 0; i < LIGHTS; i++) {
        const t = i / LIGHTS;
        const y = 0.3 + t * 3.3;
        const radius = 1.02 * (1 - t) + 0.08;
        const a = t * Math.PI * 2 * 6.5;
        bulbs.setMatrixAt(i, m.compose(v.set(Math.cos(a) * radius, y, Math.sin(a) * radius), q.identity(), s.set(1, 1, 1)));
      }
      bulbs.instanceMatrix.needsUpdate = true;
      starHalo.position.set(0, 2.29 * TREE_SCALE - 0.05, 0);

      // Lanterns along the lane between the two rings, always softly lit.
      const lanternTops: number[] = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 16;
        const r = 4.45;
        place('lantern', local(Math.sin(a) * r, 0, Math.cos(a) * r, a, 0.5));
        lanternTops.push(Math.sin(a) * r, 0.78, Math.cos(a) * r);
      }
      const lanternMat = track(new THREE.SpriteMaterial({ map: haloTex, color: '#ffb35c', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
      for (let i = 0; i < lanternTops.length; i += 3) {
        const glow = new THREE.Sprite(lanternMat);
        glow.position.set(lanternTops[i]!, lanternTops[i + 1]!, lanternTops[i + 2]!);
        glow.scale.set(0.9, 0.9, 1);
        scene.add(glow);
      }

      // A few quiet details.
      place('snowman-hat', local(Math.sin(3.7) * 2.0, 0, Math.cos(3.7) * 2.0, 3.7, 0.7));
      place('sled', local(Math.sin(0.9) * 1.9, 0, Math.cos(0.9) * 1.9, 2.2, 0.8));
      place('reindeer', local(Math.sin(1.35) * 2.05, 0, Math.cos(1.35) * 2.05, 2.6, 0.85));
      for (let i = 0; i < 10; i++) {
        const a = rand() * Math.PI * 2;
        place('snow-pile', local(Math.sin(a) * (2.2 + rand() * 4), 0, Math.cos(a) * (2.2 + rand() * 4), rand() * 6, 0.6 + rand() * 0.6));
      }
      for (let i = 0; i < 4; i++) {
        const a = rand() * Math.PI * 2;
        place('rocks-small', local(Math.sin(a) * 6.1, 0, Math.cos(a) * 6.1, rand() * 6, 0.5));
      }
      if (options.mode === 'christmas') {
        const gifts = ['present-a-cube', 'present-b-round', 'present-a-rectangle', 'present-b-cube'];
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2 + 0.2;
          const r = 1.25 + (i % 2) * 0.3;
          place(gifts[i % gifts.length]!, local(Math.sin(a) * r, 0, Math.cos(a) * r, a * 1.7, 0.9 + (i % 3) * 0.15));
        }
      }

      for (const [piece, matrices] of placements) {
        const geometry = kit.geometries[piece as keyof typeof kit.geometries];
        if (!geometry) continue;
        const mesh = new THREE.InstancedMesh(geometry, kit.material, matrices.length);
        matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
        mesh.instanceMatrix.needsUpdate = true;
        scene.add(mesh);
        kitMeshes.push(mesh);
      }
      // Geometries that were loaded but not placed (for example presents outside Christmas).
      for (const [piece, geometry] of Object.entries(kit.geometries)) if (!placements.has(piece)) geometry.dispose();
      kitLoaded = true;
    })
    .catch(() => {
      procedural.forEach((o) => (o.visible = true));
    })
    .finally(() => {
      if (disposed) return;
      applyStates();
      options.onBuilt?.();
    });

  // ---------- State ----------
  let states: HouseState[] = Array(25).fill('future');
  let hasKey = false;
  let reduced = options.reducedMotion;
  let orbit = 0.35;
  let orbitTarget: number | null = null;
  let disposed = false;
  let raf = 0;
  let last = performance.now();
  let elapsed = 0;
  let frameAvg = 16;
  let frames = 0;
  const pulseIndex = { day: -1 };

  function applyStates() {
    const complete = states.filter((st) => st === 'complete').length;
    pulseIndex.day = states.findIndex((st) => st === 'available' || st === 'in_progress');
    for (let i = 0; i < HOUSES; i++) {
      const st = states[i] ?? 'future';
      const lit = st === 'complete' || options.mode === 'christmas';
      const colour = lit ? WINDOW_WARM : st === 'available' || st === 'in_progress' ? WINDOW_GOLD : WINDOW_DARK;
      for (let k = 0; k < 3; k++) windows.setColorAt(i * 3 + k, colour);
      const sprite = haloSprites[i]!;
      sprite.visible = lit || st === 'available' || st === 'in_progress';
      sprite.material = lit ? haloWarmMat : haloGoldMat;
    }
    if (windows.instanceColor) windows.instanceColor.needsUpdate = true;
    const ratio = options.mode === 'christmas' ? 1 : complete / 24;
    const litBulbs = Math.round(ratio * LIGHTS);
    for (let i = 0; i < LIGHTS; i++) bulbs.setColorAt(i, i < litBulbs ? bulbPalette[i % bulbPalette.length]! : WINDOW_DARK);
    if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true;
    treeLight.intensity = 0.4 + ratio * (options.mode === 'christmas' ? 6 : 3);
    // The kit's decorated tree has its own star; ours is only used by the procedural fallback.
    const showStar = hasKey || options.mode === 'christmas';
    star.visible = showStar && !kitLoaded;
    starHalo.visible = showStar;
    render();
  }

  function placeCamera() {
    const portrait = camera.aspect < 0.9;
    const radius = portrait ? 25 : 18;
    const height = portrait ? 12.5 : 9;
    camera.position.set(Math.sin(orbit) * radius, height, Math.cos(orbit) * radius);
    camera.lookAt(target);
  }

  function render() {
    if (disposed) return;
    placeCamera();
    renderer.render(scene, camera);
  }

  function tick(now: number) {
    if (disposed) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt;
    if (orbitTarget !== null) {
      let delta = orbitTarget - orbit;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      orbit += delta * Math.min(1, dt * 3);
      if (Math.abs(delta) < 0.002) orbitTarget = null;
    } else {
      orbit += dt * 0.035;
    }
    snowMatShader.uniforms.uTime!.value = elapsed;
    if (pulseIndex.day >= 0 && pulseIndex.day < HOUSES) {
      const k = 0.65 + 0.35 * Math.sin(elapsed * 2.4);
      const c = WINDOW_GOLD.clone().multiplyScalar(k);
      for (let j = 0; j < 3; j++) windows.setColorAt(pulseIndex.day * 3 + j, c);
      if (windows.instanceColor) windows.instanceColor.needsUpdate = true;
    }
    if (options.mode === 'christmas') {
      for (let i = 0; i < LIGHTS; i += 3) {
        const twinkle = 0.6 + 0.4 * Math.sin(elapsed * 3 + i);
        bulbs.setColorAt(i, bulbPalette[i % bulbPalette.length]!.clone().multiplyScalar(twinkle));
      }
      if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true;
    }
    render();
    // Adaptive quality: if frames are slow, lower the pixel ratio (never below 1).
    frameAvg = frameAvg * 0.95 + dt * 1000 * 0.05;
    if (++frames % 90 === 0 && frameAvg > 24 && pixelRatio > 1) {
      pixelRatio = Math.max(1, pixelRatio - 0.25);
      renderer.setPixelRatio(pixelRatio);
      resize();
    }
    raf = requestAnimationFrame(tick);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (reduced || document.hidden) {
      render();
      return;
    }
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.9 ? 42 : 34;
    camera.updateProjectionMatrix();
    render();
  }

  const onVisibility = () => (document.hidden ? cancelAnimationFrame(raf) : start());
  document.addEventListener('visibilitychange', onVisibility);
  const onLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(raf);
    options.onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  resize();
  applyStates();
  start();

  return {
    setStates(next, key) {
      states = next;
      hasKey = key;
      applyStates();
    },
    focus(day) {
      if (day === null) return;
      if (day >= 25) orbitTarget = orbit;
      else orbitTarget = housePositions[day - 1]!.angle;
      if (reduced) {
        orbit = orbitTarget;
        orbitTarget = null;
        render();
      }
    },
    setReducedMotion(value) {
      reduced = value;
      start();
    },
    resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      for (const item of disposables) item.dispose();
      for (const mesh of [bodies, roofs, eaves, chimneys, windows, pines, pineCaps, bulbs, drifts]) mesh.dispose();
      for (const mesh of kitMeshes) {
        mesh.geometry.dispose();
        mesh.dispose();
      }
      kitMaterial?.dispose();
      (kitMaterial as THREE.MeshStandardMaterial | null)?.map?.dispose();
      renderer.dispose();
    },
  };
}
