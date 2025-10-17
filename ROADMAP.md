# 🗺️ Roadmap de Mejoras - Optimizador de Imágenes

Este documento detalla las mejoras planificadas para la aplicación de
optimización de imágenes.

## 📋 Estado del Proyecto

- ✅ **Completado**: Funcionalidad implementada y probada
- 🚧 **En progreso**: Actualmente en desarrollo
- 📅 **Planificado**: Próxima implementación
- 💡 **Idea**: Para futuras versiones

---

## 🎯 Mejoras Prioritarias (Sprint Actual)

### 1. Vista Previa de Imágenes 📅

**Categoría**: UX/UI  
**Prioridad**: Alta  
**Complejidad**: Media

#### Descripción

Mostrar vista previa de las imágenes seleccionadas antes de optimizarlas,
permitiendo al usuario revisar y gestionar los archivos.

#### Funcionalidades

- [ ] Mostrar thumbnails de las imágenes seleccionadas en una cuadrícula
- [ ] Mostrar información de cada imagen:
  - Nombre del archivo
  - Tamaño original
  - Dimensiones (ancho x alto)
  - Formato
- [ ] Botón para eliminar imágenes individuales de la lista
- [ ] Indicador visual del orden de procesamiento
- [ ] Límite de tamaño de thumbnail para optimizar rendimiento

#### Consideraciones Técnicas

- Usar `createObjectURL` para generar URLs temporales de los thumbnails
- Liberar URLs con `revokeObjectURL` al eliminar imágenes
- Limitar dimensiones de thumbnails a 150x150px
- Lazy loading si hay muchas imágenes (>20)

---

### 2. Múltiples Tamaños Responsive 📅

**Categoría**: Funcionalidad  
**Prioridad**: Alta  
**Complejidad**: Media-Alta

#### Descripción

Generar múltiples versiones de cada imagen en diferentes tamaños, optimizado
para diseño responsive y diferentes dispositivos.

#### Funcionalidades

- [ ] Opción de generar múltiples tamaños por imagen:
  - Thumbnail: 320px
  - Mobile: 640px
  - Tablet: 1024px
  - Desktop: 1920px
  - Original (sin resize)
- [ ] Selector de tamaños predefinidos
- [ ] Opción de tamaños personalizados (multi-input)
- [ ] Nomenclatura automática de archivos:
  - `imagen-320w.webp`
  - `imagen-640w.webp`
  - `imagen-1024w.webp`
  - `imagen-1920w.webp`
- [ ] Generar snippet `<picture>` con `srcset` completo
- [ ] Organización en carpetas dentro del ZIP:
  ```
  /thumbnail/
  /mobile/
  /tablet/
  /desktop/
  ```

#### Snippet HTML Generado (ejemplo)

```html
<picture>
  <source
    srcset="
      imagen-320w.webp   320w,
      imagen-640w.webp   640w,
      imagen-1024w.webp 1024w,
      imagen-1920w.webp 1920w
    "
    sizes="(max-width: 320px) 320px,
           (max-width: 640px) 640px,
           (max-width: 1024px) 1024px,
           1920px"
    type="image/webp"
  />
  <img src="imagen-1920w.webp" alt="Imagen responsive" loading="lazy" />
</picture>
```

#### Consideraciones Técnicas

- Solo generar tamaños menores o iguales a las dimensiones originales
- Calcular tiempo estimado multiplicado por número de tamaños
- Actualizar progreso considerando todos los tamaños generados
- Optimizar memoria procesando tamaños secuencialmente

---

### 3. Presets de Configuración 📅

**Categoría**: Funcionalidad  
**Prioridad**: Alta  
**Complejidad**: Media

#### Descripción

Configuraciones predefinidas para casos de uso comunes, facilitando el trabajo a
usuarios novatos y agilizando el flujo de trabajo de usuarios avanzados.

#### Presets Incluidos

##### 🚀 Web Performance (Rápido)

```json
{
  "name": "Web Performance",
  "description": "Optimización agresiva para máximo rendimiento web",
  "maxWidth": 1920,
  "format": "webp",
  "quality": 75,
  "multipleSizes": false,
  "maintainExif": false
}
```

##### 🎨 Alta Calidad

