import * as fs from 'fs/promises';
import * as path from 'path';
import { Annotation } from '../models/Annotation';
import { imageRepository } from '../repositories/ImageRepository';

interface COCOImage {
  id: number;
  file_name: string;
  width: number;
  height: number;
  date_captured?: string;
}

interface COCOAnnotation {
  id: number;
  image_id: number;
  category_id: number;
  segmentation: number[][];
  area: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  iscrowd: 0 | 1;
}

interface COCOCategory {
  id: number;
  name: string;
  supercategory: string;
}

interface COCODataset {
  info: {
    description: string;
    version: string;
    year: number;
    contributor: string;
    date_created: string;
  };
  licenses: Array<{
    id: number;
    name: string;
    url: string;
  }>;
  images: COCOImage[];
  annotations: COCOAnnotation[];
  categories: COCOCategory[];
}

export class AnnotationExportService {
  private exportDir: string;

  constructor() {
    this.exportDir = process.env.EXPORT_DIR || path.join(process.cwd(), 'exports');
  }

  /**
   * Auto-export single image with annotations to AI training folder
   */
  async autoExportImage(imageId: string): Promise<void> {
    console.log('[AnnotationExport] Auto-exporting image:', imageId);

    try {
      // Create AI training directory structure
      const aiTrainingPath = path.join(this.exportDir, 'ai_training');
      const imagesPath = path.join(aiTrainingPath, 'images');
      const annotationsPath = path.join(aiTrainingPath, 'annotations');

      await fs.mkdir(imagesPath, { recursive: true });
      await fs.mkdir(annotationsPath, { recursive: true });

      // Get image and annotations
      const image = await imageRepository.findById(imageId);
      if (!image) {
        console.warn(`[AnnotationExport] Image ${imageId} not found`);
        return;
      }

      const annotationRepositoryModule = await import('../repositories/AnnotationRepository');
      const annotations = await annotationRepositoryModule.default.findByImageId(imageId);

      if (annotations.length === 0) {
        console.log(`[AnnotationExport] No annotations for image ${imageId}, skipping`);
        return;
      }

      // Copy/convert image file
      const { storageService } = await import('./StorageService');
      const imageBuffer = await storageService.getFile(image.storagePath);
      
      let finalImageBuffer = imageBuffer;
      let finalFileName = image.originalFilename;
      
      if (image.fileFormat.toLowerCase() === 'dicom' || image.fileFormat.toLowerCase() === 'dcm') {
        const { dicomConverterService } = await import('./DicomConverterService');
        finalImageBuffer = await dicomConverterService.convertToPNG(imageBuffer);
        finalFileName = image.originalFilename.replace(/\.(dcm|dicom)$/i, '.png');
      }

      const imagePath = path.join(imagesPath, finalFileName);
      await fs.writeFile(imagePath, finalImageBuffer);

      // Create individual annotation file for this image
      const imageAnnotations = annotations.map((ann: Annotation, idx: number) => 
        this.convertToCOCOAnnotation(ann, 1, idx + 1)
      ).filter(Boolean);

      const imageData = {
        image: {
          id: 1,
          file_name: finalFileName,
          width: 0, // TODO: Get from image metadata
          height: 0, // TODO: Get from image metadata
          date_captured: image.uploadedAt.toISOString(),
        },
        annotations: imageAnnotations,
        categories: this.getCategories(),
      };

      // Save individual annotation file
      const annotationFileName = finalFileName.replace(/\.(png|jpg|jpeg)$/i, '.json');
      const annotationFilePath = path.join(annotationsPath, annotationFileName);
      await fs.writeFile(annotationFilePath, JSON.stringify(imageData, null, 2));

      // Update master COCO dataset file
      await this.updateMasterCOCOFile(aiTrainingPath);

      console.log('[AnnotationExport] Auto-export complete for:', imageId);
    } catch (error) {
      console.error('[AnnotationExport] Auto-export failed:', error);
    }
  }

