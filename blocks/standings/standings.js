const ROUND_ORDER = ['Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Third-place playoff', 'Final'];

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

/**
 * Builds one knockout round section.
 * @param {string} round round label
 * @param {object[]} matches matches in this round
 * @returns {Element} the round wrapper
 */
function buildRound(round, matches) {
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
  container.append(groupsPanel);

  const bracketPanel = document.createElement('div');
  bracketPanel.className = 'standings-panel standings-bracket-panel standings-panel-hidden';
  ROUND_ORDER.filter((round) => matchesByRound.has(round)).forEach((round) => {
    bracketPanel.append(buildRound(round, matchesByRound.get(round)));
  });
  container.append(bracketPanel);

  const select = controls.querySelector('select');
  select.addEventListener('change', () => {
    const showBracket = select.value === 'bracket';
    groupsPanel.classList.toggle('standings-panel-hidden', showBracket);
    bracketPanel.classList.toggle('standings-panel-hidden', !showBracket);
  });

  block.replaceChildren(container);
}