```json
{
  "name": "Alta Calidad",
  "description": "Mejor calidad visual con compresión moderada",
  "maxWidth": 2560,
  "format": "webp",
  "quality": 90,
  "multipleSizes": false,
  "maintainExif": true
}
```

##### 📱 Redes Sociales

```json
{
  "name": "Redes Sociales",
  "description": "Optimizado para Instagram, Facebook, Twitter",
  "maxWidth": 1080,
  "format": "webp",
  "quality": 80,
  "multipleSizes": false,
  "maintainExif": false
}
```

##### 🌐 Responsive (Multi-tamaño)

```json
{
  "name": "Responsive",
  "description": "Múltiples tamaños para diseño responsive",
  "sizes": [320, 640, 1024, 1920],
  "format": "webp",
  "quality": 80,
  "multipleSizes": true,
  "maintainExif": false
}
```

##### 🔬 Formato Moderno (AVIF)

```json
{
  "name": "Formato Moderno",
  "description": "AVIF para navegadores compatibles",
  "maxWidth": 1920,
  "format": "avif",
  "quality": 65,
  "multipleSizes": false,
  "maintainExif": false
}
```

#### Funcionalidades

- [ ] Selector de presets en el panel de configuración
- [ ] Vista previa de la configuración al seleccionar preset
- [ ] Botón "Guardar como preset personalizado"
- [ ] Gestionar presets personalizados:
  - Crear
  - Editar
  - Eliminar
  - Exportar/Importar (JSON)
- [ ] Persistir presets en localStorage
- [ ] Preset por defecto configurable
- [ ] Tooltip explicativo para cada preset

#### UI Propuesta

```
┌─────────────────────────────────────┐
│ Presets                        [+]  │
├─────────────────────────────────────┤
│ 🚀 Web Performance         [Aplicar]│
│ 🎨 Alta Calidad            [Aplicar]│
│ 📱 Redes Sociales          [Aplicar]│
│ 🌐 Responsive              [Aplicar]│
│ 🔬 Formato Moderno         [Aplicar]│
├─────────────────────────────────────┤
│ Mis Presets                         │
│ 💾 Mi Preset 1          [✏️] [🗑️]   │
└─────────────────────────────────────┘
```

---

### 4. Más Opciones de Optimización 📅

**Categoría**: Funcionalidad  
**Prioridad**: Media  
**Complejidad**: Media

#### Descripción

Expandir el panel de configuración con más opciones avanzadas para usuarios que
necesitan control fino sobre la optimización.

#### Nuevas Opciones

##### 🔧 Opciones de Redimensionamiento

- [ ] **Mantener dimensiones originales** (checkbox)
  - No redimensionar, solo optimizar formato/compresión
- [ ] **Fit Mode** (select)
  - `contain`: Ajustar dentro del máximo sin recortar
  - `cover`: Cubrir el área recortando si es necesario
  - `fill`: Distorsionar para llenar exactamente
- [ ] **Ancho y Alto máximos** (separados)
  - Permite controlar ambas dimensiones
- [ ] **Mantener proporción** (checkbox, default: true)

##### ✨ Opciones de Calidad

- [ ] **Nivel de nitidez (Sharpening)**
  - Slider 0-100 (default: 80)
  - Controla `unsharpAmount` de Pica
- [ ] **Radio de nitidez**
  - Slider 0.1-2.0 (default: 0.6)
- [ ] **Suavizado de compresión**
  - Slider para reducir artefactos de compresión

##### 📝 Opciones de Metadatos

- [ ] **Mantener metadatos EXIF** (checkbox)
  - Autor, copyright, descripción
  - GPS (opcional, por privacidad)
  - Fecha de captura
- [ ] **Eliminar todos los metadatos** (checkbox)
  - Para reducir tamaño al máximo

##### 🎨 Opciones de Formato

- [ ] **Generar múltiples formatos** (checkboxes)
  - WebP ✓
  - AVIF ✓
  - JPEG (como fallback)
- [ ] **Modo de color** (select)
  - RGB
  - Escala de grises
  - Preservar original

##### 🔢 Opciones de Nomenclatura

- [ ] **Sufijo personalizado** (input text)
  - Default: `-optimized`
  - Ejemplos: `-opt`, `-compressed`, `-web`
- [ ] **Convertir nombres a lowercase** (checkbox)
- [ ] **Reemplazar espacios por guiones** (checkbox)
- [ ] **Añadir timestamp** (checkbox)

