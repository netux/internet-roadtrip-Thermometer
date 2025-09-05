import type IRF from 'internet-roadtrip-framework';
import { createSignal } from 'solid-js';
import { Forecast } from './lib/api';
import { Panel } from './lib/panel';

export const [widgetPanel, setWidgetPanel] = createSignal<Panel | null>(null);
export const [tickForecastInterval, setTickForecastInterval] =
  createSignal<NodeJS.Timeout | null>(null);
export const [irfTab, setIrfTab] =
  createSignal<ReturnType<typeof IRF.ui.panel.createTabFor>>(null);

export const [loading, setLoading] = createSignal(false);
export const [forecast, setForecast] = createSignal<Forecast>(null);
export const [error, setError] = createSignal<Error>(null);

export function setForecastLoading() {
  setLoading(true);
}

export function setForecastLoadSuccess(forecast: Forecast) {
  setLoading(false);
  setForecast(forecast);
  setError(null);
}

export function setForecastLoadFailure(error: Error) {
  setLoading(false);
  setError(error);
}
