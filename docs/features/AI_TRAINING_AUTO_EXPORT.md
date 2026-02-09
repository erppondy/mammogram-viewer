# Automatic AI Training Data Export

## Overview
The system automatically exports annotated images in COCO format to a dedicated folder whenever annotations are created, updated, or deleted. This ensures your AI training dataset is always up-to-date without manual intervention.

## How It Works

### Automatic Export Triggers
The system automatically exports to the AI training folder when:
1. **New Annotation Created** - Image with new annotation is exported
2. **Annotation Updated** - Image is re-exported with updated annotations
3. **Annotation Deleted** - Image is re-exported (or removed if no annotations left)

### Export Process
```
User creates annotation → Backend saves to database
                       ↓
                  Auto-export triggered (non-blocking)
                       ↓
                  Image copied/converted to PNG
                       ↓
                  Annotations converted to COCO format
                       ↓
                  Saved to exports/ai_training/
                       ↓
                  Master COCO file updated
```

## Directory Structure

```
exports/
└── ai_training/
    ├── images/                    # All annotated images (PNG format)
    │   ├── mammogram_001.png
    │   ├── mammogram_002.png
    │   └── ...
    ├── annotations/               # Annotation files
    │   ├── mammogram_001.json    # Individual annotation file
    │   ├── mammogram_002.json
    │   ├── instances.json        # Master COCO dataset file
    │   └── ...
    └── README.md                  # Dataset documentation
```

## File Formats

### Individual Annotation Files
Each image has its own JSON file with annotations:

```json
{
  "image": {
    "id": 1,
    "file_name": "mammogram_001.png",
    "width": 3328,
    "height": 4096,
    "date_captured": "2024-12-03T10:30:00.000Z"
  },
  "annotations": [
    {
      "id": 1,
      "image_id": 1,
      "category_id": 1,
      "segmentation": [[512, 384, 1024, 384, 1024, 768, 512, 768]],
      "area": 196608,
      "bbox": [512, 384, 512, 384],
      "iscrowd": 0
    }
  ],
  "categories": [
    { "id": 1, "name": "mass", "supercategory": "finding" },
    { "id": 2, "name": "calcification", "supercategory": "finding" },
    ...
  ]
}
```

### Master COCO Dataset File (instances.json)
Aggregates all images and annotations:

```json
{
  "info": {
    "description": "Mammogram Annotation Dataset - Auto-exported for AI Training",
    "version": "1.0",
    "year": 2024,
    "contributor": "Mammogram Viewer Application",
    "date_created": "2024-12-03T10:30:00.000Z"
  },
  "licenses": [
    {
      "id": 1,
      "name": "Medical Use Only",
      "url": ""
    }
  ],
  "images": [
    {
      "id": 1,
      "file_name": "mammogram_001.png",
      "width": 3328,
      "height": 4096,
      "date_captured": "2024-12-03T10:30:00.000Z"
    },
    ...
  ],
  "annotations": [
    {
      "id": 1,
      "image_id": 1,
      "category_id": 1,
      "segmentation": [[...]],
      "area": 196608,
      "bbox": [512, 384, 512, 384],
      "iscrowd": 0
    },
    ...
  ],
  "categories": [
    { "id": 1, "name": "mass", "supercategory": "finding" },
    { "id": 2, "name": "calcification", "supercategory": "finding" },
    { "id": 3, "name": "asymmetry", "supercategory": "finding" },
    { "id": 4, "name": "distortion", "supercategory": "finding" },
    { "id": 5, "name": "architectural_distortion", "supercategory": "finding" },
    { "id": 6, "name": "lymph_node", "supercategory": "finding" },
    { "id": 7, "name": "skin_lesion", "supercategory": "finding" },
    { "id": 8, "name": "other", "supercategory": "finding" }
  ]
}
```

## COCO Format Details

### Supported Annotation Types
All annotation types are converted to COCO format:

1. **Polygon** → Segmentation polygon
2. **Circle** → Converted to 32-point polygon
3. **Rectangle** → 4-point polygon
4. **Freehand** → Segmentation polygon
5. **Arrow** → Not exported (directional only)
6. **Text** → Not exported (label only)

