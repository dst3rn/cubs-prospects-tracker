import axios from 'axios';
import * as cheerio from 'cheerio';

const CURRENT_YEAR = new Date().getFullYear();

// Wikipedia page for the current ceremony
// The 98th Academy Awards would be for 2026, 97th for 2025, etc.
const CEREMONY_NUMBER = CURRENT_YEAR - 1928;
const WIKI_URL = `https://en.wikipedia.org/wiki/${CEREMONY_NUMBER}th_Academy_Awards`;

/**
 * Scrapes Wikipedia's Academy Awards page for announced winners.
 * On Wikipedia, winners are displayed in BOLD within category sections.
 * Returns a Map of { category: winnerName }.
 */
export async function scrapeWinners() {
  const winners = new Map();

  try {
    const { data: html } = await axios.get(WIKI_URL, {
      headers: {
        'User-Agent': 'OscarNotifier/1.0 (educational project)',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);

    // Wikipedia lists Oscar winners/nominees in tables with class "wikitable"
    // The winner's name is wrapped in <b> or <strong> tags
    $('table.wikitable').each((_, table) => {
      const rows = $(table).find('tr');
      let currentCategory = '';

      rows.each((_, row) => {
        const cells = $(row).find('td, th');

        // Category headers span rows — grab the category from th or first td
        const headerCell = $(row).find('th');
        if (headerCell.length > 0) {
          const catText = headerCell.first().text().trim();
          if (catText && !catText.toLowerCase().includes('category') && !catText.toLowerCase().includes('film')) {
            currentCategory = catText;
          }
        }

        // Some pages use a different layout with category in first td
        if (cells.length >= 1) {
          const firstCell = cells.first();
          if (firstCell.attr('rowspan')) {
            currentCategory = firstCell.text().trim();
          }
        }

        // Find bold text — that's the winner
        const boldElements = $(row).find('b, strong');
        boldElements.each((_, bold) => {
          const winnerText = $(bold).text().trim();
          if (winnerText && currentCategory && winnerText.length > 1) {
            // Skip if this is a header row
            if (winnerText.toLowerCase() === 'winner' || winnerText.toLowerCase() === 'category') return;
            winners.set(currentCategory, winnerText);
          }
        });
      });
    });

    // Also check for winners in list format (some Wikipedia pages use <ul> lists)
    // Pattern: heading followed by a list where winner is bold
    $('h3, h2').each((_, heading) => {
      const category = $(heading).find('.mw-headline').text().trim();
      if (!category) return;

      const nextList = $(heading).nextAll('ul').first();
      if (nextList.length === 0) return;

      const boldInList = nextList.find('li b, li strong').first();
      if (boldInList.length > 0) {
        const winnerText = boldInList.text().trim();
        if (winnerText) {
          winners.set(category, winnerText);
        }
      }
    });
  } catch (err) {
    if (err.response?.status === 404) {
      console.log('Wikipedia page not found yet — ceremony page may not exist.');
    } else {
      console.error('Scrape error:', err.message);
    }
  }

  return winners;
}

export function getSourceUrl() {
  return WIKI_URL;
}
