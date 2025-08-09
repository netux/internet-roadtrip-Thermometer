import { hm } from '@violentmonkey/dom';
import { MOD_DOM_SAFE_PREFIX } from '../constants';
import { Movable } from './movable';
import type { JSX } from 'solid-js/jsx-runtime';
import { render } from 'solid-js/web';

export interface IPanelBodyProps {
  panel: Panel;
}

export interface PanelOptions {
  element: (props: IPanelBodyProps) => JSX.Element;
  zIndex?: number;
}

export interface Panel {
  hostEl: HTMLElement;
  wrapperEl: HTMLElement;
  movable: Movable;
  show(): void;
  hide(): void;
}

/*
 * Based on VM UI's VM.getPanel() https://github.com/violentmonkey/vm-ui/blob/00592622a01e48a4ac27a743254d82b1ebcd6d02/src/panel/index.tsx#L71
 */
export function makePanel(options: PanelOptions): Panel {
  const hostEl = hm(`${MOD_DOM_SAFE_PREFIX}host`, {}) as HTMLElement;
  const shadowRoot = hostEl.attachShadow({ mode: 'open' });

  shadowRoot.append(
    hm(
      'style',
      {},
      `
  ${MOD_DOM_SAFE_PREFIX}wrapper {
    position: fixed;
    z-index: ${options.zIndex ?? Number.MAX_SAFE_INTEGER - 1};
    pointer-events: none;

    & > * {
      pointer-events: initial;
    }
  }
  `,
    ),
  );

  const wrapperEl = hm(`${MOD_DOM_SAFE_PREFIX}wrapper`, {}) as HTMLElement;
  wrapperEl.style.pointerEvents = 'none';
  shadowRoot.append(wrapperEl);

  const movable = new Movable(wrapperEl);

  const panel = {
    hostEl,
    wrapperEl,
    movable,
    show() {
      document.body.append(hostEl);
    },
    hide() {
      hostEl.remove();
    },
  } satisfies Panel;

  render(() => <options.element panel={/* @once */ panel} />, panel.wrapperEl);

  return panel;
}
