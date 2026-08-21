"use client";

import React, { useMemo, useEffect, useState } from "react";

function hexToRgba(hex: string, opacity: number) {
  let h = hex;
  if (hex.length === 4) {
    h = '#' + hex[1]+hex[1] + hex[2]+hex[2] + hex[3]+hex[3];
  }
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function hexToRgbaZero(hex: string) {
  let h = hex;
  if (hex.length === 4) {
    h = '#' + hex[1]+hex[1] + hex[2]+hex[2] + hex[3]+hex[3];
  }
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0)`;
}

interface BlobProps {
  color: string;
  size: number | string;
  top?: string | number;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
  opacity: number;
  animation?: string;
  className?: string;
}

const FastBlob = React.memo(function FastBlob({ color, size, top, left, right, bottom, opacity, animation, className = "" }: BlobProps) {
  const bg = `radial-gradient(circle at center, ${hexToRgba(color, opacity)} 0%, ${hexToRgba(color, opacity * 0.4)} 50%, ${hexToRgbaZero(color)} 100%)`;
  
  return (
    <div 
       className={`absolute pointer-events-none rounded-full ${className}`}
       style={{
         width: size, height: size, top, left, right, bottom,
         background: bg,
         animation: animation,
         willChange: animation ? 'transform' : 'auto'
       }}
    />
  );
});

export function VibrantBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#fafafa] dark:bg-[#0a0e1a]" />
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#fafafa] dark:bg-[#0a0e1a]">
      {/* ============ DARK MODE BLOBS ============ */}
      <div className="absolute inset-0 hidden dark:block opacity-100" style={{ filter: 'blur(40px)' }}>
        
        {/* Core Mobile-Friendly Blobs (Visible on all sizes, highly performant) */}
        <FastBlob color="#FF2D78" size="400px" top="-10%" left="-10%" opacity={0.3} />
        <FastBlob color="#9b5de5" size="250px" top="5%" left="15%" opacity={0.25} animation="bubbleFloat1 22s ease-in-out infinite" />
        
        <FastBlob color="#4361ee" size="300px" top="-5%" right="-10%" opacity={0.25} />
        <FastBlob color="#06d6a0" size="200px" top="10%" right="15%" opacity={0.2} animation="bubbleFloat2 20s ease-in-out 2s infinite" />

        <FastBlob color="#ff6b35" size="350px" top="40%" left="30%" opacity={0.25} animation="bubbleFloat2 24s ease-in-out infinite" />
        <FastBlob color="#FF2D78" size="280px" top="45%" right="30%" opacity={0.2} animation="bubbleFloat3 30s ease-in-out 3s infinite" />
        <FastBlob color="#f15bb5" size="220px" top="50%" left="10%" opacity={0.2} animation="bubbleFloat1 28s ease-in-out 6s infinite" />

        <FastBlob color="#06d6a0" size="350px" bottom="-10%" left="-10%" opacity={0.25} />
        <FastBlob color="#4361ee" size="400px" bottom="-15%" right="-10%" opacity={0.25} />
        <FastBlob color="#9b5de5" size="200px" bottom="5%" right="15%" opacity={0.2} animation="bubbleFloat3 25s ease-in-out 2s infinite" />
        <FastBlob color="#FFD166" size="180px" bottom="10%" left="40%" opacity={0.15} animation="bubbleFloat2 23s ease-in-out 6s infinite" />


        {/* Desktop-Only Extra Blobs (For additional richness on larger screens) */}
        <div className="hidden md:block">
          <FastBlob color="#ff6b35" size="120px" top="8%" left="8%" opacity={0.2} />
          <FastBlob color="#FFD166" size="100px" top="3%" left="35%" opacity={0.15} />
          <FastBlob color="#FF2D78" size="130px" top="15%" right="5%" opacity={0.15} />
          <FastBlob color="#4361ee" size="100px" top="22%" left="12%" opacity={0.15} />
          <FastBlob color="#FFD166" size="140px" top="35%" left="28%" opacity={0.15} />
          <FastBlob color="#4cc9f0" size="150px" top="38%" left="52%" opacity={0.2} />
          <FastBlob color="#06d6a0" size="100px" top="42%" left="48%" opacity={0.15} />
          <FastBlob color="#9b5de5" size="180px" top="30%" right="8%" opacity={0.2} animation="bubbleFloat1 25s ease-in-out 5s infinite" />
          <FastBlob color="#ff6b35" size="110px" top="33%" right="15%" opacity={0.15} />
          <FastBlob color="#FFD166" size="100px" top="52%" left="14%" opacity={0.15} />
          <FastBlob color="#9b5de5" size="260px" top="52%" left="35%" opacity={0.2} animation="bubbleFloat3 23s ease-in-out 1s infinite" />
          <FastBlob color="#f15bb5" size="160px" top="58%" left="45%" opacity={0.15} />
          <FastBlob color="#4361ee" size="180px" top="55%" right="10%" opacity={0.2} animation="bubbleFloat1 29s ease-in-out 8s infinite" />
          <FastBlob color="#06d6a0" size="100px" top="53%" right="18%" opacity={0.15} />
          <FastBlob color="#4361ee" size="300px" top="70%" left="-5%" opacity={0.2} />
          <FastBlob color="#FF2D78" size="160px" top="75%" left="10%" opacity={0.15} animation="bubbleFloat3 21s ease-in-out 3s infinite" />
          <FastBlob color="#ff6b35" size="250px" top="72%" left="38%" opacity={0.2} animation="bubbleFloat2 26s ease-in-out 5s infinite" />
          <FastBlob color="#4cc9f0" size="150px" top="78%" left="50%" opacity={0.2} />
          <FastBlob color="#9b5de5" size="300px" top="68%" right="-5%" opacity={0.2} />
          <FastBlob color="#06d6a0" size="170px" top="75%" right="12%" opacity={0.2} animation="bubbleFloat1 24s ease-in-out 9s infinite" />
          <FastBlob color="#f15bb5" size="400px" bottom="-10%" left="-10%" opacity={0.25} />
          <FastBlob color="#ff6b35" size="180px" bottom="5%" left="10%" opacity={0.15} />
        </div>
      </div>

      {/* ============ LIGHT MODE BLOBS ============ */}
      <div className="absolute inset-0 dark:hidden opacity-100" style={{ filter: 'blur(40px)' }}>
        
        {/* Core Mobile-Friendly Blobs (Visible on all sizes, highly performant) */}
        <FastBlob color="#FF2D78" size="400px" top="-10%" left="-10%" opacity={0.12} />
        <FastBlob color="#9b5de5" size="250px" top="5%" left="15%" opacity={0.12} animation="bubbleFloat1 22s ease-in-out infinite" />
        
        <FastBlob color="#4361ee" size="300px" top="-5%" right="-10%" opacity={0.12} />
        <FastBlob color="#06d6a0" size="200px" top="10%" right="15%" opacity={0.1} animation="bubbleFloat2 20s ease-in-out 2s infinite" />

        <FastBlob color="#ff6b35" size="350px" top="40%" left="30%" opacity={0.12} animation="bubbleFloat2 24s ease-in-out infinite" />
        <FastBlob color="#FF2D78" size="280px" top="45%" right="30%" opacity={0.1} animation="bubbleFloat3 30s ease-in-out 3s infinite" />
        <FastBlob color="#f15bb5" size="220px" top="50%" left="10%" opacity={0.1} animation="bubbleFloat1 28s ease-in-out 6s infinite" />

        <FastBlob color="#06d6a0" size="350px" bottom="-10%" left="-10%" opacity={0.12} />
        <FastBlob color="#4361ee" size="400px" bottom="-15%" right="-10%" opacity={0.12} />
        <FastBlob color="#9b5de5" size="200px" bottom="5%" right="15%" opacity={0.1} animation="bubbleFloat3 25s ease-in-out 2s infinite" />
        <FastBlob color="#FFD166" size="180px" bottom="10%" left="40%" opacity={0.08} animation="bubbleFloat2 23s ease-in-out 6s infinite" />

        {/* Desktop-Only Extra Blobs (For additional richness on larger screens) */}
        <div className="hidden md:block">
          <FastBlob color="#ff6b35" size="120px" top="8%" left="8%" opacity={0.1} />
          <FastBlob color="#FFD166" size="100px" top="3%" left="35%" opacity={0.08} />
          <FastBlob color="#FF2D78" size="130px" top="15%" right="5%" opacity={0.08} />
          <FastBlob color="#4361ee" size="100px" top="22%" left="12%" opacity={0.08} />
          <FastBlob color="#FFD166" size="140px" top="35%" left="28%" opacity={0.08} />
          <FastBlob color="#4cc9f0" size="150px" top="38%" left="52%" opacity={0.1} />
          <FastBlob color="#06d6a0" size="100px" top="42%" left="48%" opacity={0.08} />
          <FastBlob color="#9b5de5" size="180px" top="30%" right="8%" opacity={0.1} animation="bubbleFloat1 25s ease-in-out 5s infinite" />
          <FastBlob color="#ff6b35" size="110px" top="33%" right="15%" opacity={0.08} />
          <FastBlob color="#FFD166" size="100px" top="52%" left="14%" opacity={0.08} />
          <FastBlob color="#9b5de5" size="260px" top="52%" left="35%" opacity={0.1} animation="bubbleFloat3 23s ease-in-out 1s infinite" />
          <FastBlob color="#f15bb5" size="160px" top="58%" left="45%" opacity={0.08} />
          <FastBlob color="#4361ee" size="180px" top="55%" right="10%" opacity={0.1} animation="bubbleFloat1 29s ease-in-out 8s infinite" />
          <FastBlob color="#06d6a0" size="100px" top="53%" right="18%" opacity={0.08} />
          <FastBlob color="#4361ee" size="300px" top="70%" left="-5%" opacity={0.1} />
          <FastBlob color="#FF2D78" size="160px" top="75%" left="10%" opacity={0.08} animation="bubbleFloat3 21s ease-in-out 3s infinite" />
          <FastBlob color="#ff6b35" size="250px" top="72%" left="38%" opacity={0.1} animation="bubbleFloat2 26s ease-in-out 5s infinite" />
          <FastBlob color="#4cc9f0" size="150px" top="78%" left="50%" opacity={0.1} />
          <FastBlob color="#9b5de5" size="300px" top="68%" right="-5%" opacity={0.1} />
          <FastBlob color="#06d6a0" size="170px" top="75%" right="12%" opacity={0.1} animation="bubbleFloat1 24s ease-in-out 9s infinite" />
          <FastBlob color="#f15bb5" size="400px" bottom="-10%" left="-10%" opacity={0.12} />
          <FastBlob color="#ff6b35" size="180px" bottom="5%" left="10%" opacity={0.08} />
        </div>
      </div>
    </div>
  );
}
