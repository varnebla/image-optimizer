/**
 * Utilidades para validación de archivos
 * Maneja límites de tamaño, cantidad y validaciones generales
 */

import type { ui, Lang } from '@i18n/ui';

// Declaración global de Umami
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, any>) => void;
    };
  }
}

type TranslationFunction = (key: keyof typeof ui[Lang]) => string;

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
 * Envía evento de tracking a Umami Analytics cuando hay errores de validación
 */
function trackValidationError(
  reason: 'size' | 'type' | 'total_count' | 'total_size',
  fileCount: number,
  totalSize?: number
): void {
  // Solo enviar si Umami está disponible y no estamos en desarrollo
  if (
    typeof window !== 'undefined' &&
    window.umami &&
    !localStorage.getItem('umami.disabled')
  ) {
    window.umami.track('validation-error', {
      reason,
      fileCount,
      totalSize: totalSize || 0,
    });
  }
}

/**
 * Reemplaza placeholders en strings de traducción
 */
function replacePlaceholders(
  text: string,
  replacements: Record<string, string | number>
): string {
  let result = text;
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  });
  return result;
}

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
  t: TranslationFunction,
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
    if (limits.autoFilter) {
      warnings.push(
        '⚠️ ' +
          replacePlaceholders(t('validation.filesExceeded'), {
            count: files.length,
            limit: limits.maxFiles,
          })
      );
    } else {
      const errorMsg =
        '❌ ' +
        replacePlaceholders(t('validation.filesLimitError'), {
          count: files.length,
          limit: limits.maxFiles,
        });
      errors.push(errorMsg);

      // Track error
      trackValidationError('total_count', files.length, totalSize);

      return {
        validFiles: [],
        rejectedFiles: files.map((file) => ({
          file,
          reason: 'total_count',
          message: t('validation.maxFilesError'),
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
        message: replacePlaceholders(t('validation.invalidFileType'), {
          name: file.name,
        }),
      });
      rejectedSize += file.size;

      // Track error
      trackValidationError('type', 1, file.size);
      continue;
    }

    // 2. Validar tamaño individual
    if (file.size > limits.maxFileSize) {
      const fileSize = formatBytes(file.size);
      const limitSize = formatBytes(limits.maxFileSize);

      rejectedFiles.push({
        file,
        reason: 'size',
        message: replacePlaceholders(t('validation.fileTooLarge'), {
          name: file.name,
          size: fileSize,
          limit: limitSize,
        }),
      });
      rejectedSize += file.size;

      if (limits.showWarnings) {
        warnings.push(
          '⚠️ ' +
            replacePlaceholders(t('validation.fileTooLargeWarning'), {
              name: file.name,
              size: fileSize,
              limit: limitSize,
            })
        );
      }

      // Track error
      trackValidationError('size', 1, file.size);
      continue;
    }

    // 3. Validar tamaño total acumulado
    if (accumulatedSize + file.size > limits.maxTotalSize) {
      rejectedFiles.push({
        file,
        reason: 'total_size',
        message: replacePlaceholders(t('validation.totalSizeExceeded'), {
          name: file.name,
          limit: formatBytes(limits.maxTotalSize),
        }),
      });
      rejectedSize += file.size;

      if (limits.showWarnings && validFiles.length > 0) {
        warnings.push(
          '⚠️ ' +
            replacePlaceholders(t('validation.totalSizeWarning'), {
              limit: formatBytes(limits.maxTotalSize),
            })
        );
      }

      // Track error
      trackValidationError('total_size', 1, file.size);
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
      errors.push('❌ ' + t('validation.noValidFiles'));
    } else {
      errors.push('❌ ' + t('validation.noFilesSelected'));
    }
  }

  // Generar resumen de advertencias
  if (rejectedFiles.length > 0 && validFiles.length > 0) {
    const plural = rejectedFiles.length > 1 ? 's' : '';
    const rejectedPlural =
      rejectedFiles.length > 1
        ? (t('validationWarnings.files') || 'fueron rechazados')
        : 'fue rechazado';

    warnings.push(
      'ℹ️ ' +
        replacePlaceholders(t('validation.rejectionSummary'), {
          count: rejectedFiles.length,
          plural,
          rejectedPlural,
          size: formatBytes(rejectedSize),
        })
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
export function getValidationSummary(
  result: ValidationResult,
  t: TranslationFunction
): string {
  const { stats } = result;

  if (stats.validFiles === 0) {
    return '❌ ' + t('validation.summaryNoFiles');
  }

  if (stats.rejectedFiles === 0) {
    const plural = stats.validFiles > 1 ? 's' : '';
    const validPlural = stats.validFiles > 1 ? 's' : '';
    return (
      '✅ ' +
      replacePlaceholders(t('validation.summaryValid'), {
        count: stats.validFiles,
        plural,
        validPlural,
        size: formatBytes(stats.validSize),
      })
    );
  }

  const validPlural = stats.validFiles > 1 ? 's' : '';
  const rejectedPlural = stats.rejectedFiles > 1 ? 's' : '';
  return (
    '✅ ' +
    replacePlaceholders(t('validation.summaryMixed'), {
      validCount: stats.validFiles,
      validPlural,
      rejectedCount: stats.rejectedFiles,
      rejectedPlural,
    })
  );
}
