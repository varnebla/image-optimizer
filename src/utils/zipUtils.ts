import JSZip from 'jszip';
import type { OptimizeResult } from './imageUtils';

/**
 * Empaqueta los resultados optimizados en un archivo ZIP.
 * @param results Array de resultados de optimización
 * @returns Blob ZIP listo para descargar
 */
export async function generateZip(results: OptimizeResult[]): Promise<Blob> {
  const zip = new JSZip();
  for (const result of results) {
    zip.file(result.name, result.blob);
  }
  return await zip.generateAsync({ type: 'blob' });
}
