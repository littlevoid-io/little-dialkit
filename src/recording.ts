/** Containers in order of choice: MP4 plays and seeks everywhere; Chrome's WebM carries no duration. */
const TYPES = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm'];

/** Encoder bits per second for each canvas pixel: 16 Mbit/s at 1920 x 1080. The browser's own rate (2.5 Mbit/s) smears fine detail. */
const BITS_PER_PIXEL = 8;

/** A running video recording of a canvas: a frame whenever the canvas is drawn, encoded as it plays. */
export class Recording {
  private readonly recorder: MediaRecorder;
  private readonly chunks: Blob[] = [];

  /** `onDone` is called with the video once `stop` has ended it. */
  constructor(canvas: HTMLCanvasElement, onDone: (video: Blob) => void) {
    this.recorder = new MediaRecorder(canvas.captureStream(), {
      mimeType: TYPES.find((type) => MediaRecorder.isTypeSupported(type)),
      videoBitsPerSecond: canvas.width * canvas.height * BITS_PER_PIXEL,
    });
    this.recorder.addEventListener('dataavailable', ({ data }) => this.chunks.push(data));
    this.recorder.addEventListener('stop', () => onDone(new Blob(this.chunks, { type: this.recorder.mimeType })));
    this.recorder.start();
  }

  public stop(): void {
    this.recorder.stop();
    for (const track of this.recorder.stream.getTracks()) track.stop();
  }
}
