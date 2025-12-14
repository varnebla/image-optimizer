<template>
  <div class="mb-12 p-8 bg-white rounded-2xl border border-stone-200 shadow-lg shadow-stone-200/50">
    <div class="flex items-center justify-between mb-4">
      <div class="space-y-1">
        <h2 class="text-xl font-semibold text-stone-700 tracking-tight flex items-center gap-2">
          {{ t('presetsSelector.title') }}
        </h2>
        <p class="text-sm text-gray-500">
           {{ t('presetsSelector.predefinedPresets') }}
          </p>
      </div>
<!-- COMMENTED TILL FIXED -->
      <!-- <button
        class="px-4 py-3 text-sm bg-stone-100 text-stone-800 rounded-2xl hover:bg-stone-200 transition-colors font-medium flex items-center"
        @click="showCreateModal = true"
        data-umami-event="Abrir crear preset personalizado"
      >
        <Plus class="inline-block w-4 h-4 mr-2" />
        {{ t('presetsSelector.createPreset') }}
      </button> -->
    </div>

    <!-- Presets Predefinidos -->
    <div class="space-y-2 mb-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          v-for="preset in predefinedPresets"
          :key="preset.id"
          class="p-4 text-left rounded-lg border transition-all group"
          :class="{
            'border-lime-500 bg-lime-50': selectedPresetId === preset.id,
            'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-100':
              selectedPresetId !== preset.id,
          }"
          @click="applyPreset(preset)"
          data-umami-event="Seleccionar preset"
          :data-umami-event-preset="preset.name"
        >
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xl">{{ preset.icon }}</span>
            <span class="font-medium text-gray-800">{{ preset.name }}</span>
          </div>
          <p class="text-xs text-stone-500 mb-6">{{ preset.description }}</p>
          <div class="flex items-center gap-1 mt-2 text-xs text-stone-500 font-medium">
            <span class="px-2 py-1 rounded-lg transition-colors" :class="
              selectedPresetId == preset.id ? 'bg-lime-100 text-lime-700 ' : 'bg-stone-100 group-hover:bg-stone-200'
            ">{{ preset.config.maxWidth }}px</span>
            <!-- <span>•</span> -->
            <span class="px-2 py-1 rounded-lg transition-colors" :class="
              selectedPresetId == preset.id ? 'bg-lime-100 text-lime-700 ' : 'bg-stone-100 group-hover:bg-stone-200'
            ">{{ preset.config.format.toUpperCase() }}</span>
            <!-- <span>•</span> -->
            <span class="px-2 py-1 rounded-lg transition-colors" :class="
              selectedPresetId == preset.id ? 'bg-lime-100 text-lime-700 ' : 'bg-stone-100 group-hover:bg-stone-200'
            ">Q{{ preset.config.quality }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Presets Personalizados -->
    <div
      v-if="customPresets.length > 0"
      class="space-y-2 mt-6 pt-6 border-t border-gray-200"
    >
      <p class="text-sm font-medium text-gray-600 mb-2">{{ t('presetsSelector.myPresets') }}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div
          v-for="preset in customPresets"
          :key="preset.id"
          class="relative p-4 rounded-lg border-2 transition-all"
          :class="{
            'border-blue-500 bg-blue-50': selectedPresetId === preset.id,
            'border-gray-200 bg-gray-50': selectedPresetId !== preset.id,
          }"
        >
          <button class="w-full text-left" @click="applyPreset(preset)">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-2xl">{{ preset.icon }}</span>
              <span class="font-medium text-gray-800">{{ preset.name }}</span>
            </div>
            <p class="text-xs text-gray-600">{{ preset.description }}</p>
            <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>{{ preset.config.maxWidth }}px</span>
              <span>•</span>
              <span>{{ preset.config.format.toUpperCase() }}</span>
              <span>•</span>
              <span>Q{{ preset.config.quality }}</span>
            </div>
          </button>

          <!-- Botones de acción -->
          <div class="absolute top-2 right-2 flex gap-1">
            <button
              class="p-1 bg-white rounded hover:bg-gray-100 text-gray-600"
              @click="deletePreset(preset.id)"
              title="Eliminar"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para crear preset -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold mb-4">{{ t('presetsSelector.createCustom') }}</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('presetsSelector.name') }}
            </label>
            <input
              v-model="newPreset.name"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('presetsSelector.namePlaceholder')"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('presetsSelector.description') }}
            </label>
            <input
              v-model="newPreset.description"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('presetsSelector.descriptionPlaceholder')"
            />
          </div>

          <div class="p-3 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-700 mb-2">
              <strong>{{ t('presetsSelector.currentConfig') }}</strong>
            </p>
            <ul class="text-xs text-gray-600 space-y-1">
              <li>• {{ t('presetsSelector.maxWidth') }} {{ options.maxWidth }}px</li>
              <li>• {{ t('presetsSelector.format') }} {{ options.format.toUpperCase() }}</li>
              <li>• {{ t('presetsSelector.quality') }} {{ options.quality }}</li>
            </ul>
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            @click="showCreateModal = false"
          >
            {{ t('presetsSelector.cancel') }}
          </button>
          <button
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            :disabled="!newPreset.name"
            @click="createPreset"
            data-umami-event="Crear preset personalizado"
          >
            {{ t('presetsSelector.create') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { options } from '@utils/imageStore';
import {
  getAllPresets,
  createCustomPreset,
  deleteCustomPreset as deletePresetUtil,
  applyPreset as applyPresetUtil,
  saveLastUsedPreset,
  getLastUsedPresetId,
} from '@utils/presets';
import type { Preset } from '@utils/presets';
import { useTranslations } from '@i18n/utils';
import type { Lang } from '@i18n/ui';
import { Plus } from 'lucide-vue-next'

const props = defineProps<{
  lang: Lang;
}>();

const t = useTranslations(props.lang);

const allPresets = ref<Preset[]>([]);
const selectedPresetId = ref<string | null>(null);
const showCreateModal = ref(false);
const newPreset = ref({
  name: '',
  description: '',
});

const predefinedPresets = computed(() =>
  allPresets.value.filter((p) => !p.isCustom)
);

const customPresets = computed(() =>
  allPresets.value.filter((p) => p.isCustom)
);

function loadPresets() {
  allPresets.value = getAllPresets(props.lang);
}

function applyPreset(preset: Preset) {
  // Aplicar configuración del preset
  const newConfig = applyPresetUtil(preset, options);
  options.maxWidth = newConfig.maxWidth;
  options.format = newConfig.format;
  options.quality = newConfig.quality;

  // Guardar como último usado
  selectedPresetId.value = preset.id;
  saveLastUsedPreset(preset.id);

  console.log(`✅ Preset aplicado: ${preset.name}`);
}

function createPreset() {
  if (!newPreset.value.name) return;

  const preset = createCustomPreset(
    newPreset.value.name,
    newPreset.value.description,
    { ...options }
  );

  // Recargar presets
  loadPresets();

  // Aplicar el nuevo preset
  applyPreset(preset);

  // Cerrar modal y resetear
  showCreateModal.value = false;
  newPreset.value = { name: '', description: '' };
}

function deletePreset(id: string) {
  if (confirm(t('presetsSelector.confirmDelete'))) {
    if (deletePresetUtil(id)) {
      // Si el preset eliminado era el seleccionado, deseleccionar
      if (selectedPresetId.value === id) {
        selectedPresetId.value = null;
      }

      // Recargar presets
      loadPresets();
    }
  }
}

// Cargar presets al montar
onMounted(() => {
  loadPresets();

  // Intentar cargar el último preset usado
  const lastPresetId = getLastUsedPresetId();
  if (lastPresetId) {
    selectedPresetId.value = lastPresetId;
  }
});
</script>
