import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ExportService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Export selected images with annotations in COCO format
   */
  async exportToCOCO(imageIds: string[]): Promise<Blob> {
    const response = await axios.post(
      `${API_URL}/export/coco`,
      { imageIds },
      {
        headers: this.getAuthHeader(),
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * Export all annotated images in COCO format
   */
  async exportAllToCOCO(): Promise<Blob> {
    const response = await axios.post(
      `${API_URL}/export/coco/all`,
      {},
      {
        headers: this.getAuthHeader(),
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * Download blob as file
   */
  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();
