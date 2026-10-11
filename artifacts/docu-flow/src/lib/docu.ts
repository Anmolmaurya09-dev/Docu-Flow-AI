export type ProjectMeta = {
  projectName: string;
  fileCount: number;
  lineEstimate: number;
  tree: string[];
  technologies: string[];
  packageName?: string;
  description?: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
  license?: string;
  author?: string;
  repository?: string;
  readmeFiles: Array<{ path: string; content: string }>;
  sources: {
    projectName?: string;
    description?: string;
    dependencies?: string;
    devDependencies?: string;
    scripts?: string;
    license?: string;
    author?: string;
    repository?: string;
    technologies?: string;
    readme?: string;
    structure?: string;
  };
  origin: 'zip' | 'template';
  notes: string[];
};

export const starterReadme = `# Project name

> Add a short, verified description of your project.

## Problem

Describe the problem this project solves.

## Features

- Add a verified feature.

## Technologies

Add the technologies used by this project.

## Installation

Add tested installation instructions. No commands are inferred.

## Usage

Add a usage example that matches the actual implementation.

## Project status

Add the current project status.

## License

Add the license used by this project.

## Author and links

Add an author name or project links (optional).
`;

export function formatJson(input: string): { output?: string; error?: string } {
  try { return { output: JSON.stringify(JSON.parse(input), null, 2) }; }
  catch (e) { return { error: e instanceof Error ? e.message : 'This is not valid JSON.' }; }
}

export function formatMarkdown(input: string): string {
  let inFence = false;
  const normalized = input.replace(/\r\n/g, '\n').split('\n').map((line) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    if (/^\s*#{1,6}\s/.test(line)) return line.trimEnd();
    if (/^\s*[-*]\s+/.test(line)) return line.replace(/^(\s*)[-*]\s+/, '$1- ').replace(/[ \t]+$/g, '');
    return line.replace(/[ \t]+$/g, '');
  }).join('\n');
  return normalized.replace(/\n{3,}/g, '\n\n').trim();
}

export function textStats(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split(/\r\n|\r|\n/) : [];
  return { characters: text.length, words, lines: lines.length, blankLines: lines.filter((line) => !line.trim()).length, readingMinutes: Math.ceil(words / 220) };
}

export function makeGitignore(language: string, framework: string): string {
  const base: Record<string, string[]> = {
    Node: ['node_modules/', 'npm-debug.log*', 'yarn-debug.log*', '.env*'],
    Python: ['__pycache__/', '*.py[cod]', '.venv/', 'venv/', '.env'],
    Java: ['*.class', '*.jar', 'target/', '.gradle/'],
    Go: ['*.exe', '*.test', '/vendor/'],
    Rust: ['/target/', 'Cargo.lock'],
  };
  const frameworks: Record<string, string[]> = {
    Vite: ['dist/', '.vite/'], Next: ['.next/', 'out/'], React: ['coverage/'],
    Django: ['staticfiles/', '*.sqlite3'], Flask: ['instance/', '.flaskenv'],
    'No framework': [],
  };
  return [...(base[language] || []), ...(frameworks[framework] || []), '.DS_Store', '*.log'].join('\n') + '\n';
}

export function buildChangelogTemplate(name: string): string {
  const project = name.trim() || 'Project name';
  return `# Changelog\n\nAll notable changes to **${project}** will be documented here.\n\n## [Unreleased]\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n`;
}

function fieldProvenance(value: string | undefined, source: string | undefined) {
  if (source === 'your input') return 'Provided by you';
  if (source) return `Detected from ${source}`;
  if (!value?.trim() || value.trim() === 'Project name' || value.trim().startsWith('[Add ')) return 'Not detected; template prompt';
  return value?.trim() ? 'Provided by you' : 'Not detected; template prompt';
}

