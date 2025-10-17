# 🖼️ Optimizador de Imágenes

Una aplicación web 100% client-side para optimizar imágenes por lotes, sin
necesidad de subir archivos a ningún servidor.

## ✨ Características

### Core

- 🎯 **100% Client-Side**: Todo el procesamiento ocurre en tu navegador, tus
  imágenes nunca salen de tu equipo
- 📦 **Procesamiento por lotes**: Optimiza múltiples imágenes a la vez
- 🎨 **Drag & Drop**: Interfaz intuitiva con arrastrar y soltar con feedback
  visual
- 🔄 **Formatos modernos**: Conversión a WebP y AVIF
- 📏 **Redimensionamiento inteligente**: Mantiene la proporción de aspecto
- 🎚️ **Control de calidad**: Ajusta el nivel de compresión (10-100)
- 🧭 **Soporte EXIF**: Aplica correctamente la orientación de las fotos
  (rotaciones 1-8)

### Validación y Seguridad

- 🛡️ **Límites configurables**: Tamaño máximo por archivo (50 MB), número de
  archivos (100), tamaño total (500 MB)
- ✅ **Validación automática**: Filtra archivos no válidos con mensajes
  descriptivos
- ⚠️ **Advertencias inteligentes**: Notificaciones de archivos rechazados con
  detalles

### Vista Previa

- 🖼️ **Thumbnails interactivos**: Vista previa de todas las imágenes antes de
  optimizar
- 📐 **Información detallada**: Tamaño, dimensiones y formato de cada imagen
- 🗑️ **Gestión individual**: Elimina imágenes específicas o todas a la vez
- 💾 **Estadísticas en tiempo real**: Tamaño total y promedio de las imágenes
  seleccionadas

### Presets de Configuración

- 🚀 **Presets predefinidos**: Web Performance, Alta Calidad, Redes Sociales,
  Formato Moderno, Equilibrado
- 💾 **Presets personalizados**: Crea, guarda y gestiona tus propias
  configuraciones
- 🔄 **Persistencia**: Los presets se guardan en localStorage
- 🎯 **Aplicación rápida**: Un clic para aplicar cualquier configuración

### Resultados y Estadísticas

- 📊 **Estadísticas detalladas**: Tabla completa con información de cada imagen
  procesada
- 📈 **Métricas de rendimiento**: Tiempo de procesamiento, ahorro por imagen,
  dimensiones
- 📥 **Exportación a CSV**: Descarga todas las estadísticas para análisis
  posterior
- 🔍 **Ordenamiento**: Ordena por cualquier columna (nombre, tamaño, ahorro,
  tiempo)
- 💾 **Descarga en ZIP**: Todas las imágenes optimizadas en un solo archivo
- 📋 **Snippet HTML**: Código `<picture>` listo para copiar
- 📏 **Formato inteligente**: Tamaños mostrados automáticamente en KB o MB

## 🚀 Tecnologías

