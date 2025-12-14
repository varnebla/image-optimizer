<template>
  <div v-if="files.length > 0" class="my-6">
    <div class="flex items-center justify-between mb-8">
      <div class="space-y-1">
        <h2 class="text-xl font-semibold text-stone-700 tracking-tight flex items-center gap-2">
          {{ t('imagePreview.title') }}
          <span class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-stone-100 text-gray-600"">{{ files.length }}</span>
        </h2>
        <p class="text-sm text-gray-500">
           {{ t('imagePreview.subtitle') }}
          </p>
      </div>
      <button
        v-if="!isProcessing"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-100 hover:text-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-stone-200/50"
        @click="clearAll"
      >
        <Trash2 class="w-4 h-4" /> {{ t('imagePreview.deleteAll') }}
      </button>
    </div>

    <!-- Grid de imágenes -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4 mb-4"
    >
      <div
        v-for="(file, index) in files"
        :key="file.name + index"
        class="relative group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      >
        <!-- Thumbnail -->
        <div class="aspect-4/3 w-full bg-gray-100 relative overflow-hidden">
          <img
            :src="getThumbnailUrl(file, index)"
            :alt="file.name"
            class="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            @error="onImageError"
          />

          <!-- Overlay al hover con botón eliminar -->
          <div
            v-if="!isProcessing"
            class="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center"
          >
            <button
              class="opacity-0 group-hover:opacity-100 transition-all p-2 bg-white text-gray-700 rounded-full shadow-sm hover:text-red-600 hover:bg-red-50"
              @click="removeFile(index)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <!-- Badge de orden -->
          <div
            class="absolute top-3 left-3 w-6 h-6 bg-stone-100 text-stone-600 text-xs font-medium rounded-full flex items-center justify-center shadow"
          >
            {{ index + 1 }}
          </div>
        </div>

        <!-- Info del archivo -->
        <footer class="p-4 flex flex-col gap-3">
          <div class="flex justify-between items-center gap-4 w-full">
            <div class="flex items-center gap-1">
              <FileImage class="size-3"/>
              <p
                class="text-xs font-medium text-gray-800 truncate max-w-[30ch]"
                :title="file.name"
              >
                {{ file.name }}
              </p>
            </div>
            <span class="inline-flex text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
              {{ getFileExtension(file.name) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs text-stone-500">
            <span class="font-mono">
              {{ formatFileSize(file.size) }}
            </span>
            <div v-if="imageDimensions[index]" class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-100 group-hover:border-gray-200 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span >
                {{ imageDimensions[index].width }} ×
                {{ imageDimensions[index].height }}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>

    <!-- Información de tamaño total -->
    <footer class="bg-white rounded-xl border border-stone-200 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2 text-gray-600">
          <ChartNoAxesColumn class="size-4 text-stone-400"/>
          <span class="font-medium">
            {{ t('imagePreview.totalSize') }}
          </span>
          <span class="font-mono">{{ totalSize }}</span>
        </div>
        <div class="w-px h-4 bg-gray-300 hidden sm:block"></div>
        <div class="flex items-center gap-2 text-gray-600">
          <span class="font-medium">
            {{ t('imagePreview.average') }}
          </span>
          <span class="font-mono">
            {{ averageSize }}
          </span>
        </div>
      </div>
      <p class="text-stone-400 text-xs">{{ t('imagePreview.updated') }}</p>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import {
  files,
  isProcessing,
  progress,
  results,
  zipBlob,
} from '@utils/imageStore';
import { formatBytes } from '@utils/fileValidation';
import { useTranslations } from '@i18n/utils';
import type { Lang } from '@i18n/ui';
import { Trash2, ChartNoAxesColumn, FileImage } from 'lucide-vue-next';

const props = defineProps<{
  lang: Lang;
}>();

const t = useTranslations(props.lang);

// Canvas y contexto para generar thumbnails
const thumbnailCanvas = ref<HTMLCanvasElement | null>(null);
const thumbnailCtx = ref<CanvasRenderingContext2D | null>(null);
const thumbnailUrls = ref<string[]>([]);
const imageDimensions = ref<{ width: number; height: number }[]>([]);

// Computed properties
const totalSize = computed(() => {
  const total = files.value.reduce((acc, file) => acc + file.size, 0);
  return formatBytes(total);
});

const averageSize = computed(() => {
  if (files.value.length === 0) return '0 Bytes';
  const avg =
    files.value.reduce((acc, file) => acc + file.size, 0) / files.value.length;
  return formatBytes(avg);
});

// Funciones
function formatFileSize(bytes: number): string {
  return formatBytes(bytes);
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ?  parts[parts.length - 1].toUpperCase() : '';
}

function getThumbnailUrl(file: File, index: number): string {
  if (thumbnailUrls.value[index]) {
    return thumbnailUrls.value[index];
  }

  // Crear thumbnail usando canvas
  generateThumbnail(file, index);
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="650" height="490"%3E%3Crect fill="%23f3f4f6" width="650" height="490"/%3E%3Ctext fill="%236b7280" font-family="sans-serif" font-size="12" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ECargando...%3C/text%3E%3C/svg%3E';
}

async function generateThumbnail(file: File, index: number) {
  try {
    // Crear imagen desde el archivo
    const img = await createImageBitmap(file);

    // Inicializar canvas si no existe
    if (!thumbnailCanvas.value) {
      thumbnailCanvas.value = document.createElement('canvas');
      thumbnailCtx.value = thumbnailCanvas.value.getContext('2d');
    }

    const canvas = thumbnailCanvas.value;
    const ctx = thumbnailCtx.value;

    if (!canvas || !ctx) return;

    // Dimensiones del thumbnail
    const thumbnailWidth = 650;
    const thumbnailHeight = 490;
    canvas.width = thumbnailWidth;
    canvas.height = thumbnailHeight;

    // Limpiar canvas con fondo blanco
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

    // Calcular escala tipo "cover" (rellena todo el contenedor)
    const scale = Math.max(
      thumbnailWidth / img.width,
      thumbnailHeight / img.height
    );

    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const offsetX = (thumbnailWidth - scaledWidth) / 2;
    const offsetY = (thumbnailHeight - scaledHeight) / 2;

    // Dibujar imagen en el canvas
    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

    // Guardar dimensiones originales
    imageDimensions.value[index] = {
      width: img.width,
      height: img.height,
    };

    // Crear URL del thumbnail
    const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    thumbnailUrls.value[index] = thumbnailDataUrl;

    console.log(`✅ Thumbnail generado para ${file.name}`);
  } catch (error) {
    console.error(`❌ Error generando thumbnail para ${file.name}:`, error);
    // Fallback a imagen de error
    thumbnailUrls.value[index] =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="650" height="490"%3E%3Crect fill="%23fee2e2" width="650" height="490"/%3E%3Ctext fill="%23dc2626" font-family="sans-serif" font-size="12" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E❌ Error%3C/text%3E%3C/svg%3E';
  }
}

function onImageError(event: Event) {
  // Si hay error cargando la imagen, usar un placeholder
  (event.target as HTMLImageElement).src =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E❌ Error%3C/text%3E%3C/svg%3E';
}

function removeFile(index: number) {
  // Eliminar archivo del array
  files.value = files.value.filter((_, i) => i !== index);
  thumbnailUrls.value.splice(index, 1);
  imageDimensions.value.splice(index, 1);

  // Actualizar progreso
  progress.value = files.value.map((f) => ({ name: f.name, progress: 0 }));

  console.log(`Archivo eliminado. ${files.value.length} archivos restantes.`);
}

function clearAll() {
  // Limpiar todo
  files.value = [];
  thumbnailUrls.value = [];
  imageDimensions.value = [];
  progress.value = [];
  results.value = [];
  zipBlob.value = null;

  console.log('Todas las imágenes eliminadas.');
}

// Watch para limpiar thumbnails cuando cambian los archivos
watch(
  () => files.value.length,
  (newLength, oldLength) => {
    if (newLength === 0 && oldLength > 0) {
      // Se limpiaron todos los archivos
      thumbnailUrls.value = [];
      imageDimensions.value = [];
    }
  }
);
</script>
