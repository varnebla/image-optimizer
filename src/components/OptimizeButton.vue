<template>
  <div class="my-6">
    <button
      class="w-full px-8 py-4 bg-blue-600 text-white rounded-lg shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center justify-center gap-3 text-lg"
      :disabled="isProcessing || !files.length"
      @click="optimizeImages"
      data-umami-event="Optimizar imágenes"
    >
      <span
        v-if="isProcessing"
        class="animate-spin inline-block w-6 h-6 border-3 border-white border-t-transparent rounded-full"
      ></span>
      <svg
        v-else
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      <span>{{ isProcessing ? 'Procesando...' : 'Optimizar Imágenes' }}</span>
    </button>
    <div
      v-if="error"
      class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
    >
      <p class="text-red-700 font-medium">❌ {{ error }}</p>
    </div>
    <div
      v-if="!error && !isProcessing && results.length"
      class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
    >
      <p class="text-green-700 font-medium">
        ✅ ¡Imágenes optimizadas correctamente!
      </p>
    </div>
  </div>
</template>
<script lang="ts" setup>
import {
  files,
  options,
  progress,
  results,
  sessionLog,
  zipBlob,
  isProcessing,
  error,
  validationInfo,
} from '@utils/imageStore';
import { generateZip } from '@utils/zipUtils';
import { optimizeImage } from '@utils/imageUtils';
import type { OptimizeResult } from '@utils/imageUtils';

/**
 * Procesa las imágenes de forma asíncrona.
 * Aunque no usamos Web Worker, el procesamiento es async y no bloquea la UI
 * porque las APIs de Canvas y Pica ya son asíncronas.
 */
async function optimizeImages() {
  if (!files.value.length) return;
  isProcessing.value = true;
  error.value = '';
  results.value = [];

  try {
    const optimizedResults: OptimizeResult[] = [];

    // Procesar cada imagen secuencialmente
    for (let i = 0; i < files.value.length; i++) {
      const file = files.value[i];

      // Actualizar progreso: iniciando
      progress.value[i] = { name: file.name, progress: 50 };

      try {
        console.log(`Procesando ${i + 1}/${files.value.length}: ${file.name}`);

        // Medir tiempo de procesamiento
        const startTime = performance.now();

        // Optimizar la imagen
        const result = await optimizeImage(file, options);

        // Calcular tiempo transcurrido
        const endTime = performance.now();
        const processingTime = Math.round(endTime - startTime);

        // Agregar tiempo al resultado
        result.processingTime = processingTime;

        optimizedResults.push(result);

        // Actualizar progreso: completado
        progress.value[i] = { name: file.name, progress: 100 };

        console.log(
          `✓ Completado: ${result.name} (${(
            result.optimizedSize / 1024
          ).toFixed(2)} KB) en ${processingTime}ms`
        );

        // Agregar al log de sesión
        sessionLog.value.push({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          fileName: result.originalName,
          originalSize: result.originalSize,
          optimizedSize: result.optimizedSize,
          format: result.format,
          savingsPercentage:
            ((result.originalSize - result.optimizedSize) / result.originalSize) *
            100,
        });

        // Dar tiempo al navegador para actualizar la UI
        await new Promise((resolve) => setTimeout(resolve, 10));
      } catch (err) {
        console.error(`Error procesando ${file.name}:`, err);
        throw new Error(
          `Error al procesar ${file.name}: ${
            err instanceof Error ? err.message : 'Error desconocido'
          }`
        );
      }
    }

    results.value = optimizedResults;

    // Generar ZIP
    console.log('Generando archivo ZIP...');
    zipBlob.value = await generateZip(optimizedResults);
    console.log('✓ ZIP generado correctamente');

    // Limpiar estado de entrada para permitir nueva carga
    files.value = [];
    progress.value = [];
    validationInfo.hasWarnings = false;
    validationInfo.warnings = [];
    validationInfo.rejectedFiles = [];
    validationInfo.stats = null;
  } catch (e: any) {
    console.error('Error en optimización:', e);
    error.value = e?.message || 'Error al optimizar las imágenes.';
  } finally {
    isProcessing.value = false;
  }
}
</script>
