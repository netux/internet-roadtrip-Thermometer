import {
  Accessor,
  createContext,
  createSignal,
  mergeProps,
  onMount,
  ParentProps,
  Show,
} from 'solid-js';
import { Dynamic, Portal } from 'solid-js/web';

export const shadowRootContext =
  createContext<Accessor<ShadowRoot | null> | null>(null);

export interface Props extends ParentProps {
  hostTag?: string;
}

export default (props: Props) => {
  props = mergeProps({ hostTag: 'div' }, props);

  let hostEl: Element;

  const [shadowRoot, setShadowRoot] = createSignal<ShadowRoot | null>(null);

  onMount(() => {
    setShadowRoot(hostEl.attachShadow({ mode: 'open' }));
  });

  return (
    <>
      <Dynamic
        component={props.hostTag}
        style={{ display: 'contents' }}
        ref={hostEl}
      />
      <shadowRootContext.Provider value={shadowRoot}>
        <Show when={shadowRoot?.() != null}>
          <Portal mount={shadowRoot()}>{props.children}</Portal>
        </Show>
      </shadowRootContext.Provider>
    </>
  );
};
