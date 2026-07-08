/**
 * loads and decorates the prices block: a compact table of ticket price
 * ranges per match stage and seating category.
 * @param {Element} block The prices block element
 */
export default function decorate(block) {
  const table = document.createElement('table');

  const thead = document.createElement('thead');
  const headerCells = [...block.children[0].children].map((cell) => cell.textContent.trim());
  thead.innerHTML = `<tr>${headerCells.map((text) => `<th>${text}</th>`).join('')}</tr>`;
  table.append(thead);

  const tbody = document.createElement('tbody');
  [...block.children].slice(1).forEach((row) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((cell, i) => {
      const td = document.createElement('td');
      if (i === 0) td.className = 'prices-stage';
      td.append(...cell.childNodes);
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);

  block.replaceChildren(table);
}
