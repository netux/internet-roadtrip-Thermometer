import { ParentProps } from 'solid-js';
import styles, { stylesheet } from './SettingsFieldGroup.module.css';
import SingleInstanceStyle from './SingleInstanceStyle';

export interface Props extends ParentProps {
  id: string;
  label: string;
}

export default (props: Props) => {
  return (
    <>
      <SingleInstanceStyle key="SettingsFieldGroup">
        {stylesheet}
      </SingleInstanceStyle>
      <div class={styles['field-group']}>
        <div class={styles['field-group__label-container']}>
          <label for={props.id}>{props.label}</label>
        </div>
        <div class={styles['field-group__input-container']}>
          {props.children}
        </div>
      </div>
    </>
  );
};
