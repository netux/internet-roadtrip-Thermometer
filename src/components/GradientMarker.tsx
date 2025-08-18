import { TEMPERATURE_UNITS } from '../constants';
import { settings } from '../settings';
import { zeroOne } from '../util';
import styles, { stylesheet } from './GradientMarker.module.css';
import SingleInstanceStyle from './SingleInstanceStyle';

export enum GradientMarkerType {
  CURRENT = 'current',
  CURSOR = 'cursor',
}

export interface Props {
  type: GradientMarkerType;
  temperatureCelsius: number;
}

export default (props: Props) => {
  const temperaturePercent = () =>
    zeroOne(
      props.temperatureCelsius,
      settings().temperatureGradientMinCelsius,
      settings().temperatureGradientMaxCelsius,
    );

  const prettyTemperatureValue = (value: number) => {
    switch (props.type) {
      case GradientMarkerType.CURSOR: {
        // Round to closest multiple of 0.5
        return (Math.round(value * 2) / 2).toFixed(1);
      }
      default: {
        return Math.round(value).toFixed(0);
      }
    }
  };

  const userTemperatureUnit = () =>
    TEMPERATURE_UNITS[settings().temperatureUnit];

  return (
    <>
      <SingleInstanceStyle key="GradientMarker">
        {stylesheet}
      </SingleInstanceStyle>
      <span
        classList={{
          [styles['gradient-marker']]: true,
          [styles[`gradient-marker--${props.type}`]]: true,
        }}
        style={{
          left: `${temperaturePercent() * 100}%`,
        }}
      >
        {prettyTemperatureValue(
          userTemperatureUnit().fromCelsius(props.temperatureCelsius),
        )}
        {userTemperatureUnit().unit}
      </span>
    </>
  );
};
