/**
 * loads and decorates the tabs block. Renders a dropdown that toggles
 * visibility of sibling sections in <main> matching each option's target
 * class (set via that section's Section Metadata "Style" field).
 * @param {Element} block The tabs block element
 */
export default function decorate(block) {
  const options = [...block.children].map((row) => {
    const [label, target] = [...row.children];
    return { label: label?.textContent.trim(), target: target?.textContent.trim() };
  }).filter((o) => o.label && o.target);

  const targets = options.map((o) => o.target);

  const showView = (view) => {
    document.querySelectorAll('main .section').forEach((section) => {
      if (targets.some((t) => section.classList.contains(t))) {
        section.classList.toggle('tabs-hidden', !section.classList.contains(view));
      }
    });
  };

  const select = document.createElement('select');
  select.className = 'tabs-select';
  options.forEach(({ label, target }) => {
    const opt = document.createElement('option');
    opt.value = target;
    opt.textContent = label;
    select.append(opt);
  });
  select.addEventListener('change', () => showView(select.value));

  block.replaceChildren(select);

  if (options[0]) showView(options[0].target);
}
