/**
 * Utilidades para estimar el ahorro de optimización
 * Basado en parámetros de configuración actuales y estadísticas típicas
 */

import type { OptimizeOptions } from './imageUtils';

// Datos de compresión típicos basados en pruebas y estándares de la industria
const COMPRESSION_FACTORS = {
  // Factores de reducción por calidad (WebP)
  webp: {
    100: 0.95, // Pérdida mínima en calidad máxima
    90: 0.85, // Buena calidad, buen ahorro
    80: 0.75, // Calidad estándar web, buen equilibrio
    70: 0.65, // Compresión moderada
    60: 0.55, // Compresión agresiva
    50: 0.45, // Compresión alta
    40: 0.35, // Muy comprimido
    30: 0.25, // Máxima compresión
    20: 0.15, // Compresión extrema
    10: 0.08, // Mínima calidad
  },
  // Factores de reducción por calidad (AVIF)
  avif: {
    100: 0.9, // AVIF es más eficiente que WebP
    90: 0.8,
    80: 0.7,
    70: 0.6,
    60: 0.5,
    50: 0.4,
    40: 0.3,
    30: 0.2,
    20: 0.12,
    10: 0.06,
  },
};

// Factores de reducción por redimensionamiento
// Basado en reducción cuadrática del área de la imagen
function getResizeFactor(
  maxWidth: number,
  averageOriginalWidth: number
): number {
  if (maxWidth >= averageOriginalWidth) return 1.0; // No hay reducción

  const scaleFactor = maxWidth / averageOriginalWidth;
  // El tamaño se reduce por el cuadrado del factor de escala
  return Math.pow(scaleFactor, 2);
}

// Dimensiones promedio típicas de imágenes web (basado en estadísticas reales)
const AVERAGE_DIMENSIONS = {
  width: 2048, // Ancho promedio típico
  height: 1536, // Alto promedio típico
};

// Tamaño promedio de imagen típica (basado en datos reales)
const AVERAGE_IMAGE_SIZE_KB = 800; // 800 KB promedio

/**
 * Estima el ahorro de optimización basado en parámetros actuales
 */
export interface OptimizationEstimate {
  originalSizeMB: number;
  estimatedSizeMB: number;
  savingsMB: number;
  savingsPercent: number;
  compressionRatio: number;
}

export function estimateOptimization(
  options: OptimizeOptions,
  imageCount: number = 1
): OptimizationEstimate {
  // Tamaño total original estimado
  const originalSizeKB = AVERAGE_IMAGE_SIZE_KB * imageCount;
  const originalSizeMB = originalSizeKB / 1024;

  // Factor de compresión basado en formato y calidad
  const compressionFactor =
    COMPRESSION_FACTORS[options.format][options.quality] || 0.75;

  // Factor de redimensionamiento
  const resizeFactor = getResizeFactor(
    options.maxWidth,
    AVERAGE_DIMENSIONS.width
  );

  // Factor total de reducción (compresión + resize)
  const totalReductionFactor = compressionFactor * resizeFactor;

  // Tamaño estimado después de optimización
  const estimatedSizeKB = originalSizeKB * totalReductionFactor;
  const estimatedSizeMB = estimatedSizeKB / 1024;

  // Cálculos de ahorro
  const savingsKB = originalSizeKB - estimatedSizeKB;
  const savingsMB = savingsKB / 1024;
  const savingsPercent =
    originalSizeKB > 0 ? (savingsKB / originalSizeKB) * 100 : 0;
  const compressionRatio = originalSizeKB / Math.max(estimatedSizeKB, 1);

  return {
    originalSizeMB: Math.round(originalSizeMB * 100) / 100,
    estimatedSizeMB: Math.round(estimatedSizeMB * 100) / 100,
    savingsMB: Math.round(savingsMB * 100) / 100,
    savingsPercent: Math.round(savingsPercent),
    compressionRatio: Math.round(compressionRatio * 100) / 100,
  };
}

/**
 * Genera una explicación textual del ahorro estimado
 */
export function getEstimateExplanation(
  estimate: OptimizationEstimate,
  imageCount: number = 1
): string {
  const { originalSizeMB, estimatedSizeMB, savingsMB, savingsPercent } =
    estimate;

  if (imageCount === 1) {
    return `Con esta configuración, una imagen típica de ${originalSizeMB} MB se reduciría a aproximadamente ${estimatedSizeMB} MB, ahorrando ${savingsMB} MB (${savingsPercent}%).`;
  }

  const totalOriginal = originalSizeMB * imageCount;
  const totalEstimated = estimatedSizeMB * imageCount;
  const totalSavings = savingsMB * imageCount;

  return `Con ${imageCount} imágenes, el tamaño total pasaría de ${totalOriginal.toFixed(
    1
  )} MB a ${totalEstimated.toFixed(1)} MB, ahorrando ${totalSavings.toFixed(
    1
  )} MB (${savingsPercent}%).`;
}

/**
 * Obtiene estadísticas de compresión para diferentes formatos y calidades
 * Útil para mostrar comparaciones
 */
export function getCompressionStats(): {
  format: string;
  quality: number;
  reductionFactor: number;
  description: string;
}[] {
  const stats = [];

  for (const format of ['webp', 'avif'] as const) {
    for (const quality of [100, 90, 80, 70, 60, 50]) {
      const factor = COMPRESSION_FACTORS[format][quality];
      stats.push({
        format,
        quality,
        reductionFactor: factor,
        description: `${format.toUpperCase()} Q${quality} - ${(
          factor * 100
        ).toFixed(0)}% del tamaño original`,
      });
    }
  }

  return stats.sort((a, b) => a.reductionFactor - b.reductionFactor);
}

/**
 * Calcula el impacto del redimensionamiento
 */
export function getResizeImpact(maxWidth: number): {
  originalWidth: number;
  newWidth: number;
  areaReduction: number;
  description: string;
} {
  const originalWidth = AVERAGE_DIMENSIONS.width;
  const newWidth = Math.min(maxWidth, originalWidth);
  const scaleFactor = newWidth / originalWidth;
  const areaReduction = 1 - Math.pow(scaleFactor, 2);

  return {
    originalWidth,
    newWidth,
    areaReduction: Math.round(areaReduction * 100),
    description: `Área reducida en ${Math.round(
      areaReduction * 100
    )}% (${originalWidth}px → ${newWidth}px)`,
  };
}
