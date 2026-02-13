"use client";

import React, { useEffect, useRef, useState, memo, useMemo } from "react";

// 데이터 구조 정의
interface ChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartData[];
}

// [1] 차트 본체: React.memo로 최적화
const ChartContent = memo(function ChartContent({ svgHtml }: { svgHtml: string }) {
  return (
    <>
      <style>{`
        @keyframes chartFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chart-layer {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          opacity: 0;
          animation: chartFadeIn 0.5s ease-out forwards;
          animation-delay: 0.5s;
          pointer-events: none;
        }
      `}</style>
      <div className="chart-layer" dangerouslySetInnerHTML={{ __html: svgHtml }} />
    </>
  );
});

// [2] 스켈레톤: 픽셀 좌표 고정
const SkeletonChart = memo(function SkeletonChart() {
  const h = 400; const pl = 70; const pb = 50; const pt = 40;
  const axisB = h - pb;
  const areaH = h - pt - pb;
  const grid = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const color = "#E0E0E0";

  return (
    <svg width="100%" height={h} style={{ display: 'block', backgroundColor: 'white' }}>
      {grid.map(p => (
        <line key={p} x1={pl} y1={axisB - p * areaH} x2="95%" y2={axisB - p * areaH} stroke={color} strokeWidth="1" />
      ))}
      <path d={`M ${pl} ${pt} L ${pl} ${axisB} L 95% ${axisB}`} stroke={color} strokeWidth="1.5" fill="none" />
      {grid.map(p => (
        <rect key={p} x="20" y={axisB - p * areaH - 5} width="35" height="10" fill="#F5F5F5" rx="2" />
      ))}
    </svg>
  );
});

const BarChart: React.FC<BarChartProps> = ({ data = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [svgHtml, setSvgHtml] = useState<string>("");

  // 크기 감지 (ResizeObserver)
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (let e of entries) {
        const w = Math.round(e.contentRect.width);
        const h = Math.round(e.contentRect.height);
        setDimensions(prev => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Wasm 렌더링
  useEffect(() => {
    if (dimensions.width === 0 || data.length === 0) return;
    const render = async () => {
      try {
        const wasm = await import("../../public/pkg");
        await wasm.default();
        const svg = wasm.generate_dynamic_svg(
          data.map(d => d.label),
          new Float64Array(data.map(d => d.value)),
          dimensions.width,
          dimensions.height
        );
        setSvgHtml(svg);
      } catch (e) {
        console.error("Wasm loading error:", e);
      }
    };
    render();
  }, [dimensions, data]);

  // 직접 DOM 조작 툴팁 핸들러
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!tooltipRef.current || !containerRef.current || !svgHtml) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const paddingLeft = 70;
    const chartW = dimensions.width - paddingLeft - 40;
    const relX = x - paddingLeft;

    if (relX < 0 || relX > chartW) {
      tooltipRef.current.style.display = "none";
      return;
    }

    const idx = Math.floor((relX / chartW) * data.length);
    const target = data[idx];
    if (target) {
      const el = tooltipRef.current;
      el.style.display = "block";
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY - 40}px`;
      el.innerText = `${target.label}: ${target.value}`;
    }
  };

  return (
    <div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { if(tooltipRef.current) tooltipRef.current.style.display="none"; }}
      style={{ width: "100%", height: "400px", position: "relative", backgroundColor: "white", overflow: "hidden" }}
    >
      <SkeletonChart />
      {svgHtml && <ChartContent svgHtml={svgHtml} />}
      <div 
        ref={tooltipRef} 
        style={{ 
          display: "none", position: "fixed", transform: "translateX(-50%)", 
          background: "rgba(0,0,0,0.8)", color: "white", padding: "6px 12px", 
          borderRadius: "4px", pointerEvents: "none", fontSize: "14px", zIndex: 1000,
          whiteSpace: "nowrap"
        }} 
      />
    </div>
  );
};

export default BarChart;