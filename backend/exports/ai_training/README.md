# Mammogram Annotation Dataset Export

## Export Information
- **Date**: 2026-01-13T06:03:47.980Z
- **Format**: COCO JSON
- **Images**: 11
- **Annotations**: 21
- **Categories**: 8

## Directory Structure
```
ai_training/
├── images/              # Image files (PNG format)
├── annotations/         # COCO JSON annotations
│   └── instances.json   # Main annotation file
└── README.md           # This file
```

## Categories
- **mass** (ID: 1)
- **calcification** (ID: 2)
- **asymmetry** (ID: 3)
- **distortion** (ID: 4)
- **architectural_distortion** (ID: 5)
- **lymph_node** (ID: 6)
- **skin_lesion** (ID: 7)
- **other** (ID: 8)

## COCO Format
This dataset uses the COCO (Common Objects in Context) format, which is widely supported by:
- PyTorch (torchvision.datasets.CocoDetection)
- TensorFlow (tensorflow_datasets)
- Detectron2
- MMDetection
- YOLO (with conversion)

## Usage with PyTorch

```python
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
    root_dir='ai_training',
    ann_file='ai_training/annotations/instances.json'
)
```

## Usage with TensorFlow

```python
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
        'ai_training/images',
        'ai_training/annotations/instances.json'
    ),
    output_signature=(
        tf.TensorSpec(shape=(None, None, 3), dtype=tf.uint8),
        tf.TensorSpec(shape=None, dtype=tf.py_function)
    )
)
```

## Annotation Statistics
- **mass**: 19 annotations
- **asymmetry**: 1 annotations
- **distortion**: 1 annotations

## Notes
- All DICOM images have been converted to PNG format
- Polygon annotations include segmentation masks
- Bounding boxes are in [x, y, width, height] format
- All coordinates are in pixel space
- Images maintain original dimensions

## Citation
If you use this dataset, please cite:
```
Mammogram Viewer Application
Annotation Dataset Export
Generated: 2026-01-13T06:03:47.981Z
```
