<template>
  <!-- Este componente ya no renderiza nada, solo muestra toasts -->
</template>

<script lang="ts" setup>
import { watch, ref } from 'vue';
import { toast } from 'vue-sonner';
import { validationInfo } from '@utils/imageStore';
import { useTranslations } from '@i18n/utils';
import type { Lang } from '@i18n/ui';

const props = defineProps<{
  lang: Lang;
}>();

const t = useTranslations(props.lang);
const lastRejectedCount = ref(0);

// Observar cambios en archivos rechazados y mostrar toasts
watch(
  () => validationInfo.rejectedFiles.length,
  (newLength, oldLength) => {
    // Solo mostrar toasts si hay nuevos rechazos
    if (newLength > lastRejectedCount.value) {
      // Obtener los archivos rechazados nuevos (desde el último índice conocido)
      const newRejections = validationInfo.rejectedFiles.slice(lastRejectedCount.value);
      console.log('Nuevos archivos rechazados:', newRejections);
      
      newRejections.forEach((rejected) => {
        toast.warning(t('validationWarnings.toastTitle'), {
          description: `${rejected.message}`,
          duration: 10000,
          closeButton: true, 
          closeButtonPosition: "top-right"
        });
      });
      
      lastRejectedCount.value = newLength;
    } else if (newLength === 0) {
      // Reset cuando se limpian los rechazos
      lastRejectedCount.value = 0;
    }
  },
  { immediate: false }
);
</script>
