/**
 * loads and decorates the bracket block: groups authored matchup rows by
 * round into columns, bolding the winner when one is known.
 * @param {Element} block The bracket block element
 */
export default function decorate(block) {
  const rounds = new Map();

  [...block.children].forEach((row) => {
    const [roundCell, teamACell, teamBCell, winnerCell, scoreCell, noteCell] = [...row.children];
    const round = roundCell?.textContent.trim();
    const teamA = teamACell?.textContent.trim();
    const teamB = teamBCell?.textContent.trim();
    const winner = winnerCell?.textContent.trim();
    const score = scoreCell?.textContent.trim();
    const note = noteCell?.textContent.trim();
    if (!round || !teamA || !teamB) return;
    if (!rounds.has(round)) rounds.set(round, []);
    rounds.get(round).push({
      teamA, teamB, winner, score, note,
    });
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'bracket-rounds';

  rounds.forEach((matches, round) => {
    const col = document.createElement('div');
    col.className = 'bracket-round';

    const heading = document.createElement('p');
    heading.className = 'bracket-round-heading';
    heading.textContent = round;
    col.append(heading);

    matches.forEach(({
      teamA, teamB, winner, score, note,
    }) => {
      const match = document.createElement('div');
      match.className = 'bracket-match';
      [teamA, teamB].forEach((team) => {
        const teamEl = document.createElement('p');
        teamEl.className = 'bracket-team';
        teamEl.textContent = team;
        if (winner && team === winner) teamEl.classList.add('bracket-winner');
        match.append(teamEl);
      });
      if (score) {
        const scoreEl = document.createElement('p');
        scoreEl.className = 'bracket-score';
        scoreEl.textContent = score;
        match.append(scoreEl);
      }
      if (note) {
        const noteEl = document.createElement('p');
        noteEl.className = 'bracket-note';
        noteEl.textContent = note;
        match.append(noteEl);
      }
      col.append(match);
    });

    wrapper.append(col);
  });

  block.replaceChildren(wrapper);
}
