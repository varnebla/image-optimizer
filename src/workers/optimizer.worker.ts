import type { OptimizeOptions, OptimizeResult } from '../utils/imageUtils';
import { optimizeImage } from '../utils/imageUtils';
import * as Comlink from 'comlink';

/**
 * Worker para procesar imágenes de forma concurrente.
 * Recibe archivos y opciones, devuelve resultados optimizados.
 * Procesa las imágenes secuencialmente para evitar sobrecarga de memoria.
 */
const workerApi = {
  /**
   * Procesa un array de archivos de imagen y los optimiza según las opciones proporcionadas.
   * @param files Array de archivos a procesar
   * @param options Opciones de optimización (maxWidth, format, quality)
   * @returns Array de resultados con las imágenes optimizadas
   */
  async process(
    files: File[],
    options: OptimizeOptions
  ): Promise<OptimizeResult[]> {
    const results: OptimizeResult[] = [];

    // Procesar imágenes secuencialmente para evitar sobrecarga de memoria
    // En el futuro se puede implementar procesamiento en lotes (batches)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(
          `[Worker] Procesando imagen ${i + 1}/${files.length}: ${file.name}`
        );
        const result = await optimizeImage(file, options);
        results.push(result);
        console.log(
          `[Worker] ✓ Completado: ${result.name} (${(
            result.optimizedSize / 1024
          ).toFixed(2)} KB)`
        );
      } catch (error) {
        console.error(`[Worker] Error procesando ${file.name}:`, error);
        throw new Error(
          `Error al procesar ${file.name}: ${
            error instanceof Error ? error.message : 'Error desconocido'
          }`
        );
      }
    }

    return results;
  },
};

Comlink.expose(workerApi);
