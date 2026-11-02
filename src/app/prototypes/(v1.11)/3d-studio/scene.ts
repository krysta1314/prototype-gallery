import * as THREE from "three";

/**
 * 3D Studio hero 场景:low-poly 暖橙街区 + 跟着鼠标滑的滑板小人 + 自动跟拍的摄像机。
 * 主画面渲染整个世界；取景窗(pipEl 所在区域)用跟拍摄像机再渲染一遍，即「生成出来的画面」。
 * 机位、跟拍轨迹、视锥只放在 layer 1,主画面能看到、取景窗里不出现。
 */

export type Hud = { angle: HTMLElement; lens: HTMLElement; dist: HTMLElement; speed: HTMLElement };

const C = {
  bg: 0xffe7d4,
  ground: 0xffeadb,
  grid: 0xffc7a3,
  deep: 0xff5e1a,
  orange: 0xff9a3d,
  coral: 0xff7a59,
  peach: 0xffb38a,
  butter: 0xffd27a,
  cream: 0xfff4ea,
  pink: 0xffc6c0,
  ink: 0x2a2b3d,
  skin: 0xf2c4a0,
  white: 0xffffff,
};

const RIG_LAYER = 1;
// 小人活动范围：往后不超过标题下沿，往前不钻进输入框
const BOUNDS = { minX: -12, maxX: 11, minZ: -3.8, maxZ: 5 };

const mat = (color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0, ...extra });

function box(w: number, h: number, d: number, m: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function shadowed<T extends THREE.Object3D>(o: T) {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return o;
}

// 可复现的随机数，保证每次刷新场景一样
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';

function buildSkater() {
  const root = new THREE.Group(); // 位置 + 朝向(+z 为前进方向)
  const tilt = new THREE.Group(); // 压弯 / ollie 时的倾斜
  root.add(tilt);

  // 滑板
  const board = new THREE.Group();
  const deck = box(0.34, 0.05, 1.12, mat(C.ink));
  deck.position.y = 0.17;
  const grip = box(0.3, 0.012, 1.0, mat(C.deep));
  grip.position.y = 0.2;
  const tailF = box(0.34, 0.05, 0.18, mat(C.ink));
  tailF.position.set(0, 0.2, 0.62);
  tailF.rotation.x = -0.45;
  const tailB = tailF.clone();
  tailB.position.z = -0.62;
  tailB.rotation.x = 0.45;
  board.add(deck, grip, tailF, tailB);
  const wheels: THREE.Object3D[] = [];
  for (const z of [-0.36, 0.36]) {
    const truck = box(0.3, 0.05, 0.08, mat(0xb9b6c4));
    truck.position.set(0, 0.12, z);
    board.add(truck);
    for (const x of [-0.16, 0.16]) {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.07, z);
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 8), mat(C.butter));
      w.rotation.z = Math.PI / 2;
      w.castShadow = true;
      pivot.add(w);
      board.add(pivot);
      wheels.push(pivot);
    }
  }
  tilt.add(board);

  // 小人：侧身站在板上，身体朝 +x,帽檐朝前进方向
  const rider = new THREE.Group();
  rider.position.y = 0.2;
  const pants = mat(C.ink);
  const hoodie = mat(C.deep);
  for (const s of [-1, 1]) {
    const leg = box(0.15, 0.6, 0.17, pants);
    leg.position.set(0, 0.32, s * 0.2);
    leg.rotation.x = s * -0.14;
    const shoe = box(0.26, 0.1, 0.17, mat(C.white));
    shoe.position.set(0.03, 0.04, s * 0.24);
    rider.add(leg, shoe);
    const arm = box(0.11, 0.46, 0.11, hoodie);
    arm.position.set(0, 1.0, s * 0.36);
    arm.rotation.x = s * -1.05;
    const hand = box(0.1, 0.1, 0.1, mat(C.skin));
    hand.position.set(0, 0.86, s * 0.56);
    rider.add(arm, hand);
  }
  const torso = box(0.3, 0.52, 0.44, hoodie);
  torso.position.y = 0.88;
  const pocket = box(0.02, 0.14, 0.24, mat(C.coral));
  pocket.position.set(0.16, 0.76, 0);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), mat(C.skin));
  head.position.y = 1.32;
  head.castShadow = true;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat(C.butter));
  cap.position.y = 1.36;
  cap.castShadow = true;
  const brim = box(0.22, 0.03, 0.2, mat(C.butter));
  brim.position.set(0, 1.37, 0.22);
  rider.add(torso, pocket, head, cap, brim);
  tilt.add(rider);

  shadowed(root);
  return { root, tilt, rider, wheels };
}

