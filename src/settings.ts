import { createMemo, createSignal } from 'solid-js';
import { MOD_LOG_PREFIX, TemperatureUnits } from './constants';
import { zeroOne } from './util';

/* #region Widget Position */
export interface XYPosition {
  x: number;
  y: number;
}

export type AnchorPosition =
  | { top: number; left: number }
  | { top: number; right: number }
  | { bottom: number; left: number }
  | { bottom: number; right: number };

export const makeWidgetPositionSetting = ({
  x,
  y,
}: XYPosition): AnchorPosition => {
  const result: Record<string, number> = {};

  if (x < window.innerWidth / 2) {
    result.left = x;
  } else {
    result.right = window.innerWidth - x;
  }
  if (y < window.innerHeight / 2) {
    result.top = y;
  } else {
    result.bottom = window.innerHeight - y;
  }

  return result as AnchorPosition;
};

export const getDefaultWidgetPosition = (): AnchorPosition => ({
  left: Math.round(window.innerWidth / 2),
  top: Math.round(window.innerHeight / 2),
});
/* #endregion Widget Position */

/* #region Default Temperature Gradient */
export const DEFAULT_TEMPERATURE_GRADIENT = [
  { temperatureCelsius: -20, color: '#f5f5f5' },
  { temperatureCelsius: -10, color: '#82cdff' },
  { temperatureCelsius: 0, color: '#0c9eff' },
  { temperatureCelsius: 15, color: '#043add' },
  { temperatureCelsius: 18.5, color: '#c0c23d' },
  { temperatureCelsius: 22.5, color: '#ffd86d' },
  { temperatureCelsius: 27.5, color: '#ffa538' },
  { temperatureCelsius: 32.5, color: '#c92626' },
  { temperatureCelsius: 40, color: '#6a0b39' },
];

export const {
  min: DEFAULT_TEMPERATURE_GRADIENT_MIN_TEMPERATURE,
  max: DEFAULT_TEMPERATURE_GRADIENT_MAX_TEMPERATURE,
} = DEFAULT_TEMPERATURE_GRADIENT.reduce(
  ({ min: previousMin, max: previousMax }, { temperatureCelsius }) => ({
    min: Math.min(temperatureCelsius, previousMin),
    max: Math.max(temperatureCelsius, previousMax),
  }),
  { min: 0, max: 0 },
);

export const getDefaultTemperatureGradientSettings = () => ({
  temperatureGradient: DEFAULT_TEMPERATURE_GRADIENT.map(
    ({ temperatureCelsius, color }) => ({
      percent: zeroOne(
        temperatureCelsius,
        DEFAULT_TEMPERATURE_GRADIENT_MIN_TEMPERATURE,
        DEFAULT_TEMPERATURE_GRADIENT_MAX_TEMPERATURE,
      ),
      color,
    }),
  ),
  temperatureGradientMinCelsius: DEFAULT_TEMPERATURE_GRADIENT_MIN_TEMPERATURE,
  temperatureGradientMaxCelsius: DEFAULT_TEMPERATURE_GRADIENT_MAX_TEMPERATURE,
});
/* #endregion Default Temperature Gradient */

export interface TemperatureColorStop {
  percent: number;
  color: string;
}

export interface Settings {
  widgetPosition?: AnchorPosition;
  showClock: boolean;
  time24Hours: boolean;
  timeIncludeSeconds: boolean;
  showTemperature: boolean;
  temperatureUnit: TemperatureUnits;
  temperatureGradient: TemperatureColorStop[];
  temperatureGradientMinCelsius: number;
  temperatureGradientMaxCelsius: number;
  showRelativeHumidity: boolean;
}

const [settings, setSettings] = createSignal<Settings>({
  widgetPosition: undefined,
  showClock: true,
  time24Hours: true,
  timeIncludeSeconds: false,
  showTemperature: true,
  temperatureUnit: 'celsius',
  ...getDefaultTemperatureGradientSettings(),
  showRelativeHumidity: true,
});

export { settings };

// Load
{
  const newSettings: Settings = { ...settings() };

  for (const key in settings()) {
    newSettings[key] = await GM.getValue(key, newSettings[key]);
  }

  // Migration from <2.0.0, when the widget was refered to as an overlay
  {
    const noValue = Symbol();
    const hasWidgetPositionValue =
      (await GM.getValue<AnchorPosition | typeof noValue>(
        'widgetPosition' as keyof Settings,
        noValue,
      )) === noValue;
    const oldOverlayPositionValue = await GM.getValue<
      XYPosition | typeof noValue
    >('overlayPosition', noValue);
    if (!hasWidgetPositionValue && oldOverlayPositionValue !== noValue) {
      newSettings.widgetPosition = makeWidgetPositionSetting({
        x: oldOverlayPositionValue.x,
        y: oldOverlayPositionValue.y,
      });
      await GM.deleteValue('overlayPosition');
    }
  }

  // Migration from <2.1.0, when the widget position was stored as a percentage
  {
    if (
      newSettings.widgetPosition != null &&
      typeof newSettings.widgetPosition === 'object' &&
      !(
        'left' in newSettings.widgetPosition ||
        'right' in newSettings.widgetPosition
      ) &&
      !(
        'top' in newSettings.widgetPosition ||
        'bottom' in newSettings.widgetPosition
      )
    ) {
      const unknownWidgetPosition: Record<string, unknown> =
        newSettings.widgetPosition;

      if (
        'x' in unknownWidgetPosition &&
        typeof unknownWidgetPosition.x === 'number' &&
        'y' in unknownWidgetPosition &&
        typeof unknownWidgetPosition.y === 'number'
      ) {
        newSettings.widgetPosition = makeWidgetPositionSetting({
          x: unknownWidgetPosition.x * window.innerWidth,
          y: unknownWidgetPosition.y * window.innerHeight,
        });
      } else {
        console.warn(
          MOD_LOG_PREFIX,
          'Corrupt widget position setting detected. Resetting...',
        );
        newSettings.widgetPosition = undefined;
      }
    }
  }

  setSettings(newSettings);
}

// Save
export async function saveSettings(
  change?: Partial<Settings> | ((prevSettings: Settings) => Settings),
) {
  if (typeof change === 'function') {
    setSettings(change);
  } else if (typeof change === 'object') {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...change,
    }));
  }

  const currentSettings = settings();

  for (const key in currentSettings) {
    await GM.setValue(key, currentSettings[key]);
  }
}

export const resolvedWidgetPositionSetting = createMemo((): XYPosition => {
  const anchor = settings().widgetPosition ?? getDefaultWidgetPosition();

  return {
    x: 'left' in anchor ? anchor.left : window.innerWidth - anchor.right,
    y: 'top' in anchor ? anchor.top : window.innerHeight - anchor.bottom,
  };
});
