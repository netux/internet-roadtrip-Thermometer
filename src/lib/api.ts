import { GM_fetch } from '../util';

export interface Forecast {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
  };
}

export async function fetchForecast([latitude, longitude]) {
  const forecastApiUrl = `https://api.open-meteo.com/v1/forecast?${[
    `latitude=${latitude}`,
    `longitude=${longitude}`,
    `current=${['temperature_2m', 'relative_humidity_2m'].join(',')}`,
    `temperature_unit=celsius`,
  ].join('&')}`;

  const { status, response: forecastStr } = await GM_fetch({
    url: forecastApiUrl,
    headers: {
      'content-type': 'application/json',
    },
    timeout: 10_000,
  });

  if (status !== 200) {
    throw new Error(
      `Got a ${status} status code when requesting forecast information`,
    );
  }

  if (forecastStr == null) {
    throw new Error(`For some reason the forecast information was nullish`);
  }

  let forecast: Forecast;
  try {
    forecast = JSON.parse(forecastStr);
  } catch (error) {
    throw new Error(`Could not parse forecast JSON: ${error.toString()}`);
  }

  return forecast;
}
