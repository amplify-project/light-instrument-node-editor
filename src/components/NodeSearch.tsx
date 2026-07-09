import React, { useState, useEffect, useRef } from "react";

interface NodeOption {
  type: string;
  label: string;
}

const nodeOptions: NodeOption[] = [
  { type: "deviceFilter", label: "Device Filter" },
  { type: "peakDetection", label: "Peak Detection" },
  { type: "command", label: "Command" },
  { type: "graph", label: "Graph" },
  { type: "compare", label: "Compare" },
  { type: "boolean", label: "Boolean" },
];

interface NodeSearchProps {
  onSelect: (type: string) => void;
  onClose: () => void;
  x: number;
  y: number;
}

export function NodeSearch({ onSelect, onClose, x, y }: NodeSearchProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = nodeOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();

    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev + 1) % filteredOptions.length);
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (e.key === "Enter") {
      if (filteredOptions[selectedIndex]) {
        onSelect(filteredOptions[selectedIndex].type);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (filteredOptions.length === 0 && search === "") return null;

  return (
    <div
      className="node-search-container"
      style={{ left: x, top: y }}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Search nodes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(onClose, 100)} // Small delay to allow onMouseDown on items
      />

      <div className="node-search-results">
        {filteredOptions.map((opt, index) => (
          <div
            key={opt.type}
            className={`node-search-item ${index === selectedIndex ? "selected" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(opt.type);
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            {opt.label}
          </div>
        ))}

        {filteredOptions.length === 0 && (
          <div className="node-search-item" style={{ fontStyle: "italic", cursor: "default" }}>
            No results
          </div>
        )}
      </div>
    </div>
  );
}
