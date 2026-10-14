import * as THREE from "three";

/**
 * Orbital Sphere — vendored from @designcodeio/threeui@1.2.0
 * (MIT, Structure Flow family). Geometry, motion and composition are ported
 * source-exact. Host adaptations: three128 -> the project's installed three,
 * and theme-aware blending/colors so the sphere reads on both the light and
 * dark card surfaces used by this app (the authored AdditiveBlending is
 * invisible over a light surface).
 */
export interface OrbitalSphereOptions {
  speed: number;
  particleSize: number;
  particleOpacity: number;
  orbitOpacity: number;
  scale: number;
  haloOpacity: number;
  hue: number;
}

export const ORBITAL_SPHERE_DEFAULTS: OrbitalSphereOptions = {
  speed: 1,
  particleSize: 0.015,
  particleOpacity: 0.8,
  orbitOpacity: 0.25,
  scale: 1,
  haloOpacity: 0.2,
  hue: 0,
};

export interface OrbitalSphereRenderer {
  resize: (width: number, height: number) => void;
  render: () => void;
  setTheme: (dark: boolean) => void;
  dispose: () => void;
}

// Dark keeps the authored palette + additive glow; light uses a deeper violet
// range with normal blending so the sphere stays vivid on a white card.
const PALETTES = {
  dark: {
    pointA: 0xa78bfa, // #A78BFA
    pointB: 0x701a75, // #701A75
    line: 0x8b5cf6, // #8B5CF6
    node: 0xd946ef, // #D946EF
    halo: 0xc084fc, // #C084FC
  },
  light: {
    pointA: 0x8b5cf6, // #8B5CF6
    pointB: 0x6d28d9, // #6D28D9
    line: 0x7c3aed, // #7C3AED
    node: 0xd946ef, // #D946EF
    halo: 0x8b5cf6, // #8B5CF6
  },
} as const;

