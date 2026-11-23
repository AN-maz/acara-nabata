/* Karakter 3D idle di pojok kanan bawah — robot kecil pakai three.js.
   Dimuat sebagai ES module lewat importmap di index.html. */

import * as THREE from "three";

const container = document.getElementById("character");

if (container && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  init();
}

function init() {
  const width = () => container.clientWidth || 170;
  const height = () => container.clientHeight || 210;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width(), height());
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, width() / height(), 0.1, 50);
  camera.position.set(0, 0.5, 6);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x5566cc, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7c5cff, 0.9);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  const bot = buildBot();
  scene.add(bot.group);

  // Kepala & badan agak ngikutin kursor
  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  });

  let elapsed = 0;
  let blinkTimer = 2.5;
  let blinking = 0;

  const clock = new THREE.Clock();

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (document.hidden) return;
    elapsed += dt;

    // idle: mengambang + goyang pelan
    bot.group.position.y = Math.sin(elapsed * 1.6) * 0.14;
    bot.group.rotation.y = Math.sin(elapsed * 0.6) * 0.18 + pointer.x * 0.4;
    bot.group.rotation.z = Math.sin(elapsed * 0.9) * 0.05;

    // kepala nengok dikit ke arah kursor
    bot.head.rotation.y = THREE.MathUtils.lerp(bot.head.rotation.y, pointer.x * 0.5, 0.06);
    bot.head.rotation.x = THREE.MathUtils.lerp(bot.head.rotation.x, -pointer.y * 0.3, 0.06);

    // tangan melambai
    bot.armL.rotation.z = 0.35 + Math.sin(elapsed * 2) * 0.18;
    bot.armR.rotation.z = -0.35 - Math.sin(elapsed * 2 + 1) * 0.18;

    // kedip
    blinkTimer -= dt;
    if (blinkTimer <= 0) {
      blinking = 0.14;
      blinkTimer = 2.5 + Math.random() * 3;
    }
    if (blinking > 0) {
      blinking -= dt;
      bot.eyeL.scale.y = 0.12;
      bot.eyeR.scale.y = 0.12;
    } else {
      bot.eyeL.scale.y = 1;
      bot.eyeR.scale.y = 1;
    }

    // lampu antenna berdenyut
    const pulse = 0.6 + Math.sin(elapsed * 3) * 0.4;
    bot.antennaLight.material.emissiveIntensity = pulse;

    renderer.render(scene, camera);
  }
  frame();

  const ro = new ResizeObserver(() => {
    camera.aspect = width() / height();
    camera.updateProjectionMatrix();
    renderer.setSize(width(), height());
  });
  ro.observe(container);
}

function buildBot() {
  const group = new THREE.Group();

  const violet = new THREE.MeshStandardMaterial({ color: 0x7c5cff, roughness: 0.45 });
  const violetDark = new THREE.MeshStandardMaterial({ color: 0x5b3fe0, roughness: 0.5 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xf3f5ff, roughness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1d2b, roughness: 0.3 });
  const glow = new THREE.MeshStandardMaterial({
    color: 0x38d9f5,
    emissive: 0x38d9f5,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });

  // badan
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.52, 0.55, 8, 20), violet);
  body.position.y = -0.1;
  group.add(body);

  // perut: panel kecil
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.26, 0.06), violetDark);
  panel.position.set(0, -0.1, 0.5);
  group.add(panel);

  // lengan
  const armGeo = new THREE.CapsuleGeometry(0.14, 0.4, 6, 12);
  const armL = new THREE.Mesh(armGeo, violetDark);
  armL.position.set(-0.66, -0.05, 0);
  armL.rotation.z = 0.35;
  group.add(armL);

  const armR = new THREE.Mesh(armGeo, violetDark);
  armR.position.set(0.66, -0.05, 0);
  armR.rotation.z = -0.35;
  group.add(armR);

  // kaki
  const legGeo = new THREE.CapsuleGeometry(0.16, 0.3, 6, 12);
  const legL = new THREE.Mesh(legGeo, violetDark);
  legL.position.set(-0.24, -0.85, 0);
  group.add(legL);
  const legR = new THREE.Mesh(legGeo, violetDark);
  legR.position.set(0.24, -0.85, 0);
  group.add(legR);

  // kepala (group terpisah biar bisa nengok sendiri)
  const head = new THREE.Group();
  head.position.y = 0.85;
  group.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 32), cream);
  head.add(skull);

  // telinga/kuping
  const earGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.1, 16);
  const earL = new THREE.Mesh(earGeo, violet);
  earL.rotation.z = Math.PI / 2;
  earL.position.set(-0.55, 0, 0);
  head.add(earL);
  const earR = earL.clone();
  earR.position.x = 0.55;
  head.add(earR);

  // mata
  const eyeGeo = new THREE.SphereGeometry(0.1, 20, 20);
  const eyeL = new THREE.Mesh(eyeGeo, dark);
  eyeL.position.set(-0.18, 0.06, 0.5);
  head.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, dark);
  eyeR.position.set(0.18, 0.06, 0.5);
  head.add(eyeR);

  // pipi merah muda
  const blushMat = new THREE.MeshStandardMaterial({ color: 0xff9db0, roughness: 0.6 });
  const blushGeo = new THREE.SphereGeometry(0.07, 16, 16);
  const blushL = new THREE.Mesh(blushGeo, blushMat);
  blushL.position.set(-0.34, -0.1, 0.46);
  head.add(blushL);
  const blushR = blushL.clone();
  blushR.position.x = 0.34;
  head.add(blushR);

  // mulut: setengah torus (senyum)
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.02, 8, 24, Math.PI),
    dark
  );
  mouth.position.set(0, -0.1, 0.52);
  mouth.rotation.z = Math.PI;
  head.add(mouth);

  // antena
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), violetDark);
  stick.position.set(0.18, 0.62, 0);
  head.add(stick);
  const antennaLight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), glow);
  antennaLight.position.set(0.18, 0.78, 0);
  head.add(antennaLight);

  return { group, head, armL, armR, eyeL, eyeR, antennaLight };
}