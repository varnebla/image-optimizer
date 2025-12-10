import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ImageDrop from '../components/ImageDrop.vue';
import OptimizeButton from '../components/OptimizeButton.vue';
import { files, results, sessionLog, isProcessing, progress, error, validationInfo } from '@utils/imageStore';
import * as imageUtils from '@utils/imageUtils';

const { optimizeImageMock } = vi.hoisted(() => ({
  optimizeImageMock: vi.fn().mockImplementation(async () => {
    console.log('Mock optimizeImage called (default)');
    return {
      name: 'test.webp',
      originalName: 'test.jpg',
      originalSize: 1000,
      optimizedSize: 500,
      blob: new Blob(['fake-webp'], { type: 'image/webp' }),
      width: 800,
      height: 600,
      format: 'webp',
      processingTime: 100,
    };
  }),
}));

// Mock optimizeImage to avoid real processing
vi.mock('@utils/imageUtils', async () => {
  const actual = await vi.importActual<typeof import('@utils/imageUtils')>('@utils/imageUtils');
  return {
    ...actual,
    optimizeImage: optimizeImageMock,
  };
});

vi.mock('../utils/imageUtils', async () => {
  const actual = await vi.importActual<typeof import('@utils/imageUtils')>('@utils/imageUtils');
  return {
    ...actual,
    optimizeImage: optimizeImageMock,
  };
});

vi.mock('src/utils/imageUtils', async () => {
  const actual = await vi.importActual<typeof import('@utils/imageUtils')>('@utils/imageUtils');
  return {
    ...actual,
    optimizeImage: optimizeImageMock,
  };
});

// Mock window.umami
(global.window as any).umami = {
  track: vi.fn(),
};

