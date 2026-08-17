#!/usr/bin/env node
// Generate directory-level AKM indexes for progressive disclosure.
//
// Usage:
//   node scripts/index.mjs --write
//   node scripts/index.mjs --stdout --layers 20-knowledge,70-evaluation
//   node scripts/index.mjs --write --okf ./examples/okf-export

import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import {
  DEFAULT_EXPORT_DIRS,
  firstHeading,
  posixRel,
  readMarkdown,
  walk,
} from './lib/akm.mjs';

const options = parseArgs(process.argv.slice(2));
const indexes = generateIndexes(options.root, options.layers, options.okf, options.hierarchical);

if (options.stdout || !options.write) {
  for (const [rel, content] of indexes.entries()) {
    console.log(`--- ${rel} ---`);
    console.log(content.trimEnd());
  }
}

if (options.write) {
  for (const [rel, content] of indexes.entries()) {
    const dest = join(options.root, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, content, 'utf8');
  }
  console.log(`index: wrote ${indexes.size} index file(s) under ${options.root}`);
}

function parseArgs(args) {
  const parsed = {
    root: process.cwd(),
    layers: DEFAULT_EXPORT_DIRS,
    write: false,
    stdout: false,
    okf: false,
    hierarchical: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--write') parsed.write = true;
    else if (arg === '--stdout') parsed.stdout = true;
    else if (arg === '--okf') parsed.okf = true;
    else if (arg === '--hierarchical') parsed.hierarchical = true;
    else if (arg === '--layers') parsed.layers = args[++i].split(',').map((item) => item.trim()).filter(Boolean);
    else if (arg === '--root') parsed.root = args[++i];
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      parsed.root = arg;
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`Generate directory-level indexes.

Usage:
  node scripts/index.mjs --write
  node scripts/index.mjs --write --hierarchical
  node scripts/index.mjs --stdout --layers 20-knowledge,70-evaluation
  node scripts/index.mjs --write --okf ./examples/okf-export`);
}

function generateIndexes(root, layers, okfMode, hierarchical) {
  if (hierarchical) return generateHierarchicalIndexes(root, layers, okfMode);

  const outputs = new Map();
  for (const layer of layers) {
    const files = walk(join(root, layer)).filter((file) => {
      if (!file.endsWith('.md')) return false;
      const name = file.split('/').pop();
      return name !== 'INDEX.local.md' && name !== 'index.md';
    });
    outputs.set(`${layer}/${okfMode ? 'index.md' : 'INDEX.local.md'}`, renderIndex(root, layer, files, okfMode));
  }
  return outputs;
}

function generateHierarchicalIndexes(root, layers, okfMode) {
  const outputs = new Map();
  const indexName = okfMode ? 'index.md' : 'INDEX.local.md';

  for (const layer of layers) {
    const layerRoot = join(root, layer);
    const files = noteFiles(layerRoot);
    if (files.length === 0) continue;

    const dirs = new Set();
    for (const file of files) {
      let current = dirname(file);
      while (current.startsWith(layerRoot)) {
        dirs.add(current);
        if (current === layerRoot) break;
        current = dirname(current);
      }
    }

    for (const dir of [...dirs].sort()) {
      const directFiles = files.filter((file) => dirname(file) === dir);
      const childDirs = [...dirs].filter((candidate) => dirname(candidate) === dir).sort();
      const relDir = posixRel(root, dir);
      outputs.set(
        `${relDir}/${indexName}`,
        renderHierarchicalIndex(root, layer, dir, directFiles, childDirs, okfMode),
      );
    }
  }

  return outputs;
}

function noteFiles(dir) {
  return walk(dir).filter((file) => {
    if (!file.endsWith('.md')) return false;
    const name = basename(file);
    return name !== 'INDEX.local.md' && name !== 'index.md';
  });
}

function renderHierarchicalIndex(root, layer, dir, files, childDirs, okfMode) {
  const indexName = okfMode ? 'index.md' : 'INDEX.local.md';
  const title = dir === join(root, layer) ? layerTitle(layer) : layerTitle(basename(dir));
  const lines = [
    `# ${title} Index`,
    '',
    okfMode
      ? 'Directory-level entry point for OKF consumers.'
      : 'Hierarchical local entry point for AKM agents. Read child indexes before opening individual notes.',
    '',
  ];

  if (childDirs.length > 0) {
    lines.push('## Sections', '');
    for (const child of childDirs) {
      const name = basename(child);
      lines.push(`- [${layerTitle(name)}](${name}/${indexName})`);
    }
    lines.push('');
  }

  if (files.length > 0) {
    lines.push('## Notes', '');
    for (const file of files.sort()) {
      const rel = posixRel(root, file);
      const { frontmatter } = readMarkdown(file);
      const noteTitle = frontmatter
        ? firstHeading(frontmatter.body) ?? basename(file, '.md')
        : basename(file, '.md');
      const description = frontmatter?.fields.description;
      const link = okfMode ? `[${noteTitle}](/${rel})` : `[[${basename(file, '.md')}]]`;
      lines.push(`- ${link}${description ? ` - ${description}` : ''}`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function renderIndex(root, layer, files, okfMode) {
  const title = layerTitle(layer);
  const lines = [
    `# ${title} Index`,
    '',
    okfMode
      ? 'Directory-level entry point for OKF consumers.'
      : 'Directory-level local entry point for AKM agents. Generated files can stay untracked as INDEX.local.md.',
    '',
  ];

  if (files.length === 0) {
    lines.push('(empty)');
    return `${lines.join('\n')}\n`;
  }

  const byDir = new Map();
  for (const file of files) {
    const rel = posixRel(root, file);
    const subdir = rel.split('/').slice(1, -1).join('/') || '(root)';
    if (!byDir.has(subdir)) byDir.set(subdir, []);
    byDir.get(subdir).push(file);
  }

  for (const [subdir, subdirFiles] of [...byDir.entries()].sort()) {
    lines.push(`## ${subdir}`);
    lines.push('');
    for (const file of subdirFiles.sort()) {
      const rel = posixRel(root, file);
      const { frontmatter } = readMarkdown(file);
      const title = frontmatter ? firstHeading(frontmatter.body) ?? file.split('/').pop().replace(/\.md$/, '') : file.split('/').pop().replace(/\.md$/, '');
      const description = frontmatter?.fields.description;
      const link = okfMode ? `[${title}](/${rel})` : `[[${file.split('/').pop().replace(/\.md$/, '')}]]`;
      lines.push(`- ${link}${description ? ` - ${description}` : ''}`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function layerTitle(layer) {
  return layer.replace(/^\d+-/, '').replace(/-/g, ' ');
}
