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

    // Background
    elements.push(`<rect width="${width}" height="${height}" fill="${colors[0] || '#ffffff'}"/>`);

    switch (style.toLowerCase()) {
      case 'expressionist':
        elements.push(...this.generateExpressionistElements(colors, intensity, energy, width, height));
        break;
      case 'minimalist':
        elements.push(...this.generateMinimalistElements(colors, intensity, energy, width, height));
        break;
      case 'surreal':
        elements.push(...this.generateSurrealElements(colors, intensity, energy, width, height));
        break;
      case 'abstract':
      default:
        elements.push(...this.generateAbstractElements(colors, intensity, energy, width, height));
        break;
    }

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blur">
            <feGaussianBlur stdDeviation="${intensity / 2}"/>
          </filter>
          <filter id="roughPaper">
            <feTurbulence baseFrequency="0.04" numOctaves="5" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1"/>
          </filter>
        </defs>
        ${elements.join('\n        ')}
      </svg>
    `;
  }

  generateExpressionistElements(colors, intensity, energy, width, height) {
    const elements = [];
    const numShapes = Math.floor(intensity * 3 + energy * 2);

    for (let i = 0; i < numShapes; i++) {
      const color = colors[i % colors.length];
      const opacity = Math.random() * 0.7 + 0.3;
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 200 + 50;

      if (Math.random() > 0.5) {
        // Irregular shapes
        const points = this.generateIrregularPolygon(x, y, size, 6);
        elements.push(`<polygon points="${points}" fill="${color}" opacity="${opacity}" filter="url(#roughPaper)"/>`);
      } else {
        // Bold brushstrokes
        const strokeWidth = intensity * 10 + 5;
        const x2 = x + Math.random() * 200 - 100;
        const y2 = y + Math.random() * 200 - 100;
        elements.push(`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round"/>`);
      }
    }

    return elements;
  }

  generateMinimalistElements(colors, intensity, energy, width, height) {
    const elements = [];
    const numElements = Math.min(intensity + 2, 5);

    for (let i = 0; i < numElements; i++) {
      const color = colors[i % colors.length];
      const x = (width / (numElements + 1)) * (i + 1);
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
    const numElements = Math.floor(intensity * 2 + 3);

    for (let i = 0; i < numElements; i++) {
      const color = colors[i % colors.length];
      const x = Math.random() * width;
      const y = Math.random() * height;

      if (Math.random() > 0.6) {
        // Floating organic shapes
        const path = this.generateOrganicPath(x, y, 100 + intensity * 20);
        elements.push(`<path d="${path}" fill="${color}" opacity="0.6" filter="url(#blur)"/>`);
      } else if (Math.random() > 0.3) {
        // Disconnected geometric forms
        const size = 30 + Math.random() * 100;
        const rotation = Math.random() * 360;
        elements.push(`<polygon points="${this.generateIrregularPolygon(x, y, size, 3 + Math.floor(Math.random() * 5))}" fill="${color}" opacity="0.7" transform="rotate(${rotation} ${x} ${y})"/>`);
      } else {
        // Flowing lines
        const path = this.generateFlowingLine(x, y, energy * 50 + 100);
        elements.push(`<path d="${path}" stroke="${color}" stroke-width="${intensity + 2}" fill="none" opacity="0.8"/>`);
      }
    }

    return elements;
  }

  generateAbstractElements(colors, intensity, energy, width, height) {
    const elements = [];
    const numElements = Math.floor(intensity * 4 + energy * 2);

    for (let i = 0; i < numElements; i++) {
      const color = colors[i % colors.length];
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 150 + 50;

      const shapeType = Math.random();
      
      if (shapeType > 0.7) {
        // Circles
        elements.push(`<circle cx="${x}" cy="${y}" r="${size/2}" fill="${color}" opacity="${Math.random() * 0.6 + 0.4}"/>`);
      } else if (shapeType > 0.4) {
        // Rectangles
        const rotation = Math.random() * 360;
        elements.push(`<rect x="${x - size/2}" y="${y - size/2}" width="${size}" height="${size * 0.6}" fill="${color}" opacity="${Math.random() * 0.6 + 0.4}" transform="rotate(${rotation} ${x} ${y})"/>`);
      } else {
        // Triangles and polygons
        const sides = 3 + Math.floor(Math.random() * 4);
        const points = this.generateRegularPolygon(x, y, size/2, sides);
        elements.push(`<polygon points="${points}" fill="${color}" opacity="${Math.random() * 0.6 + 0.4}"/>`);
      }
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
