# Digital Vision Art

Generative computer vision sketch that combines **motion detection**, **ASCII rendering**, and **thermal blob visualization** using **canvas-sketch** and **Tweakpane**.

The system analyzes motion from a video source, renders the background as dynamic ASCII characters, and highlights moving objects with a colorful thermal effect.

---

## Preview

Example output:

* ASCII background reacts to brightness
* Moving objects are detected with motion tracking
* Detected regions are rendered with a **thermal visualization**
* Bounding boxes follow the moving object
## Features

• Motion detection from video frames
• Blob tracking of moving regions
• ASCII background rendering
• Thermal color visualization inside motion blobs
• Live parameter control using **Tweakpane**
• Smooth blob tracking and stabilization

---

## Technologies Used

* **canvas-sketch**
* **Tweakpane**
* **JavaScript**
* **Motion Detection Algorithm**

## Preview

<p center="center">
  <img src="hasil/hourses.gif" width="700"/>
</p>

**MP4 Preview:** [Watch the video](hasil/rain-ascii.mp4)


## Installation

Install dependencies:

```bash
npm install
```

Install required packages:

```bash
npm install canvas-sketch tweakpane@3
```

---

## Run the Sketch

Start the sketch using:

```bash
npx canvas-sketch sketch.js --open
```

This will open the sketch in your browser.

---

## Controls (Tweakpane)

The interface allows real-time control of parameters:

### Motion Detection

* `motionThreshold` — sensitivity of motion detection
* `minBlobCells` — minimum size of motion blob
* `cellSize` — detection resolution
* `neighborDist` — grouping distance

### ASCII Rendering

* `asciiScale` — character size
* `asciiColor` — ASCII color
* `asciiOpacity` — ASCII transparency

### Thermal Visualization

* `thermalOpacity` — thermal effect intensity
* `showBoxes` — toggle bounding boxes
* `boxColor` — color of bounding box
* `boxLineWidth` — width of bounding box line

---

## Project Structure

```
digital-vision-art
├─ hasil
│   └─ hourses.gif
│   └─ rain-ascii.mp4
├─ video
│   └─ kuda2.mp4
│   └─ kuda.mp4
├─ ascii-rain-webcam.js
├─ sketch-ascii.js
├─ package.json
└─ README.md
```

---

## How It Works

1. Video frames are captured and analyzed for motion.
2. Motion pixels are grouped into **blobs**.
3. Blobs are stabilized and tracked across frames.
4. Background is rendered as **ASCII characters**.
5. Motion blobs are rendered with a **thermal color palette**.
6. Optional bounding boxes visualize the detected regions.

---

## Customization

You can modify:

* ASCII character set
* Thermal color palette
* Motion sensitivity
* Blob smoothing
* Rendering resolution

This makes the sketch suitable for **creative coding experiments**, **interactive visuals**, or **generative art installations**.

---


Creative coding experiment using **Canvas Sketch**.
