<template>
  <div v-if="sessionLog.length > 0" class="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
    <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
      <h3 class="text-lg font-semibold text-gray-700 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        {{ t('sessionLog.title') }}
      </h3>
      <div class="flex gap-2">
        <button
          @click="downloadLog"
          class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {{ t('sessionLog.downloadCSV') }}
        </button>
        <button
          @click="clearLog"
          class="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {{ t('sessionLog.clear') }}
        </button>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('sessionLog.time') }}</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('sessionLog.file') }}</th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('sessionLog.original') }}</th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('sessionLog.optimized') }}</th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t('sessionLog.savings') }}</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="entry in reversedLog" :key="entry.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatTime(entry.timestamp) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs" :title="entry.fileName">
              {{ entry.fileName }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
              {{ formatBytes(entry.originalSize) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
              {{ formatBytes(entry.optimizedSize) }}
              <span class="text-xs text-gray-400 ml-1">({{ entry.format }})</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium" :class="getSavingsClass(entry.savingsPercentage)">
              {{ entry.savingsPercentage.toFixed(1) }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { sessionLog } from '@utils/imageStore';
import { formatBytes } from '@utils/fileValidation';
import { useTranslations } from '@i18n/utils';
import type { Lang } from '@i18n/ui';

const props = defineProps<{
  lang: Lang;
}>();

const t = useTranslations(props.lang);

const reversedLog = computed(() => [...sessionLog.value].reverse());

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getSavingsClass(percentage: number): string {
  if (percentage >= 70) return 'text-green-600';
  if (percentage >= 40) return 'text-blue-600';
  if (percentage > 0) return 'text-gray-600';
  return 'text-red-500';
}

function clearLog() {
  if (confirm(t('sessionLog.confirmClear'))) {
    sessionLog.value = [];
  }
}

function downloadLog() {
  if (sessionLog.value.length === 0) return;

  // Crear contenido CSV
  const headers = [t('sessionLog.csvDate'), t('sessionLog.csvTime'), t('sessionLog.csvFile'), t('sessionLog.csvOriginalSize'), t('sessionLog.csvOptimizedSize'), t('sessionLog.csvFormat'), t('sessionLog.csvSavings')];
  const rows = sessionLog.value.map(entry => {
    const date = new Date(entry.timestamp);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      `"${entry.fileName.replace(/"/g, '""')}"`, // Escapar comillas en nombres de archivo
      entry.originalSize,
      entry.optimizedSize,
      entry.format,
      entry.savingsPercentage.toFixed(2)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Descargar archivo
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `image-optimizer-log-${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>
