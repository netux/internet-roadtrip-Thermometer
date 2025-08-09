/*
 * This whole file is heavily based on https://github.com/violentmonkey/vm-ui/blob/00592622a01e48a4ac27a743254d82b1ebcd6d02/src/util/movable.ts
 * with the following modifications:
 * - Make Movable an EventTarget
 *   - Add move-start, moving, and move-end events to Movable
 *   - Replaces the old onMoved callback in MovableOptions
 * - Add handler elements system to Movable
 * - Add methods to retrieve and set position of the Movable
 * - Add support for touch events
 */

export interface MovableOrigin {
  x: 'auto' | 'start' | 'end';
  y: 'auto' | 'start' | 'end';
}

export interface MovableOptions {
  origin: MovableOrigin;
  handlerElements?: Element[];
}

export class Movable extends EventTarget {
  static defaultOptions: MovableOptions = {
    origin: { x: 'auto', y: 'auto' },
  };

  el: HTMLElement | null = null;
  options: MovableOptions = null;

  private dragging: { x: number; y: number } = null;
  private touchIdentifier?: number;

  constructor(el: HTMLElement, options?: MovableOptions) {
    super();

    this.el = el;

    this.setOptions(options);
  }

  setOptions(options: MovableOptions) {
    this.options = {
      ...Movable.defaultOptions,
      ...options,
    };
  }

  applyOptions(newOptions: Partial<MovableOptions>) {
    this.options = {
      ...this.options,
      ...newOptions,
    };
  }

  isTouchEvent = (e: Event): e is TouchEvent => e.type.startsWith('touch');
  getEventPointerPosition = (e) => {
    if (this.isTouchEvent(e)) {
      const { clientX, clientY } = e.touches[this.touchIdentifier];
      return { clientX, clientY };
    } else {
      const { clientX, clientY } = e;
      return { clientX, clientY };
    }
  };

  onMouseDown = (e: MouseEvent | TouchEvent) => {
    if (this.isTouchEvent(e)) {
      this.touchIdentifier = e.changedTouches?.[0]?.identifier;
    }

    const { handlerElements = [] } = this.options;
    if (
      handlerElements.length > 0 &&
      !handlerElements.some(
        (handlerEl) =>
          e.target === handlerEl || handlerEl.contains(e.target as Element),
      )
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const { x, y } = this.el.getBoundingClientRect();
    const { clientX, clientY } = this.getEventPointerPosition(e);
    this.dragging = { x: clientX - x, y: clientY - y };
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('touchmove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('touchend', this.onMouseUp);

    this.dispatchEvent(new Event('move-start'));
  };

  onMouseMove = (e: MouseEvent | TouchEvent) => {
    if (
      this.isTouchEvent(e) &&
      this.touchIdentifier != null &&
      !Array.from(e.changedTouches).some(
        (touch) => this.touchIdentifier === touch.identifier,
      )
    )
      return;
    if (!this.dragging) return;
    const { x, y } = this.dragging;
    const { clientX, clientY } = this.getEventPointerPosition(e);

    this.setPosition(clientX - x, clientY - y);
  };

  onMouseUp = (e: MouseEvent | TouchEvent) => {
    if (
      this.isTouchEvent(e) &&
      this.touchIdentifier != null &&
      !Array.from(e.changedTouches).some(
        (touch) => this.touchIdentifier === touch.identifier,
      )
    )
      return;

    this.dragging = null;
    this.touchIdentifier = null;

    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('touchmove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('touchend', this.onMouseUp);

    this.dispatchEvent(new Event('move-end'));
  };

  enable() {
    this.el.addEventListener('mousedown', this.onMouseDown);
    this.el.addEventListener('touchstart', this.onMouseDown);
  }

  disable() {
    this.dragging = undefined;
    this.el.removeEventListener('mousedown', this.onMouseDown);
    this.el.removeEventListener('touchstart', this.onMouseDown);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('touchmove', this.onMouseUp);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('touchend', this.onMouseUp);
  }

  setPosition(x: number, y: number) {
    const { origin } = this.options;

    const { offsetWidth: width, offsetHeight: height } = this.el;
    const { clientWidth, clientHeight } = document.documentElement;
    const left = Math.max(0, Math.min(x, clientWidth - width));
    const top = Math.max(0, Math.min(y, clientHeight - height));

    const position = {
      top: 'auto',
      left: 'auto',
      right: 'auto',
      bottom: 'auto',
    };

    if (
      origin.x === 'start' ||
      (origin.x === 'auto' && left + left + width < clientWidth)
    ) {
      position.left = `${left}px`;
    } else {
      position.right = `${clientWidth - left - width}px`;
    }
    if (
      origin.y === 'start' ||
      (origin.y === 'auto' && top + top + height < clientHeight)
    ) {
      position.top = `${top}px`;
    } else {
      position.bottom = `${clientHeight - top - height}px`;
    }

    Object.assign(this.el.style, position);

    this.dispatchEvent(new Event('moving'));
  }

  getPosition() {
    const { left, top } = this.el.getBoundingClientRect();
    return { left, top };
  }
}
