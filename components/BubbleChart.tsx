import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

interface BubbleChartProps {
  data: Array<{ name: string; value: number }>;
  colors: string[];
  width?: number;
  height?: number;
  textColor?: string;
  metricLabel: string;
}

const BubbleChart: React.FC<BubbleChartProps> = ({ 
  data, 
  colors, 
  width = 400, 
  height = 400,
  textColor = '#111827',
  metricLabel
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Memoize the hierarchy to prevent unnecessary recalculations
  const root = useMemo(() => {
    const pack = d3.pack<{ name: string; value: number }>()
      .size([width, height])
      .padding(10); // Spacing between bubbles

    const hierarchy = d3.hierarchy({ children: data } as any)
      .sum((d: any) => d.value);

    return pack(hierarchy);
  }, [data, width, height]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Create a color scale mapping data index to the provided color palette
    const colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.name))
      .range(colors);

    // Render Leaves
    const leaves = root.leaves();

    const group = svg.selectAll("g")
      .data(leaves)
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // Circles
    group.append("circle")
      .attr("r", 0) // Start at 0 for animation
      .attr("fill", (d: any) => colorScale(d.data.name) as string)
      .attr("fill-opacity", 0.9)
      .transition()
      .duration(800)
      .ease(d3.easeBackOut)
      .attr("r", d => d.r);

    // Text Labels (Value)
    group.append("text")
      .attr("y", d => -d.r * 0.25) // Shift up slightly more to make room for text below
      .attr("dy", "0.3em") // Center optically
      .style("text-anchor", "middle")
      // Reduced base font size multiplier and max size to fit better in small bubbles
      .style("font-size", d => Math.min(d.r / 2.5, 24) + "px") 
      .style("font-weight", "800")
      .style("fill", textColor) // Use dynamic text color
      .style("pointer-events", "none")
      .style("opacity", 0)
      .text(d => (d.data as any).value + "%")
      .transition()
      .delay(400)
      .duration(500)
      .style("opacity", 1);

    // Text Labels (Name) - Wrapped with dynamic width to match circle curvature
    const textLabels = group.append("text")
      .style("text-anchor", "middle")
      .style("fill", textColor) 
      .style("fill-opacity", 0.9)
      .style("pointer-events", "none")
      .style("opacity", 0);

    textLabels.each(function(d) {
      const el = d3.select(this);
      const name = (d.data as any).name || "";
      const words = name.split(/\s+/);
      
      const radius = d.r;
      const charCount = name.length;
      
      // Calculate dynamic font size based on text length and available area
      // Heuristic: Scale font size down as text gets longer relative to the bubble size.
      // We want to fit in the bottom half roughly.
      
      let fontSize = Math.min(radius / 4.5, 11); // Start with a reasonable max size (11px)

      if (charCount > 0) {
        // Area heuristic: 
        // Available width approx radius * 1.8
        // Available height approx radius * 0.8
        // Total text area required approx charCount * (fontSize^2 * 0.6)
        // fontSize ≈ radius * sqrt(Const / charCount)
        const areaHeuristic = radius * Math.sqrt(2.8 / charCount);
        fontSize = Math.min(fontSize, areaHeuristic);
      }
      
      // Ensure it doesn't get microscopically small, but prioritize fitting
      fontSize = Math.max(fontSize, 6); 

      el.style("font-size", fontSize + "px");

      const lineHeight = fontSize * 1.1;

      // Start text below the number.
      let currentY = radius * 0.1; 
      
      // Helper: get available width at a specific Y coordinate
      // x = sqrt(r^2 - y^2)
      // width = 2 * x * padding factor
      const getWidthAtY = (y: number) => {
        const absY = Math.abs(y);
        if (absY >= radius * 0.9) return 0;
        const w = 2 * Math.sqrt(radius * radius - absY * absY);
        return w * 0.9; // 90% usage of width
      };

      let line: string[] = [];
      let tspan = el.append("tspan")
        .attr("x", 0)
        .attr("y", currentY)
        .text(null);

      let allowedWidth = getWidthAtY(currentY);

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        line.push(word);
        tspan.text(line.join(" "));
        const node = tspan.node() as SVGTextContentElement;
        
        // Check if line exceeds width
        if (node.getComputedTextLength() > allowedWidth && line.length > 1) {
          line.pop();
          tspan.text(line.join(" "));
          
          // Move to next line
          line = [word];
          currentY += lineHeight;
          allowedWidth = getWidthAtY(currentY);
          
          // Stop if we are too far down (visual clipping), though loop continues to attempt
          if (currentY < radius * 0.9) {
             tspan = el.append("tspan")
               .attr("x", 0)
               .attr("y", currentY)
               .text(word);
          }
        }
      }
    });

    textLabels
      .transition()
      .delay(600)
      .duration(500)
      .style("opacity", 1);
      
  }, [data, colors, width, height, root, textColor]);

  return (
    <div className="flex flex-col items-center">
       <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {metricLabel}
      </div>
      <svg 
        ref={svgRef} 
        width={width} 
        height={height} 
        className="overflow-visible"
        style={{ maxWidth: '100%', height: 'auto' }}
        viewBox={`0 0 ${width} ${height}`}
      />
    </div>
  );
};

export default BubbleChart;