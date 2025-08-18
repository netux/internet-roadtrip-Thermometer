import { For } from 'solid-js';
import {
  MOD_DOM_SAFE_PREFIX,
  TEMPERATURE_UNITS,
  TemperatureUnits,
} from '../constants';
import SettingsFieldGroup from './SettingsFieldGroup';
import SettingsGradientFieldGroup from './SettingsGradientFieldGroup';
import { DEFAULT_OVERLAY_POSITION, saveSettings, settings } from '../settings';
import SingleInstanceStyle from './SingleInstanceStyle';
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

export type Props = void;

export default () => {
  return (
    <>
      <SingleInstanceStyle key="SettingsTab">{stylesheet}</SingleInstanceStyle>
      <SettingsTemperatureUnitFieldGroup />
      <SettingsGradientFieldGroup />
      <button
        on:click={async () => {
          await saveSettings({
            overlayPosition: DEFAULT_OVERLAY_POSITION,
          });
        }}
      >
        Reset widget position
      </button>
    </>
  );
};
