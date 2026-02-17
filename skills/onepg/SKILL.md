---
name: onepg
description: Use this skill when the user wants to create, edit, build, lint, or manage resumes. This includes generating PDF/HTML resumes from YAML data, linting resume bullets for weak verbs or AI language, comparing resume versions with diff, starting a live preview dev server, scaffolding a new resume project, or editing resume YAML content. If the user mentions resumes, CVs, or the onepg tool, use this skill.
argument-hint: "[question or task]"
---

# onepg — YAML Resume Builder

onepg converts a YAML resume into a styled HTML page and auto-fit PDF (US Letter, one page).

**Location**: The user's resume project is at `~/src/resume/`. Always `cd` there (or use `working_dir`) before running commands.

## CLI Commands

```
onepg init [--force]                    # scaffold data/resume.yml + resume.config.yml
onepg build [options]                   # build HTML + PDF
onepg build --fit                       # auto-fit content to one page
onepg build --format html              # HTML only (skip PDF)
onepg build --format text              # plain text export
onepg build --tags backend,ml          # filter bullets by tags
onepg build -o ./output                # custom output dir
onepg lint                              # check bullets for issues
onepg lint --jd jd.txt                 # + skills gap vs job description
onepg diff file1.yml file2.yml         # diff two resume versions
onepg dev [--port 3000] [--fit]        # live preview with hot reload
```

Common flags: `-d <path>` data file, `-t <path>` template, `-s <path>` styles.

## YAML Schema

Required top-level keys: `personal`, `summary`, `experience`, `education`, `skills`.
Optional: `projects`.

```yaml
personal:                    # required
  name: Jane Smith           # required — only required field in personal
  email: jane@example.com
  github: janesmith          # username, not URL
  linkedin: janesmith        # username, not URL
  phone: "+1 555-123-4567"
  personal_site: https://jane.dev
  location: San Francisco, CA

summary: >-                  # required, single string
  Software engineer with 4 years of experience building web
  applications and distributed systems.

experience:                  # required, min 1 entry
  - company: Acme Corp       # required
    roles:                   # required, min 1 role
      - title: Senior Software Engineer    # required
        dates:                             # required
          start: Mar 2022                  # required
          end: Present                     # required
        bullets:                           # required, array
          - Plain string bullet.
          - text: Tagged bullet for filtering.
            tags: [backend, api]

projects:                    # optional section
  - name: fastqueue          # required
    dates: { start: "2023", end: Present }  # required
    description: Lightweight job queue      # required
    bullets:                                # required
      - Zero-dependency queue with priority scheduling.
    links:                   # optional
      github: https://github.com/user/repo
      demo: https://demo.example.com
      paper: https://arxiv.org/abs/...
      website: https://project.dev

education:                   # required
  - institution: UC Berkeley # required
    degree: B.S. Computer Science  # required
    dates: { start: "2016", end: "2020" }  # required
    bullets: []              # optional

skills:                      # required
  - category: Languages      # required
    items: [TypeScript, Python, Go, SQL]  # required, min 1
```

### Bullet Formats

Bullets can be plain strings or objects with tags for filtering:

```yaml
# Plain string
bullets:
  - Built data pipeline processing 50K events/sec.

# Tagged (for --tags filtering)
bullets:
  - text: Built ML pipeline for fraud detection.
    tags: [ml, backend]
```

Both formats work in experience, projects, and education sections.

## Lint Rules

| Rule | What it flags |
|------|--------------|
| `bullet-length` | Bullets shorter than 40 chars or longer than 200 chars |
| `weak-verbs` | Bullets starting with: helped, worked on, responsible for, assisted, participated in, was involved in, contributed to |
| `ai-language` | Buzzwords: leverage, spearheaded, synergy, utilize, orchestrated, facilitated, streamlined, pioneered, holistic, ecosystem, paradigm, cutting-edge, best-in-class, world-class, robust |
| `ai-punctuation` | Unicode chars commonly from AI: em-dashes, smart quotes, bullets (— → ⟶ • " " ' ' …) |
| `quantified-ratio` | Warns if fewer than 30% of bullets in a role contain numbers/metrics |
| `skills-gap` | With `--jd`: JD keywords missing from skills section |

### Writing Good Bullets

- Start with a strong action verb (Built, Designed, Reduced, Migrated, Led)
- Include metrics when possible (%, numbers, timeframes)
- Keep between 40–200 characters
- Avoid AI-generated language and unicode punctuation
- Use straight quotes and hyphens, not smart quotes and em-dashes

## Auto-fit (`--fit`)

Scales CSS variables (font sizes, line heights, spacing) to fit content on one US Letter page (8.5" × 11"). Runs in-browser before PDF rendering.

Variables scaled (with minimums): font-base (10px), font-name (28px), font-section (14px), font-heading (12px), font-dates (9px), font-contact (8px), line-height (1.15), bullet-line-height (1.1), section-spacing (6px), experience-spacing (0px), skills-spacing (1px).

Warnings:
- If content overflows at minimum sizes: "remove some content"
- If scaled below 85%: "consider trimming for readability"

## Config Cascade

Resolution order (first wins): CLI flags > `resume.config.yml` > convention paths > bundled defaults.

Convention paths (relative to project root):
- `data/resume.yml` — resume data
- `templates/resume.njk` — Nunjucks template
- `styles/resume.css` — CSS styles

Config file (`resume.config.yml`):
```yaml
output: ./output
```

## Template & Styles

- Template engine: Nunjucks (`.njk`)
- Default fonts: Inter (body), Poppins (headings) via Google Fonts
- Icons: Font Awesome 6 (contact section)
- Paper: US Letter, 12mm top/bottom margins, 10mm left/right margins
- PDF viewport: 741px wide, 1056px tall

To customize, copy `defaults/template.njk` and `defaults/styles.css` to convention paths and edit.

## Workflow: Creating a New Tailored Resume

1. Read the base resume YAML: `cat ~/src/resume/data/resume.yml`
2. Copy and modify it for the target role — adjust summary, reorder/filter bullets, tweak skills
3. Save the tailored version: `~/src/resume/output/{company_role}/resume.yml`
4. Build: `onepg build -d output/{company_role}/resume.yml -o output/{company_role} --fit`
5. Lint: `onepg lint -d output/{company_role}/resume.yml -j path/to/jd.txt`
6. Iterate on lint warnings, rebuild

## Workflow: Editing an Existing Resume

1. Read the YAML file to understand current content
2. Edit the YAML directly (use edit_note or bash)
3. Rebuild with `onepg build --fit`
4. Run `onepg lint` to catch issues
