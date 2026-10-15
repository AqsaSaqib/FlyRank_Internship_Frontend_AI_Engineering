import { useEffect, useMemo } from "react";
import { Center, Resize, useGLTF } from "@react-three/drei";
import type { Material, Mesh } from "three";

interface Props {
  url: string;
  wireframe: boolean;
}

/**
 * A user-supplied .glb. useGLTF wires up DRACO (decoder fetched on demand
 * from gstatic) and meshopt, so compressed files just work. The model is
 * normalised to a ~2.6 unit box and sat on the ground plane.
 */
export default function DroppedModel({ url, wireframe }: Props) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf]);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as (Material & {
        wireframe?: boolean;
      })[];
      mats.forEach((m) => {
        if ("wireframe" in m) m.wireframe = wireframe;
      });
    });
  }, [scene, wireframe]);

  useEffect(() => () => useGLTF.clear(url), [url]);

  return (
    <Center top>
      <group scale={2.6}>
        <Resize>
          <primitive object={scene} />
        </Resize>
      </group>
    </Center>
  );
}
