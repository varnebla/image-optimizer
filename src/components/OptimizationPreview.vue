<template>
  <div
    class="my-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
  >
    <div class="flex items-center gap-2 mb-3">
      <span class="text-2xl">🔮</span>
      <h3 class="text-lg font-semibold text-gray-800">
        Previsión de Optimización
      </h3>
    </div>

    <!-- Resumen de configuración actual -->
    <div class="mb-4 p-3 bg-white rounded-lg border border-gray-200">
      <p class="text-sm text-gray-600 mb-2">
        <strong>Configuración actual:</strong>
      </p>
      <div class="flex flex-wrap gap-4 text-sm">
        <span class="flex items-center gap-1">
          <span class="font-medium">📏</span>
          {{ options.maxWidth }}px máximo
        </span>
        <span class="flex items-center gap-1">
          <span class="font-medium">🎨</span>
          {{ options.format.toUpperCase() }}
        </span>
        <span class="flex items-center gap-1">
          <span class="font-medium">⭐</span>
          Calidad {{ options.quality }}%
        </span>
      </div>
    </div>

    <!-- Estadísticas de previsión -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <!-- Tamaño original estimado -->
      <div class="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
        <p class="text-xs text-gray-600 mb-1">Tamaño Original Estimado</p>
        <p class="text-xl font-bold text-gray-800">
          {{ estimate.originalSizeMB }} MB
        </p>
        <p class="text-xs text-gray-500">por imagen típica</p>
      </div>

      <!-- Tamaño optimizado estimado -->
      <div class="p-3 bg-white rounded-lg shadow-sm border border-blue-200">
        <p class="text-xs text-blue-600 mb-1">Tamaño Optimizado Estimado</p>
        <p class="text-xl font-bold text-blue-800">
          {{ estimate.estimatedSizeMB }} MB
        </p>
        <p class="text-xs text-blue-500">por imagen típica</p>
      </div>

      <!-- Ahorro estimado -->
      <div class="p-3 bg-white rounded-lg shadow-sm border border-green-200">
        <p class="text-xs text-green-600 mb-1">Ahorro Estimado</p>
        <p class="text-xl font-bold text-green-800">
          {{ estimate.savingsMB }} MB
        </p>
        <p class="text-xs text-green-500">
          {{ estimate.savingsPercent }}% reducción
        </p>
      </div>
    </div>

    <!-- Proyección para múltiples imágenes -->
    <div
      v-if="files.length > 1"
      class="p-3 bg-indigo-50 rounded-lg border border-indigo-200"
    >
      <p class="text-sm text-indigo-700">
        <strong>Proyección total ({{ files.length }} imágenes):</strong><br />
        De {{ (estimate.originalSizeMB * files.length).toFixed(1) }} MB →
        {{ (estimate.estimatedSizeMB * files.length).toFixed(1) }} MB<br />
        <span class="font-semibold">
          Ahorro total: {{ (estimate.savingsMB * files.length).toFixed(1) }} MB
          ({{ estimate.savingsPercent }}%)
        </span>
      </p>
    </div>

    <!-- Información adicional -->
    <div class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <p class="text-xs text-gray-600 mb-1">
            <strong>📊 Datos reales de tus imágenes:</strong>
          </p>
          <p class="text-xs text-gray-700">
            Tamaño promedio:
            <strong>{{ realStats.averageSizeFormatted }}</strong>
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-600">
            💡 <strong>Nota:</strong> Esta es una estimación basada en imágenes
            típicas. El ahorro real puede variar según el contenido específico
            de tus imágenes.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { options } from '../utils/imageStore';
import { files } from '../utils/imageStore';
import {
  estimateOptimization,
  getEstimateExplanation,
} from '../utils/optimizationEstimator';
import { formatBytes } from '../utils/fileValidation';

// Constante para mostrar en la nota
const AVERAGE_IMAGE_SIZE_KB = 800;

const estimate = computed(() => {
  return estimateOptimization(options, files.value.length);
});

const explanation = computed(() => {
  return getEstimateExplanation(estimate.value, files.value.length);
});

// Estadísticas reales de archivos seleccionados
const realStats = computed(() => {
  if (files.value.length === 0) {
    return {
      totalSize: 0,
      averageSize: 0,
      averageSizeFormatted: '0 KB',
    };
  }

  const totalSize = files.value.reduce((acc, file) => acc + file.size, 0);
  const averageSize = totalSize / files.value.length;

  return {
    totalSize,
    averageSize,
    averageSizeFormatted: formatBytes(averageSize),
  };
});

// Actualizar estimación cuando cambien los parámetros
watch(
  () => [options.maxWidth, options.format, options.quality, files.value.length],
  () => {
    // Forzar recálculo del computed
    estimate.value;
  }
);
</script>
