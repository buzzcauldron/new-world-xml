/**
 * Golden Page XML checks for migration safety.
 * "Open" = read committed example; "edit" = textual replace; "save" = round-trip well-formedness via xmllint when available.
 * Full editor round-trip belongs in future E2E tests.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const goldenPath = join(repoRoot, 'examples', 'lorem.xml');

function hasXmllint() {
  try {
    execFileSync('xmllint', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const xmllintOk = hasXmllint();

describe('golden Page XML (examples/lorem.xml)', () => {
  let xml;

  beforeAll(() => {
    xml = readFileSync(goldenPath, 'utf8');
  });

  it('reads fixture and contains expected PAGE structure', () => {
    expect(xml).toMatch(/^<\?xml/);
    expect(xml).toContain(
      '<PcGts xmlns="http://schema.primaresearch.org/PAGE/gts/pagecontent/2013-07-15">'
    );
    expect(xml).toContain('<Page id="pg1"');
    expect(xml).toContain('imageFilename="lorem.png"');
    expect(xml).toContain('<TextLine id="r1_l1"');
    expect(xml).toContain('<Unicode>Lorem ipsum</Unicode>');
  });

  it.skipIf(!xmllintOk)('original file validates as well-formed XML (xmllint)', () => {
    execFileSync('xmllint', ['--noout', goldenPath], { stdio: 'pipe' });
  });

  it.skipIf(!xmllintOk)(
    'simulated edit: Unicode line change stays well-formed (xmllint)',
    () => {
      const edited = xml.replace(
        '<Unicode>Lorem ipsum</Unicode>',
        '<Unicode>Lorem ipsum — edited</Unicode>'
      );
      expect(edited).not.toBe(xml);
      const dir = mkdtempSync(join(tmpdir(), 'vpe-golden-'));
      const tmp = join(dir, 'edited.xml');
      try {
        writeFileSync(tmp, edited, 'utf8');
        execFileSync('xmllint', ['--noout', tmp], { stdio: 'pipe' });
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  );
});
