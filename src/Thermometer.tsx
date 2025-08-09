import {
  createEffect,
  createMemo,
  createSignal,
  onMount,
  Show,
} from 'solid-js';
import styles, { stylesheet } from './Thermometer.module.css';
import { IPanelBodyProps } from './lib/panel';
import * as globalState from './global-state';
import { saveSettings, settings } from './settings';
import { sampleTemperatureGradient } from './gradient';
import { TEMPERATURE_UNITS } from './constants';

export type ThermometerProps = IPanelBodyProps;

export default ({ panel }: ThermometerProps) => {
  const GRAPHIC_MAX_HEIGHT = 84.6300375;

  const [isBeingGrabbed, setIsBeingGrabbed] = createSignal(false);
  const [isInfoOnTheRight, setIsInfoOnTheRight] = createSignal(false);
  const [graphicElRef, setGraphicElRef] = createSignal<SVGElement>();

  const updateInfoPosition = () => {
    const { left, width } = panel.wrapperEl.getBoundingClientRect();
    setIsInfoOnTheRight(left + width / 2 < window.innerWidth / 2);
  };

  const onPanelMoving = () => {
    updateInfoPosition();
  };

  const onPanelMoveStart = () => {
    setIsBeingGrabbed(true);
  };

  const onPanelMoveEnd = async () => {
    setIsBeingGrabbed(false);

    const { left, top } = panel.movable.getPosition();

    await saveSettings((prevSettings) => {
      return {
        ...prevSettings,
        overlayPosition: {
          x: left / window.innerWidth,
          y: top / window.innerHeight,
        },
      };
    });
  };

  onMount(() => {
    panel.movable.addEventListener('move-start', onPanelMoveStart);
    panel.movable.addEventListener('moving', onPanelMoving);
    panel.movable.addEventListener('move-end', onPanelMoveEnd);

    panel.movable.enable();

    return () => {
      panel.movable.removeEventListener('move-start', onPanelMoveStart);
      panel.movable.removeEventListener('moving', onPanelMoving);
      panel.movable.removeEventListener('move-end', onPanelMoveEnd);
    };
  });

  createEffect(() => {
    if (graphicElRef()) {
      panel.movable.applyOptions({
        handlerElements: [graphicElRef()],
      });
    }
  });

  const userTemperatureUnit = createMemo(
    () => TEMPERATURE_UNITS[settings().temperatureUnit],
  );

  const graphicHeight = createMemo<number>((prev) => {
    const forecast = globalState.forecast();
    if (!forecast) {
      return prev;
    }

    const temperatureGradientLength = Math.abs(
      settings().temperatureGradientMaxCelsius -
        settings().temperatureGradientMinCelsius,
    );
    return (
      (forecast.current.temperature_2m / temperatureGradientLength) *
      GRAPHIC_MAX_HEIGHT
    );
  }, 0);

  const graphicColor = createMemo<string | null>((prev) => {
    const forecast = globalState.forecast();
    if (!forecast) {
      return prev;
    }

    return sampleTemperatureGradient(forecast.current.temperature_2m);
  }, null);

  return (
    <div
      classList={{
        [styles['thermometer']]: true,
        [styles['thermometer--info-on-the-right']]: isInfoOnTheRight(),
        [styles['thermometer--loading']]: globalState.loading(),
      }}
    >
      <style>{stylesheet}</style>
      <div class={styles['thermometer__info']}>
        <Show when={globalState.error()}>
          <div class={styles['thermometer__error-info']}>
            <h2>:(</h2>
            <p>Contact @netux about this</p>
          </div>
        </Show>
        <Show when={globalState.forecast()}>
          <p class={styles['thermometer__temperature-info']}>
            T:{' '}
            {userTemperatureUnit().fromCelsius(
              globalState.forecast().current.temperature_2m,
            )}
            {userTemperatureUnit().unit}
          </p>
          <p class={styles['thermometer__humidity-info']}>
            H: {globalState.forecast().current.relative_humidity_2m}%
          </p>
        </Show>
      </div>
      <svg
        ref={(graphicElRef) => setGraphicElRef(graphicElRef)}
        classList={{
          [styles['thermometer__graphic']]: true,
          [styles['thermometer__graphic--grabbed']]: isBeingGrabbed(),
        }}
        style={{
          color: graphicColor(),
        }}
        width="22"
        height="100"
        viewBox="0 0 22 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          id="background"
          style="fill: rgb(206 251 250 / 50%); fill-opacity: 1; opacity: 1; stroke: none; stroke-dasharray: none; stroke-linecap: round; stroke-linejoin: round; stroke-opacity: 1; stroke-width: 2;"
          width="9.67380575"
          height={GRAPHIC_MAX_HEIGHT}
          x="5.841754249999994"
          y="1.9680687500000005"
          rx="4.5632865016684"
        />
        <rect
          id="fill"
          class={styles['thermometer__graphic-fill']}
          style="fill: currentcolor; fill-opacity: 1; opacity: 1; stroke: none; stroke-dasharray: none; stroke-linecap: round; stroke-linejoin: round; stroke-opacity: 1; stroke-width: 2; rotate: 180deg; transform-origin: center;"
          width="9.67380575"
          height={graphicHeight()}
          x="5.841754249999994"
          y="14"
          rx="4.5632865016684"
        />
        <g>
          <ellipse
            id="bottom-fill"
            class={styles['thermometer__graphic-bottom-fill']}
            style="opacity: 1; fill: currentcolor; fill-opacity: 1; stroke-width: 2.98623; stroke-linecap: round; stroke-linejoin: round"
            cx="10.81210005114999"
            cy="89.515713524548"
            rx="9.596004408359999"
            ry="9.3861523188054"
          />
          <path
            id="shimmer"
            style="fill: none; opacity: 0.75; stroke: #ffffff; stroke-dasharray: none; stroke-linecap: round; stroke-linejoin: miter; stroke-opacity: 1; stroke-width: 1.5;"
            d="M 3.68829 88.8769 C 3.68829 88.8769 3.94517 91.2262 5.70701 93.1668 C 7.46886 95.1075 9.59383 95.4109 9.59383 95.4109"
          />
        </g>
        <path
          id="outline"
          style="display: inline; fill: none; stroke: #000000; stroke-dasharray: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"
          d="M 10.6362 1.09869 C 7.89534 1.09869 5.69054 3.76255 5.69055 7.07108 L 5.69055 80.5387 C 2.8139 82.2685 0.910186 85.417 0.910186 89.0143 C 0.910186 94.4748 5.34273 98.9026 10.8115 98.9026 C 16.2803 98.9026 20.7148 94.4748 20.7148 89.0143 C 20.7148 85.2876 18.6337 82.0426 15.5838 80.3576 L 15.5838 7.07108 C 15.5838 3.76255 13.377 1.09869 10.6362 1.09869 Z"
        />
      </svg>
    </div>
  );
};
