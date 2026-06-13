import fs from "fs";
import path from "path";
import pdf from "pdf-poppler";
import sharp from "sharp";
import { Paragraph, ImageRun, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Header } from "docx";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= PDF → IMAGE ================= */
export const convertPDFToImages = async (pdfPath) => {
  try {
    const outputDir = path.join(path.dirname(pdfPath), "temp_images");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const prefix = path.basename(pdfPath, ".pdf");

    const opts = {
      format: "jpeg",
      out_dir: outputDir,
      out_prefix: prefix,
      page: null,
      scale: 1024
    };

    console.log(`Converting PDF to images: ${pdfPath}`);
    await pdf.convert(pdfPath, opts);

    const files = fs.readdirSync(outputDir)
      .filter(f => f.startsWith(prefix))
      .sort()
      .map(f => path.join(outputDir, f));

    console.log(`Converted ${files.length} pages from PDF`);

    const finalImages = [];

    for (const imgPath of files) {
      try {
        const buffer = await sharp(imgPath)
          .rotate()
          .trim({ threshold: 10 })
          .toBuffer();
        await sharp(buffer).toFile(imgPath);
      } catch (err) {
        console.warn(`Sharp processing failed for ${imgPath}:`, err.message);
      }
      finalImages.push(imgPath);
    }

    return finalImages;
  } catch (err) {
    console.error("PDF convert error:", err.message);
    console.error("Full error:", err);
    return [];
  }
};

/* ================= IMAGE CHECK ================= */
export const isImageFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext);
};

/* ================= CREATE WORD HEADER FOR ALL PAGES ================= */
export const createWordHeaderForAllPages = () => {
  const logoPath = path.join(__dirname, "../../assets/logo.jpeg");

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          // Logo cell
          new TableCell({
            children: [
              new Paragraph({
                children: fs.existsSync(logoPath) ? [
                  new ImageRun({
                    data: fs.readFileSync(logoPath),
                    transformation: { width: 60, height: 60 }
                  })
                ] : [new TextRun({ text: "" })],
                alignment: AlignmentType.CENTER
              })
            ],
            width: { size: 15, type: WidthType.PERCENTAGE },
            verticalAlign: "center",
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE }
            }
          }),
          // Text cell
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Agnel Charities'", size: 18 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 50 }
              }),
              new Paragraph({
                children: [new TextRun({ text: "Fr. C. Rodrigues Institute of Technology, Vashi", bold: true, size: 22 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 50 }
              }),
              new Paragraph({
                children: [new TextRun({ text: "(An Autonomous Institute & Permanently Affiliated to University of Mumbai)", size: 16 })],
                alignment: AlignmentType.CENTER
              })
            ],
            width: { size: 85, type: WidthType.PERCENTAGE },
            verticalAlign: "center",
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE }
            }
          })
        ]
      })
    ]
  });

  return {
    default: new Header({
      children: [headerTable]
    })
  };
};

