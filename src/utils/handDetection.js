import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

let handsInstance = null;
let cameraInstance = null;

export const initializeHands = (videoElement, onResults) => {
  if (handsInstance) return handsInstance;

  handsInstance = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  handsInstance.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  handsInstance.onResults(onResults);

  cameraInstance = new Camera(videoElement, {
    onFrame: async () => {
      await handsInstance.send({ image: videoElement });
    },
    width: 1280,
    height: 720,
  });

  cameraInstance.start();

  return handsInstance;
};

export const closeHands = () => {
  if (cameraInstance) {
    cameraInstance.stop();
    cameraInstance = null;
  }
  if (handsInstance) {
    handsInstance.close();
    handsInstance = null;
  }
};

export const analyzeHandGestures = (results) => {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    return { handCount: 0, openPalms: 0, pointingGestures: 0, handActivity: 0 };
  }

  const landmarks = results.multiHandLandmarks;
  let openPalms = 0;
  let pointingGestures = 0;
  let totalHandMotion = 0;

  for (let i = 0; i < landmarks.length; i++) {
    const hand = landmarks[i];

    // Detectar palma abierta (dedos extendidos)
    const fingerTips = [4, 8, 12, 16, 20]; // Índices de puntas de dedos
    const fingerBases = [2, 5, 9, 13, 17]; // Bases de dedos

    let extendedFingers = 0;
    for (let j = 0; j < fingerTips.length; j++) {
      const tipY = hand[fingerTips[j]].y;
      const baseY = hand[fingerBases[j]].y;
      if (tipY < baseY) extendedFingers++;
    }

    if (extendedFingers >= 4) {
      openPalms++;
    }

    // Detectar gesto de apuntar (índice extendido, otros dedos cerrados)
    const indexTipY = hand[8].y;
    const indexBaseY = hand[5].y;
    const middleTipY = hand[12].y;
    const middleBaseY = hand[9].y;

    if (indexTipY < indexBaseY && middleTipY > middleBaseY) {
      pointingGestures++;
    }

    // Calcular actividad de manos (variación de posición)
    const wristX = hand[0].x;
    const wristY = hand[0].y;
    totalHandMotion += Math.abs(wristX) + Math.abs(wristY);
  }

  return {
    handCount: landmarks.length,
    openPalms,
    pointingGestures,
    handActivity: Math.round(totalHandMotion * 100),
  };
};

export const drawHands = (canvas, results) => {
  if (!results.multiHandLandmarks) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#00ff00';

  const FINGER_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [5, 6], [6, 7], [7, 8],
    [9, 10], [10, 11], [11, 12],
    [13, 14], [14, 15], [15, 16],
    [17, 18], [18, 19], [19, 20],
    [0, 5], [5, 9], [9, 13], [13, 17], [0, 17],
  ];

  for (const landmarks of results.multiHandLandmarks) {
    // Dibujar conexiones
    for (const [start, end] of FINGER_CONNECTIONS) {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      ctx.beginPath();
      ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
      ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
      ctx.stroke();
    }

    // Dibujar puntos
    for (const landmark of landmarks) {
      ctx.beginPath();
      ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
};
