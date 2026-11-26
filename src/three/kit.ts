import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Loads Kenney Holiday Kit pieces (CC0, www.kenney.nl) as plain geometries plus one shared,
 * palette-matched material, ready for instancing. Every piece in the kit uses the same small
 * colour-map texture, so the whole village renders with a single material.
 */
export const KIT_BASE = '/assets/models/holiday/';

export const KIT_PIECES = [
  'cabin-wall', 'cabin-window-a', 'cabin-window-b', 'cabin-window-c', 'cabin-doorway', 'cabin-corner-logs',
  'cabin-roof-snow-point', 'cabin-wall-roof-center', 'cabin-wall-wreath',
  'tree-snow-a', 'tree-snow-b', 'tree-snow-c', 'tree-decorated-snow',
  'lantern', 'present-a-cube', 'present-b-round', 'present-a-rectangle', 'present-b-cube',
  'snowman-hat', 'reindeer', 'sled', 'snow-pile', 'rocks-small',
] as const;

export type KitPiece = (typeof KIT_PIECES)[number];

export interface Kit {
  geometries: Record<KitPiece, THREE.BufferGeometry>;
  material: THREE.MeshStandardMaterial;
}

export async function loadKit(): Promise<Kit> {
  const loader = new GLTFLoader();
  const materials: THREE.Material[] = [];
  const entries = await Promise.all(
    KIT_PIECES.map(async (name) => {
      const gltf = await loader.loadAsync(`${KIT_BASE}${name}.glb`);
      gltf.scene.updateMatrixWorld(true);
      const parts: THREE.BufferGeometry[] = [];
      gltf.scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        const geometry = mesh.geometry.clone();
        geometry.applyMatrix4(mesh.matrixWorld);
        // Keep only what the shared material needs, so pieces merge cleanly.
        for (const key of Object.keys(geometry.attributes)) {
          if (!['position', 'normal', 'uv'].includes(key)) geometry.deleteAttribute(key);
        }
        parts.push(geometry.index ? geometry.toNonIndexed() : geometry);
        const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        if (material) materials.push(material);
        mesh.geometry.dispose();
      });
      if (parts.length === 0) throw new Error(`Empty model: ${name}`);
      const merged = parts.length === 1 ? parts[0]! : mergeGeometries(parts, false);
      if (!merged) throw new Error(`Could not merge model: ${name}`);
      return [name, merged] as const;
    }),
  );
  const source = materials.find((m) => (m as THREE.MeshStandardMaterial).map) as THREE.MeshStandardMaterial | undefined;
  const map = source?.map ?? null;
  if (map) {
    map.colorSpace = THREE.SRGBColorSpace;
    map.magFilter = THREE.NearestFilter;
    map.minFilter = THREE.NearestFilter;
    map.generateMipmaps = false;
  }
  const material = new THREE.MeshStandardMaterial({ map, roughness: 0.82, metalness: 0 });
  for (const m of materials) if (m !== material) m.dispose();
  return { geometries: Object.fromEntries(entries) as Record<KitPiece, THREE.BufferGeometry>, material };
}
