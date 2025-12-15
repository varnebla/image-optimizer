<template>
  <!-- Modal backdrop -->
  <Transition name="fade">
    <div 
      v-if="showSettings" 
      class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      @click.self="showSettings = false"
    >
      <!-- Modal content -->
      <div 
        class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        @click.stop
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-stone-700 tracking-tight flex items-center gap-2">
            <svg class="w-5 h-5 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ t('settingsPanel.title') }}
          </h2>
          <button 
            @click="showSettings = false"
            class="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            :title="t('settingsPanel.close') || 'Cerrar'"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="space-y-5">
      <label class="block text-sm ">
        <span class="text-gray-700 font-medium">{{ t('settingsPanel.maxWidth') }}</span>
        <input
          type="number"
          v-model.number="options.maxWidth"
          min="100"
          max="8000"
          class="mt-2 mb-4 block w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-lime-500"
        />
      </label>
      <label class="block text-sm">
        <span class="text-gray-700 font-medium">{{ t('settingsPanel.outputFormat') }}</span>
        <select
          v-model="options.format"
          class="mt-2 mb-4 block w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-lime-500 appearance-none"
          style="background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%23666%27 viewBox=%270 0 24 24%27%3e%3cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3e%3c/svg%3e'); background-repeat: no-repeat; background-position: right 0.5rem center; background-size: 1rem;"
        >
          <option value="webp">WebP</option>
          <option value="avif">AVIF</option>
        </select>
      </label>
      <label class="block text-sm">
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
            class="w-full bg-stone-200 rounded-lg appearance-none cursor-pointer slider-custom"
            :style="{ '--slider-percent': sliderPercent + '%' }"
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
    </div>
  </Transition>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import { options, showSettings } from '@utils/imageStore';
import { useTranslations } from '@i18n/utils';
import type { Lang } from '@i18n/ui';

const props = defineProps<{
  lang: Lang;
}>();

const t = useTranslations(props.lang);

// Calcular el porcentaje del slider (0-100% basado en min=10, max=100)
const sliderPercent = computed(() => {
  const min = 10;
  const max = 100;
  return ((options.quality - min) / (max - min)) * 100;
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
