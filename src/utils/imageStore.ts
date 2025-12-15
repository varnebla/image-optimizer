import { ref, reactive, watch } from 'vue';
import type { OptimizeOptions, OptimizeResult } from './imageUtils';
import type {
  FileLimits,
  ValidationResult,
  RejectedFile,
} from './fileValidation';
import { DEFAULT_LIMITS } from './fileValidation';

export type LogEntry = {
  id: string;
  timestamp: number;
  fileName: string;
  originalSize: number;
  optimizedSize: number;
  format: string;
  savingsPercentage: number;
};

// Claves de localStorage
const STORAGE_KEYS = {
  OPTIONS: 'image-optimizer-options',
  AUTO_OPTIMIZE: 'image-optimizer-auto-optimize',
  FILE_LIMITS: 'image-optimizer-file-limits',
} as const;

/**
 * Carga configuración desde localStorage
 */
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
}

/**
 * Guarda configuración en localStorage
 */
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error saving ${key} to localStorage:`, error);
  }
}

// Valores por defecto
const DEFAULT_OPTIONS: OptimizeOptions = {
  maxWidth: 1920,
  format: 'webp',
  quality: 80,
  stripMetadata: true,
};

export const files = ref<File[]>([]);
export const options = reactive<OptimizeOptions>(
  loadFromStorage(STORAGE_KEYS.OPTIONS, DEFAULT_OPTIONS)
);
export const progress = ref<{ name: string; progress: number }[]>([]);
export const results = ref<OptimizeResult[]>([]);
export const sessionLog = ref<LogEntry[]>([]);
export const zipBlob = ref<Blob | null>(null);
export const isProcessing = ref(false);
export const error = ref('');

// Auto-optimización (cargada desde localStorage)
export const autoOptimize = ref(
  loadFromStorage(STORAGE_KEYS.AUTO_OPTIMIZE, true)
);

// Control de visibilidad del panel de ajustes
export const showSettings = ref(false);

// Límites de validación de archivos (cargados desde localStorage)
export const fileLimits = reactive<FileLimits>(
  loadFromStorage(STORAGE_KEYS.FILE_LIMITS, { ...DEFAULT_LIMITS })
);

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

// Watchers para guardar cambios automáticamente en localStorage
watch(
  options,
  (newOptions) => {
    saveToStorage(STORAGE_KEYS.OPTIONS, newOptions);
  },
  { deep: true }
);

watch(autoOptimize, (newValue) => {
  saveToStorage(STORAGE_KEYS.AUTO_OPTIMIZE, newValue);
});

watch(
  fileLimits,
  (newLimits) => {
    saveToStorage(STORAGE_KEYS.FILE_LIMITS, newLimits);
  },
  { deep: true }
);
