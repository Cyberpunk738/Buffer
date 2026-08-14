import { ProcessingNodeDefinition } from '../core/types';

export const NODE_REGISTRY: Record<string, ProcessingNodeDefinition> = {
  // --- INPUT NODES ---
  'input-image': {
    type: 'input-image',
    name: 'Image Input',
    category: 'input',
    description: 'Loads an image asset into the pipeline',
    inputs: [],
    outputs: [
      { id: 'output', name: 'Image', type: 'image', description: 'Output pixel data' }
    ],
    parameters: [
      { id: 'assetId', name: 'Asset', type: 'image', defaultValue: '', description: 'Selected image asset' }
    ]
  },

  // --- TRANSFORM NODES ---
  'transform-resize': {
    type: 'transform-resize',
    name: 'Resize',
    category: 'transform',
    description: 'Resizes the image dimensions',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      { id: 'width', name: 'Width', type: 'number', defaultValue: 1024, min: 1, max: 4096, step: 1, unit: 'px' },
      { id: 'height', name: 'Height', type: 'number', defaultValue: 1024, min: 1, max: 4096, step: 1, unit: 'px' },
      { id: 'maintainAspectRatio', name: 'Keep Aspect Ratio', type: 'boolean', defaultValue: true }
    ]
  },
  'transform-crop': {
    type: 'transform-crop',
    name: 'Crop',
    category: 'transform',
    description: 'Crops a rectangular section of the image',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      { id: 'x', name: 'X Offset', type: 'number', defaultValue: 0, min: 0, max: 4096, step: 1, unit: 'px' },
      { id: 'y', name: 'Y Offset', type: 'number', defaultValue: 0, min: 0, max: 4096, step: 1, unit: 'px' },
      { id: 'width', name: 'Width', type: 'number', defaultValue: 512, min: 1, max: 4096, step: 1, unit: 'px' },
      { id: 'height', name: 'Height', type: 'number', defaultValue: 512, min: 1, max: 4096, step: 1, unit: 'px' }
    ]
  },
  'transform-rotate': {
    type: 'transform-rotate',
    name: 'Rotate',
    category: 'transform',
    description: 'Rotates the image by an angle',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      {
        id: 'angle',
        name: 'Angle',
        type: 'select',
        defaultValue: 90,
        options: [
          { label: '0°', value: 0 },
          { label: '90° Clockwise', value: 90 },
          { label: '180°', value: 180 },
          { label: '270° (90° CCW)', value: 270 }
        ]
      }
    ]
  },
  'transform-flip': {
    type: 'transform-flip',
    name: 'Flip',
    category: 'transform',
    description: 'Flips image horizontally or vertically',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      { id: 'horizontal', name: 'Flip Horizontal', type: 'boolean', defaultValue: true },
      { id: 'vertical', name: 'Flip Vertical', type: 'boolean', defaultValue: false }
    ]
  },

  // --- FILTER NODES ---
  'filter-blur': {
    type: 'filter-blur',
    name: 'Blur',
    category: 'filter',
    description: 'Applies Gaussian blur effect',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      { id: 'radius', name: 'Radius', type: 'number', defaultValue: 5, min: 0, max: 100, step: 1, unit: 'px' }
    ]
  },
  'filter-sharpen': {
    type: 'filter-sharpen',
    name: 'Sharpen',
    category: 'filter',
    description: 'Enhances edge clarity and detail',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      { id: 'strength', name: 'Strength', type: 'number', defaultValue: 50, min: 0, max: 100, step: 1, unit: '%' }
    ]
  },
  'filter-grayscale': {
    type: 'filter-grayscale',
    name: 'Grayscale',
    category: 'filter',
    description: 'Converts image to monochrome black and white',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: []
  },
  'filter-invert': {
    type: 'filter-invert',
    name: 'Invert',
    category: 'filter',
    description: 'Inverts pixel RGB color channels',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: []
  },
  'filter-brightness': {
    type: 'filter-brightness',
    name: 'Brightness',
    category: 'filter',
    description: 'Adjusts overall pixel luminance',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      { id: 'brightness', name: 'Brightness', type: 'number', defaultValue: 0, min: -100, max: 100, step: 1 }
    ]
  },
  'filter-contrast': {
    type: 'filter-contrast',
    name: 'Contrast',
    category: 'filter',
    description: 'Adjusts difference between light and dark areas',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      { id: 'contrast', name: 'Contrast', type: 'number', defaultValue: 0, min: -100, max: 100, step: 1 }
    ]
  },
  'filter-saturation': {
    type: 'filter-saturation',
    name: 'Saturation',
    category: 'filter',
    description: 'Adjusts color intensity and vividness',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      { id: 'saturation', name: 'Saturation', type: 'number', defaultValue: 0, min: -100, max: 100, step: 1 }
    ]
  },

  // --- COLOR NODES ---
  'color-hue': {
    type: 'color-hue',
    name: 'Hue Shift',
    category: 'color',
    description: 'Rotates color hues around color wheel',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      { id: 'hue', name: 'Hue Angle', type: 'number', defaultValue: 0, min: -180, max: 180, step: 1, unit: '°' }
    ]
  },
  'color-exposure': {
    type: 'color-exposure',
    name: 'Exposure',
    category: 'color',
    description: 'Simulates camera exposure changes',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      { id: 'exposure', name: 'Exposure EV', type: 'number', defaultValue: 0, min: -3, max: 3, step: 0.1 }
    ]
  },
  'color-temperature': {
    type: 'color-temperature',
    name: 'Temperature',
    category: 'color',
    description: 'Adjusts color temperature (Cool / Warm)',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      { id: 'temperature', name: 'Temp', type: 'number', defaultValue: 0, min: -100, max: 100, step: 1 }
    ]
  },
  'color-tint': {
    type: 'color-tint',
    name: 'Tint',
    category: 'color',
    description: 'Adjusts Green / Magenta tint balance',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      { id: 'tint', name: 'Tint', type: 'number', defaultValue: 0, min: -100, max: 100, step: 1 }
    ]
  },

  // --- COMPOSITE NODES ---
  'composite-blend': {
    type: 'composite-blend',
    name: 'Blend',
    category: 'composite',
    description: 'Blends two images together using blend modes',
    inputs: [
      { id: 'imageA', name: 'Base (A)', type: 'image' },
      { id: 'imageB', name: 'Blend (B)', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      {
        id: 'mode',
        name: 'Blend Mode',
        type: 'select',
        defaultValue: 'normal',
        options: [
          { label: 'Normal', value: 'normal' },
          { label: 'Multiply', value: 'multiply' },
          { label: 'Screen', value: 'screen' },
          { label: 'Overlay', value: 'overlay' },
          { label: 'Darken', value: 'darken' },
          { label: 'Lighten', value: 'lighten' }
        ]
      },
      { id: 'opacity', name: 'Opacity', type: 'number', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%' }
    ]
  },
  'composite-mask': {
    type: 'composite-mask',
    name: 'Mask',
    category: 'composite',
    description: 'Applies alpha mask to image',
    inputs: [
      { id: 'image', name: 'Image', type: 'image' },
      { id: 'mask', name: 'Mask', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: []
  },
  'composite-opacity': {
    type: 'composite-opacity',
    name: 'Opacity',
    category: 'composite',
    description: 'Controls overall layer opacity',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [
      { id: 'output', name: 'Image', type: 'image' }
    ],
    parameters: [
      { id: 'opacity', name: 'Opacity', type: 'number', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%' }
    ]
  },

  // --- OUTPUT NODES ---
  'output-preview': {
    type: 'output-preview',
    name: 'Preview',
    category: 'output',
    description: 'Renders output image to main viewport canvas',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [],
    parameters: []
  },
  'output-export': {
    type: 'output-export',
    name: 'Export',
    category: 'output',
    description: 'Exports processed image file to local disk',
    inputs: [
      { id: 'input', name: 'Image', type: 'image' }
    ],
    outputs: [],
    parameters: [
      { id: 'filename', name: 'Filename', type: 'text', defaultValue: 'processed-image' },
      {
        id: 'format',
        name: 'Format',
        type: 'select',
        defaultValue: 'image/png',
        options: [
          { label: 'PNG (.png)', value: 'image/png' },
          { label: 'JPEG (.jpg)', value: 'image/jpeg' },
          { label: 'WebP (.webp)', value: 'image/webp' }
        ]
      },
      { id: 'quality', name: 'Quality', type: 'number', defaultValue: 90, min: 10, max: 100, step: 5, unit: '%' }
    ]
  }
};

export const getNodeDefinition = (type: string): ProcessingNodeDefinition | undefined => {
  return NODE_REGISTRY[type];
};

export const getNodesByCategory = (): Record<string, ProcessingNodeDefinition[]> => {
  const categories: Record<string, ProcessingNodeDefinition[]> = {
    input: [],
    transform: [],
    filter: [],
    color: [],
    composite: [],
    output: []
  };

  Object.values(NODE_REGISTRY).forEach((def) => {
    if (categories[def.category]) {
      categories[def.category].push(def);
    }
  });

  return categories;
};
