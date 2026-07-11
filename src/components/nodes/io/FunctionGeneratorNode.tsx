import { useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function FunctionGeneratorNode({ id, data }: any) {
  const waveform = data.waveform ?? "sine";
  const frequency = data.frequency ?? 1;
  const sampleRate = data.sampleRate ?? 20;

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const phase = (elapsed * frequency) % 1;
      let value = 0;

      if (waveform === "sine") {
        value = (Math.sin(2 * Math.PI * phase) + 1) / 2;
      } else if (waveform === "square") {
        value = phase < 0.5 ? 1 : 0;
      } else if (waveform === "triangle") {
        value = phase < 0.5 ? 2 * phase : 2 * (1 - phase);
      } else if (waveform === "sawtooth") {
        value = phase;
      }

      if (data.onData) {
        data.onData(id, {
          device: "funcgen",
          port: "out",
          value: Number(value.toFixed(4)),
        });
      }
    }, 1000 / sampleRate);

    return () => {
      clearInterval(intervalId);
    };
  }, [waveform, frequency, sampleRate, id, data]);

  return (
    <div className="serial-node function-generator-node">
      <div className="node-header" title={"Generates periodic waveforms (Sine, Square, Triangle, Sawtooth) at a set frequency.\nOutput: Periodic numeric signal (0 to 1)"}>
        <span>Function Generator</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Waveform:</label>
        <select
          value={waveform}
          onChange={(e) => data.updateNodeData?.(id, { waveform: e.target.value })}
          style={{ width: "100%", marginBottom: "8px" }}
        >
          <option value="sine">Sine</option>
          <option value="square">Square</option>
          <option value="triangle">Triangle</option>
          <option value="sawtooth">Sawtooth</option>
        </select>

        <label style={{ fontSize: "10px", color: "#888" }}>Frequency (Hz):</label>
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={frequency}
          onChange={(e) => data.updateNodeData?.(id, { frequency: Number(e.target.value) })}
          style={{ width: "100%", marginBottom: "8px" }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <label style={{ fontSize: "10px", color: "#888" }}>Sampling Rate (Hz):</label>
        <input
          type="number"
          step="1"
          min="1"
          max="100"
          value={sampleRate}
          onChange={(e) => data.updateNodeData?.(id, { sampleRate: Number(e.target.value) })}
          style={{ width: "100%" }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
