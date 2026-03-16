# ASCII Motion Thermal

Generative computer vision sketch that combines **motion detection**, **ASCII rendering**, and **thermal blob visualization** using **canvas-sketch** and **Tweakpane**.

The system analyzes motion from a video source, renders the background as dynamic ASCII characters, and highlights moving objects with a colorful thermal effect.

---

## Preview

<p center="center">
  <img src="preview.gif" width="700"/>
</p>

Full video preview: [Watch MP4](hasil/rain-ascii.mp4)

Example output:

- ASCII background reacts to brightness
- Moving objects are detected with motion tracking
- Detected regions are rendered with a **thermal visualization**
- Bounding boxes follow the moving object

---

## Features

- Motion detection from video frames
- Blob tracking of moving regions
- ASCII background rendering
- Thermal color visualization inside motion blobs
- Live parameter control using **Tweakpane**
- Smooth blob tracking and stabilization

---

## Technologies Used

- **canvas-sketch**
- **Tweakpane**
- **HTML5 Canvas**
- **JavaScript**
- **Motion Detection Algorithm**

---

## Installation

Install dependencies:

```bash
npm install