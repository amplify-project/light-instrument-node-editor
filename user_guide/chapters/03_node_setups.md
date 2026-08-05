# Node Setups

## Concepts

The Light Instrument Editor uses a node-based interface to design lighting
behaviors. Instead of writing code, you create a "node setup" (also known as a
graph or patch) by placing functional blocks on a canvas and connecting them
with lines.

Data flows from left to right: it starts at an **Input** node (like the physical
serial port or a file simulation), passes through various **Processing** or
**Math & Logic** nodes that transform the signals, and finally reaches an
**Output** node which sends commands to your LED controllers or logs data to a
file. This visual approach allows you to quickly experiment with different
sensor-to-light mappings without needing to recompile firmware.

## Setups for Debugging

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
