import { useRef } from "react";
import { FABRICS, FINISHES, type BaseStyle, type Finish, type SpeakerConfig } from "../config";

interface Props {
  config: SpeakerConfig;
  onChange: (patch: Partial<SpeakerConfig>) => void;
  onReset: () => void;
  customModel: string | null;
  onPickFile: (file: File) => void;
  onClearModel: () => void;
  canAnimate: boolean;
}

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`toggle${disabled ? " is-disabled" : ""}`}>
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true" />
    </label>
  );
}

export default function Configurator({ config, onChange, onReset, customModel, onPickFile, onClearModel, canAnimate }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const speakerOnly = customModel !== null;

  return (
    <aside className="panel" aria-label="Configurator">
      <p className="eyebrow">Configurator</p>
      <h2>Make it yours</h2>

      <fieldset disabled={speakerOnly}>
        <legend>Fabric</legend>
        <div className="swatches">
          {FABRICS.map((f) => (
            <button
              key={f.value}
              type="button"
              className="swatch"
              style={{ background: f.value }}
              aria-label={f.name}
              aria-pressed={config.color === f.value}
              title={f.name}
              onClick={() => onChange({ color: f.value })}
            />
          ))}
        </div>
      </fieldset>

      <fieldset disabled={speakerOnly}>
        <legend>Trim finish</legend>
        <div className="segmented">
          {(Object.keys(FINISHES) as Finish[]).map((key) => (
            <button key={key} type="button" aria-pressed={config.finish === key} onClick={() => onChange({ finish: key })}>
              {FINISHES[key].label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={speakerOnly}>
        <legend>Base</legend>
        <div className="segmented">
          {(["puck", "tripod"] as BaseStyle[]).map((key) => (
            <button key={key} type="button" aria-pressed={config.base === key} onClick={() => onChange({ base: key })}>
              {key === "puck" ? "Puck" : "Tripod legs"}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="toggles">
        <Toggle label="Exploded view" checked={config.exploded} onChange={(v) => onChange({ exploded: v })} disabled={speakerOnly} />
        <Toggle label="Light ring" checked={config.glow} onChange={(v) => onChange({ glow: v })} disabled={speakerOnly} />
        <Toggle label="Wireframe" checked={config.wireframe} onChange={(v) => onChange({ wireframe: v })} />
        <Toggle
          label={canAnimate ? "Auto-rotate" : "Auto-rotate (off: reduced motion)"}
          checked={config.autoRotate && canAnimate}
          onChange={(v) => onChange({ autoRotate: v })}
          disabled={!canAnimate}
        />
      </div>

      <div className="model-row">
        <input
          ref={fileInput}
          type="file"
          accept=".glb,model/gltf-binary"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPickFile(file);
            e.target.value = "";
          }}
        />
        {customModel ? (
          <button type="button" className="btn ghost" onClick={onClearModel}>
            ← Back to Aura One
          </button>
        ) : (
          <button type="button" className="btn ghost" onClick={() => fileInput.current?.click()}>
            Load your own .glb
          </button>
        )}
        <button type="button" className="btn link" onClick={onReset}>
          Reset
        </button>
      </div>
      <p className="hint">Tip: drop any .glb (DRACO / meshopt OK) onto the viewer.</p>
    </aside>
  );
}
