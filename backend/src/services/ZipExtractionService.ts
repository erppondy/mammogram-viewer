import AdmZip from 'adm-zip';
import path from 'path';

export interface ExtractedFile {
  filename: string;
  buffer: Buffer;
  size: number;
  path: string;
}

export interface ExtractionResult {
  files: ExtractedFile[];
  totalFiles: number;
  totalSize: number;
}

export class ZipExtractionService {
  private readonly SUPPORTED_EXTENSIONS = ['.dcm', '.dicom', '.aan', '.jpg', '.jpeg', '.png', '.tiff', '.tif'];

  /**
   * Extract files from ZIP archive
   */
  async extractZip(buffer: Buffer): Promise<ExtractionResult> {
    try {
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();

      const extractedFiles: ExtractedFile[] = [];
      let totalSize = 0;

      for (const entry of zipEntries) {
        // Skip directories
        if (entry.isDirectory) {
          continue;
        }

        // Check if file extension is supported
        const ext = path.extname(entry.entryName).toLowerCase();
        if (!this.SUPPORTED_EXTENSIONS.includes(ext)) {
          continue;
        }

        const fileBuffer = entry.getData();
        
        extractedFiles.push({
          filename: path.basename(entry.entryName),
          buffer: fileBuffer,
          size: fileBuffer.length,
          path: entry.entryName,
        });

        totalSize += fileBuffer.length;
      }

      return {
        files: extractedFiles,
        totalFiles: extractedFiles.length,
        totalSize,
      };
    } catch (error) {
      throw new Error(`Failed to extract ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get list of files in ZIP without extracting
   */
  async listZipContents(buffer: Buffer): Promise<string[]> {
    try {
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();

      return zipEntries
        .filter(entry => !entry.isDirectory)
        .map(entry => entry.entryName);
    } catch (error) {
      throw new Error(`Failed to list ZIP contents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate ZIP file
   */
  async validateZip(buffer: Buffer): Promise<boolean> {
    try {
      const zip = new AdmZip(buffer);
      zip.getEntries(); // This will throw if ZIP is invalid
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get supported file count in ZIP
   */
  async getSupportedFileCount(buffer: Buffer): Promise<number> {
    try {
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();

      return zipEntries.filter(entry => {
        if (entry.isDirectory) return false;
        const ext = path.extname(entry.entryName).toLowerCase();
        return this.SUPPORTED_EXTENSIONS.includes(ext);
      }).length;
    } catch {
      return 0;
    }
  }
}

export const zipExtractionService = new ZipExtractionService();
