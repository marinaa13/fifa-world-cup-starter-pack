const ROUND_ORDER = ['Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Third-place playoff', 'Final'];

// Free public test key, documented at https://www.thesportsdb.com/free_sports_api (demo project).
const SCORES_API_URL = 'https://www.thesportsdb.com/api/v1/json/3/searchevents.php';

/**
 * Checks whether a bracket cell holds a real team name rather than a
 * "Winner X/Y" placeholder for a not-yet-determined participant.
 * @param {string} name the team cell text
 * @returns {boolean} true if it's a resolved team name
 */
function isResolvedTeam(name) {
  return Boolean(name) && !name.startsWith('Winner ');
}

/**
 * Looks up a single event by team names via TheSportsDB's search endpoint.
 * @param {string} teamA first team, used as the query's home slot
 * @param {string} teamB second team, used as the query's away slot
 * @returns {Promise<object|null>} the matching event, or null if not found
 */
async function fetchEvent(teamA, teamB) {
  const query = [teamA, teamB].map((name) => encodeURIComponent(name.trim().replace(/\s+/g, '_'))).join('_vs_');
  try {
    const response = await fetch(`${SCORES_API_URL}?e=${query}`);
    if (!response.ok) return null;
    const { event } = await response.json();
    return event?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Looks up a match regardless of which team the source listed first, since
 * the live fixture's home/away order may not match our stored order.
 * @param {string} teamA first team as stored in our content
 * @param {string} teamB second team as stored in our content
 * @returns {Promise<{event: object, swapped: boolean}|null>} the event and
 * whether its home/away teams are swapped relative to teamA/teamB
 */
async function fetchLiveScore(teamA, teamB) {
  const forward = await fetchEvent(teamA, teamB);
  if (forward) return { event: forward, swapped: false };
  const reversed = await fetchEvent(teamB, teamA);
  if (reversed) return { event: reversed, swapped: true };
  return null;
}

/**
 * Fetches live/final scores for undecided matches whose participants are
 * both known, and updates their cards in place. Runs after initial
 * decoration so it never blocks first render.
 * @param {{teamA: string, teamB: string, card: Element, teamASpan: Element,
 * teamBSpan: Element, scoreSpan: Element}[]} entries undecided match cards
 */
async function enrichWithLiveScores(entries) {
  await Promise.all(entries.map(async (entry) => {
    const result = await fetchLiveScore(entry.teamA, entry.teamB);
    if (!result) return;
    const { event, swapped } = result;
    const { intHomeScore, intAwayScore } = event;
    if (intHomeScore === null || intHomeScore === undefined
      || intAwayScore === null || intAwayScore === undefined) return;

    const scoreA = Number(swapped ? intAwayScore : intHomeScore);
    const scoreB = Number(swapped ? intHomeScore : intAwayScore);

    entry.scoreSpan.textContent = `${scoreA}-${scoreB}`;
    if (scoreA !== scoreB) {
      const winnerSpan = scoreA > scoreB ? entry.teamASpan : entry.teamBSpan;
      winnerSpan.classList.add('standings-winner');
    }

    if (event.strStatus === 'AET') {
      const note = document.createElement('p');
      note.className = 'standings-match-note';
      note.textContent = 'After extra time';
      entry.card.append(note);
    }
  }));
}

/**
 * Builds one Flashscore-style group table.
 * @param {string} group group label, e.g. "Group A"
 * @param {object[]} teams team rows for this group, in final standing order
 * @returns {Element} the group table wrapper
 */
function buildGroupTable(group, teams) {
  const wrapper = document.createElement('div');
  wrapper.className = 'standings-group';

  const heading = document.createElement('h3');
  heading.textContent = group;
  wrapper.append(heading);

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Team</th>
        <th>P</th>
        <th>W</th>
        <th>D</th>
        <th>L</th>
        <th>G</th>
        <th>Pts</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  teams.forEach((team, i) => {
    const tr = document.createElement('tr');
    if (i < 2) tr.classList.add('standings-qualified');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td class="standings-team">
        <img src="https://flagcdn.com/w40/${team.iso}.png" alt="">
        <span>${team.name}</span>
      </td>
      <td>${team.p}</td>
      <td>${team.w}</td>
      <td>${team.d}</td>
      <td>${team.l}</td>
      <td>${team.gf}:${team.ga}</td>
      <td>${team.pts}</td>
    `;
    tbody.append(tr);
  });
  table.append(tbody);
  wrapper.append(table);
  return wrapper;
}

// Best-ranked third-placed teams that advance alongside group winners/runners-up.
const THIRD_PLACE_QUALIFIERS = 8;

/**
 * Builds the "best third-placed teams" ranking table shown below the group
 * tables, highlighting the ones that advanced to the knockout stage.
 * @param {Map<string, object[]>} groups all groups, each an array of teams
 * in final standing order (so index 2 is that group's third-placed team)
 * @returns {Element} the ranking table wrapper
 */
function buildThirdPlaceTable(groups) {
  const wrapper = document.createElement('div');
  wrapper.className = 'standings-group standings-third-place';

  const heading = document.createElement('h3');
  heading.textContent = 'Best Third-Placed Teams';
  wrapper.append(heading);

  const thirdPlaceTeams = [...groups.entries()]
    .filter(([, teams]) => teams.length > 2)
    .map(([group, teams]) => ({ ...teams[2], group }))
    .sort((a, b) => (Number(b.pts) - Number(a.pts))
      || ((Number(b.gf) - Number(b.ga)) - (Number(a.gf) - Number(a.ga)))
      || (Number(b.gf) - Number(a.gf)));

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Group</th>
        <th>Team</th>
        <th>P</th>
        <th>W</th>
        <th>D</th>
        <th>L</th>
        <th>G</th>
        <th>Pts</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  thirdPlaceTeams.forEach((team, i) => {
    const tr = document.createElement('tr');
    if (i < THIRD_PLACE_QUALIFIERS) tr.classList.add('standings-qualified');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${team.group}</td>
      <td class="standings-team">
        <img src="https://flagcdn.com/w40/${team.iso}.png" alt="">
        <span>${team.name}</span>
      </td>
      <td>${team.p}</td>
      <td>${team.w}</td>
      <td>${team.d}</td>
      <td>${team.l}</td>
      <td>${team.gf}:${team.ga}</td>
      <td>${team.pts}</td>
    `;
    tbody.append(tr);
  });
  table.append(tbody);
  wrapper.append(table);
  return wrapper;
}

/**
 * Builds one knockout round section.
 * @param {string} round round label
 * @param {object[]} matches matches in this round
 * @param {object[]} liveScoreEntries collector for undecided matches whose
 * participants are both known, so they can be enriched with a live score
 * @returns {Element} the round wrapper
 */
function buildRound(round, matches, liveScoreEntries) {
  const wrapper = document.createElement('div');
  wrapper.className = 'standings-round';

  const heading = document.createElement('h3');
  heading.textContent = round;
  wrapper.append(heading);

  matches.forEach((match) => {
    const card = document.createElement('div');
    card.className = 'standings-match';
    const decided = Boolean(match.score);
    card.innerHTML = `
      <span class="standings-match-team${match.winner === match.teamA ? ' standings-winner' : ''}">${match.teamA}</span>
      <span class="standings-match-score">${decided ? match.score : 'vs'}</span>
      <span class="standings-match-team${match.winner === match.teamB ? ' standings-winner' : ''}">${match.teamB}</span>
    `;
    if (match.note) {
      const note = document.createElement('p');
      note.className = 'standings-match-note';
      note.textContent = match.note;
      card.append(note);
    }
    wrapper.append(card);

    if (!decided && isResolvedTeam(match.teamA) && isResolvedTeam(match.teamB)) {
      const [teamASpan, teamBSpan] = card.querySelectorAll('.standings-match-team');
      liveScoreEntries.push({
        teamA: match.teamA,
        teamB: match.teamB,
        card,
        teamASpan,
        teamBSpan,
        scoreSpan: card.querySelector('.standings-match-score'),
      });
    }
  });

  return wrapper;
}

/**
 * loads and decorates the standings block
 * @param {Element} block The standings block element
 */
export default function decorate(block) {
  const groups = new Map();
  const matchesByRound = new Map();

  [...block.children].forEach((row) => {
    const cells = [...row.children].map((cell) => cell.textContent.trim());
    const [type] = cells;

    if (type === 'team') {
      const [, group, name, iso, p, w, d, l, gf, ga, pts] = cells;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push({
        name, iso, p, w, d, l, gf, ga, pts,
      });
    } else if (type === 'match') {
      const [, round, teamA, teamB, score, winner, note] = cells;
      if (!matchesByRound.has(round)) matchesByRound.set(round, []);
      matchesByRound.get(round).push({
        teamA, teamB, score, winner, note,
      });
    }
  });

  const container = document.createElement('div');
  container.className = 'standings-container';

  const controls = document.createElement('div');
  controls.className = 'standings-controls';
  controls.innerHTML = `
    <label for="standings-view">View</label>
    <select id="standings-view">
      <option value="groups">Group Stage</option>
      <option value="bracket">Knockout Bracket</option>
    </select>
  `;
  container.append(controls);

  const groupsPanel = document.createElement('div');
  groupsPanel.className = 'standings-panel standings-groups-panel';
  [...groups.keys()].sort().forEach((group) => {
    groupsPanel.append(buildGroupTable(group, groups.get(group)));
  });
  if (groups.size) groupsPanel.append(buildThirdPlaceTable(groups));
  container.append(groupsPanel);

  const liveScoreEntries = [];
  const bracketPanel = document.createElement('div');
  bracketPanel.className = 'standings-panel standings-bracket-panel standings-panel-hidden';
  ROUND_ORDER.filter((round) => matchesByRound.has(round)).forEach((round) => {
    bracketPanel.append(buildRound(round, matchesByRound.get(round), liveScoreEntries));
  });
  container.append(bracketPanel);

  const select = controls.querySelector('select');
  select.addEventListener('change', () => {
    const showBracket = select.value === 'bracket';
    groupsPanel.classList.toggle('standings-panel-hidden', showBracket);
    bracketPanel.classList.toggle('standings-panel-hidden', !showBracket);
  });

  block.replaceChildren(container);

  if (liveScoreEntries.length) enrichWithLiveScores(liveScoreEntries);
}
