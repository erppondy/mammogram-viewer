export interface Report {
  id: string;
  patient_name?: string;
  patient_id?: string;
  patient_age?: number;
  patient_gender?: string;
  image_ids: string[];
  radiologist_id: string;
  findings?: ReportFindings;
  diagnosis?: string;
  recommendations?: string;
  bi_rads_score?: number;
  report_template_id?: string;
  status: 'draft' | 'finalized' | 'signed';
  created_at: Date;
  updated_at: Date;
  finalized_at?: Date;
  signature_data?: string;
}

export interface ReportFindings {
  breast_composition?: string;
  masses?: Array<{
    location: string;
    size: string;
    shape: string;
    margin: string;
    density: string;
  }>;
  calcifications?: Array<{
    location: string;
    distribution: string;
    morphology: string;
  }>;
  asymmetries?: Array<{
    location: string;
    type: string;
  }>;
  associated_features?: string[];
  comparison?: string;
}

export interface CreateReportDTO {
  patient_name?: string;
  patient_id?: string;
  patient_age?: number;
  patient_gender?: string;
  image_ids: string[];
  findings?: ReportFindings;
  diagnosis?: string;
  recommendations?: string;
  bi_rads_score?: number;
  report_template_id?: string;
}

export interface UpdateReportDTO {
  patient_name?: string;
  patient_id?: string;
  patient_age?: number;
  patient_gender?: string;
  image_ids?: string[];
  findings?: ReportFindings;
  diagnosis?: string;
  recommendations?: string;
  bi_rads_score?: number;
  status?: 'draft' | 'finalized' | 'signed';
}

export interface FinalizeReportDTO {
  signature_data?: string;
}
