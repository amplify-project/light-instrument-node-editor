# Node Setups

## Concepts

The Light Instrument Editor uses a node-based interface to design lighting
behaviors. Instead of writing code, you create a "node setup" (also known as a
graph or patch) by placing functional blocks on a canvas and connecting them
with lines.

![A basic node setup showing data flow from a Serial Input node to a Serial Output node via several Processing nodes.](img/basic_setup.png){ width=90% }

Data flows from left to right: it starts at an **Input** node (like the physical
serial port or a file simulation), passes through various **Processing** or
**Math & Logic** nodes that transform the signals, and finally reaches an
**Output** node which sends commands to your LED controllers or logs data to a
file. This visual approach allows you to quickly experiment with different
sensor-to-light mappings without needing to recompile firmware.

### Interacting with the Editor

![The context menu for adding nodes is activated by pressing Shift+A](img/adding_nodes.png){ width=90% }

To build your setup, you can interact with the editor using the following
commands:

- **Adding Nodes**: Press `Shift+A` to open the search menu. Type the name of
  the node you want to add and press `Enter`, or click on the desired node in
  the list.
- **Deleting Nodes**: Click the "×" button in the top-right corner of the node's
  header.
- **Selecting Nodes**: Hold `Shift`, left click and drag your mouse to activate
  marquee selection. Selected nodes can be copied and pasted using `Cmd/Ctrl+C`
  and `Cmd/Ctrl+V`.
- **Creating Connections**: Click and drag from an output handle (the circular
  socket on the right side of a node) to an input handle (on the left side of
  another node).
- **Deleting Connections**: Click on the connection line to select it, then
  press `Backspace` or `Delete` on your keyboard.

You can route the output of any node to the input of as many nodes as required.
Most nodes only accept a single incoming connection. Some nodes, however, accept
multiple inputs, e.g. the *Log* node or the *Serial Output* node. This is
indicated by an elongated input socket.

![The Log node accepts multiple inputs, indicated by an elongated input socket](img/multiple_inputs.png){ width=90% }

You can open existing setups, save the current one or start with a fresh canvas
using the buttons in the menu panel located in the top left of the canvas or
the application menu.

Move the canvas by clicking it with your left mouse button and dragging it around.
In the same fashion, you can move nodes around by clicking and dragging on their
title bar. Zooming can be achieved by scrolling your mouse or using the pinch
to zoom gesture on a trackpad. Alternatively, you can zoom in and out by using
the `+` and `-` buttons in the toolbar located in the bottom left of the canvas.
This toolbar also allows you to zoom the current setup to fit the screen or lock
the entire canvas to prevent modification.

Check the `samples/` directory for a few example setups which show off the basic
features of the node editor.

## Setups for Debugging & Exploration

When building a new setup or troubleshooting a sensor, it can be useful to
visualize the raw data arriving from the instruments. The editor provides two
primary nodes for this purpose:

- **Log Node**: Displays a scrollable history of every data packet received on
  its input, complete with device names, ports, and timestamps. It is useful for
  verifying that a device is sending data at the expected rate.
- **Graph Node**: Renders a real-time line chart of incoming numeric values.
  This is invaluable for visualizing signal noise, verifying calibration and
  tuning thresholds for logic nodes like *Peak Detection* or *Compare*.

A common debugging pattern is to branch your signal and connect it to a *Graph*
or *Log* node in parallel with your main processing logic.

![Debugging setup with all incoming messages being displayed in a Log node and a Graph node displaying the current rate of incoming messages per second through the use of the Rate node](img/debug.png){ width=90% }

## Device Filtering

In a large setup with multiple instruments, the receiver's serial stream will
contain data from many different sources. To prevent signals from interfering
with each other, you can use the **Device Filter** node to direct data streams.

By configuring the *Device* and *Port* fields on this node, you can create a
dedicated stream for a specific sensor. For example, if you only want to react
to the "percussion1" instrument, you would set the device filter to
"percussion1". Only packets matching your filter will be passed through to the
output handle, allowing you to build modular logic for each individual
instrument in your setup.

![Two device filter nodes redirect the data streams in separate paths for the key instrument and the drum instrument, triggering different commands](img/device_filter.png){ width=90% }

## Sending commands

To bridge the gap between sensor data and lighting effects, you use the
**Command** node. This node acts as a translator: when it receives a trigger
signal on its input, it emits a formatted command packet that the LED
controllers understand. Note that the *Serial Output* node only accepts
connections from a *Command* or *Script* node.

In the *Command* node, you can select from a range of animations and static
effects (like `set`, `pulse`, or `rainbow`) defined in the controller firmware.
You can specify a target device and port, or leave them blank to broadcast the
command to all controllers.

To assist with configuration, a **parameter hint** appears below the input field
whenever a command is selected, showing the expected format and required values
(e.g., `r,g,b,speed`). You can enter static values directly into the parameter
field. For dynamic effects, you can use the `#` character as a placeholder; this
character will be automatically replaced by the numeric value of the incoming
signal, allowing sensor intensity to directly control parameters like
brightness, speed, or color.

For testing, commands can be triggered by pressing the *Manual Trigger* button
on the corresponding *Command* node.
