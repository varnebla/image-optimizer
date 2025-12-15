<template>
  <div v-if="progress.length > 0" class="my-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-stone-700 tracking-tight flex items-center gap-2">
        {{ t('progressList.title') }}
        <span class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-stone-100 text-gray-600">{{ progress.length }}</span>
      </h2>
      <p class="text-sm text-gray-500 mt-1">
        {{ t('progressList.subtitle') }}
      </p>
    </div>
    <div class="space-y-3">
      <div
        v-for="(file, index) in progress"
        :key="file.name"
        class="p-4 rounded-lg bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center gap-4">
          <!-- Thumbnail de la imagen -->
          <div class="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
            <img
              v-if="thumbnails[index]"
              :src="thumbnails[index]"
              :alt="file.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <CheckCircle
                v-if="file.progress === 100"
                class="w-5 h-5 text-green-600 shrink-0"
              />
              <Clock
                v-else-if="file.progress > 0"
                class="w-5 h-5 text-blue-500 animate-pulse shrink-0"
              />
              <Circle
                v-else
                class="w-5 h-5 text-gray-400 shrink-0"
              />
              <span class="truncate text-gray-800 font-medium">{{ file.name }}</span>
            </div>
            
            <!-- Tamaño original debajo del nombre -->
            <div v-if="getResultForFile(file.name)" class="text-xs text-gray-500 ml-7">
              {{ formatBytes(getResultForFile(file.name)!.originalSize) }}
            </div>
            
            <!-- Barra de progreso (solo visible cuando NO está completado) -->
            <div v-if="file.progress < 100 && file.progress > 0" class="mt-2 ml-7">
              <div class="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out bg-blue-500"
                  :style="{ width: file.progress + '%' }"
                ></div>
              </div>
            </div>
          </div>
          
          <!-- Información de optimización a la derecha (solo cuando está completado) -->
          <div v-if="file.progress === 100 && getResultForFile(file.name)" class="flex items-center gap-3 shrink-0">
            <div class="text-right">
              <div class="text-sm font-semibold text-gray-700">
                {{ formatBytes(getResultForFile(file.name)!.optimizedSize) }}
              </div>
              <div class="text-xs text-green-600 font-medium">
                -{{ getSavingsPercent(getResultForFile(file.name)!) }}%
              </div>
            </div>
            <div class="px-2 py-1 bg-purple-100 rounded text-xs font-semibold text-purple-700 uppercase">
              {{ getResultForFile(file.name)!.format }}
            </div>
          </div>
          
          <!-- Porcentaje (solo visible cuando está en progreso) -->
          <span
            v-if="file.progress > 0 && file.progress < 100"
            class="ml-4 text-sm font-semibold shrink-0 text-blue-600"
            >{{ file.progress }}%</span
          >
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import { CheckCircle, Clock, Circle } from 'lucide-vue-next';
import { progress, files, results } from '@utils/imageStore';
import { useTranslations } from '@i18n/utils';
import type { Lang } from '@i18n/ui';
import type { OptimizeResult } from '@utils/imageUtils';

const props = defineProps<{
  lang: Lang;
}>();

const t = useTranslations(props.lang);

// Generar thumbnails de las imágenes
const thumbnails = computed(() => {
  return files.value.map(file => {
    try {
      return URL.createObjectURL(file);
    } catch (e) {
      console.error('Error creando thumbnail:', e);
      return null;
    }
  });
});

// Obtener resultado de optimización para un archivo específico
function getResultForFile(fileName: string): OptimizeResult | null {
  return results.value.find(r => r.originalName === fileName) || null;
}

// Formatear bytes a KB o MB
function formatBytes(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

// Calcular porcentaje de ahorro
function getSavingsPercent(result: OptimizeResult): number {
  return Math.round(((result.originalSize - result.optimizedSize) / result.originalSize) * 100);
}
</script>
