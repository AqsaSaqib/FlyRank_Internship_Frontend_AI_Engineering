import { Component, Suspense, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  PerformanceMonitor,
} from "@react-three/drei";
import Speaker from "./Speaker";
import DroppedModel from "./DroppedModel";
import type { SpeakerConfig } from "../config";

interface Props {
  config: SpeakerConfig;
  modelUrl: string | null;
  active: boolean;
  reducedMotion: boolean;
  statsRef: RefObject<HTMLSpanElement | null>;
  onModelError: (message: string) => void;
}

/** Studio lighting baked once from in-scene Lightformers: no HDRI to download. */
function Studio() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer form="rect" intensity={3} position={[0, 5, -4]} scale={[10, 3, 1]} />
      <Lightformer form="rect" intensity={1.5} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
      <Lightformer form="rect" intensity={1} position={[5, 2, 1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
      <Lightformer form="ring" color="#ffd6c7" intensity={2} position={[2, 4, 4]} scale={2} />
    </Environment>
  );
}

/** Writes fps / draw calls / triangles straight to the DOM, so no React re-renders. */
function Stats({ target }: { target: RefObject<HTMLSpanElement | null> }) {
  const gl = useThree((s) => s.gl);
  const frames = useRef(0);
  const last = useRef(performance.now());
  // ContactShadows and the env bake call gl.render themselves, which would reset
  // the counters mid-frame; count the whole frame instead.
  useEffect(() => {
    gl.info.autoReset = false;
    return () => void (gl.info.autoReset = true);
  }, [gl]);
  useFrame(() => {
    const { calls, triangles } = gl.info.render;
    gl.info.reset();
    frames.current++;
    const now = performance.now();
    if (now - last.current < 500 || !target.current) return;
    const fps = Math.round((frames.current * 1000) / (now - last.current));
    target.current.textContent = `${fps} fps · ${calls} draws · ${(triangles / 1000).toFixed(1)}k tris · dpr ${gl
      .getPixelRatio()
      .toFixed(2)}`;
    frames.current = 0;
    last.current = now;
  });
  return null;
}

class ModelBoundary extends Component<{ onError: (m: string) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error.message || "Couldn't parse that file.");
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Scene({ config, modelUrl, active, reducedMotion, statsRef, onModelError }: Props) {
  const maxDpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const [dpr, setDpr] = useState(maxDpr);
  const animate = !reducedMotion;

  return (
    <Canvas
      // Pause the render loop entirely when off-screen or in a background tab.
      // With reduced motion we only render on interaction.
      frameloop={!active ? "never" : animate ? "always" : "demand"}
      dpr={dpr}
      camera={{ position: [4.6, 3.4, 6.8], fov: 38 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      aria-label="Interactive 3D view of the Aura One speaker"
    >
      <PerformanceMonitor
        onIncline={() => setDpr(maxDpr)}
        onDecline={() => setDpr(1)}
        flipflops={3}
        onFallback={() => setDpr(1)}
      />
      <color attach="background" args={["#0f1218"]} />
      <fog attach="fog" args={["#0f1218", 12, 24]} />
      <ambientLight intensity={0.25} />
      <Studio />

      <Suspense fallback={null}>
        {modelUrl ? (
          <ModelBoundary key={modelUrl} onError={onModelError}>
            <DroppedModel url={modelUrl} wireframe={config.wireframe} />
          </ModelBoundary>
        ) : (
          <Speaker config={config} animate={animate} />
        )}
      </Suspense>

      <ContactShadows opacity={0.55} scale={8} blur={2.4} far={4} resolution={256} color="#000000" />

      <OrbitControls
        makeDefault
        target={[0, 1.7, 0]}
        enablePan={false}
        enableDamping
        minDistance={4}
        maxDistance={12}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2 - 0.05}
        autoRotate={config.autoRotate && animate}
        autoRotateSpeed={0.8}
      />
      <Stats target={statsRef} />
    </Canvas>
  );
}
