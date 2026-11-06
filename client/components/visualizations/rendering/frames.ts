/** Adapted from guide/visualizations/shared/frames.ts: redraw only after invalidation. */
export const MAX_PIXEL_RATIO = 2;
export class FrameScheduler {
  private frame: number | null = null;
  constructor(
    private readonly render: () => void,
    private readonly requestFrame: (callback: FrameRequestCallback) => number = (callback) =>
      requestAnimationFrame(callback),
    private readonly cancelFrame: (id: number) => void = (id) => cancelAnimationFrame(id),
  ) {}
  request(): void {
    if (this.frame !== null) {
      return;
    }
    this.frame = this.requestFrame(() => {
      this.frame = null;
      this.render();
    });
  }
  dispose(): void {
    if (this.frame !== null) {
      this.cancelFrame(this.frame);
      this.frame = null;
    }
  }
}
