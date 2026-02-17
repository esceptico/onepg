# onepg

YAML-to-PDF resume builder with auto-fit. Write your resume in YAML, get a clean PDF that fits on one page.

## Install

```bash
npm install -g onepg
```

Requires Node.js 18+. PDF generation needs [Puppeteer](https://purl.org/nickshanks/puppeteer) (installed automatically as optional dep).

## Quick start

```bash
onepg init           # scaffold data/resume.yml + config
# edit data/resume.yml with your info
onepg build --fit    # build HTML + PDF, auto-fit to one page
onepg dev            # live preview at localhost:3000
```

## YAML format

```yaml
personal:
  name: Jane Smith
  email: jane@example.com
  github: janesmith
  linkedin: janesmith
  location: San Francisco, CA

summary: >-
  Software engineer with 4 years of experience...

experience:
  - company: Acme Corp
    roles:
      - title: Senior Software Engineer
        dates:
          start: Mar 2022
          end: Present
        bullets:
          - Built a data pipeline processing 50K events/sec.
          - Migrated monolith to microservices, cutting deploy time by 80%.

projects:
  - name: fastqueue
    dates: { start: "2023", end: Present }
    description: Lightweight job queue for Node.js
    bullets:
      - Zero-dependency queue with priority scheduling.
    links:
      github: https://github.com/janesmith/fastqueue

education:
  - institution: UC Berkeley
    degree: B.S. Computer Science
    dates: { start: "2016", end: "2020" }

skills:
  - category: Languages
    items: [TypeScript, Python, Go, SQL]
  - category: Infrastructure
    items: [AWS, Docker, Kubernetes]
```

Bullets can also be tagged for filtering:

```yaml
bullets:
  - text: Built ML pipeline for fraud detection.
    tags: [ml, backend]
  - text: Designed REST API serving 10K req/sec.
    tags: [backend, api]
```

Then build with `--tags ml` to include only matching bullets.

## Commands

### build

```bash
onepg build                          # HTML + PDF to current dir
onepg build -o ./output              # custom output dir
onepg build --fit                    # auto-fit content to one page
onepg build --format html            # HTML only (skip PDF)
onepg build --format text            # plain text export
onepg build --tags backend,infra     # filter by bullet tags
```

### lint

```bash
onepg lint                           # check for weak verbs, AI language, bullet length
onepg lint --jd jd.txt               # + skills gap analysis against job description
```

### diff

```bash
onepg diff resume_v1.yml resume_v2.yml   # line-by-line diff of two YAML files
```

### dev

```bash
onepg dev                            # live reload at localhost:3000
onepg dev --port 8080                # custom port
onepg dev --fit                      # with auto-fit
```

### init

```bash
onepg init                           # scaffold starter files
onepg init --force                   # overwrite existing files
```

## Auto-fit (`--fit`)

The `--fit` flag scales fonts, line heights, and spacing to fit your content on a single US Letter page. It runs in the browser before PDF rendering, so what you see in `dev` mode matches the PDF output.

## Config

Optional `resume.config.yml` in your project root:

```yaml
output: ./output
```

The tool also picks up files from convention paths:

| What | Convention path | CLI flag |
|------|----------------|----------|
| Resume data | `data/resume.yml` | `-d, --data` |
| Template | `templates/resume.njk` | `-t, --template` |
| Styles | `styles/resume.css` | `-s, --styles` |

## Custom templates

The default template uses [Nunjucks](https://mozilla.github.io/nunjucks/). To customize:

1. Copy `defaults/template.njk` and `defaults/styles.css` to your project
2. Edit them
3. Point to them via convention paths or CLI flags

## License

MIT
