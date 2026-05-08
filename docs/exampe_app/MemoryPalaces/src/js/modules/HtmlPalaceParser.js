/**
 * HtmlPalaceParser - Parses palace HTML files into the app's JSON data structure,
 * preserving rich content (images, senses, verse blocks with keyword highlights).
 */
export class HtmlPalaceParser {
  /**
   * Parse an HTML string into a palace data object.
   * @param {string} htmlContent - Raw HTML string of a palace file
   * @param {string} [fileName] - Original file name for metadata
   * @returns {Object} Palace data compatible with PalaceManager
   */
  static parse(htmlContent, fileName = '') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // --- Palace-level metadata ---
    const titleEl = doc.querySelector('header h1');
    const rawTitle = titleEl?.textContent?.replace(/🏛️/g, '').replace(/—/g, '-').trim() || '';

    const subtitleEl = doc.querySelector('header p');
    const subtitle = subtitleEl?.textContent || '';

    // Parse "33 Stații · O stație per verset · Complex de Biserică" or
    //        "Ioan 16 · Traseul prin Biserică · 17 Stații, 33 Versete"
    const subtitleParts = subtitle.split('·').map((s) => s.trim());

    // Try to extract book/chapter from title "Palatul Memoriei — Ioan 16"
    let book = '';
    let chapter = '';
    const titleMatch = rawTitle.match(/[-–—]\s*(.+)$/);
    if (titleMatch) {
      const parts = titleMatch[1].trim().split(/\s+/);
      book = parts[0] || '';
      chapter = parts.slice(1).join(' ') || '';
    }

    // Station/verse counts from subtitle
    let stationCount = 0;
    let verseCount = 0;
    for (const part of subtitleParts) {
      const stMatch = part.match(/(\d+)\s*Stații/i);
      const vsMatch = part.match(/(\d+)\s*Versete?/i);
      if (stMatch) stationCount = parseInt(stMatch[1]);
      if (vsMatch) verseCount = parseInt(vsMatch[1]);
    }

    // Location from subtitle or banner
    let location = '';
    // Check if last subtitle part looks like a location (not a count)
    const lastPart = subtitleParts[subtitleParts.length - 1] || '';
    if (lastPart && !/\d/.test(lastPart) && !/stați/i.test(lastPart)) {
      location = lastPart;
    }

    // Map banner
    const bannerEl = doc.querySelector('.map-banner');
    const mapBanner = bannerEl?.textContent?.trim() || '';
    const locMatch = mapBanner.match(/Locul[^:]*:\s*(.+?)(?:\.|Parcurge)/s);
    if (locMatch && !location) {
      location = locMatch[1].trim();
    }

    // --- Path steps ---
    const pathSteps = Array.from(doc.querySelectorAll('.path-step')).map((el) =>
      el.textContent.trim(),
    );

    // --- Zone headers ---
    const zones = Array.from(doc.querySelectorAll('.zone-header')).map((el) =>
      el.textContent.trim(),
    );

    // Build a map: for each station element, determine its zone
    const stationZoneMap = this._buildStationZoneMap(doc);

    // --- Detailed stations ---
    const stationElements = doc.querySelectorAll('.station');
    const detailedStations = [];

    stationElements.forEach((stationEl, idx) => {
      const num = stationEl.querySelector('.station-num')?.textContent?.trim();
      const title = stationEl.querySelector('.station-title')?.textContent?.trim();
      const verseRef = stationEl.querySelector('.station-verse-ref')?.textContent?.trim() || '';

      // Image box — preserve inner HTML for rich rendering
      const imageBoxEl = stationEl.querySelector('.image-box');
      const imageLabel = imageBoxEl?.querySelector('.label')?.textContent?.trim() || '';
      const imageParagraph = imageBoxEl?.querySelector('p');
      const imageHtml = imageParagraph?.innerHTML?.trim() || '';
      const imagePlain = imageParagraph?.textContent?.trim() || '';

      // Senses
      const senses = Array.from(stationEl.querySelectorAll('.sense-tag')).map((el) =>
        el.textContent.trim(),
      );

      // Verse blocks
      const verseBoxes = Array.from(stationEl.querySelectorAll('.verse-box'));
      const verseBlocks = verseBoxes.map((box) => {
        const ref = box.querySelector('.verse-ref')?.textContent?.trim() || '';
        const textEl = box.querySelector('.verse-text');
        return {
          ref,
          text: textEl?.textContent?.trim() || '',
          html: textEl?.innerHTML?.trim() || '',
        };
      });

      // Extract keywords from verse text <span class="kw"> elements
      const kwElements = stationEl.querySelectorAll('.kw');
      const keywords = Array.from(kwElements).map((el) => el.textContent.trim());

      // Skip "how-to" sections if somehow wrapped in .station
      if (title?.includes('Cum Să Folosești')) return;

      detailedStations.push({
        number: parseInt(num) || idx + 1,
        title: title || `Station ${idx + 1}`,
        verses: verseRef,
        summary: imagePlain,
        imageHtml: imageHtml,
        imageLabel: imageLabel || '🎨 Imaginea',
        senses: senses,
        verseBlocks: verseBlocks,
        keywords: keywords.length > 0 ? [...new Set(keywords)] : [],
        zone: stationZoneMap.get(idx) || '',
      });
    });

    // --- How-to section ---
    const howToEl = doc.querySelector('.how-to .how-to-body');
    const howToHtml = howToEl?.innerHTML?.trim() || '';

    // --- Build palace object ---
    const name = (book && chapter ? `${book} ${chapter}` : rawTitle) || 'Imported Palace';

    return {
      name,
      location: location || 'Unknown Location',
      description: rawTitle || `Palatul memoriei pentru ${name}${location ? ' - ' + location : ''}`,
      book,
      chapter,
      stations: stationCount || detailedStations.length,
      verses: verseCount || detailedStations.length,
      tags: [book, 'Scripture', 'Bible Memory', 'HTML Import'].filter(Boolean),
      notes: mapBanner || `Imported from ${fileName}`,
      path: pathSteps,
      detailedStations,
      connections: [],
      zones,
      howToHtml,
      sourceFormat: 'html',
    };
  }

  /**
   * Build a map from station index -> zone header text.
   * Zone headers are siblings of .station elements inside .stations container.
   */
  static _buildStationZoneMap(doc) {
    const map = new Map();
    const container = doc.querySelector('.stations');
    if (!container) return map;

    let currentZone = '';
    let stationIdx = 0;

    for (const child of container.children) {
      if (child.classList.contains('zone-header')) {
        currentZone = child.textContent.trim();
      } else if (child.classList.contains('station')) {
        map.set(stationIdx, currentZone);
        stationIdx++;
      }
    }

    return map;
  }

  /**
   * Check if a string looks like palace HTML content.
   */
  static isPalaceHtml(text) {
    return (
      text.includes('class="station"') ||
      text.includes('class="station-header"') ||
      text.includes('class="palace-path"')
    );
  }
}
