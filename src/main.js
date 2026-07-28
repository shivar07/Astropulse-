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
let viewDate = new Date(); 

const minDateStr = '1995-06-16';
const todayDateStr = todayStr;

let isAutoScanning = false;
let countdownVal = 15;
let countdownTimer = null;

const updateNavButtonsState = () => {
  const prevBtn = document.getElementById('prev-sol-btn');
  const nextBtn = document.getElementById('next-sol-btn');
  
  if (prevBtn) {
    const isAtMin = currentDate === minDateStr;
    prevBtn.disabled = isAtMin;
  }
  if (nextBtn) {
    const isAtMax = currentDate === todayDateStr;
    nextBtn.disabled = isAtMax;
  }
};

const downloadImage = (url, filename) => {
  const downloadBtn = document.querySelector('.download-link');
  const originalText = downloadBtn ? downloadBtn.textContent : 'Download Image';
  if (downloadBtn) {
    downloadBtn.textContent = 'Downloading...';
    downloadBtn.style.pointerEvents = 'none';
    downloadBtn.style.opacity = '0.6';
  }

  let targetUrl = url;
  if (url.startsWith('https://apod.nasa.gov')) {
    targetUrl = `/nasa-proxy${url.replace('https://apod.nasa.gov', '')}`;
  }

  fetch(targetUrl)
    .then((response) => {
      if (!response.ok) throw new Error('Blob fetch failed');
      return response.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = filename || 'nasa-apod-image.jpg';
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(blobUrl);
    })
    .catch((err) => {
      console.error('Download failed, opening in new tab:', err);
      window.open(url, '_blank');
    })
    .finally(() => {
      if (downloadBtn) {
        downloadBtn.textContent = originalText;
        downloadBtn.style.pointerEvents = 'auto';
        downloadBtn.style.opacity = '1';
      }
    });
};

const formatDateForReadout = (dateStr) => {
  if (!dateStr) return 'SELECT DATE';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}/${parts[0]}`; 
  }
  return dateStr;
};

const showLoading = () => {
  appContainer.innerHTML = `
    <div class="loading-container">
      <div class="radar-loader"></div>
      <div class="loading-text">Loading picture of the day...</div>
    </div>
  `;
};

const showError = (message) => {
  appContainer.innerHTML = `
    <div class="error-container">
      <div class="error-icon">⚠</div>
      <div class="error-title">Unable to Load Content</div>
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