function buildCameraRig() {
  // 跟拍机位：一块滑板 + 立杆 + 摄像机，全部只在主画面出现
  const root = new THREE.Group();
  const dolly = new THREE.Group();
  const deck = box(0.5, 0.05, 0.8, mat(C.ink));
  deck.position.y = 0.15;
  dolly.add(deck);
  for (const x of [-0.2, 0.2]) for (const z of [-0.28, 0.28]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.06, 8), mat(C.butter));
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.07, z);
    dolly.add(w);
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), mat(0x8d8a9c));
  pole.position.y = 0.5;
  dolly.add(pole);
  root.add(dolly);

  const cam = new THREE.Group();
  const body = box(0.34, 0.3, 0.5, mat(C.ink));
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.24, 10), mat(0x3b3c52));
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.36;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.022, 6, 14), mat(C.deep));
  ring.position.z = 0.45;
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(0.09, 12),
    new THREE.MeshStandardMaterial({ color: 0x9fd8ff, emissive: 0x2a6fa0, emissiveIntensity: 0.6, roughness: 0.2 }),
  );
  glass.position.z = 0.485;
  cam.add(body, lens, ring, glass);
  for (const z of [-0.12, 0.12]) {
    const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 10), mat(C.orange));
    reel.rotation.z = Math.PI / 2;
    reel.position.set(0, 0.3, z);
    cam.add(reel);
  }
  const rec = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 6, 4),
    new THREE.MeshBasicMaterial({ color: 0xff3b3b }),
  );
  rec.position.set(0.12, 0.1, 0.26);
  cam.add(rec);
  root.add(cam);

  // 视锥：顶点在镜头，底面在 z=1,整体按到主体的距离缩放
  const frustum = new THREE.Group();
  const hw = Math.tan(THREE.MathUtils.degToRad(19)) * (16 / 9);
  const hh = Math.tan(THREE.MathUtils.degToRad(19));
  const corners = [
    [-hw, -hh, 1],
    [hw, -hh, 1],
    [hw, hh, 1],
    [-hw, hh, 1],
  ];
  const faceGeo = new THREE.BufferGeometry();
  const fv: number[] = [];
  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    fv.push(0, 0, 0, ...a, ...b);
  }
  faceGeo.setAttribute("position", new THREE.Float32BufferAttribute(fv, 3));
  const faces = new THREE.Mesh(
    faceGeo,
    new THREE.MeshBasicMaterial({ color: C.deep, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }),
  );
  const lv: number[] = [];
  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    lv.push(0, 0, 0, ...a, ...a, ...b);
  }
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(lv, 3));
  const edges = new THREE.LineSegments(
    edgeGeo,
    new THREE.LineBasicMaterial({ color: C.deep, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  frustum.add(faces, edges);
  frustum.position.z = 0.49;
  cam.add(frustum);

  shadowed(dolly);
  return { root, dolly, pole, cam, frustum, rec };
}

function buildWorld(scene: THREE.Scene) {
  const rand = rng(7);
  const props: { obj: THREE.Object3D; delay: number }[] = [];
  const obstacles: { x: number; z: number; r: number }[] = [];
  const add = (obj: THREE.Object3D, delay: number, r = 0) => {
    shadowed(obj);
    obj.scale.setScalar(0.0001);
    scene.add(obj);
    props.push({ obj, delay });
    if (r) obstacles.push({ x: obj.position.x, z: obj.position.z, r });
  };

  // 地面 + 网格
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), mat(C.ground, { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(80, 80, C.grid, C.grid);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.45;
  grid.position.y = 0.006;
  scene.add(grid);

  // 广告牌(背景)
  const billboard = new THREE.Group();
  billboard.position.set(8.5, 0, -7.5);
  billboard.rotation.y = -0.4;
  const boardTex = canvasTexture(1024, 440, (g) => {
    const grd = g.createLinearGradient(0, 0, 1024, 440);
    grd.addColorStop(0, "#FFA73C");
    grd.addColorStop(1, "#FF5255");
    g.fillStyle = grd;
    g.fillRect(0, 0, 1024, 440);
    g.fillStyle = "rgba(255,255,255,0.16)";
    for (let i = 0; i < 8; i++) g.fillRect(i * 150 - 40, 0, 60, 440);
    g.fillStyle = "#fff";
    g.font = `800 64px ${FONT}`;
    g.fillText("BUZZ KICKS", 70, 120);
    g.font = `900 170px ${FONT}`;
    g.fillText("NEW DROP", 62, 300);
    g.font = `600 40px ${FONT}`;
    g.fillText("Ride the city.", 72, 380);
  });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 0.18), [
    mat(C.cream),
    mat(C.cream),
    mat(C.cream),
    mat(C.cream),
    new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.6 }),
    mat(C.cream),
  ]);
  panel.position.y = 3.2;
  billboard.add(panel);
  for (const x of [-2.6, 2.6]) {
    const post = box(0.22, 1.8, 0.22, mat(C.ink));
    post.position.set(x, 0.9, 0);
    billboard.add(post);
  }
  add(billboard, 0.15);

  // 产品片场：展台 + 饮料罐 + 两盏柔光箱
  const podium = new THREE.Group();
  podium.position.set(-6, 0, -3.2);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.45, 9), mat(C.cream));
  base.position.y = 0.225;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.06, 9), mat(C.pink));
  top.position.y = 0.48;
  const canTex = canvasTexture(512, 256, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, "#FFA73C");
    grd.addColorStop(1, "#FF5255");
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = "#fff";
    g.font = `900 92px ${FONT}`;
    g.fillText("BUZZ", 40, 160);
    g.fillText("BUZZ", 300, 160);
  });
  const can = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 1.35, 14),
    [new THREE.MeshStandardMaterial({ map: canTex, roughness: 0.4, metalness: 0.2 }), mat(0xd9d6e0), mat(0xd9d6e0)],
  );
  can.position.y = 1.18;
  can.rotation.y = 0.6;
  podium.add(base, top, can);
  add(podium, 0.35, 1.45);

  const softbox = (x: number, z: number, aimX: number, aimZ: number, delay: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const pole = box(0.06, 2.2, 0.06, mat(C.ink));
    pole.position.y = 1.1;
    const head = new THREE.Group();
    head.position.y = 2.2;
    const shell = box(1.0, 0.9, 0.35, mat(C.ink));
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff1df, emissiveIntensity: 1 }),
    );
    face.position.z = 0.18;
    head.add(shell, face);
    g.add(pole, head);
    for (const a of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) {
      const leg = box(0.05, 0.05, 0.6, mat(C.ink));
      leg.position.set(Math.sin(a) * 0.28, 0.06, Math.cos(a) * 0.28);
      leg.rotation.y = a;
      g.add(leg);
    }
    add(g, delay, 0.45);
    head.lookAt(aimX, 1.2, aimZ);
  };
  softbox(-8.4, -1.3, -6, -3.2, 0.45);
  softbox(-3.6, -5.4, -6, -3.2, 0.5);

  // 跳台(小人滑过会自动起跳)
  const ramp = new THREE.Group();
  ramp.position.set(4.5, 0, -1.8);
  ramp.rotation.y = -0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-0.9, 0);
  shape.lineTo(0.9, 0);
  shape.lineTo(0.9, 0.55);
  shape.quadraticCurveTo(0.1, 0.12, -0.9, 0);
  const rampGeo = new THREE.ExtrudeGeometry(shape, { depth: 1.5, bevelEnabled: false, curveSegments: 4 });
  rampGeo.translate(0, 0, -0.75);
  rampGeo.rotateY(Math.PI / 2);
  const rampMesh = new THREE.Mesh(rampGeo, mat(C.peach));
  const coping = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6), mat(C.ink));
  coping.position.set(0, 0.56, -0.9);
  coping.rotation.z = Math.PI / 2;
  ramp.add(rampMesh, coping);
  add(ramp, 0.55);

  // 路锥
  for (const [x, z, d] of [
    [1.8, 3.4, 0.6],
    [-2.6, 2.6, 0.62],
    [7.6, 3.2, 0.64],
    [-9.4, 4.2, 0.66],
    [9.8, -3.6, 0.68],
  ]) {
    const cone = new THREE.Group();
    cone.position.set(x, 0, z);
    const foot = box(0.5, 0.06, 0.5, mat(C.deep));
    foot.position.y = 0.03;
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.68, 6), mat(C.orange));
    body.position.y = 0.4;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.1, 6), mat(C.white));
    band.position.y = 0.42;
    cone.add(foot, body, band);
    add(cone, d, 0.35);
  }

  // 外围：石块 + 高耸的晶体(参考 low-poly 草叶)
  const shardColors = [C.coral, C.orange, C.peach, C.deep, C.butter];
  for (let i = 0; i < 70; i++) {
    const a = rand() * Math.PI * 2;
    const ring = 14 + rand() * 16;
    const x = Math.cos(a) * ring * 1.25;
    const z = Math.sin(a) * ring * 0.85 - 2;
    if (z > 9 && Math.abs(x) < 10) continue; // 前景留空，别挡画面
    const h = 1.2 + rand() * 3.4;
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.28 + rand() * 0.35, h, 4 + Math.floor(rand() * 2)), mat(shardColors[i % 5]));
    shard.position.set(x, h / 2 - 0.1, z);
    shard.rotation.set((rand() - 0.5) * 0.35, rand() * 3, (rand() - 0.5) * 0.35);
    add(shard, 0.2 + ring / 40);
  }
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const ring = 9 + rand() * 9;
    const x = Math.cos(a) * ring * 1.3;
    const z = Math.sin(a) * ring * 0.7 - 1;
    const s = 0.3 + rand() * 0.6;
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), mat(i % 3 ? C.cream : C.pink));
    rock.position.set(x, s * 0.45, z);
    rock.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    rock.scale.y = 0.7;
    add(rock, 0.3 + rand() * 0.4, Math.hypot(x, z) < 14 ? s + 0.1 : 0);
  }

  // 漂浮的几何道具
  const floaters: THREE.Mesh[] = [];
  const shapes = [
    new THREE.OctahedronGeometry(0.35, 0),
    new THREE.TorusGeometry(0.32, 0.11, 6, 10),
    new THREE.IcosahedronGeometry(0.3, 0),
    new THREE.TetrahedronGeometry(0.36, 0),
  ];
  for (const [x, y, z, k] of [
    [-10.5, 3.2, -5, 0],
    [9.5, 3.6, -6, 1],
    [-4, 4.4, -8, 2],
    [12, 2.4, 1.5, 3],
    [-12.5, 2.2, 2, 1],
    [6.5, 4.8, -9, 0],
  ]) {
    const f = new THREE.Mesh(shapes[k], mat(shardColors[(k + 1) % 5]));
    f.position.set(x, y, z);
    f.castShadow = true;
    f.userData.baseY = y;
    scene.add(f);
    floaters.push(f);
  }

  return { props, obstacles, floaters, ramp };
}

