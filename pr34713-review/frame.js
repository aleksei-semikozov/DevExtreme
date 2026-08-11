const params = new URLSearchParams(location.search);
const scenario = params.get('case') === '2' ? 2 : 1;

const OWNERS = [
  { id: 1, text: 'Samantha Bright', color: '#A7E3A5' },
  { id: 2, text: 'John Heart', color: '#F9E2AE' },
];

const ROOMS = [
  { id: 'board', text: '🏢 Board rooms' },
  { id: 11, text: 'Room 11', parentId: 'board' },
  { id: 12, text: 'Room 12', parentId: 'board' },
  { id: 21, text: 'Room 21' },
];

const LAZY_ROOMS = [
  { id: 'board', text: '🏢 Board rooms', active: true },
  { id: 12, text: 'Room 12 (архивная)', parentId: 'board', active: false },
  { id: 11, text: 'Room 11', parentId: 'board', active: true },
  { id: 21, text: 'Room 21', active: true },
];

const CURRENT_DATE = new Date(2026, 7, 12);

const setStatus = (text, isBad) => {
  $('#status').removeClass('bad good').addClass(isBad ? 'bad' : 'good').text(text);
};

const editorItems = (form) => {
  const editor = form.getEditor('roomId');
  if (!editor) {
    return null;
  }
  const ds = typeof editor.getDataSource === 'function'
    ? editor.getDataSource()
    : editor.option('dataSource');
  if (Array.isArray(ds)) {
    return { editor, items: ds };
  }
  if (ds && typeof ds.items === 'function') {
    return { editor, items: ds.items() ?? [], ds };
  }
  return { editor, items: [] };
};

const loadThenReport = (form, report) => {
  const info = editorItems(form);
  if (info && info.ds && typeof info.ds.load === 'function' && !info.items.length) {
    info.ds.load().done(report).fail(report);
    return;
  }
  report();
};

const commonOptions = {
  views: ['day'],
  currentView: 'day',
  currentDate: CURRENT_DATE,
  startDayHour: 9,
  endDayHour: 16,
  showAllDayPanel: false,
  showCurrentTimeIndicator: false,
  height: 420,
};

$(() => {
  if (scenario === 1) {
    const appointments = [
      {
        text: 'Совещание в Board rooms',
        ownerId: 1,
        roomId: 'board',
        startDate: new Date(2026, 7, 12, 10, 0),
        endDate: new Date(2026, 7, 12, 12, 0),
      },
      {
        text: 'Планёрка в Room 11',
        ownerId: 2,
        roomId: 11,
        startDate: new Date(2026, 7, 12, 13, 0),
        endDate: new Date(2026, 7, 12, 14, 30),
      },
    ];

    $('#scheduler').dxScheduler({
      ...commonOptions,
      dataSource: appointments,
      groups: ['ownerId'],
      resources: [
        { fieldExpr: 'ownerId', dataSource: OWNERS, label: 'Owner' },
        {
          fieldExpr: 'roomId',
          parentIdExpr: 'parentId',
          dataSource: ROOMS,
          label: 'Room',
        },
      ],
      onAppointmentFormOpening: (e) => {
        const report = () => {
          const info = editorItems(e.form);
          if (!info) {
            setStatus('редактор Room не найден', true);
            return;
          }
          const texts = info.items.map((item) => item.text ?? '(без текста)');
          const label = info.editor.option('text') ?? '';
          const hasParent = texts.some((text) => String(text).includes('Board rooms'));
          setStatus(
            `значение roomId: ${JSON.stringify(info.editor.option('value'))}`
            + `  |  подпись в поле Room: "${label}"`
            + `\nсписок в редакторе (${texts.length}): ${texts.join(', ') || '—'}`
            + `\nродитель «Board rooms» доступен для выбора: ${hasParent ? 'да' : 'НЕТ'}`,
            label === '',
          );
        };

        setTimeout(() => loadThenReport(e.form, report), 300);
      },
      onContentReady: (e) => {
        const rendered = e.element.find('.dx-scheduler-appointment').length;
        setStatus(
          `отрисовано встреч: ${rendered} из ${appointments.length}.`
          + ' Откройте «Совещание в Board rooms» двойным щелчком.',
          false,
        );
      },
    });
    return;
  }

  // Сценарий 2: ни одна встреча не ссылается на roomId, ресурс не в groups →
  // к моменту открытия формы он не загружен.
  const appointments = [
    {
      text: 'Встреча без комнаты',
      ownerId: 1,
      startDate: new Date(2026, 7, 12, 10, 0),
      endDate: new Date(2026, 7, 12, 11, 30),
    },
  ];

  const roomDataSourceConfig = {
    store: LAZY_ROOMS,
    filter: ['active', '=', true],
    sort: 'text',
    paginate: false,
  };

  $('#scheduler').dxScheduler({
    ...commonOptions,
    dataSource: appointments,
    groups: ['ownerId'],
    resources: [
      { fieldExpr: 'ownerId', dataSource: OWNERS, label: 'Owner' },
      {
        fieldExpr: 'roomId',
        parentIdExpr: 'parentId',
        dataSource: roomDataSourceConfig,
        label: 'Room',
      },
    ],
    onAppointmentFormOpening: (e) => {
      const report = () => {
        const info = editorItems(e.form);
        if (!info) {
          setStatus('редактор Room не найден', true);
          return;
        }
        const texts = info.items.map((item) => item.text ?? '(без текста)');
        const hasArchived = texts.some((text) => String(text).includes('архивная'));
        setStatus(
          `список в редакторе Room (${texts.length}): ${texts.join(', ') || '—'}`
          + `\nотфильтрованная запись "Room 12 (архивная)": ${hasArchived ? 'ЕСТЬ — filter потерян' : 'нет'}`,
          hasArchived,
        );
      };

      setTimeout(() => loadThenReport(e.form, report), 300);
    },
    onContentReady: () => {
      setStatus(
        'Откройте «Встреча без комнаты» двойным щелчком и разверните список Room.',
        false,
      );
    },
  });
});
