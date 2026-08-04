const rooms = [
  { id: 'building-a', text: 'Building A', parentId: null },
  { id: 'floor-a1', text: 'Floor 1', parentId: 'building-a' },
  {
    id: 'room-101', text: 'Room 101', parentId: 'floor-a1', color: '#3f51b5',
  },
  {
    id: 'room-102', text: 'Room 102', parentId: 'floor-a1', color: '#8e24aa',
  },
  { id: 'floor-a2', text: 'Floor 2', parentId: 'building-a' },
  {
    id: 'room-201', text: 'Room 201', parentId: 'floor-a2', color: '#00897b',
  },
  { id: 'building-b', text: 'Building B', parentId: null },
  { id: 'floor-b1', text: 'Floor 1', parentId: 'building-b' },
  {
    id: 'room-301', text: 'Room 301', parentId: 'floor-b1', color: '#e65100',
  },
  {
    id: 'room-302', text: 'Room 302', parentId: 'floor-b1', color: '#c62828',
  },
];

const appointments = [
  {
    text: 'Daily Standup',
    roomId: 'room-101',
    startDate: new Date(2021, 3, 26, 9, 0),
    endDate: new Date(2021, 3, 26, 10, 0),
  }, {
    text: 'Design Review',
    roomId: 'room-101',
    startDate: new Date(2021, 3, 28, 11, 0),
    endDate: new Date(2021, 3, 28, 12, 30),
  }, {
    text: 'Sprint Planning',
    roomId: 'room-101',
    startDate: new Date(2021, 3, 30, 9, 0),
    endDate: new Date(2021, 3, 30, 11, 0),
  }, {
    text: 'Interview: Frontend Developer',
    roomId: 'room-102',
    startDate: new Date(2021, 3, 26, 11, 0),
    endDate: new Date(2021, 3, 26, 12, 30),
  }, {
    text: 'Interview: QA Engineer',
    roomId: 'room-102',
    startDate: new Date(2021, 3, 29, 10, 0),
    endDate: new Date(2021, 3, 29, 11, 30),
  }, {
    text: 'Retrospective',
    roomId: 'room-201',
    startDate: new Date(2021, 3, 27, 10, 0),
    endDate: new Date(2021, 3, 27, 11, 0),
  }, {
    text: 'Team Sync',
    roomId: 'room-201',
    startDate: new Date(2021, 3, 29, 14, 0),
    endDate: new Date(2021, 3, 29, 15, 0),
  }, {
    text: 'Onboarding Training',
    roomId: 'room-301',
    startDate: new Date(2021, 3, 26, 13, 0),
    endDate: new Date(2021, 3, 26, 15, 0),
  }, {
    text: 'Product Demo',
    roomId: 'room-301',
    startDate: new Date(2021, 3, 28, 9, 0),
    endDate: new Date(2021, 3, 28, 10, 30),
  }, {
    text: 'Client Call',
    roomId: 'room-302',
    startDate: new Date(2021, 3, 27, 13, 0),
    endDate: new Date(2021, 3, 27, 14, 0),
  }, {
    text: 'Budget Review',
    roomId: 'room-302',
    startDate: new Date(2021, 3, 28, 14, 0),
    endDate: new Date(2021, 3, 28, 15, 0),
  }, {
    text: 'All-Hands Meeting',
    roomId: 'room-302',
    startDate: new Date(2021, 3, 30, 12, 0),
    endDate: new Date(2021, 3, 30, 13, 30),
  },
];
