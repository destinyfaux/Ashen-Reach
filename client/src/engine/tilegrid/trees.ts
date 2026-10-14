// tilegrid/trees.ts — tree builders (per-species procedural meshes).
// Mechanically extracted from TileGrid.ts; behavior unchanged.
// grid: TileGrid — shared build state (group, colliders, materials, uniforms).

import * as THREE from 'three';
import type { TileGrid } from '../TileGrid';
import type { PropDef } from '../types';
import { getMaterial, hash2, rngFrom } from '../materials';
import { CELL } from './shared';

export function buildTrees(grid: TileGrid, trees: PropDef[]) {
  if (!trees.length) return;

  // ── Bark Materials with PBR procedural texture + bump ─────────────
  const barkOak = getMaterial('bark', 0) as THREE.MeshStandardMaterial;
  const barkPine = getMaterial('bark', 1) as THREE.MeshStandardMaterial;
  const barkDead = getMaterial('bark', 2) as THREE.MeshStandardMaterial;
  const barkBirch = getMaterial('bark', 3) as THREE.MeshStandardMaterial;
  const barkWillow = getMaterial('bark', 4) as THREE.MeshStandardMaterial;

  // Foliage Material with flat shading for painterly dappled canopy volume
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.02,
    flatShading: true,
  });

  const palettes: Record<string, number[]> = {
    oak: [0x3c5427, 0x4d6832, 0x5b753c, 0x364823, 0x435c2d],
    ash: [0x54633b, 0x627343, 0x485832, 0x6e7e4d, 0x3d4d29],
    pine: [0x223b2c, 0x2b4635, 0x1d3326, 0x33513d, 0x182a1f],
    snowpine: [0x4d635a, 0x5e796e, 0x3c5249, 0x6f8b7f, 0x8aa499],
    willow: [0x4d6335, 0x5a743e, 0x688547, 0x41542d, 0x73944f, 0x556e3b],
    birch: [0x82a033, 0x94b03d, 0xa8c049, 0x6d8b26, 0xb2c852],
    dead: [0x423832, 0x342c27, 0x52443c],
  };

  const height = (tree: PropDef) => (tree.scale || 1) * (tree.variant === 'dead' ? 1.15 : 1);

  type TreeData = { tree: PropDef; scale: number; x: number; z: number; ground: number; index: number };
  const hardwoodTrees: TreeData[] = [];
  const coniferTrees: TreeData[] = [];
  const willowTrees: TreeData[] = [];
  const birchTrees: TreeData[] = [];
  const deadTrees: TreeData[] = [];

  trees.forEach((tree, index) => {
    const scale = height(tree);
    const x = tree.x * CELL, z = tree.z * CELL;
    const ground = grid.terrainHeightAt(x, z);
    const data = { tree, scale, x, z, ground, index };

    if (tree.variant === 'dead') {
      deadTrees.push(data);
    } else if (tree.variant === 'pine' || tree.variant === 'snowpine') {
      coniferTrees.push(data);
    } else if (tree.variant === 'willow') {
      willowTrees.push(data);
    } else if (tree.variant === 'birch') {
      birchTrees.push(data);
    } else {
      hardwoodTrees.push(data);
    }

    // Authoritative physical trunk collider footprint matching large towering trees
    const colliderRadius = Math.max(0.7, scale * 0.4);
    grid.colliders.push({
      x1: x - colliderRadius,
      z1: z - colliderRadius,
      x2: x + colliderRadius,
      z2: z + colliderRadius,
      yMin: 0,
      yMax: 32 * scale,
    });
  });

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const upVector = new THREE.Vector3(0, 1, 0);

  // ──────────────────────────────────────────────────────────────────
  // 1. Hardwood Trees (Grand Ancient Oak & Noble Ash)
  // - Massive flared trunk (height 16)
  // - 4 heavy boughs (length 7.5) rooted inside the trunk surface
  // - 8 voluminous organic canopy clouds reaching 25+ height
  // ──────────────────────────────────────────────────────────────────
  if (hardwoodTrees.length > 0) {
    const trunkHeight = 16.0, baseR = 1.35, topR = 0.72;
    const trunkGeom = new THREE.CylinderGeometry(topR, baseR, trunkHeight, 9);
    // Extra bottom margin (-1.2) ensures trunk extends deep underground on slopes
    trunkGeom.translate(0, trunkHeight / 2 - 1.2, 0);
    const trunkMesh = new THREE.InstancedMesh(trunkGeom, barkOak, hardwoodTrees.length);

    const boughsPerTree = 4;
    const boughLength = 7.5, boughBaseR = 0.44, boughTipR = 0.22;
    const boughGeom = new THREE.CylinderGeometry(boughTipR, boughBaseR, boughLength, 6);
    boughGeom.translate(0, boughLength / 2, 0); // Base at (0, 0, 0) for locked attachment
    const boughMesh = new THREE.InstancedMesh(boughGeom, barkOak, hardwoodTrees.length * boughsPerTree);

    const foliagePerTree = 8;
    const foliageGeom = new THREE.DodecahedronGeometry(3.6, 1);
    const foliageMesh = new THREE.InstancedMesh(foliageGeom, leafMat, hardwoodTrees.length * foliagePerTree);

    hardwoodTrees.forEach((item, tIdx) => {
      const { tree, scale, x, z, ground } = item;
      const seed = hash2(Math.round(x), Math.round(z), 0x73ee);
      const r = rngFrom(seed);
      const baseRotY = tree.rotY || (r() * Math.PI * 2);
      // Sunk firmly into the ground to ensure no base ever floats on slopes
      const sinkDepth = 0.85 * scale;
      const trunkBasePos = new THREE.Vector3(x, ground - sinkDepth, z);

      // Trunk instance: strictly upright
      dummy.position.copy(trunkBasePos);
      dummy.quaternion.set(0, 0, 0, 1);
      dummy.rotation.set((r() - 0.5) * 0.02, baseRotY, (r() - 0.5) * 0.02);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(tIdx, dummy.matrix);

      const trunkQuat = dummy.quaternion.clone();

      // 4 Rooted Main Boughs
      const attachHeights = [9.5, 11.2, 12.8, 14.2];
      const boughAngles = [0.2, 1.8, 3.4, 4.9];
      const boughTips: { x: number; y: number; z: number }[] = [];

      for (let b = 0; b < boughsPerTree; b++) {
        const bAngle = boughAngles[b] + (r() - 0.5) * 0.15;
        const hAttach = attachHeights[b];
        const t = hAttach / trunkHeight;
        const rTrunk = baseR + (topR - baseR) * t;

        // Local anchor inside trunk wooden core
        const localRoot = new THREE.Vector3(
          Math.sin(bAngle) * (rTrunk * 0.45),
          hAttach,
          Math.cos(bAngle) * (rTrunk * 0.45)
        );
        const worldRoot = localRoot.clone().multiplyScalar(scale).applyQuaternion(trunkQuat).add(trunkBasePos);

        const pitch = 0.82 + (r() - 0.5) * 0.16; // outward-upward angle (~47 deg)
        const localDir = new THREE.Vector3(
          Math.sin(bAngle) * Math.sin(pitch),
          Math.cos(pitch),
          Math.cos(bAngle) * Math.sin(pitch)
        ).normalize();
        const worldDir = localDir.clone().applyQuaternion(trunkQuat).normalize();

        dummy.position.copy(worldRoot);
        dummy.quaternion.setFromUnitVectors(upVector, worldDir);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        boughMesh.setMatrixAt(tIdx * boughsPerTree + b, dummy.matrix);

        // Save tip position for canopy placement
        boughTips.push({
          x: worldRoot.x + worldDir.x * (boughLength * scale),
          y: worldRoot.y + worldDir.y * (boughLength * scale),
          z: worldRoot.z + worldDir.z * (boughLength * scale),
        });
      }

      // Full dappled hardwood canopy (4 bough tip clusters + 1 central summit + 3 mid fills)
      const leafPalette = palettes[tree.variant || 'oak'] || palettes.oak;
      for (let c = 0; c < foliagePerTree; c++) {
        let cx = x, cy = ground - sinkDepth + 20.5 * scale, cz = z, cScale = 1.0;
        if (c < 4) {
          // Clustered right at the tips of the 4 main boughs
          cx = boughTips[c].x;
          cy = boughTips[c].y + 0.8 * scale;
          cz = boughTips[c].z;
          cScale = 1.05;
        } else if (c === 4) {
          // Summit dome
          cx = x;
          cy = ground - sinkDepth + 21.0 * scale;
          cz = z;
          cScale = 1.35;
        } else {
          // Mid-canopy fills
          const fillAngle = baseRotY + (c * 2.0);
          cx = x + Math.sin(fillAngle) * 4.2 * scale;
          cy = ground - sinkDepth + (16.5 + (c - 5) * 1.8) * scale;
          cz = z + Math.cos(fillAngle) * 4.2 * scale;
          cScale = 1.1;
        }

        dummy.position.set(cx, cy, cz);
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.rotation.set(r() * 0.5, baseRotY + c * 0.9, r() * 0.5);
        dummy.scale.set(
          cScale * scale * (0.95 + r() * 0.2),
          cScale * scale * 0.82,
          cScale * scale * (0.95 + r() * 0.2)
        );
        dummy.updateMatrix();

        const fIdx = tIdx * foliagePerTree + c;
        foliageMesh.setMatrixAt(fIdx, dummy.matrix);
        color.setHex(leafPalette[(tIdx + c) % leafPalette.length]);
        foliageMesh.setColorAt(fIdx, color);
      }
    });

    trunkMesh.instanceMatrix.needsUpdate = true;
    trunkMesh.castShadow = true; trunkMesh.receiveShadow = true;
    grid.group.add(trunkMesh);

    boughMesh.instanceMatrix.needsUpdate = true;
    boughMesh.castShadow = true; boughMesh.receiveShadow = true;
    grid.group.add(boughMesh);

    foliageMesh.instanceMatrix.needsUpdate = true;
    if (foliageMesh.instanceColor) foliageMesh.instanceColor.needsUpdate = true;
    foliageMesh.castShadow = true; foliageMesh.receiveShadow = true;
    grid.group.add(foliageMesh);
  }

  // ──────────────────────────────────────────────────────────────────
  // 2. Conifer Trees (Towering Pines & Snowpines)
  // - Towering mast trunk (height 24)
  // - 4 exposed lower radial whorl branches rooted to trunk
  // - 5 cascading tiered cone skirts reaching 28+ height
  // ──────────────────────────────────────────────────────────────────
  if (coniferTrees.length > 0) {
    const trunkHeight = 24.0, baseR = 1.15, topR = 0.22;
    const trunkGeom = new THREE.CylinderGeometry(topR, baseR, trunkHeight, 8);
    trunkGeom.translate(0, trunkHeight / 2 - 1.2, 0);
    const trunkMesh = new THREE.InstancedMesh(trunkGeom, barkPine, coniferTrees.length);

    const branchesPerTree = 4;
    const branchLength = 4.5, branchBaseR = 0.22, branchTipR = 0.08;
    const branchGeom = new THREE.CylinderGeometry(branchTipR, branchBaseR, branchLength, 5);
    branchGeom.translate(0, branchLength / 2, 0);
    const branchMesh = new THREE.InstancedMesh(branchGeom, barkPine, coniferTrees.length * branchesPerTree);

    const tiersPerTree = 5;
    const tierGeom = new THREE.ConeGeometry(1.0, 1.0, 8);
    tierGeom.translate(0, 0.5, 0); // Base of cone at 0
    const foliageMesh = new THREE.InstancedMesh(tierGeom, leafMat, coniferTrees.length * tiersPerTree);

    coniferTrees.forEach((item, tIdx) => {
      const { tree, scale, x, z, ground } = item;
      const seed = hash2(Math.round(x), Math.round(z), 0x91bb);
      const r = rngFrom(seed);
      const baseRotY = tree.rotY || (r() * Math.PI * 2);
      const sinkDepth = 0.85 * scale;
      const trunkBasePos = new THREE.Vector3(x, ground - sinkDepth, z);

      // Mast Trunk: strictly upright, firmly sunk into slopes
      dummy.position.copy(trunkBasePos);
      dummy.quaternion.set(0, 0, 0, 1);
      dummy.rotation.set((r() - 0.5) * 0.02, baseRotY, (r() - 0.5) * 0.02);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(tIdx, dummy.matrix);

      const trunkQuat = dummy.quaternion.clone();

      // Lower Radial Whorl Branches
      const branchHeights = [5.5, 7.2, 8.8, 10.4];
      for (let b = 0; b < branchesPerTree; b++) {
        const bAngle = (b * Math.PI * 0.5) + (r() - 0.5) * 0.2;
        const hAttach = branchHeights[b];
        const localRoot = new THREE.Vector3(
          Math.sin(bAngle) * 0.45,
          hAttach,
          Math.cos(bAngle) * 0.45
        );
        const worldRoot = localRoot.clone().multiplyScalar(scale).applyQuaternion(trunkQuat).add(trunkBasePos);

        const pitch = 1.82 + (r() - 0.5) * 0.15; // droop slightly below horizontal
        const localDir = new THREE.Vector3(
          Math.sin(bAngle) * Math.sin(pitch),
          Math.cos(pitch),
          Math.cos(bAngle) * Math.sin(pitch)
        ).normalize();
        const worldDir = localDir.clone().applyQuaternion(trunkQuat).normalize();

        dummy.position.copy(worldRoot);
        dummy.quaternion.setFromUnitVectors(upVector, worldDir);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        branchMesh.setMatrixAt(tIdx * branchesPerTree + b, dummy.matrix);
      }

      // 5 Cascading Needle Skirts (bottom to spire)
      const leafPalette = palettes[tree.variant || 'pine'] || palettes.pine;
      const tierSpecs = [
        { yOffset: 9.5, radius: 5.6, height: 6.2 }, // lowest skirt
        { yOffset: 13.8, radius: 4.5, height: 5.8 },
        { yOffset: 17.8, radius: 3.5, height: 5.2 },
        { yOffset: 21.8, radius: 2.4, height: 4.6 },
        { yOffset: 25.5, radius: 1.3, height: 4.2 }, // top spire
      ];

      for (let tier = 0; tier < tiersPerTree; tier++) {
        const spec = tierSpecs[tier];
        dummy.position.set(x, ground - sinkDepth + spec.yOffset * scale, z);
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.rotation.set(0, baseRotY + tier * 0.73, 0);
        dummy.scale.set(spec.radius * scale, spec.height * scale, spec.radius * scale);
        dummy.updateMatrix();

        const fIdx = tIdx * tiersPerTree + tier;
        foliageMesh.setMatrixAt(fIdx, dummy.matrix);
        color.setHex(leafPalette[(tIdx + tier) % leafPalette.length]);
        foliageMesh.setColorAt(fIdx, color);
      }
    });

    trunkMesh.instanceMatrix.needsUpdate = true;
    trunkMesh.castShadow = true; trunkMesh.receiveShadow = true;
    grid.group.add(trunkMesh);

    branchMesh.instanceMatrix.needsUpdate = true;
    branchMesh.castShadow = true; branchMesh.receiveShadow = true;
    grid.group.add(branchMesh);

    foliageMesh.instanceMatrix.needsUpdate = true;
    if (foliageMesh.instanceColor) foliageMesh.instanceColor.needsUpdate = true;
    foliageMesh.castShadow = true; foliageMesh.receiveShadow = true;
    grid.group.add(foliageMesh);
  }

  // ──────────────────────────────────────────────────────────────────
  // 3. Weeping Willow Trees (Riparian / Riverbank Giants)
  // - Muscular flared gnarled trunk (height 13.5) with olive bark
  // - 4 heavy spreading arching limbs
  // - 8 trailing vertical weeping frond drapes cascading downward
  // - 2 full crown dome clusters giving romantic silhouette
  // ──────────────────────────────────────────────────────────────────
  if (willowTrees.length > 0) {
    const trunkHeight = 14.5, baseR = 1.75, topR = 1.05;
    const trunkGeom = new THREE.CylinderGeometry(topR, baseR, trunkHeight, 9);
    trunkGeom.translate(0, trunkHeight / 2 - 1.2, 0);
    const trunkMesh = new THREE.InstancedMesh(trunkGeom, barkWillow, willowTrees.length);

    const limbsPerTree = 5;
    const limbLength = 8.8, limbBaseR = 0.52, limbTipR = 0.26;
    const limbGeom = new THREE.CylinderGeometry(limbTipR, limbBaseR, limbLength, 6);
    limbGeom.translate(0, limbLength / 2, 0);
    const limbMesh = new THREE.InstancedMesh(limbGeom, barkWillow, willowTrees.length * limbsPerTree);

    // Drooping switch branches extending from limbs
    const switchesPerTree = 5;
    const switchLength = 5.2, switchBaseR = 0.26, switchTipR = 0.12;
    const switchGeom = new THREE.CylinderGeometry(switchTipR, switchBaseR, switchLength, 5);
    switchGeom.translate(0, switchLength / 2, 0);
    const switchMesh = new THREE.InstancedMesh(switchGeom, barkWillow, willowTrees.length * switchesPerTree);

    // Weeping willow canopy: 3 crown umbrella domes + 15 cascading drooping foliage masses (NO cylinders)
    const crownsPerTree = 3;
    const crownGeom = new THREE.DodecahedronGeometry(4.4, 1);
    const crownMesh = new THREE.InstancedMesh(crownGeom, leafMat, willowTrees.length * crownsPerTree);

    const drapesPerTree = 15;
    const drapeGeom = new THREE.DodecahedronGeometry(3.2, 1);
    const drapeMesh = new THREE.InstancedMesh(drapeGeom, leafMat, willowTrees.length * drapesPerTree);

    willowTrees.forEach((item, tIdx) => {
      const { scale, x, z, ground } = item;
      const seed = hash2(Math.round(x), Math.round(z), 0x7177);
      const r = rngFrom(seed);
      const baseRotY = (item.tree.rotY || (r() * Math.PI * 2));
      const sinkDepth = 0.85 * scale;
      const trunkBasePos = new THREE.Vector3(x, ground - sinkDepth, z);

      // Gnarled Trunk: strictly upright, firmly sunk into slopes
      dummy.position.copy(trunkBasePos);
      dummy.quaternion.set(0, 0, 0, 1);
      dummy.rotation.set((r() - 0.5) * 0.02, baseRotY, (r() - 0.5) * 0.02);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(tIdx, dummy.matrix);

      const trunkQuat = dummy.quaternion.clone();

      // 5 Arching Umbrella Limbs
      const limbHeights = [8.2, 9.4, 10.6, 11.8, 12.8];
      const limbAngles = [0.2, 1.45, 2.7, 3.95, 5.2];
      const limbTips: { x: number; y: number; z: number }[] = [];
      const limbMids: { x: number; y: number; z: number }[] = [];

      for (let l = 0; l < limbsPerTree; l++) {
        const lAngle = limbAngles[l] + (r() - 0.5) * 0.12;
        const hAttach = limbHeights[l];
        const t = hAttach / trunkHeight;
        const rTrunk = baseR + (topR - baseR) * t;

        const localRoot = new THREE.Vector3(
          Math.sin(lAngle) * (rTrunk * 0.45),
          hAttach,
          Math.cos(lAngle) * (rTrunk * 0.45)
        );
        const worldRoot = localRoot.clone().multiplyScalar(scale).applyQuaternion(trunkQuat).add(trunkBasePos);

        // Sweeping outward-arching pitch (~60 deg)
        const pitch = 1.05 + (r() - 0.5) * 0.12;
        const localDir = new THREE.Vector3(
          Math.sin(lAngle) * Math.sin(pitch),
          Math.cos(pitch),
          Math.cos(lAngle) * Math.sin(pitch)
        ).normalize();
        const worldDir = localDir.clone().applyQuaternion(trunkQuat).normalize();

        dummy.position.copy(worldRoot);
        dummy.quaternion.setFromUnitVectors(upVector, worldDir);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        limbMesh.setMatrixAt(tIdx * limbsPerTree + l, dummy.matrix);

        const midPt = {
          x: worldRoot.x + worldDir.x * (limbLength * 0.55 * scale),
          y: worldRoot.y + worldDir.y * (limbLength * 0.55 * scale),
          z: worldRoot.z + worldDir.z * (limbLength * 0.55 * scale),
        };
        const tipPt = {
          x: worldRoot.x + worldDir.x * (limbLength * scale),
          y: worldRoot.y + worldDir.y * (limbLength * scale),
          z: worldRoot.z + worldDir.z * (limbLength * scale),
        };
        limbMids.push(midPt);
        limbTips.push(tipPt);

        // Drooping switch branch angling downward from mid-limb
        const switchPitch = 1.82 + (r() - 0.5) * 0.14; // curving downward below horizontal
        const localSwitchDir = new THREE.Vector3(
          Math.sin(lAngle + 0.15) * Math.sin(switchPitch),
          Math.cos(switchPitch),
          Math.cos(lAngle + 0.15) * Math.sin(switchPitch)
        ).normalize();
        const worldSwitchDir = localSwitchDir.clone().applyQuaternion(trunkQuat).normalize();

        dummy.position.set(midPt.x, midPt.y, midPt.z);
        dummy.quaternion.setFromUnitVectors(upVector, worldSwitchDir);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        switchMesh.setMatrixAt(tIdx * switchesPerTree + l, dummy.matrix);
      }

      const willowPalette = palettes.willow;

      // 3 Overarching Crown Umbrella Domes
      for (let c = 0; c < crownsPerTree; c++) {
        const cAngle = baseRotY + c * 2.1;
        const cx = x + Math.sin(cAngle) * 1.8 * scale;
        const cy = ground - sinkDepth + (16.2 + c * 1.2) * scale;
        const cz = z + Math.cos(cAngle) * 1.8 * scale;

        dummy.position.set(cx, cy, cz);
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.rotation.set((r() - 0.5) * 0.15, cAngle, (r() - 0.5) * 0.15);
        dummy.scale.set(scale * 1.25, scale * 0.92, scale * 1.25);
        dummy.updateMatrix();

        const cIdx = tIdx * crownsPerTree + c;
        crownMesh.setMatrixAt(cIdx, dummy.matrix);
        color.setHex(willowPalette[(tIdx + c) % willowPalette.length]);
        crownMesh.setColorAt(cIdx, color);
      }

      // 15 Cascading Weeping Foliage Masses (3 cascading draped clusters per limb)
      for (let l = 0; l < limbsPerTree; l++) {
        const mid = limbMids[l];
        const tip = limbTips[l];

        // 1. Upper limb cluster (broad soft rounded canopy mass)
        const idx1 = tIdx * drapesPerTree + (l * 3 + 0);
        dummy.position.set(mid.x, mid.y + 0.6 * scale, mid.z);
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.rotation.set(r() * 0.4, baseRotY + l * 1.2, r() * 0.4);
        dummy.scale.set(scale * 1.15, scale * 1.2, scale * 1.15);
        dummy.updateMatrix();
        drapeMesh.setMatrixAt(idx1, dummy.matrix);
        color.setHex(willowPalette[(tIdx + l) % willowPalette.length]);
        drapeMesh.setColorAt(idx1, color);

        // 2. Outer bough drooping drape mass (vertically stretched weeping cluster)
        const idx2 = tIdx * drapesPerTree + (l * 3 + 1);
        dummy.position.set(tip.x, tip.y - 0.4 * scale, tip.z);
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.rotation.set(r() * 0.3, baseRotY + l * 1.2 + 0.5, r() * 0.3);
        dummy.scale.set(scale * 1.1, scale * 1.45, scale * 1.1);
        dummy.updateMatrix();
        drapeMesh.setMatrixAt(idx2, dummy.matrix);
        color.setHex(willowPalette[(tIdx + l + 1) % willowPalette.length]);
        drapeMesh.setColorAt(idx2, color);

        // 3. Lower hanging weeping drape (cascades downward towards the ground)
        const idx3 = tIdx * drapesPerTree + (l * 3 + 2);
        dummy.position.set(
          tip.x + (mid.x - tip.x) * 0.25,
          tip.y - 3.2 * scale,
          tip.z + (mid.z - tip.z) * 0.25
        );
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.rotation.set(r() * 0.25, baseRotY + l * 1.2 + 1.1, r() * 0.25);
        dummy.scale.set(scale * 0.95, scale * 1.6, scale * 0.95);
        dummy.updateMatrix();
        drapeMesh.setMatrixAt(idx3, dummy.matrix);
        color.setHex(willowPalette[(tIdx + l + 2) % willowPalette.length]);
        drapeMesh.setColorAt(idx3, color);
      }
    });

    trunkMesh.instanceMatrix.needsUpdate = true;
    trunkMesh.castShadow = true; trunkMesh.receiveShadow = true;
    grid.group.add(trunkMesh);

    limbMesh.instanceMatrix.needsUpdate = true;
    limbMesh.castShadow = true; limbMesh.receiveShadow = true;
    grid.group.add(limbMesh);

    switchMesh.instanceMatrix.needsUpdate = true;
    switchMesh.castShadow = true; switchMesh.receiveShadow = true;
    grid.group.add(switchMesh);

    crownMesh.instanceMatrix.needsUpdate = true;
    if (crownMesh.instanceColor) crownMesh.instanceColor.needsUpdate = true;
    crownMesh.castShadow = true; crownMesh.receiveShadow = true;
    grid.group.add(crownMesh);

    drapeMesh.instanceMatrix.needsUpdate = true;
    if (drapeMesh.instanceColor) drapeMesh.instanceColor.needsUpdate = true;
    drapeMesh.castShadow = true; drapeMesh.receiveShadow = true;
    grid.group.add(drapeMesh);
  }

  // ──────────────────────────────────────────────────────────────────
  // 4. Silver Paper Birch Trees (Slender Light-Dappled Canopy)
  // - Slender tall chalk-white trunk (height 20) with dark lenticels
  // - 4 high steep ascending boughs
  // - 6 airy fluttering golden-lime canopy clouds
  // ──────────────────────────────────────────────────────────────────
  if (birchTrees.length > 0) {
    const trunkHeight = 20.0, baseR = 0.65, topR = 0.22;
    const trunkGeom = new THREE.CylinderGeometry(topR, baseR, trunkHeight, 8);
    trunkGeom.translate(0, trunkHeight / 2 - 1.2, 0);
    const trunkMesh = new THREE.InstancedMesh(trunkGeom, barkBirch, birchTrees.length);

    const boughsPerTree = 4;
    const boughLength = 6.8, boughBaseR = 0.24, boughTipR = 0.1;
    const boughGeom = new THREE.CylinderGeometry(boughTipR, boughBaseR, boughLength, 5);
    boughGeom.translate(0, boughLength / 2, 0);
    const boughMesh = new THREE.InstancedMesh(boughGeom, barkBirch, birchTrees.length * boughsPerTree);

    const foliagePerTree = 6;
    const foliageGeom = new THREE.DodecahedronGeometry(2.8, 1);
    const foliageMesh = new THREE.InstancedMesh(foliageGeom, leafMat, birchTrees.length * foliagePerTree);

    birchTrees.forEach((item, tIdx) => {
      const { scale, x, z, ground } = item;
      const seed = hash2(Math.round(x), Math.round(z), 0xb12c);
      const r = rngFrom(seed);
      const baseRotY = (item.tree.rotY || (r() * Math.PI * 2));
      const sinkDepth = 0.85 * scale;
      const trunkBasePos = new THREE.Vector3(x, ground - sinkDepth, z);

      // Slender White Trunk: strictly upright, sunk into ground
      dummy.position.copy(trunkBasePos);
      dummy.quaternion.set(0, 0, 0, 1);
      dummy.rotation.set((r() - 0.5) * 0.02, baseRotY, (r() - 0.5) * 0.02);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(tIdx, dummy.matrix);

      const trunkQuat = dummy.quaternion.clone();

      // 4 Ascending Boughs
      const attachHeights = [12.5, 14.2, 15.8, 17.2];
      const boughAngles = [0.5, 2.0, 3.6, 5.2];
      const boughTips: { x: number; y: number; z: number }[] = [];

      for (let b = 0; b < boughsPerTree; b++) {
        const bAngle = boughAngles[b] + (r() - 0.5) * 0.15;
        const hAttach = attachHeights[b];
        const t = hAttach / trunkHeight;
        const rTrunk = baseR + (topR - baseR) * t;

        const localRoot = new THREE.Vector3(
          Math.sin(bAngle) * (rTrunk * 0.45),
          hAttach,
          Math.cos(bAngle) * (rTrunk * 0.45)
        );
        const worldRoot = localRoot.clone().multiplyScalar(scale).applyQuaternion(trunkQuat).add(trunkBasePos);

        const pitch = 0.55 + (r() - 0.5) * 0.12; // steep upward angle (~32 deg)
        const localDir = new THREE.Vector3(
          Math.sin(bAngle) * Math.sin(pitch),
          Math.cos(pitch),
          Math.cos(bAngle) * Math.sin(pitch)
        ).normalize();
        const worldDir = localDir.clone().applyQuaternion(trunkQuat).normalize();

        dummy.position.copy(worldRoot);
        dummy.quaternion.setFromUnitVectors(upVector, worldDir);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        boughMesh.setMatrixAt(tIdx * boughsPerTree + b, dummy.matrix);

        boughTips.push({
          x: worldRoot.x + worldDir.x * (boughLength * scale),
          y: worldRoot.y + worldDir.y * (boughLength * scale),
          z: worldRoot.z + worldDir.z * (boughLength * scale),
        });
      }

      // Fluttering Birch Foliage
      const birchPalette = palettes.birch;
      for (let c = 0; c < foliagePerTree; c++) {
        let cx = x, cy = ground - sinkDepth + 23.5 * scale, cz = z, cSize = 1.0;
        if (c < 4) {
          cx = boughTips[c].x;
          cy = boughTips[c].y + 0.6 * scale;
          cz = boughTips[c].z;
          cSize = 1.05;
        } else if (c === 4) {
          cx = x;
          cy = ground - sinkDepth + 24.2 * scale;
          cz = z;
          cSize = 1.2;
        } else {
          cx = x + Math.sin(baseRotY + 1.2) * 2.2 * scale;
          cy = ground - sinkDepth + 19.5 * scale;
          cz = z + Math.cos(baseRotY + 1.2) * 2.2 * scale;
          cSize = 1.0;
        }

        dummy.position.set(cx, cy, cz);
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.rotation.set(r() * 0.5, baseRotY + c * 0.9, r() * 0.5);
        dummy.scale.set(cSize * scale * (0.95 + r() * 0.2), cSize * scale * 0.85, cSize * scale * (0.95 + r() * 0.2));
        dummy.updateMatrix();

        const fIdx = tIdx * foliagePerTree + c;
        foliageMesh.setMatrixAt(fIdx, dummy.matrix);
        color.setHex(birchPalette[(tIdx + c) % birchPalette.length]);
        foliageMesh.setColorAt(fIdx, color);
      }
    });

    trunkMesh.instanceMatrix.needsUpdate = true;
    trunkMesh.castShadow = true; trunkMesh.receiveShadow = true;
    grid.group.add(trunkMesh);

    boughMesh.instanceMatrix.needsUpdate = true;
    boughMesh.castShadow = true; boughMesh.receiveShadow = true;
    grid.group.add(boughMesh);

    foliageMesh.instanceMatrix.needsUpdate = true;
    if (foliageMesh.instanceColor) foliageMesh.instanceColor.needsUpdate = true;
    foliageMesh.castShadow = true; foliageMesh.receiveShadow = true;
    grid.group.add(foliageMesh);
  }

  // ──────────────────────────────────────────────────────────────────
  // 5. Dead Snag Trees (Charred / Blighted Deadlands)
  // - Gnarly broken trunk (height 17.5) with lean and pale/charred bark
  // - 4 fractured jagged dead limbs rooted inside trunk with splintered ends
  // ──────────────────────────────────────────────────────────────────
  if (deadTrees.length > 0) {
    const trunkHeight = 17.5, baseR = 1.35, topR = 0.45;
    const deadTrunkGeom = new THREE.CylinderGeometry(topR, baseR, trunkHeight, 7);
    deadTrunkGeom.translate(0, trunkHeight / 2 - 1.2, 0);
    const deadTrunkMesh = new THREE.InstancedMesh(deadTrunkGeom, barkDead, deadTrees.length);

    const limbsPerTree = 4;
    const limbLength = 6.8, limbBaseR = 0.38, limbTipR = 0.12;
    const limbGeom = new THREE.CylinderGeometry(limbTipR, limbBaseR, limbLength, 5);
    limbGeom.translate(0, limbLength / 2, 0);
    const deadLimbMesh = new THREE.InstancedMesh(limbGeom, barkDead, deadTrees.length * limbsPerTree);

    const stubsPerTree = 4;
    const stubLength = 3.2, stubBaseR = 0.22, stubTipR = 0.08;
    const stubGeom = new THREE.CylinderGeometry(stubTipR, stubBaseR, stubLength, 4);
    stubGeom.translate(0, stubLength / 2, 0);
    const deadStubMesh = new THREE.InstancedMesh(stubGeom, barkDead, deadTrees.length * stubsPerTree);

    deadTrees.forEach((item, tIdx) => {
      const { scale, x, z, ground } = item;
      const seed = hash2(Math.round(x), Math.round(z), 0xdead);
      const r = rngFrom(seed);
      const baseRotY = (item.tree.rotY || (r() * Math.PI * 2));
      const lean = 0.12 + (r() - 0.5) * 0.08;
      const sinkDepth = 0.85 * scale;
      const trunkBasePos = new THREE.Vector3(x, ground - sinkDepth, z);

      // Snag main trunk with natural lean, securely sunk into slopes
      dummy.position.copy(trunkBasePos);
      dummy.quaternion.set(0, 0, 0, 1);
      dummy.rotation.set(Math.sin(baseRotY) * lean, baseRotY, Math.cos(baseRotY) * lean);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      deadTrunkMesh.setMatrixAt(tIdx, dummy.matrix);

      // Capture exact trunk orientation so branches root seamlessly into leaning trunk
      const trunkQuat = dummy.quaternion.clone();

      // Fractured dead boughs rooted into leaning trunk
      const attachHeights = [7.5, 9.8, 12.2, 14.5];
      for (let l = 0; l < limbsPerTree; l++) {
        const lAngle = l * 1.6 + (r() - 0.5) * 0.25;
        const hAttach = attachHeights[l];
        const t = hAttach / trunkHeight;
        const rTrunk = baseR + (topR - baseR) * t;

        // Local anchor inside the trunk core
        const localRoot = new THREE.Vector3(
          Math.sin(lAngle) * (rTrunk * 0.35),
          hAttach,
          Math.cos(lAngle) * (rTrunk * 0.35)
        );
        // Transform by trunkQuat so it is 100% attached to the actual tilted trunk!
        const worldRoot = localRoot.clone().multiplyScalar(scale).applyQuaternion(trunkQuat).add(trunkBasePos);

        const pitch = 0.95 + (r() - 0.5) * 0.28;
        const localDir = new THREE.Vector3(
          Math.sin(lAngle) * Math.sin(pitch),
          Math.cos(pitch),
          Math.cos(lAngle) * Math.sin(pitch)
        ).normalize();
        const worldDir = localDir.clone().applyQuaternion(trunkQuat).normalize();

        dummy.position.copy(worldRoot);
        dummy.quaternion.setFromUnitVectors(upVector, worldDir);
        dummy.scale.set(scale * 0.95, scale * (0.85 + r() * 0.3), scale * 0.95);
        dummy.updateMatrix();
        deadLimbMesh.setMatrixAt(tIdx * limbsPerTree + l, dummy.matrix);

        // Fractured splinter stub branching off from the dead limb
        const forkOrigin = worldRoot.clone().add(worldDir.clone().multiplyScalar(limbLength * 0.52 * scale));
        const forkPitch = pitch + 0.45;
        const localForkDir = new THREE.Vector3(
          Math.sin(lAngle + 0.8) * Math.sin(forkPitch),
          Math.cos(forkPitch),
          Math.cos(lAngle + 0.8) * Math.sin(forkPitch)
        ).normalize();
        const worldForkDir = localForkDir.clone().applyQuaternion(trunkQuat).normalize();

        dummy.position.copy(forkOrigin);
        dummy.quaternion.setFromUnitVectors(upVector, worldForkDir);
        dummy.scale.set(scale * 0.8, scale * 0.75, scale * 0.8);
        dummy.updateMatrix();
        deadStubMesh.setMatrixAt(tIdx * stubsPerTree + l, dummy.matrix);
      }
    });

    deadTrunkMesh.instanceMatrix.needsUpdate = true;
    deadTrunkMesh.castShadow = true; deadTrunkMesh.receiveShadow = true;
    grid.group.add(deadTrunkMesh);

    deadLimbMesh.instanceMatrix.needsUpdate = true;
    deadLimbMesh.castShadow = true; deadLimbMesh.receiveShadow = true;
    grid.group.add(deadLimbMesh);

    deadStubMesh.instanceMatrix.needsUpdate = true;
    deadStubMesh.castShadow = true; deadStubMesh.receiveShadow = true;
    grid.group.add(deadStubMesh);
  }
}
