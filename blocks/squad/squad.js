/**
 * Builds a Flashscore-style pitch diagram (built as SVG/CSS markers, not a
 * copied broadcast graphic) placing players row by row from goalkeeper to
 * forwards according to the formation string (e.g. "4-3-3").
 * @param {string} formation formation string, e.g. "4-3-3"
 * @param {string[]} players 11 player names, ordered GK, then row by row
 * @returns {Element} the pitch element
 */
function buildPitch(formation, players) {
  const rowCounts = formation.split('-').map(Number).filter((n) => !Number.isNaN(n));
  const pitch = document.createElement('div');
  pitch.className = 'squad-pitch';

  let playerIndex = 0;
  const addRow = (count) => {
    const row = document.createElement('div');
    row.className = 'squad-pitch-row';
    for (let i = 0; i < count; i += 1) {
      const name = players[playerIndex] || '';
      playerIndex += 1;
      const marker = document.createElement('span');
      marker.className = 'squad-player';
      marker.title = name;
      const dot = document.createElement('span');
      dot.className = 'squad-player-dot';
      const label = document.createElement('span');
      label.className = 'squad-player-name';
      label.textContent = name.split(' ').pop();
      marker.append(dot, label);
      row.append(marker);
    }
    pitch.append(row);
  };

  addRow(1); // goalkeeper
  rowCounts.forEach((count) => addRow(count));

  return pitch;
}

/**
 * loads and decorates the squad block
 * @param {Element} block The squad block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [lineupRow, ...positionRows] = rows;

  const layout = document.createElement('div');
  layout.className = 'squad-layout';

  const positionsWrap = document.createElement('div');
  positionsWrap.className = 'squad-positions';

  positionRows.forEach((row) => {
    const [label, players] = [...row.children];
    const box = document.createElement('div');
    box.className = 'squad-position';
    if (label) {
      label.classList.add('squad-position-label');
      box.append(label);
    }
    if (players) {
      players.classList.add('squad-position-players');
      box.append(players);
    }
    positionsWrap.append(box);
  });

  layout.append(positionsWrap);

  if (lineupRow) {
    const [formationCell, playersCell] = [...lineupRow.children];
    const formation = formationCell?.textContent.trim();
    const playerNames = playersCell
      ? [...playersCell.querySelectorAll('p')].map((p) => p.textContent.trim()).filter(Boolean)
      : [];

    if (formation && playerNames.length) {
      const aside = document.createElement('div');
      aside.className = 'squad-lineup';

      const heading = document.createElement('p');
      heading.className = 'squad-lineup-heading';
      heading.textContent = `Last lineup · ${formation}`;
      aside.append(heading);
      aside.append(buildPitch(formation, playerNames));
      layout.append(aside);
    }
  }

  block.replaceChildren(layout);
}
