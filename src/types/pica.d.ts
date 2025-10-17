declare module 'pica' {
  export interface PicaResizeOptions {
    quality?: number;
    alpha?: boolean;
    unsharpAmount?: number;
    unsharpRadius?: number;
    unsharpThreshold?: number;
  }

  export default class Pica {
    constructor(options?: { features?: string[] });

    resize(
      src: HTMLCanvasElement | ImageBitmap,
      dest: HTMLCanvasElement,
      options?: PicaResizeOptions
    ): Promise<HTMLCanvasElement>;

    toBlob(
      canvas: HTMLCanvasElement,
      mimeType?: string,
      quality?: number
    ): Promise<Blob>;
  }
}
