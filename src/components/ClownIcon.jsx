import React from 'react';

const ClownIcon = ({ size = 24, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Clown Hat */}
    <path d="M5 6 L12 1 L19 6 Z" />
    <circle cx="12" cy="1" r="1.2" fill="currentColor" />

    {/* Eyes (Crosses) */}
    <path d="M8 9 L10 11 M10 9 L8 11" />
    <path d="M14 9 L16 11 M16 9 L14 11" />

    {/* Clown Nose */}
    <circle cx="12" cy="13" r="2.2" fill="currentColor" />

    {/* Smile */}
    <path d="M7 16 C 9 19, 15 19, 17 16" />

    {/* Face Outline */}
    <path d="M3 10 C 3 17, 21 17, 21 10" />
  </svg>
);

export default ClownIcon;
