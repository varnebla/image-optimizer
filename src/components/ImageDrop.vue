<template>
  <div class="my-12 max-w-xl mx-auto px-4 sm:px-0">
    <div
      id="drop-zone"
      class="border border-dashed rounded-2xl px-8 py-16 text-center cursor-pointer transition-all duration-200 shadow-xl shadow-neutral-200/50  backdrop-blur-3xl mb-8"
      :class="{
        'border-blue-500 bg-blue-50': isDragging,
        'border-neutral-300 bg-gray-50 hover:bg-lime-50 hover:border-lime-400':
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
        <div class="p-4 rounded-2xl bg-white shadow-md shadow-neutral-200">
          <CloudUpload class="w-8 h-8 " />
        </div>
        <p class="text-lg font-medium text-gray-700 mb-0">
          {{ t('imageDrop.dragText') }}
        </p>
        <p class="text-sm mb-4">
          {{ t('imageDrop.or') }} <span class="text-lime-600 underline">{{ t('imageDrop.clickText') }}</span>
        </p>
        <p class="text-sm text-gray-500">{{ t('imageDrop.supportedFormats') }} ({{ t('imageDrop.maxTotal') }} {{ formatFileSize(fileLimits.maxTotalSize) }})</p>
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
  autoOptimize,
  isProcessing,
  options,
  sessionLog,
} from '@utils/imageStore';
import {
  validateFiles,
  getValidationSummary,
  formatBytes,
} from '@utils/fileValidation';
import { optimizeImage } from '@utils/imageUtils';
import type { OptimizeResult } from '@utils/imageUtils';
import { generateZip } from '@utils/zipUtils';
import { useTranslations } from '@i18n/utils';
import type { Lang } from '@i18n/ui';
import { CloudUpload, CheckCircle } from 'lucide-vue-next';

const props = defineProps<{
  lang: Lang;
}>();

const t = useTranslations(props.lang);

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

  // Validar archivos con los límites configurados y función de traducción
  const validation = validateFiles(filesArray, t, fileLimits);

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
    error.value = t('imageDrop.noValidFiles');
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
  const summary = getValidationSummary(validation, t);
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

  // Auto-optimizar si está habilitado
  if (autoOptimize.value) {
    setTimeout(() => {
      optimizeImagesAuto();
    }, 300);
  }
}

/**
 * Optimiza las imágenes automáticamente al cargar
 */
async function optimizeImagesAuto() {
  if (!filesStore.value.length || isProcessing.value) return;
  
  isProcessing.value = true;
  error.value = '';
  results.value = [];

  try {
    const optimizedResults: OptimizeResult[] = [];

    for (let i = 0; i < filesStore.value.length; i++) {
      const file = filesStore.value[i];

      progress.value[i] = { name: file.name, progress: 50 };

      try {
        console.log(`Procesando ${i + 1}/${filesStore.value.length}: ${file.name}`);

        const startTime = performance.now();
        const result = await optimizeImage(file, options);
        const endTime = performance.now();
        const processingTime = Math.round(endTime - startTime);

        result.processingTime = processingTime;
        optimizedResults.push(result);

        progress.value[i] = { name: file.name, progress: 100 };

        console.log(
          `✓ Completado: ${result.name} (${(result.optimizedSize / 1024).toFixed(2)} KB) en ${processingTime}ms`
        );

        sessionLog.value.push({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          fileName: result.originalName,
          originalSize: result.originalSize,
          optimizedSize: result.optimizedSize,
          format: result.format,
          savingsPercentage:
            ((result.originalSize - result.optimizedSize) / result.originalSize) * 100,
        });

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

    console.log('Generando archivo ZIP...');
    zipBlob.value = await generateZip(optimizedResults);
    console.log('✓ ZIP generado correctamente');

    // NO limpiamos files para permitir re-optimización
  } catch (e: any) {
    console.error('Error en optimización:', e);
    error.value = e?.message || 'Error al optimizar las imágenes.';
  } finally {
    isProcessing.value = false;
  }
}
</script>
