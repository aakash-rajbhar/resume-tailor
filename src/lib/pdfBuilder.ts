import { jsPDF } from "jspdf";
import type { TailoredResume } from "./types";

interface PDFOptions {
  singlePage?: boolean;
}

export function generateResumePdf(resume: TailoredResume, options: PDFOptions = { singlePage: true }): jsPDF {
  // Standard US Letter: 215.9mm x 279.4mm (8.5" x 11")
  const doc = new jsPDF({
    unit: "mm",
    format: "letter",
    orientation: "portrait",
  });

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const marginX = 14;
  const marginTop = options.singlePage ? 12 : 14;
  const marginBottom = options.singlePage ? 12 : 14;
  const contentWidth = pageWidth - marginX * 2;
  const maxY = pageHeight - marginBottom;

  let y = marginTop;

  // Font setup
  const fontName = "helvetica";

  // Section Heading helper
  function drawSectionHeading(title: string) {
    if (y > maxY - 12 && !options.singlePage) {
      doc.addPage();
      y = marginTop;
    }
    y += options.singlePage ? 3.5 : 4.5;
    doc.setFont(fontName, "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(title.toUpperCase(), marginX, y);
    y += 1.5;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(marginX, y, marginX + contentWidth, y);
    y += options.singlePage ? 3 : 4;
  }

  // --- 1. CANDIDATE HEADER ---
  doc.setFont(fontName, "bold");
  doc.setFontSize(options.singlePage ? 18 : 20);
  doc.setTextColor(15, 15, 15);
  doc.text(resume.name || "Resume", pageWidth / 2, y, { align: "center" });
  y += options.singlePage ? 5 : 6;

  // Contact line
  if (resume.contact) {
    doc.setFont(fontName, "normal");
    doc.setFontSize(options.singlePage ? 8.5 : 9);
    doc.setTextColor(70, 70, 70);
    doc.text(resume.contact, pageWidth / 2, y, { align: "center" });
    y += options.singlePage ? 4 : 5;
  }

  // Target headline
  if (resume.title) {
    doc.setFont(fontName, "bold");
    doc.setFontSize(options.singlePage ? 9.5 : 10);
    doc.setTextColor(40, 40, 40);
    doc.text(resume.title, pageWidth / 2, y, { align: "center" });
    y += options.singlePage ? 3.5 : 5;
  }

  // --- 2. PROFESSIONAL SUMMARY ---
  if (resume.summary) {
    drawSectionHeading("Professional Summary");
    doc.setFont(fontName, "normal");
    doc.setFontSize(options.singlePage ? 8.5 : 9);
    doc.setTextColor(40, 40, 40);
    const summaryLines = doc.splitTextToSize(resume.summary, contentWidth);
    for (const line of summaryLines) {
      if (y > maxY && !options.singlePage) {
        doc.addPage();
        y = marginTop;
      }
      doc.text(line, marginX, y);
      y += options.singlePage ? 3.5 : 4.2;
    }
  }

  // --- 3. TECHNICAL SKILLS ---
  if (resume.skills && resume.skills.length > 0) {
    drawSectionHeading("Technical Skills");
    doc.setFontSize(options.singlePage ? 8.5 : 9);
    for (const skill of resume.skills) {
      if (y > maxY && !options.singlePage) {
        doc.addPage();
        y = marginTop;
      }
      doc.setFont(fontName, "bold");
      doc.setTextColor(30, 30, 30);
      const labelText = `${skill.label}: `;
      doc.text(labelText, marginX, y);
      const labelWidth = doc.getTextWidth(labelText);

      doc.setFont(fontName, "normal");
      doc.setTextColor(50, 50, 50);
      const valLines = doc.splitTextToSize(skill.value, contentWidth - labelWidth);
      if (valLines.length > 0) {
        doc.text(valLines[0], marginX + labelWidth, y);
        y += options.singlePage ? 3.5 : 4.2;
        for (let i = 1; i < valLines.length; i++) {
          doc.text(valLines[i], marginX + labelWidth, y);
          y += options.singlePage ? 3.5 : 4.2;
        }
      } else {
        y += options.singlePage ? 3.5 : 4.2;
      }
    }
  }

  // --- 4. PROFESSIONAL EXPERIENCE ---
  if (resume.experience && resume.experience.length > 0) {
    drawSectionHeading("Professional Experience");

    for (const exp of resume.experience) {
      if (y > maxY - 15 && !options.singlePage) {
        doc.addPage();
        y = marginTop;
      }

      // Title & Company
      doc.setFont(fontName, "bold");
      doc.setFontSize(options.singlePage ? 9 : 9.5);
      doc.setTextColor(20, 20, 20);
      const titleCompany = `${exp.title} — ${exp.company}`;
      doc.text(titleCompany, marginX, y);

      // Dates (right-aligned)
      if (exp.dates) {
        doc.setFont(fontName, "italic");
        doc.setFontSize(options.singlePage ? 8 : 8.5);
        doc.setTextColor(80, 80, 80);
        doc.text(exp.dates, marginX + contentWidth, y, { align: "right" });
      }
      y += options.singlePage ? 3.2 : 3.8;

      // Location
      if (exp.location) {
        doc.setFont(fontName, "italic");
        doc.setFontSize(options.singlePage ? 8 : 8.5);
        doc.setTextColor(90, 90, 90);
        doc.text(exp.location, marginX, y);
        y += options.singlePage ? 3.2 : 3.8;
      }

      // Bullets
      doc.setFont(fontName, "normal");
      doc.setFontSize(options.singlePage ? 8.2 : 8.8);
      doc.setTextColor(40, 40, 40);

      const bullets = options.singlePage ? exp.bullets.slice(0, 4) : exp.bullets;
      for (const b of bullets) {
        if (y > maxY && !options.singlePage) {
          doc.addPage();
          y = marginTop;
        }
        // Bullet circle / symbol
        doc.text("•", marginX + 1.5, y);
        const bulletLines = doc.splitTextToSize(b, contentWidth - 6);
        for (let j = 0; j < bulletLines.length; j++) {
          doc.text(bulletLines[j], marginX + 5.5, y);
          y += options.singlePage ? 3.4 : 4;
        }
      }
      y += options.singlePage ? 1 : 2;
    }
  }

  // --- 5. PROJECTS ---
  if (resume.projects && resume.projects.length > 0) {
    drawSectionHeading("Projects");
    for (const p of resume.projects) {
      if (y > maxY - 12 && !options.singlePage) {
        doc.addPage();
        y = marginTop;
      }
      doc.setFont(fontName, "bold");
      doc.setFontSize(options.singlePage ? 8.8 : 9.5);
      doc.setTextColor(20, 20, 20);
      doc.text(p.name, marginX, y);
      const nameWidth = doc.getTextWidth(p.name);

      if (p.tools) {
        doc.setFont(fontName, "italic");
        doc.setFontSize(options.singlePage ? 8 : 8.5);
        doc.setTextColor(90, 90, 90);
        doc.text(`  |  ${p.tools}`, marginX + nameWidth, y);
      }
      y += options.singlePage ? 3.2 : 3.8;

      doc.setFont(fontName, "normal");
      doc.setFontSize(options.singlePage ? 8.2 : 8.8);
      doc.setTextColor(40, 40, 40);
      const pBullets = options.singlePage ? p.bullets.slice(0, 2) : p.bullets;
      for (const b of pBullets) {
        if (y > maxY && !options.singlePage) {
          doc.addPage();
          y = marginTop;
        }
        doc.text("•", marginX + 1.5, y);
        const bulletLines = doc.splitTextToSize(b, contentWidth - 6);
        for (let j = 0; j < bulletLines.length; j++) {
          doc.text(bulletLines[j], marginX + 5.5, y);
          y += options.singlePage ? 3.4 : 4;
        }
      }
      y += options.singlePage ? 1 : 2;
    }
  }

  // --- 6. EDUCATION ---
  if (resume.education && resume.education.length > 0) {
    drawSectionHeading("Education");
    for (const ed of resume.education) {
      if (y > maxY - 10 && !options.singlePage) {
        doc.addPage();
        y = marginTop;
      }
      doc.setFont(fontName, "bold");
      doc.setFontSize(options.singlePage ? 8.8 : 9.5);
      doc.setTextColor(20, 20, 20);
      doc.text(ed.school, marginX, y);

      if (ed.dates) {
        doc.setFont(fontName, "italic");
        doc.setFontSize(options.singlePage ? 8 : 8.5);
        doc.setTextColor(80, 80, 80);
        doc.text(ed.dates, marginX + contentWidth, y, { align: "right" });
      }
      y += options.singlePage ? 3.2 : 3.8;

      doc.setFont(fontName, "normal");
      doc.setFontSize(options.singlePage ? 8.2 : 8.8);
      doc.setTextColor(50, 50, 50);
      doc.text(ed.degree, marginX, y);
      y += options.singlePage ? 3.5 : 4.2;
    }
  }

  // --- 7. CERTIFICATIONS ---
  if (resume.certifications && resume.certifications.length > 0) {
    drawSectionHeading("Certifications");
    doc.setFont(fontName, "normal");
    doc.setFontSize(options.singlePage ? 8.2 : 8.8);
    doc.setTextColor(40, 40, 40);
    const certText = resume.certifications.join("   |   ");
    const certLines = doc.splitTextToSize(certText, contentWidth);
    for (const line of certLines) {
      doc.text(line, marginX, y);
      y += options.singlePage ? 3.4 : 4;
    }
  }

  return doc;
}
