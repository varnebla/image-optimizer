<template>
  <div v-if="files.length > 0" class="my-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-gray-700">
        Vista Previa ({{ files.length }} imagen{{
          files.length > 1 ? 'es' : ''
        }})
      </h2>
      <button
        v-if="!isProcessing"
        class="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
        @click="clearAll"
      >
        🗑️ Eliminar Todas
      </button>
    </div>

    <!-- Grid de imágenes -->
    <div
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
    >
      <div
        v-for="(file, index) in files"
        :key="file.name + index"
        class="relative group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      >
        <!-- Thumbnail -->
        <div class="aspect-square bg-gray-100 relative">
          <img
            :src="getThumbnailUrl(file, index)"
            :alt="file.name"
            class="w-full h-full object-cover"
            @error="onImageError"
          />

          <!-- Overlay al hover con botón eliminar -->
          <div
            v-if="!isProcessing"
            class="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center"
          >
            <button
              class="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              @click="removeFile(index)"
            >
              🗑️ Eliminar
            </button>
          </div>

          <!-- Badge de orden -->
          <div
            class="absolute top-2 left-2 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow"
          >
            {{ index + 1 }}
          </div>
        </div>

        <!-- Info del archivo -->
        <div class="p-3">
          <p
            class="text-xs font-medium text-gray-800 truncate"
            :title="file.name"
          >
            {{ file.name }}
          </p>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs text-gray-500">
              {{ formatFileSize(file.size) }}
            </span>
            <span class="text-xs text-gray-500">
              {{ getFileExtension(file.name) }}
            </span>
          </div>
          <div v-if="imageDimensions[index]" class="mt-1">
            <span class="text-xs text-blue-600 font-medium">
              {{ imageDimensions[index].width }} ×
              {{ imageDimensions[index].height }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Información de tamaño total -->
    <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-700">
          <strong>Tamaño total:</strong> {{ totalSize }}
        </span>
        <span class="text-gray-700">
          <strong>Promedio:</strong> {{ averageSize }}
        </span>
      </div>
    </div>
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
  return parts.length > 1 ? '.' + parts[parts.length - 1].toUpperCase() : '';
}

function getThumbnailUrl(file: File, index: number): string {
  if (thumbnailUrls.value[index]) {
    return thumbnailUrls.value[index];
  }

  // Crear thumbnail usando canvas
  generateThumbnail(file, index);
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23f3f4f6" width="150" height="150"/%3E%3Ctext fill="%236b7280" font-family="sans-serif" font-size="12" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ECargando...%3C/text%3E%3C/svg%3E';
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

    // Dimensiones del thumbnail (150x150 para que quepa en el grid)
    const thumbnailSize = 150;
    canvas.width = thumbnailSize;
    canvas.height = thumbnailSize;

    // Calcular escala manteniendo proporción
    const scale = Math.min(
      thumbnailSize / img.width,
      thumbnailSize / img.height
    );

    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const offsetX = (thumbnailSize - scaledWidth) / 2;
    const offsetY = (thumbnailSize - scaledHeight) / 2;

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
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23fee2e2" width="150" height="150"/%3E%3Ctext fill="%23dc2626" font-family="sans-serif" font-size="12" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E❌ Error%3C/text%3E%3C/svg%3E';
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
