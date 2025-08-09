import './meta.js?userscript-metadata';
import IRF from 'internet-roadtrip-framework';
import {
  setForecastLoadFailure,
  setForecastLoadSuccess,
  setForecastLoading,
} from './global-state';
import { waitForCoordinatesToBeSetAtLeastOnce } from './util';
import { MOD_LOG_PREFIX } from './constants';
import { fetchForecast, type Forecast } from './lib/api';
import { settings } from './settings';
import { makePanel } from './lib/panel';
import Thermometer from './Thermometer';

function createUi() {
  const panel = makePanel({
    element: Thermometer,
    zIndex: 200,
  });
  panel.show();

  panel.movable.setPosition(
    settings().overlayPosition.x * window.innerWidth,
    settings().overlayPosition.y * window.innerHeight,
  );
}

async function tickForecast() {
  const containerVDOM = await IRF.vdom.container;

  setForecastLoading();

  let forecast: Forecast;
  try {
    forecast = await fetchForecast([
      containerVDOM.state.currentCoords.lat,
      containerVDOM.state.currentCoords.lng,
    ]);
  } catch (error) {
    setForecastLoadFailure(error);
    console.error(MOD_LOG_PREFIX, 'Could not fetch forecast', error);
    return;
  }

  console.debug(MOD_LOG_PREFIX, 'New forecast received:', forecast);

  setForecastLoadSuccess(forecast);
}

createUi();

waitForCoordinatesToBeSetAtLeastOnce.then(() => {
  setInterval(tickForecast, 15 * 60_000 /* every 15 minutes */);
  tickForecast();
});
