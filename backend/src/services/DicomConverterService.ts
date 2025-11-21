import * as dicomParser from 'dicom-parser';
import { PNG } from 'pngjs';

export class DicomConverterService {
  /**
   * Convert DICOM buffer to PNG buffer using dicom-parser and pngjs
   */
  async convertToPNG(dicomBuffer: Buffer): Promise<Buffer> {
    console.log('[DicomConverter] ========== START CONVERSION ==========');
    console.log('[DicomConverter] Buffer size:', dicomBuffer.length, 'bytes');

    try {
      // Parse DICOM
      console.log('[DicomConverter] Step 1: Parsing DICOM file with dicom-parser...');
      const dataSet = dicomParser.parseDicom(new Uint8Array(dicomBuffer));
      console.log('[DicomConverter] Step 1: DICOM parsed successfully');

      // Extract image dimensions
      console.log('[DicomConverter] Step 2: Extracting image metadata...');
      const rows = dataSet.uint16('x00280010'); // Rows
      const columns = dataSet.uint16('x00280011'); // Columns
      const bitsAllocated = dataSet.uint16('x00280100'); // Bits Allocated
      const bitsStored = dataSet.uint16('x00280101'); // Bits Stored
      const samplesPerPixel = dataSet.uint16('x00280002') || 1; // Samples per Pixel
      const pixelRepresentation = dataSet.uint16('x00280103'); // 0 = unsigned, 1 = signed
      const photometricInterpretation = dataSet.string('x00280004'); // MONOCHROME1, MONOCHROME2, etc.

      console.log('[DicomConverter] Image metadata:', {
        rows,
        columns,
        bitsAllocated,
        bitsStored,
        samplesPerPixel,
        pixelRepresentation,
        photometricInterpretation,
      });

      if (!rows || !columns) {
        throw new Error('Invalid DICOM: missing rows or columns');
      }

      // Get pixel data
      console.log('[DicomConverter] Step 3: Extracting pixel data...');
      const pixelDataElement = dataSet.elements.x7fe00010;
      if (!pixelDataElement) {
        throw new Error('Invalid DICOM: missing pixel data element');
      }

      const pixelData = new Uint8Array(
        dataSet.byteArray.buffer,
        pixelDataElement.dataOffset,
        pixelDataElement.length
      );
      console.log('[DicomConverter] Pixel data extracted, length:', pixelData.length);

      // Create PNG
      console.log('[DicomConverter] Step 4: Creating PNG...');
      const png = new PNG({
        width: columns,
        height: rows,
        colorType: 0, // Grayscale
        bitDepth: 8,
      });

      console.log('[DicomConverter] Step 5: Converting pixel data...');
      
      if (bitsAllocated === 8) {
        console.log('[DicomConverter] Processing 8-bit data');
        // 8-bit data
        for (let i = 0; i < rows * columns; i++) {
          let value = pixelData[i];
          
          // Handle MONOCHROME1 (inverted)
          if (photometricInterpretation === 'MONOCHROME1') {
            value = 255 - value;
          }
          
          png.data[i * 4] = value; // R
          png.data[i * 4 + 1] = value; // G
          png.data[i * 4 + 2] = value; // B
          png.data[i * 4 + 3] = 255; // A
        }
      } else if (bitsAllocated === 16) {
        console.log('[DicomConverter] Processing 16-bit data');
        // 16-bit data
        const pixelData16 = new Uint16Array(
          pixelData.buffer,
          pixelData.byteOffset,
          pixelData.byteLength / 2
        );

        // Find min and max for windowing
        let min = pixelData16[0];
        let max = pixelData16[0];
        for (let i = 1; i < pixelData16.length; i++) {
          if (pixelData16[i] < min) min = pixelData16[i];
          if (pixelData16[i] > max) max = pixelData16[i];
        }
        
        console.log('[DicomConverter] 16-bit range:', { min, max });
        const range = max - min || 1;

        for (let i = 0; i < rows * columns; i++) {
          // Normalize to 0-255
          let value = Math.floor(((pixelData16[i] - min) / range) * 255);
          
          // Handle MONOCHROME1 (inverted)
          if (photometricInterpretation === 'MONOCHROME1') {
            value = 255 - value;
          }
          
          png.data[i * 4] = value; // R
          png.data[i * 4 + 1] = value; // G
          png.data[i * 4 + 2] = value; // B
          png.data[i * 4 + 3] = 255; // A
        }
      } else {
        throw new Error(`Unsupported bits allocated: ${bitsAllocated}`);
      }

      console.log('[DicomConverter] Step 6: Packing PNG...');
      const pngBuffer = PNG.sync.write(png);
      console.log('[DicomConverter] PNG buffer created, size:', pngBuffer.length, 'bytes');
      console.log('[DicomConverter] ========== CONVERSION COMPLETE ==========');

      return pngBuffer;
    } catch (error) {
      console.error('[DicomConverter] ========== CONVERSION FAILED ==========');
      console.error('[DicomConverter] Error:', error);
      console.error('[DicomConverter] Error message:', error instanceof Error ? error.message : 'Unknown');
      console.error('[DicomConverter] Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('[DicomConverter] ========== ERROR DETAILS END ==========');

      throw new Error(
        `Failed to convert DICOM to PNG: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export const dicomConverterService = new DicomConverterService();