/* ================= FILE SECTION (WORD) ================= */
export const createWordFileSection = async (category, files, indent = false) => {
  const sections = [];

  // Category heading with optional indentation
  sections.push(new Paragraph({
    children: [new TextRun({ text: `${category}:`, bold: true, size: 20 })],
    spacing: { after: 100 },
    keepNext: true,
    indent: indent ? { left: 720 } : undefined,
    alignment: AlignmentType.JUSTIFIED
  }));

  if (!files || files.length === 0) {
    sections.push(new Paragraph({ 
      children: [new TextRun({ text: "N/A", size: 20 })],
      spacing: { after: 150 },
      indent: indent ? { left: 720 } : undefined,
      alignment: AlignmentType.JUSTIFIED
    }));
    return sections;
  }

  for (const file of files) {
    let images = [];
    let shouldCleanup = false;

    if (isImageFile(file.path)) {
      if (fs.existsSync(file.path)) {
        images = [file.path];
        console.log(`Using image file: ${file.path}`);
      } else {
        console.error(`Image file not found: ${file.path}`);
      }
    } else if (path.extname(file.path).toLowerCase() === ".pdf") {
      console.log(`Converting PDF: ${file.path}`);
      images = await convertPDFToImages(file.path);
      shouldCleanup = true;
    }

    if (images.length === 0) {
      sections.push(new Paragraph({
        children: [
          new TextRun({ 
            text: `📄 ${file.caption || "Document"} (stored as PDF)`, 
            italics: true,
            size: 18 
          })
        ],
        spacing: { after: 100 },
        indent: indent ? { left: 720 } : undefined,
        alignment: AlignmentType.JUSTIFIED
      }));
      continue;
    }

    // Embed all images
    for (const imgPath of images) {
      if (!fs.existsSync(imgPath)) {
        console.warn(`Image not found: ${imgPath}`);
        continue;
      }

      try {
        const buffer = fs.readFileSync(imgPath);

        sections.push(new Paragraph({
          children: [
            new ImageRun({
              data: buffer,
              transformation: { width: 500, height: 350 }
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          indent: indent ? { left: 720 } : undefined
        }));

        console.log(`Embedded image: ${imgPath}`);
      } catch (err) {
        console.error(`Error reading image ${imgPath}:`, err.message);
      }
    }

    // Add caption after all images
    if (file.caption) {
      sections.push(new Paragraph({
        children: [new TextRun({ text: file.caption, italics: true, size: 18 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        indent: indent ? { left: 720 } : undefined
      }));
    }

    // Cleanup temp images
    if (shouldCleanup) {
      images.forEach(img => {
        try {
          if (fs.existsSync(img)) {
            fs.unlinkSync(img);
            console.log(`Cleaned up temp image: ${img}`);
          }
        } catch (err) {
          console.warn(`Cleanup failed for ${img}:`, err.message);
        }
      });

      try {
        const tempDir = path.join(path.dirname(file.path), "temp_images");
        if (fs.existsSync(tempDir)) {
          const remaining = fs.readdirSync(tempDir);
          if (remaining.length === 0) {
            fs.rmdirSync(tempDir);
            console.log(`Removed empty temp directory: ${tempDir}`);
          }
        }
      } catch (err) {
        console.warn(`Temp dir cleanup failed:`, err.message);
      }
    }
  }

  return sections;
};

/* ================= OTHER HELPER FUNCTIONS ================= */

export const formatReportDate = (startDate, endDate) => {
  if (!startDate) return "N/A";
  
  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  if (!endDate || startDate === endDate) {
    return formatDate(startDate);
  }
  
  return `${formatDate(startDate)} to ${formatDate(endDate)}`;
};

export const groupFilesByCategory = (rows) => {
  const groups = {};
  rows.forEach(row => {
    if (row.file_category) {
      if (!groups[row.file_category]) {
        groups[row.file_category] = [];
      }
      groups[row.file_category].push({
        path: row.file_path,
        caption: row.caption
      });
    }
  });
  return groups;
};

// ✅ ADDED JUSTIFIED ALIGNMENT
export const createFieldRow = (label, value) => {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22 }),
      new TextRun({ text: value || "N/A", size: 22 })
    ],
    spacing: { after: 150 },
    alignment: AlignmentType.JUSTIFIED
  });
};

export const createBoldSection = (text) => {
  return new Paragraph({
    children: [
      new TextRun({ text: text, bold: true, size: 22 })
    ],
    spacing: { before: 300, after: 200 },
    alignment: AlignmentType.JUSTIFIED
  });
};

// ✅ ADDED JUSTIFIED ALIGNMENT
export const createSubSection = (label, content, indent = false) => {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20 }),
      new TextRun({ text: content || "N/A", size: 20 })
    ],
    spacing: { after: 150 },
    indent: indent ? { left: 720 } : undefined,
    alignment: AlignmentType.JUSTIFIED
  });
};

// ✅ ADDED JUSTIFIED ALIGNMENT TO CONTENT PARAGRAPHS
export const createSubSectionMultiLine = (label, content, indent = false) => {
  const sections = [];
  
  // Label on its own line
  sections.push(new Paragraph({
    children: [
      new TextRun({ text: `${label}:`, bold: true, size: 20 })
    ],
    spacing: { after: 100 },
    indent: indent ? { left: 720 } : undefined,
    alignment: AlignmentType.JUSTIFIED
  }));

  // Content with bullets on next line
  if (!content || content.trim() === "" || content === "N/A") {
    sections.push(new Paragraph({ 
      children: [new TextRun({ text: "N/A", size: 20 })],
      spacing: { after: 150 },
      indent: indent ? { left: 720 + 360 } : { left: 360 },
      alignment: AlignmentType.JUSTIFIED
    }));
  } else {
    // Split content into sentences for bullet points
    const sentences = content
      .split('.')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    sentences.forEach((sentence, index) => {
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: `• ${sentence}.`, size: 20 })
        ],
        spacing: { after: index === sentences.length - 1 ? 150 : 80 },
        indent: indent ? { left: 720 + 360 } : { left: 360 },
        alignment: AlignmentType.JUSTIFIED
      }));
    });
  }

  return sections;
};

// ✅ ADDED JUSTIFIED ALIGNMENT
export const createSubSectionMultiLineNoBullets = (label, content, indent = false) => {
  const sections = [];
  
  // Label on its own line
  sections.push(new Paragraph({
    children: [
      new TextRun({ text: `${label}:`, bold: true, size: 20 })
    ],
    spacing: { after: 100 },
    indent: indent ? { left: 720 } : undefined,
    alignment: AlignmentType.JUSTIFIED
  }));

  // Content as plain paragraph (no bullets) on next line
  if (!content || content.trim() === "" || content === "N/A") {
    sections.push(new Paragraph({ 
      children: [new TextRun({ text: "N/A", size: 20 })],
      spacing: { after: 150 },
      indent: indent ? { left: 720 + 360 } : { left: 360 },
      alignment: AlignmentType.JUSTIFIED
    }));
  } else {
    sections.push(new Paragraph({
      children: [
        new TextRun({ text: content, size: 20 })
      ],
      spacing: { after: 150 },
      indent: indent ? { left: 720 + 360 } : { left: 360 },
      alignment: AlignmentType.JUSTIFIED
    }));
  }

  return sections;
};
