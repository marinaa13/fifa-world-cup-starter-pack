/**
 * loads and decorates the teams block
 * @param {Element} block The teams block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const [flag, name, group] = [...row.children];
    if (flag) {
      flag.className = 'teams-flag';
      li.append(flag);
    }
    if (name) {
      name.className = 'teams-name';
      li.append(name);
    }
    if (group) {
      group.className = 'teams-group';
      li.append(group);
    }
    ul.append(li);
  });
  block.replaceChildren(ul);
}
