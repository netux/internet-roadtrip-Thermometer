import { For } from 'solid-js';
import {
  MOD_DOM_SAFE_PREFIX,
  TEMPERATURE_UNITS,
  TemperatureUnits,
} from '../constants';
import SettingsFieldGroup from './SettingsFieldGroup';
import SettingsGradientFieldGroup from './SettingsGradientFieldGroup';
import { DEFAULT_WIDGET_POSITION, saveSettings, settings } from '../settings';
import SingleInstanceStyle from './SingleInstanceStyle';
import irfPanelDesignStyles, {
  stylesheet as irfPanelDesignStylesheet,
} from '../irf-panel-design.module.css';
import { stylesheet } from './SettingsTab.module.css';

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

const SettingsTime24HourFieldGroup = () => {
  const label = 'Use AM/PM';
  const id = `${MOD_DOM_SAFE_PREFIX}time-24-hour`;

  const onChange = async (event: Event) => {
    await saveSettings({
      time24Hours: !(event.currentTarget as HTMLInputElement).checked,
    });
  };

  return (
    <SettingsFieldGroup id={id} label={label}>
      <input
        id={id}
        class={irfPanelDesignStyles['toggle']}
        type="checkbox"
        on:change={onChange}
        checked={!settings().time24Hours}
      />
    </SettingsFieldGroup>
  );
};

const SettingsTimeIncludeSecondsFieldGroup = () => {
  const label = 'Show Seconds';
  const id = `${MOD_DOM_SAFE_PREFIX}time-include-seconds`;

  const onChange = async (event: Event) => {
    await saveSettings({
      timeIncludeSeconds: (event.currentTarget as HTMLInputElement).checked,
    });
  };

  return (
    <SettingsFieldGroup id={id} label={label}>
      <input
        id={id}
        class={irfPanelDesignStyles['toggle']}
        type="checkbox"
        on:change={onChange}
        checked={settings().timeIncludeSeconds}
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
      <SettingsTime24HourFieldGroup />
      <SettingsTimeIncludeSecondsFieldGroup />

      <h2>Temperature</h2>
      <SettingsTemperatureUnitFieldGroup />
      <SettingsGradientFieldGroup />

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
