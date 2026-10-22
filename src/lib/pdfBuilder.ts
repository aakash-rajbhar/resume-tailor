import { jsPDF } from "jspdf";
import type { TailoredResume } from "./types";

export interface PDFOptions {
  singlePage?: boolean;
  paperSize?: "letter" | "a4";
}

interface LayoutConfig {
  name: string;
  marginTop: number;
  marginBottom: number;
  nameSize: number;
  contactSize: number;
  titleSize: number;
  headingSize: number;
  subHeadingSize: number;
  metaSize: number;
  bodySize: number;
  lineHeight: number;
  secPreGap: number;
  rulePostGap: number;
  itemGap: number;
  bulletGap: number;
  expBulletLimit: number;
  projBulletLimit: number;
}

// Preset tiers from most spacious (for light resumes) to ultra-compact (for heavy resumes)
const LAYOUT_PRESETS: LayoutConfig[] = [
  {
    name: "spacious-full",
    marginTop: 13,
    marginBottom: 12,
    nameSize: 20,
    contactSize: 9.0,
    titleSize: 10.0,
    headingSize: 11.0,
    subHeadingSize: 10.2,
    metaSize: 9.2,
    bodySize: 9.6,
    lineHeight: 4.0,
    secPreGap: 5.5,
    rulePostGap: 2.2,
    itemGap: 2.6,
    bulletGap: 0.6,
    expBulletLimit: 5,
    projBulletLimit: 4,
  },
  {
    name: "spacious",
    marginTop: 12,
    marginBottom: 11,
    nameSize: 19.5,
    contactSize: 8.8,
    titleSize: 9.8,
    headingSize: 10.8,
    subHeadingSize: 10.0,
    metaSize: 9.0,
    bodySize: 9.2,
    lineHeight: 3.8,
    secPreGap: 4.8,
    rulePostGap: 2.0,
    itemGap: 2.3,
    bulletGap: 0.45,
    expBulletLimit: 4,
    projBulletLimit: 3,
  },
  {
    name: "regular",
    marginTop: 11,
    marginBottom: 10,
    nameSize: 19.0,
    contactSize: 8.5,
    titleSize: 9.5,
    headingSize: 10.5,
    subHeadingSize: 9.8,
    metaSize: 8.8,
    bodySize: 8.9,
    lineHeight: 3.55,
    secPreGap: 4.0,
    rulePostGap: 1.8,
    itemGap: 1.9,
    bulletGap: 0.35,
    expBulletLimit: 4,
    projBulletLimit: 3,
  },
  {
    name: "compact-all-bullets",
    marginTop: 10.0,
    marginBottom: 9.0,
    nameSize: 18.0,
    contactSize: 8.2,
    titleSize: 9.0,
    headingSize: 10.2,
    subHeadingSize: 9.4,
    metaSize: 8.5,
    bodySize: 8.5,
    lineHeight: 3.3,
    secPreGap: 3.2,
    rulePostGap: 1.5,
    itemGap: 1.5,
    bulletGap: 0.2,
    expBulletLimit: 4,
    projBulletLimit: 3,
  },
  {
    name: "compact-budgeted",
    marginTop: 9.5,
    marginBottom: 8.5,
    nameSize: 17.5,
    contactSize: 8.0,
    titleSize: 8.8,
    headingSize: 10.0,
    subHeadingSize: 9.2,
    metaSize: 8.4,
    bodySize: 8.3,
    lineHeight: 3.2,
    secPreGap: 2.8,
    rulePostGap: 1.3,
    itemGap: 1.3,
    bulletGap: 0.15,
    expBulletLimit: 3,
    projBulletLimit: 2,
  },
  {
    name: "tight-budgeted",
    marginTop: 9.0,
    marginBottom: 8.0,
    nameSize: 17.0,
    contactSize: 7.8,
    titleSize: 8.5,
    headingSize: 9.6,
    subHeadingSize: 8.8,
    metaSize: 8.0,
    bodySize: 8.0,
    lineHeight: 3.0,
    secPreGap: 2.4,
    rulePostGap: 1.1,
    itemGap: 1.1,
    bulletGap: 0.1,
    expBulletLimit: 3,
    projBulletLimit: 2,
  },
  {
    name: "maximum-fit",
    marginTop: 8.5,
    marginBottom: 7.5,
    nameSize: 16.5,
    contactSize: 7.5,
    titleSize: 8.2,
    headingSize: 9.2,
    subHeadingSize: 8.5,
    metaSize: 7.8,
    bodySize: 7.8,
    lineHeight: 2.85,
    secPreGap: 2.0,
    rulePostGap: 1.0,
    itemGap: 1.0,
    bulletGap: 0.1,
    expBulletLimit: 2,
    projBulletLimit: 2,
  },
];

