import './style.css';

const API_KEY = import.meta.env.VITE_NASA_API_KEY;

const appContainer = document.querySelector('#app');
const currentDateDisplay = document.querySelector('#current-date-display');
const coordinatesTrigger = document.querySelector('#temporal-coordinates-trigger');
const calendarPopover = document.querySelector('#calendar-popover');

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayStr = getTodayDateString();
let currentDate = todayStr;
let viewDate = new Date(); // Active month/year view in the popover

const formatDateForReadout = (dateStr) => {
  if (!dateStr) return 'SELECT DATE';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}/${parts[0]}`; // MM/DD/YYYY format
  }
  return dateStr;
};

const showLoading = () => {
  appContainer.innerHTML = `
    <div class="loading-container">
      <div class="radar-loader"></div>
      <div class="loading-text">FETCHING QUANTUM COORDINATES // SECURE FEED</div>
    </div>
  `;
};

const showError = (message) => {
  appContainer.innerHTML = `
    <div class="error-container">
      <div class="error-icon">⚠ ERROR</div>
      <div class="error-title">FEED ACQUISITION FAILURE</div>
      <div class="error-message">${message}</div>
    </div>
  `;
};

const buildMediaHTML = (data) => {
  const mediaUrl = data.url;
  const mediaType = data.media_type;

  if (mediaType === 'image') {
    return `<img class="viewport-image" src="${mediaUrl}" alt="${data.title || 'NASA Astronomy Picture'}" />`;
  } else if (mediaType === 'video') {
    if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) {
      let embedUrl = mediaUrl;
      if (mediaUrl.includes('watch?v=')) {
        const videoId = mediaUrl.split('v=')[1]?.split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
      } else if (mediaUrl.includes('youtu.be/')) {
        const videoId = mediaUrl.split('youtu.be/')[1]?.split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
      }
      return `<iframe class="viewport-iframe" src="${embedUrl}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    } else {
      return `<video class="viewport-video" src="${mediaUrl}" controls autoplay loop></video>`;
    }
  } else {
    return `<iframe class="viewport-iframe" src="${mediaUrl}" allowfullscreen></iframe>`;
  }
};

