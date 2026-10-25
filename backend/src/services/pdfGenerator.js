import PDFDocument from 'pdfkit';

/**
 * Internal core generator building ATS-friendly PDF
 */
const buildDoc = (resume, dataCallback, endCallback) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  if (typeof dataCallback === 'function') {
    doc.on('data', dataCallback);
  }
  if (typeof endCallback === 'function') {
    doc.on('end', endCallback);
  }

  const leftMargin = 50;
  const rightMargin = doc.page.width - 50;
  const contentWidth = rightMargin - leftMargin;

  // Helper to draw clean section header with an underline
  const drawSectionHeader = (title) => {
    doc.moveDown(0.7);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(title.toUpperCase(), leftMargin);
    const lineY = doc.y + 2;
    doc
      .moveTo(leftMargin, lineY)
      .lineTo(rightMargin, lineY)
      .strokeColor('#9ca3af')
      .lineWidth(0.75)
      .stroke();
    doc.y = lineY + 5;
  };

  // 1. Personal Info Header
  const personal = resume.personalInfo || {};
  if (personal.fullName) {
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#111827')
      .text(personal.fullName, { align: 'center' });
  }

  const contactDetails = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedinUrl,
    personal.githubUrl
  ].filter(Boolean);

  if (contactDetails.length > 0) {
    doc.moveDown(0.3);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#374151')
      .text(contactDetails.join(' | '), { align: 'center' });
  }

  // 2. Summary (if exists)
  if (personal.summary && personal.summary.trim()) {
    drawSectionHeader('SUMMARY');
    doc.moveDown(0.3);
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#1f2937')
      .text(personal.summary.trim(), leftMargin, doc.y, {
        width: contentWidth,
        align: 'justify',
        lineGap: 2
      });
  }

  // 3. Experience
  if (Array.isArray(resume.experience) && resume.experience.length > 0) {
    drawSectionHeader('EXPERIENCE');
    resume.experience.forEach((exp) => {
      doc.moveDown(0.4);
      const startY = doc.y;

      const titleText = `${exp.role || ''}${exp.role && exp.company ? ' – ' : ''}${exp.company || ''}`;
      doc
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .fillColor('#111827')
        .text(titleText, leftMargin, startY, { width: contentWidth - 140 });

      const dateStr = `${exp.startDate || ''} – ${exp.isCurrent ? 'Present' : exp.endDate || ''}`.trim();
      if (dateStr && dateStr !== '–') {
        doc
          .font('Helvetica')
          .fontSize(9.5)
          .fillColor('#4b5563')
          .text(dateStr, rightMargin - 130, startY, {
            width: 130,
            align: 'right'
          });
      }

      if (exp.location) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(9)
          .fillColor('#6b7280')
          .text(exp.location, leftMargin);
      }

      if (Array.isArray(exp.bulletPoints) && exp.bulletPoints.length > 0) {
        doc.moveDown(0.2);
        exp.bulletPoints.forEach((point) => {
          doc
            .font('Helvetica')
            .fontSize(10)
            .fillColor('#1f2937')
            .text(`•  ${point}`, leftMargin + 12, doc.y, {
              width: contentWidth - 12,
              lineGap: 1.5
            });
        });
      }
    });
  }

  // 4. Education
  if (Array.isArray(resume.education) && resume.education.length > 0) {
    drawSectionHeader('EDUCATION');
    resume.education.forEach((edu) => {
      doc.moveDown(0.4);
      const startY = doc.y;

      const degreeText = `${edu.degree || ''}${edu.degree && edu.fieldOfStudy ? ' in ' : ''}${edu.fieldOfStudy || ''}`;
      doc
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .fillColor('#111827')
        .text(degreeText, leftMargin, startY, { width: contentWidth - 100 });

      if (edu.graduationYear) {
        doc
          .font('Helvetica')
          .fontSize(9.5)
          .fillColor('#4b5563')
          .text(String(edu.graduationYear), rightMargin - 90, startY, {
            width: 90,
            align: 'right'
          });
      }

      if (edu.institution) {
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#374151')
          .text(edu.institution, leftMargin);
      }
    });
  }

  // 5. Projects
  if (Array.isArray(resume.projects) && resume.projects.length > 0) {
    drawSectionHeader('PROJECTS');
    resume.projects.forEach((proj) => {
      doc.moveDown(0.4);
      const startY = doc.y;

      doc
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .fillColor('#111827')
        .text(proj.name || '', leftMargin, startY, { width: contentWidth - 170 });

      if (proj.liveUrl) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#2563eb')
          .text(proj.liveUrl, rightMargin - 160, startY, {
            width: 160,
            align: 'right',
            link: proj.liveUrl
          });
      }

      if (Array.isArray(proj.techStack) && proj.techStack.length > 0) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(9)
          .fillColor('#4b5563')
          .text(`Technologies: ${proj.techStack.join(', ')}`, leftMargin);
      }

      if (proj.description) {
        doc.moveDown(0.15);
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#1f2937')
          .text(proj.description, leftMargin, doc.y, {
            width: contentWidth,
            lineGap: 1.5
          });
      }
    });
  }

  // 6. Skills
  if (Array.isArray(resume.skills) && resume.skills.length > 0) {
    drawSectionHeader('SKILLS');
    doc.moveDown(0.3);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1f2937')
      .text(resume.skills.join(', '), leftMargin, doc.y, {
        width: contentWidth,
        lineGap: 2
      });
  }

  doc.moveDown();
  doc.end();
};

/**
 * Builds an ATS-friendly, single-column PDF resume
 * Supports both streaming callbacks (Phase 2) and Promise<Buffer> (Phase 5)
 * @param {Object} resume - Resume document object
 * @param {Function} [dataCallback] - Optional data chunk callback
 * @param {Function} [endCallback] - Optional stream end callback
 * @returns {Promise<Buffer> | void}
 */
export const buildResumePDF = (resume, dataCallback, endCallback) => {
  if (typeof dataCallback === 'function') {
    return buildDoc(resume, dataCallback, endCallback);
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    try {
      buildDoc(
        resume,
        (chunk) => chunks.push(chunk),
        () => resolve(Buffer.concat(chunks))
      );
    } catch (err) {
      reject(err);
    }
  });
};

export default buildResumePDF;
