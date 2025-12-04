<template>
  <div v-if="validationInfo.hasWarnings" class="my-4">
    <!-- Advertencias -->
    <div
      v-for="(warning, index) in validationInfo.warnings"
      :key="index"
      class="mb-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
    >
      <p class="text-yellow-800 text-sm">{{ warning }}</p>
    </div>

    <!-- Archivos rechazados (expandible) -->
    <div
      v-if="validationInfo.rejectedFiles.length > 0"
      class="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg"
    >
      <button
        class="w-full flex items-center justify-between text-left font-medium text-red-800"
        @click="showRejected = !showRejected"
      >
        <span>
          ❌ {{ validationInfo.rejectedFiles.length }} archivo{{
            validationInfo.rejectedFiles.length > 1 ? 's' : ''
          }}
          rechazado{{ validationInfo.rejectedFiles.length > 1 ? 's' : '' }}
        </span>
        <svg
          class="w-5 h-5 transition-transform"
          :class="{ 'rotate-180': showRejected }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <!-- Lista de archivos rechazados -->
      <div v-if="showRejected" class="mt-3 space-y-2">
        <div
          v-for="(rejected, index) in validationInfo.rejectedFiles"
          :key="index"
          class="p-3 bg-white rounded border border-red-100"
        >
          <p class="text-sm font-medium text-gray-800">
            {{ rejected.file.name }}
          </p>
          <p class="text-xs text-red-600 mt-1">{{ rejected.message }}</p>
        </div>
      </div>
    </div>

    <!-- Estadísticas de validación -->
    <div
      v-if="validationInfo.stats"
      class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
    >
      <p class="text-sm text-blue-800">
        📊
        <strong>{{ validationInfo.stats.validFiles }}</strong> de
        <strong>{{ validationInfo.stats.totalFiles }}</strong> archivo{{
          validationInfo.stats.totalFiles > 1 ? 's' : ''
        }}
        válido{{ validationInfo.stats.validFiles > 1 ? 's' : '' }} ({{
          formatBytes(validationInfo.stats.validSize)
        }})
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { validationInfo } from '@utils/imageStore';
import { formatBytes } from '@utils/fileValidation';

const showRejected = ref(false);
</script>
