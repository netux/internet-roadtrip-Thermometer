import { splitProps } from 'solid-js';
import SingleInstanceStyle from './SingleInstanceStyle';
import styles, { stylesheet } from './ThermometerGraphic.module.css';
import type { JSX } from 'solid-js/jsx-runtime';

export interface Props extends JSX.SvgSVGAttributes<SVGSVGElement> {
  busy: boolean;
  fillPercent: number;
  color: string;
}

export default (props: Props) => {
  const GRAPHIC_MAX_HEIGHT = 84.6300375;

  const [mainProps, restProps] = splitProps(props, [
    'busy',
    'fillPercent',
    'color',
  ]);

  return (
    <>
      <SingleInstanceStyle key="ThermometerGraphic">
        {stylesheet}
      </SingleInstanceStyle>
      <svg
        style={{
          color: !mainProps.busy ? mainProps.color : null,
        }}
        width="22"
        height="100"
        viewBox="0 0 22 100"
        xmlns="http://www.w3.org/2000/svg"
        {...restProps}
        classList={{
          ...Object.fromEntries(
            restProps['class']?.split(' ').map((cls) => [cls, true]) ?? [],
          ),
          [styles['graphic']]: true,
          [styles['is-busy']]: mainProps.busy,
        }}
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
          class={styles['fill']}
          style="fill: currentcolor; fill-opacity: 1; opacity: 1; stroke: none; stroke-dasharray: none; stroke-linecap: round; stroke-linejoin: round; stroke-opacity: 1; stroke-width: 2; rotate: 180deg; transform-origin: center;"
          width="9.67380575"
          height={mainProps.fillPercent * GRAPHIC_MAX_HEIGHT}
          x="5.841754249999994"
          y="14"
          rx="4.5632865016684"
        />
        <g>
          <ellipse
            id="bottom-fill"
            class={styles['bottom-fill']}
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
    </>
  );
};
