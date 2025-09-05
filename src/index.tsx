import './meta.js?userscript-metadata';
import IRF from 'internet-roadtrip-framework';
import {
  widgetPanel,
  setForecastLoadFailure,
  setForecastLoadSuccess,
  setForecastLoading,
  setWidgetPanel,
  setTickForecastInterval,
  tickForecastInterval,
  setIrfTab,
  irfTab,
} from './global-state';
import {
  isTrulyInternetRoadtrip,
  waitFor,
  waitForCoordinatesToBeSetAtLeastOnce,
} from './util';
import { MOD_LOG_PREFIX, MOD_NAME } from './constants';
import { fetchForecast, type Forecast } from './lib/api';
import { resolvedWidgetPositionSetting } from './settings';
import { makePanel } from './lib/panel';
import Thermometer from './components/ThermometerWidget';
import irfTabStyles, {
  stylesheet as irfTabStylesheet,
} from './irf-tab.module.css';
import { render } from 'solid-js/web';
import SettingsTab from './components/SettingsTab';
import ShadowRooted from './components/ShadowRooted';

function createWidget() {
  const panel = makePanel({
    element: Thermometer,
    zIndex: 200,
  });
  setWidgetPanel(panel);
  panel.show();

  panel.movable.setPosition(
    resolvedWidgetPositionSetting().x,
    resolvedWidgetPositionSetting().y,
  );
}

function createIrfTab() {
  const irfTab = IRF.ui.panel.createTabFor(
    {
      ...GM.info,
      script: {
        ...GM.info.script,
        name: MOD_NAME,
        icon: null, // prevent slowing down presence of IRF button while downloading our custom icon
      },
    },
    {
      tabName: MOD_NAME,
      className: irfTabStyles['tab-content'],
      style: irfTabStylesheet,
    },
  );
  setIrfTab(irfTab);

  render(
    // <ShadowRooted> is a workaround for IRF not having per-tab stylesheet isolation.
    // TODO(netux): remove <ShadowRooted> for IRF v0.5.0-beta
    () => (
      <ShadowRooted>
        <SettingsTab />
      </ShadowRooted>
    ),
    irfTab.container,
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

function boot() {
  if (widgetPanel() == null) {
    createWidget();
  }

  if (irfTab() == null) {
    createIrfTab();
  }

  waitForCoordinatesToBeSetAtLeastOnce.then(() => {
    setTickForecastInterval(
      setInterval(tickForecast, 15 * 60_000 /* every 15 minutes */),
    );
    tickForecast();
  });

  waitFor(() => !isTrulyInternetRoadtrip()).then(shut);
}

function shut() {
  widgetPanel()?.hide();

  if (tickForecastInterval() != null) {
    clearInterval(tickForecastInterval());
    setTickForecastInterval(null);
  }

  waitFor(isTrulyInternetRoadtrip).then(boot);
}

waitFor(isTrulyInternetRoadtrip).then(boot);