#### Panel Desplegable

```
┌─────────────────────────────────────┐
│ ⚙️ Configuración Básica             │
│   Ancho máximo: [1920] px          │
│   Formato: [WebP ▼]                 │
│   Calidad: [80] ▓▓▓▓▓▓▓▓░░          │
│                                      │
│ ➕ Opciones Avanzadas [Expandir ▼]  │
│                                      │
│ 💾 Presets: [Seleccionar ▼]         │
└─────────────────────────────────────┘
```

---

### 5. Estadísticas Detalladas por Imagen 📅

**Categoría**: Información  
**Prioridad**: Media  
**Complejidad**: Baja

#### Descripción

Mostrar una tabla expandible con información detallada de cada imagen procesada,
permitiendo analizar el rendimiento de la optimización.

#### Información a Mostrar

##### Por Imagen

- Nombre del archivo (original → optimizado)
- Tamaño original vs optimizado (con porcentaje)
- Dimensiones antes → después
- Formato original → nuevo formato
- Tiempo de procesamiento (ms)
- Ratio de compresión
- Metadatos EXIF detectados
- Estado (✓ Éxito, ⚠️ Advertencia, ❌ Error)

##### Estadísticas Agregadas

- Total de imágenes procesadas
- Tiempo total de procesamiento
- Ahorro total (MB y %)
- Tamaño promedio antes/después
- Imagen más grande procesada
- Imagen con mayor compresión

#### UI Propuesta

```
┌────────────────────────────────────────────────────────┐
│ 📊 Estadísticas Detalladas              [📥 Exportar CSV] │
├────────────────────────────────────────────────────────┤
│ Resumen:                                                │
│ • 25 imágenes procesadas en 12.5s                      │
│ • Ahorro total: 15.2 MB (68%)                          │
│ • Promedio: 608 KB → 195 KB                            │
├────────────────────────────────────────────────────────┤
│ Imagen              Original  Optimizado  Ahorro  Tiempo│
│ ────────────────────────────────────────────────────── │
│ ▼ foto-1.jpg        2.4 MB    780 KB     68%    520ms  │
│   Dimensiones: 4032x3024 → 1920x1440                  │
│   Formato: JPEG → WebP                                 │
│   EXIF: Sí (iPhone 12 Pro)                            │
│ ────────────────────────────────────────────────────── │
│ ▶ foto-2.png        1.8 MB    620 KB     66%    450ms  │
│ ▶ foto-3.jpg        3.1 MB    1.1 MB     65%    680ms  │
│ ...                                                     │
└────────────────────────────────────────────────────────┘
```

#### Funcionalidades

- [ ] Tabla colapsable/expandible por fila
- [ ] Ordenar por cualquier columna (nombre, tamaño, ahorro, etc.)
- [ ] Filtrar por estado (todas/exitosas/errores)
- [ ] Búsqueda por nombre de archivo
- [ ] Exportar tabla a CSV
- [ ] Copiar estadísticas al portapapeles
- [ ] Gráfico de barras comparativo (opcional)

---

### 6. Límites de Tamaño y Cantidad 📅

**Categoría**: Validación y Control  
**Prioridad**: Alta  
**Complejidad**: Baja

#### Descripción

Implementar límites configurables para el tamaño máximo por archivo y el número
total de archivos, evitando problemas de memoria y mejorando la experiencia del
usuario.

#### Funcionalidades

##### Límite por Archivo

- [ ] **Tamaño máximo por archivo** (configurable)
  - Default: 50 MB
  - Rango: 1 MB - 100 MB
- [ ] Validación al seleccionar/arrastrar archivos
- [ ] Mensaje de error descriptivo:
  ```
  ⚠️ Archivo demasiado grande
  "foto-gigante.jpg" (85 MB) supera el límite de 50 MB.
  Por favor, reduce el tamaño del archivo antes de optimizarlo.
  ```
- [ ] Opción de filtrar automáticamente archivos grandes
- [ ] Mostrar contador de archivos rechazados

##### Límite Total de Archivos

- [ ] **Número máximo de archivos** (configurable)
  - Default: 100 archivos
  - Rango: 1 - 500 archivos
