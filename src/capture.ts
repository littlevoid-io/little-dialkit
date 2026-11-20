import type { DialConfig } from 'dialkit/vanilla';
import { maxBy } from 'es-toolkit';
import { download } from './download';
import type { Panel } from './panel';
import { Recording } from './recording';

/** Where the canvas to capture comes from: asked on every capture, so a canvas mounted after the panel is found. */
export type CanvasSource = () => HTMLCanvasElement | null | undefined;

/** `2026-11-20-143205`, in local time. */
export function stamp(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 19).replace('T', '-').replaceAll(':', '');
}

/** `<panel id>-<version name>-<stamp>.<extension>`; what a file name cannot hold becomes `-`. */
export function fileName(id: string, version: string, date: Date, extension: string): string {
  return `${id}-${version}-${stamp(date)}.${extension}`.replaceAll(/[^\w.-]+/g, '-');
}

function area(canvas: HTMLCanvasElement): number {
  return canvas.clientWidth * canvas.clientHeight;
}

/** The largest visible canvas of the page, the panels' own left out. */
export function largestCanvas(): HTMLCanvasElement | undefined {
  const canvases = [...document.querySelectorAll('canvas')];
  return maxBy(canvases.filter((canvas) => canvas.checkVisibility() && area(canvas) > 0 && !canvas.closest('.little-dialkit')), area);
}

/**
 * The canvas as a PNG, at its own resolution. Read in an animation frame, after the page's callback has drawn:
 * outside of one, a WebGL canvas without `preserveDrawingBuffer` is blank. A page that draws on demand needs that flag.
 */
export function snapshot(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => requestAnimationFrame(() => {
    canvas.toBlob((image) => (image ? resolve(image) : reject(new Error('The canvas gave no image'))), 'image/png');
  }));
}

/** Screenshot and video recording of the page's canvas, downloaded as files named after the panel and the selected version. */
export class Capture {
  /** Called when a recording starts (true) and when it stops (false). */
  public onRecording?: (recording: boolean) => void;
  private recording: Recording | undefined;

  constructor(
    private readonly panel: Pick<Panel<DialConfig>, 'kit' | 'versions' | 'prompt'>,
    private readonly source: CanvasSource = largestCanvas,
  ) {}

  /** Downloads the canvas as a PNG. */
  public async screenshot(): Promise<void> {
    const canvas = this.canvas();
    if (canvas) this.save(await snapshot(canvas), 'png');
  }

  /** Starts a recording, or stops the running one and downloads it (MP4 where the browser records it, else WebM). */
  public record(): void {
    if (this.recording) return this.recording.stop();
    const canvas = this.canvas();
    if (!canvas) return;
    this.recording = new Recording(canvas, (video) => this.finish(video));
    this.onRecording?.(true);
  }

  /** Stops a running recording; it is still downloaded. */
  public destroy(): void {
    this.recording?.stop();
  }

  private canvas(): HTMLCanvasElement | undefined {
    const canvas = this.source() ?? undefined;
    if (!canvas) this.panel.prompt.ask({ text: 'There is no canvas on this page to capture.', choices: {} });
    return canvas;
  }

  private finish(video: Blob): void {
    this.recording = undefined;
    this.onRecording?.(false);
    this.save(video, video.type.includes('mp4') ? 'mp4' : 'webm');
  }

  private save(file: Blob, extension: string): void {
    download(fileName(this.panel.kit.id, this.panel.versions.active.name, new Date(), extension), file);
  }
}
