export interface DataPoint {
  category: string;
  metric1: number; // People (%)
  metric2: number; // Estimated market value (%)
}

export interface ChartData {
  title1: string;
  title2: string;
  data: DataPoint[];
}

export interface ColorScale {
  base: string;
  colors: string[]; // generated palette
}

export enum ChartType {
  BUBBLE = 'BUBBLE',
  // Future chart types can be added here
}
