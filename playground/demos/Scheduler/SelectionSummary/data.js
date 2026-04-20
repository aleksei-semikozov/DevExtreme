const appointments = [
  {
    text: 'Team Standup',
    startDate: new Date('2021-04-19T16:00:00.000Z'),
    endDate: new Date('2021-04-19T16:30:00.000Z'),
    assignee: 'John',
  }, {
    text: 'Design Review',
    startDate: new Date('2021-04-19T17:00:00.000Z'),
    endDate: new Date('2021-04-19T18:30:00.000Z'),
    assignee: 'Sarah',
  }, {
    text: 'Sprint Planning',
    startDate: new Date('2021-04-20T16:00:00.000Z'),
    endDate: new Date('2021-04-20T18:00:00.000Z'),
    assignee: 'John',
  }, {
    text: 'Code Review',
    startDate: new Date('2021-04-20T19:00:00.000Z'),
    endDate: new Date('2021-04-20T20:00:00.000Z'),
    assignee: 'Mike',
  }, {
    text: 'Client Call',
    startDate: new Date('2021-04-21T17:00:00.000Z'),
    endDate: new Date('2021-04-21T18:00:00.000Z'),
    assignee: 'Sarah',
  }, {
    text: 'Lunch with Team',
    startDate: new Date('2021-04-21T19:00:00.000Z'),
    endDate: new Date('2021-04-21T20:00:00.000Z'),
    assignee: 'John',
  }, {
    text: 'Architecture Discussion',
    startDate: new Date('2021-04-22T16:00:00.000Z'),
    endDate: new Date('2021-04-22T17:30:00.000Z'),
    assignee: 'Mike',
  }, {
    text: 'QA Sync',
    startDate: new Date('2021-04-22T18:00:00.000Z'),
    endDate: new Date('2021-04-22T19:00:00.000Z'),
    assignee: 'Sarah',
  }, {
    text: 'Demo Preparation',
    startDate: new Date('2021-04-23T17:00:00.000Z'),
    endDate: new Date('2021-04-23T19:00:00.000Z'),
    assignee: 'John',
  }, {
    text: '1:1 with Manager',
    startDate: new Date('2021-04-23T20:00:00.000Z'),
    endDate: new Date('2021-04-23T21:00:00.000Z'),
    assignee: 'Mike',
  },
];

const teamMembers = ['John', 'Sarah', 'Mike'];

const weatherData = {
  '2021-04-19': { temp: 18, condition: 'Partly Cloudy', icon: '⛅' },
  '2021-04-20': { temp: 22, condition: 'Sunny', icon: '☀️' },
  '2021-04-21': { temp: 15, condition: 'Light Rain', icon: '🌧️' },
  '2021-04-22': { temp: 20, condition: 'Clear', icon: '☀️' },
  '2021-04-23': { temp: 17, condition: 'Cloudy', icon: '☁️' },
};
