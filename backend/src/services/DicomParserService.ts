import dicomParser from 'dicom-parser';

export interface DicomMetadata {
  patientId?: string;
  patientName?: string;
  studyDate?: string;
  studyDescription?: string;
  modality?: string;
  imageWidth?: number;
  imageHeight?: number;
  bitDepth?: number;
  dicomTags: Record<string, any>;
}

export class DicomParserService {
  /**
   * Parse DICOM file and extract metadata
   */
  async parseDicom(buffer: Buffer): Promise<DicomMetadata> {
    try {
      const byteArray = new Uint8Array(buffer);
      const dataSet = dicomParser.parseDicom(byteArray);

      const metadata: DicomMetadata = {
        dicomTags: {},
      };

      // Extract patient information
      metadata.patientId = this.getStringValue(dataSet, 'x00100020');
      metadata.patientName = this.getStringValue(dataSet, 'x00100010');

      // Extract study information
      metadata.studyDate = this.getStringValue(dataSet, 'x00080020');
      metadata.studyDescription = this.getStringValue(dataSet, 'x00081030');
      metadata.modality = this.getStringValue(dataSet, 'x00080060');

      // Extract image dimensions
      metadata.imageWidth = this.getNumberValue(dataSet, 'x00280011');
      metadata.imageHeight = this.getNumberValue(dataSet, 'x00280010');
      metadata.bitDepth = this.getNumberValue(dataSet, 'x00280100');

      // Store all DICOM tags
      metadata.dicomTags = this.extractAllTags(dataSet);

      return metadata;
    } catch (error) {
      throw new Error(`Failed to parse DICOM file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate DICOM transfer syntax
   */
  validateTransferSyntax(buffer: Buffer): boolean {
    try {
      const byteArray = new Uint8Array(buffer);
      const dataSet = dicomParser.parseDicom(byteArray);
      
      // Check if transfer syntax UID exists
      const transferSyntax = this.getStringValue(dataSet, 'x00020010');
      return transferSyntax !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Extract pixel data from DICOM
   */
  async extractPixelData(buffer: Buffer): Promise<{
    pixelData: Uint8Array;
    width: number;
    height: number;
    bitDepth: number;
  }> {
    try {
      const byteArray = new Uint8Array(buffer);
      const dataSet = dicomParser.parseDicom(byteArray);

      const pixelDataElement = dataSet.elements.x7fe00010;
      if (!pixelDataElement) {
        throw new Error('No pixel data found in DICOM file');
      }

      // Try multiple methods to get dimensions
      let width = this.getNumberValue(dataSet, 'x00280011'); // Columns
      let height = this.getNumberValue(dataSet, 'x00280010'); // Rows
      const bitDepth = this.getNumberValue(dataSet, 'x00280100') || 8;

      console.log('DICOM tags - Width:', width, 'Height:', height, 'BitDepth:', bitDepth);

      // If standard tags don't work, try uint16
      if (!width || !height) {
        try {
          width = dataSet.uint16('x00280011');
          height = dataSet.uint16('x00280010');
          console.log('Using uint16 - Width:', width, 'Height:', height);
        } catch (e) {
          console.error('Failed to read dimensions with uint16:', e);
        }
      }

      // Last resort: try to calculate from pixel data size
      if (!width || !height) {
        const bytesPerPixel = bitDepth === 16 ? 2 : 1;
        const totalPixels = pixelDataElement.length / bytesPerPixel;
        // Assume square image if we can't get dimensions
        const dimension = Math.sqrt(totalPixels);
        if (Number.isInteger(dimension)) {
          width = height = dimension;
          console.log('Calculated square dimensions:', width, 'x', height);
        }
      }

      if (!width || !height) {
        throw new Error('Could not determine DICOM image dimensions');
      }

      const pixelData = new Uint8Array(
        byteArray.buffer,
        pixelDataElement.dataOffset,
        pixelDataElement.length
      );

      return {
        pixelData,
        width,
        height,
        bitDepth,
      };
    } catch (error) {
      throw new Error(`Failed to extract pixel data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if file is multi-frame DICOM
   */
  isMultiFrame(buffer: Buffer): boolean {
    try {
      const byteArray = new Uint8Array(buffer);
      const dataSet = dicomParser.parseDicom(byteArray);
      
      const numberOfFrames = this.getNumberValue(dataSet, 'x00280008');
      return numberOfFrames !== undefined && numberOfFrames > 1;
    } catch {
      return false;
    }
  }

  /**
   * Get number of frames in multi-frame DICOM
   */
  getNumberOfFrames(buffer: Buffer): number {
    try {
      const byteArray = new Uint8Array(buffer);
      const dataSet = dicomParser.parseDicom(byteArray);
      
      return this.getNumberValue(dataSet, 'x00280008') || 1;
    } catch {
      return 1;
    }
  }

  /**
   * Get string value from DICOM tag
   */
  private getStringValue(dataSet: any, tag: string): string | undefined {
    try {
      const element = dataSet.elements[tag];
      if (!element) return undefined;
      
      return dataSet.string(tag);
    } catch {
      return undefined;
    }
  }

  /**
   * Get number value from DICOM tag
   */
  private getNumberValue(dataSet: any, tag: string): number | undefined {
    try {
      const element = dataSet.elements[tag];
      if (!element) return undefined;
      
      const value = dataSet.intString(tag);
      return value ? parseInt(value) : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Extract all DICOM tags
   */
  private extractAllTags(dataSet: any): Record<string, any> {
    const tags: Record<string, any> = {};

    for (const tag in dataSet.elements) {
      try {
        const value = dataSet.string(tag);
        
        if (value !== undefined) {
          tags[tag] = value;
        }
      } catch {
        // Skip tags that can't be read as strings
      }
    }

    return tags;
  }
}

export const dicomParserService = new DicomParserService();
