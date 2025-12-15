<template>
  <!-- Card de resultados rediseñada -->
  <div
    v-if="show"
    class="my-6 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-200"
  >
    <!-- Título y mensaje de éxito -->
    <div class="mb-5 text-center">
      <h3 class="text-xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
        <span class="text-2xl">✅</span>
        {{ t('resultSummary.title') }}
      </h3>
      <p class="text-base text-gray-700">
        {{ t('progressList.saved') }} <span class="font-bold text-green-600">{{ savingPercent }}%</span>
      </p>
      <p class="text-sm text-gray-500 mt-1">
        {{ results.length }} {{ results.length === 1 ? t('imagePreview.image') : t('imagePreview.images') }} • {{ totalTimeFormatted }}
      </p>
    </div>

    <!-- Estadísticas con labels -->
    <div class="flex items-center justify-center gap-3 mb-6 text-sm flex-wrap">
      <div class="px-4 py-2 bg-gray-100 rounded-lg text-center">
        <div class="text-xs text-gray-500 mb-1">{{ t('resultSummary.originalLabel') }}</div>
        <div class="font-semibold text-gray-700">{{ originalSizeFormatted }}</div>
      </div>
      <div class="text-gray-400 text-xl">→</div>
      <div class="px-4 py-2 bg-blue-50 rounded-lg text-center">
        <div class="text-xs text-blue-600 mb-1">{{ t('resultSummary.optimizedLabel') }}</div>
        <div class="font-semibold text-blue-600">{{ optimizedSizeFormatted }}</div>
      </div>
      <div class="px-4 py-2 bg-green-50 rounded-lg text-center">
        <div class="text-xs text-green-600 mb-1">{{ t('resultSummary.savingsLabel') }}</div>
        <div class="font-semibold text-green-600">{{ savedSizeFormatted }}</div>
      </div>
    </div>

    <!-- Botón de descarga con degradado lime -->
    <button
      class="w-full px-8 py-4 bg-gradient-to-r from-lime-400 via-lime-500 to-lime-600 text-white rounded-xl shadow-lg hover:shadow-lime-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-bold text-lg flex items-center justify-center gap-3 group"
      style="background: linear-gradient(45deg, rgb(163, 230, 53), rgb(132, 204, 22), rgb(101, 163, 13));"
      @click="downloadZip"
      data-umami-event="Descargar imágenes"
      :data-umami-event-archivos="results.length"
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      {{ t('resultSummary.downloadZip') }}
    </button>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import { results, zipBlob, options } from '@utils/imageStore';
import type { OptimizeResult } from '@utils/imageUtils';
import { useTranslations } from '@i18n/utils';
import type { Lang } from '@i18n/ui';

const props = defineProps<{
  lang: Lang;
}>();

const t = useTranslations(props.lang);

const show = computed(() => results.value.length > 0 && zipBlob.value !== null);

// Tamaños en KB
const originalSizeKB = computed(
  () =>
    results.value.reduce(
      (acc: number, r: OptimizeResult) => acc + r.originalSize,
      0
    ) / 1024
);

const optimizedSizeKB = computed(
  () =>
    results.value.reduce(
      (acc: number, r: OptimizeResult) => acc + r.optimizedSize,
      0
    ) / 1024
);

const savedSizeKB = computed(
  () => originalSizeKB.value - optimizedSizeKB.value
);

/**
 * Formatea un tamaño en KB a una representación legible (KB o MB).
 * @param sizeInKB Tamaño en kilobytes
 * @returns String formateado con unidad apropiada
 */
function formatSize(sizeInKB: number): string {
  if (sizeInKB >= 1000) {
    const sizeInMB = sizeInKB / 1024;
    return `${sizeInMB.toFixed(2)} MB`;
  }
  return `${sizeInKB.toFixed(2)} KB`;
}

// Tamaños formateados
const originalSizeFormatted = computed(() => formatSize(originalSizeKB.value));
const optimizedSizeFormatted = computed(() =>
  formatSize(optimizedSizeKB.value)
);
const savedSizeFormatted = computed(() => formatSize(savedSizeKB.value));

const savingPercent = computed(() =>
  originalSizeKB.value
    ? Math.round(100 - (optimizedSizeKB.value * 100) / originalSizeKB.value)
    : 0
);

// Tiempo total de procesamiento
const totalTimeMs = computed(() =>
  results.value.reduce((acc, r) => acc + (r.processingTime || 0), 0)
);

const totalTimeFormatted = computed(() => {
  const seconds = Math.round(totalTimeMs.value / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
});

const pictureSnippet = computed(() => {
  if (!results.value.length) return '';
  const firstImage = results.value[0].name;
  const baseName = firstImage.replace(/\.[^/.]+$/, '');
  const format = options.format;
  // Generar snippet <picture> con formato optimizado
  return `<picture>
  <source srcset="${baseName}.${format}" type="image/${format}">
  <img src="${baseName}.${format}" alt="Imagen optimizada" loading="lazy">
</picture>`;
});

function downloadZip() {
  if (!zipBlob.value) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(zipBlob.value);
  a.download = `imagenes-optimizadas-${Date.now()}.zip`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function selectSnippet(e: Event) {
  (e.target as HTMLTextAreaElement).select();
}

async function copySnippet() {
  try {
    await navigator.clipboard.writeText(pictureSnippet.value);
    alert('✅ ' + t('resultSummary.snippetCopied'));
  } catch (err) {
    console.error('Error al copiar:', err);
  }
}
</script>
