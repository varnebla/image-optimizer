/**
 * Sistema de presets de configuración
 * Incluye presets predefinidos y gestión de presets personalizados
 */

import type { OptimizeOptions } from './imageUtils';
import { useTranslations } from '@i18n/utils';
import type { Lang } from '@i18n/ui';

export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: OptimizeOptions;
  isCustom?: boolean;
}

// Presets predefinidos
export function getPredefinedPresets(lang: Lang): Preset[] {
  const t = useTranslations(lang);
  
  return [
    {
      id: 'web-performance',
      name: t('preset.webPerformance.name'),
      description: t('preset.webPerformance.description'),
      icon: '🚀',
      config: {
        maxWidth: 1920,
        format: 'webp',
        quality: 75,
      },
    },
    {
      id: 'high-quality',
      name: t('preset.highQuality.name'),
      description: t('preset.highQuality.description'),
      icon: '🎨',
      config: {
        maxWidth: 2560,
        format: 'webp',
        quality: 90,
      },
    },
    {
      id: 'social-media',
      name: t('preset.socialMedia.name'),
      description: t('preset.socialMedia.description'),
      icon: '📱',
      config: {
        maxWidth: 1080,
        format: 'webp',
        quality: 80,
      },
    },
    {
      id: 'modern-format',
      name: t('preset.modernFormat.name'),
      description: t('preset.modernFormat.description'),
      icon: '🔬',
      config: {
        maxWidth: 1920,
        format: 'avif',
        quality: 65,
      },
    },
    {
      id: 'balanced',
      name: t('preset.balanced.name'),
      description: t('preset.balanced.description'),
      icon: '⚖️',
      config: {
        maxWidth: 1920,
        format: 'webp',
        quality: 80,
      },
    },
  ];
}

const CUSTOM_PRESETS_KEY = 'image-optimizer-custom-presets';
const LAST_PRESET_KEY = 'image-optimizer-last-preset';

/**
 * Obtiene todos los presets (predefinidos + personalizados)
 */
export function getAllPresets(lang: Lang): Preset[] {
  const customPresets = getCustomPresets();
  return [...getPredefinedPresets(lang), ...customPresets];
}

/**
 * Obtiene solo los presets personalizados desde localStorage
 */
export function getCustomPresets(): Preset[] {
  try {
    const stored = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error al cargar presets personalizados:', error);
    return [];
  }
}

/**
 * Guarda los presets personalizados en localStorage
 */
function saveCustomPresets(presets: Preset[]): void {
  try {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
  } catch (error) {
    console.error('Error al guardar presets personalizados:', error);
  }
}

/**
 * Crea un nuevo preset personalizado
 */
export function createCustomPreset(
  name: string,
  description: string,
  config: OptimizeOptions
): Preset {
  const id = `custom-${Date.now()}`;
  const preset: Preset = {
    id,
    name,
    description,
    icon: '💾',
    config,
    isCustom: true,
  };

  const customPresets = getCustomPresets();
  customPresets.push(preset);
  saveCustomPresets(customPresets);

  console.log('✅ Preset personalizado creado:', name);
  return preset;
}

/**
 * Actualiza un preset personalizado existente
 */
export function updateCustomPreset(
  id: string,
  updates: Partial<Omit<Preset, 'id' | 'isCustom'>>
): boolean {
  const customPresets = getCustomPresets();
  const index = customPresets.findIndex((p) => p.id === id);

  if (index === -1) {
    console.error('Preset no encontrado:', id);
    return false;
  }

  customPresets[index] = {
    ...customPresets[index],
    ...updates,
  };

  saveCustomPresets(customPresets);
  console.log('✅ Preset actualizado:', customPresets[index].name);
  return true;
}

/**
 * Elimina un preset personalizado
 */
export function deleteCustomPreset(id: string): boolean {
  const customPresets = getCustomPresets();
  const filtered = customPresets.filter((p) => p.id !== id);

  if (filtered.length === customPresets.length) {
    console.error('Preset no encontrado:', id);
    return false;
  }

  saveCustomPresets(filtered);
  console.log('✅ Preset eliminado');
  return true;
}

/**
 * Busca un preset por ID
 */
export function getPresetById(id: string, lang: Lang): Preset | null {
  const allPresets = getAllPresets(lang);
  return allPresets.find((p) => p.id === id) || null;
}

/**
 * Guarda el ID del último preset usado
 */
export function saveLastUsedPreset(id: string): void {
  try {
    localStorage.setItem(LAST_PRESET_KEY, id);
  } catch (error) {
    console.error('Error al guardar último preset:', error);
  }
}

/**
 * Obtiene el ID del último preset usado
 */
export function getLastUsedPresetId(): string | null {
  try {
    return localStorage.getItem(LAST_PRESET_KEY);
  } catch (error) {
    console.error('Error al cargar último preset:', error);
    return null;
  }
}

/**
 * Exporta presets personalizados a JSON
 */
export function exportCustomPresets(): string {
  const customPresets = getCustomPresets();
  return JSON.stringify(customPresets, null, 2);
}

/**
 * Importa presets personalizados desde JSON
 */
export function importCustomPresets(json: string): boolean {
  try {
    const imported: Preset[] = JSON.parse(json);

    // Validar que sea un array válido
    if (!Array.isArray(imported)) {
      throw new Error('Formato inválido: se esperaba un array');
    }

    // Validar cada preset
    for (const preset of imported) {
      if (!preset.id || !preset.name || !preset.config) {
        throw new Error(`Preset inválido: ${JSON.stringify(preset)}`);
      }
    }

    // Combinar con presets existentes (evitar duplicados)
    const existing = getCustomPresets();
    const existingIds = new Set(existing.map((p) => p.id));

    const newPresets = imported.filter((p) => !existingIds.has(p.id));
    const combined = [...existing, ...newPresets];

    saveCustomPresets(combined);
    console.log(`✅ ${newPresets.length} presets importados`);
    return true;
  } catch (error) {
    console.error('Error al importar presets:', error);
    return false;
  }
}

/**
 * Aplica un preset a la configuración actual
 */
export function applyPreset(
  preset: Preset,
  currentOptions: OptimizeOptions
): OptimizeOptions {
  return {
    ...currentOptions,
    ...preset.config,
  };
}
