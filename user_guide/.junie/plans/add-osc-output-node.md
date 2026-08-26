---
sessionId: session-260826-025330-lcro
---

# Requirements Balancing

### Overview & Goals
The objective is to add a new `OSC Output` node that allows the application to send messages to other software/hardware using the Open Sound Control (OSC) protocol over UDP. This expands the interoperability of the instrument setup.

### Scope
- **OSC Output Node**: A sink node that takes incoming messages and sends them as OSC packets.
- **Backend Support**: A new Tauri command to handle UDP communication, as browsers do not support UDP directly.
- **Replacement Logic**: Support for injecting data from the flow into OSC messages via the `#` placeholder.

### Functional Requirements
- The node must have three configuration fields: `Host:Port`, `OSC Pattern`, and `Value`.
- The `Value` field supports the `#` placeholder, which is replaced by the `value` property of the incoming message object.
- When an incoming message is received, an OSC message is sent immediately to the specified `Host:Port`.
- The node should provide feedback on the last sent message and connection/parsing errors.
- Configuration (Host, Pattern, Value) must be persisted in `.lns` files.

# Technical Design Balancing

### Current Implementation
The application uses a React-based node editor (@xyflow/react) with a Tauri backend. Output nodes like `Serial Output` and `Redis Output` use `invoke` to call Rust commands for actual data transmission.

### Proposed Changes

#### 1. Backend: OSC Command (`src-tauri/src/lib.rs`)
A new command will be added to handle OSC transmission using the `rosc` crate.
```rust
#[tauri::command]
fn write_osc(host_port: String, address: String, value: String) -> Result<(), String> {
    let socket = std::net::UdpSocket::bind("0.0.0.0:0").map_err(|e| e.to_string())?;
    
    // Intelligently parse value to use appropriate OSC types
    let osc_value = if let Ok(f) = value.parse::<f32>() {
        rosc::OscType::Float(f)
    } else if let Ok(i) = value.parse::<i32>() {
        rosc::OscType::Int(i)
    } else {
        rosc::OscType::String(value)
    };

    let msg = rosc::OscPacket::Message(rosc::OscMessage {
        addr: address,
        args: vec![osc_value],
    });

    let packet = rosc::encoder::encode(&msg).map_err(|e| e.to_string())?;
    socket.send_to(&packet, &host_port).map_err(|e| e.to_string())?;
    Ok(())
}
```

#### 2. Frontend: OSCOutputNode (`src/components/nodes/io/OSCOutputNode.tsx`)
The node will follow the existing pattern for output nodes:
- **Registration**: Uses `data.registerConsumer` to listen for inputs.
- **Processing**: Replaces `#` with `incoming.value`.
- **Transmission**: Calls `invoke("write_osc", ...)` with the processed data.

#### 3. Integration
- **Category**: Added to "Output" in the node search menu.
- **Styling**: Uses the Purple header color (`#a246ff`), consistent with `Command`, `Script`, and `Redis Output` nodes.

### Architecture Diagram
```mermaid
graph LR
    Input[Incoming Signal] -->|onData| OSCNode[OSC Output Node]
    OSCNode -->|invoke: write_osc| Rust[Tauri Backend]
    Rust -->|UDP| Network[OSC Target / Network]
```

# Delivery Steps

### ✓ Step 1: Implement OSC Backend Command in Tauri
Add `rosc` to `src-tauri/Cargo.toml` and implement the `write_osc` command in `src-tauri/src/lib.rs`.

- Add `rosc = "0.10"` dependency.
- Create `write_osc(host_port: String, address: String, value: String)` Tauri command.
- Use `std::net::UdpSocket` to send the encoded OSC packet.
- Attempt to parse `value` as `f32` or `i32` before falling back to `String` for the OSC argument.
- Register the command in `tauri::generate_handler!`.

### ✓ Step 2: Create OSCOutputNode Component
Create the `OSCOutputNode` component to handle UI interaction and data processing.

- Create `src/components/nodes/io/OSCOutputNode.tsx`.
- Implement a target handle (`Handle type="target"`) for incoming messages.
- Add text inputs for "Host:Port", "OSC Pattern", and "Value".
- Implement the placeholder replacement logic: `String(value).replace(/#/g, incoming.value)`.
- Use `data.registerConsumer` to capture incoming messages and trigger `invoke("write_osc", ...)`.
- Add a status display showing the last sent OSC message and any errors.

### ✓ Step 3: Register OSC Node and Update UI/Styles
Register the new node in the main application and update search/styles.

- Import and add `oscOutput` to `nodeTypes` in `src/App.tsx`.
- Add `oscOutput` to `ALLOWS_MULTI_INPUT` in `src/App.tsx`.
- Add `OSC Output` to the "Output" category in `src/components/NodeSearch.tsx`.
- Add styling for `.osc-output-node .node-header` in `src/App.css` (Purple theme: `#a246ff`).