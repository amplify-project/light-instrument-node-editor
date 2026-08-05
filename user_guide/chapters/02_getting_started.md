# Getting Started

First, plug the receiver into your computer using a USB cable. Then, you can
start setting up the instruments and the LED controllers.

## Connecting the Instruments

The instruments are powered by 1000 mAh Lithium cells. Open the battery
compartments, locate the battery and battery connector. Plug the battery into
the connector to activate it. The *Maracas* and *IMU Maracas* have a blue power
switch located on the circuit port. In this case, the battery can remain plugged
in at all times and the instrument can be turned on or off using the switch.

Now, observe the circuit board. An orange LED should blink twice immediately
after gaining power. This signifies the start of the internal setup process.
After at most 10 seconds, the same orange LED should turn on permanently,
indicating that the instrument successfully discovered the receiver and is ready
to transmit data. If the LED does not turn on, verify that the receiver is
plugged into a USB port and the two are within wireless communication range.
The communication range should be at about 200m with clear single of sight, but
might drop to 20-40m with obstacles an in indoor environments. Note that
communication efficiency is also affected in areas with increased wireless
(namely WiFi) activity.

*Note about the touch instrument*: During boot, the touch instrument goes
through a calibration procedure, adjusting the sensitivity of the touch surfaces
based on environmental factors. Thus, when plugging in the instrument, try and
avoid getting close to the touch surfaces with your hands or any other parts as
this will influence the calibration procedure and lead to erroneous baseline
calibration, affecting accurate touch detection during operation.

## Connecting the LED Controllers

The setup procedure for the LED controllers is largely the same as for the
instruments. The controllers can be either powered through the USB-C port or
the 5V screw terminals on the back of the circuit board. When using the screw
terminals, verify correct polarity and voltage before connecting to power.

Before connecting to power, also make sure the desired number of LED strips are
connected to the four LED strip ports on the circuit board.

Analogous to the instruments, the onboard orange status LED will blink twice to
indicate the start of the boot process. Then, after at most ten seconds, the LED
will turn on permanently to indicate successful connection to the receiver. If
this is not the case, make sure the receiver is plugged in and within wireless
communication range.

## Setting up the Node Editor

In order to read data from the instruments and design your own light setups,
to be displayed using the LED controllers, after plugging the receiver into
your computer, start the *AMPLIFY Light Instrument Editor*. In the default
setup, you will see two nodes on the main canvas: *Serial Input* and *Serial Output*.

To get started, in the *Serial Input* node, select the name of the receiver from
the dropdown and press *Connect*. On macOS this will be something like
`/dev/cu.usbmodem101`, while on Windows it will be something like `COM1`. Upon
successful connection, the *Serial Output* node should display the string
`Connected`.

For a quick initial test of the LED controllers, find the command bar at the
bottom of the window. From the command dropdown select the command `rainbow` and
hit the *Send* button. Now all LED strips should display an animated rainbow
pattern. Select the command `stop` and hit *Send* to stop the animation.

You can also verify presence and active communication with the controllers and
instruments by locating the activity panel in the top left. This will display
the names of all devices which the receiver was able to communicate, separated
between instruments and LED controllers. Note that it might take a few seconds
for this panel to be displayed. Names of devices from which no data was received
recently will slowly fade out.
