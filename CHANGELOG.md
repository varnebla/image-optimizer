# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/), y este proyecto
adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Planificado

- Opciones avanzadas de optimización (nitidez, metadatos EXIF, nomenclatura)
- Generación de múltiples tamaños responsive con srcset automático
- Dark mode
- Comparación visual lado a lado
- Web Workers con procesamiento paralelo real

## [1.2.0] - 2025-10-17

### Añadido

- 🔮 **Previsión de optimización en tiempo real**
  - Estimación dinámica del ahorro según parámetros actuales
  - Muestra tamaño original vs optimizado estimado
  - Proyección para múltiples imágenes seleccionadas
  - Información basada en estadísticas reales de archivos cargados
  - Actualización automática al cambiar configuración
- 🎨 **Slider de calidad mejorado**
  - Gradiente visual de colores (rojo=calidad baja, verde=calidad alta)
  - Indicadores de calidad (Baja, Media, Alta)
  - Thumb circular azul con efectos hover
  - Transiciones suaves al cambiar valores

### Mejorado

- 📊 **Thumbnails mejorados**
  - Generación correcta usando Canvas (soluciona imágenes negras)
  - Escalado proporcional con centrado perfecto
  - Gestión optimizada de memoria con data URLs
- 🛡️ **Información de límites más clara**
  - Panel informativo debajo del área de drop
  - Límites actuales siempre visibles
  - Formato legible (KB/MB automático)

### Técnico

- `optimizationEstimator.ts` - Nueva utilidad para cálculos de estimación
- `OptimizationPreview.vue` - Componente de previsión interactiva
- Estilos CSS personalizados para slider mejorado
- Integración con estadísticas reales de archivos

## [1.1.0] - 2025-10-17

### Añadido

- ✨ **Sistema de validación de archivos** con límites configurables
  - Límite de tamaño por archivo (default: 50 MB)
  - Límite de número de archivos (default: 100)
  - Límite de tamaño total (default: 500 MB)
  - Validación automática de tipos de archivo
  - Mensajes descriptivos de error y advertencia
- 🖼️ **Vista previa de imágenes** con thumbnails interactivos
  - Grid responsive de thumbnails
  - Información detallada (tamaño, dimensiones, formato)
  - Eliminación individual de imágenes
  - Estadísticas en tiempo real (tamaño total, promedio)
  - Liberación automática de memoria (revokeObjectURL)
- 🎯 **Sistema de presets de configuración**
  - 5 presets predefinidos (Web Performance, Alta Calidad, Redes Sociales,
    Formato Moderno, Equilibrado)
  - Creación de presets personalizados
  - Persistencia en localStorage
  - Gestión completa (crear, aplicar, eliminar)
  - Recuerda último preset usado
- 📊 **Estadísticas detalladas por imagen**
  - Tabla completa con toda la información de procesamiento
  - Métricas: tamaño original/optimizado, ahorro, dimensiones, tiempo
  - Ordenamiento por cualquier columna
  - Resumen general con promedios
  - **Exportación a CSV** con todos los datos
- ⏱️ **Tracking de tiempo de procesamiento** por imagen
- 📐 **Información de dimensiones** original y final

### Mejorado

- 🎨 Interfaz completamente renovada con mejor UX
- 📏 Componentes más descriptivos con más información
- 🔍 Mejor feedback visual en todos los procesos
- 💾 Mejor gestión de memoria con cleanup de URLs de objetos

### Técnico

- Nuevos tipos TypeScript para validación y presets
- Utilidades reutilizables para formateo y validación
- Componentes Vue modulares y bien estructurados
- Store reactivo mejorado con más estados

## [1.0.1] - 2025-10-17

### Mejorado

- ✨ Formato inteligente de tamaños (KB/MB) en el resumen de resultados
- 📊 Agregada cuarta tarjeta mostrando el ahorro absoluto en tamaño
- 📐 Cambiado el layout del resumen a 4 columnas (2x2 en móvil, 4 en desktop)

### Documentación

- 📝 Creado ROADMAP.md con plan detallado de mejoras
- 📝 Creado CHANGELOG.md para trackear versiones
- 📝 Actualizado README.md con referencia al roadmap

## [1.0.0] - 2025-10-17

### Inicial

- 🎉 Primera versión funcional del optimizador de imágenes
- ✅ Drag & drop de archivos completamente funcional
- ✅ Procesamiento 100% client-side (sin servidor)
- ✅ Conversión a formatos WebP y AVIF
- ✅ Redimensionamiento con mantención de proporción
- ✅ Optimización de alta calidad con Pica
- ✅ Soporte completo de orientación EXIF (rotaciones 1-8)
- ✅ Generación automática de archivo ZIP
- ✅ Panel de configuración (ancho máximo, formato, calidad)
- ✅ Lista de progreso en tiempo real
- ✅ Resumen con estadísticas de ahorro
- ✅ Snippet HTML `<picture>` copiable
- ✅ Interfaz responsive con TailwindCSS v4
- ✅ Feedback visual para drag & drop

### Tecnologías

- Framework: Astro 5.14.5
- UI: Vue 3.5.22
- CSS: TailwindCSS 4.1.14
- Resize: Pica 9.0.1
- EXIF: exifr 7.1.3
- ZIP: JSZip 3.10.1
- TypeScript para todo el código

### Arquitectura

- Componentes Vue con `client:load` para interactividad
- Store reactivo global con Vue ref/reactive
- Procesamiento asíncrono directo (sin Web Worker por ahora)
- Actualización de progreso en tiempo real
- Manejo robusto de errores

### Problemas Conocidos Resueltos

- ✅ Componentes Vue no eran interactivos (solucionado con `client:load`)
- ✅ Error de `postMessage` con Web Workers (solucionado procesando en main
  thread)
- ✅ Orientación EXIF no aplicada (solucionado con transformaciones de canvas)

## Tipos de Cambios

- `Added` - Para nuevas funcionalidades
- `Changed` - Para cambios en funcionalidades existentes
- `Deprecated` - Para funcionalidades que serán eliminadas próximamente
- `Removed` - Para funcionalidades eliminadas
- `Fixed` - Para corrección de bugs
- `Security` - Para vulnerabilidades de seguridad

---

[Unreleased]: https://github.com/usuario/image-optimizer/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/usuario/image-optimizer/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/usuario/image-optimizer/releases/tag/v1.0.0
