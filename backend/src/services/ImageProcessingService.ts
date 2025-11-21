import sharp from 'sharp';

export interface ImageMetadata {
  width: number;
  height: number;
  bitDepth: number;
  colorSpace: string;
  format: string;
  hasAlpha: boolean;
}

export class ImageProcessingService {
  /**
   * Process and extract metadata from standard image formats
   */
  async processImage(buffer: Buffer): Promise<ImageMetadata> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        bitDepth: metadata.depth ? this.getBitDepth(metadata.depth) : 8,
        colorSpace: metadata.space || 'unknown',
        format: metadata.format || 'unknown',
        hasAlpha: metadata.hasAlpha || false,
      };
    } catch (error) {
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate thumbnail from image
   */
  async generateThumbnail(buffer: Buffer, size: number = 300): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(size, size, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (error) {
      throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate image integrity
   */
  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      const image = sharp(buffer);
      await image.metadata();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert image to specific format
   */
  async convertImage(buffer: Buffer, format: 'jpeg' | 'png' | 'tiff'): Promise<Buffer> {
    try {
      const image = sharp(buffer);

      switch (format) {
        case 'jpeg':
          return await image.jpeg({ quality: 95 }).toBuffer();
        case 'png':
          return await image.png({ compressionLevel: 6 }).toBuffer();
        case 'tiff':
          return await image.tiff({ compression: 'lzw' }).toBuffer();
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Failed to convert image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resize image while preserving aspect ratio
   */
  async resizeImage(buffer: Buffer, width?: number, height?: number): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toBuffer();
    } catch (error) {
      throw new Error(`Failed to resize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get bit depth from Sharp depth string
   */
  private getBitDepth(depth: string): number {
    const depthMap: Record<string, number> = {
      'uchar': 8,
      'char': 8,
      'ushort': 16,
      'short': 16,
      'uint': 32,
      'int': 32,
      'float': 32,
      'double': 64,
    };

    return depthMap[depth] || 8;
  }
}

export const imageProcessingService = new ImageProcessingService();
