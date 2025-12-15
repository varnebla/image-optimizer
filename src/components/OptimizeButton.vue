<template>
  <div class="-mt-2 mb-4 flex gap-2 items-center justify-center">
    <!-- Botón de ajustes (siempre visible) -->
    <button
      class="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition-all flex items-center justify-center gap-2 text-sm font-medium"
      @click="toggleSettings"
      :title="t('optimizeButton.settings') || 'Ajustes'"
      data-umami-event="Abrir ajustes"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span>{{ t('optimizeButton.settings') || 'Ajustes' }}</span>
    </button>

    <!-- Botón de re-optimizar (solo visible después de la primera optimización) -->
    <button
      v-if="results.length > 0"
      class="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm font-medium"
      :disabled="isProcessing || !files.length"
      @click="optimizeImages"
      data-umami-event="Re-optimizar imágenes"
    >
      <span
        v-if="isProcessing"
        class="animate-spin inline-block w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full"
      ></span>
      <svg
        v-else
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <span>{{ isProcessing ? t('optimizeButton.processing') : t('optimizeButton.reOptimize') || 'Re-optimizar' }}</span>
    </button>
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
  showSettings,
} from '@utils/imageStore';
import { generateZip } from '@utils/zipUtils';
import { optimizeImage } from '@utils/imageUtils';
import type { OptimizeResult } from '@utils/imageUtils';
import { useTranslations } from '@i18n/utils';
import type { Lang } from '@i18n/ui';

const props = defineProps<{
  lang: Lang;
}>();

const t = useTranslations(props.lang);

function toggleSettings() {
  showSettings.value = !showSettings.value;
}

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

  // Reiniciar progreso a 0 para todas las imágenes
  progress.value = files.value.map(f => ({ name: f.name, progress: 0 }));

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

    // NO limpiar archivos para permitir re-optimización con nuevos ajustes
  } catch (e: any) {
    console.error('Error en optimización:', e);
    error.value = e?.message || 'Error al optimizar las imágenes.';
  } finally {
    isProcessing.value = false;
  }
}
</script>
<style scoped>
.optimize-button:hover {
  box-shadow: 0 0 60px #3aed6d33,0 0 120px #5cf68a33,0 0 180px #28d95a33,0 12px 40px #0006,inset 0 2px #fff6,inset 0 -2px #0000004d
}
</style>
