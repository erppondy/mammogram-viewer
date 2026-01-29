import * as dicomParser from 'dicom-parser';

export interface DicomMetadata {
  // Patient Information
  patientName?: string;
  patientId?: string;
  patientBirthDate?: string;
  patientSex?: string;
  patientAge?: string;
  
  // Study Information
  studyDate?: string;
  studyTime?: string;
  studyDescription?: string;
  studyInstanceUid?: string;
  
  // Series Information
  seriesDescription?: string;
  seriesNumber?: number;
  modality?: string;
  
  // Institution Information
  institutionName?: string;
  referringPhysician?: string;
  
  // Image Information
  imageType?: string;
  acquisitionDate?: string;
  acquisitionTime?: string;
}

export class DicomMetadataService {
  /**
   * Extract metadata from DICOM buffer
   */
  extractMetadata(dicomBuffer: Buffer): DicomMetadata {
    try {
      const dataSet = dicomParser.parseDicom(new Uint8Array(dicomBuffer));
      const metadata: DicomMetadata = {};

      // Patient Information
      metadata.patientName = this.getString(dataSet, 'x00100010');
      metadata.patientId = this.getString(dataSet, 'x00100020');
      metadata.patientBirthDate = this.getDate(dataSet, 'x00100030');
      metadata.patientSex = this.getString(dataSet, 'x00100040');
      metadata.patientAge = this.getString(dataSet, 'x00101010');

      // Study Information
      metadata.studyDate = this.getDate(dataSet, 'x00080020');
      metadata.studyTime = this.getTime(dataSet, 'x00080030');
      metadata.studyDescription = this.getString(dataSet, 'x00081030');
      metadata.studyInstanceUid = this.getString(dataSet, 'x0020000d');

      // Series Information
      metadata.seriesDescription = this.getString(dataSet, 'x0008103e');
      metadata.seriesNumber = this.getNumber(dataSet, 'x00200011');
      metadata.modality = this.getString(dataSet, 'x00080060');

      // Institution Information
      metadata.institutionName = this.getString(dataSet, 'x00080080');
      metadata.referringPhysician = this.getString(dataSet, 'x00080090');

      // Image Information
      metadata.imageType = this.getString(dataSet, 'x00080008');
      metadata.acquisitionDate = this.getDate(dataSet, 'x00080022');
      metadata.acquisitionTime = this.getTime(dataSet, 'x00080032');

      console.log('[DicomMetadata] Extracted metadata:', metadata);
      return metadata;
    } catch (error) {
      console.error('[DicomMetadata] Failed to extract metadata:', error);
      return {};
    }
  }

  /**
   * Get string value from DICOM dataset
   */
  private getString(dataSet: dicomParser.DataSet, tag: string): string | undefined {
    try {
      const value = dataSet.string(tag);
      return value ? value.trim() : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get number value from DICOM dataset
   */
  private getNumber(dataSet: dicomParser.DataSet, tag: string): number | undefined {
    try {
      return dataSet.intString(tag);
    } catch {
      return undefined;
    }
  }

  /**
   * Get date value from DICOM dataset and format it
   */
  private getDate(dataSet: dicomParser.DataSet, tag: string): string | undefined {
    try {
      const dateStr = dataSet.string(tag);
      if (!dateStr) return undefined;
      
      // DICOM date format is YYYYMMDD
      if (dateStr.length === 8) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${year}-${month}-${day}`;
      }
      
      return dateStr;
    } catch {
      return undefined;
    }
  }

  /**
   * Get time value from DICOM dataset and format it
   */
  private getTime(dataSet: dicomParser.DataSet, tag: string): string | undefined {
    try {
      const timeStr = dataSet.string(tag);
      if (!timeStr) return undefined;
      
      // DICOM time format is HHMMSS.FFFFFF
      if (timeStr.length >= 6) {
        const hour = timeStr.substring(0, 2);
        const minute = timeStr.substring(2, 4);
        const second = timeStr.substring(4, 6);
        return `${hour}:${minute}:${second}`;
      }
      
      return timeStr;
    } catch {
      return undefined;
    }
  }

  /**
   * Check if buffer is a DICOM file
   */
  isDicomFile(buffer: Buffer): boolean {
    try {
      // Check for DICOM magic number at offset 128
      if (buffer.length < 132) return false;
      const magic = buffer.toString('ascii', 128, 132);
      return magic === 'DICM';
    } catch {
      return false;
    }
  }
}

export const dicomMetadataService = new DicomMetadataService();
