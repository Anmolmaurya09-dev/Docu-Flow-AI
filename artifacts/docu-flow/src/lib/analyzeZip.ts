import JSZip from 'jszip';
import { emptyMeta, type ProjectMeta } from './docu.ts';

const MAX_ZIP = 5 * 1024 * 1024;
const MAX_FILES = 100;
const MAX_TEXT = 256 * 1024;
const SKIP = /(^|\/)(node_modules|dist|build|\.git)(\/|$)/i;
const TEXT_EXT = /\.(?:ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|swift|rb|php|html|css|scss|json|md|mdx|markdown|txt|rst|yml|yaml|toml|sh|sql|xml|svg|vue|svelte|astro|gitignore|dockerfile)$/i;

export type AnalyzeProgress = {
  phase: 'opening' | 'reading';
  completedFiles: number;
  totalFiles: number;
};

function readmeIntro(markdown: string) {
  const lines = markdown.split(/\r\n|\r|\n/);
  const headingIndex = lines.findIndex((line) => /^#\s+\S/.test(line.trim()));
  const title = headingIndex >= 0 ? lines[headingIndex].trim().replace(/^#\s+/, '').replace(/\s+#*$/, '').trim() : '';
  if (headingIndex < 0) return { title, description: '' };
  for (let i = headingIndex + 1; i < Math.min(lines.length, headingIndex + 12); i++) {
    let line = lines[i].trim();
    if (!line || /^#{1,6}\s|^```|^!\[|^\[!\[/.test(line)) continue;
    if (line.startsWith('>')) line = line.replace(/^>\s*/, '').trim();
    if (line && !/^\[.*\]\(.*\)$/.test(line)) return { title, description: line };
  }
  return { title, description: '' };
}

export async function analyzeZip(file: File, onProgress?: (progress: AnalyzeProgress) => void): Promise<ProjectMeta> {
  if (!file.name.toLowerCase().endsWith('.zip')) throw new Error('Choose a ZIP archive to analyze.');
  if (file.size > MAX_ZIP) throw new Error('This ZIP is larger than the 5 MB limit.');
  if (file.size === 0) throw new Error('The selected ZIP is empty.');
  onProgress?.({ phase: 'opening', completedFiles: 0, totalFiles: 0 });
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(file, { checkCRC32: false }); }
  catch { throw new Error('This ZIP could not be opened. Check that it is a valid, unencrypted archive.'); }
  const allFiles = Object.values(zip.files).filter((entry) => !entry.dir);
  const rootPrefix = (() => {
    const paths = allFiles.map((entry) => entry.name.split('/').filter(Boolean));
    if (paths.length && paths.every((parts) => parts.length > 1 && parts[0] === paths[0][0])) return `${paths[0][0]}/`;
    return '';
  })();
  const rootFolderName = rootPrefix.replace(/\/$/, '');
  const candidates = allFiles.filter((entry) => {
    const relative = (entry.name.startsWith(rootPrefix) ? entry.name.slice(rootPrefix.length) : entry.name).replace(/^\/+/, '');
    return relative && !SKIP.test(relative) && (TEXT_EXT.test(relative) || /(^|\/)(Dockerfile|Makefile|\.gitignore)$/.test(relative));
  });
  if (candidates.length > MAX_FILES) throw new Error(`This archive has more than ${MAX_FILES} supported files to inspect. The limit is ${MAX_FILES}.`);
  let packageJson: Record<string, unknown> | undefined;
  const kept: string[] = [];
  const notes: string[] = [];
  const readmeFiles: Array<{ path: string; content: string }> = [];
  let lineEstimate = 0;
  onProgress?.({ phase: 'reading', completedFiles: 0, totalFiles: candidates.length });
  for (const [index, entry] of candidates.entries()) {
    let relative = entry.name.startsWith(rootPrefix) ? entry.name.slice(rootPrefix.length) : entry.name;
    relative = relative.replace(/^\/+/, '');
    try {
      if (!relative || SKIP.test(relative)) continue;
      // JSZip exposes uncompressedSize on its internal compressed-data object but
      // omits that internal field from its public TypeScript interface.
      const uncompressedSize = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
      if (typeof uncompressedSize === 'number' && uncompressedSize > MAX_TEXT) {
        notes.push(`Skipped oversized text file: ${relative}`);
        continue;
      }
      const content = await entry.async('string');
      if (content.length > MAX_TEXT || content.includes('\u0000')) { notes.push(`Skipped unsupported or oversized text file: ${relative}`); continue; }
      if (relative.toLowerCase() === 'package.json') {
        try {
          const parsed: unknown = JSON.parse(content);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) packageJson = parsed as Record<string, unknown>;
          else notes.push('A package.json file was present but did not contain a JSON object.');
        } catch { notes.push('A package.json file was present but could not be parsed.'); }
      }
      if (/(^|\/)readme(?:\.(?:md|markdown|txt|rst))?$/i.test(relative) && readmeFiles.length < 5) {
        readmeFiles.push({ path: relative, content });
      }
      kept.push(relative);
      lineEstimate += content ? content.split(/\r\n|\r|\n/).length : 0;
    } catch { notes.push(`Could not read ${relative}; it was skipped.`); }
    finally { onProgress?.({ phase: 'reading', completedFiles: index + 1, totalFiles: candidates.length }); }
  }
  readmeFiles.sort((a, b) => {
    const rootOrder = Number(a.path.includes('/')) - Number(b.path.includes('/'));
    if (rootOrder) return rootOrder;
    const markdownOrder = (path: string) => /\.md$/i.test(path) || /\.markdown$/i.test(path) ? 0 : 1;
    return markdownOrder(a.path) - markdownOrder(b.path) || a.path.localeCompare(b.path);
  });
  const technologies: string[] = [];
  const has = (pattern: RegExp) => kept.some((p) => pattern.test(p));
  if (packageJson) technologies.push('Node.js');
  if (has(/\.tsx?$/)) technologies.push('TypeScript');
  if (has(/\.jsx?$/)) technologies.push('JavaScript');
  if (has(/\.py$/)) technologies.push('Python');
  if (has(/\.go$/)) technologies.push('Go');
  if (has(/\.rs$/)) technologies.push('Rust');
  if (has(/\.java$/)) technologies.push('Java');
  if (has(/\.vue$/)) technologies.push('Vue');
  if (has(/\.svelte$/)) technologies.push('Svelte');
  if (has(/(^|\/)next\.config\./)) technologies.push('Next.js');
  if (has(/(^|\/)vite\.config\./)) technologies.push('Vite');
  if (has(/(^|\/)angular\.json$/)) technologies.push('Angular');
  if (has(/(^|\/)Cargo\.toml$/)) technologies.push('Cargo');
  if (has(/(^|\/)go\.mod$/)) technologies.push('Go modules');
  const dirSet = new Set<string>();
  for (const filePath of kept) {
    const parts = filePath.split('/');
    for (let i = 1; i < parts.length; i++) dirSet.add(parts.slice(0, i).join('/') + '/');
  }
  const tree = [...dirSet].sort().concat(kept.sort()).slice(0, 60);
  const rootPackage = packageJson || {};
  const objList = (v: unknown) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v as Record<string, unknown>) : [];
  const rawScripts = rootPackage.scripts;
  const scripts = rawScripts && typeof rawScripts === 'object' && !Array.isArray(rawScripts)
    ? Object.fromEntries(Object.entries(rawScripts).filter(([, value]) => typeof value === 'string')) as Record<string, string>
    : {};
  if (!packageJson) notes.push('No readable root package.json was found. Package dependencies and scripts could not be determined.');
  if (readmeFiles.length) notes.push(`Detected README file${readmeFiles.length === 1 ? '' : 's'}: ${readmeFiles.map((readme) => readme.path).join(', ')}.`);
  const readmeDetails = readmeFiles[0] ? readmeIntro(readmeFiles[0].content) : { title: '', description: '' };
  const packageName = typeof rootPackage.name === 'string' ? rootPackage.name.trim() : '';
  const packageDescription = typeof rootPackage.description === 'string' ? rootPackage.description.trim() : '';
  const license = typeof rootPackage.license === 'string' ? rootPackage.license.trim() : undefined;
  const rawAuthor = rootPackage.author;
  const author = typeof rawAuthor === 'string'
    ? rawAuthor
    : rawAuthor && typeof rawAuthor === 'object' && !Array.isArray(rawAuthor) && typeof (rawAuthor as Record<string, unknown>).name === 'string'
      ? String((rawAuthor as Record<string, unknown>).name)
      : undefined;
  const rawRepository = rootPackage.repository;
  const repository = typeof rawRepository === 'string'
    ? rawRepository
    : rawRepository && typeof rawRepository === 'object' && !Array.isArray(rawRepository) && typeof (rawRepository as Record<string, unknown>).url === 'string'
      ? String((rawRepository as Record<string, unknown>).url)
      : undefined;
  const projectName = packageName || readmeDetails.title || rootFolderName || 'Untitled project';
  const description = packageDescription || readmeDetails.description;
  if (!kept.length) notes.push('No supported text files were found. The archive may contain only binary or unsupported files.');
  if (!technologies.length) notes.push('No technologies could be identified from the supported files that were inspected.');
  notes.push('Analysis is a lightweight inventory of supported filenames and text. It does not execute source code or perform security scanning.');
  return {
    ...emptyMeta(projectName),
    projectName,
    detectedProjectName: projectName,
    packageName: packageName || undefined,
    description: description || undefined,
    dependencies: objList(rootPackage.dependencies),
    devDependencies: objList(rootPackage.devDependencies),
    scripts,
    license,
    author,
    repository,
    readmeFiles,
    sources: {
      projectName: packageName ? 'package.json' : readmeDetails.title ? readmeFiles[0]?.path : rootFolderName ? 'ZIP root folder' : 'generic fallback',
      description: packageDescription ? 'package.json' : readmeDetails.description ? readmeFiles[0]?.path : undefined,
      dependencies: packageJson && Object.keys(objList(rootPackage.dependencies)).length ? 'package.json' : undefined,
      devDependencies: packageJson && Object.keys(objList(rootPackage.devDependencies)).length ? 'package.json' : undefined,
      scripts: Object.keys(scripts).length ? 'package.json' : undefined,
      license: license ? 'package.json' : undefined,
      author: author ? 'package.json' : undefined,
      repository: repository ? 'package.json' : undefined,
      technologies: technologies.length ? 'package.json, supported filenames, and config files' : undefined,
      readme: readmeFiles[0]?.path,
      structure: 'ZIP file inventory',
    },
    fileCount: kept.length, lineEstimate, tree, technologies, origin: 'zip', notes,
  };
}

export const analyzerLimits = { maxBytes: MAX_ZIP, maxFiles: MAX_FILES };
