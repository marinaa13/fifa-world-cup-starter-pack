import { toClassName } from '../../scripts/aem.js';

const FIELD_LABELS = {
  date: 'Date & Time',
  venue: 'Venue',
  odds: 'Odds (Win / Draw / Win)',
};

// Free-tier key from https://the-odds-api.com/. Exposed client-side by design (demo project).
const ODDS_API_KEY = '4c7b4ac56989e81eb9457d4e47ddf8f8';
const ODDS_API_URL = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/?regions=us&markets=h2h&oddsFormat=decimal&apiKey=${ODDS_API_KEY}`;

/**
 * Adds a small visible field label inside a cell (used for both mobile
 * stacked cards and as a caption above the value on wider viewports).
 * @param {Element} cell the cell to label
 * @param {string} label the label text
 */
function addLabel(cell, label) {
  const span = document.createElement('span');
  span.className = 'matches-field-label';
  span.textContent = label;
  cell.prepend(span);
}

/**
 * Splits a "Team A vs Team B" string into its two team names.
 * @param {string} text the match text
 * @returns {string[]|null} the two team names, or null if not parseable
 */
function parseTeams(text) {
  const parts = text.split(/\s+vs\.?\s+/i);
  return parts.length === 2 ? parts.map((part) => part.trim()) : null;
}

/**
 * Formats the first bookmaker's h2h outcomes for an odds API event.
 * @param {object} event an event object from The Odds API
 * @returns {string|null} formatted odds string, or null if unavailable
 */
function formatOutcomes(event) {
  const market = event.bookmakers?.[0]?.markets?.find((m) => m.key === 'h2h');
  if (!market) return null;
  return market.outcomes.map((outcome) => `${outcome.name} ${outcome.price}`).join(' · ');
}

async function fetchLiveOdds() {
  if (!ODDS_API_KEY) return [];
  try {
    const response = await fetch(ODDS_API_URL);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

/**
 * Fetches live odds once and enriches any matching odds cells in place.
 * Runs after initial decoration so it never blocks first render.
 * @param {{ matchText: string, odds: Element }[]} entries rows with an odds cell
 */
async function enrichWithLiveOdds(entries) {
  const events = await fetchLiveOdds();
  if (!events.length) return;

  entries.forEach(({ matchText, odds }) => {
    const teams = parseTeams(matchText);
    if (!teams) return;
    const [teamA, teamB] = teams.map((team) => team.toLowerCase());

    const event = events.find((candidate) => {
      const home = candidate.home_team?.toLowerCase();
      const away = candidate.away_team?.toLowerCase();
      return (home === teamA || home === teamB) && (away === teamA || away === teamB);
    });
    if (!event) return;

    const formatted = formatOutcomes(event);
    if (!formatted) return;

    odds.textContent = '';
    addLabel(odds, FIELD_LABELS.odds);
    odds.append(document.createTextNode(formatted));
    odds.classList.remove('matches-odds-pending');
    odds.classList.add('matches-odds-live');
  });
}

/**
 * loads and decorates the matches block
 * @param {Element} block The matches block element
 */
export default function decorate(block) {
  const liveOddsEntries = [];

  [...block.children].forEach((row) => {
    row.classList.add('matches-row');
    const [stageMatch, date, venue, odds] = [...row.children];

    if (stageMatch) {
      stageMatch.classList.add('matches-stage');
      const stageText = stageMatch.querySelector('p:first-child')?.textContent || '';
      if (stageText) row.classList.add(`matches-row-${toClassName(stageText)}`);
    }

    if (date) {
      date.classList.add('matches-date');
      addLabel(date, FIELD_LABELS.date);
    }

    if (venue) {
      venue.classList.add('matches-venue');
      addLabel(venue, FIELD_LABELS.venue);
    }

    if (odds) {
      odds.classList.add('matches-odds');
      const hasOdds = Boolean(odds.textContent.trim());
      addLabel(odds, FIELD_LABELS.odds);
      if (!hasOdds) {
        odds.append(document.createTextNode('Odds not yet available'));
        odds.classList.add('matches-odds-pending');
      }
      const matchText = stageMatch?.querySelector('p:last-child')?.textContent || '';
      liveOddsEntries.push({ matchText, odds });
    }
  });

  if (liveOddsEntries.length) enrichWithLiveOdds(liveOddsEntries);
}
