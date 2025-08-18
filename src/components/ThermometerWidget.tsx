import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
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
import { Pet } from '../lib/pet';
import { Heart } from '../lib/heart';

export type Props = IPanelBodyProps;

export default ({ panel }: Props) => {
  let graphicEl: SVGSVGElement;

  const [isBeingGrabbed, setIsBeingGrabbed] = createSignal(false);
  const [isInfoOnTheRight, setIsInfoOnTheRight] = createSignal(false);

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
        widgetPosition: {
          x: left / window.innerWidth,
          y: top / window.innerHeight,
        },
      };
    });
  };

  const setupPet = () => {
    const pet = new Pet(graphicEl, {
      sampleRate: 100,
      max: 10,
      threshold: 2.5,
      activation: 3,
      neglect: 0.5,
      angleMin: -20,
      angleMax: 20,
    });

    let spawnHeartsInterval: NodeJS.Timeout | null = null;

    pet.addEventListener('petting-start', () => {
      let spawnNextHeartGoingRight = false;
      spawnHeartsInterval = setInterval(() => {
        const boundingBox = pet.petEl.getBoundingClientRect();

        new Heart({
          initialPosX:
            boundingBox.left +
            boundingBox.width * (spawnNextHeartGoingRight ? 2 / 3 : 1 / 3),
          initialPosY: boundingBox.top + boundingBox.height / 3,
          velocityX: 0.25 * (spawnNextHeartGoingRight ? 1 : -1),
          velocityY: -0.5,
          maxLifetime: 5000,
        });

        spawnNextHeartGoingRight = !spawnNextHeartGoingRight;
      }, 500);
    });

    pet.addEventListener('petting-end', () => {
      clearInterval(spawnHeartsInterval);
      spawnHeartsInterval = null;
    });
  };

  onMount(() => {
    panel.movable.addEventListener('move-start', onPanelMoveStart);
    panel.movable.addEventListener('moving', onPanelMoving);
    panel.movable.addEventListener('move-end', onPanelMoveEnd);

    panel.movable.applyOptions({
      handlerElements: [graphicEl],
    });

    panel.movable.enable();

    setupPet();
  });

  onCleanup(() => {
    panel.movable.disable();

    panel.movable.removeEventListener('move-start', onPanelMoveStart);
    panel.movable.removeEventListener('moving', onPanelMoving);
    panel.movable.removeEventListener('move-end', onPanelMoveEnd);
  });

  createEffect((prevWidgetPosition: { x: number; y: number }) => {
    const newWidgetPosition = settings().widgetPosition;

    if (
      newWidgetPosition.x !== prevWidgetPosition.x ||
      newWidgetPosition.y !== prevWidgetPosition.y
    ) {
      panel.movable.setPosition(
        newWidgetPosition.x * window.innerWidth,
        newWidgetPosition.y * window.innerHeight,
      );
    }

    return newWidgetPosition;
  }, settings().widgetPosition);

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
        ref={graphicEl}
      />
    </div>
  );
};
