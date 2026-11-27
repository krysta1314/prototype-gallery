import * as THREE from "three";

/* 2026-11-27 Monica「不是这样出来的，而是像 blender 一样在这个工作室里面一点一点绘制 3D」——
   3D to Video 首屏演示的视口：Blender 式深灰网格视口里，灰模物件按顺序一个个加进场景(弹出 + 橙色选中描边 + 移动轴),
   视角缓慢环绕。编辑一步(edit 0→1)加粉色霓虹灯、摄像机和跟拍轨迹，跑车沿路往前开。
   由组件每帧写 state.build / state.edit(0..1),这里只负责画。 */

export type BuildItem = { name: string; kind: "mesh" | "light" | "camera"; at: number };

const CLAY = 0xc9c9c9;
const CLAY_D = 0xa9a9a9;
const SEL = 0xff8a3d;

const clay = (c = CLAY) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, metalness: 0, flatShading: true });
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
};

function palm(h: number) {
  const g = new THREE.Group();
  const m = clay(CLAY_D);
  let y = 0, x = 0;
  for (let i = 0; i < 5; i++) {
    const seg = mesh(new THREE.CylinderGeometry(0.13 - i * 0.012, 0.16 - i * 0.012, h / 5, 6), m, x, y + h / 10, 0);
    seg.rotation.z = -0.06 * i;
    g.add(seg);
    y += h / 5;
    x += 0.06 * i;
  }
  for (let i = 0; i < 7; i++) {
    const leaf = mesh(new THREE.BoxGeometry(1.9, 0.05, 0.42), clay(), x, y, 0);
    leaf.geometry.translate(0.95, 0, 0);
    leaf.rotation.y = (i / 7) * Math.PI * 2;
    leaf.rotation.z = -0.45;
    g.add(leaf);
  }
  return g;
}

function lamp() {
  const g = new THREE.Group();
  const m = clay(CLAY_D);
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.2, 6), m, 0, 2.1, 0));
  g.add(mesh(new THREE.BoxGeometry(1.1, 0.08, 0.12), m, -0.5, 4.15, 0));
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.14, 0.3), clay(), -1.0, 4.05, 0));
  return g;
}

function car() {
  const g = new THREE.Group();
  const body = clay(0xd6d6d6);
  const b = mesh(new THREE.BoxGeometry(4.3, 0.55, 1.9), body, 0, 0.62, 0);
  g.add(b);
  const nose = mesh(new THREE.BoxGeometry(1.0, 0.3, 1.8), body, 2.35, 0.55, 0);
  nose.rotation.z = -0.18;
  g.add(nose);
  const cab = mesh(new THREE.BoxGeometry(1.9, 0.5, 1.6), clay(0xbdbdbd), -0.35, 1.13, 0);
  g.add(cab);
  const wing = mesh(new THREE.BoxGeometry(0.35, 0.06, 1.8), body, -2.05, 1.12, 0);
  g.add(wing);
  for (const [x, z] of [[1.4, 0.95], [1.4, -0.95], [-1.4, 0.95], [-1.4, -0.95]]) {
    const w = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 10), clay(0x8f8f8f), x, 0.42, z);
    w.rotation.x = Math.PI / 2;
    g.add(w);
  }
  return g;
}

function cameraRig() {
  const g = new THREE.Group();
  const ink = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6 });
  g.add(mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), ink, 0, 0, 0));
  const lens = mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.4, 10), ink, 0.52, 0, 0);
  lens.rotation.z = Math.PI / 2;
  g.add(lens);
  const fr = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0.7, 0, 0), new THREE.Vector3(3.2, 1.0, 1.6),
    new THREE.Vector3(0.7, 0, 0), new THREE.Vector3(3.2, 1.0, -1.6),
    new THREE.Vector3(0.7, 0, 0), new THREE.Vector3(3.2, -0.8, 1.6),
    new THREE.Vector3(0.7, 0, 0), new THREE.Vector3(3.2, -0.8, -1.6),
    new THREE.Vector3(3.2, 1.0, 1.6), new THREE.Vector3(3.2, 1.0, -1.6),
    new THREE.Vector3(3.2, 1.0, -1.6), new THREE.Vector3(3.2, -0.8, -1.6),
    new THREE.Vector3(3.2, -0.8, -1.6), new THREE.Vector3(3.2, -0.8, 1.6),
    new THREE.Vector3(3.2, -0.8, 1.6), new THREE.Vector3(3.2, 1.0, 1.6),
  ]);
  g.add(new THREE.LineSegments(fr, new THREE.LineBasicMaterial({ color: SEL, transparent: true, opacity: 0.85 })));
  return g;
}