export function buildPackReadme(meta: ProjectMeta): string {
  if (meta.readmeFiles[0]?.content) return meta.readmeFiles[0].content;
  const source = meta.origin === 'zip' ? 'Detected fields below include their source. Features and instructions are not inferred.' : 'Bracketed text is a template prompt; project-specific facts must come from your input.';
  const deps = meta.dependencies.length ? meta.dependencies.map((item) => `- \`${item}\``).join('\n') : 'No dependencies were provided.';
  const devDeps = meta.devDependencies.length ? meta.devDependencies.map((item) => `- \`${item}\``).join('\n') : 'No development dependencies were provided.';
  const scripts = Object.entries(meta.scripts).map(([scriptName, command]) => `- \`${scriptName}\`: \`${command}\``).join('\n') || 'No package scripts were provided.';
  const technologies = meta.technologies.length ? meta.technologies.map((technology) => `- ${technology} (${fieldProvenance(technology, meta.sources.technologies)})`).join('\n') : '[Add technologies used, if known.]';
  return `# ${meta.projectName || 'Project name'}

> ${source}

> Project name: ${fieldProvenance(meta.projectName, meta.sources.projectName)} · Description: ${fieldProvenance(meta.description, meta.sources.description)}

${meta.description || '[Add a short, verified description of this project.]'}

## Problem

[Describe the problem this project solves.]

## Features

- [List verified project features. None are inferred from filenames.]

## Technologies

${technologies}

## Detected dependencies

${meta.dependencies.length ? `${deps}\n\n_Source: ${fieldProvenance(meta.dependencies.join(', '), meta.sources.dependencies)}._` : deps}

## Detected development dependencies

${meta.devDependencies.length ? `${devDeps}\n\n_Source: ${fieldProvenance(meta.devDependencies.join(', '), meta.sources.devDependencies)}._` : devDeps}

## Available package scripts

${meta.scripts && Object.keys(meta.scripts).length ? `${scripts}\n\n_Source: ${fieldProvenance(Object.keys(meta.scripts).join(', '), meta.sources.scripts)}._` : scripts}

## Installation

[Add tested installation instructions. No commands are inferred from package metadata.]

## Usage

[Add a usage example that matches the actual implementation.]

## Project status

[Add the current project status.]

## License

${meta.license || '[Add the license used by this project.]'} · ${fieldProvenance(meta.license, meta.sources.license)}

## Author and links

${[meta.author, meta.repository].filter(Boolean).join(' · ') || '[Add an author name or project links (optional).]'} · ${fieldProvenance([meta.author, meta.repository].filter(Boolean).join(' · '), meta.sources.author || meta.sources.repository)}
`;
}

export type ReadmeDraftFields = {
  projectName?: string;
  description?: string;
  problem?: string;
  features?: string;
  technologies?: string;
  installation?: string;
  usage?: string;
  projectStatus?: string;
  license?: string;
  authorLinks?: string;
};

export function buildReadmeDraft(meta: ProjectMeta, fields: ReadmeDraftFields): string {
  const projectName = fields.projectName?.trim() || meta.projectName || 'Project name';
  const description = fields.description?.trim() || meta.description;
  const technologies = fields.technologies?.trim()
    ? fields.technologies.split(',').map((value) => value.trim()).filter(Boolean)
    : meta.technologies;
  const dependencies = meta.dependencies.length ? meta.dependencies.map((value) => `- \`${value}\``).join('\n') : 'No dependency metadata detected.';
  const devDependencies = meta.devDependencies.length ? meta.devDependencies.map((value) => `- \`${value}\``).join('\n') : 'No development dependency metadata detected.';
  const scripts = Object.entries(meta.scripts).map(([name, command]) => `- \`${name}\`: \`${command}\``).join('\n') || 'No package scripts detected.';
  const detectedNote = meta.origin === 'zip'
    ? 'Detected values and sources are listed below. Installation commands and project features are not inferred.'
    : 'Bracketed text is a template prompt. Project-specific details must come from your input.';
  const authorLinks = fields.authorLinks?.trim() || [meta.author, meta.repository].filter(Boolean).join(' · ');
  return `# ${projectName}

> ${description || '[Add a short, verified project description.]'}

> ${detectedNote}

## Information sources

- Project name: ${fieldProvenance(projectName, meta.sources.projectName)}
- Description: ${fieldProvenance(description, meta.sources.description)}
- Technologies: ${fieldProvenance(technologies.join(', '), meta.sources.technologies)}
- Dependencies: ${fieldProvenance(meta.dependencies.join(', '), meta.sources.dependencies)}
- Development dependencies: ${fieldProvenance(meta.devDependencies.join(', '), meta.sources.devDependencies)}
- Package scripts: ${fieldProvenance(Object.keys(meta.scripts).join(', '), meta.sources.scripts)}
- License: ${fieldProvenance(fields.license?.trim() || meta.license, fields.license?.trim() && fields.license.trim() !== meta.license ? 'your input' : meta.sources.license)}
- Author and links: ${fieldProvenance(authorLinks, fields.authorLinks?.trim() && fields.authorLinks.trim() !== [meta.author, meta.repository].filter(Boolean).join(' · ') ? 'your input' : meta.sources.author || meta.sources.repository)}
- Problem, features, installation, usage, and project status: ${fields.problem?.trim() || fields.features?.trim() || fields.installation?.trim() || fields.usage?.trim() || fields.projectStatus?.trim() ? 'Provided by you where entered; remaining bracketed fields are template prompts' : 'Template prompts; no project-specific details were detected'}

## Problem

${fields.problem?.trim() || '[Describe the problem this project solves.]'}

## Features

${fields.features?.trim() ? fields.features.split('\n').map((feature) => `- ${feature.trim()}`).filter((feature) => feature !== '-').join('\n') : '- [Add a verified feature.]'}

## Technologies

${technologies.length ? technologies.map((technology) => `- ${technology} (${meta.sources.technologies || 'provided by you'})`).join('\n') : '[Add technologies used, if known.]'}

## Detected dependencies

${dependencies}

## Detected development dependencies

${devDependencies}

## Available package scripts

${scripts}

## Installation

${fields.installation?.trim() || '[Add tested installation instructions. No commands are inferred.]'}

## Usage

${fields.usage?.trim() || '[Add a usage example that matches the actual implementation.]'}

## Project status

${fields.projectStatus?.trim() || '[Add the current project status.]'}

## License

${fields.license?.trim() || meta.license || '[Add the license used by this project.]'}

## Author and links

${authorLinks || '[Add an author name or project links (optional).]'}
`;
}