export function mountScene(container: HTMLElement, pipEl: HTMLElement, hud: Hud) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = "block";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.bg);
  scene.fog = new THREE.Fog(C.bg, 20, 48);

  scene.add(new THREE.HemisphereLight(0xfff3e6, 0xffc9a8, 1.6));
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.4);
  sun.position.set(9, 16, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 50 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const world = buildWorld(scene);
  const skater = buildSkater();
  scene.add(skater.root);
  const rig = buildCameraRig();
  rig.root.traverse((o) => o.layers.set(RIG_LAYER));
  scene.add(rig.root);

  // 跟拍轨迹：贴地的发光丝带
  const TRAIL = 180;
  const trailPts: THREE.Vector3[] = [];
  const trailPos = new Float32Array(TRAIL * 2 * 3);
  const trailCol = new Float32Array(TRAIL * 2 * 4);
  const trailIdx: number[] = [];
  for (let i = 0; i < TRAIL - 1; i++) {
    const a = i * 2;
    trailIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setAttribute("color", new THREE.BufferAttribute(trailCol, 4));
  trailGeo.setIndex(trailIdx);
  const trail = new THREE.Mesh(
    trailGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  );
  trail.frustumCulled = false;
  trail.layers.set(RIG_LAYER);
  scene.add(trail);
  const head = new THREE.Color(C.deep);
  const tail = new THREE.Color(C.butter);

  const mainCam = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  mainCam.layers.enable(RIG_LAYER);
  const pipCam = new THREE.PerspectiveCamera(38, 16 / 9, 0.05, 120);

  // 状态
  const pos = new THREE.Vector3(0, 0, 3);
  const vel = new THREE.Vector3();
  const target = new THREE.Vector3(0, 0, 3);
  let heading = 0;
  let lean = 0;
  let jumpT = -1;
  let jumpH = 0.7;
  let arrived = false;
  let lastInput = -999;
  const pointer = new THREE.Vector2(0, 0);
  const pointerSmooth = new THREE.Vector2(0, 0);
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  const rigPos = new THREE.Vector3(-3, 0, 6);
  const camLook = new THREE.Vector3();
  let width = 1;
  let height = 1;
  let hudTick = 0;

  const clock = new THREE.Clock();
  let elapsed = 0;

  const onMove = (e: PointerEvent) => {
    const r = container.getBoundingClientRect();
    if (e.clientY > r.bottom || e.clientY < r.top) return;
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    lastInput = elapsed;
    arrived = false;
  };
  window.addEventListener("pointermove", onMove);

  const resize = () => {
    width = container.clientWidth;
    height = container.clientHeight;
    renderer.setSize(width, height);
    mainCam.aspect = width / height;
    // 窄屏拉远一点，保证片场完整
    mainCam.fov = width < 768 ? 50 : 36;
    mainCam.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  const ollie = (h: number) => {
    if (jumpT >= 0) return;
    jumpT = 0;
    jumpH = h;
  };

  const step = (dt: number) => {
    elapsed += dt;
    const t = elapsed;

    // 道具逐个「搭」起来
    for (const p of world.props) {
      const k = THREE.MathUtils.clamp((t - p.delay) / 0.55, 0, 1);
      const s = k === 0 ? 0.0001 : 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
      p.obj.scale.setScalar(Math.max(s, 0.0001));
    }
    world.floaters.forEach((f, i) => {
      f.position.y = f.userData.baseY + Math.sin(t * 0.9 + i) * 0.25;
      f.rotation.x += dt * 0.4;
      f.rotation.y += dt * 0.6;
    });

    // 目标：鼠标落在地面的点；闲置 5 秒后自己滑 8 字
    const idle = t - lastInput > 5;
    if (idle) {
      target.set(-1.5 + Math.sin(t * 0.32) * 7, 0, 0.6 + Math.sin(t * 0.64) * 2.6);
    } else {
      ray.setFromCamera(pointer, mainCam);
      if (ray.ray.intersectPlane(plane, hit)) target.copy(hit);
    }
    target.x = THREE.MathUtils.clamp(target.x, BOUNDS.minX, BOUNDS.maxX);
    target.z = THREE.MathUtils.clamp(target.z, BOUNDS.minZ, BOUNDS.maxZ);

    const to = target.clone().sub(pos).setY(0);
    const dist = to.length();
    const desired = to.multiplyScalar(2.4);
    if (desired.length() > 7.5) desired.setLength(7.5);
    vel.lerp(desired, 1 - Math.exp(-3.5 * dt));
    pos.addScaledVector(vel, dt);

    for (const o of world.obstacles) {
      const dx = pos.x - o.x;
      const dz = pos.z - o.z;
      const d = Math.hypot(dx, dz);
      const min = o.r + 0.35;
      if (d < min && d > 0.0001) {
        pos.x = o.x + (dx / d) * min;
        pos.z = o.z + (dz / d) * min;
      }
    }
    pos.x = THREE.MathUtils.clamp(pos.x, BOUNDS.minX, BOUNDS.maxX);
    pos.z = THREE.MathUtils.clamp(pos.z, BOUNDS.minZ, BOUNDS.maxZ);

    const speed = Math.hypot(vel.x, vel.z);
    let turn = 0;
    if (speed > 0.25) {
      const want = Math.atan2(vel.x, vel.z);
      let diff = want - heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const k = 1 - Math.exp(-7 * dt);
      heading += diff * k;
      turn = (diff * k) / Math.max(dt, 0.001);
    }
    lean = THREE.MathUtils.lerp(lean, THREE.MathUtils.clamp(-turn * 0.09 * Math.min(speed / 3, 1.4), -0.42, 0.42), 1 - Math.exp(-8 * dt));

    // 起跳：鼠标停下、滑上跳台、或自己滑时每隔一阵
    if (!idle && dist < 0.35 && speed < 0.8 && !arrived) {
      arrived = true;
      ollie(0.75);
    }
    const rampLocal = world.ramp.worldToLocal(pos.clone());
    if (Math.abs(rampLocal.x) < 0.8 && Math.abs(rampLocal.z) < 0.9 && speed > 2) ollie(1.25);
    if (idle && Math.floor(t / 4.2) !== Math.floor((t - dt) / 4.2)) ollie(0.8);

    let y = 0;
    let pitch = 0;
    let crouch = 1;
    if (jumpT >= 0) {
      jumpT += dt / 0.72;
      const p = Math.min(jumpT, 1);
      y = Math.sin(Math.PI * p) * jumpH;
      pitch = -Math.sin(Math.PI * 2 * p) * 0.32;
      crouch = p < 0.15 || p > 0.88 ? 0.86 : 1;
      if (jumpT >= 1) jumpT = -1;
    }

    skater.root.position.set(pos.x, y, pos.z);
    skater.root.rotation.y = heading;
    skater.tilt.rotation.set(pitch, 0, lean);
    skater.rider.scale.y = THREE.MathUtils.lerp(skater.rider.scale.y, crouch, 0.3);
    skater.rider.position.y = 0.2 + Math.sin(t * 6) * 0.012 * Math.min(speed, 3);
    for (const w of skater.wheels) w.rotation.x += speed * dt * 12;

    // 轨迹采样
    const last = trailPts[trailPts.length - 1];
    if (!last || last.distanceTo(pos) > 0.12) {
      trailPts.push(new THREE.Vector3(pos.x, 0.02, pos.z));
      if (trailPts.length > TRAIL) trailPts.shift();
    }
    const n = trailPts.length;
    for (let i = 0; i < n; i++) {
      const p = trailPts[i];
      const q = trailPts[Math.min(i + 1, n - 1)];
      const r = trailPts[Math.max(i - 1, 0)];
      const dx = q.x - r.x;
      const dz = q.z - r.z;
      const l = Math.hypot(dx, dz) || 1;
      const f = i / Math.max(n - 1, 1);
      const w = 0.05 + f * 0.16;
      trailPos.set([p.x - (dz / l) * w, 0.02, p.z + (dx / l) * w, p.x + (dz / l) * w, 0.02, p.z - (dx / l) * w], i * 6);
      const c = tail.clone().lerp(head, f);
      const a = Math.pow(f, 1.4) * 0.9;
      trailCol.set([c.r, c.g, c.b, a, c.r, c.g, c.b, a], i * 8);
    }
    trailGeo.setDrawRange(0, Math.max(n - 1, 0) * 6);
    trailGeo.attributes.position.needsUpdate = true;
    trailGeo.attributes.color.needsUpdate = true;

    // 跟拍机位：在小人身后斜侧，机位高度缓慢变化(低机位 → 平视 → 高机位)
    const fwd = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
    const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
    const want = pos.clone().addScaledVector(fwd, -3.1).addScaledVector(right, 1.5);
    rigPos.lerp(want, 1 - Math.exp(-2.2 * dt));
    const camH = 1.25 + Math.sin(t * 0.38) * 0.85;
    rig.dolly.position.set(rigPos.x, 0, rigPos.z);
    rig.dolly.rotation.y = Math.atan2(pos.x - rigPos.x, pos.z - rigPos.z);
    rig.pole.scale.y = camH;
    rig.pole.position.y = camH / 2;
    rig.cam.position.set(rigPos.x, camH + 0.15, rigPos.z);
    camLook.set(pos.x, y + 0.85, pos.z);
    rig.cam.lookAt(camLook);
    const toSubject = rig.cam.position.distanceTo(camLook);
    rig.frustum.scale.setScalar(toSubject + 0.4);
    (rig.rec.material as THREE.MeshBasicMaterial).color.setHex(Math.floor(t * 2) % 2 ? 0xff3b3b : 0x7a1f1f);

    pipCam.position.copy(rig.cam.position);
    pipCam.lookAt(camLook);

    // 主镜头：跟一点小人 + 鼠标视差
    pointerSmooth.lerp(pointer, 1 - Math.exp(-3 * dt));
    const narrow = width < 768;
    const baseZ = narrow ? 21 : 18;
    mainCam.position.set(pos.x * 0.15 + pointerSmooth.x * 1.1, (narrow ? 13 : 11.5) + pointerSmooth.y * 0.5, baseZ + pos.z * 0.08);
    // 视线落点放在片场偏后，让小人主要活动在标题与输入框之间的中段
    mainCam.lookAt(pos.x * 0.2 - 1, 0, (narrow ? 0.4 : -1.2) + pos.z * 0.12);

    // 取景窗读数
    if (++hudTick % 6 === 0) {
      const horiz = Math.hypot(rig.cam.position.x - camLook.x, rig.cam.position.z - camLook.z);
      const elev = THREE.MathUtils.radToDeg(Math.atan2(rig.cam.position.y - camLook.y, horiz));
      const kind = elev < -5 ? "Low" : elev > 8 ? "High" : "Eye";
      hud.angle.textContent = `${kind} · ${Math.abs(Math.round(elev))}°`;
      const mm = 12 / Math.tan(THREE.MathUtils.degToRad(pipCam.fov / 2));
      hud.lens.textContent = `${Math.round(mm)} mm`;
      hud.dist.textContent = `${toSubject.toFixed(1)} m`;
      hud.speed.textContent = `${speed.toFixed(1)} m/s`;
    }
  };

  const render = () => {
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.render(scene, mainCam);

    const cr = container.getBoundingClientRect();
    const pr = pipEl.getBoundingClientRect();
    if (pr.width > 0) {
      const x = pr.left - cr.left;
      const yb = cr.bottom - pr.bottom;
      pipCam.aspect = pr.width / pr.height;
      pipCam.updateProjectionMatrix();
      renderer.setScissorTest(true);
      renderer.setViewport(x, yb, pr.width, pr.height);
      renderer.setScissor(x, yb, pr.width, pr.height);
      renderer.render(scene, pipCam);
      renderer.setScissorTest(false);
    }
  };

  let raf = 0;
  const loop = () => {
    const dt = Math.min(clock.getDelta(), 1 / 30);
    step(dt);
    render();
    raf = requestAnimationFrame(loop);
  };

  if (reduced) {
    // 减少动效：直接摆好最终画面，不跑动画
    step(3);
    lastInput = -999;
    render();
  } else {
    loop();
  }

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener("pointermove", onMove);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((x) => {
        (x as THREE.MeshStandardMaterial).map?.dispose();
        x.dispose();
      });
    });
    renderer.dispose();
    renderer.domElement.remove();
  };
}
