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
  const label = editor.option('text') ?? '';

  $('#state')
    .removeClass('bad good')
    .addClass(label === '' ? 'bad' : 'good')
    .text(
      `roomId: ${JSON.stringify(editor.option('value'))}`
      + `   поле Room: "${label}"`
      + `\nсписок: ${texts.join(', ') || '—'}`,
    );

  const node = editor.$element ? editor.$element()[0] : null;
  if (node && node.scrollIntoView) {
    node.scrollIntoView({ block: 'center' });
  }
};

// eslint-disable-next-line no-new-func
new Function('$', window.DEMO_CODE)(jQuery);

setTimeout(showState, 1200);
setTimeout(showState, 2800);
