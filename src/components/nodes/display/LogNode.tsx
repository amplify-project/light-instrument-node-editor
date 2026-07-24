import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function LogNode({ data, id }: any) {
  const [logs, setLogs] = useState<string[]>([]);
  const logsRef = useRef<string[]>([]);
  const scrollRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        const timestamp = new Date().toLocaleTimeString();
        let message = "";

        if (incoming && typeof incoming === "object") {
          message = JSON.stringify(incoming);
        } else {
          message = String(incoming);
        }

        logsRef.current.push(`[${timestamp}] ${message}`);

        if (logsRef.current.length > 50) {
          logsRef.current = logsRef.current.slice(logsRef.current.length - 50);
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [id, data]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs([...logsRef.current]);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="serial-node log-node">
      <Handle type="target" position={Position.Left} className="multi-handle" />

      <div className="node-header" title={"Displays a scrollable history of incoming data packets with timestamps.\nInput: Any data"}>
        <span>Log</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <textarea
          ref={scrollRef}
          readOnly
          value={logs.join("\n")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          style={{
            width: "100%",
            height: "120px",
            background: "#121212",
            color: "#888",
            border: "1px solid #333",
            borderRadius: "4px",
            fontSize: "8px",
            fontFamily: "monospace",
            resize: "none",
            boxSizing: "border-box",
            padding: "4px",
          }}
        />
        <button
          onClick={() => {
            logsRef.current = [];
            setLogs([]);
          }}
          style={{ marginTop: "4px" }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
