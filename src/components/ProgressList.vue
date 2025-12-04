<template>
  <div v-if="progress.length > 0" class="my-6">
    <h2 class="text-xl font-semibold mb-4 text-gray-700">
      Progreso de Optimización
    </h2>
    <div class="space-y-3">
      <div
        v-for="file in progress"
        :key="file.name"
        class="p-4 rounded-lg bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center mb-2">
          <span class="flex-1 truncate text-gray-800 font-medium">
            <span
              v-if="file.progress === 100"
              class="inline-block mr-2 text-green-600 text-xl"
              >✓</span
            >
            <span
              v-else-if="file.progress > 0"
              class="inline-block mr-2 text-blue-500 animate-pulse text-xl"
              >⏳</span
            >
            <span v-else class="inline-block mr-2 text-gray-400 text-xl"
              >○</span
            >
            {{ file.name }}
          </span>
          <span
            class="ml-4 text-sm font-semibold"
            :class="{
              'text-green-600': file.progress === 100,
              'text-blue-600': file.progress > 0 && file.progress < 100,
              'text-gray-500': file.progress === 0,
            }"
            >{{ file.progress }}%</span
          >
        </div>
        <div
          class="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden"
        >
          <div
            class="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out"
            :class="{
              'bg-green-500': file.progress === 100,
              'bg-blue-500': file.progress > 0 && file.progress < 100,
            }"
            :style="{ width: file.progress + '%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { progress } from '@utils/imageStore';
</script>
