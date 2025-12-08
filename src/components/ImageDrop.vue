<template>
  <div>
    <div
      id="drop-zone"
      class="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200"
      :class="{
        'border-blue-500 bg-blue-50': isDragging,
        'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400':
          !isDragging,
      }"
      @drop="onDrop"
      @dragover="dragOverHandler"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @click="openFileDialog"
    >
      <input
        id="image-input"
        type="file"
        class="hidden"
        multiple
        accept="image/*"
        ref="fileInput"
        @change="onFileChange"
      />
      <div class="flex flex-col items-center justify-center space-y-3">
        <svg
          class="w-16 h-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p class="text-lg text-gray-700">
          Arrastra imágenes aquí o
          <span class="text-blue-600 font-semibold underline"
            >haz clic para seleccionar</span
          >
        </p>
        <p class="text-sm text-gray-500">Soporta: JPG, PNG, WebP, AVIF, GIF</p>
      </div>
    </div>
    <div
      v-if="filesStore.length > 0"
      class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
    >
      <p class="text-blue-800 font-medium">
        📁 {{ filesStore.length }}
        {{
          filesStore.length === 1
            ? 'imagen seleccionada'
            : 'imágenes seleccionadas'
        }}
      </p>
    </div>

    <!-- Información de límites -->
    <div class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div
        class="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600"
      >
        <div class="flex items-center gap-1">
          <span class="font-medium">📏 Máx por archivo:</span>
          <span class="text-blue-600 font-semibold">{{
            formatFileSize(fileLimits.maxFileSize)
          }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="font-medium">📁 Máx archivos:</span>
          <span class="text-blue-600 font-semibold">{{
            fileLimits.maxFiles
          }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="font-medium">💾 Total máximo:</span>
          <span class="text-blue-600 font-semibold">{{
            formatFileSize(fileLimits.maxTotalSize)
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import {
  files as filesStore,
  progress,
  results,
  zipBlob,
  error,
  fileLimits,
  validationInfo,
} from '@utils/imageStore';
import {
  validateFiles,
  getValidationSummary,
  formatBytes,
} from '@utils/fileValidation';

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

function openFileDialog() {
  fileInput.value?.click();
}

function formatFileSize(bytes: number): string {
  return formatBytes(bytes);
}

function onFileChange(e: Event) {
  console.log('onFileChange triggered');
  const files = (e.target as HTMLInputElement).files;
  //@ts-ignore
  window?.umami.track('Archivos añadidos', {archivos: files.length});
  if (files) emitFiles(files);
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragging.value = false;
  console.log('onDrop triggered');
  if (e.dataTransfer?.files) {
    emitFiles(e.dataTransfer.files);
  }
}

function dragOverHandler(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
}

function onDragEnter(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragging.value = true;
}

function onDragLeave(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  // Solo desactivar si realmente salimos del drop-zone
  if (e.currentTarget === e.target) {
    isDragging.value = false;
  }
}

function emitFiles(fileList: FileList) {
  const filesArray = Array.from(fileList);

  // Validar archivos con los límites configurados
  const validation = validateFiles(filesArray, fileLimits);

  // Actualizar información de validación en el store
  validationInfo.hasWarnings = validation.warnings.length > 0;
  validationInfo.warnings = validation.warnings;
  validationInfo.rejectedFiles = validation.rejectedFiles;
  validationInfo.stats = validation.stats;

  // Si hay errores críticos, mostrar y no continuar
  if (validation.errors.length > 0) {
    error.value = validation.errors.join('\n');
    console.error('Errores de validación:', validation.errors);
    return;
  }

  // Si no hay archivos válidos
  if (validation.validFiles.length === 0) {
    error.value = 'No se seleccionaron archivos de imagen válidos';
    return;
  }

  // Actualizar store con archivos válidos
  filesStore.value = validation.validFiles;
  progress.value = validation.validFiles.map((f) => ({
    name: f.name,
    progress: 0,
  }));
  results.value = [];
  zipBlob.value = null;
  error.value = '';

  // Log de resumen
  const summary = getValidationSummary(validation);
  console.log('✅ Validación completada:', summary);

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Advertencias:', validation.warnings);
  }

  if (validation.rejectedFiles.length > 0) {
    console.warn(
      `❌ ${validation.rejectedFiles.length} archivo(s) rechazado(s):`,
      validation.rejectedFiles.map((rf) => rf.message)
    );
  }
}
</script>
