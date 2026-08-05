import { NodeResizer } from "@xyflow/react";

export function AnnotationNode({ data, id, selected }: any) {
  return (
    <>
      <NodeResizer
        minWidth={150}
        minHeight={100}
        isVisible={selected}
      />

      <div
        className="serial-node annotation-node"
        style={{
          width: "100%",
          height: "100%",
          margin: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="node-header" title={"Allows adding text annotations to the node graph.\n(No functional inputs or outputs)"}>
          <span>Annotation</span>
          <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
        </div>

        <div className="node-content nodrag" style={{ flex: 1, display: "flex", padding: "8px" }}>
          <textarea
            style={{
              flex: 1,
              width: "100%",
              height: "100%",
              background: "transparent",
              border: "none",
              color: "#eee",
              resize: "none",
              outline: "none",
              padding: 0,
              margin: 0,
              fontSize: "11px",
              lineHeight: "1.4",
            }}
            value={data.text ?? ""}
            onChange={(e) => data.updateNodeData?.(id, { text: e.target.value })}
            placeholder="Write annotation..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
      </div>
    </>
  );
}