- [ ] Validación al seleccionar múltiples archivos
- [ ] Mensaje de advertencia:
  ```
  ℹ️ Límite de archivos alcanzado
  Has seleccionado 150 archivos, pero el límite es 100.
  Solo se procesarán los primeros 100 archivos.
  ```
- [ ] Opción de procesar en lotes (batch processing)

##### Límite de Tamaño Total

- [ ] **Tamaño total máximo** (suma de todos los archivos)
  - Default: 500 MB
  - Para evitar problemas de memoria
- [ ] Cálculo en tiempo real del tamaño total
- [ ] Barra de progreso visual del límite usado:
  ```
  Tamaño total: 234 MB / 500 MB
  [▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░] 47%
  ```

##### UI del Panel de Configuración

```
┌─────────────────────────────────────┐
│ 🛡️ Límites y Seguridad              │
├─────────────────────────────────────┤
│ Tamaño máximo por archivo:          │
│ [50] MB  ▓▓▓▓▓░░░░░ (1-100 MB)      │
│                                      │
│ Máximo número de archivos:          │
│ [100] archivos                       │
│                                      │
│ Tamaño total máximo:                │
│ [500] MB                             │
│                                      │
│ ☑️ Filtrar automáticamente archivos │
│    que superen el límite            │
│                                      │
│ ☑️ Mostrar advertencias antes de    │
│    procesar                          │
└─────────────────────────────────────┘
```

#### Validaciones Implementadas

```typescript
interface FileLimits {
  maxFileSize: number; // En bytes (default: 50 * 1024 * 1024)
  maxFiles: number; // Default: 100
  maxTotalSize: number; // En bytes (default: 500 * 1024 * 1024)
  autoFilter: boolean; // Auto-filtrar archivos grandes
  showWarnings: boolean; // Mostrar advertencias
}

function validateFiles(files: File[], limits: FileLimits): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validFiles: File[] = [];
  const rejectedFiles: File[] = [];

  // Validar tamaño individual
  // Validar número de archivos
  // Validar tamaño total

  return { validFiles, rejectedFiles, errors, warnings };
}
```

#### Consideraciones Técnicas

- Mostrar contador en tiempo real de archivos/tamaño
- Permitir ajustar límites desde la UI
- Guardar límites preferidos en localStorage
- Opción de "Modo Avanzado" sin límites (con advertencia)

---

## 📊 Métricas de Éxito

Para cada mejora implementada, mediremos:

- **Usabilidad**: Facilidad de uso para usuarios nuevos
- **Funcionalidad**: Cumplimiento de requisitos técnicos
- **Performance**: Impacto en velocidad de procesamiento
- **Adopción**: Uso de la nueva funcionalidad por usuarios

---

## 🔄 Proceso de Implementación

1. **Análisis**: Revisar requisitos y diseño
2. **Diseño UI/UX**: Mockups y flujos de usuario
3. **Desarrollo**: Implementación técnica
4. **Testing**: Pruebas funcionales y de usuario
5. **Documentación**: Actualizar README y guías
6. **Despliegue**: Merge a main y release

---

## 📝 Notas de Implementación

### Orden Sugerido

1. **Límites de Tamaño** (Quick Win - Previene problemas)
2. **Vista Previa** (UX inmediato)
3. **Presets** (Facilita uso)
4. **Estadísticas Detalladas** (Información valiosa)
5. **Más Opciones** (Poder avanzado)
6. **Múltiples Tamaños** (Feature compleja pero valiosa)

### Dependencias entre Mejoras

- Múltiples tamaños depende de tener buenas opciones de configuración
- Estadísticas se benefician de tener presets para comparar
- Vista previa es independiente y se puede hacer primero

---

## 🚀 Futuras Versiones

Ideas para después de completar este roadmap:

- Web Workers con procesamiento paralelo real
- PWA con Service Worker
- Comparación visual lado a lado
- Filtros y efectos avanzados
- Eliminación de fondo con IA
- Historial de optimizaciones
  <!-- - Exportar/Importar configuraciones -->
  <!-- - Integración con APIs de almacenamiento (Dropbox, Google Drive) -->
- Soporte para video (conversión a formatos web)
- Internacionalización
- Dark mode
- Mejorar la estimación de optimización (no es muy accurate)

---

**Última actualización**: 2025-10-17  
**Versión**: 1.0.0
