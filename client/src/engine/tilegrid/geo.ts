// tilegrid/geo.ts — pure geometry factories + instanced scatter util.
// Mechanically extracted from TileGrid.ts; behavior unchanged.
// grid: TileGrid — shared build state (group, colliders, materials, uniforms).

import * as THREE from 'three';
import type { TileGrid } from '../TileGrid';
import type { ScatterItem } from './shared';

export function makeRockMaterial(grid: TileGrid) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.94,
    metalness: 0.02,
  });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying float vLocalY;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        mat3 normalMatrixInst = mat3(modelMatrix) * mat3(instanceMatrix);
        vWorldNormal = normalize(normalMatrixInst * normal);
      #else
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
      #endif
      vLocalY = position.y;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying float vLocalY;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      // ── 1. World-Space Macro Texturing & Sedimentary Strata ──
      float wsWarp = sin(vWorldPosition.x * 0.16 + vWorldPosition.z * 0.12) * 1.6;
      float strataCoord = (vWorldPosition.y + wsWarp) * 0.72;
      float strata = sin(strataCoord * 3.14159) * 0.5 + 0.5;
      float fineBands = sin(strataCoord * 8.6) * 0.5 + 0.5;

      float n1 = sin(vWorldPosition.x * 0.38 + sin(vWorldPosition.z * 0.32) * 2.2) *
                 cos(vWorldPosition.y * 0.44 + vWorldPosition.z * 0.28);
      float n2 = sin(vWorldPosition.x * 1.15 + vWorldPosition.y * 0.85) *
                 cos(vWorldPosition.z * 1.05 + vWorldPosition.x * 0.65);
      float n3 = sin(vWorldPosition.x * 2.6 + vWorldPosition.z * 2.2) *
                 cos(vWorldPosition.y * 2.8);
      float macroNoise = n1 * 0.54 + n2 * 0.31 + n3 * 0.15;

      vec3 rockBase = diffuseColor.rgb * (0.80 + macroNoise * 0.26 + strata * 0.10 - fineBands * 0.05);

      // ── 2. Top Overburden Blend (Moss / Snow / Lichen / Ash depending on biome) ──
      vec3 wNorm = normalize(vWorldNormal);
      float upSlope = clamp(wNorm.y, 0.0, 1.0);
      float topElev = smoothstep(-0.20, 0.55, vLocalY + macroNoise * 0.25);
      float topWeight = smoothstep(0.42, 0.85, upSlope) * topElev;

      vec3 mossColor   = vec3(0.24, 0.38, 0.17);
      vec3 snowColor   = vec3(0.92, 0.95, 0.99);
      vec3 ashColor    = vec3(0.17, 0.16, 0.15);
      vec3 lichenColor = vec3(0.50, 0.54, 0.44);

      vec3 topColor = mossColor;
      if (diffuseColor.b > 0.80 && diffuseColor.r > 0.70) {
        topColor = snowColor;
      } else if (diffuseColor.r < 0.44 && diffuseColor.g < 0.40) {
        topColor = ashColor;
      } else if (diffuseColor.r > 0.56 && diffuseColor.g > 0.52 && diffuseColor.b > 0.46) {
        topColor = lichenColor;
      }

      vec3 stoneWithTop = mix(rockBase, topColor, topWeight * 0.80);

      // ── 3. Bottom Ground Contact Blend (Loam / Mud / Slush / Ash at rock base) ──
      float groundFactor = 1.0 - smoothstep(-0.55, 0.28, vLocalY + macroNoise * 0.18);
      vec3 groundSoil = vec3(0.18, 0.14, 0.10);
      if (diffuseColor.b > 0.80 && diffuseColor.r > 0.70) {
        groundSoil = vec3(0.72, 0.78, 0.86);
      } else if (diffuseColor.r < 0.44 && diffuseColor.g < 0.40) {
        groundSoil = vec3(0.11, 0.10, 0.09);
      }

      diffuseColor.rgb = mix(stoneWithTop, groundSoil, groundFactor * 0.72);`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      roughnessFactor = mix(0.90, 0.98, topWeight * 0.5);`
    );
  };
  mat.customProgramCacheKey = () => 'ashenreach-rock-ws-height-v2';
  return mat;
}

