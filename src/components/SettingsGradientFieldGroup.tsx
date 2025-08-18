import {
  MOD_DOM_SAFE_PREFIX,
  TEMPERATURE_UNITS,
  TemperatureUnits,
} from '../constants';
import {
  sampleTemperatureGradient,
  temperatureAtGradient,
  temperatureCanvasGradientCtx,
} from '../gradient';
import {
  settings,
  saveSettings,
  TemperatureColorStop,
  getDefaultTemperatureGradientSettings,
} from '../settings';
import SingleInstanceStyle from './SingleInstanceStyle';
import styles, { stylesheet } from './SettingsGradientFieldGroup.module.css';
import { createSignal, Index, Show } from 'solid-js';
import GradientMarker, { GradientMarkerType } from './GradientMarker';
import { forecast } from '../global-state';
import GradientColorStop from './GradientColorStop';

interface GradientRangeInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  unit: TemperatureUnits;
}

const GradientRangeInput = (props: GradientRangeInputProps) => {
  const onChange = (event: Event) => {
    const numberValue = parseFloat(
      (event.currentTarget as HTMLInputElement).value,
    );
    if (Number.isNaN(numberValue)) {
      return;
    }

    props.onChange(numberValue);
  };

  return (
    <div class={styles['gradient-range__input-container']}>
      <input
        id={props.id}
        type="number"
        value={props.value}
        on:change={onChange}
      />
      {TEMPERATURE_UNITS[props.unit].unit}
    </div>
  );
};

const GradientRange = () => {
  const onChangeMin = (newMinTemperatureCelsius: number) =>
    saveSettings((previousSettings) => ({
      ...previousSettings,
      temperatureGradientMinCelsius: newMinTemperatureCelsius,
    }));
  const onChangeMax = (newMaxTemperatureCelsius: number) =>
    saveSettings((previousSettings) => ({
      ...previousSettings,
      temperatureGradientMaxCelsius: newMaxTemperatureCelsius,
    }));

  return (
    <div class={styles['gradient-range']}>
      {/* TODO(netux): show in the user's temperature */}
      <GradientRangeInput
        id={`${MOD_DOM_SAFE_PREFIX}gradient-temperature-min`}
        value={settings().temperatureGradientMinCelsius}
        onChange={onChangeMin}
        unit={'celsius'}
      />
      <GradientRangeInput
        id={`${MOD_DOM_SAFE_PREFIX}gradient-temperature-max`}
        value={settings().temperatureGradientMaxCelsius}
        onChange={onChangeMax}
        unit={'celsius'}
      />
    </div>
  );
};

const GradientContainer = () => {
  const [hoveringTemperature, setHoveringTemperature] = createSignal<
    number | null
  >(null);

  const onGradientContainerMouseMove = (event: MouseEvent) => {
    const { left: containerClientX, width: containerWidth } = (
      event.currentTarget as HTMLDivElement
    ).getBoundingClientRect();
    const containerOffsetX = event.clientX - containerClientX;

    const percent = containerOffsetX / containerWidth;
    setHoveringTemperature(temperatureAtGradient(percent));
  };

  const onGradientContainerMouseLeave = () => {
    setHoveringTemperature(null);
  };

  const onGradientContainerDoubleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const percent =
      event.offsetX / (event.currentTarget as HTMLElement).clientWidth;
    const color = sampleTemperatureGradient(temperatureAtGradient(percent));

    const newStop: TemperatureColorStop = { percent, color };
    saveSettings((previousSettings) => ({
      ...previousSettings,
      temperatureGradient: previousSettings.temperatureGradient.concat(newStop),
    }));
  };

  return (
    <div
      class={styles['gradient-container']}
      on:mousemove={{
        handleEvent: onGradientContainerMouseMove,
        capture: true,
      }}
      on:mouseleave={onGradientContainerMouseLeave}
      on:dblclick={onGradientContainerDoubleClick}
    >
      <Show when={forecast()}>
        <GradientMarker
          type={GradientMarkerType.CURRENT}
          temperatureCelsius={forecast().current.temperature_2m}
        />
      </Show>
      <Show when={hoveringTemperature()}>
        <GradientMarker
          type={GradientMarkerType.CURSOR}
          temperatureCelsius={hoveringTemperature()}
        />
      </Show>

      {/*
       * This is kinda cursed, but it works!
       * And it saves us from having to keep two images synced with each other.
       */}
      {temperatureCanvasGradientCtx.canvas}

      <div class={styles['stops-container']}>
        <Index each={settings().temperatureGradient}>
          {(stop, index) => {
            const onMove = (newPercent: number) => {
              saveSettings((previousSettings) => ({
                ...previousSettings,
                temperatureGradient: previousSettings.temperatureGradient.with(
                  index,
                  { ...stop(), percent: newPercent },
                ),
              }));
            };

            const onColorChange = (newColor: string) => {
              saveSettings((previousSettings) => ({
                ...previousSettings,
                temperatureGradient: previousSettings.temperatureGradient.with(
                  index,
                  { ...stop(), color: newColor },
                ),
              }));
            };

            const onDelete = () => {
              saveSettings((previousSettings) => ({
                ...previousSettings,
                temperatureGradient:
                  previousSettings.temperatureGradient.toSpliced(index, 1),
              }));
            };

            return (
              <GradientColorStop
                color={stop().color}
                percent={stop().percent}
                onMove={onMove}
                onChange={onColorChange}
                onDelete={onDelete}
              />
            );
          }}
        </Index>
      </div>
    </div>
  );
};

export type Props = void;

export default () => {
  const id = `${MOD_DOM_SAFE_PREFIX}temperature-gradient`;

  const onResetButtonClick = () => {
    if (
      !confirm(
        [
          'This will reset the thermometer gradient range and color stops to their default values.',
          'Are you sure you want to continue?',
        ].join('\n'),
      )
    ) {
      return;
    }

    saveSettings((previousSettings) => ({
      ...previousSettings,
      ...getDefaultTemperatureGradientSettings(),
    }));
  };

  return (
    <div class={styles['gradient-field-group']}>
      <SingleInstanceStyle key="SettingsGradientFieldGroup">
        {stylesheet}
      </SingleInstanceStyle>
      <div class={styles['label']}>
        <label for={id}>Temperature Gradient</label>
        <button on:click={onResetButtonClick}>
          <img src="https://www.svgrepo.com/show/511181/undo.svg" />
        </button>
      </div>
      <GradientRange />
      <GradientContainer />
    </div>
  );
};
