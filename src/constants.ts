export const MOD_NAME = 'Thermometer';

export const MOD_DOM_SAFE_PREFIX = 'thermometer-';

export const MOD_LOG_PREFIX = `[${MOD_NAME}]`;

export const RAD_TO_DEG = 180 / Math.PI;

export const IS_MOBILE_MEDIA_QUERY = 'screen and (max-width: 900px)';

export interface TemperatureUnit {
  label: string;
  unit: string;
  fromCelsius: (celsius: number) => number;
  toCelsius: (temperature: number) => number;
}
export const TEMPERATURE_UNITS = {
  celsius: {
    label: 'Celsius',
    unit: '°C',
    fromCelsius: (celsius) => celsius,
    toCelsius: (celsius) => celsius,
  },
  fahrenheit: {
    label: 'Fahrenheit',
    unit: '°F',
    fromCelsius: (celsius) => celsius * 1.8 + 32,
    toCelsius: (fahrenheit) => (fahrenheit - 32) / 1.8,
  },
  felsius: {
    label: 'Felsius (xkcd #1923)',
    unit: '°Є',
    fromCelsius: (celsius) => (7 * celsius) / 5 + 16,
    toCelsius: (felsius) => (5 * (felsius - 16)) / 7,
  },
  kelvin: {
    label: 'Kelvin',
    unit: 'K',
    fromCelsius: (celsius) => celsius + 273,
    toCelsius: (kelvin) => kelvin - 273,
  },
} satisfies Record<string, TemperatureUnit>;
export type TemperatureUnits = keyof typeof TEMPERATURE_UNITS;
