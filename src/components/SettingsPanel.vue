<template>
  <div class="my-6 p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-xl font-semibold mb-4 text-gray-700">{{ t('settingsPanel.title') }}</h2>
    <div class="space-y-4">
      <label class="block">
        <span class="text-gray-700 font-medium">{{ t('settingsPanel.maxWidth') }}</span>
        <input
          type="number"
          v-model.number="options.maxWidth"
          min="100"
          max="8000"
          class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      <label class="block">
        <span class="text-gray-700 font-medium">{{ t('settingsPanel.outputFormat') }}</span>
        <select
          v-model="options.format"
          class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="webp">WebP</option>
          <option value="avif">AVIF</option>
        </select>
      </label>
      <label class="block">
        <span class="text-gray-700 font-medium"
          >{{ t('settingsPanel.quality') }} {{ options.quality }}</span
        >
        <div class="relative mt-2">
          <!-- Slider personalizado con gradiente -->
          <input
            type="range"
            v-model.number="options.quality"
            min="10"
            max="100"
            step="1"
            class="w-full h-3 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-lg appearance-none cursor-pointer slider-custom"
          />
          <!-- Indicadores de calidad -->
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>{{ t('settingsPanel.qualityLow') }}</span>
            <span>{{ t('settingsPanel.qualityMedium') }}</span>
            <span>{{ t('settingsPanel.qualityHigh') }}</span>
          </div>
        </div>
      </label>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { options } from '@utils/imageStore';
import { useTranslations } from '@i18n/utils';
import type { Lang } from '@i18n/ui';

const props = defineProps<{
  lang: Lang;
}>();

const t = useTranslations(props.lang);
</script>
