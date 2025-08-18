import { createSignal } from 'solid-js';
import { TemperatureUnits } from './constants';
import { zeroOne } from './util';

/* #region Widget Position */
export const DEFAULT_WIDGET_POSITION = {
  x: 0.5,
  y: 0.5,
};
/* #endregion Overlay Position */

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
  widgetPosition: { x: number; y: number };
  temperatureUnit: TemperatureUnits;
  temperatureGradient: TemperatureColorStop[];
  temperatureGradientMinCelsius: number;
  temperatureGradientMaxCelsius: number;
}

const [settings, setSettings] = createSignal<Settings>({
  widgetPosition: DEFAULT_WIDGET_POSITION,
  temperatureUnit: 'celsius',
  ...getDefaultTemperatureGradientSettings(),
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
    type WidgetPositionType =
      | Settings['widgetPosition']
      | null
      | typeof noValue;

    const hasWidgetPositionValue =
      (await GM.getValue<WidgetPositionType>(
        'widgetPosition' as keyof Settings,
        noValue,
      )) === noValue;
    const oldOverlayPositionValue = await GM.getValue<WidgetPositionType>(
      'overlayPosition',
      noValue,
    );
    if (!hasWidgetPositionValue && oldOverlayPositionValue !== noValue) {
      newSettings.widgetPosition = oldOverlayPositionValue;
      await GM.deleteValue('overlayPosition');
    }
  }

  // Migration from <=1.2.2, when the widget position was null by default
  if (newSettings.widgetPosition == null) {
    newSettings.widgetPosition = DEFAULT_WIDGET_POSITION;
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
