$(() => {
  function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function getDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function getDurationText(startDate, endDate) {
    const minutes = (endDate - startDate) / 60000;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
  }

  function getTeamAvailability(startDate, endDate) {
    return teamMembers.map((member) => {
      const conflicts = appointments.filter((apt) => apt.assignee === member
        && apt.startDate < endDate
        && apt.endDate > startDate);

      return {
        name: member,
        busy: conflicts.length > 0,
        conflict: conflicts[0]?.text || null,
      };
    });
  }

  function getWeather(startDate) {
    const key = getDateKey(startDate);
    return weatherData[key] || { temp: 20, condition: 'No data', icon: '❓' };
  }

  function updateSummary(startDate, endDate) {
    const availability = getTeamAvailability(startDate, endDate);
    const weather = getWeather(startDate);
    const freeMembers = availability.filter((m) => !m.busy);

    let html = '';

    html += '<div class="summary-section">';
    html += '<div class="summary-section-title">Selected Period</div>';
    html += `<div class="summary-time">${formatDate(startDate)}</div>`;
    html += `<div class="summary-time">${formatTime(startDate)} — ${formatTime(endDate)}</div>`;
    html += `<div class="summary-duration">${getDurationText(startDate, endDate)}</div>`;
    html += '</div>';

    html += '<div class="summary-section">';
    html += '<div class="summary-section-title">Team Availability</div>';
    availability.forEach((member) => {
      const statusClass = member.busy ? 'status-busy' : 'status-free';
      const statusText = member.busy ? `🔴 ${member.conflict}` : '✅ Free';
      html += `<div class="team-member"><span>${member.name}</span><span class="${statusClass}">${statusText}</span></div>`;
    });
    html += '</div>';

    if (freeMembers.length === teamMembers.length) {
      html += '<div class="summary-section">';
      html += '<div class="best-slot">✅ Everyone is available!</div>';
      html += '</div>';
    } else if (freeMembers.length > 0) {
      html += '<div class="summary-section">';
      html += `<div class="best-slot">${freeMembers.length} of ${teamMembers.length} available</div>`;
      html += '</div>';
    }

    html += '<div class="summary-section">';
    html += '<div class="summary-section-title">Weather</div>';
    html += `<div class="weather-info"><span class="weather-icon">${weather.icon}</span><span>${weather.temp}°C, ${weather.condition}</span></div>`;
    html += '</div>';

    $('#summary-content').html(html);
  }

  $('#scheduler').dxScheduler({
    timeZone: 'America/Los_Angeles',
    dataSource: appointments,
    views: [{
      type: 'workWeek',
      cellDuration: 30,
    }],
    currentView: 'workWeek',
    currentDate: new Date(2021, 3, 21),
    startDayHour: 9,
    endDayHour: 16,
    showCurrentTimeIndicator: false,
    allDayPanelMode: 'allDay',
    onSelectionEnd(e) {
      const cells = e.selectedCellData;
      if (!cells.length) {
        return;
      }

      const startDate = cells[0].startDate;
      const endDate = cells[cells.length - 1].endDate;

      updateSummary(startDate, endDate);
    },
  });
});
