import { lazy, Suspense, useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import Configurator from "./components/Configurator";
import Poster from "./components/Poster";
import { DEFAULT_CONFIG, type SpeakerConfig } from "./config";
import { useActive, useCapabilities } from "./useCapabilities";

// three + r3f + drei live only in this chunk; the page shell never pays for them.
const loadScene = () => import("./components/Scene");
const Scene = lazy(loadScene);

const MAX_MODEL_MB = 25;

export default function App() {
  const caps = useCapabilities();
  const [config, setConfig] = useState<SpeakerConfig>(DEFAULT_CONFIG);
  const [viewer, setViewer] = useState<HTMLElement | null>(null);
  const active = useActive(viewer);
  const autoStart = caps.webgl && !caps.reducedMotion && !caps.constrained;
  const [optedIn, setOptedIn] = useState(false);
  const [started, setStarted] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const statsRef = useRef<HTMLSpanElement>(null);

  // Start the 3D chunk only once the viewer is on screen and the browser is idle,
  // so the static poster + copy paint first.
  useEffect(() => {
    if (started || !active || !(autoStart || optedIn)) return;
    const start = () => setStarted(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(start, 200);
    return () => clearTimeout(id);
  }, [active, autoStart, optedIn, started]);

  useEffect(() => () => void (modelUrl && URL.revokeObjectURL(modelUrl)), [modelUrl]);

  const update = useCallback((patch: Partial<SpeakerConfig>) => setConfig((c) => ({ ...c, ...patch })), []);

  const loadFile = useCallback((file: File) => {
    if (!/\.glb$/i.test(file.name)) {
      setNotice("Only binary .glb files are supported (a .gltf would need its side files).");
      return;
    }
    if (file.size > MAX_MODEL_MB * 1024 * 1024) {
      setNotice(`That file is ${(file.size / 1048576).toFixed(1)} MB. Keep it under ${MAX_MODEL_MB} MB so phones survive.`);
      return;
    }
    setNotice(null);
    setModelName(file.name);
    setModelUrl(URL.createObjectURL(file));
    setOptedIn(true);
  }, []);

  const clearModel = useCallback(() => {
    setModelUrl(null);
    setModelName(null);
  }, []);

  const onModelError = useCallback(
    (message: string) => {
      clearModel();
      setNotice(`Couldn't load that model: ${message}`);
    },
    [clearModel],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const showCanvas = started && caps.webgl;

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">FlyRank · Week 7 · First 3D experience</p>
        <h1>
          Aura One<span className="dot">.</span>
        </h1>
        <p className="lede">
          A smart speaker you can turn over in your hands. Swap the fabric, trim and base, pull it apart, or drop in your own
          <code>.glb</code> to stage it in the same studio.
        </p>
      </header>

      <main className="layout">
        <section
          ref={setViewer}
          className={`viewer${dragging ? " is-dragging" : ""}`}
          aria-label="Product viewer"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {showCanvas ? (
            <Suspense fallback={<Poster config={config} />}>
              <Scene
                config={config}
                modelUrl={modelUrl}
                active={active}
                reducedMotion={caps.reducedMotion}
                statsRef={statsRef}
                onModelError={onModelError}
              />
            </Suspense>
          ) : (
            <div className="fallback">
              <Poster config={config} />
              {caps.reason && (
                <div className="fallback-card">
                  <p>{caps.reason}</p>
                  {caps.webgl && (
                    <button
                      type="button"
                      className="btn"
                      onPointerEnter={loadScene}
                      onFocus={loadScene}
                      onClick={() => setOptedIn(true)}
                    >
                      Load interactive 3D (~300 KB)
                    </button>
                  )}
                </div>
              )}
              {!caps.reason && <p className="loading">Loading 3D…</p>}
            </div>
          )}

          <div className="viewer-chrome">
            <span className="chip">
              {modelName ? `Viewing ${modelName}` : showCanvas ? "Drag to orbit · pinch / scroll to zoom" : "Static preview"}
            </span>
            {showCanvas && (
              <button type="button" className="chip chip-btn" aria-pressed={showStats} onClick={() => setShowStats((s) => !s)}>
                {showStats ? "Hide stats" : "Perf stats"}
              </button>
            )}
          </div>
          {showCanvas && (
            <span className={`stats${showStats ? "" : " is-hidden"}`} ref={statsRef} aria-live="off">
              measuring…
            </span>
          )}
          {dragging && <div className="drop-hint">Drop your .glb</div>}
          {notice && (
            <div className="notice" role="alert">
              {notice}
              <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}>
                ×
              </button>
            </div>
          )}
        </section>

        <Configurator
          config={config}
          onChange={update}
          onReset={() => {
            setConfig(DEFAULT_CONFIG);
            clearModel();
          }}
          customModel={modelUrl}
          onPickFile={loadFile}
          onClearModel={clearModel}
          canAnimate={!caps.reducedMotion}
        />
      </main>

      <footer className="footer">
        Built with React Three Fiber · procedural geometry, no model download · canvas lazy-loaded with a static fallback
      </footer>
    </div>
  );
}
