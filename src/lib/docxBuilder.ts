import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
} from "docx";
import type { TailoredResume } from "./types";

const FONT = "Calibri";

function sectionHeading(text: string) {
  return new Paragraph({
    border: { bottom: { color: "444444", space: 1, style: BorderStyle.SINGLE, size: 4 } },
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 21, font: FONT, color: "1F1F1F" })],
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, size: 20, font: FONT })],
  });
}

function line(children: TextRun[], after = 40) {
  return new Paragraph({ spacing: { after }, children });
}

function jobHeader(title: string, company: string, dates: string) {
  return new Paragraph({
    spacing: { after: 20 },
    tabStops: [{ type: "right", position: convertInchesToTwip(7.5) }],
    children: [
      new TextRun({ text: `${title} — ${company}`, bold: true, size: 21, font: FONT }),
      new TextRun({ text: `\t${dates}`, italics: true, size: 20, font: FONT }),
    ],
  });
}

function subLine(text: string) {
  return new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text, italics: true, size: 19, font: FONT, color: "444444" })],
  });
}

function skillLine(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 30 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20, font: FONT }),
      new TextRun({ text: value, size: 20, font: FONT }),
    ],
  });
}

export async function buildResumeDocx(r: TailoredResume): Promise<Buffer> {
  const header = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: r.name, bold: true, size: 34, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: r.contact, size: 19, font: FONT })],
    }),
  ];

  const summary = [
    sectionHeading(r.title || "Professional Summary"),
    line([new TextRun({ text: r.summary, size: 20, font: FONT })], 60),
  ];

  const skills = [sectionHeading("Technical Skills"), ...r.skills.map((s) => skillLine(s.label, s.value))];

  const experience = [
    sectionHeading("Experience"),
    ...r.experience.flatMap((job) => [
      jobHeader(job.title, job.company, job.dates),
      subLine(job.location),
      ...job.bullets.map((b) => bullet(b)),
    ]),
  ];

  const projects = r.projects?.length
    ? [
        sectionHeading("Projects"),
        ...r.projects.flatMap((p) => [
          line(
            [
              new TextRun({ text: p.name, bold: true, size: 20, font: FONT }),
              new TextRun({ text: `  |  ${p.tools}`, italics: true, size: 19, font: FONT, color: "444444" }),
            ],
            20
          ),
          ...p.bullets.map((b) => bullet(b)),
        ]),
      ]
    : [];

  const education = [
    sectionHeading("Education"),
    ...r.education.flatMap((e) => [
      line(
        [
          new TextRun({ text: e.school, bold: true, size: 20, font: FONT }),
          new TextRun({ text: `\t${e.dates}`, size: 20, font: FONT }),
        ],
        10
      ),
      line([new TextRun({ text: e.degree, size: 20, font: FONT })], 60),
    ]),
  ];

  const certifications = r.certifications?.length
    ? [sectionHeading("Certifications"), line([new TextRun({ text: r.certifications.join("   |   "), size: 20, font: FONT })], 0)]
    : [];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.4),
              bottom: convertInchesToTwip(0.4),
              left: convertInchesToTwip(0.55),
              right: convertInchesToTwip(0.55),
            },
          },
        },
        children: [...header, ...summary, ...skills, ...experience, ...projects, ...education, ...certifications],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
