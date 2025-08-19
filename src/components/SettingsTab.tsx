import { For, mergeProps } from 'solid-js';
import {
  MOD_DOM_SAFE_PREFIX,
  TEMPERATURE_UNITS,
  TemperatureUnits,
} from '../constants';
import SettingsFieldGroup from './SettingsFieldGroup';
import SettingsGradientFieldGroup from './SettingsGradientFieldGroup';
import {
  DEFAULT_WIDGET_POSITION,
  saveSettings,
  Settings,
  settings,
} from '../settings';
import SingleInstanceStyle from './SingleInstanceStyle';
import irfPanelDesignStyles, {
  stylesheet as irfPanelDesignStylesheet,
} from '../irf-panel-design.module.css';
import { stylesheet } from './SettingsTab.module.css';

type KeysMatching<T, ValueType> = {
  [K in keyof T]: T[K] extends ValueType ? K : never;
}[keyof T];

const SettingsTemperatureUnitFieldGroup = () => {
  const label = 'Temperature Unit';
  const id = `${MOD_DOM_SAFE_PREFIX}temperature-unit`;

  const onChange = async (event: Event) => {
    await saveSettings({
      temperatureUnit: (event.currentTarget as HTMLSelectElement)
        .value as TemperatureUnits,
    });
  };

  return (
    <SettingsFieldGroup id={id} label={label}>
      <select id={id} on:change={onChange} value={settings().temperatureUnit}>
        <For each={Object.entries(TEMPERATURE_UNITS)}>
          {([value, { label }]) => <option value={value}>{label}</option>}
        </For>
      </select>
    </SettingsFieldGroup>
  );
};

const SettingsToggleFieldGroup = function (props: {
  id: string;
  label: string;
  field: KeysMatching<Settings, boolean>;
  inverted?: boolean;
  disabled?: boolean;
}) {
  props = mergeProps(
    {
      inverted: false,
      disabled: false,
    },
    props,
  );

  const onChange = async (event: Event) => {
    const checked = (event.currentTarget as HTMLInputElement).checked;

    await saveSettings({
      [props.field]: props.inverted ? !checked : checked,
    });
  };

  return (
    <SettingsFieldGroup id={props.id} label={props.label}>
      <input
        id={props.id}
        class={irfPanelDesignStyles['toggle']}
        type="checkbox"
        on:change={onChange}
        checked={
          props.inverted ? !settings()[props.field] : settings()[props.field]
        }
        disabled={props.disabled}
      />
    </SettingsFieldGroup>
  );
};

export type Props = void;

export default () => {
  return (
    <>
      <SingleInstanceStyle key="SettingsTab">{stylesheet}</SingleInstanceStyle>
      <SingleInstanceStyle key="IRFTabExported">
        {irfPanelDesignStylesheet}
      </SingleInstanceStyle>

      <h2>Clock</h2>
      <SettingsToggleFieldGroup
        id={`${MOD_DOM_SAFE_PREFIX}show-clock`}
        label="Show Clock"
        field="showClock"
      />
      <SettingsToggleFieldGroup
        id={`${MOD_DOM_SAFE_PREFIX}time-24-hour`}
        label="Use AM/PM"
        field="time24Hours"
        inverted={true}
        disabled={!settings().showClock}
      />
      <SettingsToggleFieldGroup
        id={`${MOD_DOM_SAFE_PREFIX}time-include-seconds`}
        label="Show Seconds"
        field="timeIncludeSeconds"
        disabled={!settings().showClock}
      />

      <h2>Temperature</h2>
      <SettingsToggleFieldGroup
        id={`${MOD_DOM_SAFE_PREFIX}show-temperature`}
        label="Show Temperature"
        field="showTemperature"
      />
      <SettingsTemperatureUnitFieldGroup />
      <SettingsGradientFieldGroup />

      <h2>Relative Humidity</h2>
      <SettingsToggleFieldGroup
        id={`${MOD_DOM_SAFE_PREFIX}show-relative-humidity`}
        label="Show Relative Humidity"
        field="showRelativeHumidity"
      />

      <button
        on:click={async () => {
          await saveSettings({
            widgetPosition: DEFAULT_WIDGET_POSITION,
          });
        }}
      >
        Reset widget position
      </button>
    </>
  );
};
