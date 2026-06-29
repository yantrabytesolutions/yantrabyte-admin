const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123">
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="80" font-weight="900" fill="rgba(11,83,148,0.06)" transform="rotate(-35, 397, 561)" text-anchor="middle" dominant-baseline="middle" letter-spacing="8">YANTRABYTE SOLUTIONS</text>
</svg>`;

const encoded = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
console.log(encoded);
