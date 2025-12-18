import * as d3 from 'd3';

export const generateScale = (baseColor: string, steps: number = 5): string[] => {
  const color = d3.color(baseColor);
  if (!color) return Array(steps).fill(baseColor);

  const hsl = d3.hsl(color);
  
  // We want to generate a scale that includes the base color but offers variation in lightness/saturation
  // mimicking Tailwind's scales.
  
  const palette: string[] = [];
  
  // Strategy: Create a range of lightness values centered roughly around the base color's lightness,
  // or forcing a spread from light to dark.
  
  // Adjusted to [0.55, 0.2] to ensure bubbles are dark enough for white text.
  // This covers roughly the Tailwind 500-900 range.
  
  const lightnessScale = d3.scaleLinear()
    .domain([0, steps - 1])
    .range([0.55, 0.2]); // Medium-Dark to Dark

  for (let i = 0; i < steps; i++) {
    const l = lightnessScale(i);
    // Preserve Hue and Saturation, modify Lightness
    const newColor = d3.hsl(hsl.h, hsl.s, l);
    palette.push(newColor.formatHex());
  }

  return palette;
};