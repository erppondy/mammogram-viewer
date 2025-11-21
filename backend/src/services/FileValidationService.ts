export type SupportedFormat = 'dicom' | 'aan' | 'jpeg' | 'png' | 'tiff' | 'zip';

export interface ValidationResult {
  isValid: boolean;
  format?: SupportedFormat;
  error?: string;
}

export class FileValidationService {
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  // Magic numbers for file type detection
  private readonly MAGIC_NUMBERS: Record<string, Buffer[]> = {
    dicom: [Buffer.from([0x44, 0x49, 0x43, 0x4d])], // "DICM" at offset 128
    jpeg: [Buffer.from([0xff, 0xd8, 0xff])],
    png: [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    tiff: [
      Buffer.from([0x49, 0x49, 0x2a, 0x00]), // Little-endian
      Buffer.from([0x4d, 0x4d, 0x00, 0x2a]), // Big-endian
    ],
    zip: [
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      Buffer.from([0x50, 0x4b, 0x05, 0x06]),
      Buffer.from([0x50, 0x4b, 0x07, 0x08]),
    ],
  };

  /**
   * Validate file format and size
   */
  async validateFile(buffer: Buffer, filename: string): Promise<ValidationResult> {
    // Validate file size
    if (buffer.length > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${this.MAX_FILE_SIZE} bytes`,
      };
    }

    if (buffer.length === 0) {
      return {
        isValid: false,
        error: 'File is empty',
      };
    }

    // Detect format by magic number
    let detectedFormat = this.detectFormat(buffer);

    // If no format detected by magic number, try extension
    if (!detectedFormat) {
      const extension = this.getFileExtension(filename);
      
      // Check for DICOM by extension
      if (extension === 'dcm' || extension === 'dicom') {
        console.log('DICOM detected by file extension');
        return {
          isValid: true,
          format: 'dicom',
        };
      }
      
      // Check for AAN by extension
      if (extension === 'aan') {
        return {
          isValid: true,
          format: 'aan',
        };
      }

      return {
        isValid: false,
        error: 'Unsupported file format',
      };
    }

    return {
      isValid: true,
      format: detectedFormat,
    };
  }

  /**
   * Detect file format by magic number
   */
  private detectFormat(buffer: Buffer): SupportedFormat | null {
    // Check DICOM (magic number at offset 128)
    if (buffer.length >= 132) {
      const dicomMagic = buffer.slice(128, 132);
      if (this.matchesMagicNumber(dicomMagic, this.MAGIC_NUMBERS.dicom)) {
        return 'dicom';
      }
    }

    // Check other formats (magic number at start)
    for (const [format, magicNumbers] of Object.entries(this.MAGIC_NUMBERS)) {
      if (format === 'dicom') continue; // Already checked

      if (this.matchesMagicNumber(buffer, magicNumbers)) {
        return format as SupportedFormat;
      }
    }

    return null;
  }

  /**
   * Check if buffer matches any of the magic numbers
   */
  private matchesMagicNumber(buffer: Buffer, magicNumbers: Buffer[]): boolean {
    for (const magic of magicNumbers) {
      if (buffer.length < magic.length) continue;

      const slice = buffer.slice(0, magic.length);
      if (slice.equals(magic)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.toLowerCase().split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  /**
   * Validate DICOM file
   */
  async validateDicom(buffer: Buffer): Promise<ValidationResult> {
    if (buffer.length < 132) {
      return {
        isValid: false,
        error: 'File too small to be a valid DICOM file',
      };
    }

    const magic = buffer.slice(128, 132);
    const expectedMagic = Buffer.from([0x44, 0x49, 0x43, 0x4d]); // "DICM"

    if (!magic.equals(expectedMagic)) {
      return {
        isValid: false,
        error: 'Invalid DICOM file: missing DICM magic number',
      };
    }

    return {
      isValid: true,
      format: 'dicom',
    };
  }

  /**
   * Validate image file (JPEG, PNG, TIFF)
   */
  async validateImage(buffer: Buffer, format: 'jpeg' | 'png' | 'tiff'): Promise<ValidationResult> {
    const magicNumbers = this.MAGIC_NUMBERS[format];
    if (!this.matchesMagicNumber(buffer, magicNumbers)) {
      return {
        isValid: false,
        error: `Invalid ${format.toUpperCase()} file`,
      };
    }

    return {
      isValid: true,
      format,
    };
  }

  /**
   * Validate ZIP file
   */
  async validateZip(buffer: Buffer): Promise<ValidationResult> {
    if (!this.matchesMagicNumber(buffer, this.MAGIC_NUMBERS.zip)) {
      return {
        isValid: false,
        error: 'Invalid ZIP file',
      };
    }

    return {
      isValid: true,
      format: 'zip',
    };
  }

  /**
   * Validate .aan file (proprietary format)
   */
  async validateAan(buffer: Buffer): Promise<ValidationResult> {
    // Basic validation for .aan files
    // Since it's a proprietary format, we do minimal validation
    if (buffer.length < 100) {
      return {
        isValid: false,
        error: 'File too small to be a valid .aan file',
      };
    }

    return {
      isValid: true,
      format: 'aan',
    };
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): SupportedFormat[] {
    return ['dicom', 'aan', 'jpeg', 'png', 'tiff', 'zip'];
  }

  /**
   * Check if format is supported
   */
  isFormatSupported(format: string): boolean {
    return this.getSupportedFormats().includes(format as SupportedFormat);
  }
}

export const fileValidationService = new FileValidationService();
