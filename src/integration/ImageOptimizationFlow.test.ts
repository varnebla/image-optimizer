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

  it('should handle file selection, validation and auto-optimization flow', async () => {
    // 1. Mount ImageDrop
    const dropWrapper = mount(ImageDrop, { props: { lang: 'es' } });
    
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

    // Wait for auto-optimization to complete (autoOptimize is true by default)
    // The timeout is 300ms in the component plus processing time
    await new Promise(resolve => setTimeout(resolve, 400));

    // Assert optimizeImage was called automatically
    expect(optimizeImageMock).toHaveBeenCalledTimes(1);
    expect(optimizeImageMock).toHaveBeenCalledWith(file, expect.anything());

    // Assert results are updated
    expect(results.value).toHaveLength(1);
    expect(results.value[0].name).toBe('test.webp');
    expect(results.value[0].optimizedSize).toBe(500);

    // Assert session log is updated
    expect(sessionLog.value).toHaveLength(1);
    expect(sessionLog.value[0].fileName).toBe('test.jpg');

    // 2. Test re-optimization: Mount OptimizeButton and verify re-optimize button appears
    const buttonWrapper = mount(OptimizeButton, { props: { lang: 'es' } });
    
    // The re-optimize button should now be visible (results.length > 0)
    const buttons = buttonWrapper.findAll('button');
    expect(buttons.length).toBeGreaterThan(1); // Settings button + re-optimize button
  });

  it('should handle validation errors (too many files)', async () => {
    const dropWrapper = mount(ImageDrop, { props: { lang: 'es' } });
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
    // Start with no files and no results
    expect(files.value).toHaveLength(0);
    expect(results.value).toHaveLength(0);
    
    const buttonWrapper = mount(OptimizeButton, { props: { lang: 'es' } });
    const buttons = buttonWrapper.findAll('button');
    
    // Only settings button should be visible (re-optimize button hidden when results.length === 0)
    expect(buttons.length).toBe(1);
    
    // The visible button should be the settings button (not disabled)
    const settingsButton = buttons[0];
    expect(settingsButton.exists()).toBe(true);
    expect(settingsButton.attributes('disabled')).toBeUndefined();
  });

  it('should handle multiple files sequentially', async () => {
    const dropWrapper = mount(ImageDrop, { props: { lang: 'es' } });
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
    const dropWrapper = mount(ImageDrop, { props: { lang: 'es' } });
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
    const dropWrapper = mount(ImageDrop, { props: { lang: 'es' } });
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
    const dropWrapper = mount(ImageDrop, { props: { lang: 'es' } });
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

  it('should handle re-optimization flow', async () => {
    // 1. First optimization: Add files
    const dropWrapper = mount(ImageDrop, { props: { lang: 'es' } });
    const input = dropWrapper.find('input[type="file"]');
    
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });
    
    await input.trigger('change');
    
    // Wait for auto-optimization
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Assert first optimization completed
    expect(results.value).toHaveLength(1);
    expect(optimizeImageMock).toHaveBeenCalledTimes(1);
    
    // Clear mock calls for re-optimization test
    vi.clearAllMocks();
    
    // 2. Mount OptimizeButton and test re-optimization
    const buttonWrapper = mount(OptimizeButton, { props: { lang: 'es' } });
    const buttons = buttonWrapper.findAll('button');
    
    // Find re-optimize button (second button)
    expect(buttons.length).toBe(2);
    const reOptimizeButton = buttons[1];
    
    // Verify re-optimize button is not disabled
    expect(reOptimizeButton.attributes('disabled')).toBeUndefined();
    
    // Trigger re-optimization
    await reOptimizeButton.trigger('click');
    
    // Wait for re-optimization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Assert optimizeImage was called again
    expect(optimizeImageMock).toHaveBeenCalledTimes(1);
    
    // Results should still have the optimized image
    expect(results.value).toHaveLength(1);
  });

  it('should track validation errors with Umami', async () => {
    // Clear previous Umami calls
    vi.clearAllMocks();
    
    // Test 1: Invalid file type
    const dropWrapper1 = mount(ImageDrop, { props: { lang: 'es' } });
    const input1 = dropWrapper1.find('input[type="file"]');
    
    const invalidFile = new File(['text'], 'document.txt', { type: 'text/plain' });
    Object.defineProperty(input1.element, 'files', {
      value: [invalidFile],
      writable: false,
    });
    
    await input1.trigger('change');
    
    // Assert Umami track was called for validation error
    expect((window as any).umami.track).toHaveBeenCalledWith('validation-error', {
      reason: 'type',
      fileCount: 1,
      totalSize: 4, // 'text' has 4 bytes
    });
    
    // Clear for test 2: File too large
    vi.clearAllMocks();
    files.value = [];
    validationInfo.rejectedFiles = [];
    
    // Mount a new component instance for the second test
    const dropWrapper2 = mount(ImageDrop, { props: { lang: 'es' } });
    const input2 = dropWrapper2.find('input[type="file"]');
    
    const largeFileSize = 13 * 1024 * 1024; // 13MB
    const largeFile = new File([new ArrayBuffer(largeFileSize)], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', {
      value: largeFileSize,
      writable: false,
    });
    
    Object.defineProperty(input2.element, 'files', {
      value: [largeFile],
      writable: false,
    });
    
    await input2.trigger('change');
    
    // Assert Umami track was called for size error
    expect((window as any).umami.track).toHaveBeenCalledWith('validation-error', {
      reason: 'size',
      fileCount: 1,
      totalSize: largeFileSize,
    });
  });
});
