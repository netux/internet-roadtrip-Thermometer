import styles, { stylesheet } from './heart.module.css';

export class Heart {
  el: HTMLElement;

  lifetime: number;
  maxLifetime: number;

  x: number;
  y: number;
  velocityX: number;
  velocityY: number;

  lastUpdateTimestamp: number;

  constructor({ initialPosX, initialPosY, velocityX, velocityY, maxLifetime }) {
    this.el = document.createElement('div');
    this.el.classList.add(styles['petting-heart']);
    document.body.append(this.el);

    this.maxLifetime = maxLifetime;
    this.lifetime = this.maxLifetime;

    this.x = initialPosX;
    this.y = initialPosY;
    this.velocityX = velocityX;
    this.velocityY = velocityY;

    this.lastUpdateTimestamp = Date.now();
    this.update();
  }

  update() {
    this.lifetime -= Date.now() - this.lastUpdateTimestamp;
    if (this.lifetime <= 0) {
      this.el.remove();
      return;
    }

    this.x += this.velocityX;
    this.y += this.velocityY;

    this.el.style.left = `${this.x}px`;
    this.el.style.top = `${this.y}px`;
    this.el.style.scale = (this.lifetime / this.maxLifetime).toString(10);
    this.el.style.opacity = ((1.5 * this.lifetime) / this.maxLifetime).toString(
      10,
    );

    this.lastUpdateTimestamp = Date.now();
    requestAnimationFrame(this.update.bind(this));
  }
}

GM_addStyle(stylesheet);

export const heartStyles = styles;
