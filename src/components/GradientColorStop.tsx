import styles, { stylesheet } from './GradientColorStop.module.css';
import SingleInstanceStyle from './SingleInstanceStyle';
import { onCleanup, onMount } from 'solid-js';

export interface Props {
  color: string;
  percent: number;
  onMove(newPercent: number): void;
  onChange(newColor: string): void;
  onDelete(): void;
}

export default (props: Props) => {
  let stopEl: HTMLDivElement;
  let colorInputEl: HTMLInputElement;

  let lastDragStartPos: { x: number; y: number } | null = null;
  let isDragging = false;

  const onMouseDown = (event: MouseEvent) => {
    event.preventDefault();

    lastDragStartPos = { x: event.clientX, y: event.clientY };
    isDragging = true;
  };

  const onDocumentMouseUp = (event: MouseEvent) => {
    if (!isDragging) {
      return;
    }

    event.preventDefault();

    isDragging = false;

    if (
      Math.abs(lastDragStartPos.x - event.clientX) +
        Math.abs(lastDragStartPos.y - event.clientY) <
      5
    ) {
      colorInputEl.click();
    }
  };

  const onDocumentMouseMove = (event: MouseEvent) => {
    if (!isDragging) {
      return;
    }

    event.preventDefault();

    const gradientStopBoundingBox =
      stopEl.parentElement.getBoundingClientRect();

    const percent =
      (event.clientX - gradientStopBoundingBox.left) /
      gradientStopBoundingBox.width;
    const clampedPercent = Math.max(0, Math.min(percent, 1));

    props.onMove(clampedPercent);
  };

  const onContextMenu = (event: PointerEvent) => {
    event.preventDefault();
    props.onDelete();
  };

  const onColorInputChange = (event: Event) => {
    event.preventDefault();
    props.onChange(colorInputEl.value);
  };

  onMount(() => {
    document.addEventListener('mouseup', onDocumentMouseUp);
    document.addEventListener('mousemove', onDocumentMouseMove);
  });

  onCleanup(() => {
    document.removeEventListener('mouseup', onDocumentMouseUp);
    document.removeEventListener('mousemove', onDocumentMouseMove);
  });

  return (
    <>
      <SingleInstanceStyle key="GradientColorStop">
        {stylesheet}
      </SingleInstanceStyle>
      <div
        class={styles['gradient-stop']}
        on:mousedown={onMouseDown}
        on:contextmenu={onContextMenu}
        ref={stopEl}
        style={{
          left: `${props.percent * 100}%`,
          'background-color': props.color,
          'z-index': Math.round(props.percent * 100),
        }}
      >
        <input
          type="color"
          value={props.color}
          on:input={onColorInputChange}
          ref={colorInputEl}
        />
      </div>
    </>
  );
};
