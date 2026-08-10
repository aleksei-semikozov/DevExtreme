const assignees = [
  { id: 'room-1', text: '🏢 Room 1', parentId: null },
  { id: 1, text: 'Samantha Bright', parentId: 'room-1', color: '#A7E3A5' },
  { id: 2, text: 'John Heart', parentId: 'room-1', color: '#F9E2AE' },
  { id: 'room-2', text: '🏢 Room 2', parentId: null },
  { id: 3, text: 'Todd Hoffman', parentId: 'room-2', color: '#F1BBBC' },
  { id: 4, text: 'Sandra Johnson', parentId: 'room-2', color: '#CFE4FA' },
];

const leafAssignees = assignees.filter(
  (item) => !assignees.some((other) => other.parentId === item.id),
);
const leafIds = leafAssignees.map((item) => item.id);

const createAppointments = () => [
  {
    text: 'Upgrade Personal Computers',
    assigneeId: [1],
    startDate: new Date(2026, 6, 13, 9, 30),
    endDate: new Date(2026, 6, 13, 11, 30),
  },
  {
    text: 'Google AdWords Strategy',
    assigneeId: [2],
    startDate: new Date(2026, 6, 13, 12, 0),
    endDate: new Date(2026, 6, 13, 14, 0),
  },
  {
    text: 'New Brochures',
    assigneeId: [3],
    startDate: new Date(2026, 6, 13, 9, 0),
    endDate: new Date(2026, 6, 13, 11, 0),
  },
  {
    text: 'Install New Database',
    assigneeId: [4],
    startDate: new Date(2026, 6, 13, 13, 0),
    endDate: new Date(2026, 6, 13, 15, 0),
  },
];

const isRenderable = (appointment) => (appointment.assigneeId ?? [])
  .some((id) => leafIds.includes(id));

const textOf = (id) => assignees.find((item) => item.id === id)?.text ?? String(id);

const createPanel = ({ statusId, dataId, schedulerId, appointments }) => {
  const render = () => {
    const lost = appointments.filter((item) => !isRenderable(item));
    const rendered = $(`#${schedulerId}`).find('.dx-scheduler-appointment').length;

    $(`#${statusId}`)
      .removeClass('lost ok')
      .addClass(lost.length ? 'lost' : 'ok')
      .text(
        `в источнике: ${appointments.length}`
        + `  |  отрисовано: ${rendered}`
        + `  |  привязано к не-листу: ${lost.length}`
        + (lost.length ? ` — ${lost.map((item) => `"${item.text}"`).join(', ')}` : ''),
      );

    $(`#${dataId}`).text(appointments
      .map((item) => `${isRenderable(item) ? '  ' : '✗ '}${item.text} → assigneeId: `
        + `${JSON.stringify(item.assigneeId)} (${(item.assigneeId ?? []).map(textOf).join(', ')})`)
      .join('\n'));
  };

  return render;
};

$(() => {
  const bugAppointments = createAppointments();
  const fixedAppointments = createAppointments();

  const renderBug = createPanel({
    statusId: 'status-bug',
    dataId: 'data-bug',
    schedulerId: 'scheduler-bug',
    appointments: bugAppointments,
  });

  const renderFixed = createPanel({
    statusId: 'status-fixed',
    dataId: 'data-fixed',
    schedulerId: 'scheduler-fixed',
    appointments: fixedAppointments,
  });

  const commonOptions = {
    views: [{ type: 'day', groupOrientation: 'vertical' }],
    currentView: 'day',
    currentDate: new Date(2026, 6, 13),
    startDayHour: 9,
    endDayHour: 16,
    groups: ['assigneeId'],
    showAllDayPanel: false,
    showCurrentTimeIndicator: false,
    height: 520,
  };

  const bugScheduler = $('#scheduler-bug').dxScheduler({
    ...commonOptions,
    dataSource: bugAppointments,
    resources: [
      {
        fieldExpr: 'assigneeId',
        dataSource: assignees,
        parentIdExpr: 'parentId',
        label: 'Employee',
        allowMultiple: true,
      },
    ],
    onContentReady: () => setTimeout(renderBug),
  }).dxScheduler('instance');

  $('#scheduler-fixed').dxScheduler({
    ...commonOptions,
    dataSource: fixedAppointments,
    resources: [
      {
        fieldExpr: 'assigneeId',
        dataSource: assignees,
        parentIdExpr: 'parentId',
        label: 'Employee',
        allowMultiple: true,
      },
    ],
    onAppointmentFormOpening: (e) => {
      e.form.getEditor('assigneeId')?.option('dataSource', leafAssignees);
    },
    onContentReady: () => setTimeout(renderFixed),
  });

  const reloadBug = () => {
    bugScheduler.option('dataSource', bugAppointments.slice());
  };

  $('#break-btn').dxButton({
    text: 'Сделать то же, что Save в форме: assigneeId = ["room-1"]',
    type: 'danger',
    onClick: () => {
      bugAppointments[0].assigneeId = ['room-1'];
      reloadBug();
    },
  });

  $('#reset-btn').dxButton({
    text: 'Сбросить',
    onClick: () => {
      bugAppointments[0].assigneeId = [1];
      reloadBug();
    },
  });

  $('#reset-btn-fixed').dxButton({
    text: 'Сбросить',
    onClick: () => {
      $('#scheduler-fixed').dxScheduler('instance')
        .option('dataSource', createAppointments());
    },
  });

  const themeItems = [
    { text: 'Fluent Blue Light', name: 'fluent.blue.light' },
    { text: 'Fluent Blue Dark', name: 'fluent.blue.dark' },
    { text: 'Generic Light', name: 'generic.light' },
    { text: 'Generic Dark', name: 'generic.dark' },
    { text: 'Material Blue Light', name: 'material.blue.light' },
    { text: 'Contrast', name: 'generic.contrast' },
  ];

  $('#theme-picker').dxSelectBox({
    dataSource: themeItems,
    displayExpr: 'text',
    valueExpr: 'name',
    value: dxTheme,
    width: 220,
    inputAttr: { 'aria-label': 'Тема' },
    onValueChanged: (e) => {
      if (e.value && e.value !== dxTheme) {
        localStorage.setItem('dxThemeHierForm', e.value);
        window.location.reload();
      }
    },
  });
});
