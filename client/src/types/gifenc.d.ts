declare module "gifenc" {
  export type GifEncoderInstance = {
    writeFrame(index: Uint8Array, width: number, height: number, options?: { palette?: number[][]; delay?: number; repeat?: number }): void;
    finish(): void;
    bytesView(): Uint8Array;
  };

  export function GIFEncoder(options?: { initialCapacity?: number; auto?: boolean }): GifEncoderInstance;
  export function quantize(data: Uint8ClampedArray, maxColors: number): number[][];
  export function applyPalette(data: Uint8ClampedArray, palette: number[][]): Uint8Array;
}
