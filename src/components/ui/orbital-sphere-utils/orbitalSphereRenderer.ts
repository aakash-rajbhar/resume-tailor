import * as THREE from "three";

export interface OrbitalSphereOptions {
  hue: number;
  speed: number;
  particleCount?: number;
  particleSize?: number;
  orbitCount?: number;
  sphereRadius?: number;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export const ORBITAL_SPHERE_DEFAULTS: OrbitalSphereOptions = {
  hue: 0,
  speed: 1,
  particleCount: 1800,
  particleSize: 2,
  orbitCount: 4,
  sphereRadius: 160,
  primaryColor: "#c084fc", // violet-400
  secondaryColor: "#818cf8", // indigo-400
  accentColor: "#f472b6", // pink-400
};

export interface OrbitalSphereRenderer {
  resize: (width: number, height: number) => void;
  render: () => void;
  dispose: () => void;
}

export function createOrbitalSphereRenderer(
  canvas: HTMLCanvasElement,
  getOptions: () => OrbitalSphereOptions
): OrbitalSphereRenderer {
  let width = canvas.clientWidth || 300;
  let height = canvas.clientHeight || 300;

  // 1. Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
  camera.position.z = 520;

  // 2. Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
  renderer.setSize(width, height, false);

  const group = new THREE.Group();
  scene.add(group);

  // Initial options
  const initialOpts = { ...ORBITAL_SPHERE_DEFAULTS, ...getOptions() };

  // 3. Central Particle Synthesis Sphere (Fibonacci distribution)
  const sphereGeo = new THREE.BufferGeometry();
  const count = initialOpts.particleCount || 1800;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const c1 = new THREE.Color(initialOpts.primaryColor || "#c084fc");
  const c2 = new THREE.Color(initialOpts.secondaryColor || "#818cf8");
  const cAccent = new THREE.Color(initialOpts.accentColor || "#f472b6");

  const radius = initialOpts.sphereRadius || 160;

  for (let i = 0; i < count; i++) {
    // Fibonacci sphere points
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = radius + (Math.random() - 0.5) * 12;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Gradient vertex colors
    const lerpFactor = Math.random();
    const col = lerpFactor > 0.85 ? cAccent : c1.clone().lerp(c2, lerpFactor);

    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  sphereGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  sphereGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // Glowing particle texture
  const particleCanvas = document.createElement("canvas");
  particleCanvas.width = 32;
  particleCanvas.height = 32;
  const pCtx = particleCanvas.getContext("2d");
  if (pCtx) {
    const gradient = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(230, 210, 255, 0.85)");
    gradient.addColorStop(0.7, "rgba(168, 85, 247, 0.25)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    pCtx.fillStyle = gradient;
    pCtx.fillRect(0, 0, 32, 32);
  }
  const particleTexture = new THREE.CanvasTexture(particleCanvas);

  const sphereMat = new THREE.PointsMaterial({
    size: initialOpts.particleSize || 2.4,
    vertexColors: true,
    map: particleTexture,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const spherePoints = new THREE.Points(sphereGeo, sphereMat);
  group.add(spherePoints);

  // 4. Encrypted Orbital Rings & Luminous Data Nodes
  interface OrbitRing {
    group: THREE.Group;
    speed: number;
    axis: "x" | "y" | "z";
  }

  const orbitRings: OrbitRing[] = [];
  const ringConfigs = [
    { radius: radius * 1.35, tiltX: 0.45, tiltY: 0.25, points: 260, speed: 0.008, color: c1 },
    { radius: radius * 1.6, tiltX: -0.6, tiltY: 0.8, points: 320, speed: -0.006, color: c2 },
    { radius: radius * 1.9, tiltX: 0.85, tiltY: -0.3, points: 380, speed: 0.004, color: cAccent },
  ];

  ringConfigs.forEach((cfg) => {
    const ringGroup = new THREE.Group();
    ringGroup.rotation.x = cfg.tiltX;
    ringGroup.rotation.y = cfg.tiltY;

    // Ring dots
    const ringGeo = new THREE.BufferGeometry();
    const ringPos = new Float32Array(cfg.points * 3);
    const ringCols = new Float32Array(cfg.points * 3);

    for (let i = 0; i < cfg.points; i++) {
      const angle = (i / cfg.points) * Math.PI * 2;
      ringPos[i * 3] = Math.cos(angle) * cfg.radius;
      ringPos[i * 3 + 1] = Math.sin(angle) * cfg.radius;
      ringPos[i * 3 + 2] = (Math.random() - 0.5) * 4;

      // Encrypted dash pattern
      const isBeacon = i % 24 === 0;
      const alpha = isBeacon ? 1.0 : i % 3 === 0 ? 0.7 : 0.25;

      ringCols[i * 3] = cfg.color.r * alpha;
      ringCols[i * 3 + 1] = cfg.color.g * alpha;
      ringCols[i * 3 + 2] = cfg.color.b * alpha;
    }

    ringGeo.setAttribute("position", new THREE.BufferAttribute(ringPos, 3));
    ringGeo.setAttribute("color", new THREE.BufferAttribute(ringCols, 3));

    const ringMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ringPoints = new THREE.Points(ringGeo, ringMat);
    ringGroup.add(ringPoints);

    // Add 2 glowing data nodes on each ring
    const nodeGeo = new THREE.BufferGeometry();
    const nodePos = new Float32Array(2 * 3);
    for (let n = 0; n < 2; n++) {
      const angle = n * Math.PI + Math.PI * 0.25;
      nodePos[n * 3] = Math.cos(angle) * cfg.radius;
      nodePos[n * 3 + 1] = Math.sin(angle) * cfg.radius;
      nodePos[n * 3 + 2] = 0;
    }
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
    const nodeMat = new THREE.PointsMaterial({
      size: 6.5,
      color: 0xffffff,
      map: particleTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    ringGroup.add(nodes);

    group.add(ringGroup);
    orbitRings.push({ group: ringGroup, speed: cfg.speed, axis: "z" });
  });

  let time = 0;

  return {
    resize(w: number, h: number) {
      width = w;
      height = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    },

    render() {
      const currentOpts = getOptions();
      const speed = currentOpts.speed ?? 1;

      time += 0.01 * speed;

      // Rotate central sphere
      spherePoints.rotation.y += 0.002 * speed;
      spherePoints.rotation.x = Math.sin(time * 0.4) * 0.12;

      // Rotate orbital rings
      orbitRings.forEach((ring) => {
        ring.group.rotation.z += ring.speed * speed;
      });

      // Subtle gentle tilt sway of entire group
      group.rotation.y = Math.sin(time * 0.3) * 0.15;
      group.rotation.x = Math.cos(time * 0.2) * 0.1;

      renderer.render(scene, camera);
    },

    dispose() {
      sphereGeo.dispose();
      sphereMat.dispose();
      particleTexture.dispose();
      orbitRings.forEach((r) => {
        r.group.traverse((child) => {
          if (child instanceof THREE.Points) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      });
      renderer.dispose();
    },
  };
}
