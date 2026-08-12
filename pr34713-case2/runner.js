const variant = new URLSearchParams(location.search).get('v') === 'pass' ? 'pass' : 'fail';

const getRoomEditor = () => {
  const $form = $('.dx-scheduler-appointment-popup .dx-form').first();
  if (!$form.length) {
    return null;
  }
  const form = $form.dxForm('instance');
  return form && form.getEditor ? form.getEditor('roomId') : null;
};

let attempts = 0;

const showState = () => {
  attempts += 1;
  const editor = getRoomEditor();

  if (!editor) {
    $('#state').text('форма ещё не открыта');
    return;
  }

  const raw = editor.option('dataSource');
  const ds = typeof editor.getDataSource === 'function' ? editor.getDataSource() : null;
  let items = Array.isArray(raw)
    ? raw
    : (ds && typeof ds.items === 'function' ? ds.items() ?? [] : []);

  if (!items.length && ds && typeof ds.load === 'function' && attempts < 6) {
    ds.load().done(showState).fail(showState);
    return;
  }

  items = items ?? [];
  const texts = items.map((item) => item.text ?? '(без текста)');
  const hasArchived = texts.some((text) => String(text).includes('архивная'));

  $('#state')
    .removeClass('bad good')
    .addClass(hasArchived ? 'bad' : 'good')
    .text(
      `список Room: ${texts.join(', ') || '—'}`
      + `\n"Room 12 (архивная)": ${hasArchived ? 'в списке есть' : 'отфильтрована'}`,
    );

  const node = editor.$element ? editor.$element()[0] : null;
  if (node && node.scrollIntoView) {
    node.scrollIntoView({ block: 'center' });
  }

  if (editor.option('opened') !== true) {
    setTimeout(() => editor.option('opened', true), 150);
  }
};

// eslint-disable-next-line no-new-func
new Function('$', window.DEMO_CODE[variant])(jQuery);

setTimeout(showState, 1200);
setTimeout(showState, 2800);
