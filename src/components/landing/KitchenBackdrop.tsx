"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface AnimatedPart {
  object: THREE.Object3D;
  baseY: number;
  phase: number;
  kind: "sway" | "steam";
}

function box(width: number, height: number, depth: number, material: THREE.Material) {
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
}

function cabinet(
  x: number,
  y: number,
  width: number,
  height: number,
  bodyMaterial: THREE.Material,
  trimMaterial: THREE.Material
) {
  const group = new THREE.Group();
  group.add(box(width, height, 0.62, bodyMaterial));
  const inset = box(width * 0.78, height * 0.76, 0.035, trimMaterial);
  inset.position.z = 0.33;
  group.add(inset);
  const handle = box(0.34, 0.045, 0.07, trimMaterial);
  handle.position.set(width * 0.28, 0, 0.39);
  group.add(handle);
  group.position.set(x, y, -2.55);
  return group;
}

function pendant(x: number, cordMaterial: THREE.Material, shadeMaterial: THREE.Material) {
  const group = new THREE.Group();
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.25, 8), cordMaterial);
  cord.position.y = 0.62;
  group.add(cord);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.48, 28, 1, true), shadeMaterial);
  shade.rotation.x = Math.PI;
  group.add(shade);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffd58a })
  );
  bulb.position.y = -0.15;
  group.add(bulb);
  group.position.set(x, 2.75, -1.8);
  return group;
}

function jar(x: number, color: number, lidMaterial: THREE.Material) {
  const group = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: 0.72,
    roughness: 0.28,
  });
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.48, 18), glass));
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.07, 18), lidMaterial);
  lid.position.y = 0.27;
  group.add(lid);
  group.position.set(x, 1.42, -1.62);
  return group;
}

function hangingUtensil(x: number, material: THREE.Material, shape: "spoon" | "spatula") {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.82, 10), material));
  const head =
    shape === "spoon"
      ? new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), material)
      : box(0.25, 0.3, 0.05, material);
  head.scale.y = shape === "spoon" ? 1.35 : 1;
  head.position.y = -0.52;
  group.add(head);
  group.position.set(x, 0.78, -1.45);
  return group;
}