/**
 * Renders or measures a resume layout onto a jsPDF instance.
 * Returns the final vertical position (including bottom margin) in millimeters.
 */
function renderResumeLayout(
  doc: jsPDF,
  resume: TailoredResume,
  cfg: LayoutConfig,
  pageWidth: number,
  pageHeight: number,
  marginX: number,
  isSinglePage: boolean,
  draw: boolean,
): number {
  const contentWidth = pageWidth - marginX * 2;
  const maxY = pageHeight - cfg.marginBottom;
  const font = "times";

  // Helper to convert font size in points to baseline offset (cap height approx 72%)
  const capHeight = (pt: number) => pt * 0.352778 * 0.72;

  let y = cfg.marginTop + capHeight(cfg.nameSize);

  function maybeNewPage(needed: number) {
    if (isSinglePage) return;
    if (y + needed > maxY) {
      if (draw) doc.addPage();
      y = cfg.marginTop + capHeight(cfg.subHeadingSize);
    }
  }

  function drawHeading(title: string) {
    maybeNewPage(14);
    // Move to heading baseline
    y += cfg.secPreGap + capHeight(cfg.headingSize);

    if (draw) {
      doc.setFont(font, "bold");
      doc.setFontSize(cfg.headingSize);
      doc.setTextColor(15, 15, 15);
      doc.text(title.toUpperCase(), marginX, y);

      // Clean, elegant hairline rule (0.18mm) 1.0mm below heading baseline
      const ruleY = y + 1.0;
      doc.setDrawColor(40, 40, 40);
      doc.setLineWidth(0.18);
      doc.line(marginX, ruleY, marginX + contentWidth, ruleY);
    }

    // Advance past rule and post-rule gap to baseline of first line inside section
    y = y + 1.0 + cfg.rulePostGap + capHeight(cfg.bodySize);
  }

  // 1. Header Name (Centered)
  if (draw) {
    doc.setFont(font, "bold");
    doc.setFontSize(cfg.nameSize);
    doc.setTextColor(0, 0, 0);
    doc.text(resume.name || "Resume", pageWidth / 2, y, { align: "center" });
  }

  // Contact line (Centered)
  if (resume.contact) {
    doc.setFont(font, "normal");
    doc.setFontSize(cfg.contactSize);
    if (draw) doc.setTextColor(50, 50, 50);

    const contactLines = doc.splitTextToSize(resume.contact, contentWidth);
    for (const cl of contactLines) {
      y += cfg.contactSize * 0.352778 * 1.35;
      if (draw) doc.text(cl, pageWidth / 2, y, { align: "center" });
    }
  }

  // Title / Headline (Italic, Centered)
  if (resume.title) {
    y += cfg.titleSize * 0.352778 * 1.25;
    if (draw) {
      doc.setFont(font, "italic");
      doc.setFontSize(cfg.titleSize);
      doc.setTextColor(40, 40, 40);
      doc.text(resume.title, pageWidth / 2, y, { align: "center" });
    }
  }

  // 2. Summary
  if (resume.summary) {
    drawHeading("Summary");
    doc.setFont(font, "normal");
    doc.setFontSize(cfg.bodySize);
    if (draw) doc.setTextColor(25, 25, 25);

    const summaryLines = doc.splitTextToSize(resume.summary, contentWidth);
    for (let i = 0; i < summaryLines.length; i++) {
      if (i > 0) y += cfg.lineHeight;
      maybeNewPage(cfg.lineHeight);
      if (draw) doc.text(summaryLines[i], marginX, y);
    }
  }

  // 3. Education
  if (resume.education && resume.education.length > 0) {
    drawHeading("Education");
    for (let i = 0; i < resume.education.length; i++) {
      const ed = resume.education[i];
      if (i > 0) y += cfg.itemGap + cfg.lineHeight;
      maybeNewPage(12);

      // School (bold) + Dates (right)
      if (draw) {
        doc.setFont(font, "bold");
        doc.setFontSize(cfg.subHeadingSize);
        doc.setTextColor(0, 0, 0);
        doc.text(ed.school, marginX, y);

        if (ed.dates) {
          doc.setFont(font, "normal");
          doc.setFontSize(cfg.metaSize);
          doc.setTextColor(60, 60, 60);
          doc.text(ed.dates, marginX + contentWidth, y, { align: "right" });
        }
      }

      // Degree (italic)
      if (ed.degree) {
        y += cfg.lineHeight;
        if (draw) {
          doc.setFont(font, "italic");
          doc.setFontSize(cfg.bodySize);
          doc.setTextColor(30, 30, 30);
          doc.text(ed.degree, marginX, y);
        }
      }
    }
  }

  // 4. Technical Skills
  if (resume.skills && resume.skills.length > 0) {
    drawHeading("Technical Skills");
    for (let i = 0; i < resume.skills.length; i++) {
      const skill = resume.skills[i];
      if (i > 0) y += cfg.lineHeight;
      maybeNewPage(cfg.lineHeight * 1.5);

      doc.setFont(font, "bold");
      doc.setFontSize(cfg.bodySize);
      const label = `${skill.label}: `;
      const lw = doc.getTextWidth(label);

      doc.setFont(font, "normal");
      const valLines = doc.splitTextToSize(skill.value, contentWidth - lw);

      if (draw) {
        doc.setFont(font, "bold");
        doc.setTextColor(10, 10, 10);
        doc.text(label, marginX, y);

        doc.setFont(font, "normal");
        doc.setTextColor(30, 30, 30);
        if (valLines.length > 0) {
          doc.text(valLines[0], marginX + lw, y);
        }
      }

      for (let j = 1; j < valLines.length; j++) {
        y += cfg.lineHeight;
        maybeNewPage(cfg.lineHeight);
        if (draw) doc.text(valLines[j], marginX + lw, y);
      }
    }
  }

  // 5. Professional Experience
  if (resume.experience && resume.experience.length > 0) {
    drawHeading("Experience");
    for (let i = 0; i < resume.experience.length; i++) {
      const exp = resume.experience[i];
      if (i > 0) y += cfg.itemGap + cfg.lineHeight;
      maybeNewPage(16);

      // Row 1: Title (bold) + Dates (right)
      if (draw) {
        doc.setFont(font, "bold");
        doc.setFontSize(cfg.subHeadingSize);
        doc.setTextColor(0, 0, 0);
        doc.text(exp.title, marginX, y);

        if (exp.dates) {
          doc.setFont(font, "normal");
          doc.setFontSize(cfg.metaSize);
          doc.setTextColor(60, 60, 60);
          doc.text(exp.dates, marginX + contentWidth, y, { align: "right" });
        }
      }

      // Row 2: Company (italic) + Location (right)
      y += cfg.lineHeight;
      if (draw) {
        doc.setFont(font, "italic");
        doc.setFontSize(cfg.metaSize);
        doc.setTextColor(40, 40, 40);
        doc.text(exp.company, marginX, y);

        if (exp.location) {
          doc.setFont(font, "normal");
          doc.setFontSize(cfg.metaSize);
          doc.setTextColor(70, 70, 70);
          doc.text(exp.location, marginX + contentWidth, y, { align: "right" });
        }
      }

      // Bullets
      const bullets = isSinglePage
        ? exp.bullets.slice(0, cfg.expBulletLimit)
        : exp.bullets;

      for (const b of bullets) {
        y += cfg.lineHeight + cfg.bulletGap;
        maybeNewPage(cfg.lineHeight);

        doc.setFont(font, "normal");
        doc.setFontSize(cfg.bodySize);
        const bulletLines = doc.splitTextToSize(b, contentWidth - 4.5);

        if (draw) {
          doc.setTextColor(30, 30, 30);
          // Clean bullet symbol
          doc.text("\u2022", marginX + 1.2, y);
          for (let j = 0; j < bulletLines.length; j++) {
            doc.text(bulletLines[j], marginX + 4.5, y);
            if (j < bulletLines.length - 1) {
              y += cfg.lineHeight;
              maybeNewPage(cfg.lineHeight);
            }
          }
        } else {
          y += (bulletLines.length - 1) * cfg.lineHeight;
        }
      }
    }
  }

  // 6. Projects
  if (resume.projects && resume.projects.length > 0) {
    drawHeading("Projects");
    for (let i = 0; i < resume.projects.length; i++) {
      const p = resume.projects[i];
      if (i > 0) y += cfg.itemGap + cfg.lineHeight;
      maybeNewPage(14);

      // Project Name (bold) + Tools (italic)
      if (draw) {
        doc.setFont(font, "bold");
        doc.setFontSize(cfg.subHeadingSize);
        doc.setTextColor(0, 0, 0);
        doc.text(p.name, marginX, y);

        if (p.tools) {
          const nw = doc.getTextWidth(p.name);
          doc.setFont(font, "italic");
          doc.setFontSize(cfg.metaSize);
          doc.setTextColor(60, 60, 60);
          doc.text(`  |  ${p.tools}`, marginX + nw, y);
        }
      }

      const pBullets = isSinglePage
        ? p.bullets.slice(0, cfg.projBulletLimit)
        : p.bullets;

      for (const b of pBullets) {
        y += cfg.lineHeight + cfg.bulletGap;
        maybeNewPage(cfg.lineHeight);

        doc.setFont(font, "normal");
        doc.setFontSize(cfg.bodySize);
        const bulletLines = doc.splitTextToSize(b, contentWidth - 4.5);

        if (draw) {
          doc.setTextColor(30, 30, 30);
          doc.text("\u2022", marginX + 1.2, y);
          for (let j = 0; j < bulletLines.length; j++) {
            doc.text(bulletLines[j], marginX + 4.5, y);
            if (j < bulletLines.length - 1) {
              y += cfg.lineHeight;
              maybeNewPage(cfg.lineHeight);
            }
          }
        } else {
          y += (bulletLines.length - 1) * cfg.lineHeight;
        }
      }
    }
  }

  // 7. Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    drawHeading("Certifications");
    maybeNewPage(cfg.lineHeight * 2);
    doc.setFont(font, "normal");
    doc.setFontSize(cfg.bodySize);
    if (draw) doc.setTextColor(30, 30, 30);

    const certText = resume.certifications.join("   \u00B7   ");
    const certLines = doc.splitTextToSize(certText, contentWidth);
    for (let i = 0; i < certLines.length; i++) {
      if (i > 0) y += cfg.lineHeight;
      maybeNewPage(cfg.lineHeight);
      if (draw) doc.text(certLines[i], marginX, y);
    }
  }

  return y + cfg.marginBottom;
}

