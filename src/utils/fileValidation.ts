/**
 * Utilidades para validación de archivos
 * Maneja límites de tamaño, cantidad y validaciones generales
 */

// TODO: 
// - [] Enviar errores como evento a Umami Analytics
// - [] Traducir mensajes de error y advertencia

export interface FileLimits {
  maxFileSize: number; // En bytes (default: 50 MB)
  maxFiles: number; // Default: 100
  maxTotalSize: number; // En bytes (default: 500 MB)
  autoFilter: boolean; // Auto-filtrar archivos grandes
  showWarnings: boolean; // Mostrar advertencias
}

export interface ValidationResult {
  validFiles: File[];
  rejectedFiles: RejectedFile[];
  errors: string[];
  warnings: string[];
  stats: ValidationStats;
}

export interface RejectedFile {
  file: File;
  reason: 'size' | 'type' | 'total_count' | 'total_size';
  message: string;
}

export interface ValidationStats {
  totalFiles: number;
  validFiles: number;
  rejectedFiles: number;
  totalSize: number; // En bytes
  validSize: number; // En bytes
  rejectedSize: number; // En bytes
}

// Límites por defecto
export const DEFAULT_LIMITS: FileLimits = {
  maxFileSize: 12 * 1024 * 1024, // 12 MB
  maxFiles: 10,
  maxTotalSize: 60 * 1024 * 1024, // 60 MB
  autoFilter: true,
  showWarnings: true,
};

/**
 * Formatea un tamaño en bytes a formato legible
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Valida si un archivo es una imagen válida
 */
export function isValidImageType(file: File): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/bmp',
    'image/svg+xml',
  ];
  return validTypes.includes(file.type) || file.type.startsWith('image/');
}

/**
 * Valida un array de archivos según los límites establecidos
 */
export function validateFiles(
  files: File[],
  limits: FileLimits = DEFAULT_LIMITS
): ValidationResult {
  const validFiles: File[] = [];
  const rejectedFiles: RejectedFile[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  let totalSize = 0;
  let validSize = 0;
  let rejectedSize = 0;

  // Calcular tamaño total
  files.forEach((file) => {
    totalSize += file.size;
  });

  // Validar número total de archivos
  if (files.length > limits.maxFiles) {
    const excess = files.length - limits.maxFiles;
    if (limits.autoFilter) {
      warnings.push(
        `⚠️ Has seleccionado ${files.length} archivos, pero el límite es ${limits.maxFiles}. ` +
          `Solo se procesarán los primeros ${limits.maxFiles} archivos.`
      );
    } else {
      errors.push(
        `❌ Número de archivos excedido: ${files.length} archivos (límite: ${limits.maxFiles})`
      );
      return {
        validFiles: [],
        rejectedFiles: files.map((file) => ({
          file,
          reason: 'total_count',
          message: 'Excede el número máximo de archivos',
        })),
        errors,
        warnings,
        stats: {
          totalFiles: files.length,
          validFiles: 0,
          rejectedFiles: files.length,
          totalSize,
          validSize: 0,
          rejectedSize: totalSize,
        },
      };
    }
  }

  // Limitar archivos si autoFilter está activado
  const filesToProcess = limits.autoFilter
    ? files.slice(0, limits.maxFiles)
    : files;

  let accumulatedSize = 0;

  // Validar cada archivo
  for (const file of filesToProcess) {
    // 1. Validar tipo de archivo
    if (!isValidImageType(file)) {
      rejectedFiles.push({
        file,
        reason: 'type',
        message: `"${file.name}" no es una imagen válida`,
      });
      rejectedSize += file.size;
      continue;
    }

    // 2. Validar tamaño individual
    if (file.size > limits.maxFileSize) {
      rejectedFiles.push({
        file,
        reason: 'size',
        message: `"${file.name}" (${formatBytes(
          file.size
        )}) supera el límite de ${formatBytes(limits.maxFileSize)}`,
      });
      rejectedSize += file.size;

      if (limits.showWarnings) {
        warnings.push(
          `⚠️ Archivo demasiado grande: "${file.name}" (${formatBytes(
            file.size
          )}) supera el límite de ${formatBytes(limits.maxFileSize)}`
        );
      }
      continue;
    }

    // 3. Validar tamaño total acumulado
    if (accumulatedSize + file.size > limits.maxTotalSize) {
      rejectedFiles.push({
        file,
        reason: 'total_size',
        message: `"${
          file.name
        }" excedería el tamaño total máximo de ${formatBytes(
          limits.maxTotalSize
        )}`,
      });
      rejectedSize += file.size;

      if (limits.showWarnings && validFiles.length > 0) {
        warnings.push(
          `⚠️ Límite de tamaño total alcanzado (${formatBytes(
            limits.maxTotalSize
          )}). ` + `No se pueden procesar más archivos.`
        );
      }
      continue;
    }

    // Archivo válido
    validFiles.push(file);
    validSize += file.size;
    accumulatedSize += file.size;
  }

  // Generar mensajes de error si no hay archivos válidos
  if (validFiles.length === 0) {
    if (rejectedFiles.length > 0) {
      errors.push(
        `❌ No se pudo procesar ningún archivo. Por favor, verifica los límites y tipos de archivo.`
      );
    } else {
      errors.push(`❌ No se seleccionaron archivos válidos.`);
    }
  }

  // Generar resumen de advertencias
  if (rejectedFiles.length > 0 && validFiles.length > 0) {
    warnings.push(
      `ℹ️ ${rejectedFiles.length} archivo${
        rejectedFiles.length > 1 ? 's' : ''
      } ` +
        `${rejectedFiles.length > 1 ? 'fueron rechazados' : 'fue rechazado'} ` +
        `(${formatBytes(rejectedSize)})`
    );
  }

  return {
    validFiles,
    rejectedFiles,
    errors,
    warnings,
    stats: {
      totalFiles: files.length,
      validFiles: validFiles.length,
      rejectedFiles: rejectedFiles.length,
      totalSize,
      validSize,
      rejectedSize,
    },
  };
}

/**
 * Genera un mensaje resumen de la validación
 */
export function getValidationSummary(result: ValidationResult): string {
  const { stats } = result;

  if (stats.validFiles === 0) {
    return `❌ No se pudieron validar archivos`;
  }

  if (stats.rejectedFiles === 0) {
    return `✅ ${stats.validFiles} archivo${
      stats.validFiles > 1 ? 's' : ''
    } válido${stats.validFiles > 1 ? 's' : ''} (${formatBytes(
      stats.validSize
    )})`;
  }

  return (
    `✅ ${stats.validFiles} válido${stats.validFiles > 1 ? 's' : ''}, ` +
    `❌ ${stats.rejectedFiles} rechazado${stats.rejectedFiles > 1 ? 's' : ''}`
  );
}
