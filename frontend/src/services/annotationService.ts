import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface AnnotationCoordinates {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: Array<{ x: number; y: number }>;
  text?: string;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
}

export interface Annotation {
  id: string;
  image_id: string;
  user_id: string;
  user_name?: string;
  annotation_type: 'circle' | 'rectangle' | 'arrow' | 'freehand' | 'text' | 'measurement' | 'polygon';
  coordinates: AnnotationCoordinates;
  color: string;
  severity_level?: number;
  category?: string;
  finding_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnotationDTO {
  image_id: string;
  annotation_type: string;
  coordinates: AnnotationCoordinates;
  color?: string;
  severity_level?: number;
  category?: string;
  finding_name?: string;
  notes?: string;
}

class AnnotationService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async createAnnotation(data: CreateAnnotationDTO): Promise<Annotation> {
    const response = await axios.post(`${API_URL}/annotations`, data, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async getAnnotationsByImage(imageId: string): Promise<Annotation[]> {
    const response = await axios.get(`${API_URL}/annotations/image/${imageId}`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async getAnnotation(id: string): Promise<Annotation> {
    const response = await axios.get(`${API_URL}/annotations/${id}`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async updateAnnotation(id: string, data: Partial<CreateAnnotationDTO>): Promise<Annotation> {
    const response = await axios.put(`${API_URL}/annotations/${id}`, data, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }

  async deleteAnnotation(id: string): Promise<void> {
    await axios.delete(`${API_URL}/annotations/${id}`, {
      headers: this.getAuthHeader(),
    });
  }

  async getUserAnnotations(): Promise<Annotation[]> {
    const response = await axios.get(`${API_URL}/annotations/user/me`, {
      headers: this.getAuthHeader(),
    });
    return response.data;
  }
}

export const annotationService = new AnnotationService();