/* Blender 式移动轴：红 X / 绿 Y / 蓝 Z */
function gizmo() {
  const g = new THREE.Group();
  const arrow = (color: number, rot: [number, number, number]) => {
    const a = new THREE.Group();
    const m = new THREE.MeshBasicMaterial({ color, depthTest: false });
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.3, 6), m);
    s.position.y = 0.65;
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 10), m);
    c.position.y = 1.4;
    a.add(s, c);
    a.rotation.set(...rot);
    a.renderOrder = 10;
    s.renderOrder = c.renderOrder = 10;
    return a;
  };
  g.add(arrow(0xff4d5e, [0, 0, -Math.PI / 2]), arrow(0x8bd450, [0, 0, 0]), arrow(0x4f8cff, [Math.PI / 2, 0, 0]));
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }));
  dot.renderOrder = 11;
  g.add(dot);
  return g;
}

function outline(o: THREE.Object3D) {
  const g = new THREE.Group();
  const m = new THREE.LineBasicMaterial({ color: SEL, depthTest: false, transparent: true, opacity: 0.95 });
  o.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(o.matrixWorld).invert();
  o.traverse((c) => {
    const me = c as THREE.Mesh;
    if (!me.isMesh) return;
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(me.geometry, 30), m);
    l.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, me.matrixWorld));
    l.renderOrder = 9;
    g.add(l);
  });
  return g;
}

type Spawn = { obj: THREE.Object3D; at: number; base: THREE.Vector3; flat?: boolean; sel: THREE.Group; edit?: boolean };