const fetchWithTimeout = (url, options = {}, timeout = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(id));
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

  fetchWithTimeout(queryUrl, {}, 8000)
    .then((response) => {
      if (!response.ok) {
        return response.json().then(
          (errData) => {
            throw new Error(errData.msg || errData.error?.message || `HTTP error ${response.status}`);
          },
          () => {
            throw new Error(`HTTP network error ${response.status}`);
          }
        );
      }
      return response.json();
    })
    .then((data) => {
      const title = data.title || 'Untitled';
      const explanation = data.explanation || 'No description available for this date.';
      const displayDate = data.date || date || todayStr;
      const mediaHTML = buildMediaHTML(data);
      const copyright = data.copyright ? data.copyright.replace(/\n/g, ' ').trim() : 'Public Domain';
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
                <span class="meta-label">Date</span>
                <div class="meta-value">${displayDate}</div>
              </div>
              <div class="meta-item">
                <span class="meta-label">Agency</span>
                <div class="meta-value">NASA APOD</div>
              </div>
            </div>

            <h2 class="readout-title">${title}</h2>
            
            <div class="meta-group" style="margin-top: -8px; border-bottom: none; padding-bottom: 0;">
              <div class="meta-item">
                <span class="meta-label">Type</span>
                <div class="meta-value" style="color: var(--neon-purple); text-shadow: none;">
                  ${data.media_type.toUpperCase()}
                </div>
              </div>
              <div class="meta-item">
                <span class="meta-label">Copyright</span>
                <div class="meta-value" style="color: var(--neon-orange); text-shadow: none; font-size: 0.8rem;">
                  ${copyright.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div class="readout-card" style="flex: 1;">
            <h3 class="hud-readout-header">Description</h3>
            <p class="readout-explanation">${explanation}</p>
            ${
              data.media_type === 'image'
                ? `
              <div class="hd-link-wrapper" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end; flex-wrap: wrap;">
                ${
                  data.hdurl
                    ? `<a href="${data.hdurl}" target="_blank" class="hd-link">View HD Image</a>`
                    : ''
                }
                <button class="hd-link download-link" id="download-apod-btn">Download Image</button>
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
      updateNavButtonsState();

      const downloadBtn = document.getElementById('download-apod-btn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
          const filename = `NASA-APOD-${displayDate}.jpg`;
          const downloadUrl = data.hdurl || data.url;
          downloadImage(downloadUrl, filename);
        });
      }
    })
    .catch((error) => {
      console.error('NASA APOD Fetch Error:', error);
      
      let errorMsg = error.message || 'Unknown network error.';
      if (error.name === 'AbortError') {
        errorMsg = 'Request timed out. Please check your internet connection or check your NASA API key quota.';
      }
      
      showError(errorMsg);
      
      if (errorMsg.toLowerCase().includes('rate limit') || errorMsg.includes('429') || errorMsg.toLowerCase().includes('api_key')) {
        stopAutoScan();
      }
    });
};

const renderCalendar = () => {
  if (!calendarPopover) return;

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const numberOfDays = new Date(viewYear, viewMonth + 1, 0).getDate();

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
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

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
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

  calendarPopover.querySelectorAll('.calendar-day-btn:not(.empty):not(:disabled)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedDate = btn.dataset.date;
      currentDate = selectedDate;
      if (currentDateDisplay) {
        currentDateDisplay.textContent = formatDateForReadout(currentDate);
      }
      stopAutoScan();
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

const stepDate = (direction) => {
  stopAutoScan();
  let tempDate = new Date(currentDate);
  if (isNaN(tempDate.getTime())) {
    tempDate = new Date();
  }
  tempDate.setDate(tempDate.getDate() + direction);
  
  const y = tempDate.getFullYear();
  const m = String(tempDate.getMonth() + 1).padStart(2, '0');
  const d = String(tempDate.getDate()).padStart(2, '0');
  const targetDateStr = `${y}-${m}-${d}`;
  
  const minDate = new Date(minDateStr);
  const maxDate = new Date(todayDateStr);
  
  if (tempDate >= minDate && tempDate <= maxDate) {
    currentDate = targetDateStr;
    if (currentDateDisplay) {
      currentDateDisplay.textContent = formatDateForReadout(currentDate);
    }
    fetchAPOD(currentDate);
  }
};

const fetchRandomAPOD = () => {
  const minDate = new Date(minDateStr).getTime();
  const maxDate = new Date(todayDateStr).getTime();
  const randomTime = minDate + Math.random() * (maxDate - minDate);
  const randomDate = new Date(randomTime);
  
  const y = randomDate.getFullYear();
  const m = String(randomDate.getMonth() + 1).padStart(2, '0');
  const d = String(randomDate.getDate()).padStart(2, '0');
  
  currentDate = `${y}-${m}-${d}`;
  if (currentDateDisplay) {
    currentDateDisplay.textContent = formatDateForReadout(currentDate);
  }
  fetchAPOD(currentDate);
};

const startAutoScan = () => {
  isAutoScanning = true;
  const scanBtn = document.getElementById('auto-scan-btn');
  if (scanBtn) {
    scanBtn.classList.add('active');
    scanBtn.textContent = `Playing: ${countdownVal}s`;
  }
  
  countdownTimer = setInterval(() => {
    countdownVal--;
    if (countdownVal <= 0) {
      countdownVal = 15;
      fetchRandomAPOD();
    }
    if (scanBtn) {
      scanBtn.textContent = `Playing: ${countdownVal}s`;
    }
  }, 1000);
};

const stopAutoScan = () => {
  if (!isAutoScanning) return;
  isAutoScanning = false;
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  countdownVal = 15;
  const scanBtn = document.getElementById('auto-scan-btn');
  if (scanBtn) {
    scanBtn.classList.remove('active');
    scanBtn.textContent = 'Auto Play: OFF';
  }
};

const toggleAutoScan = () => {
  if (isAutoScanning) {
    stopAutoScan();
  } else {
    startAutoScan();
  }
};

document.getElementById('prev-sol-btn')?.addEventListener('click', () => stepDate(-1));
document.getElementById('next-sol-btn')?.addEventListener('click', () => stepDate(1));
document.getElementById('random-telemetry-btn')?.addEventListener('click', () => {
  stopAutoScan();
  fetchRandomAPOD();
});
document.getElementById('auto-scan-btn')?.addEventListener('click', toggleAutoScan);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && calendarPopover && calendarPopover.classList.contains('show')) {
    closePopover();
    return;
  }
  
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
    return;
  }
  
  if (e.key === 'ArrowLeft') {
    stepDate(-1);
  } else if (e.key === 'ArrowRight') {
    stepDate(1);
  }
});

fetchAPOD();
