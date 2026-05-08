// noinspection HtmlRequiredLangAttribute,HtmlRequiredTitleElement

import { describe, it, expect } from 'vitest';
import { HtmlPalaceParser } from '../src/js/modules/HtmlPalaceParser.js';

// Minimal palace HTML fixture matching the real format
const palaceHtml = `<!DOCTYPE html>
<html lang="ro">
<head><title>Palatul Memoriei – Ioan 16</title></head>
<body>
<header>
  <h1>🏛️ Palatul Memoriei — Ioan 16</h1>
  <p>33 Stații · O stație per verset · Complex de Biserică</p>
</header>
<div class="map-banner">
  <strong>Locul:</strong> Un complex de biserică. Parcurge traseul de 5 ori mental.
</div>
<div class="palace-path">
  <span class="path-step">1. Poartă</span><span class="path-arrow">›</span>
  <span class="path-step">2. Alee</span>
</div>
<div class="stations">
  <div class="zone-header">⛪ Zona 1 — Exteriorul (Versete 1–2)</div>
  <div class="station">
    <div class="station-header">
      <div class="station-num">1</div>
      <div>
        <div class="station-title">🚪 Poarta Exterioară</div>
        <div class="station-verse-ref">Ioan 16:1</div>
      </div>
    </div>
    <div class="station-body">
      <div class="image-box">
        <div class="label">🎨 Imaginea</div>
        <p>La poartă, cineva se <strong>împiedică și cade</strong>.</p>
      </div>
      <div class="senses">
        <span class="sense-tag">💪 Kinestezic: poticneala</span>
        <span class="sense-tag">👂 Auditiv: bufnitura</span>
      </div>
      <div class="verse-box">
        <div class="verse-ref">16:1</div>
        <div class="verse-text">„V-am spus aceste lucruri pentru ca ele să nu fie un <span class="kw">prilej de cădere</span>."</div>
      </div>
    </div>
  </div>
  <div class="station">
    <div class="station-header">
      <div class="station-num">2</div>
      <div>
        <div class="station-title">🌳 Aleea de Intrare</div>
        <div class="station-verse-ref">Ioan 16:2</div>
      </div>
    </div>
    <div class="station-body">
      <div class="image-box">
        <div class="label">🎨 Imaginea</div>
        <p>Pe alee, un portar aruncă pe cineva afară.</p>
      </div>
      <div class="senses">
        <span class="sense-tag">👁 Vizual: panoul</span>
      </div>
      <div class="verse-box">
        <div class="verse-ref">16:2</div>
        <div class="verse-text">„Au să vă dea <span class="kw">afară din sinagogi</span>."</div>
      </div>
    </div>
  </div>
  <div class="zone-header">🕯️ Zona 2 — Interiorul (Versete 3–4)</div>
  <div class="station">
    <div class="station-header">
      <div class="station-num">3</div>
      <div>
        <div class="station-title">🪜 Treptele</div>
        <div class="station-verse-ref">Ioan 16:3</div>
      </div>
    </div>
    <div class="station-body">
      <div class="image-box"><div class="label">🎨 Imaginea</div><p>Pe trepte.</p></div>
      <div class="senses"><span class="sense-tag">👁 Vizual</span></div>
      <div class="verse-box">
        <div class="verse-ref">16:3</div>
        <div class="verse-text">„Se vor purta astfel pentru că <span class="kw">nu L-au cunoscut</span>."</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

describe('HtmlPalaceParser', () => {
  describe('parse', () => {
    const palace = HtmlPalaceParser.parse(palaceHtml, 'palace.html');

    it('extracts the palace name from the title', () => {
      expect(palace.name).toBe('Ioan 16');
    });

    it('extracts book and chapter', () => {
      expect(palace.book).toBe('Ioan');
      expect(palace.chapter).toBe('16');
    });

    it('extracts station count from subtitle', () => {
      expect(palace.stations).toBe(33);
    });

    it('extracts all detailed stations from HTML', () => {
      expect(palace.detailedStations).toHaveLength(3);
    });

    it('extracts path steps', () => {
      expect(palace.path.length).toBe(2);
      expect(palace.path[0]).toContain('Poartă');
    });

    it('extracts zone headers', () => {
      expect(palace.zones.length).toBe(2);
      expect(palace.zones[0]).toContain('Zona 1');
      expect(palace.zones[1]).toContain('Zona 2');
    });

    it('assigns zone to each station', () => {
      expect(palace.detailedStations[0].zone).toContain('Zona 1');
      expect(palace.detailedStations[1].zone).toContain('Zona 1');
      expect(palace.detailedStations[2].zone).toContain('Zona 2');
    });

    it('preserves station structure', () => {
      const first = palace.detailedStations[0];
      expect(first.number).toBe(1);
      expect(first.title).toBeTruthy();
      expect(first.verses).toContain('16:1');
    });

    it('extracts imageHtml for stations', () => {
      const first = palace.detailedStations[0];
      expect(first.imageHtml).toBeTruthy();
      expect(first.imageHtml.length).toBeGreaterThan(0);
    });

    it('extracts senses for stations', () => {
      const first = palace.detailedStations[0];
      expect(first.senses).toBeInstanceOf(Array);
      expect(first.senses.length).toBeGreaterThan(0);
    });

    it('extracts verseBlocks with ref and text', () => {
      const first = palace.detailedStations[0];
      expect(first.verseBlocks).toBeInstanceOf(Array);
      expect(first.verseBlocks.length).toBeGreaterThan(0);
      expect(first.verseBlocks[0].ref).toBeTruthy();
      expect(first.verseBlocks[0].text).toBeTruthy();
    });

    it('extracts keyword highlights from verse text', () => {
      const first = palace.detailedStations[0];
      expect(first.keywords.length).toBeGreaterThan(0);
    });

    it('marks sourceFormat as html', () => {
      expect(palace.sourceFormat).toBe('html');
    });

    it('includes tags for filtering', () => {
      expect(palace.tags).toContain('Ioan');
      expect(palace.tags).toContain('HTML Import');
    });
  });

  describe('isPalaceHtml', () => {
    it('returns true for palace HTML content', () => {
      expect(HtmlPalaceParser.isPalaceHtml(palaceHtml)).toBe(true);
    });

    it('returns false for JSON content', () => {
      expect(HtmlPalaceParser.isPalaceHtml('{"name": "test"}')).toBe(false);
    });

    // noinspection HtmlRequiredLangAttribute
    it('returns false for random HTML', () => {
      expect(HtmlPalaceParser.isPalaceHtml('<htm' + 'l lang="en"><body>hello</body></html>')).toBe(
        false,
      );
    });
  });

  describe('location from map banner', () => {
    it('extracts location from map banner when subtitle has no location', () => {
      // Subtitle only has station count (numbers + stați), no location text
      const html = `<!DOCTYPE html><html lang="ro"><head><title>Palatul Memoriei – Test 1</title></head><body>
<header>
  <h1>🏛️ Palatul Memoriei — Test 1</h1>
  <p>10 Stații</p>
</header>
<div class="map-banner">
  <strong>Locul:</strong> O piață centrală. Parcurge traseul mental.
</div>
<div class="stations">
  <div class="station">
    <div class="station-header">
      <div class="station-num">1</div>
      <div><div class="station-title">Test Station</div><div class="station-verse-ref">Test 1:1</div></div>
    </div>
    <div class="station-body"><div class="verse-box"><div class="verse-ref">Test 1:1</div><p>Verse text</p></div></div>
  </div>
</div>
</body></html>`;
      const result = HtmlPalaceParser.parse(html, 'test.html');
      expect(result.location).toBe('O piață centrală');
    });
  });
});