export function makeRockGeometry(grid: TileGrid, shape: string) {
  // 'round' glacial erratics: smooth icosphere base instead of a faceted
  // dodecahedron — lumpy but circular, unlike the angular forest boulders
  const round = shape === 'round';
  const geometry = round
    ? new THREE.IcosahedronGeometry(1, 2)
    : new THREE.DodecahedronGeometry(1, 0);
  const proportions: Record<string, [number, number, number]> = {
    angular: [1.06, 0.88, 1.02],
    slab:    [1.48, 0.42, 1.15],
    spire:   [0.72, 1.68, 0.78],
    ridge:   [1.65, 0.72, 0.68],
    split:   [0.96, 1.04, 1.34],
    pebble:  [0.85, 0.44, 0.76],
    talus:   [1.14, 0.54, 0.82],
    round:   [1.0, 0.74, 1.0],
  };
  const [sx, sy, sz] = proportions[shape] || proportions.angular;
  geometry.scale(sx, sy, sz);

  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let vx = pos.getX(i);
    let vy = pos.getY(i);
    let vz = pos.getZ(i);

    if (round) {
      // gentle lumpy displacement — smooth boulders, not perfect spheres.
      // Pure position function, so shared vertices stay welded (no cracks).
      const lump = Math.sin(vx * 2.1 + vz * 1.7) * Math.cos(vy * 1.9 + vx * 0.8) * 0.055;
      vx += vx * lump;
      vy += vy * lump;
      vz += vz * lump;
    } else {
      // Chiseled organic faceting displacement
      const facetNoise = Math.sin(vx * 2.8 + vy * 3.4) * Math.cos(vz * 2.6 + vx * 1.5) * 0.12;
      vx += vx * facetNoise;
      vy += vy * facetNoise;
      vz += vz * facetNoise;
    }

    // Base flattening: rocks seat firmly into the earth instead of sharp points underneath
    if (vy < -0.20 * sy) {
      vy = -0.32 * sy + (vy + 0.20 * sy) * 0.22;
    }

    pos.setXYZ(i, vx, vy, vz);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function mergeGeometries(grid: TileGrid, geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = geos.map(g => g.index ? g.toNonIndexed() : g);
  let totalPositions = 0;
  for (const g of nonIndexed) {
    const pos = g.getAttribute('position');
    if (pos) totalPositions += pos.array.length;
  }
  // When every part carries vertex colors, carry them through the merge so
  // multi-part flora (shrub blobs, tinted primitives) keeps its shading.
  const allColored = nonIndexed.length > 0 && nonIndexed.every((g) =>
    !!g.getAttribute('color') && g.getAttribute('color').itemSize === 3);
  const positions = new Float32Array(totalPositions);
  const normals = new Float32Array(totalPositions);
  const colors = allColored ? new Float32Array(totalPositions) : null;
  let posOffset = 0;
  for (const g of nonIndexed) {
    const pos = g.getAttribute('position');
    const norm = g.getAttribute('normal');
    if (pos) {
      positions.set(pos.array, posOffset);
      if (norm) normals.set(norm.array, posOffset);
      if (colors) colors.set(g.getAttribute('color').array as Float32Array, posOffset);
      posOffset += pos.array.length;
    }
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  if (colors) merged.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return merged;
}

export function makeTwigGeometry(grid: TileGrid): THREE.BufferGeometry {
  const mainStem = new THREE.CylinderGeometry(0.045, 0.08, 1.8, 5);
  mainStem.rotateZ(Math.PI / 2);
  mainStem.rotateY(0.25);
  mainStem.translate(0, 0.04, 0);

  const fork1 = new THREE.CylinderGeometry(0.025, 0.045, 0.85, 4);
  fork1.rotateZ(Math.PI / 2 + 0.65);
  fork1.rotateY(-0.4);
  fork1.translate(0.25, 0.03, 0.22);

  const fork2 = new THREE.CylinderGeometry(0.02, 0.035, 0.6, 4);
  fork2.rotateZ(Math.PI / 2 - 0.55);
  fork2.rotateY(0.35);
  fork2.translate(-0.35, 0.03, -0.16);

  const merged = mergeGeometries(grid, [mainStem, fork1, fork2]);
  mainStem.dispose();
  fork1.dispose();
  fork2.dispose();
  return merged;
}

export function makeSnowDriftGeometry(grid: TileGrid): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1.2, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
  geo.scale(1.4, 0.28, 0.95);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    let vy = pos.getY(i);
    const vz = pos.getZ(i);
    vy += Math.sin(vx * 1.5 + vz * 0.8) * 0.06;
    pos.setXYZ(i, vx, Math.max(0.02, vy), vz);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export function scatter(grid: TileGrid, items: ScatterItem[], geo: THREE.BufferGeometry, mat: THREE.Material) {
  if (!items.length) return;
  const mesh = new THREE.InstancedMesh(geo, mat, items.length);
  const d = new THREE.Object3D();
  const col = new THREE.Color();
  items.forEach((it, i) => {
    d.position.set(it.x, it.y, it.z);
    if (it.quat) {
      d.quaternion.copy(it.quat);
    } else {
      d.rotation.set(it.rx, it.ry, it.rz);
    }
    d.scale.setScalar(it.s);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
    col.setRGB(it.r, it.g, it.b);
    mesh.setColorAt(i, col);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = true; mesh.receiveShadow = true;
  grid.group.add(mesh);
}

// Wild-grass tussock: 7 taller straw-green blades rising to pale seed tips.
// Restored from the pre-Wave-1 builder (user ruling: the kit grass models
// didn't match the wind-animated carpet and never swayed — the tussock layer
// rides the carpet's wind shader again, so both grass types sway together).
export function makeTussockGeometry(grid: TileGrid): THREE.BufferGeometry {
  void grid;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const bladeDefs = [
    { angle: 0.30, width: 0.20, height: 1.55, bend: 0.16 },
    { angle: 1.15, width: 0.17, height: 1.15, bend: 0.18 },
    { angle: 2.05, width: 0.16, height: 1.72, bend: 0.20 },
    { angle: 2.95, width: 0.19, height: 1.05, bend: 0.14 },
    { angle: 3.85, width: 0.15, height: 1.62, bend: 0.17 },
    { angle: 4.75, width: 0.18, height: 1.28, bend: 0.19 },
    { angle: 5.65, width: 0.14, height: 1.45, bend: 0.15 },
  ];
  for (const def of bladeDefs) {
    const widthX = Math.cos(def.angle) * def.width;
    const widthZ = Math.sin(def.angle) * def.width;
    const bendX = Math.cos(def.angle) * def.bend;
    const bendZ = Math.sin(def.angle) * def.bend;
    const midH = def.height * 0.45;
    const offset = positions.length / 3;
    positions.push(
      -widthX, 0, -widthZ,
      widthX, 0, widthZ,
      bendX - widthX * 0.6, midH, bendZ - widthZ * 0.6,
      bendX + widthX * 0.6, midH, bendZ + widthZ * 0.6,
      bendX * 2.3 - widthX * 0.1, def.height, bendZ * 2.3 - widthZ * 0.1,
      bendX * 2.3 + widthX * 0.1, def.height, bendZ * 2.3 + widthZ * 0.1,
    );
    // straw-green gradient rising to a pale seed tip
    colors.push(
      0.42, 0.50, 0.28, 0.42, 0.50, 0.28,
      0.60, 0.64, 0.34, 0.60, 0.64, 0.34,
      0.86, 0.80, 0.48, 0.86, 0.80, 0.48,
    );
    indices.push(
      offset, offset + 1, offset + 2, offset + 1, offset + 3, offset + 2,
      offset + 2, offset + 3, offset + 4, offset + 3, offset + 5, offset + 4,
    );
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
