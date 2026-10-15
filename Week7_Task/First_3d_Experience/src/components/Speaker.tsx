import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, type Group, type MeshStandardMaterial } from "three";
import { FINISHES, type SpeakerConfig } from "../config";

const BODY_H = 2.2;
const BODY_R = 0.9;

interface Props {
  config: SpeakerConfig;
  animate: boolean;
}

/** Procedural speaker: zero model download, ~10 draw calls. */
export default function Speaker({ config, animate }: Props) {
  const root = useRef<Group>(null);
  const cap = useRef<Group>(null);
  const ring = useRef<Group>(null);
  const base = useRef<Group>(null);
  const glowMat = useRef<MeshStandardMaterial>(null);

  const finish = FINISHES[config.finish];
  const { wireframe } = config;

  useFrame((state, delta) => {
    const k = animate ? 6 : 1000; // reduced motion: snap instead of tween
    const e = config.exploded;
    if (cap.current) cap.current.position.y = MathUtils.damp(cap.current.position.y, e ? 0.55 : 0, k, delta);
    if (ring.current) ring.current.position.y = MathUtils.damp(ring.current.position.y, e ? 1.0 : 0, k, delta);
    if (base.current) base.current.position.y = MathUtils.damp(base.current.position.y, e ? -0.45 : 0, k, delta);

    // Subtle tilt toward the cursor / touch point.
    if (root.current) {
      const tx = animate ? state.pointer.y * 0.12 : 0;
      const tz = animate ? -state.pointer.x * 0.12 : 0;
      root.current.rotation.x = MathUtils.damp(root.current.rotation.x, tx, 4, delta);
      root.current.rotation.z = MathUtils.damp(root.current.rotation.z, tz, 4, delta);
    }

    if (glowMat.current) {
      const pulse = animate ? 0.75 + Math.sin(state.clock.elapsedTime * 2.2) * 0.25 : 1;
      glowMat.current.emissiveIntensity = config.glow ? 2.2 * pulse : 0;
    }
  });

  const accent = (
    <meshStandardMaterial
      color={finish.color}
      roughness={finish.roughness}
      metalness={finish.metalness}
      wireframe={wireframe}
    />
  );

  return (
    <group ref={root} position={[0, 0.45, 0]}>
      {/* Fabric body: sheen gives the knitted-cloth falloff */}
      <mesh castShadow position={[0, BODY_H / 2, 0]}>
        <cylinderGeometry args={[BODY_R, BODY_R, BODY_H, 64, 1]} />
        <meshPhysicalMaterial
          color={config.color}
          roughness={0.95}
          sheen={1}
          sheenRoughness={0.6}
          sheenColor="#ffffff"
          wireframe={wireframe}
        />
      </mesh>

      {/* Top cap + buttons */}
      <group ref={cap}>
        <mesh castShadow position={[0, BODY_H + 0.06, 0]}>
          <cylinderGeometry args={[BODY_R + 0.02, BODY_R + 0.02, 0.12, 64]} />
          {accent}
        </mesh>
        {[-0.28, 0, 0.28].map((x) => (
          <mesh key={x} position={[x, BODY_H + 0.13, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.03, 24]} />
            <meshStandardMaterial color="#14161b" roughness={0.6} wireframe={wireframe} />
          </mesh>
        ))}
      </group>

      {/* Light ring */}
      <group ref={ring}>
        <mesh position={[0, BODY_H + 0.125, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.66, 0.03, 12, 96]} />
          <meshStandardMaterial
            ref={glowMat}
            color={config.glow ? "#ffffff" : "#555555"}
            emissive={config.color}
            emissiveIntensity={2}
            toneMapped={false}
            wireframe={wireframe}
          />
        </mesh>
      </group>

      {/* Swappable base */}
      <group ref={base}>
        {config.base === "puck" ? (
          <mesh castShadow position={[0, -0.08, 0]}>
            <cylinderGeometry args={[BODY_R + 0.04, BODY_R - 0.1, 0.16, 64]} />
            {accent}
          </mesh>
        ) : (
          <group>
            <mesh position={[0, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[BODY_R - 0.05, 0.04, 12, 64]} />
              {accent}
            </mesh>
            {[0, 1, 2].map((i) => {
              const a = (i / 3) * Math.PI * 2;
              return (
                <mesh
                  key={i}
                  castShadow
                  position={[Math.cos(a) * 0.78, -0.24, Math.sin(a) * 0.78]}
                  rotation={[-Math.sin(a) * 0.25, 0, Math.cos(a) * 0.25]}
                >
                  <cylinderGeometry args={[0.04, 0.03, 0.46, 12]} />
                  {accent}
                </mesh>
              );
            })}
          </group>
        )}
      </group>
    </group>
  );
}