const fetchAPOD = (date = '') => {
  showLoading();

  if (!API_KEY || API_KEY === 'your_actual_key_here') {
    showError('VITE_NASA_API_KEY is not configured. Please define it in your .env file.');
    return;
  }

  let queryUrl = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;
  if (date) {
    queryUrl += `&date=${date}`;
  }

  fetch(queryUrl)
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errData) => {
          throw new Error(errData.msg || errData.error?.message || `HTTP error ${response.status}`);
        }).catch(() => {
          throw new Error(`HTTP network error ${response.status}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      const title = data.title || 'Untitled Transmission';
      const explanation = data.explanation || 'No readout information provided for this coordinate sector.';
      const displayDate = data.date || date || todayStr;
      const mediaHTML = buildMediaHTML(data);
      const copyright = data.copyright ? data.copyright.replace(/\n/g, ' ').trim() : 'PUBLIC DOMAIN';
      const isHDImage = data.media_type === 'image' && data.hdurl;

      appContainer.innerHTML = `
        <section class="viewport-panel animate-fade-in">
          <div class="media-container">
            ${mediaHTML}
          </div>
        </section>

        <section class="readout-panel animate-fade-in">
          <div class="readout-card">
            <div class="meta-group">
              <div class="meta-item">
                <span class="meta-label">SECTOR DATE</span>
                <div class="meta-value">${displayDate}</div>
              </div>
              <div class="meta-item">
                <span class="meta-label">SOURCE AGENCY</span>
                <div class="meta-value">NASA APOD</div>
              </div>
            </div>

            <h2 class="readout-title">${title}</h2>
            
            <div class="meta-group" style="margin-top: -8px; border-bottom: none; padding-bottom: 0;">
              <div class="meta-item">
                <span class="meta-label">DATA TYPE</span>
                <div class="meta-value" style="color: var(--neon-purple); text-shadow: none;">
                  ${data.media_type.toUpperCase()}
                </div>
              </div>
              <div class="meta-item">
                <span class="meta-label">OWNERSHIP SIGNATURE</span>
                <div class="meta-value" style="color: var(--neon-orange); text-shadow: none; font-size: 0.8rem;">
                  ${copyright.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div class="readout-card" style="flex: 1;">
            <h3 class="hud-readout-header">TRANSMISSION DECODED</h3>
            <p class="readout-explanation">${explanation}</p>
            ${
              isHDImage
                ? `
              <div class="hd-link-wrapper" style="margin-top: 24px; text-align: right;">
                <a href="${data.hdurl}" target="_blank" class="hd-link">
                  VIEW FULL-RES DATA // HD
                </a>
              </div>
            `
                : ''
            }
          </div>
        </section>
      `;

      if (currentDateDisplay) {
        currentDateDisplay.textContent = formatDateForReadout(displayDate);
      }
      currentDate = displayDate;

      const hdBtn = document.querySelector('.hd-link');
      if (hdBtn) {
        hdBtn.addEventListener('mouseenter', () => {
          hdBtn.style.boxShadow = '0 0 10px var(--neon-purple)';
          hdBtn.style.background = 'rgba(255, 255, 255, 0.08)';
        });
        hdBtn.addEventListener('mouseleave', () => {
          hdBtn.style.boxShadow = 'none';
          hdBtn.style.background = 'rgba(255, 255, 255, 0.02)';
        });
      }
    })
    .catch((error) => {
      console.error('NASA APOD Fetch Error:', error);
      showError(error.message || 'Unknown network transmission failure.');
    });
};

// ==========================================
// CUSTOM CALENDAR CONTROLLER
// ==========================================
const renderCalendar = () => {
  if (!calendarPopover) return;

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const numberOfDays = new Date(viewYear, viewMonth + 1, 0).getDate();

  const monthsList = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  let monthOptions = '';
  monthsList.forEach((m, idx) => {
    monthOptions += `<option value="${idx}" ${idx === viewMonth ? 'selected' : ''}>${m}</option>`;
  });

  let yearOptions = '';
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1995; y--) {
    yearOptions += `<option value="${y}" ${y === viewYear ? 'selected' : ''}>${y}</option>`;
  }

  const headerHTML = `
    <div class="calendar-header">
      <button class="calendar-nav-btn" id="cal-prev-month" title="Previous Month">◀</button>
      <div class="calendar-select-group">
        <select class="calendar-select" id="cal-select-month">${monthOptions}</select>
        <select class="calendar-select" id="cal-select-year">${yearOptions}</select>
      </div>
      <button class="calendar-nav-btn" id="cal-next-month" title="Next Month">▶</button>
    </div>
  `;

  const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const weekdaysHTML = `
    <div class="calendar-weekdays">
      ${weekdays.map(d => `<div>${d}</div>`).join('')}
    </div>
  `;

  let daysHTML = '<div class="calendar-days">';
  for (let i = 0; i < firstDayIndex; i++) {
    daysHTML += '<div class="calendar-day-btn empty"></div>';
  }

  const minDate = new Date('1995-06-16');
  const maxDate = new Date();

  for (let day = 1; day <= numberOfDays; day++) {
    const dateString = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const thisDate = new Date(viewYear, viewMonth, day);
    const isDisabled = thisDate < minDate || thisDate > maxDate;
    const isActive = dateString === currentDate;

    daysHTML += `
      <button 
        class="calendar-day-btn ${isActive ? 'active' : ''}" 
        data-date="${dateString}" 
        ${isDisabled ? 'disabled' : ''}
      >
        ${day}
      </button>
    `;
  }
  daysHTML += '</div>';

  calendarPopover.innerHTML = headerHTML + weekdaysHTML + daysHTML;

  // Header Nav Controls
  document.getElementById('cal-prev-month').addEventListener('click', (e) => {
    e.stopPropagation();
    viewDate.setMonth(viewDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('cal-next-month').addEventListener('click', (e) => {
    e.stopPropagation();
    viewDate.setMonth(viewDate.getMonth() + 1);
    renderCalendar();
  });

  document.getElementById('cal-select-month').addEventListener('change', (e) => {
    viewDate.setMonth(parseInt(e.target.value));
    renderCalendar();
  });

  document.getElementById('cal-select-year').addEventListener('change', (e) => {
    viewDate.setFullYear(parseInt(e.target.value));
    renderCalendar();
  });

  // Day Selection
  calendarPopover.querySelectorAll('.calendar-day-btn:not(.empty):not(:disabled)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedDate = btn.dataset.date;
      currentDate = selectedDate;
      if (currentDateDisplay) {
        currentDateDisplay.textContent = formatDateForReadout(currentDate);
      }
      fetchAPOD(currentDate);
      closePopover();
    });
  });
};

const openPopover = () => {
  if (!calendarPopover) return;
  if (currentDate) {
    const parts = currentDate.split('-');
    if (parts.length === 3) {
      viewDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }
  renderCalendar();
  calendarPopover.style.display = 'flex';
  setTimeout(() => {
    calendarPopover.classList.add('show');
  }, 10);
};

const closePopover = () => {
  if (!calendarPopover) return;
  calendarPopover.classList.remove('show');
  setTimeout(() => {
    calendarPopover.style.display = 'none';
  }, 200);
};

const togglePopover = (e) => {
  e.stopPropagation();
  if (calendarPopover.classList.contains('show')) {
    closePopover();
  } else {
    openPopover();
  }
};

if (coordinatesTrigger) {
  coordinatesTrigger.addEventListener('click', togglePopover);
}

document.addEventListener('click', (e) => {
  if (calendarPopover && calendarPopover.classList.contains('show')) {
    if (!calendarPopover.contains(e.target) && !coordinatesTrigger.contains(e.target)) {
      closePopover();
    }
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && calendarPopover && calendarPopover.classList.contains('show')) {
    closePopover();
  }
});

// Initial load
fetchAPOD();