export function createOrbitalSphereRenderer(
  canvas: HTMLCanvasElement,
  getOptions: () => OrbitalSphereOptions,
): OrbitalSphereRenderer {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const group = new THREE.Group();
  scene.add(group);

  const RADIUS = 2.2;
  const MAX_PARTICLES = 15000;
  const positions = new Float32Array(MAX_PARTICLES * 3);
  const noises = new Float32Array(MAX_PARTICLES);
  let count = 0;

  for (let i = 0; i < MAX_PARTICLES; i += 1) {
    // Fibonacci sphere + 3D noise displacement, culled below a threshold so the
    // shell reads as a solid, lumpy planet rather than a sparse point shell.
    const phi = Math.acos(-1 + (2 * i) / MAX_PARTICLES);
    const theta = Math.sqrt(MAX_PARTICLES * Math.PI) * phi;
    const x = RADIUS * Math.cos(theta) * Math.sin(phi);
    const y = RADIUS * Math.sin(theta) * Math.sin(phi);
    const z = RADIUS * Math.cos(phi);
    const noise =
      Math.sin(x * 3.5) * Math.cos(y * 3.5) * Math.sin(z * 3.5) +
      Math.cos(x * 6) * 0.4;
    if (noise <= -0.1) continue;
    const bump = 1 + noise * 0.1;
    positions[count * 3] = x * bump;
    positions[count * 3 + 1] = y * bump;
    positions[count * 3 + 2] = z * bump;
    noises[count] = noise;
    count += 1;
  }

  function buildColors(a: number, b: number): Float32Array {
    const colorA = new THREE.Color(a);
    const colorB = new THREE.Color(b);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const col = colorB.clone().lerp(colorA, noises[i] > 0.5 ? 1 : 0.3);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    return colors;
  }

  const colorAttrDark = new THREE.BufferAttribute(
    buildColors(PALETTES.dark.pointA, PALETTES.dark.pointB),
    3,
  );
  const colorAttrLight = new THREE.BufferAttribute(
    buildColors(PALETTES.light.pointA, PALETTES.light.pointB),
    3,
  );

  const sphereGeometry = new THREE.BufferGeometry();
  sphereGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions.slice(0, count * 3), 3),
  );
  sphereGeometry.setAttribute("color", colorAttrDark);

  const pointsMaterial = new THREE.PointsMaterial({
    size: 0.015,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  group.add(new THREE.Points(sphereGeometry, pointsMaterial));

  // 6 orbital rings, each a Line with alternating direction, plus glowing nodes
  // and halos on every other ring.
  const lineMaterial = new THREE.LineBasicMaterial({
    color: PALETTES.dark.line,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
  });
  const lineGeometries: THREE.BufferGeometry[] = [];
  const sphereGeometries: THREE.BufferGeometry[] = [];
  const nodeMaterials: THREE.MeshBasicMaterial[] = [];
  const haloMaterials: THREE.MeshBasicMaterial[] = [];

  let scaleFactor = 1;
  for (let i = 0; i < 6; i += 1) {
    const geometry = new THREE.BufferGeometry();
    const pts: number[] = [];
    const ringRadius = RADIUS * (1.08 + Math.random() * 0.2);
    for (let s = 0; s <= 90; s += 1) {
      const angle = (s / 90) * Math.PI * 2;
      pts.push(
        Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringRadius,
        Math.sin(angle * 4) * 0.1,
      );
    }
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(pts, 3),
    );
    lineGeometries.push(geometry);
    const line = new THREE.Line(geometry, lineMaterial);
    line.rotation.x = Math.random() * Math.PI * 2;
    line.rotation.y = Math.random() * Math.PI * 2;
    group.add(line);

    if (i % 2 !== 0) {
      const nodeGeometry = new THREE.SphereGeometry(0.025, 16, 16);
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: PALETTES.dark.node,
      });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      const angle = Math.random() * Math.PI * 2;
      node.position.set(
        Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringRadius,
        0,
      );
      line.add(node);

      const haloGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: PALETTES.dark.halo,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Mesh(haloGeometry, haloMaterial);
      node.add(halo);

      sphereGeometries.push(nodeGeometry, haloGeometry);
      nodeMaterials.push(nodeMaterial);
      haloMaterials.push(haloMaterial);
    }
  }

  function setTheme(isDark: boolean) {
    const palette = isDark ? PALETTES.dark : PALETTES.light;
    const blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;

    pointsMaterial.blending = blending;
    pointsMaterial.needsUpdate = true;
    sphereGeometry.setAttribute(
      "color",
      isDark ? colorAttrDark : colorAttrLight,
    );

    lineMaterial.color.setHex(palette.line);
    lineMaterial.blending = blending;
    lineMaterial.needsUpdate = true;

    nodeMaterials.forEach((material) => material.color.setHex(palette.node));
    haloMaterials.forEach((material) => {
      material.color.setHex(palette.halo);
      material.blending = blending;
      material.needsUpdate = true;
    });
  }

  setTheme(true);

  return {
    resize(width: number, height: number) {
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      const opts = getOptions();
      if (width >= 1024) {
        group.position.set(2.5, 0, -2);
        scaleFactor = 1.15;
        camera.position.z = 5.5;
      } else {
        // Host adaptation: source offsets the group downward (y = -1) for mobile
        // composition; here it is centered vertically within the hero card.
        group.position.set(0, 0, -3);
        scaleFactor = 1;
        camera.position.z = 6.5;
      }
      group.scale.setScalar(scaleFactor * opts.scale);
    },

    render() {
      const opts = getOptions();
      pointsMaterial.size = opts.particleSize;
      pointsMaterial.opacity = opts.particleOpacity;
      lineMaterial.opacity = opts.orbitOpacity;
      haloMaterials.forEach((material) => {
        material.opacity = opts.haloOpacity;
      });
      group.scale.setScalar(scaleFactor * opts.scale);

      group.rotation.y += 0.0008 * opts.speed;
      group.rotation.x += 0.0003 * opts.speed;
      group.children.forEach((child, index) => {
        if (child.type === "Line") {
          child.rotation.z +=
            0.0004 * opts.speed * (index % 2 === 0 ? 1 : -1);
        }
      });

      renderer.render(scene, camera);
    },

    setTheme,

    dispose() {
      sphereGeometry.dispose();
      pointsMaterial.dispose();
      lineMaterial.dispose();
      lineGeometries.forEach((geometry) => geometry.dispose());
      sphereGeometries.forEach((geometry) => geometry.dispose());
      nodeMaterials.forEach((material) => material.dispose());
      haloMaterials.forEach((material) => material.dispose());
      renderer.dispose();
    },
  };
}