  /**
   * Update master COCO dataset file with all annotated images
   */
  private async updateMasterCOCOFile(aiTrainingPath: string): Promise<void> {
    // const imagesPath = path.join(aiTrainingPath, 'images');
    const annotationsPath = path.join(aiTrainingPath, 'annotations');
    
    // Read all annotation files
    const annotationFiles = await fs.readdir(annotationsPath);
    const jsonFiles = annotationFiles.filter(f => f.endsWith('.json') && f !== 'instances.json');

    const masterDataset: COCODataset = {
      info: {
        description: 'Mammogram Annotation Dataset - Auto-exported for AI Training',
        version: '1.0',
        year: new Date().getFullYear(),
        contributor: 'Mammogram Viewer Application',
        date_created: new Date().toISOString(),
      },
      licenses: [
        {
          id: 1,
          name: 'Medical Use Only',
          url: '',
        },
      ],
      images: [],
      annotations: [],
      categories: this.getCategories(),
    };

    let imageIdCounter = 1;
    let annotationIdCounter = 1;

    // Aggregate all individual annotation files
    for (const jsonFile of jsonFiles) {
      try {
        const filePath = path.join(annotationsPath, jsonFile);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        if (data.image && data.annotations) {
          // Update IDs for master file
          const imageData = { ...data.image, id: imageIdCounter };
          masterDataset.images.push(imageData);

          data.annotations.forEach((ann: any) => {
            masterDataset.annotations.push({
              ...ann,
              id: annotationIdCounter++,
              image_id: imageIdCounter,
            });
          });

          imageIdCounter++;
        }
      } catch (error) {
        console.error(`[AnnotationExport] Error reading ${jsonFile}:`, error);
      }
    }

    // Save master COCO file
    const masterFilePath = path.join(annotationsPath, 'instances.json');
    await fs.writeFile(masterFilePath, JSON.stringify(masterDataset, null, 2));

    // Create/update README
    await this.createReadme(aiTrainingPath, masterDataset);

    console.log('[AnnotationExport] Master COCO file updated:', masterDataset.images.length, 'images');
  }

  /**
   * Export annotations in COCO format for AI training (batch export)
   */
  async exportToCOCO(imageIds: string[]): Promise<string> {
    console.log('[AnnotationExport] Starting COCO export for', imageIds.length, 'images');

    // Create export directory structure
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(this.exportDir, `coco_export_${timestamp}`);
    const imagesPath = path.join(exportPath, 'images');
    const annotationsPath = path.join(exportPath, 'annotations');

    await fs.mkdir(imagesPath, { recursive: true });
    await fs.mkdir(annotationsPath, { recursive: true });

    // Initialize COCO dataset
    const cocoDataset: COCODataset = {
      info: {
        description: 'Mammogram Annotation Dataset',
        version: '1.0',
        year: new Date().getFullYear(),
        contributor: 'Mammogram Viewer Application',
        date_created: new Date().toISOString(),
      },
      licenses: [
        {
          id: 1,
          name: 'Medical Use Only',
          url: '',
        },
      ],
      images: [],
      annotations: [],
      categories: this.getCategories(),
    };

    let imageIdCounter = 1;
    let annotationIdCounter = 1;

    // Process each image
    for (const imageId of imageIds) {
      try {
        const image = await imageRepository.findById(imageId);
        if (!image) {
          console.warn(`[AnnotationExport] Image ${imageId} not found, skipping`);
          continue;
        }

        // Get annotations for this image
        const annotationRepositoryModule = await import('../repositories/AnnotationRepository');
        const annotations = await annotationRepositoryModule.default.findByImageId(imageId);

        if (annotations.length === 0) {
          console.warn(`[AnnotationExport] No annotations for image ${imageId}, skipping`);
          continue;
        }

        // Copy image file
        const { storageService } = await import('./StorageService');
        const imageBuffer = await storageService.getFile(image.storagePath);
        
        // Convert DICOM to PNG if needed
        let finalImageBuffer = imageBuffer;
        let finalFileName = image.originalFilename;
        
        if (image.fileFormat.toLowerCase() === 'dicom' || image.fileFormat.toLowerCase() === 'dcm') {
          const { dicomConverterService } = await import('./DicomConverterService');
          finalImageBuffer = await dicomConverterService.convertToPNG(imageBuffer);
          finalFileName = image.originalFilename.replace(/\.(dcm|dicom)$/i, '.png');
        }

        const imagePath = path.join(imagesPath, finalFileName);
        await fs.writeFile(imagePath, finalImageBuffer);

        // Add to COCO images (dimensions will be 0 if not available)
        cocoDataset.images.push({
          id: imageIdCounter,
          file_name: finalFileName,
          width: 0, // TODO: Get from image metadata
          height: 0, // TODO: Get from image metadata
          date_captured: image.uploadedAt.toISOString(),
        });

        // Process annotations
        for (const annotation of annotations) {
          const cocoAnnotation = this.convertToCOCOAnnotation(
            annotation,
            imageIdCounter,
            annotationIdCounter
          );

          if (cocoAnnotation) {
            cocoDataset.annotations.push(cocoAnnotation);
            annotationIdCounter++;
          }
        }

        imageIdCounter++;
      } catch (error) {
        console.error(`[AnnotationExport] Error processing image ${imageId}:`, error);
      }
    }

    // Save COCO JSON
    const cocoJsonPath = path.join(annotationsPath, 'instances.json');
    await fs.writeFile(cocoJsonPath, JSON.stringify(cocoDataset, null, 2));

    // Create README
    await this.createReadme(exportPath, cocoDataset);

    console.log('[AnnotationExport] Export complete:', exportPath);
    return exportPath;
  }

