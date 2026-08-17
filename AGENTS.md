# AKM - Codex Operating Instructions

This repository is the Codex operating and knowledge layer for the owner. Codex is the only active agent runtime. Generic adapters and compatibility files remain available but are not part of the default read path.

## Startup and retrieval

- At the start of knowledge, context, or procedure work, read `99-system/INDEX.md`, `99-system/INDEX.local.md` when present, and all files in `40-memory/`.
- For Alleyhair work, read `00-inbox/codex-alleyhair-operating-profile-20260817/README.md` and then only the linked context or procedure needed for the task.
- Retrieve progressively: root index -> layer index -> topic index -> target note. Do not load an entire layer. If the indexes do not produce a candidate, use `rg` over filenames, frontmatter descriptions, tags, and then bodies.
- Treat generated `INDEX.local.md` files as disposable routing views. Canonical knowledge remains in Markdown notes and original sources.

## Source boundary

- `D:\heirshop` is the authoritative external source store for Alleyhair originals such as field notes, photos, and existing publication material.
- `D:\akm` stores pointers, context, reusable knowledge, procedures, content state, verification, and selected outputs. Do not copy or move the full external source library into AKM unless the user explicitly asks.
- Never modify originals in `10-sources/` or external source originals.

## Writing and execution

- Before saving, follow `99-system/ROUTER.md`. New notes and intake land in `00-inbox/` first and stay there for up to 7 days. Explicit archival originals may go to `10-sources/`; reproducible run logs may go to `60-actions/runs/`.
- For bounded artifact-producing work, copy `99-system/templates/task-contract.md` and pass `node scripts/lint.mjs --task-contract <contract>` before implementation.
- For Alleyhair content, maintain one canonical content record and link every Instagram, Naver Blog, Naver Place, or website variant from it. Do not duplicate the canonical body across platform folders.
- Keep human approval before publication. Record publication URL and date once in the canonical content record, then Learn Back only reusable corrections.
- Before marking durable, public, or high-stakes work complete, apply the tier in `99-system/VERIFICATION.md`.
- On failure or repeated mistakes, follow `99-system/LOOP.md`: record the recurring issue under `70-evaluation/` and fix the designated layer.
- Update `99-system/INDEX.md` or `99-system/INDEX.local.md` when notes are added or removed, and append one concise line to `99-system/LOG.md` for meaningful changes.
- New managed notes follow `99-system/SCHEMA.md`; never store secret values.

## Local indexing

- Generate hierarchical local indexes with:
  `node scripts/index.mjs --write --hierarchical --layers 20-knowledge,30-context,50-procedures,60-actions,70-evaluation,80-outputs`
- Parent indexes point to child indexes; leaf indexes list individual notes. Empty directories do not receive generated indexes.
