export function SomalilandFlag({ width = 22 }: { width?: number }) {
  const height = width * (2 / 3);
  return (
    <svg width={width} height={height} viewBox="0 0 30 20" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.67" fill="#00953b" />
      <rect y="13.33" width="30" height="6.67" fill="#ce1126" />
      <polygon
        points="15,6.2 16.18,9.82 20,9.82 16.91,12.06 18.09,15.68 15,13.44 11.91,15.68 13.09,12.06 10,9.82 13.82,9.82"
        fill="#1a1a1a"
      />
    </svg>
  );
}
