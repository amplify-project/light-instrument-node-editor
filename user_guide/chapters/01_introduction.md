# Introduction

Welcome to the Light Instruments project. This guide will help you understand
how to use and configure the various instruments and how to use the node editor
to design lighting setups and have them light up the LED strips.

## Overview

The project consists of several ESP32-S3 based instruments that communicate
wirelessly via ESP-NOW, LED controllers that also communicate wirelessly, a
receiver that plugs into your computer and a node-based editor to process the
data coming from the instruments and transform it into commands for the LED
controllers.

## The Instruments

At this point in time, there exist the following instruments:

- *Key Instrument*: An instrument containing several buttons, which when pressed
  or released send a single signal about the button status to the receiver.
- *Maracas*: Sends a single signal to the receiver when movement around a
  specific axis is detected.
- *IMU Maracas*: Comes in the same form factor as the Maracas and works in the
  same fashion, but uses an IMU (inertial motion unit) to detect activity. This
  offers activity detection around any axis and better noise resistance.
- *Rainstick*: Contains an internal infrared barrier, which detects the passing
  of the percussive media inside the instrument through it and sends a
  corresponding signal to the receiver.
- *Touch Instrument*: Contains three touch surfaces, which when approached or
  touched by a hand sends a continuous signal identifying the amount of touch
  detected. Depending on initial calibration, the surfaces may not only react to
  touch, but also proximity of a hand.
- *Percussion Instrument*: The percussion instrument detects vibration using a
  piezoelectric element. When the surface of the instrument is struck using a
  mallet or hand and the detector detects the resulting vibration, a continuous
  signal is sent to the receiver. The sensitivity can be tuned by adjusting the
  100 kOhm potentiometer on the circuit board.
