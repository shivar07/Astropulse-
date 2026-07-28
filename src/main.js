import './style.css';

const API_KEY = import.meta.env.VITE_NASA_API_KEY;

const appContainer = document.querySelector('#app');
const datePicker = document.querySelector('#datepicker');

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayStr = getTodayDateString();
if (datePicker) {
  datePicker.max = todayStr;
  datePicker.value = todayStr;
}

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

      const hdBtn = document.querySelector('.hd-link');
      if (hdBtn) {
        hdBtn.addEventListener('mouseenter', () => {
          hdBtn.style.boxShadow = 'var(--shadow-neon)';
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

if (datePicker) {
  datePicker.addEventListener('change', (e) => {
    fetchAPOD(e.target.value);
  });
}

fetchAPOD();
