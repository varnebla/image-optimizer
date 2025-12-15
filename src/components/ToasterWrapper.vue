<template>
  <Toaster 
    position="top-right" 
    richColors
  />
</template>

<script setup lang="ts">
import { Toaster, toast } from 'vue-sonner'
import 'vue-sonner/style.css'
</script>
<!-- 
<style>
/* Asegurar que los toasts estén por encima de todo */
:global(.sonner-toast) {
  z-index: 9999 !important;
}
</style> -->
