#!/usr/bin/env node
/**
 * docs/ai/ 소스 파일로부터 각 AI 도구 전용 지침 파일을 생성한다.
 *
 * 출력:
 *   CLAUDE.md      — Claude Code
 *   AGENTS.md      — OpenAI Codex CLI
 *   .cursorrules   — Cursor
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AI_DIR = join(ROOT, 'docs', 'ai');

function read(filename) {
  return readFileSync(join(AI_DIR, filename), 'utf8').trim();
}

function write(filename, content) {
  writeFileSync(join(ROOT, filename), content + '\n', 'utf8');
  console.log(`✓ ${filename}`);
}

const shared = read('shared.md');
const claudeExtra = read('claude-extra.md');
const codexExtra = read('codex-extra.md');
const cursorExtra = read('cursor-extra.md');

const header = (tool, extraFile) =>
  `<!-- AUTO-GENERATED — DO NOT EDIT DIRECTLY -->\n` +
  `<!-- Source: docs/ai/shared.md + docs/ai/${extraFile} -->\n` +
  `<!-- Edit source files, then run: npm run ai:sync -->\n`;

write(
  'CLAUDE.md',
  `${header('Claude Code', 'claude-extra.md')}\n${shared}\n\n${claudeExtra}`,
);

write(
  'AGENTS.md',
  `${header('Codex CLI', 'codex-extra.md')}\n${shared}\n\n${codexExtra}`,
);

write(
  '.cursorrules',
  `${header('Cursor', 'cursor-extra.md')}\n${shared}\n\n${cursorExtra}`,
);
