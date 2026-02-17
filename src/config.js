const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DEFAULTS_DIR = path.join(__dirname, '..', 'defaults');
const CONFIG_FILE = 'resume.config.yml';

// Convention paths relative to project root
const CONVENTIONS = {
  template: ['templates/resume.njk'],
  styles: ['styles/resume.css'],
  data: ['data/resume.yml'],
};

function findProjectRoot(startDir = process.cwd()) {
  // 1. Walk up from cwd
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, CONFIG_FILE)) || fs.existsSync(path.join(dir, 'data', 'resume.yml'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }

  // 2. Check ~/.config/resume/
  const globalDir = path.join(require('os').homedir(), '.config', 'resume');
  if (fs.existsSync(path.join(globalDir, CONFIG_FILE))) {
    return globalDir;
  }

  return process.cwd();
}

function loadConfig(projectRoot) {
  const configPath = path.join(projectRoot, CONFIG_FILE);
  if (!fs.existsSync(configPath)) return {};

  const raw = fs.readFileSync(configPath, 'utf8');
  return yaml.load(raw) || {};
}

function resolveFile(key, cliValue, config, projectRoot) {
  // CLI flag wins
  if (cliValue) return path.resolve(cliValue);

  // Config file value
  if (config[key]) return path.resolve(projectRoot, config[key]);

  // Convention: check known paths
  const candidates = CONVENTIONS[key] || [];
  for (const rel of candidates) {
    const abs = path.join(projectRoot, rel);
    if (fs.existsSync(abs)) return abs;
  }

  // Bundled default
  const defaultMap = {
    template: 'template.njk',
    styles: 'styles.css',
    data: null,
  };

  if (defaultMap[key]) return path.join(DEFAULTS_DIR, defaultMap[key]);
  return undefined;
}

function resolve(cliOpts = {}) {
  const projectRoot = findProjectRoot();
  const config = loadConfig(projectRoot);

  return {
    projectRoot,
    data: resolveFile('data', cliOpts.data, config, projectRoot),
    template: resolveFile('template', cliOpts.template, config, projectRoot),
    styles: resolveFile('styles', cliOpts.styles, config, projectRoot),
    output: cliOpts.output ? path.resolve(cliOpts.output) : config.output ? path.resolve(projectRoot, config.output) : undefined,
  };
}

module.exports = { resolve, DEFAULTS_DIR };