export default function KitchenBackdrop() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.6, 10);
    camera.lookAt(0, 0, -2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.88;
    host.appendChild(renderer.domElement);

    const materials = {
      wall: new THREE.MeshStandardMaterial({ color: 0xe7cfad, roughness: 1 }),
      tile: new THREE.MeshStandardMaterial({ color: 0xa9d2c9, roughness: 0.78 }),
      cabinet: new THREE.MeshStandardMaterial({ color: 0xf8ecd6, roughness: 0.72 }),
      teal: new THREE.MeshStandardMaterial({ color: 0x2d7d78, roughness: 0.65 }),
      wood: new THREE.MeshStandardMaterial({ color: 0xa75f32, roughness: 0.58 }),
      darkWood: new THREE.MeshStandardMaterial({ color: 0x704630, roughness: 0.7 }),
      terracotta: new THREE.MeshStandardMaterial({ color: 0xd96c3b, roughness: 0.72 }),
      brass: new THREE.MeshStandardMaterial({ color: 0xd6a13b, roughness: 0.3, metalness: 0.52 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x31423e, roughness: 0.4, metalness: 0.15 }),
      glass: new THREE.MeshStandardMaterial({ color: 0xb8ded7, roughness: 0.15, transparent: true, opacity: 0.58 }),
      steam: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32 }),
    };

    scene.add(new THREE.HemisphereLight(0xfffcf5, 0x9f7050, 1.25));
    const sun = new THREE.DirectionalLight(0xffffff, 1.65);
    sun.position.set(-3, 6, 7);
    scene.add(sun);

    const wall = box(14, 7, 0.15, materials.wall);
    wall.position.set(0, 0.45, -3.5);
    scene.add(wall);
    const backsplash = box(12, 1.8, 0.08, materials.tile);
    backsplash.position.set(0, 0.28, -3.38);
    scene.add(backsplash);

    for (let x = -5.5; x <= 5.5; x += 0.7) {
      const grout = box(0.014, 1.8, 0.02, materials.cabinet);
      grout.position.set(x, 0.28, -3.31);
      scene.add(grout);
    }
    for (let y = -0.45; y <= 1; y += 0.48) {
      const grout = box(12, 0.014, 0.02, materials.cabinet);
      grout.position.set(0, y, -3.31);
      scene.add(grout);
    }

    const counter = box(12.4, 0.24, 1.28, materials.wood);
    counter.position.set(0, -0.7, -2.25);
    scene.add(counter);
    [-4.75, -2.4, 2.4, 4.75].forEach((x, index) => {
      scene.add(cabinet(x, -1.77, 2.1, 1.85, index % 2 ? materials.cabinet : materials.teal, materials.brass));
    });

    const oven = box(2.05, 1.85, 0.68, materials.dark);
    oven.position.set(0, -1.77, -2.55);
    scene.add(oven);
    const ovenWindow = box(1.55, 0.82, 0.04, materials.glass);
    ovenWindow.position.set(0, -1.86, -2.2);
    scene.add(ovenWindow);
    [-0.55, 0, 0.55].forEach((x) => {
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.08, 16), materials.brass);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(x, -1.07, -2.15);
      scene.add(knob);
    });

    [-4.65, -2.55, 2.55, 4.65].forEach((x, index) => {
      scene.add(cabinet(x, 2.1, 1.75, 1.5, materials.cabinet, index % 2 ? materials.terracotta : materials.teal));
    });
    [-4.05, 4.05].forEach((x) => {
      const shelf = box(2.9, 0.12, 0.62, materials.wood);
      shelf.position.set(x, 1.1, -2.2);
      scene.add(shelf);
    });
    scene.add(jar(-4.7, 0xd96c3b, materials.darkWood));
    scene.add(jar(-4.2, 0xe5a530, materials.darkWood));
    scene.add(jar(4.15, 0x4c8881, materials.darkWood));
    scene.add(jar(4.65, 0xd96c3b, materials.darkWood));

    [-3.5, 3.5].forEach((x, index) => {
      for (let i = 0; i < 3; i++) {
        const plate = new THREE.Mesh(
          new THREE.TorusGeometry(0.28 - i * 0.045, 0.035, 8, 24),
          index ? materials.terracotta : materials.teal
        );
        plate.rotation.y = Math.PI / 2;
        plate.position.set(x + i * 0.23, 1.37, -1.62);
        scene.add(plate);
      }
    });

    const hood = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.05, 4), materials.teal);
    hood.rotation.y = Math.PI / 4;
    hood.position.set(0, 1.78, -2.45);
    scene.add(hood);
    const hoodPipe = box(0.65, 1.05, 0.55, materials.teal);
    hoodPipe.position.set(0, 2.65, -2.55);
    scene.add(hoodPipe);

    const animated: AnimatedPart[] = [];
    [-3.15, 3.15].forEach((x, index) => {
      const light = pendant(x, materials.dark, index ? materials.terracotta : materials.brass);
      scene.add(light);
      animated.push({ object: light, baseY: light.position.y, phase: index * 2.1, kind: "sway" });
    });
    [-4.95, -4.45, 4.45, 4.95].forEach((x, index) => {
      const utensil = hangingUtensil(x, materials.brass, index % 2 ? "spatula" : "spoon");
      scene.add(utensil);
      animated.push({ object: utensil, baseY: utensil.position.y, phase: index * 0.9, kind: "sway" });
    });

    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.55, 0.55, 28), materials.dark);
    pot.position.set(0, -0.34, -1.56);
    scene.add(pot);
    const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 28), materials.brass);
    potRim.rotation.x = Math.PI / 2;
    potRim.position.set(0, -0.06, -1.56);
    scene.add(potRim);
    [-0.2, 0.08, 0.3].forEach((x, index) => {
      const steamMaterial = materials.steam.clone();
      const steam = new THREE.Mesh(new THREE.SphereGeometry(0.09 + index * 0.025, 12, 10), steamMaterial);
      steam.scale.y = 2.2;
      steam.position.set(x, 0.18 + index * 0.28, -1.5);
      scene.add(steam);
      animated.push({ object: steam, baseY: steam.position.y, phase: index * 1.8, kind: "steam" });
    });

    const fruitBowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      materials.terracotta
    );
    fruitBowl.rotation.x = Math.PI;
    fruitBowl.position.set(-3.15, -0.35, -1.55);
    scene.add(fruitBowl);
    [0xe5a530, 0xd96c3b, 0x7a9b68].forEach((color, index) => {
      const fruit = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 12),
        new THREE.MeshStandardMaterial({ color, roughness: 0.75 })
      );
      fruit.position.set(-3.45 + index * 0.28, -0.03 + (index % 2) * 0.08, -1.48);
      scene.add(fruit);
    });

    const herbPot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.5, 20), materials.terracotta);
    herbPot.position.set(3.45, -0.34, -1.5);
    scene.add(herbPot);
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 8),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0x66865d : 0x87a879, roughness: 0.9 })
      );
      leaf.scale.y = 1.8;
      leaf.position.set(3.2 + (i % 4) * 0.16, 0.04 + Math.floor(i / 4) * 0.2, -1.48);
      scene.add(leaf);
    }

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.position.z = width < 640 ? 14.5 : 10;
      camera.position.y = width < 640 ? 0.35 : 0.6;
      camera.lookAt(0, 0, -2);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = performance.now();
    let frame = 0;
    const render = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      animated.forEach(({ object, baseY, phase, kind }) => {
        if (kind === "sway") {
          object.rotation.z = Math.sin(elapsed * 0.55 + phase) * 0.035;
          return;
        }
        const progress = (elapsed * 0.18 + phase * 0.11) % 1;
        object.position.y = baseY + progress * 1.05;
        object.scale.x = object.scale.z = 0.75 + progress * 0.7;
        if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshBasicMaterial) {
          object.material.opacity = 0.32 * (1 - progress);
        }
      });
      renderer.render(scene, camera);
      if (!reduceMotion) frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      const geometries = new Set<THREE.BufferGeometry>();
      const sceneMaterials = new Set<THREE.Material>();
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          geometries.add(child.geometry);
          const meshMaterials = Array.isArray(child.material) ? child.material : [child.material];
          meshMaterials.forEach((material) => sceneMaterials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      sceneMaterials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className="absolute inset-0" />;
}
