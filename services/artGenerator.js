class ArtGenerator {
  constructor() {
    this.canvasWidth = 800;
    this.canvasHeight = 600;
  }

  generateAbstractArt(artData, moodData) {
    const { artStyle, colorPalette } = artData;
    const { primaryEmotion, emotionIntensity, energyLevel } = moodData;

    // Generate SVG-based abstract art
    const svg = this.createSVGArt(artStyle, colorPalette, primaryEmotion, emotionIntensity, energyLevel);
    
    return {
      svg: svg,
      metadata: {
        style: artStyle,
        colors: colorPalette,
        emotion: primaryEmotion,
        intensity: emotionIntensity,
        energy: energyLevel,
        timestamp: new Date().toISOString()
      }
    };
  }

  createSVGArt(style, colors, emotion, intensity, energy) {
    const elements = [];
    const width = this.canvasWidth;
    const height = this.canvasHeight;

    // Ensure colors are valid, provide defaults if needed
    const validColors = this.ensureValidColors(colors);
    
    // Normalize intensity and energy to ensure they're numbers
    const normalizedIntensity = Math.max(1, Math.min(10, intensity || 5));
    const normalizedEnergy = this.normalizeEnergy(energy);

    // Create gradient definitions
    const gradientDefs = this.createGradientDefs(validColors);

    // Background - use a lighter version of the first color or white
    elements.push(`<rect width="${width}" height="${height}" fill="#f5f5f5"/>`);
    
    // Add a subtle gradient overlay
    elements.push(`<rect width="${width}" height="${height}" fill="url(#bgGrad)" opacity="0.3"/>`);

    switch (style.toLowerCase()) {
      case 'expressionist':
        elements.push(...this.generateExpressionistElements(validColors, normalizedIntensity, normalizedEnergy, width, height));
        break;
      case 'minimalist':
        elements.push(...this.generateMinimalistElements(validColors, normalizedIntensity, normalizedEnergy, width, height));
        break;
      case 'surreal':
        elements.push(...this.generateSurrealElements(validColors, normalizedIntensity, normalizedEnergy, width, height));
        break;
      case 'abstract':
      default:
        elements.push(...this.generateAbstractElements(validColors, normalizedIntensity, normalizedEnergy, width, height));
        break;
    }

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blur">
            <feGaussianBlur stdDeviation="${normalizedIntensity / 2}"/>
          </filter>
          <filter id="roughPaper">
            <feTurbulence baseFrequency="0.04" numOctaves="5" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1"/>
          </filter>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${validColors[0]};stop-opacity:1" />
            <stop offset="50%" style="stop-color:${validColors[Math.floor(validColors.length / 2)]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${validColors[validColors.length - 1]};stop-opacity:1" />
          </linearGradient>
          ${gradientDefs}
        </defs>
        ${elements.join('\n        ')}
      </svg>
    `;
  }

  generateExpressionistElements(colors, intensity, energy, width, height) {
    const elements = [];
    const numShapes = Math.floor(intensity * 8 + energy * 5 + 15);

    for (let i = 0; i < numShapes; i++) {
      const color = colors[i % colors.length];
      const opacity = Math.random() * 0.5 + 0.4;
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 250 + 80;

      const shapeChoice = Math.random();
      if (shapeChoice > 0.6) {
        // Irregular shapes
        const points = this.generateIrregularPolygon(x, y, size, 5 + Math.floor(Math.random() * 4));
        elements.push(`<polygon points="${points}" fill="${color}" opacity="${opacity}" filter="url(#roughPaper)"/>`);
      } else if (shapeChoice > 0.3) {
        // Bold brushstrokes
        const strokeWidth = intensity * 15 + 8;
        const x2 = x + Math.random() * 300 - 150;
        const y2 = y + Math.random() * 300 - 150;
        elements.push(`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round"/>`);
      } else {
        // Splatter effects
        const splatterSize = Math.random() * 60 + 20;
        elements.push(`<circle cx="${x}" cy="${y}" r="${splatterSize}" fill="${color}" opacity="${opacity}" filter="url(#blur)"/>`);
      }
    }

    return elements;
  }

  generateMinimalistElements(colors, intensity, energy, width, height) {
    const elements = [];
    const numElements = Math.floor(intensity * 1.5 + 8);

    for (let i = 0; i < numElements; i++) {
      const color = colors[i % colors.length];
      const x = Math.random() * width * 0.8 + width * 0.1;
      const y = height / 2 + Math.sin(i * 0.5) * 100;

      if (i % 2 === 0) {
        const size = 50 + intensity * 10;
        elements.push(`<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" opacity="0.8"/>`);
      } else {
        const width_rect = 20 + energy * 5;
        const height_rect = 100 + intensity * 20;
        elements.push(`<rect x="${x - width_rect/2}" y="${y - height_rect/2}" width="${width_rect}" height="${height_rect}" fill="${color}" opacity="0.7"/>`);
      }
    }

    return elements;
  }

  generateSurrealElements(colors, intensity, energy, width, height) {
    const elements = [];
    const numElements = Math.floor(intensity * 5 + energy * 3 + 12);

    for (let i = 0; i < numElements; i++) {
      const color = colors[i % colors.length];
      const x = Math.random() * width;
      const y = Math.random() * height;

      const choice = Math.random();
      if (choice > 0.7) {
        // Floating organic shapes
        const path = this.generateOrganicPath(x, y, 100 + intensity * 30);
        elements.push(`<path d="${path}" fill="${color}" opacity="${Math.random() * 0.4 + 0.5}" filter="url(#blur)"/>`);
      } else if (choice > 0.4) {
        // Disconnected geometric forms
        const size = 40 + Math.random() * 150;
        const rotation = Math.random() * 360;
        elements.push(`<polygon points="${this.generateIrregularPolygon(x, y, size, 3 + Math.floor(Math.random() * 6))}" fill="${color}" opacity="${Math.random() * 0.3 + 0.6}" transform="rotate(${rotation} ${x} ${y})"/>`);
      } else if (choice > 0.2) {
        // Flowing lines
        const path = this.generateFlowingLine(x, y, energy * 70 + 120);
        elements.push(`<path d="${path}" stroke="${color}" stroke-width="${intensity * 2 + 3}" fill="none" opacity="0.8"/>`);
      } else {
        // Gradient circles
        elements.push(`<circle cx="${x}" cy="${y}" r="${Math.random() * 100 + 40}" fill="${color}" opacity="${Math.random() * 0.4 + 0.4}"/>`);
      }
    }

    return elements;
  }

  generateAbstractElements(colors, intensity, energy, width, height) {
    const elements = [];
    const numElements = Math.floor(intensity * 8 + energy * 5 + 25);
    
    console.log(`Generating ${numElements} abstract elements with ${colors.length} colors`);

    for (let i = 0; i < numElements; i++) {
      const colorIndex = i % colors.length;
      const color = colors[colorIndex];
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 200 + 60;
      
      // Use gradients more frequently and ensure valid gradient index
      const useGradient = Math.random() > 0.5;
      const gradIndex = Math.min(colorIndex, Math.min(colors.length - 2, 3));
      const fillColor = useGradient && colors.length > 1 
        ? `url(#${Math.random() > 0.5 ? 'grad' : 'radgrad'}${gradIndex})` 
        : color;

      const shapeType = Math.random();
      
      if (shapeType > 0.75) {
        // Circles with varying sizes
        elements.push(`<circle cx="${x}" cy="${y}" r="${size/2}" fill="${fillColor}" opacity="${Math.random() * 0.4 + 0.5}"/>`);
      } else if (shapeType > 0.5) {
        // Rectangles and squares
        const rotation = Math.random() * 360;
        const width_rect = size * (0.5 + Math.random() * 0.8);
        const height_rect = size * (0.5 + Math.random() * 0.8);
        elements.push(`<rect x="${x - width_rect/2}" y="${y - height_rect/2}" width="${width_rect}" height="${height_rect}" fill="${fillColor}" opacity="${Math.random() * 0.4 + 0.5}" transform="rotate(${rotation} ${x} ${y})"/>`);
      } else if (shapeType > 0.25) {
        // Polygons with varying sides
        const sides = 3 + Math.floor(Math.random() * 6);
        const points = this.generateRegularPolygon(x, y, size/2, sides);
        const rotation = Math.random() * 360;
        elements.push(`<polygon points="${points}" fill="${fillColor}" opacity="${Math.random() * 0.4 + 0.5}" transform="rotate(${rotation} ${x} ${y})"/>`);
      } else {
        // Ellipses
        const rotation = Math.random() * 180;
        elements.push(`<ellipse cx="${x}" cy="${y}" rx="${size * 0.7}" ry="${size * 0.4}" fill="${fillColor}" opacity="${Math.random() * 0.4 + 0.5}" transform="rotate(${rotation} ${x} ${y})"/>`);
      }
    }

    // Add some connecting curves for visual flow using all colors
    const numCurves = Math.floor(energy * 2 + 5);
    for (let i = 0; i < numCurves; i++) {
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      const path = this.generateFlowingLine(startX, startY, 150 + energy * 30);
      const color = colors[i % colors.length];
      elements.push(`<path d="${path}" stroke="${color}" stroke-width="${3 + intensity}" fill="none" opacity="0.7"/>`);
    }

    return elements;
  }

  generateRegularPolygon(centerX, centerY, radius, sides) {
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }

  generateIrregularPolygon(centerX, centerY, baseRadius, sides) {
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const radiusVariation = baseRadius * (0.5 + Math.random() * 0.5);
      const x = centerX + radiusVariation * Math.cos(angle);
      const y = centerY + radiusVariation * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }

  generateOrganicPath(startX, startY, size) {
    const numPoints = 6 + Math.floor(Math.random() * 4);
    let path = `M ${startX} ${startY}`;
    
    for (let i = 1; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      const radius = size * (0.5 + Math.random() * 0.5);
      const x = startX + radius * Math.cos(angle);
      const y = startY + radius * Math.sin(angle);
      
      if (i === 1) {
        path += ` Q ${x} ${y}`;
      } else {
        const prevAngle = ((i - 1) * 2 * Math.PI) / numPoints;
        const controlX = startX + (radius * 0.7) * Math.cos(prevAngle + 0.5);
        const controlY = startY + (radius * 0.7) * Math.sin(prevAngle + 0.5);
        path += ` ${controlX} ${controlY} ${x} ${y}`;
      }
    }
    
    path += ' Z';
    return path;
  }

  generateFlowingLine(startX, startY, length) {
    let path = `M ${startX} ${startY}`;
    let currentX = startX;
    let currentY = startY;
    
    const segments = 5 + Math.floor(Math.random() * 5);
    const segmentLength = length / segments;
    
    for (let i = 0; i < segments; i++) {
      const angle = Math.random() * Math.PI * 2;
      const controlX = currentX + Math.cos(angle) * segmentLength * 0.5;
      const controlY = currentY + Math.sin(angle) * segmentLength * 0.5;
      
      currentX += Math.cos(angle) * segmentLength;
      currentY += Math.sin(angle) * segmentLength;
      
      path += ` Q ${controlX} ${controlY} ${currentX} ${currentY}`;
    }
    
    return path;
  }

  ensureValidColors(colors) {
    // Default vibrant color palette if colors are invalid or missing
    const defaultColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    
    if (!colors || !Array.isArray(colors) || colors.length === 0) {
      console.log('No colors provided, using defaults');
      return defaultColors;
    }

    // Filter valid hex colors and ensure we have at least 5
    const validColors = colors.filter(color => {
      return color && typeof color === 'string' && /^#[0-9A-F]{6}$/i.test(color);
    });

    console.log(`Input colors: ${colors.length}, Valid colors: ${validColors.length}`, validColors);

    // If we have fewer than 5 valid colors, supplement with defaults
    if (validColors.length < 5) {
      const supplemented = [...validColors, ...defaultColors].slice(0, 7);
      console.log('Supplemented colors:', supplemented);
      return supplemented;
    }

    return validColors;
  }

  normalizeEnergy(energy) {
    const energyMap = {
      'very-low': 2,
      'low': 4,
      'moderate': 6,
      'high': 8,
      'very-high': 10
    };
    
    if (typeof energy === 'string') {
      return energyMap[energy.toLowerCase()] || 6;
    }
    
    return Math.max(1, Math.min(10, energy || 6));
  }

  createGradientDefs(colors) {
    let gradients = '';
    
    // Create linear gradients
    for (let i = 0; i < Math.min(colors.length - 1, 4); i++) {
      gradients += `
        <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors[i]};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${colors[i + 1]};stop-opacity:0.6" />
        </linearGradient>
      `;
    }

    // Create radial gradients
    for (let i = 0; i < Math.min(colors.length - 1, 4); i++) {
      gradients += `
        <radialGradient id="radgrad${i}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:${colors[i]};stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:${colors[i + 1]};stop-opacity:0.3" />
        </radialGradient>
      `;
    }

    return gradients;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

module.exports = new ArtGenerator();
