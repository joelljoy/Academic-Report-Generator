import fs from "fs";
import path from "path";
import pdf from "pdf-poppler";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===================== PDF TO IMAGE CONVERSION ===================== */
export const convertPDFToImages = async (pdfPath) => {
  try {
    const outputDir = path.join(path.dirname(pdfPath), 'temp_images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const opts = {
      format: 'jpeg',
      out_dir: outputDir,
      out_prefix: path.basename(pdfPath, '.pdf'),
      page: null,
      scale: 1024
    };
    await pdf.convert(pdfPath, opts);
    const files = fs.readdirSync(outputDir);
    const imageFiles = files
      .filter(f => f.startsWith(opts.out_prefix))
      .sort()
      .map(f => path.join(outputDir, f));

    const trimmedImages = [];
    for (const imgPath of imageFiles) {
      try {
        const trimmedBuffer = await sharp(imgPath)
          .rotate()
          .trim({ threshold: 10 })
          .toBuffer();
        await sharp(trimmedBuffer).toFile(imgPath);
        trimmedImages.push(imgPath);
      } catch (trimErr) {
        trimmedImages.push(imgPath);
      }
    }
    return trimmedImages;
  } catch (err) {
    return [];
  }
};

/* ===================== DATE FORMATTING ===================== */
export const formatReportDate = (startDateStr, endDateStr) => {
  if (!startDateStr) return "N/A";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const getOrdinal = (d) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  };
  const formatDate = (dateStr) => {
    const dateObj = new Date(dateStr);
    const day = dateObj.getDate();
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day}${getOrdinal(day)} ${month} ${year}`;
  };
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (!endDateStr || start.toDateString() === end.toDateString()) {
    return formatDate(startDateStr);
  } else {
    return `${formatDate(startDateStr)} to ${formatDate(endDateStr)}`;
  }
};

/* ===================== PAGE HEADER ===================== */
export const addPageHeader = (doc, isFirstPage = false, report = null) => {
  const logoPath = path.join(__dirname, "../../assets/logo.jpeg");
  const leftMargin = doc.page.margins.left;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startY = doc.y;
  const logoSize = 50;

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, leftMargin, startY, { width: logoSize, height: logoSize });
  }

  const textStartX = leftMargin + logoSize + 10;
  const textWidth = pageWidth - logoSize - 10;

  doc.font("Helvetica").fontSize(9).text("Agnel Charities'", textStartX, startY, { width: textWidth, align: "center" });
  doc.font("Helvetica-Bold").fontSize(11).text("Fr. C. Rodrigues Institute of Technology, Vashi", textStartX, doc.y, { width: textWidth, align: "center" });
  doc.font("Helvetica").fontSize(8).text("(An Autonomous Institute & Permanently Affiliated to University of Mumbai)", textStartX, doc.y, { width: textWidth, align: "center" });

  doc.y = startY + logoSize + 10;

  if (isFirstPage && report) {
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(12)
      .text(`Report on ${report.report_type || "Activity/Event"}`, leftMargin, doc.y, { 
        width: pageWidth, 
        align: "center" 
      });
    doc.moveDown(1);
  }
};

/* ===================== SECTION INLINE ===================== */
export const addSectionInline = (doc, label, content, numbered = false, number = null, report = null) => {
  if (doc.y > doc.page.height - doc.page.margins.bottom - 60) {
    doc.addPage();
    addPageHeader(doc, false, report);
  }
  const leftMargin = doc.page.margins.left;
  const colonX = 250; 
  const contentX = 265; 
  const prefix = numbered && number ? `${number}. ` : "";
  const labelText = `${prefix}${label}`;
  const currentY = doc.y;
  doc.fontSize(10).font("Helvetica-Bold").text(labelText, leftMargin, currentY, { width: colonX - leftMargin - 5 });
  doc.text(" : ", colonX, currentY);
  doc.font("Helvetica").fontSize(9).text(content || "N/A", contentX, currentY, {
    width: doc.page.width - doc.page.margins.right - contentX,
    align: 'left'
  });
  doc.moveDown(0.8);
};

/* ===================== SECTION MULTILINE ===================== */
export const addSectionMultiLine = (doc, label, content, indent = 0, report = null, useBullets = false) => {
  if (doc.y > doc.page.height - doc.page.margins.bottom - 100) {
    doc.addPage();
    addPageHeader(doc, false, report);
  }
  const currentX = doc.page.margins.left + indent;
  doc.fontSize(10).font("Helvetica-Bold").text(`${label} :`, currentX, doc.y);
  doc.moveDown(0.2);
  
  if (!content || content.trim() === "" || content === "N/A") {
    doc.fontSize(9).font("Helvetica").text("N/A", currentX + 15, doc.y);
    doc.moveDown(0.6);
    return;
  }

  if (useBullets) {
    const sentences = content
      .split('.')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    sentences.forEach((sentence, index) => {
      doc.fontSize(9).font("Helvetica")
         .text(`• ${sentence}`, currentX + 15, doc.y, {
           width: doc.page.width - doc.page.margins.right - (currentX + 15),
           align: 'left'
         });
      
      if (index < sentences.length - 1) {
        doc.moveDown(0.3);
      }
    });
  } else {
    const lines = content.split('\n');
    lines.forEach(line => {
      doc.fontSize(9).font("Helvetica").text(line, currentX + 15, doc.y, {
        width: doc.page.width - doc.page.margins.right - (currentX + 15),
        align: 'left'
      });
    });
  }
  
  doc.moveDown(0.6);
};

/* ===================== ADD IMAGE FROM FILE ===================== */
export const addImageFromFile = async (doc, filePath, caption, report = null) => {
  try {
    if (!fs.existsSync(filePath)) return;
    let imagesToProcess = [];
    if (path.extname(filePath).toLowerCase() === '.pdf') {
      imagesToProcess = await convertPDFToImages(filePath);
    } else {
      imagesToProcess = [filePath];
    }
    if (!imagesToProcess || imagesToProcess.length === 0) return;
    for (const imgPath of imagesToProcess) {
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const imgData = doc.openImage(imgPath);
      const scale = Math.min(pageWidth * 0.95 / imgData.width, 400 / imgData.height);
      const scaledWidth = imgData.width * scale;
      const scaledHeight = imgData.height * scale;
      if (doc.y + scaledHeight + 40 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        addPageHeader(doc, false, report);
      }
      const imageX = doc.page.margins.left + (pageWidth - scaledWidth) / 2;
      doc.image(imgPath, imageX, doc.y, { width: scaledWidth, height: scaledHeight });
      doc.y += scaledHeight + 3;
      if (caption) {
        doc.fontSize(8).font("Helvetica").text(caption, imageX, doc.y, { width: scaledWidth, align: "center" });
        doc.moveDown(0.4);
      }
    }
    if (path.extname(filePath).toLowerCase() === '.pdf') {
      imagesToProcess.forEach(img => fs.unlinkSync(img));
    }
  } catch (err) { 
    console.error("Image Processing Error:", err.message); 
  }
};

/* ===================== GROUP FILES BY CATEGORY ===================== */
export const groupFilesByCategory = (rows) => {
  const grouped = {};
  rows.forEach(row => {
    if (row.file_path && row.file_category) {
      if (!grouped[row.file_category]) grouped[row.file_category] = [];
      grouped[row.file_category].push({ path: row.file_path, caption: row.caption });
    }
  });
  return grouped;
};

/* ===================== SIGNATURE SECTION ===================== */
export const addSignatureSection = (doc, report) => {
  const sigHeight = 150;
  if (doc.y > doc.page.height - doc.page.margins.bottom - sigHeight) {
    doc.addPage();
    addPageHeader(doc, false, report);
  }
  const sigY = doc.page.height - 120;
  doc.fontSize(10).font("Helvetica");
  doc.text("__________________________", doc.page.margins.left, sigY);
  doc.text("Staff Coordinator", doc.page.margins.left, sigY + 15, { width: 180, align: "center" });
  const rightSigX = doc.page.width - doc.page.margins.right - 180;
  doc.text("__________________________", rightSigX, sigY);
  doc.text("Head of the Department", rightSigX, sigY + 15, { width: 180, align: "center" });
};