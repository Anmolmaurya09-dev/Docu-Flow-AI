import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import {
  applyProjectName,
  buildPackReadme,
  buildReadmeDraft,
  buildStructureSummary,
  createDocs,
  formatMarkdown,
  starterInstallationGuide,
  starterOnboardingGuide,
} from '../src/lib/docu.ts';
import { analyzeZip } from '../src/lib/analyzeZip.ts';

async function zipFile(name, entries) {
  const zip = new JSZip();
  for (const [path, contents] of Object.entries(entries)) zip.file(path, contents);
  const bytes = await zip.generateAsync({ type: 'uint8array' });
  return new File([bytes], name, { type: 'application/zip' });
}

test('Markdown tidy spaces headings, collapses prose whitespace, and compresses blank lines', () => {
  const input = [
    '##Features',
    '',
    '',
    '',
    'This   paragraph   has   repeated    spaces.',
    'A second   line.',
    '',
    '',
    '###  Details',
  ].join('\n');

  assert.equal(formatMarkdown(input), [
    '## Features',
    '',
    'This paragraph has repeated spaces.',
    'A second line.',
    '',
    '### Details',
  ].join('\n'));
});

test('Markdown tidy preserves fenced and indented code content exactly', () => {
  const input = [
    'Before   the example.',
    '',
    '```js',
    'const  value = "keep   these spaces";',
    '',
    '\tconsole.log(value);',
    '```',
    '',
    '    const   indented =  1;',
    '',
    '    keep   this line',
    '',
    'After   the example.',
  ].join('\n');

  assert.equal(formatMarkdown(input), [
    'Before the example.',
    '',
    '```js',
    'const  value = "keep   these spaces";',
    '',
    '\tconsole.log(value);',
    '```',
    '',
    '    const   indented =  1;',
    '',
    '    keep   this line',
    '',
    'After the example.',
  ].join('\n'));
});

test('Markdown tidy retains list, quote, link, inline-code, table, and reference syntax', () => {
  const input = [
    '>    Quoted   words',
    '-   first    item',
    '1.   second   item',
    'Outside   [a  link label](https://example.test/path) and `code   stays`.',
    '',
    '| A   | B |',
    '| --- | --- |',
    '| x   | y |',
    '[ref]: https://example.test/  "title"',
  ].join('\n');

  assert.equal(formatMarkdown(input), [
    '> Quoted words',
    '- first item',
    '1. second item',
    'Outside [a  link label](https://example.test/path) and `code   stays`.',
    '',
    '| A   | B |',
    '| --- | --- |',
    '| x   | y |',
    '[ref]: https://example.test/  "title"',
  ].join('\n'));
});

test('ZIP metadata takes the project name from package.json before README and root folder', async () => {
  const meta = await analyzeZip(await zipFile('archive.zip', {
    'workspace-folder/package.json': JSON.stringify({
      name: 'manifest-name',
      description: 'Verified summary',
      dependencies: { react: '^19.0.0' },
      scripts: { test: 'vitest run' },
    }),
    'workspace-folder/README.md': '# README heading\n\nREADME description.',
    'workspace-folder/src/main.ts': 'export const ready = true;',
  }));

  assert.equal(meta.projectName, 'manifest-name');
  assert.equal(meta.detectedProjectName, 'manifest-name');
  assert.equal(meta.sources.projectName, 'package.json');
  assert.equal(meta.description, 'Verified summary');
  assert.deepEqual(meta.dependencies, ['react']);
  assert.deepEqual(meta.scripts, { test: 'vitest run' });
});

test('ZIP metadata falls back to its shared root folder name', async () => {
  const meta = await analyzeZip(await zipFile('archive.zip', {
    'internal-tool/src/main.ts': 'export const ready = true;',
  }));

  assert.equal(meta.projectName, 'internal-tool');
  assert.equal(meta.sources.projectName, 'ZIP root folder');
});

test('ZIP metadata uses a generic fallback when it has no project-name source', async () => {
  const meta = await analyzeZip(await zipFile('archive.zip', {
    'src/main.ts': 'export const ready = true;',
    'assets/logo.png': '\u0000binary-placeholder',
  }));

  assert.equal(meta.projectName, 'Untitled project');
  assert.equal(meta.sources.projectName, 'generic fallback');
});

test('custom project name is trimmed, consistently used in generated docs, and blank restores detection', async () => {
  const detected = await analyzeZip(await zipFile('archive.zip', {
    'internal-tool/src/main.ts': 'export const ready = true;',
  }));
  const named = applyProjectName(detected, '  Renamed Tool  ');
  const readme = buildReadmeDraft(named, { projectName: named.projectName });
  const packReadme = buildPackReadme(named);
  const structure = buildStructureSummary(named);
  const docs = createDocs(named, {
    readme: packReadme,
    install: starterInstallationGuide(),
    gettingStarted: starterOnboardingGuide(),
    structure,
  });

  assert.equal(named.projectName, 'Renamed Tool');
  assert.equal(named.sources.projectName, 'your input');
  assert.match(readme, /^# Renamed Tool/m);
  assert.match(packReadme, /^# Renamed Tool/m);
  assert.match(docs.install, /^# Installation guide: Renamed Tool/m);
  assert.match(docs.gettingStarted, /^# Getting started: Renamed Tool/m);
  assert.match(docs.structure, /^# Project structure summary: Renamed Tool/m);

  const restored = applyProjectName(named, ' \t ');
  assert.equal(restored.projectName, 'internal-tool');
  assert.equal(restored.sources.projectName, 'ZIP root folder');
});

test('blank custom name keeps generic fallback provenance', async () => {
  const generic = await analyzeZip(await zipFile('archive.zip', {
    'src/main.ts': 'export const ready = true;',
    'assets/logo.png': '\u0000binary-placeholder',
  }));

  const restored = applyProjectName(applyProjectName(generic, 'Custom'), '');
  assert.equal(restored.projectName, 'Untitled project');
  assert.equal(restored.sources.projectName, 'generic fallback');
});
