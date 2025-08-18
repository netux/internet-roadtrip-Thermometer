import { createEffect } from 'solid-js';
import { settings } from './settings';
import { zeroOne } from './util';

export const temperatureCanvasGradientCtx = document
  .createElement('canvas')
  .getContext('2d');

export function redrawTemperatureCanvas() {
  temperatureCanvasGradientCtx.canvas.width = Math.abs(
    settings().temperatureGradientMaxCelsius -
      settings().temperatureGradientMinCelsius,
  );
  temperatureCanvasGradientCtx.canvas.height = 1;

  const temperatureCanvasGradient =
    temperatureCanvasGradientCtx.createLinearGradient(
      0,
      0,
      temperatureCanvasGradientCtx.canvas.width,
      0,
    );
  for (const { percent, color } of settings().temperatureGradient) {
    temperatureCanvasGradient.addColorStop(percent, color);
  }

  temperatureCanvasGradientCtx.fillStyle = temperatureCanvasGradient;
  temperatureCanvasGradientCtx.fillRect(
    0,
    0,
    temperatureCanvasGradientCtx.canvas.width,
    temperatureCanvasGradientCtx.canvas.height,
  );
}

createEffect(() => {
  if (settings()?.temperatureGradient != null) {
    redrawTemperatureCanvas();
  }
});

export function sampleTemperatureGradient(temperatureCelsius: number) {
  const percent = zeroOne(
    temperatureCelsius,
    settings().temperatureGradientMinCelsius,
    settings().temperatureGradientMaxCelsius,
  );
  const clampedPercent = Math.max(0, Math.min(percent, 1));

  const x = clampedPercent * temperatureCanvasGradientCtx.canvas.width - 1;

  const rgb = temperatureCanvasGradientCtx
    .getImageData(x, 0, 1, 1)
    .data.slice(0, 3);
  return '#' + [...rgb].map((c) => c.toString(16).padStart(2, '0')).join('');
}

export const temperatureAtGradient = (x: number) =>
  settings().temperatureGradientMinCelsius +
  x *
    (settings().temperatureGradientMaxCelsius -
      settings().temperatureGradientMinCelsius);
