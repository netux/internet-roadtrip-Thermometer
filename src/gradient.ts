import { createEffect, createSignal } from 'solid-js';
import { settings } from './settings';
import { zeroOne } from './util';

const temperatureGradientCanvasCtx = document
  .createElement('canvas')
  .getContext('2d', {
    willReadFrequently: true,
  });

const temperatureGradientCanvas = temperatureGradientCanvasCtx.canvas;
export { temperatureGradientCanvas };

const [temperatureGradientHasRedrawn, setTemperatureGradientHasRedrawn] =
  createSignal(false);

const pingTemperatureGradientHasRedrawn = () => {
  // Abusing Solid's signal system since 2025
  setTemperatureGradientHasRedrawn(true);
  setTemperatureGradientHasRedrawn(false);
};

export { temperatureGradientHasRedrawn };

const [temperatureGradientArray, setTemperatureGradientArray] =
  createSignal<ImageDataArray | null>(null);

createEffect(() => {
  if (temperatureGradientArray()) {
    pingTemperatureGradientHasRedrawn();
  }
});

export function redrawTemperatureCanvas() {
  const canvasWidth = Math.abs(
    settings().temperatureGradientMaxCelsius -
      settings().temperatureGradientMinCelsius,
  );

  temperatureGradientCanvasCtx.canvas.width = canvasWidth;
  temperatureGradientCanvasCtx.canvas.height = 1;

  const temperatureCanvasGradient =
    temperatureGradientCanvasCtx.createLinearGradient(
      0,
      0,
      temperatureGradientCanvasCtx.canvas.width,
      0,
    );
  for (const { percent, color } of settings().temperatureGradient) {
    temperatureCanvasGradient.addColorStop(percent, color);
  }

  temperatureGradientCanvasCtx.fillStyle = temperatureCanvasGradient;
  temperatureGradientCanvasCtx.fillRect(
    0,
    0,
    temperatureGradientCanvasCtx.canvas.width,
    temperatureGradientCanvasCtx.canvas.height,
  );
}

createEffect(() => {
  if (settings()?.temperatureGradient != null) {
    redrawTemperatureCanvas();

    setTemperatureGradientArray(
      temperatureGradientCanvasCtx.getImageData(
        0,
        0,
        temperatureGradientCanvasCtx.canvas.width,
        1,
      ).data,
    );
  }
});

export function sampleTemperatureGradient(temperatureCelsius: number) {
  const percent = zeroOne(
    temperatureCelsius,
    settings().temperatureGradientMinCelsius,
    settings().temperatureGradientMaxCelsius,
  );
  const clampedPercent = Math.max(0, Math.min(percent, 1));

  const x = Math.floor(
    clampedPercent * (temperatureGradientCanvasCtx.canvas.width - 1),
  );
  const i = x * 4;
  const rgb = temperatureGradientArray().slice(i, i + 3);
  return '#' + [...rgb].map((c) => c.toString(16).padStart(2, '0')).join('');
}

export const temperatureAtGradient = (x: number) =>
  settings().temperatureGradientMinCelsius +
  x *
    (settings().temperatureGradientMaxCelsius -
      settings().temperatureGradientMinCelsius);