export function createBuildScene(canvas: HTMLCanvasElement, state: { build: number; edit: number }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const BG = new THREE.Color(0x3a3a3a);
  const BG_DUSK = new THREE.Color(0x3b2f3a);
  scene.background = BG.clone();

  const cam = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 200);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x555555, 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-8, 16, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 60 });
  scene.add(sun);

  /* Blender 视口地面网格 + 红绿轴线 */
  const grid = new THREE.GridHelper(80, 80, 0x4c4c4c, 0x444444);
  (grid.material as THREE.Material).transparent = true;
  scene.add(grid);
  const axis = (c: number, a: THREE.Vector3, b: THREE.Vector3) => new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color: c }));
  scene.add(axis(0x9b3a44, new THREE.Vector3(-40, 0.01, 0), new THREE.Vector3(40, 0.01, 0)));
  scene.add(axis(0x5f7d3a, new THREE.Vector3(0, 0.01, -40), new THREE.Vector3(0, 0.01, 40)));

  const spawns: Spawn[] = [];
  const items: BuildItem[] = [];
  const add = (name: string, obj: THREE.Object3D, at: number, opts: { flat?: boolean; edit?: boolean; kind?: BuildItem["kind"] } = {}) => {
    scene.add(obj);
    const sel = outline(obj);
    obj.add(sel);
    spawns.push({ obj, at, base: obj.scale.clone(), flat: opts.flat, sel, edit: opts.edit });
    items.push({ name, kind: opts.kind ?? "mesh", at });
    obj.scale.setScalar(0.0001);
  };

  /* 搭建顺序(build 0→1):地面 → 马路 → 人行道 → 楼 → 棕榈树 → 路灯 → 跑车 */
  const road = mesh(new THREE.BoxGeometry(44, 0.08, 7), clay(0xb4b4b4), 0, 0.04, 0);
  add("Road", road, 0.0, { flat: true });
  add("Sidewalk.L", mesh(new THREE.BoxGeometry(44, 0.25, 3), clay(), 0, 0.12, -5), 0.06, { flat: true });
  add("Sidewalk.R", mesh(new THREE.BoxGeometry(44, 0.25, 3), clay(), 0, 0.12, 5), 0.11, { flat: true });
  const blds: [number, number, number, number, number][] = [
    /* 只搭马路远侧一排楼(近侧放楼会挡住马路和跑车) */
    [-16, 4.5, -10, 6, 5], [-9, 7.5, -10.5, 6, 6], [-2, 5, -10, 6.5, 5], [5, 9, -10.5, 6, 6], [12, 4, -10, 6.5, 5], [18, 6.5, -10.5, 5, 6],
  ];
  blds.forEach(([x, h, z, w, d], i) => {
    const b = mesh(new THREE.BoxGeometry(w, h, d), clay(i % 2 ? CLAY : 0xd2d2d2), x, h / 2, z);
    add(`Building.${String(i + 1).padStart(3, "0")}`, b, 0.17 + i * 0.05);
  });
  [[-13, -5.4], [-5, -5.4], [3, -5.4], [11, -5.4], [-9, 5.4], [-1, 5.4], [7, 5.4]].forEach(([x, z], i) => {
    const p = palm(4.2 + (i % 3) * 0.6);
    p.position.set(x, 0.25, z);
    p.rotation.y = i * 1.3;
    add(`Palm.${String(i + 1).padStart(3, "0")}`, p, 0.5 + i * 0.035);
  });
  [[-8, -3.9], [6, -3.9], [-2, 3.9], [12, 3.9]].forEach(([x, z], i) => {
    const l = lamp();
    l.position.set(x, 0.25, z);
    l.rotation.y = z > 0 ? Math.PI : 0;
    add(`StreetLight.${String(i + 1).padStart(3, "0")}`, l, 0.76 + i * 0.03);
  });
  const sports = car();
  sports.position.set(-4, 0, 1.2);
  sports.rotation.y = -0.08;
  sports.scale.setScalar(1.5);
  add("SportsCar", sports, 0.88);

  /* 编辑一步：粉色霓虹 + 跟拍摄像机 + 轨迹 */
  const neon = new THREE.Group();
  const neonLights: THREE.PointLight[] = [];
  [[-8, -3.9], [6, -3.9], [-2, 3.9], [12, 3.9]].forEach(([x, z]) => {
    const pl = new THREE.PointLight(0xff4fa3, 0, 14, 1.6);
    pl.position.set(x + (z > 0 ? 1 : -1), 3.9, z);
    neon.add(pl);
    neonLights.push(pl);
    const strip = mesh(new THREE.BoxGeometry(0.5, 0.08, 0.32), new THREE.MeshBasicMaterial({ color: 0xff4fa3 }), x + (z > 0 ? 1 : -1), 3.95, z);
    strip.castShadow = false;
    neon.add(strip);
  });
  neon.visible = false;
  scene.add(neon);
  items.push({ name: "NeonLights · pink", kind: "light", at: 1.01 });

  const rig = cameraRig();
  rig.position.set(-8.5, 1.1, 3.6);
  rig.rotation.y = 0.35;
  add("Camera · Tracking", rig, 1.02, { edit: true, kind: "camera" });
  const pathCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-8.5, 0.1, 3.6), new THREE.Vector3(-4, 0.1, 3.4), new THREE.Vector3(1, 0.1, 3.1), new THREE.Vector3(6, 0.1, 2.9),
  ]);
  const path = new THREE.Mesh(new THREE.TubeGeometry(pathCurve, 60, 0.12, 6), new THREE.MeshBasicMaterial({ color: SEL, transparent: true, opacity: 0.9 }));
  const PATH_IDX = path.geometry.index!.count;
  path.geometry.setDrawRange(0, 0);
  scene.add(path);

  const giz = gizmo();
  scene.add(giz);

  const ease = (x: number) => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  const tmp = new THREE.Vector3();
  const box3 = new THREE.Box3();

  let w = 0, h = 0, raf = 0, alive = true;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    if (r.width === w && r.height === h) return;
    w = r.width; h = r.height;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  };
  const t0 = performance.now();
  const frame = () => {
    if (!alive) return;
    resize();
    const time = (performance.now() - t0) / 1000;
    const b = state.build, e = state.edit;

    /* 视角：缓慢环绕;搭建初期拉近一点，越搭越拉远 */
    const ang = -0.75 + Math.sin(time * 0.12) * 0.22;
    const rad = 46 - 4 * (1 - clamp(b * 1.4));
    cam.position.set(Math.sin(ang) * rad, 21 + 2 * (1 - b), Math.cos(ang) * rad);
    cam.lookAt(1, 0.5, 3.5);

    let current: Spawn | undefined;
    for (const s of spawns) {
      const k = s.edit ? clamp((e - 0.15) / 0.3) : clamp((b - s.at) / 0.07);
      const v = k <= 0 ? 0.0001 : s.flat ? 1 : ease(k);
      if (s.flat) s.obj.scale.set(s.base.x * Math.max(0.0001, k), s.base.y, s.base.z);
      else s.obj.scale.set(s.base.x * v, s.base.y * v, s.base.z * v);
      s.sel.visible = false;
      if (k > 0) current = s;
    }
    /* 编辑阶段：选中摄像机;跑车沿路开 */
    if (e > 0) {
      sports.position.x = -4 + e * 6;
      rig.position.x = -8.5 + e * 6;
    } else sports.position.x = -4;
    if (current && (b < 1 || e > 0) && !(b >= 1 && e === 0)) {
      current.sel.visible = true;
      box3.setFromObject(current.obj);
      box3.getCenter(tmp);
      giz.position.set(tmp.x, box3.max.y + 0.2, tmp.z);
      giz.visible = true;
      const gs = rad / 18;
      giz.scale.setScalar(gs);
    } else giz.visible = b > 0 && b < 1;

    /* 霓虹与天色 */
    const n = clamp(e / 0.4);
    neon.visible = n > 0;
    neonLights.forEach((l) => (l.intensity = n * 38));
    hemi.color.setRGB(1, 1 - 0.25 * n, 1 - 0.1 * n);
    sun.intensity = 2.2 - 1.0 * n;
    (scene.background as THREE.Color).copy(BG).lerp(BG_DUSK, n);
    path.geometry.setDrawRange(0, Math.floor(PATH_IDX * clamp((e - 0.3) / 0.5) / 3) * 3);

    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    items,
    dispose() {
      alive = false;
      cancelAnimationFrame(raf);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mm = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mm) ? mm : mm ? [mm] : []).forEach((x) => x.dispose());
      });
      renderer.dispose();
    },
  };
}
