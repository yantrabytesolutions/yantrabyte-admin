import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import fs from 'fs';
import fetch from 'node-fetch'; // need this if not using built-in fetch in node v16, but wait node 20 has built-in fetch!

async function run() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  // Draw hardware_watermark.png
  try {
    const wmRes = await fetch('https://yantrabyte.anantatechcare.com/hardware_watermark.png');
    if (wmRes.ok) {
      const wmBytes = await wmRes.arrayBuffer();
      const wmImg   = await pdfDoc.embedPng(new Uint8Array(wmBytes));
      
      const scaleX = width / wmImg.width;
      const scaleY = height / wmImg.height;
      const scale  = Math.max(scaleX, scaleY);
      
      const newWidth  = wmImg.width * scale;
      const newHeight = wmImg.height * scale;
      
      page.drawImage(wmImg, {
        x: (width - newWidth) / 2,
        y: (height - newHeight) / 2,
        width: newWidth, 
        height: newHeight,
        opacity: 0.15,
      });
    } else {
      console.error('Failed to fetch watermark:', wmRes.status);
    }
  } catch (e) {
    console.error('Error fetching watermark:', e);
  }

  // Draw simple text to identify it
  page.drawText('Test Ticket PDF', { x: 50, y: height - 50, size: 20 });

  const pdfBytes = await pdfDoc.save();
  const artifactDir = 'C:/Users/sys1/.gemini/antigravity/brain/2ec9b191-314a-49ad-9b97-756f72e358d1/.tempmediaStorage';
  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(`${artifactDir}/test_watermark.pdf`, pdfBytes);
  console.log(`Saved to ${artifactDir}/test_watermark.pdf`);
}

run().catch(console.error);
