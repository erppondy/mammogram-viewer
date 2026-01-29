# Automatic AI Training Export - Quick Summary

## What Was Implemented

✅ **Automatic Export System** - Annotated images are automatically saved in COCO format for AI training

## How It Works

### Automatic Triggers
Every time you:
- **Create** an annotation → Image exported to `exports/ai_training/`
- **Update** an annotation → Image re-exported with changes
- **Delete** an annotation → Export updated (removed if no annotations left)

### No Manual Action Needed
- ❌ No export buttons
- ❌ No manual downloads
- ❌ No extra steps
- ✅ Just annotate normally!

## Where Files Are Saved

```
exports/ai_training/
├── images/                    # PNG images (DICOM auto-converted)
│   ├── mammogram_001.png
│   ├── mammogram_002.png
│   └── ...
├── annotations/
│   ├── mammogram_001.json    # Individual annotations
│   ├── mammogram_002.json
│   ├── instances.json        # Master COCO dataset
│   └── ...
└── README.md                  # Usage instructions
```

## Format: COCO JSON

Industry-standard format used by:
- PyTorch
- TensorFlow
- Detectron2
- MMDetection
- YOLO (with conversion)

## What Gets Exported

### Images
- ✅ All annotated images
- ✅ DICOM → PNG conversion
- ✅ Original dimensions preserved
- ✅ Only images with annotations

### Annotations
- ✅ Polygons with segmentation masks
- ✅ Bounding boxes
- ✅ Categories (mass, calcification, etc.)
- ✅ Areas calculated
- ✅ All metadata

## Example Usage

### PyTorch
```python
from pycocotools.coco import COCO
from torch.utils.data import Dataset

class MammogramDataset(Dataset):
    def __init__(self):
        self.coco = COCO('exports/ai_training/annotations/instances.json')
        self.ids = list(self.coco.imgs.keys())
    
    def __getitem__(self, idx):
        # Load image and annotations
        ...
```

### TensorFlow
```python
import tensorflow as tf
from pycocotools.coco import COCO

coco = COCO('exports/ai_training/annotations/instances.json')
# Use for training
```

## Configuration

Set in `backend/.env`:
```bash
EXPORT_DIR=./exports
```

## Benefits

1. **Zero Effort** - Happens automatically
2. **Always Current** - Updates with every change
3. **Standard Format** - COCO JSON
4. **Ready to Use** - Direct AI training
5. **Non-Blocking** - Doesn't slow workflow
6. **DICOM Support** - Auto-converts medical images

## Monitoring

Check backend logs:
```
[AnnotationExport] Auto-exporting image: uuid-123
[AnnotationExport] Auto-export complete for: uuid-123
[AnnotationExport] Master COCO file updated: 15 images
```

## That's It!

Just annotate images normally. The system automatically:
1. Exports images to `exports/ai_training/images/`
2. Creates COCO annotations in `exports/ai_training/annotations/`
3. Updates master dataset file `instances.json`
4. Keeps everything synchronized

**Your AI training dataset is always ready!** 🤖