- **[Astro](https://astro.build/)**: Framework web moderno y rápido
- **[Vue 3](https://vuejs.org/)**: Framework reactivo para componentes
  interactivos
- **[TailwindCSS v4](https://tailwindcss.com/)**: Framework CSS utility-first
- **[Pica](https://github.com/nodeca/pica)**: Resize de imágenes de alta calidad
- **[exifr](https://github.com/MikeKovarik/exifr)**: Lectura y aplicación de
  metadatos EXIF
- **[JSZip](https://stuk.github.io/jszip/)**: Generación de archivos ZIP
- **TypeScript**: Tipado estático para código más robusto

## 📋 Requisitos

- Node.js >= 18.20.8
- pnpm (recomendado) o npm

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd image-optimizer

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev

# Construir para producción
pnpm build

# Previsualizar build de producción
pnpm preview
```

## 📖 Uso

1. **Selecciona imágenes**:

   - Arrastra y suelta imágenes en el área designada, o
   - Haz clic en el área para abrir el selector de archivos

2. **Configura opciones**:

   - **Ancho máximo**: El ancho máximo de las imágenes (mantiene proporción)
   - **Formato**: WebP o AVIF
   - **Calidad**: De 10 a 100 (80 recomendado)

3. **Optimiza**:

   - Haz clic en "Optimizar Imágenes"
   - Espera a que se procesen todas las imágenes

4. **Descarga**:
   - Descarga el archivo ZIP con todas las imágenes optimizadas
   - Opcionalmente, copia el snippet HTML de ejemplo

## 🏗️ Arquitectura

```
src/
├── components/           # Componentes Vue interactivos
│   ├── ImageDrop.vue    # Área de drag & drop
│   ├── SettingsPanel.vue # Panel de configuración
│   ├── OptimizeButton.vue # Botón de procesamiento
│   ├── ProgressList.vue  # Lista de progreso
│   └── ResultSummary.vue # Resumen y descarga
├── layouts/
│   └── Layout.astro     # Layout base de la aplicación
├── pages/
│   └── index.astro      # Página principal
├── styles/
│   └── global.css       # Estilos globales (TailwindCSS)
├── types/
│   └── pica.d.ts        # Definiciones de tipos para Pica
├── utils/
│   ├── imageStore.ts    # Store reactivo global (Vue)
│   ├── imageUtils.ts    # Lógica de optimización de imágenes
│   └── zipUtils.ts      # Generación de archivos ZIP
└── workers/
    └── optimizer.worker.ts # Web Worker (no usado actualmente)
```

## 🎯 Decisiones de Diseño

### ¿Por qué sin Web Workers?

Inicialmente el proyecto incluía un Web Worker para procesar imágenes en segundo
plano. Sin embargo, se decidió procesar directamente en el main thread porque:

1. **Transferencia de datos**: Los objetos `File` no son serializables con
   `postMessage`, requiriendo conversión a ArrayBuffer
2. **APIs asíncronas**: Pica y Canvas ya son asíncronos y no bloquean la UI
3. **Simplicidad**: Menos código, menos complejidad, misma UX
4. **Actualización en tiempo real**: Más fácil actualizar el progreso en tiempo
   real

Si en el futuro se necesita un Web Worker (para imágenes muy grandes o
procesamiento CPU-intensive), se puede implementar convirtiendo los Files a
ArrayBuffers + metadata antes de transferirlos.

### ¿Por qué Pica?

Pica ofrece resize de imágenes de **alta calidad** usando:

- Algoritmos Lanczos para downscaling
- Filtros unsharp mask para mejorar la nitidez
- Soporte para imágenes con canal alpha
- Procesamiento eficiente optimizado con WebAssembly

## 🎨 Características de la UI

- **Responsive**: Funciona en desktop, tablet y móvil
- **Feedback visual**: Estados claros de hover, drag, procesamiento y completado
- **Animaciones suaves**: Transiciones CSS para mejor UX
- **Accesibilidad**: Componentes semánticos y navegables por teclado
- **Moderna**: Diseño limpio tipo "web tool" profesional

## 📊 Flujo de Datos

```
Usuario selecciona archivos
         ↓
ImageDrop actualiza store (files)
         ↓
Usuario configura opciones (maxWidth, format, quality)
         ↓
Usuario hace clic en "Optimizar"
         ↓
OptimizeButton procesa cada imagen:
  - Lee EXIF orientation
  - Crea ImageBitmap del archivo
  - Redimensiona con Pica (alta calidad)
  - Aplica rotación EXIF si es necesario
  - Convierte a formato deseado (WebP/AVIF)
  - Actualiza progreso en tiempo real
         ↓
Se generan resultados (OptimizeResult[])
         ↓
zipUtils crea archivo ZIP
         ↓
ResultSummary muestra estadísticas y botón de descarga
```

## 🔧 Configuración

### Formatos Soportados

**Entrada**: JPG, PNG, GIF, WebP, AVIF, BMP, SVG

**Salida**: WebP, AVIF

### Configuración de Pica

```typescript
{
  quality: 3,           // Alta calidad (0-3)
  alpha: true,          // Preservar canal alpha
  unsharpAmount: 80,    // Cantidad de sharpening
  unsharpRadius: 0.6,   // Radio del unsharp mask
  unsharpThreshold: 2   // Umbral para aplicar sharpening
}
```

## 🐛 Solución de Problemas

### "Node.js v16.1.0 is not supported"

Actualiza Node.js a la versión 18.20.8 o superior:

```bash
# Con nvm
nvm install 18
nvm use 18

# O descarga desde https://nodejs.org/
```

### Las imágenes no se optimizan

1. Verifica que los archivos sean imágenes válidas
2. Abre la consola del navegador (F12) para ver errores
3. Comprueba que el navegador soporte WebP/AVIF

### El drag & drop no funciona

1. Asegúrate de que los componentes Vue tienen `client:load`
2. Verifica que estás arrastrando archivos de imagen
3. Comprueba la consola del navegador por errores

## 🗺️ Roadmap

Para ver el plan detallado de mejoras y nuevas funcionalidades, consulta
[ROADMAP.md](./ROADMAP.md).

### Próximas Mejoras Prioritarias

1. **Límites de tamaño y cantidad** - Validación de archivos
2. **Vista previa de imágenes** - Thumbnails antes de optimizar
3. **Presets de configuración** - Configuraciones predefinidas
4. **Estadísticas detalladas** - Tabla con información por imagen
5. **Opciones avanzadas** - Más control sobre la optimización
6. **Múltiples tamaños responsive** - Generación de srcset automático

Ver [ROADMAP.md](./ROADMAP.md) para más detalles de cada mejora.

## 📝 Licencia

MIT

## 👨‍💻 Desarrollo

```bash
# Ejecutar en modo desarrollo
pnpm dev

# Verificar tipos TypeScript
pnpm astro check

# Construir para producción
pnpm build

# Previsualizar producción localmente
pnpm preview
```

## 🙏 Créditos

- Inspirado en [Squoosh](https://squoosh.app/) de Google Chrome Labs
- Iconos de [Heroicons](https://heroicons.com/)
- Emojis de sistema operativo

---

**Hecho con ❤️ usando Astro + Vue + TailwindCSS**
