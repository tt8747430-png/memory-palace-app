/**
 * @file Type definitions for the Memory Palace app.
 *
 * These JSDoc typedefs provide IDE autocompletion and type-checking
 * across all modules without requiring TypeScript.
 */

/**
 * @typedef {Object} Palace
 * @property {string} id - Unique identifier (timestamp + random suffix)
 * @property {string} name - Palace display name (e.g. "Ioan 16")
 * @property {string} location - Physical/mental location theme
 * @property {string} [description] - Brief description
 * @property {string} [book] - Book/category (e.g. "Ioan")
 * @property {string} [chapter] - Chapter/section (e.g. "16")
 * @property {number} [stations] - Number of stations
 * @property {number} [verses] - Number of verses/items
 * @property {string[]} [tags] - Categorization tags
 * @property {string} [notes] - Additional notes
 * @property {string[]} [connections] - IDs of connected palaces
 * @property {string[]} [path] - Ordered path step labels
 * @property {DetailedStation[]} [detailedStations] - Full station data
 * @property {string[]} [zones] - Zone header labels (HTML imports)
 * @property {string} [howToHtml] - Instructional HTML (HTML imports)
 * @property {'html'} [sourceFormat] - Source format marker
 * @property {string} [createdAt] - ISO timestamp
 * @property {string} [updatedAt] - ISO timestamp
 * @property {string} [importedAt] - ISO timestamp
 */

/**
 * @typedef {Object} DetailedStation
 * @property {number} number - Station order number
 * @property {string} title - Station title with emoji
 * @property {string} [verses] - Verse reference (e.g. "Ioan 16:1")
 * @property {string} [summary] - Plain-text image description
 * @property {string} [image] - Legacy image field (alias of summary)
 * @property {string} [imageHtml] - Rich HTML image description (HTML imports)
 * @property {string} [imageLabel] - Image box label (HTML imports)
 * @property {string[]} [senses] - Multi-sensory tags (HTML imports)
 * @property {VerseBlock[]} [verseBlocks] - Structured verse data (HTML imports)
 * @property {string[]} [keywords] - Keyword cues
 * @property {string} [zone] - Zone group this station belongs to
 */

/**
 * @typedef {Object} VerseBlock
 * @property {string} ref - Verse reference (e.g. "16:1")
 * @property {string} text - Plain-text verse content
 * @property {string} [html] - HTML verse content with keyword highlights
 */

/**
 * @typedef {Object} PracticeData
 * @property {string|null} lastPracticed - ISO timestamp of last practice
 * @property {number} practiceCount - Total number of sessions
 * @property {number} streak - Current consecutive-day streak
 * @property {number} mastery - Rolling average score (0-100)
 * @property {Object<string, StationProgress>} stationProgress - Per-station stats
 * @property {PracticeHistoryEntry[]} history - Recent session history (max 25)
 * @property {number} lastScore - Most recent session score
 * @property {number} bestScore - All-time best score
 */

/**
 * @typedef {Object} StationProgress
 * @property {number} correct - Times answered correctly
 * @property {number} total - Times attempted
 */

/**
 * @typedef {Object} PracticeHistoryEntry
 * @property {string} practicedAt - ISO timestamp
 * @property {number} score - Session score (0-100)
 * @property {number} totalQuestions - Questions in session
 * @property {number} correctAnswers - Correct answers count
 * @property {string} mode - Session mode ('quiz', 'quick-review')
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether data passed validation
 * @property {string[]} errors - List of error messages
 */

export {};