  /**
   * Convert annotation to COCO format
   */
  private convertToCOCOAnnotation(
    annotation: Annotation,
    imageId: number,
    annotationId: number
  ): COCOAnnotation | null {
    const coords = annotation.coordinates;
    const categoryId = this.getCategoryId(annotation.category || 'unknown');

    // Handle polygon annotations
    if (annotation.annotation_type === 'polygon' && coords.points && coords.points.length >= 3) {
      const segmentation = coords.points.flatMap(p => [p.x, p.y]);
      const bbox = this.calculateBoundingBox(coords.points);
      const area = this.calculatePolygonArea(coords.points);

      return {
        id: annotationId,
        image_id: imageId,
        category_id: categoryId,
        segmentation: [segmentation],
        area,
        bbox,
        iscrowd: 0,
      };
    }

    // Handle circle annotations (convert to polygon)
    if (annotation.annotation_type === 'circle' && coords.x !== undefined && coords.y !== undefined && coords.radius) {
      const points = this.circleToPolygon(coords.x, coords.y, coords.radius);
      const segmentation = points.flatMap(p => [p.x, p.y]);
      const bbox = this.calculateBoundingBox(points);
      const area = Math.PI * coords.radius * coords.radius;

      return {
        id: annotationId,
        image_id: imageId,
        category_id: categoryId,
        segmentation: [segmentation],
        area,
        bbox,
        iscrowd: 0,
      };
    }

    // Handle rectangle annotations
    if (annotation.annotation_type === 'rectangle' && coords.x !== undefined && coords.y !== undefined && coords.width && coords.height) {
      const points = [
        { x: coords.x, y: coords.y },
        { x: coords.x + coords.width, y: coords.y },
        { x: coords.x + coords.width, y: coords.y + coords.height },
        { x: coords.x, y: coords.y + coords.height },
      ];
      const segmentation = points.flatMap(p => [p.x, p.y]);
      const bbox: [number, number, number, number] = [coords.x, coords.y, coords.width, coords.height];
      const area = coords.width * coords.height;

      return {
        id: annotationId,
        image_id: imageId,
        category_id: categoryId,
        segmentation: [segmentation],
        area,
        bbox,
        iscrowd: 0,
      };
    }

    // Handle freehand annotations
    if (annotation.annotation_type === 'freehand' && coords.points && coords.points.length >= 3) {
      const segmentation = coords.points.flatMap(p => [p.x, p.y]);
      const bbox = this.calculateBoundingBox(coords.points);
      const area = this.calculatePolygonArea(coords.points);

      return {
        id: annotationId,
        image_id: imageId,
        category_id: categoryId,
        segmentation: [segmentation],
        area,
        bbox,
        iscrowd: 0,
      };
    }

    return null;
  }

  /**
   * Get category definitions
   */
  private getCategories(): COCOCategory[] {
    return [
      { id: 1, name: 'mass', supercategory: 'finding' },
      { id: 2, name: 'calcification', supercategory: 'finding' },
      { id: 3, name: 'asymmetry', supercategory: 'finding' },
      { id: 4, name: 'distortion', supercategory: 'finding' },
      { id: 5, name: 'architectural_distortion', supercategory: 'finding' },
      { id: 6, name: 'lymph_node', supercategory: 'finding' },
      { id: 7, name: 'skin_lesion', supercategory: 'finding' },
      { id: 8, name: 'other', supercategory: 'finding' },
    ];
  }

  /**
   * Get category ID from name
   */
  private getCategoryId(categoryName: string): number {
    const categories = this.getCategories();
    const category = categories.find(c => c.name === categoryName.toLowerCase());
    return category ? category.id : 8; // Default to 'other'
  }