### COCO Fields

**Image**:
- `id`: Unique image identifier
- `file_name`: Image filename (PNG)
- `width`: Image width in pixels
- `height`: Image height in pixels
- `date_captured`: Upload timestamp

**Annotation**:
- `id`: Unique annotation identifier
- `image_id`: Reference to image
- `category_id`: Finding category (1-8)
- `segmentation`: Polygon points [[x1,y1,x2,y2,...]]
- `area`: Polygon area in pixels²
- `bbox`: Bounding box [x, y, width, height]
- `iscrowd`: Always 0 (individual objects)

**Category**:
- `id`: Category identifier (1-8)
- `name`: Category name (mass, calcification, etc.)
- `supercategory`: Always "finding"

## Using the Dataset for AI Training

### PyTorch Example

```python
from pycocotools.coco import COCO
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import torchvision.transforms as transforms
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
        
        # Load image
        img_info = coco.loadImgs(img_id)[0]
        path = os.path.join(self.root_dir, 'images', img_info['file_name'])
        img = Image.open(path).convert('RGB')
        
        # Extract masks and labels
        masks = []
        labels = []
        for ann in anns:
            mask = coco.annToMask(ann)
            masks.append(mask)
            labels.append(ann['category_id'])
        
        if self.transform:
            img = self.transform(img)
        
        return img, {'masks': masks, 'labels': labels}
    
    def __len__(self):
        return len(self.ids)

# Usage
transform = transforms.Compose([
    transforms.Resize((512, 512)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                       std=[0.229, 0.224, 0.225])
])

dataset = MammogramDataset(
    root_dir='exports/ai_training',
    ann_file='exports/ai_training/annotations/instances.json',
    transform=transform
)

dataloader = DataLoader(dataset, batch_size=4, shuffle=True)

# Training loop
for images, targets in dataloader:
    # Your training code here
    pass
```

### TensorFlow Example

```python
import tensorflow as tf
from pycocotools.coco import COCO
import numpy as np
from PIL import Image
import os

def load_dataset(root_dir, ann_file):
    coco = COCO(ann_file)
    image_ids = coco.getImgIds()
    
    for img_id in image_ids:
        # Load image
        img_info = coco.loadImgs(img_id)[0]
        img_path = os.path.join(root_dir, 'images', img_info['file_name'])
        image = tf.io.read_file(img_path)
        image = tf.image.decode_png(image, channels=3)
        image = tf.image.resize(image, [512, 512])
        image = image / 255.0
        
        # Load annotations
        ann_ids = coco.getAnnIds(imgIds=img_id)
        anns = coco.loadAnns(ann_ids)
        
        # Create masks
        masks = []
        labels = []
        for ann in anns:
            mask = coco.annToMask(ann)
            mask = tf.image.resize(mask[..., np.newaxis], [512, 512])
            masks.append(mask)
            labels.append(ann['category_id'])
        
        yield image, {'masks': masks, 'labels': labels}

# Create dataset
dataset = tf.data.Dataset.from_generator(
    lambda: load_dataset(
        'exports/ai_training',
        'exports/ai_training/annotations/instances.json'
    ),
    output_signature=(
        tf.TensorSpec(shape=(512, 512, 3), dtype=tf.float32),
        {
            'masks': tf.TensorSpec(shape=None, dtype=tf.float32),
            'labels': tf.TensorSpec(shape=None, dtype=tf.int32)
        }
    )
)

# Training
for images, targets in dataset.batch(4):
    # Your training code here
    pass
```

### Detectron2 Example

