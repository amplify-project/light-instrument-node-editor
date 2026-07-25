import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function ScriptNode({ data, id }: any) {
  const script = data.script || "";
  const [isRunning, setIsRunning] = useState(false);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (incoming && !isRunningRef.current) {
          executeScript();
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [id, data, script]);

  const executeScript = async () => {
    if (isRunningRef.current) {
      return;
    }

    setIsRunning(true);
    isRunningRef.current = true;
    setErrorLine(null);

    const lines = script.split("\n");
    const commandRegex = /^(\w+)\s+'([^']*)'\s+'([^']*)'\s+'([^']*)'$/;
    const delayRegex = /^delay\s+(\d+)$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line || line.startsWith("//")) {
        continue;
      }

      const delayMatch = line.match(delayRegex);

      if (delayMatch) {
        const ms = parseInt(delayMatch[1], 10);
        await new Promise((resolve) => setTimeout(resolve, ms));
        continue;
      }

      const commandMatch = line.match(commandRegex);

      if (commandMatch) {
        const [_, command, device, port, value] = commandMatch;

        if (data.onData) {
          data.onData(id, { device, port, command, value });
        }

        continue;
      }

      setErrorLine(i + 1);
      break;
    }

    setIsRunning(false);
    isRunningRef.current = false;
  };

  return (
    <div className="serial-node script-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header" title={"Executes a sequence of commands and delays.\nFormat: command 'device' 'port' 'params'\nDelay: delay [ms]\nExample:\npulse 'receiver1' 'LED1' '255,0,0'\ndelay 500\nset '' '' '0'"}>
        <span>Script</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <textarea
          value={script}
          onChange={(e) => data.updateNodeData?.(id, { script: e.target.value })}
          placeholder="Enter script here..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          rows={10}
        />

        {errorLine !== null && (
          <div className="node-status" style={{ color: "#ff4444" }}>
            Error on line {errorLine}
          </div>
        )}

        <button disabled={isRunning || !script} onClick={executeScript}>
          {isRunning ? "Running..." : "Run Script"}
        </button>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
