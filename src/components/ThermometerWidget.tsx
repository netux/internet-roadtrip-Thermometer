import {
  createEffect,
  createMemo,
  createSignal,
  onMount,
  Show,
} from 'solid-js';
import styles, { stylesheet } from './ThermometerWidget.module.css';
import { IPanelBodyProps } from '../lib/panel';
import * as globalState from '../global-state';
import { saveSettings, settings } from '../settings';
import { sampleTemperatureGradient } from '../gradient';
import { TEMPERATURE_UNITS } from '../constants';
import SingleInstanceStyle from './SingleInstanceStyle';
import ThermometerGraphic from './ThermometerGraphic';

export type Props = IPanelBodyProps;

export default ({ panel }: Props) => {
  const [isBeingGrabbed, setIsBeingGrabbed] = createSignal(false);
  const [isInfoOnTheRight, setIsInfoOnTheRight] = createSignal(false);
  const [graphicElRef, setGraphicElRef] = createSignal<SVGElement>();

  const onPanelMoving = () => {
    const { left, width } = panel.wrapperEl.getBoundingClientRect();
    setIsInfoOnTheRight(left + width / 2 < window.innerWidth / 2);
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

  createEffect((prevOverlayPosition: { x: number; y: number }) => {
    const newOverlayPosition = settings().overlayPosition;

    if (
      newOverlayPosition.x !== prevOverlayPosition.x ||
      newOverlayPosition.y !== prevOverlayPosition.y
    ) {
      panel.movable.setPosition(
        newOverlayPosition.x * window.innerWidth,
        newOverlayPosition.y * window.innerHeight,
      );
    }

    return newOverlayPosition;
  }, settings().overlayPosition);

  const userTemperatureUnit = createMemo(
    () => TEMPERATURE_UNITS[settings().temperatureUnit],
  );

  const graphicFillPercent = createMemo<number>((prev) => {
    const forecast = globalState.forecast();
    if (!forecast) {
      return prev;
    }

    const temperatureGradientLength = Math.abs(
      settings().temperatureGradientMaxCelsius -
        settings().temperatureGradientMinCelsius,
    );
    return forecast.current.temperature_2m / temperatureGradientLength;
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
        [styles['container']]: true,
        [styles['is-info-on-the-right']]: isInfoOnTheRight(),
        [styles['is-being-grabbed']]: isBeingGrabbed(),
      }}
    >
      <SingleInstanceStyle key="ThermometerWidget">
        {stylesheet}
      </SingleInstanceStyle>
      <div class={styles['info']}>
        <Show when={globalState.error()}>
          <div class={styles['error']}>
            <h2>:(</h2>
            <p>Contact @netux about this</p>
          </div>
        </Show>
        <Show when={!globalState.loading() && globalState.forecast() != null}>
          <p>
            T:{' '}
            {userTemperatureUnit().fromCelsius(
              globalState.forecast().current.temperature_2m,
            )}
            {userTemperatureUnit().unit}
          </p>
          <p>H: {globalState.forecast().current.relative_humidity_2m}%</p>
        </Show>
      </div>
      <ThermometerGraphic
        busy={globalState.loading()}
        fillPercent={graphicFillPercent()}
        color={graphicColor()}
        class={styles['graphic']}
        ref={(graphicElRef) => setGraphicElRef(graphicElRef)}
      />
    </div>
  );
};
