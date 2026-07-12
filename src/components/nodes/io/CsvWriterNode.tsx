import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

export function CsvWriterNode({ data, id }: any) {
  const [filePath, setFilePath] = useState<string>(data.filePath || "");
  const [append, setAppend] = useState<boolean>(data.append !== undefined ? data.append : false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const firstWriteRef = useRef<boolean>(true);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (!isRecording || !filePath) {
          return;
        }

        const timestamp = Date.now() / 1000;
        const device = incoming.device || "unknown";
        const port = incoming.port || "unknown";
        const value = incoming.value !== undefined ? incoming.value : "";
        const line = `${timestamp.toFixed(4)},${device},${port},${value}\n`;

        if (firstWriteRef.current && !append) {
          invoke("saveFile", { path: filePath, contents: line }).catch(console.error);
          firstWriteRef.current = false;
        } else {
          invoke("appendToFile", { path: filePath, content: line }).catch(console.error);
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [id, data, isRecording, filePath, append]);

  const selectFile = async () => {
    const selected = await save({
      filters: [{ name: "CSV", extensions: ["csv"] }],
      defaultPath: "data.csv",
    });

    if (selected) {
      setFilePath(selected);
      data.updateNodeData(id, { filePath: selected });
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      firstWriteRef.current = true;
    }

    setIsRecording(!isRecording);
  };

  const updateAppend = (val: boolean) => {
    setAppend(val);
    data.updateNodeData(id, { append: val });
  };

  return (
    <div className="serial-node csv-writer-node">
      <Handle type="target" position={Position.Left} className="multi-handle" />

      <div
        className="node-header"
        title={"Saves incoming data to a CSV file with timestamps.\nInput: Any data packet"}
      >
        <span>CSV Writer</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div
          style={{
            fontSize: "10px",
            marginBottom: "4px",
            color: "#aaa",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {filePath || "No file selected"}
        </div>

        <button
          onClick={selectFile}
          style={{
            width: "100%",
            fontSize: "10px",
            marginBottom: "8px",
            background: "#444",
            color: "#eee",
            border: "1px solid #666",
            borderRadius: "4px",
            padding: "4px",
            cursor: "pointer",
          }}
        >
          Select File
        </button>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "10px",
            marginBottom: "8px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={append}
            onChange={(e) => updateAppend(e.target.checked)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          Append to file
        </label>

        <button
          onClick={toggleRecording}
          style={{
            width: "100%",
            fontSize: "10px",
            backgroundColor: isRecording ? "#ff4444" : "#44ff44",
            color: "#000",
            fontWeight: "bold",
            border: "none",
            borderRadius: "4px",
            padding: "6px",
            cursor: "pointer",
          }}
        >
          {isRecording ? "STOP RECORDING" : "START RECORDING"}
        </button>
      </div>
    </div>
  );
}
