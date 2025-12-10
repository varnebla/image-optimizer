import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { optimizeImage } from './imageUtils';
import exifr from 'exifr';
import Pica from 'pica';

// Mock dependencies
vi.mock('exifr', () => ({
  default: {
    orientation: vi.fn(),
  },
}));

const { resizeMock, toBlobMock } = vi.hoisted(() => ({
  resizeMock: vi.fn().mockResolvedValue(undefined),
  toBlobMock: vi.fn().mockResolvedValue(new Blob(['webp-data'], { type: 'image/webp' })),
}));

vi.mock('pica', () => {
  return {
    default: class {
      resize = resizeMock;
      toBlob = toBlobMock;
    }
  };
});

// Mock dynamic import for AVIF
const { encodeMock } = vi.hoisted(() => ({
  encodeMock: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

vi.mock('https://esm.sh/@jsquash/avif', () => ({
  encode: encodeMock,
}));

describe('optimizeImage', () => {
  const mockFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock global createImageBitmap
    global.createImageBitmap = vi.fn().mockResolvedValue({
      width: 1000,
      height: 800,
      close: vi.fn(),
    } as unknown as ImageBitmap);

    // Mock Canvas API
    mockContext = {
      drawImage: vi.fn(),
      transform: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray([0, 0, 0, 0]),
        width: 100,
        height: 100,
      }),
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should optimize image to WebP with resizing', async () => {
    (exifr.orientation as Mock).mockResolvedValue(1);

    const result = await optimizeImage(mockFile, {
      maxWidth: 500,
      format: 'webp',
      quality: 80,
    });

    expect(result.name).toBe('test.webp');
    expect(result.format).toBe('webp');
    expect(result.width).toBe(500);
    // 1000x800 -> 500x400
    expect(result.height).toBe(400);
    expect(resizeMock).toHaveBeenCalled();
    expect(mockContext.drawImage).toHaveBeenCalled();
  });

  it('should optimize image to WebP without resizing', async () => {
    (exifr.orientation as Mock).mockResolvedValue(1);
    // Mock smaller image
    (global.createImageBitmap as Mock).mockResolvedValue({
      width: 400,
      height: 300,
      close: vi.fn(),
    } as unknown as ImageBitmap);

    const result = await optimizeImage(mockFile, {
      maxWidth: 500,
      format: 'webp',
      quality: 80,
    });

    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
    expect(resizeMock).toHaveBeenCalled();
  });

  it('should optimize image to AVIF', async () => {
    (exifr.orientation as Mock).mockResolvedValue(1);

    const result = await optimizeImage(mockFile, {
      maxWidth: 500,
      format: 'avif',
      quality: 80,
    });

    expect(result.name).toBe('test.avif');
    expect(result.format).toBe('avif');
    expect(encodeMock).toHaveBeenCalled();
    expect(toBlobMock).not.toHaveBeenCalled();
  });

  it('should handle EXIF rotation', async () => {
    const orientations = [2, 3, 4, 5, 6, 7, 8];
    
    for (const orientation of orientations) {
      (exifr.orientation as Mock).mockResolvedValue(orientation);
      
      await optimizeImage(mockFile, {
        maxWidth: 500,
        format: 'webp',
        quality: 80,
      });
      
      expect(mockContext.transform).toHaveBeenCalled();
      mockContext.transform.mockClear();
    }
  });

  it('should throw error if source context cannot be created', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    
    await expect(optimizeImage(mockFile, {
      maxWidth: 500,
      format: 'webp',
      quality: 80,
    })).rejects.toThrow('No se pudo obtener contexto 2D');
  });

  it('should throw error if target context cannot be created for AVIF', async () => {
    // First call to getContext (source) succeeds, second (target) fails
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValueOnce(mockContext)
      .mockReturnValueOnce(null);

    await expect(optimizeImage(mockFile, {
      maxWidth: 500,
      format: 'avif',
      quality: 80,
    })).rejects.toThrow('No se pudo obtener contexto 2D');
  });

  it('should handle unknown EXIF orientation', async () => {
    (exifr.orientation as Mock).mockResolvedValue(999);
    
    await optimizeImage(mockFile, {
      maxWidth: 500,
      format: 'webp',
      quality: 80,
    });
    
    expect(mockContext.transform).not.toHaveBeenCalled();
    expect(mockContext.drawImage).toHaveBeenCalled();
  });

  it('should handle EXIF reading error', async () => {
    (exifr.orientation as Mock).mockRejectedValue(new Error('EXIF error'));
    
    const result = await optimizeImage(mockFile, {
      maxWidth: 500,
      format: 'webp',
      quality: 80,
    });
    
    expect(result.exifOrientation).toBeUndefined();
    expect(mockContext.drawImage).toHaveBeenCalled();
  });
});
