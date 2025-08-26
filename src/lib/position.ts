// mark DONOTCOMMIT:

export default class AnchorPosition {
  public get right() {
    return this.xAnchor === 'right' ? this.x : window.innerWidth - this.x;
  }

  public get left() {
    return this.xAnchor === 'left' ? this.x : window.innerWidth - this.x;
  }

  public get top() {
    return this.yAnchor === 'top' ? this.y : window.innerHeight - this.y;
  }

  public get bottom() {
    return this.yAnchor === 'bottom' ? this.y : window.innerHeight - this.y;
  }

  public get absoluteX() {
    return this.left;
  }

  public get absoluteY() {
    return this.right;
  }

  constructor(
    public x: number,
    public xAnchor: 'left' | 'right',
    public y: number,
    public yAnchor: 'top' | 'bottom',
  ) {}

  static fromJson(json: Record<string, number>) {
    let x: number;
    let xAnchor: 'left' | 'right';
    if ('left' in json) {
      x = json.left;
      xAnchor = 'left';
    } else if ('right' in json) {
      x = json.right;
      xAnchor = 'right';
    } else {
      throw new Error(`Missing x-anchor in anchor position JSON`);
    }

    let y: number;
    let yAnchor: 'top' | 'bottom';
    if ('top' in json) {
      y = json.top;
      yAnchor = 'top';
    } else if ('bottom' in json) {
      y = json.bottom;
      yAnchor = 'bottom';
    } else {
      throw new Error(`Missing y-anchor in anchor position JSON`);
    }

    return new AnchorPosition(x, xAnchor, y, yAnchor);
  }
}
