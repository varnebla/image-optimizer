<template>
  <div
    v-if="show"
    class="my-8 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-lg border border-green-200"
  >
    <h2 class="text-2xl font-bold mb-4 text-green-800">
      🎉 ¡Optimización completada!
    </h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-sm text-gray-600 mb-1">Peso Original</p>
        <p class="text-2xl font-bold text-gray-800">
          {{ originalSizeFormatted }}
        </p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-sm text-gray-600 mb-1">Peso Optimizado</p>
        <p class="text-2xl font-bold text-blue-600">
          {{ optimizedSizeFormatted }}
        </p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-sm text-gray-600 mb-1">Ahorro</p>
        <p class="text-2xl font-bold text-green-600">
          {{ savedSizeFormatted }}
        </p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <p class="text-sm text-gray-600 mb-1">Porcentaje</p>
        <p class="text-2xl font-bold text-green-600">{{ savingPercent }}%</p>
      </div>
    </div>
    <button
      class="w-full px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
      @click="downloadZip"
      data-umami-event="Descargar imágenes"
      :data-umami-event-number="results.length"
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
      Descargar ZIP con todas las imágenes
    </button>
    <div v-if="pictureSnippet" class="mt-6">
      <label class="block font-bold mb-2 text-gray-700"
        >Snippet HTML &lt;picture&gt; (ejemplo):</label
      >
      <textarea
        readonly
        :value="pictureSnippet"
        class="w-full h-32 border border-gray-300 rounded-lg p-3 font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="selectSnippet"
      ></textarea>
      <button
        class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        @click="copySnippet"
        data-umami-event="Copiar snippet al portapapeles"
      >
        📋 Copiar al portapapeles
      </button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import { results, zipBlob, options } from '@utils/imageStore';
import type { OptimizeResult } from '@utils/imageUtils';

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
    alert('✅ Snippet copiado al portapapeles');
  } catch (err) {
    console.error('Error al copiar:', err);
  }
}
</script>
