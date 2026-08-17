import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { layerNotes } from '../lib/akm.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const indexScript = join(here, '..', 'index.mjs');

test('hierarchical indexes route through child indexes before leaf notes', () => {
  const root = mkdtempSync(join(tmpdir(), 'akm-index-'));
  const layer = join(root, '20-knowledge');
  const topic = join(layer, 'marketing');

  try {
    mkdirSync(topic, { recursive: true });
    writeFileSync(join(layer, 'root-note.md'), '# Root Note\n', 'utf8');
    writeFileSync(join(topic, 'leaf-note.md'), [
      '---',
      'description: "Leaf retrieval hint."',
      '---',
      '# Leaf Note',
      '',
    ].join('\n'), 'utf8');

    const result = spawnSync(process.execPath, [
      indexScript,
      '--write',
      '--hierarchical',
      '--root', root,
      '--layers', '20-knowledge',
    ], { encoding: 'utf8' });

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

    const parent = readFileSync(join(layer, 'INDEX.local.md'), 'utf8');
    const child = readFileSync(join(topic, 'INDEX.local.md'), 'utf8');

    assert.match(parent, /\[marketing\]\(marketing\/INDEX\.local\.md\)/);
    assert.match(parent, /\[\[root-note\]\]/);
    assert.doesNotMatch(parent, /leaf-note/);
    assert.match(child, /\[\[leaf-note\]\] - Leaf retrieval hint\./);
    assert.deepEqual(
      layerNotes(root).map((file) => file.split(/[\\/]/).pop()).sort(),
      ['leaf-note.md', 'root-note.md'],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('hierarchical mode does not create indexes for empty layers', () => {
  const root = mkdtempSync(join(tmpdir(), 'akm-index-empty-'));

  try {
    mkdirSync(join(root, '30-context'), { recursive: true });
    const result = spawnSync(process.execPath, [
      indexScript,
      '--write',
      '--hierarchical',
      '--root', root,
      '--layers', '30-context',
    ], { encoding: 'utf8' });

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /wrote 0 index file\(s\)/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
