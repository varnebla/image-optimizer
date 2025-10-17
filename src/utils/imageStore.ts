import { ref, reactive } from 'vue';
import type { OptimizeOptions, OptimizeResult } from './imageUtils';
import type {
  FileLimits,
  ValidationResult,
  RejectedFile,
} from './fileValidation';
import { DEFAULT_LIMITS } from './fileValidation';

export const files = ref<File[]>([]);
export const options = reactive<OptimizeOptions>({
  maxWidth: 1920,
  format: 'webp',
  quality: 80,
});
export const progress = ref<{ name: string; progress: number }[]>([]);
export const results = ref<OptimizeResult[]>([]);
export const zipBlob = ref<Blob | null>(null);
export const isProcessing = ref(false);
export const error = ref('');

// Límites de validación de archivos
export const fileLimits = reactive<FileLimits>({ ...DEFAULT_LIMITS });

// Información de validación
export const validationInfo = reactive<{
  hasWarnings: boolean;
  warnings: string[];
  rejectedFiles: RejectedFile[];
  stats: ValidationResult['stats'] | null;
}>({
  hasWarnings: false,
  warnings: [],
  rejectedFiles: [],
  stats: null,
});
