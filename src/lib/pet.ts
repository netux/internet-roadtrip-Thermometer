import { RAD_TO_DEG } from '../constants';

export interface PetOptions {
  sampleRate: number;
  max: number;
  threshold: number;
  activation: number;
  angleMin: number;
  angleMax: number;
  neglect: number;
}

export class Pet extends EventTarget {
  petEl: Element;
  options: PetOptions;

  #interval: NodeJS.Timeout | null = null;

  #mousePositionInsidePet: { x: number; y: number } | null = null;
  #lastMousePositionInsidePet: { x: number; y: number } | null = null;
  #lastAngle: number | null = null;

  #scratchCounter = 0;
  #samplesBeingPet = 0;
  #lastEventDispatchWasPettingStart = false;

  constructor(petEl: Element, options: PetOptions) {
    super();

    this.petEl = petEl;
    this.options = options;

    this.start();
  }

  start() {
    this.#interval = setInterval(
      this.#sample.bind(this),
      this.options.sampleRate,
    );

    this.#mousePositionInsidePet = null;
    this.petEl.addEventListener(
      'mousemove',
      this.#handlePetElMouseMove.bind(this),
    );
    this.petEl.addEventListener(
      'mouseleave',
      this.#handlePetElMouseLeave.bind(this),
    );
  }

  stop() {
    clearInterval(this.#interval);
    this.#interval = null;

    this.petEl.removeEventListener('mousemove', this.#handlePetElMouseMove);
    this.petEl.removeEventListener('mouseleave', this.#handlePetElMouseLeave);
  }

  #handlePetElMouseMove = (event: MouseEvent) => {
    const { clientX, clientY } = event;
    this.#mousePositionInsidePet = {
      x: clientX,
      y: clientY,
    };
  };

  #handlePetElMouseLeave = (_event: MouseEvent) => {
    this.#mousePositionInsidePet = null;
  };

  #sample() {
    if (
      this.#lastMousePositionInsidePet != null &&
      this.#mousePositionInsidePet != null
    ) {
      const normalizedX =
        this.#mousePositionInsidePet.x - this.#lastMousePositionInsidePet.x;
      const normalizedY =
        this.#mousePositionInsidePet.y - this.#lastMousePositionInsidePet.y;

      const angle = Math.atan2(normalizedX, normalizedY) * RAD_TO_DEG;

      if (this.#lastAngle != null) {
        const anglesDistance = ((this.#lastAngle - angle + 180) % 360) - 180;
        const absAnglesDistance = Math.abs(anglesDistance);

        // console.debug(MOD_LOG_PREFIX, 'absAnglesDistance:', absAnglesDistance);

        if (
          absAnglesDistance > this.options.angleMin + 180 &&
          absAnglesDistance < this.options.angleMax + 180
        ) {
          this.#scratchCounter = Math.min(
            this.#scratchCounter + 1,
            this.options.max,
          );
        }

        const isBeingPet = this.#scratchCounter > this.options.threshold;
        if (isBeingPet) {
          this.#samplesBeingPet = Math.min(
            this.#samplesBeingPet + 1,
            this.options.activation,
          );
        } else {
          this.#samplesBeingPet = Math.max(0, this.#samplesBeingPet - 1);
        }

        // console.debug(MOD_LOG_PREFIX, 'isBeingPet:', isBeingPet);
        // console.debug(MOD_LOG_PREFIX, 'samplesBeingPet:', this.#samplesBeingPet);

        if (isBeingPet && this.#samplesBeingPet >= this.options.activation) {
          if (!this.#lastEventDispatchWasPettingStart) {
            this.dispatchEvent(new Event('petting-start'));
            this.#lastEventDispatchWasPettingStart = true;
          }
        } else {
          if (this.#lastEventDispatchWasPettingStart) {
            this.dispatchEvent(new Event('petting-end'));
            this.#lastEventDispatchWasPettingStart = false;
          }
        }
      }

      this.#lastAngle = angle;
    } else {
      this.#lastAngle = null;

      this.#samplesBeingPet = Math.max(0, this.#samplesBeingPet - 0.75);
      if (
        this.#samplesBeingPet === 0 &&
        this.#lastEventDispatchWasPettingStart
      ) {
        this.dispatchEvent(new Event('petting-end'));
        this.#lastEventDispatchWasPettingStart = false;
      }
    }

    this.#lastMousePositionInsidePet = this.#mousePositionInsidePet;
    this.#scratchCounter = Math.max(
      0,
      this.#scratchCounter - this.options.neglect,
    );
  }
}
