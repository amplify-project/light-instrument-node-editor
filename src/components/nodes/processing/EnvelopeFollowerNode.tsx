import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function EnvelopeFollowerNode({ data, id }: any) {
  const attack = data.attack ?? 0.5;
  const release = data.release ?? 0.1;
  const [lastEnvelope, setLastEnvelope] = useState<number | null>(null);
  const lastEnvelopeRef = useRef<number | null>(null);
  const envelopeRef = useRef<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastEnvelope(lastEnvelopeRef.current);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {

        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const value = incoming.value;
          const current = envelopeRef.current;
          let next: number;

          if (value > current) {
            next = current + attack * (value - current);
          } else {
            next = current - release * current;
          }

          if (next < 0.001) next = 0;

          envelopeRef.current = next;
          lastEnvelopeRef.current = next;

          if (data.onData) {
            data.onData(id, { ...incoming, value: next });
          }
        }
      });
    }

    return () => {

      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [attack, release, id, data]);

  return (
    <div className="serial-node envelope-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header" title={"Tracks the peak level of a signal with configurable attack and release times.\nInput: Numeric value\nOutput: Envelope value"}>
        <span>Envelope Follower</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <label style={{ fontSize: "9px", color: "#888" }}>Attack</label>
            <span style={{ fontSize: "9px" }}>{attack.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={attack}
            onChange={(e) => data.updateNodeData?.(id, { attack: Number(e.target.value) })}
            style={{ width: "100%" }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <label style={{ fontSize: "9px", color: "#888" }}>Release</label>
            <span style={{ fontSize: "9px" }}>{release.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={release}
            onChange={(e) => data.updateNodeData?.(id, { release: Number(e.target.value) })}
            style={{ width: "100%" }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>

        {lastEnvelope !== null && (
          <div className="node-status">
            Env: {lastEnvelope.toFixed(2)}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
