export const chartColors = {
  primary: "var(--chart-1)",
  secondary: "var(--chart-2)",
  tertiary: "var(--chart-3)",
  quaternary: "var(--chart-4)",
  quinary: "var(--chart-5)",
}

export const chartTheme = {
  // Grid styling
  grid: {
    stroke: "var(--border)",
    strokeDasharray: "4 4",
  },
  // Axis styling
  xAxis: {
    stroke: "var(--border)",
    fontSize: 12,
    tickLine: false,
    axisLine: true,
    tickMargin: 8,
    style: {
      fontSize: "12px",
      fill: "var(--muted-foreground)",
    },
  },
  yAxis: {
    stroke: "var(--border)",
    fontSize: 12,
    tickLine: false,
    axisLine: true,
    tickMargin: 8,
    style: {
      fontSize: "12px",
      fill: "var(--muted-foreground)",
    },
  },
  // Reference line styling
  referenceLine: {
    stroke: "var(--muted-foreground)",
    strokeDasharray: "4 4",
    strokeOpacity: 0.5,
  },
  // Bar chart styling
  bar: {
    radius: [4, 4, 0, 0] as [number, number, number, number],
  },
  // Line chart styling
  line: {
    strokeWidth: 2,
    dot: {
      strokeWidth: 2,
      r: 4,
    },
    activeDot: {
      strokeWidth: 2,
      r: 6,
    },
  },
  // Area chart styling
  area: {
    strokeWidth: 2,
    fillOpacity: 0.1,
  },
} 