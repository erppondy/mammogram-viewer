# Annotation & Report Generation API Documentation

## Overview
This document describes the API endpoints for the annotation and report generation features.

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Annotations API

### Create Annotation
**POST** `/api/annotations`

Create a new annotation on an image.

**Request Body:**
```json
{
  "image_id": 123,
  "annotation_type": "circle",
  "coordinates": {
    "x": 100,
    "y": 150,
    "radius": 50
  },
  "color": "#ff0000",
  "severity_level": 3,
  "category": "mass",
  "notes": "Suspicious mass detected"
}
```

**Annotation Types:**
- `circle` - Circular annotation (requires: x, y, radius)
- `rectangle` - Rectangular annotation (requires: x, y, width, height)
- `arrow` - Arrow pointer (requires: startX, startY, endX, endY)
- `freehand` - Freehand drawing (requires: points array)
- `text` - Text label (requires: x, y, text)
- `measurement` - Distance measurement (requires: startX, startY, endX, endY)

**Response:** `201 Created`
```json
{
  "id": 1,
  "image_id": 123,
  "user_id": 5,
  "annotation_type": "circle",
  "coordinates": {...},
  "color": "#ff0000",
  "severity_level": 3,
  "category": "mass",
  "notes": "Suspicious mass detected",
  "created_at": "2025-12-02T10:30:00Z",
  "updated_at": "2025-12-02T10:30:00Z"
}
```

---

### Get Annotations by Image
**GET** `/api/annotations/image/:imageId`

Get all annotations for a specific image.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "image_id": 123,
    "user_id": 5,
    "user_name": "Dr. Smith",
    "annotation_type": "circle",
    "coordinates": {...},
    "color": "#ff0000",
    "severity_level": 3,
    "category": "mass",
    "notes": "Suspicious mass detected",
    "created_at": "2025-12-02T10:30:00Z",
    "updated_at": "2025-12-02T10:30:00Z"
  }
]
```

---

### Get Annotation by ID
**GET** `/api/annotations/:id`

Get a specific annotation by ID.

**Response:** `200 OK` or `404 Not Found`

---

### Update Annotation
**PUT** `/api/annotations/:id`

Update an existing annotation. Only the owner or admin can update.

**Request Body:** (all fields optional)
```json
{
  "coordinates": {...},
  "color": "#00ff00",
  "severity_level": 2,
  "category": "calcification",
  "notes": "Updated notes"
}
```

**Response:** `200 OK`

---

### Delete Annotation
**DELETE** `/api/annotations/:id`

Delete an annotation. Only the owner or admin can delete.

**Response:** `200 OK`
```json
{
  "message": "Annotation deleted successfully"
}
```

---

### Get User's Annotations
**GET** `/api/annotations/user/me`

Get all annotations created by the current user.

**Response:** `200 OK`

---

## Reports API

### Create Report
**POST** `/api/reports`

Create a new medical report.

**Request Body:**
```json
{
  "patient_name": "John Doe",
  "patient_id": "P12345",
  "patient_age": 45,
  "patient_gender": "Female",
  "image_ids": [123, 124],
  "findings": {
    "breast_composition": "Heterogeneously dense",
    "masses": [
      {
        "location": "Right breast, upper outer quadrant",
        "size": "1.2 cm",
        "shape": "Irregular",
        "margin": "Spiculated",
        "density": "High"
      }
    ],
    "calcifications": [],
    "asymmetries": [],
    "associated_features": ["Skin retraction"],
    "comparison": "No prior studies available"
  },
  "diagnosis": "BI-RADS 4: Suspicious abnormality",
  "recommendations": "Recommend biopsy for histological evaluation",
  "bi_rads_score": 4
}
```

**Response:** `201 Created`

---

### Get All Reports
**GET** `/api/reports?limit=50&offset=0`

Get all reports with pagination.

**Query Parameters:**
- `limit` (optional): Number of reports per page (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response:** `200 OK`

---

### Get Report by ID
**GET** `/api/reports/:id`

Get a specific report by ID.

**Response:** `200 OK`
```json
{
  "id": 1,
  "patient_name": "John Doe",
  "patient_id": "P12345",
  "patient_age": 45,
  "patient_gender": "Female",
  "image_ids": [123, 124],
  "radiologist_id": 5,
  "radiologist_name": "Dr. Smith",
  "radiologist_email": "smith@example.com",
  "findings": {...},
  "diagnosis": "BI-RADS 4: Suspicious abnormality",
  "recommendations": "Recommend biopsy",
  "bi_rads_score": 4,
  "status": "draft",
  "created_at": "2025-12-02T10:30:00Z",
  "updated_at": "2025-12-02T10:30:00Z",
  "finalized_at": null,
  "signature_data": null
}
```

---

### Get Reports by Image
**GET** `/api/reports/image/:imageId`

Get all reports that include a specific image.

**Response:** `200 OK`

---

### Get Reports by Patient
**GET** `/api/reports/patient/:patientId`

Get all reports for a specific patient.

**Response:** `200 OK`

---

### Get User's Reports
**GET** `/api/reports/user/me`

Get all reports created by the current user.

**Response:** `200 OK`

---

### Update Report
**PUT** `/api/reports/:id`

Update an existing report. Only draft reports can be updated (unless admin).

**Request Body:** (all fields optional)
```json
{
  "patient_name": "Jane Doe",
  "diagnosis": "Updated diagnosis",
  "bi_rads_score": 3
}
```

**Response:** `200 OK`

---

### Finalize Report
**POST** `/api/reports/:id/finalize`

Finalize a report. Once finalized, it cannot be edited.

**Request Body:**
```json
{
  "signature_data": "base64_encoded_signature"
}
```

**Response:** `200 OK`

---

### Delete Report
**DELETE** `/api/reports/:id`

Delete a report. Only draft reports can be deleted (unless admin).

**Response:** `200 OK`
```json
{
  "message": "Report deleted successfully"
}
```

---

## BI-RADS Classification

The BI-RADS (Breast Imaging Reporting and Data System) score ranges from 0 to 6:

- **0**: Incomplete - Need additional imaging
- **1**: Negative - No findings
- **2**: Benign - Non-cancerous findings
- **3**: Probably benign - Short-interval follow-up suggested
- **4**: Suspicious abnormality - Biopsy should be considered
- **5**: Highly suggestive of malignancy - Appropriate action should be taken
- **6**: Known biopsy-proven malignancy - Treatment planning

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request**
```json
{
  "error": {
    "message": "Missing required fields"
  }
}
```

**401 Unauthorized**
```json
{
  "error": {
    "message": "Authentication required"
  }
}
```

**403 Forbidden**
```json
{
  "error": {
    "message": "Not authorized to perform this action"
  }
}
```

**404 Not Found**
```json
{
  "error": {
    "message": "Resource not found"
  }
}
```

**500 Internal Server Error**
```json
{
  "error": {
    "message": "Internal server error"
  }
}
```
