import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function PeakDetectionNode({ data, id }: any) {
  const [lastPeak, setLastPeak] = useState<number | null>(null);
  const [triggerCount, setTriggerCount] = useState(0);

  const lastValueRef = useRef<number | null>(null);
  const isRisingRef = useRef(false);

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const currentValue = incoming.value;

          if (lastValueRef.current !== null) {
            if (currentValue > lastValueRef.current) {
              isRisingRef.current = true;
            } else if (currentValue < lastValueRef.current) {
              if (isRisingRef.current) {
                // Peak detected!
                const peakValue = lastValueRef.current;
                setLastPeak(peakValue);
                setTriggerCount(prev => prev + 1);

                if (data.onData) {
                  // Emit a signal (e.g., command: peak, value: peakValue)
                  data.onData(id, {
                    device: incoming.device || "peak",
                    port: incoming.port || "0",
                    value: peakValue,
                    isPeak: true
                  });
                }

                isRisingRef.current = false;
              }
            }
          }

          lastValueRef.current = currentValue;
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [id, data]);

  return (
    <div className="serial-node peak-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header" title={"Identifies local maxima (peaks) in a numeric stream and emits a trigger signal.\nInput: Numeric value\nOutput: Trigger impulse"}>
        <span>Peak Detection</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div style={{ fontSize: "10px", color: "#888" }}>Detects peaks in values</div>

        <div className="node-status">
          {lastPeak !== null ? `Last Peak: ${lastPeak}` : "Waiting for data..."}
        </div>

        <div style={{ fontSize: "10px", color: "#888", textAlign: "right" }}>
          Count: {triggerCount}
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