  /**
   * Convert circle to polygon points
   */
  private circleToPolygon(cx: number, cy: number, radius: number, segments: number = 32): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      points.push({
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      });
    }
    return points;
  }

  /**
   * Calculate bounding box from points
   */
  private calculateBoundingBox(points: Array<{ x: number; y: number }>): [number, number, number, number] {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return [minX, minY, maxX - minX, maxY - minY];
  }

  /**
   * Calculate polygon area using shoelace formula
   */
  private calculatePolygonArea(points: Array<{ x: number; y: number }>): number {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  }

  /**
   * Create README file for the export
   */
  private async createReadme(exportPath: string, dataset: COCODataset): Promise<void> {
    const readme = `# Mammogram Annotation Dataset Export

## Export Information
- **Date**: ${new Date().toISOString()}
- **Format**: COCO JSON
- **Images**: ${dataset.images.length}
- **Annotations**: ${dataset.annotations.length}
- **Categories**: ${dataset.categories.length}

## Directory Structure
\`\`\`
${path.basename(exportPath)}/
├── images/              # Image files (PNG format)
├── annotations/         # COCO JSON annotations
│   └── instances.json   # Main annotation file
└── README.md           # This file
\`\`\`

## Categories
${dataset.categories.map(c => `- **${c.name}** (ID: ${c.id})`).join('\n')}

## COCO Format
This dataset uses the COCO (Common Objects in Context) format, which is widely supported by:
- PyTorch (torchvision.datasets.CocoDetection)
- TensorFlow (tensorflow_datasets)
- Detectron2
- MMDetection
- YOLO (with conversion)

## Usage with PyTorch

\`\`\`python
from pycocotools.coco import COCO
from torch.utils.data import Dataset
from PIL import Image
import os

class MammogramDataset(Dataset):
    def __init__(self, root_dir, ann_file, transform=None):
        self.root_dir = root_dir
        self.coco = COCO(ann_file)
        self.ids = list(sorted(self.coco.imgs.keys()))
        self.transform = transform
    
    def __getitem__(self, index):
        coco = self.coco
        img_id = self.ids[index]
        ann_ids = coco.getAnnIds(imgIds=img_id)
        anns = coco.loadAnns(ann_ids)
        
        path = coco.loadImgs(img_id)[0]['file_name']
        img = Image.open(os.path.join(self.root_dir, 'images', path)).convert('RGB')
        
        if self.transform:
            img = self.transform(img)
        
        return img, anns
    
    def __len__(self):
        return len(self.ids)

# Usage
dataset = MammogramDataset(
    root_dir='${path.basename(exportPath)}',
    ann_file='${path.basename(exportPath)}/annotations/instances.json'
)
\`\`\`

## Usage with TensorFlow

\`\`\`python
import tensorflow as tf
from pycocotools.coco import COCO
import numpy as np
from PIL import Image

def load_dataset(images_dir, ann_file):
    coco = COCO(ann_file)
    image_ids = coco.getImgIds()
    
    for img_id in image_ids:
        img_info = coco.loadImgs(img_id)[0]
        img_path = os.path.join(images_dir, img_info['file_name'])
        
        # Load image
        image = tf.io.read_file(img_path)
        image = tf.image.decode_png(image, channels=3)
        
        # Load annotations
        ann_ids = coco.getAnnIds(imgIds=img_id)
        anns = coco.loadAnns(ann_ids)
        
        yield image, anns

# Usage
dataset = tf.data.Dataset.from_generator(
    lambda: load_dataset(
        '${path.basename(exportPath)}/images',
        '${path.basename(exportPath)}/annotations/instances.json'
    ),
    output_signature=(
        tf.TensorSpec(shape=(None, None, 3), dtype=tf.uint8),
        tf.TensorSpec(shape=None, dtype=tf.py_function)
    )
)
\`\`\`

## Annotation Statistics
${this.generateStatistics(dataset)}

## Notes
- All DICOM images have been converted to PNG format
- Polygon annotations include segmentation masks
- Bounding boxes are in [x, y, width, height] format
- All coordinates are in pixel space
- Images maintain original dimensions

## Citation
If you use this dataset, please cite:
\`\`\`
Mammogram Viewer Application
Annotation Dataset Export
Generated: ${new Date().toISOString()}
\`\`\`
`;

    await fs.writeFile(path.join(exportPath, 'README.md'), readme);
  }

  /**
   * Generate statistics for README
   */
  private generateStatistics(dataset: COCODataset): string {
    const categoryStats: { [key: string]: number } = {};
    
    dataset.annotations.forEach(ann => {
      const category = dataset.categories.find(c => c.id === ann.category_id);
      if (category) {
        categoryStats[category.name] = (categoryStats[category.name] || 0) + 1;
      }
    });

    return Object.entries(categoryStats)
      .map(([name, count]) => `- **${name}**: ${count} annotations`)
      .join('\n');
  }
}

export const annotationExportService = new AnnotationExportService();
