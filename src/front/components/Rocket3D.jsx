// Cohete 3D del final del estreno. `go` lo dispara fuera de la pantalla.
import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Rocket3D({ go }) {
  const mount = useRef(null);
  const goAt = useRef(0);
  useEffect(() => { goAt.current = go ? performance.now() : 0; }, [go]);

  useEffect(() => {
    const el = mount.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    camera.position.set(0, 0.2, 10.5);
    scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x1a1020, 1.1));
    const key = new THREE.DirectionalLight(0xffe2b0, 2.2); key.position.set(4, 3, 6); scene.add(key);

    // Cohete
    const rocket = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: 0xf3eee4, roughness: 0.35, metalness: 0.25 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xe8b95b, roughness: 0.3, metalness: 0.6 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1b2a44, roughness: 0.5, metalness: 0.4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 2.3, 32), white);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 32), gold); nose.position.y = 1.7;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.16, 32), gold); band.position.y = 0.55;
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.46, 0.34, 24), dark); nozzle.position.y = -1.3;
    const port = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), new THREE.MeshStandardMaterial({ color: 0x8fd0ee, emissive: 0x2d6f9c, roughness: 0.1 }));
    port.position.set(0, 0.2, 0.46); port.scale.z = 0.4;
    rocket.add(body, nose, band, nozzle, port);
    for (let i = 0; i < 3; i++) {
      const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(0.75, -0.55); shape.lineTo(0.75, -0.95); shape.lineTo(0, -0.7);
      const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: false }), gold);
      const pivot = new THREE.Group(); fin.position.set(0.48, -0.35, -0.035); pivot.add(fin); pivot.rotation.y = (i / 3) * Math.PI * 2 + 0.5; rocket.add(pivot);
    }
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff9a4a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.9, 20, 1, true), flameMat); flame.rotation.x = Math.PI; flame.position.y = -2.35;
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.1, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1c2, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    core.rotation.x = Math.PI; core.position.y = -1.95;
    rocket.add(flame, core);
    rocket.rotation.z = -0.12;
    scene.add(rocket);

    // Chispas del escape y estrellas que pasan hacia abajo
    const N = 260, sparks = new Float32Array(N * 3), vel = [];
    for (let i = 0; i < N; i++) { sparks.set([0, -99, 0], i * 3); vel.push({ life: Math.random() }); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sparks, 3));
    const sparkPts = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffc27a, size: 0.09, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(sparkPts);
    const M = 320, stars = new Float32Array(M * 3);
    for (let i = 0; i < M; i++) stars.set([(Math.random() - 0.5) * 34, (Math.random() - 0.5) * 30, -4 - Math.random() * 24], i * 3);
    const stg = new THREE.BufferGeometry(); stg.setAttribute("position", new THREE.BufferAttribute(stars, 3));
    scene.add(new THREE.Points(stg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.8 })));

    const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    window.addEventListener("resize", resize); resize();

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf, last = performance.now();
    const frame = (nowT) => {
      const dt = Math.min(0.05, (nowT - last) / 1000), t = nowT / 1000; last = nowT;
      const k = goAt.current ? (nowT - goAt.current) / 1000 : 0;
      rocket.position.y = Math.sin(t * 1.6) * 0.12 + k * k * 9;
      rocket.position.x = Math.sin(t * 0.9) * 0.1 + k * k * 1.2;
      rocket.rotation.y = t * 0.6;
      flame.scale.set(1 + Math.sin(t * 40) * 0.12, 1 + Math.sin(t * 31) * 0.18 + k * 1.5, 1 + Math.cos(t * 37) * 0.12);
      core.scale.y = 1 + Math.sin(t * 52) * 0.2;
      const base = new THREE.Vector3(0, -1.5, 0).applyEuler(rocket.rotation).add(rocket.position);
      for (let i = 0; i < N; i++) {
        const v = vel[i]; v.life -= dt * 1.4;
        if (v.life <= 0) { v.life = 0.5 + Math.random() * 0.5; v.x = (Math.random() - 0.5) * 1.6; v.z = (Math.random() - 0.5) * 1.6; v.y = -5 - Math.random() * 5; sparks.set([base.x, base.y, base.z], i * 3); }
        sparks[i * 3] += v.x * dt; sparks[i * 3 + 1] += v.y * dt; sparks[i * 3 + 2] += v.z * dt;
      }
      sg.attributes.position.needsUpdate = true;
      const speed = 5 + k * 30;
      for (let i = 0; i < M; i++) { stars[i * 3 + 1] -= speed * dt; if (stars[i * 3 + 1] < -15) stars[i * 3 + 1] = 15; }
      stg.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); renderer.dispose(); el.removeChild(renderer.domElement); };
  }, []);

  return <div ref={mount} className="scene3d rocket" aria-hidden="true" />;
}
