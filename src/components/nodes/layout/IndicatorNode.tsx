import { useEffect, useState } from "react";
import { Handle, Position } from "@xyflow/react";

export function IndicatorNode({ data, id }: any) {
  const [glowKey, setGlowKey] = useState(0);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (data.onData) {
          data.onData(id, incoming);
        }

        setGlowKey(prev => prev + 1);
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [id, data]);

  return (
    <div className={"serial-node indicator-node" + (glowKey > 0 ? " indicator-pulse-effect" : "")}>
      {glowKey > 0 && (
        <div
          key={glowKey}
          className="node-glow-effect"
          onAnimationEnd={() => setGlowKey(0)}
        />
      )}
      <Handle type="target" position={Position.Left} style={{ left: "-4px" }} />
      <div className="node-header" title={"Indicator, which lights up whenever a message passes through it.\nInput: Any signal\nOutput: Same signal"}>
        <button className="delete-btn" style={{ fontSize: "12px" }} onClick={() => data.onDelete(id)}>×</button>
      </div>
      <Handle type="source" position={Position.Right} style={{ right: "-4px" }} />
    </div>
  );
}
