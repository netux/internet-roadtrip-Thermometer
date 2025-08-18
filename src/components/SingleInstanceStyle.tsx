import { hm } from '@violentmonkey/dom';
import {
  Accessor,
  createEffect,
  createSignal,
  onCleanup,
  Setter,
  useContext,
} from 'solid-js';
import { shadowRootContext } from './ShadowRooted';

export interface Props {
  key: string;
  children: string;
}

interface StyleSheetInstance {
  styleEl: HTMLStyleElement;
  usageCount: Accessor<number>;
  setUsageCount: Setter<number>;
}

const existingStyleSheetsPerRealm = new Map<
  DocumentOrShadowRoot,
  Map<string, StyleSheetInstance>
>();

const useRealm = (): Accessor<DocumentOrShadowRoot> => {
  const closestShadowRoot = useContext(shadowRootContext);
  return () => (closestShadowRoot == null ? document : closestShadowRoot());
};

export default (props: Props) => {
  const mountRealm = useRealm();

  const mount = () => {
    const realm = mountRealm();
    if (realm instanceof Document) {
      return realm.head;
    } else if (realm instanceof ShadowRoot) {
      return realm;
    } else {
      throw new Error(
        'Could not determine mount point for SingleInstanceStylesheet',
      );
    }
  };

  const injectIfFirst = () => {
    if (!existingStyleSheetsPerRealm.has(mountRealm())) {
      existingStyleSheetsPerRealm.set(mountRealm(), new Map());
    }
    const realmExistingStyleSheets =
      existingStyleSheetsPerRealm.get(mountRealm());

    if (!realmExistingStyleSheets.has(props.key)) {
      const [usageCount, setUsageCount] = createSignal(0);

      realmExistingStyleSheets.set(props.key, {
        styleEl: hm(
          'style',
          { 'data-single-instance-style-key': props.key },
          props.children,
        ) as HTMLStyleElement,
        usageCount,
        setUsageCount,
      });
    }

    const instance = realmExistingStyleSheets.get(props.key);

    instance.setUsageCount((count) => count + 1);

    if (!instance.styleEl.isConnected) {
      mount().append(instance.styleEl);
    }
  };

  const cleanUpForThisInstance = () => {
    const realmExistingStyleSheets =
      existingStyleSheetsPerRealm.get(mountRealm());
    if (!realmExistingStyleSheets) {
      return;
    }

    const instance = realmExistingStyleSheets.get(props.key);
    if (!instance) {
      return;
    }

    instance.setUsageCount((count) => count - 1);

    if (instance.usageCount() <= 0 && instance.styleEl.isConnected) {
      instance.styleEl.remove();

      realmExistingStyleSheets.delete(props.key);
    }
  };

  createEffect(() => {
    if (mountRealm() == null) {
      return;
    }

    injectIfFirst();
  });

  onCleanup(cleanUpForThisInstance);

  return null;
};