/**
 * Finds the optimal layout configuration to fit the resume strictly onto 1 page
 * without leaving excessive whitespace around.
 */
function solveSinglePageLayout(
  resume: TailoredResume,
  pageWidth: number,
  pageHeight: number,
  marginX: number,
): LayoutConfig {
  const dummyDoc = new jsPDF({
    unit: "mm",
    format: "letter",
    orientation: "portrait",
  });

  // Evaluate presets in order of decreasing spaciousness
  for (const preset of LAYOUT_PRESETS) {
    const totalHeight = renderResumeLayout(
      dummyDoc,
      resume,
      preset,
      pageWidth,
      pageHeight,
      marginX,
      true,
      false, // measurement pass
    );

    if (totalHeight <= pageHeight) {
      return preset;
    }
  }

  // Fallback to maximum-fit if content is exceptionally large
  return LAYOUT_PRESETS[LAYOUT_PRESETS.length - 1];
}

/**
 * Generates an ATS-optimized, high-fidelity resume PDF in Jake Ryan style.
 * Supports intelligent auto-fitting for single-page mode as well as clean multi-page mode.
 */
export function generateResumePdf(
  resume: TailoredResume,
  options: PDFOptions = { singlePage: true },
): jsPDF {
  const isA4 = options.paperSize === "a4";
  const pageWidth = isA4 ? 210 : 215.9; // mm
  const pageHeight = isA4 ? 297 : 279.4; // mm
  const marginX = 12.7; // 0.5 inch standard
  const isSinglePage = options.singlePage !== false;

  const doc = new jsPDF({
    unit: "mm",
    format: isA4 ? "a4" : "letter",
    orientation: "portrait",
  });

  // Select configuration: auto-fit for single page, or spacious for multi-page
  const layoutConfig = isSinglePage
    ? solveSinglePageLayout(resume, pageWidth, pageHeight, marginX)
    : {
        ...LAYOUT_PRESETS[0],
        expBulletLimit: 99,
        projBulletLimit: 99,
      };

  // Render the final PDF onto doc
  renderResumeLayout(
    doc,
    resume,
    layoutConfig,
    pageWidth,
    pageHeight,
    marginX,
    isSinglePage,
    true, // draw to canvas
  );

  return doc;
}
