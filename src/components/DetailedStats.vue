<template>
  <div v-if="results.length > 0" class="my-8">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-gray-800">
        📊 Estadísticas Detalladas
      </h2>
      <button
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2"
        @click="exportToCSV"
        data-umami-event="Exportar CSV"
      >
        📥 Exportar CSV
      </button>
    </div>

    <!-- Resumen general -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p class="text-sm text-blue-700 mb-1">Total Procesadas</p>
        <p class="text-2xl font-bold text-blue-900">{{ results.length }}</p>
      </div>
      <div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <p class="text-sm text-purple-700 mb-1">Tiempo Total</p>
        <p class="text-2xl font-bold text-purple-900">{{ totalTime }}s</p>
      </div>
      <div class="p-4 bg-green-50 rounded-lg border border-green-200">
        <p class="text-sm text-green-700 mb-1">Ahorro Promedio</p>
        <p class="text-2xl font-bold text-green-900">{{ avgSavings }}%</p>
      </div>
      <div class="p-4 bg-orange-50 rounded-lg border border-orange-200">
        <p class="text-sm text-orange-700 mb-1">Tamaño Promedio</p>
        <p class="text-2xl font-bold text-orange-900">{{ avgSize }}</p>
      </div>
    </div>

    <!-- Tabla de resultados -->
    <div
      class="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
    >
      <!-- Header de la tabla -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                class="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                @click="sortBy('originalName')"
              >
                Archivo {{ getSortIcon('originalName') }}
              </th>
              <th
                class="px-4 py-3 text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                @click="sortBy('originalSize')"
              >
                Original {{ getSortIcon('originalSize') }}
              </th>
              <th
                class="px-4 py-3 text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                @click="sortBy('optimizedSize')"
              >
                Optimizado {{ getSortIcon('optimizedSize') }}
              </th>
              <th
                class="px-4 py-3 text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                @click="sortBy('savings')"
              >
                Ahorro {{ getSortIcon('savings') }}
              </th>
              <th class="px-4 py-3 text-center font-semibold text-gray-700">
                Dimensiones
              </th>
              <th class="px-4 py-3 text-center font-semibold text-gray-700">
                Formato
              </th>
              <th
                class="px-4 py-3 text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                @click="sortBy('processingTime')"
              >
                Tiempo {{ getSortIcon('processingTime') }}
              </th>
              <th class="px-4 py-3 text-center font-semibold text-gray-700">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(result, index) in sortedResults"
              :key="index"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3 font-medium text-gray-900">
                {{ result.originalName }}
              </td>
              <td class="px-4 py-3 text-right text-gray-700">
                {{ formatBytes(result.originalSize) }}
              </td>
              <td class="px-4 py-3 text-right text-blue-600 font-medium">
                {{ formatBytes(result.optimizedSize) }}
              </td>
              <td class="px-4 py-3 text-right">
                <span
                  class="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium"
                >
                  {{ calculateSavings(result) }}%
                </span>
              </td>
              <td class="px-4 py-3 text-center text-gray-600 text-xs">
                <div>
                  {{ result.originalWidth }} × {{ result.originalHeight }}
                </div>
                <div
                  v-if="
                    result.width !== result.originalWidth ||
                    result.height !== result.originalHeight
                  "
                  class="text-blue-600"
                >
                  → {{ result.width }} × {{ result.height }}
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                >
                  {{ result.format.toUpperCase() }}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-gray-600">
                {{ result.processingTime }}ms
              </td>
              <td class="px-4 py-3 text-center">
                <span class="text-xl">✅</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { results } from '@utils/imageStore';
import { formatBytes } from '@utils/fileValidation';
import type { OptimizeResult } from '@utils/imageUtils';

type SortKey =
  | 'originalName'
  | 'originalSize'
  | 'optimizedSize'
  | 'savings'
  | 'processingTime';

const sortKey = ref<SortKey>('originalName');
const sortDesc = ref(false);

const sortedResults = computed(() => {
  const sorted = [...results.value];

  sorted.sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortKey.value) {
      case 'originalName':
        aVal = a.originalName.toLowerCase();
        bVal = b.originalName.toLowerCase();
        break;
      case 'originalSize':
        aVal = a.originalSize;
        bVal = b.originalSize;
        break;
      case 'optimizedSize':
        aVal = a.optimizedSize;
        bVal = b.optimizedSize;
        break;
      case 'savings':
        aVal = calculateSavingsNum(a);
        bVal = calculateSavingsNum(b);
        break;
      case 'processingTime':
        aVal = a.processingTime || 0;
        bVal = b.processingTime || 0;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDesc.value ? 1 : -1;
    if (aVal > bVal) return sortDesc.value ? -1 : 1;
    return 0;
  });

  return sorted;
});

const totalTime = computed(() => {
  const total = results.value.reduce(
    (acc, r) => acc + (r.processingTime || 0),
    0
  );
  return (total / 1000).toFixed(2);
});

const avgSavings = computed(() => {
  if (results.value.length === 0) return 0;
  const totalSavings = results.value.reduce(
    (acc, r) => acc + calculateSavingsNum(r),
    0
  );
  return Math.round(totalSavings / results.value.length);
});

const avgSize = computed(() => {
  if (results.value.length === 0) return '0 KB';
  const avgOpt =
    results.value.reduce((acc, r) => acc + r.optimizedSize, 0) /
    results.value.length;
  return formatBytes(avgOpt);
});

function calculateSavings(result: OptimizeResult): string {
  return calculateSavingsNum(result).toString();
}

function calculateSavingsNum(result: OptimizeResult): number {
  if (result.originalSize === 0) return 0;
  return Math.round(100 - (result.optimizedSize * 100) / result.originalSize);
}

function sortBy(key: SortKey) {
  if (sortKey.value === key) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortKey.value = key;
    sortDesc.value = false;
  }
}

function getSortIcon(key: SortKey): string {
  if (sortKey.value !== key) return '⇅';
  return sortDesc.value ? '↓' : '↑';
}

function exportToCSV() {
  // Crear CSV
  const headers = [
    'Archivo Original',
    'Tamaño Original (bytes)',
    'Tamaño Optimizado (bytes)',
    'Ahorro (%)',
    'Ancho Original',
    'Alto Original',
    'Ancho Final',
    'Alto Final',
    'Formato',
    'Tiempo (ms)',
  ];

  const rows = results.value.map((r) => [
    r.originalName,
    r.originalSize,
    r.optimizedSize,
    calculateSavingsNum(r),
    r.originalWidth || '',
    r.originalHeight || '',
    r.width,
    r.height,
    r.format,
    r.processingTime || '',
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
    '\n'
  );

  // Descargar CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `estadisticas-optimizacion-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);

  console.log('✅ CSV exportado');
}
</script>
