/**
 * loads and decorates the group-table block: a compact Flashscore-style
 * group standings table (rank, team, W-D-L, GF:GA, points).
 * @param {Element} block The group-table block element
 */
export default function decorate(block) {
  const table = document.createElement('table');
  table.className = 'group-table-table';

  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>#</th><th>Team</th><th>W-D-L</th><th>GF:GA</th><th>Pts</th></tr>';
  table.append(thead);

  const tbody = document.createElement('tbody');
  [...block.children].forEach((row, i) => {
    const [team, wdl, gfga, pts] = [...row.children];
    const tr = document.createElement('tr');

    const rank = document.createElement('td');
    rank.className = 'group-table-rank';
    rank.textContent = i + 1;
    tr.append(rank);

    [
      { cell: team, className: 'group-table-team' },
      { cell: wdl, className: 'group-table-wdl' },
      { cell: gfga, className: 'group-table-gfga' },
      { cell: pts, className: 'group-table-pts' },
    ].forEach(({ cell, className }) => {
      const td = document.createElement('td');
      td.className = className;
      if (cell) td.append(...cell.childNodes);
      tr.append(td);
    });

    tbody.append(tr);
  });
  table.append(tbody);

  block.replaceChildren(table);
}
