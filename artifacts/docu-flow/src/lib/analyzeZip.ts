import JSZip from 'jszip';
import { emptyMeta, type ProjectMeta } from './docu';

const MAX_ZIP = 5 * 1024 * 1024;
const MAX_FILES = 100;
const MAX_TEXT = 256 * 1024;
const SKIP = /(^|\/)(node_modules|dist|build|\.git)(\/|$)/i;
const TEXT_EXT = /\.(?:ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|swift|rb|php|html|css|scss|json|md|mdx|txt|yml|yaml|toml|sh|sql|xml|svg|vue|svelte|astro|gitignore|dockerfile)$/i;

export async function analyzeZip(file: File): Promise<ProjectMeta> {
  if (!file.name.toLowerCase().endsWith('.zip')) throw new Error('Choose a ZIP archive to analyze.');
  if (file.size > MAX_ZIP) throw new Error('This ZIP is larger than the 5 MB limit.');
  if (file.size === 0) throw new Error('The selected ZIP is empty.');
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(file, { checkCRC32: false }); }
  catch { throw new Error('This ZIP could not be opened. Check that it is a valid, unencrypted archive.'); }
  const allFiles = Object.values(zip.files).filter((entry) => !entry.dir);
  const rootPrefix = (() => {
    const paths = allFiles.map((entry) => entry.name.split('/').filter(Boolean));
    if (paths.length && paths.every((parts) => parts.length > 1 && parts[0] === paths[0][0])) return `${paths[0][0]}/`;
    return '';
  })();
  const candidates = allFiles.filter((entry) => {
    const relative = (entry.name.startsWith(rootPrefix) ? entry.name.slice(rootPrefix.length) : entry.name).replace(/^\/+/, '');
    return relative && !SKIP.test(relative) && (TEXT_EXT.test(relative) || /(^|\/)(Dockerfile|Makefile|\.gitignore)$/.test(relative));
  });
  if (candidates.length > MAX_FILES) throw new Error(`This archive has more than ${MAX_FILES} supported files to inspect. The limit is ${MAX_FILES}.`);
  let packageJson: Record<string, unknown> | undefined;
  const kept: string[] = [];
  const notes: string[] = [];
  let lineEstimate = 0;
  for (const entry of candidates) {
    let relative = entry.name.startsWith(rootPrefix) ? entry.name.slice(rootPrefix.length) : entry.name;
    relative = relative.replace(/^\/+/, '');
    if (!relative || SKIP.test(relative)) continue;
    // JSZip exposes uncompressedSize on its internal compressed-data object but
    // omits that internal field from its public TypeScript interface.
    const uncompressedSize = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
    if (typeof uncompressedSize === 'number' && uncompressedSize > MAX_TEXT) {
      notes.push(`Skipped oversized text file: ${relative}`);
      continue;
    }
    try {
      const content = await entry.async('string');
      if (content.length > MAX_TEXT || content.includes('\u0000')) { notes.push(`Skipped unsupported or oversized text file: ${relative}`); continue; }
      if (relative === 'package.json') {
        try {
          const parsed: unknown = JSON.parse(content);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) packageJson = parsed as Record<string, unknown>;
          else notes.push('A package.json file was present but did not contain a JSON object.');
        } catch { notes.push('A package.json file was present but could not be parsed.'); }
      }
      kept.push(relative);
      lineEstimate += content ? content.split(/\r\n|\r|\n/).length : 0;
    } catch { notes.push(`Could not read ${relative}; it was skipped.`); }
  }
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
  const scripts = rawScripts && typeof rawScripts === 'object' && !Array.isArray(rawScripts) ? rawScripts as Record<string, string> : {};
  if (!packageJson) notes.push('No readable root package.json was found. Package dependencies and scripts could not be determined.');
  const pkgName = typeof rootPackage.name === 'string' ? rootPackage.name : '';
  if (!kept.length) notes.push('No supported text files were found. The archive may contain only binary or unsupported files.');
  if (!technologies.length) notes.push('No technologies could be identified from the supported files that were inspected.');
  notes.push('Analysis is a lightweight inventory of supported filenames and text. It does not execute source code or perform security scanning.');
  return {
    ...emptyMeta(pkgName || file.name.replace(/\.zip$/i, '')),
    projectName: pkgName || file.name.replace(/\.zip$/i, ''),
    packageName: pkgName || undefined,
    description: typeof rootPackage.description === 'string' ? rootPackage.description : undefined,
    dependencies: objList(rootPackage.dependencies),
    devDependencies: objList(rootPackage.devDependencies),
    scripts, fileCount: kept.length, lineEstimate, tree, technologies, origin: 'zip', notes,
  };
}

export const analyzerLimits = { maxBytes: MAX_ZIP, maxFiles: MAX_FILES };