describe('Image Optimization Flow', () => {
  beforeEach(() => {
    // Reset store
    files.value = [];
    results.value = [];
    sessionLog.value = [];
    progress.value = [];
    error.value = '';
    validationInfo.hasWarnings = false;
    validationInfo.warnings = [];
    validationInfo.rejectedFiles = [];
    
    vi.clearAllMocks();
    // Reset mock implementation to default resolved value
    optimizeImageMock.mockReset();
    optimizeImageMock.mockImplementation(async () => {
      console.log('Mock optimizeImage called (success)');
      return {
        name: 'test.webp',
        originalName: 'test.jpg',
        originalSize: 1000,
        optimizedSize: 500,
        blob: new Blob(['fake-webp'], { type: 'image/webp' }),
        width: 800,
        height: 600,
        format: 'webp',
        processingTime: 100,
      };
    });
  });

  it('should handle file selection, validation and optimization flow', async () => {
    // 1. Mount ImageDrop
    const dropWrapper = mount(ImageDrop);
    
    // Simulate file selection
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = dropWrapper.find('input[type="file"]');
    
    // Define files property on the input element manually since happy-dom might need help
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });
    
    await input.trigger('change');

    // Assert files are in store
    expect(files.value).toHaveLength(1);
    expect(files.value[0].name).toBe('test.jpg');
    expect((window as any).umami.track).toHaveBeenCalledWith('Archivos añadidos', { archivos: 1 });

    // 2. Mount OptimizeButton
    const buttonWrapper = mount(OptimizeButton);
    
    // Assert button is enabled
    const button = buttonWrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.attributes('disabled')).toBeUndefined();

    // 3. Trigger Optimization
    await button.trigger('click');

    // Wait for async operations (optimizeImages is async)
    // We can wait for isProcessing to go back to false
    await new Promise(resolve => setTimeout(resolve, 10)); 

    // Assert optimizeImage was called
    expect(optimizeImageMock).toHaveBeenCalledTimes(1);
    expect(optimizeImageMock).toHaveBeenCalledWith(file, expect.anything());

    // Assert results are updated
    expect(results.value).toHaveLength(1);
    expect(results.value[0].name).toBe('test.webp');
    expect(results.value[0].optimizedSize).toBe(500);

    // Assert session log is updated
    expect(sessionLog.value).toHaveLength(1);
    expect(sessionLog.value[0].fileName).toBe('test.jpg');
  });

  it('should handle validation errors (too many files)', async () => {
    const dropWrapper = mount(ImageDrop);
    const input = dropWrapper.find('input[type="file"]');
    
    // Create 51 files (assuming limit is 50)
    const manyFiles = Array.from({ length: 51 }, (_, i) => 
      new File(['x'], `test${i}.jpg`, { type: 'image/jpeg' })
    );

    Object.defineProperty(input.element, 'files', {
      value: manyFiles,
      writable: false,
    });
    
    await input.trigger('change');

    // Should have warnings
    expect(validationInfo.hasWarnings).toBe(true);
    // Should only accept up to the limit (or reject all depending on logic, let's check behavior)
    // Based on standard logic, it usually rejects or takes first N. 
    // Let's assume it might reject or warn.
    // Checking validationInfo.warnings
    expect(validationInfo.warnings.length).toBeGreaterThan(0);
  });

  it('should handle empty file list', async () => {
    // Start with no files
    expect(files.value).toHaveLength(0);
    
    const buttonWrapper = mount(OptimizeButton);
    const button = buttonWrapper.find('button');
    
    // Button should be disabled when no files
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('should handle multiple files sequentially', async () => {
    const dropWrapper = mount(ImageDrop);
    const input = dropWrapper.find('input[type="file"]');
    
    const files1 = [
      new File(['dummy1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['dummy2'], 'test2.jpg', { type: 'image/jpeg' }),
      new File(['dummy3'], 'test3.png', { type: 'image/png' }),
    ];
    
    Object.defineProperty(input.element, 'files', {
      value: files1,
      writable: false,
    });
    
    await input.trigger('change');
    expect(files.value).toHaveLength(3);
    
    // Verify progress array is initialized for all files
    expect(progress.value).toHaveLength(3);
    expect(progress.value[0].progress).toBe(0);
    expect(progress.value[1].progress).toBe(0);
    expect(progress.value[2].progress).toBe(0);
  });

  it('should reject non-image files', async () => {
    const dropWrapper = mount(ImageDrop);
    const input = dropWrapper.find('input[type="file"]');
    
    const mixedFiles = [
      new File(['image'], 'photo.jpg', { type: 'image/jpeg' }),
      new File(['text'], 'document.txt', { type: 'text/plain' }),
      new File(['video'], 'movie.mp4', { type: 'video/mp4' }),
    ];
    
    Object.defineProperty(input.element, 'files', {
      value: mixedFiles,
      writable: false,
    });
    
    await input.trigger('change');
    
    // Only image file should be accepted
    expect(files.value).toHaveLength(1);
    expect(files.value[0].name).toBe('photo.jpg');
    
    // Should have rejected files
    expect(validationInfo.rejectedFiles.length).toBe(2);
  });

  it('should handle drag and drop', async () => {
    const dropWrapper = mount(ImageDrop);
    const dropZone = dropWrapper.find('#drop-zone');
    
    const file = new File(['dummy'], 'dropped.jpg', { type: 'image/jpeg' });
    const dataTransfer = {
      files: [file],
    };
    
    // Simulate drag enter
    await dropZone.trigger('dragenter', { dataTransfer });
    
    // Simulate drop
    await dropZone.trigger('drop', { dataTransfer });
    
    expect(files.value).toHaveLength(1);
    expect(files.value[0].name).toBe('dropped.jpg');
  });

  it('should handle files exceeding size limit', async () => {
    const dropWrapper = mount(ImageDrop);
    const input = dropWrapper.find('input[type="file"]');
    
    // Create a file larger than the limit (12MB)
    const largeFileSize = 13 * 1024 * 1024; // 13MB
    const largeFile = new File([new ArrayBuffer(largeFileSize)], 'huge.jpg', { type: 'image/jpeg' });
    
    // Define size property
    Object.defineProperty(largeFile, 'size', {
      value: largeFileSize,
      writable: false,
    });
    
    Object.defineProperty(input.element, 'files', {
      value: [largeFile],
      writable: false,
    });
    
    await input.trigger('change');
    
    // File should be rejected
    expect(files.value).toHaveLength(0);
    expect(validationInfo.rejectedFiles.length).toBe(1);
    expect(validationInfo.rejectedFiles[0].reason).toBe('size');
  });
});
