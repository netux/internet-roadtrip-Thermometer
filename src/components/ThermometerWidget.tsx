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
import {
  saveSettings,
  settings,
  resolvedWidgetPositionSetting,
  makeWidgetPositionSetting,
} from '../settings';
import {
  sampleTemperatureGradient,
  temperatureGradientHasRedrawn,
} from '../gradient';
import { TEMPERATURE_UNITS } from '../constants';
import SingleInstanceStyle from './SingleInstanceStyle';
import ThermometerGraphic from './ThermometerGraphic';
import { Pet } from '../lib/pet';
import { Heart } from '../lib/heart';
import { offsetTimezone } from '../util';
import { Forecast } from '../lib/api';

export type Props = IPanelBodyProps;

const CLOCK_EMOJIS_MAP = new Map<number, string>();
{
  const firstOClockEmojiCodePoint = '🕐'.codePointAt(0); // one-oclock
  const lastOClockEmojiCodePoint = '🕛'.codePointAt(0); // twelve-oclock
  for (
    let i = 0;
    i <= lastOClockEmojiCodePoint - firstOClockEmojiCodePoint;
    i++
  ) {
    CLOCK_EMOJIS_MAP.set(
      (i + 1) % 12,
      String.fromCodePoint(firstOClockEmojiCodePoint + i),
    );
  }

  const firstThirtyEmojiCodePoint = '🕜'.codePointAt(0);
  const lastThirtyEmojiCodePoint = '🕧'.codePointAt(0);
  for (
    let i = 0;
    i <= lastThirtyEmojiCodePoint - firstThirtyEmojiCodePoint;
    i++
  ) {
    CLOCK_EMOJIS_MAP.set(
      (i + 1.5) % 12,
      String.fromCodePoint(firstThirtyEmojiCodePoint + i),
    );
  }
}

const useCurrentDate = (updateEveryMs: number) => {
  const [date, setDate] = createSignal(new Date());

  const updateInterval = setInterval(() => setDate(new Date()), updateEveryMs);

  onCleanup(() => {
    clearInterval(updateInterval);
  });

  return date;
};

const ForecastZoneDateClock = (props: { forecast: Forecast }) => {
  const currentDate = useCurrentDate(1000);

  const forecastZoneDate = createMemo(() =>
    offsetTimezone(currentDate(), props.forecast.utc_offset_seconds),
  );

  const forecastZoneDateEmoji = () => {
    const decimalHour =
      (forecastZoneDate().getHours() % 12) +
      (forecastZoneDate().getMinutes() >= 30 ? 0.5 : 0);
    return CLOCK_EMOJIS_MAP.get(decimalHour) || '⏰';
  };

  const prettyForecastZoneDate = createMemo(() => {
    const date = forecastZoneDate();

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (settings().time24Hours) {
      return `${pad(date.getHours())}:${pad(date.getMinutes())}${settings().timeIncludeSeconds ? `:${pad(date.getSeconds())}` : ''}`;
    } else {
      return `${pad(date.getHours() % 12)}:${pad(date.getMinutes())}${settings().timeIncludeSeconds ? `:${pad(date.getSeconds())}` : ''} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
    }
  });

  return (
    <>
      {forecastZoneDateEmoji()} {prettyForecastZoneDate()}
    </>
  );
};

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
        widgetPosition: makeWidgetPositionSetting({
          x: left,
          y: top,
        }),
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
    const newWidgetPosition = resolvedWidgetPositionSetting();

    if (
      newWidgetPosition.x !== prevWidgetPosition.x ||
      newWidgetPosition.y !== prevWidgetPosition.y
    ) {
      panel.movable.setPosition(newWidgetPosition.x, newWidgetPosition.y);
    }

    return newWidgetPosition;
  }, resolvedWidgetPositionSetting());

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

  const currentTemperatureCelsius = createMemo<number | null>(
    (previousTemperatureCelsius) => {
      const forecast = globalState.forecast();
      if (!forecast) {
        // Preserve previous temperature
        return previousTemperatureCelsius;
      }

      return forecast.current.temperature_2m;
    },
    null,
  );

  const graphicColor = createMemo<string | null>(() => {
    if (!(currentTemperatureCelsius() || temperatureGradientHasRedrawn())) {
      return null;
    }

    return sampleTemperatureGradient(currentTemperatureCelsius());
  });

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
          <Show when={settings().showClock}>
            <p>
              <ForecastZoneDateClock forecast={globalState.forecast()} />
            </p>
          </Show>
          <Show when={settings().showTemperature}>
            <p>
              T:{' '}
              {userTemperatureUnit().fromCelsius(
                globalState.forecast().current.temperature_2m,
              )}
              {userTemperatureUnit().unit}
            </p>
          </Show>
          <Show when={settings().showRelativeHumidity}>
            <p>H: {globalState.forecast().current.relative_humidity_2m}%</p>
          </Show>
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
