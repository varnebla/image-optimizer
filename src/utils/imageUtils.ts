import exifr from 'exifr';
import Pica from 'pica';

export type OptimizeOptions = {
  maxWidth: number;
  format: 'webp' | 'avif';
  quality: number;
  stripMetadata?: boolean;
};

export type OptimizeResult = {
  name: string;
  originalName: string;
  originalSize: number;
  optimizedSize: number;
  blob: Blob;
  width: number;
  height: number;
  originalWidth?: number;
  originalHeight?: number;
  exifOrientation?: number;
  processingTime?: number; // Tiempo en milisegundos
  format: string; // Formato final
};

/**
 * Redimensiona y convierte una imagen usando pica para resize de alta calidad.
 * Aplica orientación EXIF si es necesario.
 */
export async function optimizeImage(
  file: File,
  options: OptimizeOptions
): Promise<OptimizeResult> {
  // Leer orientación EXIF
  const arrayBuffer = await file.arrayBuffer();
  const exif = await exifr.orientation(arrayBuffer).catch(() => undefined);

  // Crear imagen desde el archivo
  const img = await createImageBitmap(file);
  let { width, height } = img;

  // Calcular nuevas dimensiones manteniendo proporción
  let targetWidth = width;
  let targetHeight = height;
  if (width > options.maxWidth) {
    targetWidth = options.maxWidth;
    targetHeight = Math.round((height * options.maxWidth) / width);
  }

  // Canvas fuente
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) throw new Error('No se pudo obtener contexto 2D');

  // Aplicar rotación EXIF si es necesario
  if (exif && exif !== 1) {
    applyExifRotation(sourceCtx, img, width, height, exif);
  } else {
    sourceCtx.drawImage(img, 0, 0);
  }

  // Canvas destino
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetWidth;
  targetCanvas.height = targetHeight;

  // Usar pica para resize de alta calidad
  const picaInstance = new Pica();
  await picaInstance.resize(sourceCanvas, targetCanvas, {
    quality: 3, // Alta calidad (0-3)
    alpha: true,
    unsharpAmount: 80,
    unsharpRadius: 0.6,
    unsharpThreshold: 2,
  });

  // Convertir a formato deseado
  let blob: Blob;
  
  if (options.format === 'avif') {
    // Usar @jsquash/avif desde CDN (esm.sh) para evitar problemas de bundling
    const avifModule = await import('https://esm.sh/@jsquash/avif' as unknown as string);
    const { encode } = avifModule as { encode: (imageData: ImageData) => Promise<Uint8Array> };
    
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo obtener contexto 2D');
    
    const imageData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
    
    // Codificar con @jsquash/avif
    const avifData = await encode(imageData);
    
    blob = new Blob([avifData as any], { type: 'image/avif' });
  } else {
    // Para WebP: usar Pica (optimizado)
    blob = await picaInstance.toBlob(
      targetCanvas,
      `image/${options.format}`,
      options.quality / 100
    );
  }

  // Generar nombre de archivo con extensión correcta
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const newName = `${baseName}.${options.format}`;

  return {
    name: newName,
    originalName: file.name,
    originalSize: file.size,
    optimizedSize: blob.size,
    blob,
    width: targetWidth,
    height: targetHeight,
    originalWidth: width,
    originalHeight: height,
    exifOrientation: exif,
    format: options.format,
  };
}

/**
 * Aplica rotación EXIF a un canvas.
 */
function applyExifRotation(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap,
  width: number,
  height: number,
  orientation: number
): void {
  switch (orientation) {
    case 2:
      // Espejo horizontal
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      // Rotación 180°
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      // Espejo vertical
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      // Espejo horizontal + rotación 90° CCW
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      // Rotación 90° CW
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      // Espejo horizontal + rotación 90° CW
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      // Rotación 90° CCW
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      // Orientación normal (1)
      break;
  }
  ctx.drawImage(img, 0, 0);
}
