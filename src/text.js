function formatContact(personal) {
  const fields = [
    personal.email,
    personal.github,
    personal.linkedin,
    personal.phone,
    personal.personal_site,
    personal.location,
  ].filter(Boolean);

  return fields.join(' | ');
}

function formatDates(dates) {
  if (!dates) return '';
  const parts = [dates.start, dates.end].filter(Boolean);
  return parts.join(' \u2013 ');
}

function renderText(data) {
  const lines = [];

  // Header
  lines.push(data.personal.name.toUpperCase());
  const contact = formatContact(data.personal);
  if (contact) lines.push(contact);

  // Summary
  if (data.summary) {
    lines.push('');
    lines.push('SUMMARY');
    lines.push(data.summary);
  }

  // Experience
  if (data.experience && data.experience.length) {
    lines.push('');
    lines.push('EXPERIENCE');
    for (const job of data.experience) {
      for (const role of job.roles) {
        const dates = formatDates(role.dates);
        const heading = dates
          ? `${job.company} \u2014 ${role.title} (${dates})`
          : `${job.company} \u2014 ${role.title}`;
        lines.push('');
        lines.push(heading);
        if (role.bullets) {
          for (const bullet of role.bullets) {
            lines.push(`- ${bullet}`);
          }
        }
      }
    }
  }

  // Education
  if (data.education && data.education.length) {
    lines.push('');
    lines.push('EDUCATION');
    for (const edu of data.education) {
      const dates = formatDates(edu.dates);
      const heading = dates
        ? `${edu.institution} \u2014 ${edu.degree} (${dates})`
        : `${edu.institution} \u2014 ${edu.degree}`;
      lines.push('');
      lines.push(heading);
      if (edu.bullets) {
        for (const bullet of edu.bullets) {
          lines.push(`- ${bullet}`);
        }
      }
    }
  }

  // Skills
  if (data.skills && data.skills.length) {
    lines.push('');
    lines.push('SKILLS');
    for (const skill of data.skills) {
      const items = Array.isArray(skill.items) ? skill.items.join(', ') : skill.items;
      lines.push(`${skill.category}: ${items}`);
    }
  }

  // Strip trailing whitespace from each line and join
  return lines.map((line) => line.trimEnd()).join('\n') + '\n';
}

module.exports = { renderText };
