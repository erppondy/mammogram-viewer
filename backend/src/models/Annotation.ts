export interface Annotation {
  id: string;
  image_id: string;
  user_id: string;
  annotation_type: 'circle' | 'rectangle' | 'arrow' | 'freehand' | 'text' | 'measurement' | 'polygon';
  coordinates: AnnotationCoordinates;
  color: string;
  severity_level?: number;
  category?: string;
  finding_name?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

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

export interface UpdateAnnotationDTO {
  annotation_type?: string;
  coordinates?: AnnotationCoordinates;
  color?: string;
  severity_level?: number;
  category?: string;
  finding_name?: string;
  notes?: string;
}