export function buildStructureSummary(meta: ProjectMeta): string {
  const origin = meta.origin === 'zip' ? 'Based on supported files inspected from a local ZIP. This is a simplified inventory; details edited above are user-provided overrides.' : 'Template-based: no project ZIP was supplied, so the project structure was not analyzed. Add only verified structure details.';
  const tree = meta.tree.length ? `\`\`\`text\n${meta.tree.join('\n')}\n\`\`\`` : '[Add a verified list of important files and folders.]';
  const tech = meta.technologies.length ? meta.technologies.join(', ') : 'None identified from supplied metadata.';
  const packageInfo = meta.packageName ? `Package: \`${meta.packageName}\`${meta.description ? ` — ${meta.description}` : ''}` : 'No root package metadata provided.';
  return `# Project structure summary: ${meta.projectName || 'Project name'}

> ${origin}

## Technology hints

${tech}

## Inventory

${meta.origin === 'zip' ? `${meta.fileCount} supported text files; approximately ${meta.lineEstimate.toLocaleString()} lines.` : 'File counts and lines have not been analyzed.'}

## Files and folders

${tree}

## Package metadata

${packageInfo}

## Analysis notes

${meta.notes.length ? meta.notes.map((note) => `- ${note}`).join('\n') : 'No ZIP analysis notes. Add verified project context here.'}
`;
}

export function starterInstallationGuide() {
  return `## Prerequisites

Add verified prerequisites for this project.

## Install

Add tested installation steps here. No install commands are inferred.`;
}

export function starterOnboardingGuide() {
  return `## Before you begin

Add verified prerequisites.

## First steps

Describe the first steps using the actual project workflow.`;
}

export function createDocs(meta: ProjectMeta, fields: { readme: string; install: string; gettingStarted: string; structure: string }) {
  const name = meta.projectName || 'Project name';
  const deps = meta.dependencies.length ? meta.dependencies.map((x) => `- \`${x}\``).join('\n') : 'No dependencies provided or found in available project metadata.';
  const scripts = Object.entries(meta.scripts).length ? Object.entries(meta.scripts).map(([k,v]) => `- \`${k}\`: \`${v}\``).join('\n') : 'No package scripts detected.';
  const source = meta.origin === 'zip' ? 'ZIP-derived metadata is included below; any details you add here are user-provided.' : 'Template-generated prompts are placeholders; any details you add here are user-provided. No ZIP metadata was supplied.';
  const dependencyLabel = meta.origin === 'zip' ? 'Dependencies in Project details (ZIP-prefilled unless edited)' : 'Dependencies supplied manually';
  const install = `# Installation guide: ${name}\n\n> ${source}\n\n${fields.install || starterInstallationGuide()}\n\n## Available package scripts\n\n${scripts}\n\n## ${dependencyLabel}\n\n${deps}\n\n> Verify details and add actual commands before using this guide.`;
  const start = `# Getting started: ${name}\n\n> ${source}\n\n${fields.gettingStarted || starterOnboardingGuide()}\n\n## Available files\n\n${meta.tree.length ? '```text\n' + meta.tree.slice(0, 30).join('\n') + '\n```' : 'No project file structure was provided. Add a verified structure summary.'}\n\n> This guide is a template. Verify details against the codebase.`;
  return { readme: fields.readme, install, gettingStarted: start, structure: fields.structure };
}

export function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function markdownToSafeHtml(markdown: string): string {
  const escaped = escapeHtml(markdown);
  const blocks = escaped.split(/\n{2,}/);
  return blocks.map((block) => {
    if (/^```/.test(block)) return `<pre><code>${block.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '')}</code></pre>`;
    const heading = block.match(/^(#{1,6})\s+(.+)$/);
    if (heading) return `<h${heading[1].length}>${heading[2]}</h${heading[1].length}>`;
    if (/^(?:- .+(?:\n- .+)*)$/.test(block)) return `<ul>${block.split('\n').map((x) => `<li>${x.slice(2)}</li>`).join('')}</ul>`;
    let inline = block.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return `<p>${inline.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

export function emptyMeta(projectName = ''): ProjectMeta {
  return { projectName, fileCount: 0, lineEstimate: 0, tree: [], technologies: [], dependencies: [], devDependencies: [], scripts: {}, readmeFiles: [], sources: {}, origin: 'template', notes: [] };
}
