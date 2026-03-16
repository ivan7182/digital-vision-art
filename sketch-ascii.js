const canvasSketch = require('canvas-sketch');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  fps: 30
};

let video;
let previousSmallFrame = null;
let trackedBlobs = [];

const asciiChars = " .'`^,:;i1|/tfLCG08@カキクケコ";
const params = {
  motionThreshold: 45,
  minBlobCells: 18,
  cellSize: 10,
  neighborDist: 2,

  asciiScale: 8,
  asciiColor: "#00ff88",
  asciiOpacity: 0.95,

  boxPadding: 18,
  blobSmooth: 0.22,
  blobHoldFrames: 8,

  thermalOpacity: 1,
  showBoxes: true,
  boxColor: "#00ff88",
  boxLineWidth: 2,

  bgAlpha: 0.22
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function paletteThermal(brightness) {
  const t = brightness / 255;

  let r = 0;
  let g = 0;
  let b = 0;

  if (t < 0.2) {
    const k = t / 0.2;
    r = 0;
    g = 0;
    b = lerp(40, 255, k);
  } else if (t < 0.4) {
    const k = (t - 0.2) / 0.2;
    r = 0;
    g = lerp(0, 255, k);
    b = 255;
  } else if (t < 0.6) {
    const k = (t - 0.4) / 0.2;
    r = 0;
    g = 255;
    b = lerp(255, 0, k);
  } else if (t < 0.8) {
    const k = (t - 0.6) / 0.2;
    r = lerp(0, 255, k);
    g = 255;
    b = 0;
  } else {
    const k = (t - 0.8) / 0.2;
    r = 255;
    g = lerp(255, 255, k);
    b = lerp(0, 255, k * 0.5);
  }

  return [r, g, b];
}

function intersectArea(a, b) {
  const minX = Math.max(a.minX, b.minX);
  const minY = Math.max(a.minY, b.minY);
  const maxX = Math.min(a.maxX, b.maxX);
  const maxY = Math.min(a.maxY, b.maxY);
  const w = Math.max(0, maxX - minX);
  const h = Math.max(0, maxY - minY);
  return w * h;
}

function boxArea(b) {
  return Math.max(0, b.maxX - b.minX) * Math.max(0, b.maxY - b.minY);
}

const sketch = ({ width, height }) => {
  const pane = new Pane();

  const motionFolder = pane.addFolder({ title: 'Motion / Blob' });
  motionFolder.addInput(params, 'motionThreshold', { min: 0, max: 200, step: 1 });
  motionFolder.addInput(params, 'minBlobCells', { min: 1, max: 100, step: 1 });
  motionFolder.addInput(params, 'cellSize', { min: 4, max: 24, step: 1 });
  motionFolder.addInput(params, 'neighborDist', { min: 1, max: 5, step: 1 });
  motionFolder.addInput(params, 'boxPadding', { min: 0, max: 50, step: 1 });
  motionFolder.addInput(params, 'blobSmooth', { min: 0.01, max: 1, step: 0.01 });
  motionFolder.addInput(params, 'blobHoldFrames', { min: 0, max: 30, step: 1 });

  const asciiFolder = pane.addFolder({ title: 'ASCII' });
  asciiFolder.addInput(params, 'asciiScale', { min: 4, max: 20, step: 1 });
  asciiFolder.addInput(params, 'asciiColor');
  asciiFolder.addInput(params, 'asciiOpacity', { min: 0, max: 1, step: 0.01 });

  const thermalFolder = pane.addFolder({ title: 'Thermal / Box' });
  thermalFolder.addInput(params, 'thermalOpacity', { min: 0, max: 1, step: 0.01 });
  thermalFolder.addInput(params, 'showBoxes');
  thermalFolder.addInput(params, 'boxColor');
  thermalFolder.addInput(params, 'boxLineWidth', { min: 1, max: 8, step: 1 });

  pane.addInput(params, 'bgAlpha', { min: 0, max: 1, step: 0.01 });

  const offCanvas = document.createElement('canvas');
  offCanvas.width = width;
  offCanvas.height = height;
  const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

  const smallCanvas = document.createElement('canvas');
  const smallCtx = smallCanvas.getContext('2d', { willReadFrequently: true });

  function computeMotionBlobs(frameData) {
    const cell = params.cellSize;
    const smallW = Math.max(1, Math.floor(width / cell));
    const smallH = Math.max(1, Math.floor(height / cell));

    if (smallCanvas.width !== smallW || smallCanvas.height !== smallH) {
      smallCanvas.width = smallW;
      smallCanvas.height = smallH;
      previousSmallFrame = null;
    }

    smallCtx.drawImage(offCanvas, 0, 0, smallW, smallH);
    const smallFrame = smallCtx.getImageData(0, 0, smallW, smallH).data;

    if (!previousSmallFrame) {
      previousSmallFrame = new Uint8ClampedArray(smallFrame);
      return [];
    }

    const activeCells = [];

    for (let i = 0; i < smallFrame.length; i += 4) {
      const motion =
        Math.abs(smallFrame[i] - previousSmallFrame[i]) +
        Math.abs(smallFrame[i + 1] - previousSmallFrame[i + 1]) +
        Math.abs(smallFrame[i + 2] - previousSmallFrame[i + 2]);

      if (motion > params.motionThreshold) {
        const idx = i / 4;
        activeCells.push({
          x: idx % smallW,
          y: Math.floor(idx / smallW)
        });
      }
    }

    previousSmallFrame = new Uint8ClampedArray(smallFrame);

    const groups = [];

    activeCells.forEach((p) => {
      let added = false;

      for (const g of groups) {
        if (
          p.x >= g.minX - params.neighborDist &&
          p.x <= g.maxX + params.neighborDist &&
          p.y >= g.minY - params.neighborDist &&
          p.y <= g.maxY + params.neighborDist
        ) {
          g.minX = Math.min(g.minX, p.x);
          g.maxX = Math.max(g.maxX, p.x);
          g.minY = Math.min(g.minY, p.y);
          g.maxY = Math.max(g.maxY, p.y);
          g.size++;
          added = true;
          break;
        }
      }

      if (!added) {
        groups.push({
          minX: p.x,
          maxX: p.x,
          minY: p.y,
          maxY: p.y,
          size: 1
        });
      }
    });

    const blobs = groups
      .filter((g) => g.size >= params.minBlobCells)
      .map((g) => {
        const minX = clamp(g.minX * cell - params.boxPadding, 0, width);
        const minY = clamp(g.minY * cell - params.boxPadding, 0, height);
        const maxX = clamp((g.maxX + 1) * cell + params.boxPadding, 0, width);
        const maxY = clamp((g.maxY + 1) * cell + params.boxPadding, 0, height);

        return {
          minX,
          minY,
          maxX,
          maxY,
          life: params.blobHoldFrames
        };
      });

    return blobs;
  }

  function smoothTrackedBlobs(newBlobs) {
    const nextTracked = [];
    const usedOld = new Set();

    for (const nb of newBlobs) {
      let bestIndex = -1;
      let bestScore = 0;

      for (let i = 0; i < trackedBlobs.length; i++) {
        if (usedOld.has(i)) continue;

        const old = trackedBlobs[i];
        const overlap = intersectArea(nb, old);
        const score = overlap / Math.max(1, Math.min(boxArea(nb), boxArea(old)));

        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      if (bestIndex >= 0) {
        const old = trackedBlobs[bestIndex];
        usedOld.add(bestIndex);

        nextTracked.push({
          minX: lerp(old.minX, nb.minX, params.blobSmooth),
          minY: lerp(old.minY, nb.minY, params.blobSmooth),
          maxX: lerp(old.maxX, nb.maxX, params.blobSmooth),
          maxY: lerp(old.maxY, nb.maxY, params.blobSmooth),
          life: params.blobHoldFrames
        });
      } else {
        nextTracked.push({ ...nb });
      }
    }

    trackedBlobs.forEach((old, i) => {
      if (usedOld.has(i)) return;
      if (old.life > 0) {
        nextTracked.push({
          ...old,
          life: old.life - 1
        });
      }
    });

    trackedBlobs = nextTracked;
  }

  function pointInsideBlob(x, y, blobs) {
    for (const b of blobs) {
      if (x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY) {
        return true;
      }
    }
    return false;
  }

  return ({ context }) => {
    if (!video || video.readyState < 2) return;

    offCtx.drawImage(video, 0, 0, width, height);
    const frame = offCtx.getImageData(0, 0, width, height);
    const data = frame.data;

    const newBlobs = computeMotionBlobs(data);
    smoothTrackedBlobs(newBlobs);

    context.fillStyle = `rgba(0,0,0,${params.bgAlpha})`;
    context.fillRect(0, 0, width, height);

    context.globalAlpha = params.asciiOpacity;
    context.fillStyle = params.asciiColor;
    context.font = `${params.asciiScale}px monospace`;
    context.textBaseline = 'top';

    for (let y = 0; y < height; y += params.asciiScale) {
      for (let x = 0; x < width; x += params.asciiScale) {
        if (pointInsideBlob(x, y, trackedBlobs)) continue;

        const i = (y * width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;

        const charIndex = Math.floor((brightness / 255) * (asciiChars.length - 1));
        const char = asciiChars[charIndex];

        context.fillText(char, x, y);
      }
    }

    context.globalAlpha = params.thermalOpacity;

    trackedBlobs.forEach((blob) => {
      const minX = Math.floor(blob.minX);
      const minY = Math.floor(blob.minY);
      const w = Math.floor(blob.maxX - blob.minX);
      const h = Math.floor(blob.maxY - blob.minY);

      if (w <= 1 || h <= 1) return;

      const imageData = offCtx.getImageData(minX, minY, w, h);
      const pixels = imageData.data;

      for (let i = 0; i < pixels.length; i += 4) {
        const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        const [tr, tg, tb] = paletteThermal(brightness);

        pixels[i] = tr;
        pixels[i + 1] = tg;
        pixels[i + 2] = tb;
      }

      context.putImageData(imageData, minX, minY);

      if (params.showBoxes) {
        context.globalAlpha = 1;
        context.strokeStyle = params.boxColor;
        context.lineWidth = params.boxLineWidth;
        context.strokeRect(minX, minY, w, h);
        context.globalAlpha = params.thermalOpacity;
      }
    });

    context.globalAlpha = 1;
  };
};

const setupVideo = async () => {
  video = document.createElement('video');
  video.src = './video/kuda2.mp4';
  video.loop = true;
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  return new Promise((resolve) => {
    video.onloadeddata = () => {
      video.play();
      resolve(video);
    };
  });
};

const start = async () => {
  await setupVideo();
  await canvasSketch(sketch, settings);
};

start();