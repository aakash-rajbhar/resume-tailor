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

interface DocxOptions {
  singlePage?: boolean;
}

export async function buildResumeDocx(r: TailoredResume, options: DocxOptions = { singlePage: true }): Promise<Buffer> {
  const isSingle = options.singlePage !== false;

  function sectionHeading(text: string) {
    return new Paragraph({
      border: { bottom: { color: "666666", space: 1, style: BorderStyle.SINGLE, size: 4 } },
      spacing: { before: isSingle ? 90 : 160, after: isSingle ? 35 : 60 },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, size: isSingle ? 20 : 21, font: FONT, color: "1F1F1F" })],
    });
  }

  function bullet(text: string) {
    return new Paragraph({
      bullet: { level: 0 },
      spacing: { after: isSingle ? 24 : 40 },
      children: [new TextRun({ text, size: isSingle ? 19 : 20, font: FONT })],
    });
  }

  function line(children: TextRun[], after = 40) {
    return new Paragraph({ spacing: { after: isSingle ? Math.max(15, Math.floor(after * 0.6)) : after }, children });
  }

  function jobHeader(title: string, company: string, dates: string) {
    return new Paragraph({
      spacing: { after: isSingle ? 12 : 20 },
      tabStops: [{ type: "right", position: convertInchesToTwip(isSingle ? 7.5 : 7.4) }],
      children: [
        new TextRun({ text: `${title} — ${company}`, bold: true, size: isSingle ? 20 : 21, font: FONT }),
        new TextRun({ text: `\t${dates}`, italics: true, size: isSingle ? 19 : 20, font: FONT }),
      ],
    });
  }

  function subLine(text: string) {
    return new Paragraph({
      spacing: { after: isSingle ? 24 : 40 },
      children: [new TextRun({ text, italics: true, size: isSingle ? 18 : 19, font: FONT, color: "444444" })],
    });
  }

  function skillLine(label: string, value: string) {
    return new Paragraph({
      spacing: { after: isSingle ? 18 : 30 },
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: isSingle ? 19 : 20, font: FONT }),
        new TextRun({ text: value, size: isSingle ? 19 : 20, font: FONT }),
      ],
    });
  }

  const header = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: isSingle ? 25 : 40 },
      children: [new TextRun({ text: r.name, bold: true, size: isSingle ? 30 : 34, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: isSingle ? 60 : 100 },
      children: [new TextRun({ text: r.contact, size: isSingle ? 18 : 19, font: FONT })],
    }),
  ];

  const summary = [
    sectionHeading(r.title || "Professional Summary"),
    line([new TextRun({ text: r.summary, size: isSingle ? 19 : 20, font: FONT })], 50),
  ];

  const skills = [sectionHeading("Technical Skills"), ...r.skills.map((s) => skillLine(s.label, s.value))];

  const experience = [
    sectionHeading("Experience"),
    ...r.experience.flatMap((job) => {
      const bullets = isSingle ? job.bullets.slice(0, 4) : job.bullets;
      return [
        jobHeader(job.title, job.company, job.dates),
        subLine(job.location),
        ...bullets.map((b) => bullet(b)),
      ];
    }),
  ];

  const projects = r.projects?.length
    ? [
        sectionHeading("Projects"),
        ...r.projects.flatMap((p) => {
          const bullets = isSingle ? p.bullets.slice(0, 2) : p.bullets;
          return [
            line(
              [
                new TextRun({ text: p.name, bold: true, size: isSingle ? 19 : 20, font: FONT }),
                new TextRun({ text: `  |  ${p.tools}`, italics: true, size: isSingle ? 18 : 19, font: FONT, color: "444444" }),
              ],
              15
            ),
            ...bullets.map((b) => bullet(b)),
          ];
        }),
      ]
    : [];

  const education = [
    sectionHeading("Education"),
    ...r.education.flatMap((e) => [
      line(
        [
          new TextRun({ text: e.school, bold: true, size: isSingle ? 19 : 20, font: FONT }),
          new TextRun({ text: `\t${e.dates}`, size: isSingle ? 19 : 20, font: FONT }),
        ],
        10
      ),
      line([new TextRun({ text: e.degree, size: isSingle ? 19 : 20, font: FONT })], 40),
    ]),
  ];

  const certifications = r.certifications?.length
    ? [sectionHeading("Certifications"), line([new TextRun({ text: r.certifications.join("   |   "), size: isSingle ? 19 : 20, font: FONT })], 0)]
    : [];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(isSingle ? 0.35 : 0.4),
              bottom: convertInchesToTwip(isSingle ? 0.35 : 0.4),
              left: convertInchesToTwip(isSingle ? 0.5 : 0.55),
              right: convertInchesToTwip(isSingle ? 0.5 : 0.55),
            },
          },
        },
        children: [...header, ...summary, ...skills, ...experience, ...projects, ...education, ...certifications],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
