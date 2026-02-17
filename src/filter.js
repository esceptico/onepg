function normalizeBullet(bullet) {
  if (typeof bullet === 'string') return bullet;
  return bullet.text;
}

function bulletMatchesTags(bullet, tags) {
  if (typeof bullet === 'string') return true;
  if (!bullet.tags || bullet.tags.length === 0) return true;
  return bullet.tags.some((t) => tags.includes(t));
}

function filterContent(data, { tags } = {}) {
  if (!tags || tags.length === 0) {
    return normalizeBullets(data);
  }

  const filtered = JSON.parse(JSON.stringify(data));

  for (const entry of filtered.experience) {
    for (const role of entry.roles) {
      role.bullets = role.bullets
        .filter((b) => bulletMatchesTags(b, tags))
        .map(normalizeBullet);
    }
  }

  for (const edu of filtered.education) {
    if (edu.bullets) {
      edu.bullets = edu.bullets
        .filter((b) => bulletMatchesTags(b, tags))
        .map(normalizeBullet);
    }
  }

  return filtered;
}

function normalizeBullets(data) {
  const normalized = JSON.parse(JSON.stringify(data));

  for (const entry of normalized.experience) {
    for (const role of entry.roles) {
      role.bullets = role.bullets.map(normalizeBullet);
    }
  }

  for (const edu of normalized.education) {
    if (edu.bullets) {
      edu.bullets = edu.bullets.map(normalizeBullet);
    }
  }

  return normalized;
}

module.exports = { filterContent };
