import { metadataRepository } from '../repositories/MetadataRepository';
import { dicomParserService } from './DicomParserService';
import { aanParserService } from './AanParserService';
import { imageProcessingService } from './ImageProcessingService';
import { CreateMetadataDTO } from '../models/Image';

export class MetadataService {
  /**
   * Extract and store metadata based on file format
   */
  async extractAndStoreMetadata(
    imageId: string,
    buffer: Buffer,
    format: 'dicom' | 'aan' | 'jpeg' | 'png' | 'tiff'
  ): Promise<void> {
    let metadataDTO: CreateMetadataDTO;

    switch (format) {
      case 'dicom':
        metadataDTO = await this.extractDicomMetadata(imageId, buffer);
        break;
      case 'aan':
        metadataDTO = await this.extractAanMetadata(imageId, buffer);
        break;
      case 'jpeg':
      case 'png':
      case 'tiff':
        metadataDTO = await this.extractImageMetadata(imageId, buffer);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    await metadataRepository.create(metadataDTO);
  }

  /**
   * Extract DICOM metadata
   */
  private async extractDicomMetadata(imageId: string, buffer: Buffer): Promise<CreateMetadataDTO> {
    const dicomData = await dicomParserService.parseDicom(buffer);

    return {
      imageId,
      patientId: dicomData.patientId,
      patientName: dicomData.patientName,
      studyDate: dicomData.studyDate ? new Date(dicomData.studyDate) : undefined,
      studyDescription: dicomData.studyDescription,
      modality: dicomData.modality,
      imageWidth: dicomData.imageWidth || 0,
      imageHeight: dicomData.imageHeight || 0,
      bitDepth: dicomData.bitDepth || 16,
      colorSpace: 'MONOCHROME2',
      dicomTags: dicomData.dicomTags,
    };
  }

  /**
   * Extract .aan metadata
   */
  private async extractAanMetadata(imageId: string, buffer: Buffer): Promise<CreateMetadataDTO> {
    const aanData = await aanParserService.parseAan(buffer);

    return {
      imageId,
      imageWidth: aanData.imageWidth || 0,
      imageHeight: aanData.imageHeight || 0,
      bitDepth: aanData.bitDepth || 16,
      colorSpace: aanData.colorSpace || 'MONOCHROME2',
      customTags: aanData.customTags,
    };
  }

  /**
   * Extract standard image metadata
   */
  private async extractImageMetadata(imageId: string, buffer: Buffer): Promise<CreateMetadataDTO> {
    const imageData = await imageProcessingService.processImage(buffer);

    return {
      imageId,
      imageWidth: imageData.width,
      imageHeight: imageData.height,
      bitDepth: imageData.bitDepth,
      colorSpace: imageData.colorSpace,
    };
  }

  /**
   * Search metadata
   */
  async searchMetadata(filters: {
    patientId?: string;
    patientName?: string;
    studyDate?: Date;
    modality?: string;
  }) {
    return metadataRepository.search(filters);
  }

  /**
   * Get metadata by image ID
   */
  async getMetadata(imageId: string) {
    return metadataRepository.findByImageId(imageId);
  }
}

export const metadataService = new MetadataService();
