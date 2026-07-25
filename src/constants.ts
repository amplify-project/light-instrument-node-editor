export const AVAILABLE_COMMANDS: Record<string, string> = {
  "set": "r,g,b,brightness",
  "setColor": "r,g,b",
  "setBrightness": "brightness",
  "setLED": "r,g,b,offset,numleds",
  "stop": "None",
  "rainbow": "deltaHue (optional)",
  "glitter": "r,g,b,duration",
  "pulse": "r,g,b,attack,decay,sustain,release",
  "comet": "r,g,b,speed",
  "breathe": "r,g,b,bpm",
  "fire": "r,g,b,intensity",
};