```python
from detectron2.data import DatasetCatalog, MetadataCatalog
from detectron2.data.datasets import register_coco_instances

# Register dataset
register_coco_instances(
    "mammogram_train",
    {},
    "exports/ai_training/annotations/instances.json",
    "exports/ai_training/images"
)

# Get dataset
from detectron2.config import get_cfg
from detectron2.engine import DefaultTrainer

cfg = get_cfg()
cfg.DATASETS.TRAIN = ("mammogram_train",)
cfg.DATASETS.TEST = ()
cfg.DATALOADER.NUM_WORKERS = 2
cfg.MODEL.WEIGHTS = "detectron2://COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x/137849600/model_final_f10217.pkl"
cfg.SOLVER.IMS_PER_BATCH = 2
cfg.SOLVER.BASE_LR = 0.00025
cfg.SOLVER.MAX_ITER = 1000
cfg.MODEL.ROI_HEADS.NUM_CLASSES = 8  # 8 categories

trainer = DefaultTrainer(cfg)
trainer.resume_or_load(resume=False)
trainer.train()
```

## Configuration

### Environment Variable
Set the export directory in `.env`:
```bash
EXPORT_DIR=./exports
```

### Default Location
If not set, exports go to: `./exports/ai_training/`

## Features

### Automatic Updates
- ✅ New annotations trigger export
- ✅ Updated annotations re-export image
- ✅ Deleted annotations update export
- ✅ Master COCO file always current
- ✅ Individual files for each image

### DICOM Support
- ✅ DICOM images auto-converted to PNG
- ✅ Original dimensions preserved
- ✅ Proper windowing applied
- ✅ MONOCHROME1/2 handled correctly

### Performance
- ✅ Non-blocking export (uses setImmediate)
- ✅ Doesn't slow down annotation workflow
- ✅ Background processing
- ✅ Error handling with logging

### Data Quality
- ✅ Only annotated images exported
- ✅ Images without annotations excluded
- ✅ Proper COCO format validation
- ✅ Bounding boxes calculated
- ✅ Areas computed correctly

## Monitoring

### Check Export Status
```bash
# View exported images
ls -lh exports/ai_training/images/

# View annotation files
ls -lh exports/ai_training/annotations/

# Check master COCO file
cat exports/ai_training/annotations/instances.json | jq '.info'
```

### Logs
Auto-export logs appear in backend console:
```
[AnnotationExport] Auto-exporting image: uuid-123
[AnnotationExport] Auto-export complete for: uuid-123
[AnnotationExport] Master COCO file updated: 15 images
```

## Best Practices

### For Radiologists
1. **Annotate Normally**: System handles export automatically
2. **Complete Annotations**: Ensure all findings marked before moving on
3. **Use Categories**: Proper categorization improves AI training
4. **Add Notes**: Detailed notes help with dataset documentation

### For AI Engineers
1. **Use Master File**: `instances.json` for full dataset
2. **Individual Files**: For incremental training
3. **Validate Format**: Use `pycocotools` to validate
4. **Split Dataset**: Create train/val/test splits
5. **Augmentation**: Apply data augmentation during training

### For Administrators
1. **Monitor Disk Space**: Exports can grow large
2. **Backup Regularly**: Export folder contains training data
3. **Check Logs**: Monitor for export errors
4. **Clean Old Exports**: Remove outdated exports if needed

## Troubleshooting

### Export Not Working
- Check `EXPORT_DIR` in `.env`
- Verify write permissions on export folder
- Check backend logs for errors
- Ensure annotations exist for image

### Missing Images
- Only images with annotations are exported
- Check if annotations were saved successfully
- Verify image file exists in storage

### COCO Format Issues
- Use `pycocotools` to validate:
  ```python
  from pycocotools.coco import COCO
  coco = COCO('exports/ai_training/annotations/instances.json')
  ```
- Check individual annotation files
- Verify polygon coordinates are valid

## Summary

The automatic export system:
- ✅ **Zero Manual Work**: Exports happen automatically
- ✅ **Always Current**: Dataset updates with every annotation
- ✅ **COCO Format**: Industry-standard format
- ✅ **Ready for AI**: Direct use in PyTorch, TensorFlow, Detectron2
- ✅ **DICOM Support**: Handles medical imaging formats
- ✅ **Non-Blocking**: Doesn't slow down workflow
- ✅ **Well-Documented**: README included with exports
- ✅ **Production-Ready**: Error handling and logging

Your annotated images are automatically prepared for AI model training in the standard COCO format, ready to use with popular deep learning frameworks!
