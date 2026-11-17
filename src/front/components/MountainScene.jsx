// Escena 3D del login: una cumbre low-poly con sol naciente. Al entrar, la cámara despega sobre la cima.
import { useEffect, useRef } from "react";
import * as THREE from "three";

const height = (x, z) => {
  let y = 9.5 * Math.exp(-(x * x + z * z) / 38)
    + 4.2 * Math.exp(-((x - 10) ** 2 + (z + 5) ** 2) / 34)
    + 5 * Math.exp(-((x + 12) ** 2 + (z + 7) ** 2) / 48)
    + 3 * Math.exp(-((x + 4) ** 2 + (z - 13) ** 2) / 40);
  y += Math.sin(x * 0.9 + z * 0.3) * 0.35 + Math.sin(z * 1.3 - x * 0.5) * 0.3;
  y += Math.sin(x * 2.3) * Math.cos(z * 2.1) * 0.16 * (1 + y * 0.35);
  return y;
};

export function MountainScene({ launch }) {
  const mount = useRef(null);
  const launchAt = useRef(0);
  useEffect(() => { if (launch) launchAt.current = performance.now(); }, [launch]);

  useEffect(() => {
    const el = mount.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio < 2, alpha: true, powerPreference: "high-performance" }); } catch { return; } // sin WebGL queda el cielo CSS
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x101d33, 0.026);
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 300);

    // Terreno
    const plane = new THREE.PlaneGeometry(90, 90, 70, 70);
    plane.rotateX(-Math.PI / 2);
    const pos = plane.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i)));
    const geo = plane.toNonIndexed();
    const p = geo.attributes.position, colors = new Float32Array(p.count * 3);
    const snow = new THREE.Color("#F1EEE6"), rock = new THREE.Color("#3A4A66"), base = new THREE.Color("#16263F"), warm = new THREE.Color("#C98B5A"), c = new THREE.Color();
    for (let i = 0; i < p.count; i += 3) {
      const h = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
      if (h > 6.4) c.copy(snow); else if (h > 2.2) c.copy(rock).lerp(warm, Math.max(0, (h - 4) / 8)); else c.copy(base).lerp(rock, Math.max(0, h / 2.2));
      for (let k = 0; k < 3; k++) c.toArray(colors, (i + k) * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0.04 })));

    // Sol y su halo
    const sun = new THREE.Mesh(new THREE.SphereGeometry(4.2, 40, 40), new THREE.MeshBasicMaterial({ color: 0xf5cf7a, fog: false }));
    sun.position.set(14, 6.5, -70);
    scene.add(sun);
    const cv = document.createElement("canvas"); cv.width = cv.height = 256;
    const g = cv.getContext("2d"), grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(255,214,140,.9)"); grad.addColorStop(0.3, "rgba(240,160,100,.35)"); grad.addColorStop(1, "rgba(240,160,100,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), fog: false, transparent: true, depthWrite: false }));
    halo.scale.set(60, 60, 1); halo.position.copy(sun.position);
    scene.add(halo);

    const light = new THREE.DirectionalLight(0xffc98a, 2.4);
    light.position.set(14, 12, -40);
    scene.add(light, new THREE.HemisphereLight(0x9cc0e8, 0x0b1626, 0.75));

    // Estrellas
    const sp = new Float32Array(700 * 3);
    for (let i = 0; i < 700; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI * 0.5, r = 140;
      sp.set([Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r + 6, Math.sin(a) * Math.cos(e) * r], i * 3);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, fog: false, transparent: true, opacity: 0.85 })));

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => { mouse.tx = e.clientX / window.innerWidth - 0.5; mouse.ty = e.clientY / window.innerHeight - 0.5; };
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h); camera.aspect = w / h; camera.fov = w < 700 ? 62 : 48; camera.updateProjectionMatrix();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("resize", resize);
    resize();

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let raf, last = t0;
    const frame = (nowT) => {
      const t = still ? 0 : (nowT - t0) / 1000;
      // Amortiguación independiente de los FPS: responde rápido y frena suave
      const dt = Math.min(0.05, (nowT - last) / 1000), ease = 1 - Math.exp(-dt * 6); last = nowT;
      mouse.x += (mouse.tx - mouse.x) * ease; mouse.y += (mouse.ty - mouse.y) * ease;
      const a = Math.sin(t * 0.06) * 0.22 + mouse.x * 0.95;
      let R = 27 + mouse.y * 3, y = 6.4 - mouse.y * 4.5, lookY = 5;
      halo.material.rotation = t * 0.05;
      if (launchAt.current) { // despegue: subir y cruzar la cumbre hacia el sol
        const k = Math.min(1, (nowT - launchAt.current) / 1500), e = k * k * (3 - 2 * k);
        R = 27 - e * 34; y += e * 13; lookY = 5 + e * 3;
      }
      camera.position.set(Math.sin(a) * R, y, Math.cos(a) * R);
      camera.lookAt(0, lookY, -20 * (launchAt.current ? 1 : 0));
      renderer.render(scene, camera);
      if (!still || launchAt.current) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      renderer.dispose(); geo.dispose(); sg.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mount} className="scene3d" aria-hidden="true" />;
}
