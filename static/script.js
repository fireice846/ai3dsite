// --- 3D tilt effect on the hero card ---
const card = document.getElementById('tiltCard');

document.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  const rotateX = (-y / rect.height) * 20;
  const rotateY = (x / rect.width) * 20;
  card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

document.addEventListener('mouseleave', () => {
  card.style.transform = 'rotateX(0deg) rotateY(0deg)';
});

// --- Forecast tool ---
let fcChartInstance = null;

document.getElementById('fcRun').addEventListener('click', async () => {
  const startingValue = document.getElementById('fcStart').value;
  const growthRate = document.getElementById('fcRate').value;
  const periods = document.getElementById('fcPeriods').value;
  const summaryEl = document.getElementById('fcSummary');

  summaryEl.textContent = 'Calculating...';

  try {
    const res = await fetch('/api/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startingValue, growthRate, periods })
    });
    const data = await res.json();
    if (data.error) { summaryEl.textContent = data.error; return; }

    const labels = data.forecast.map((_, i) => `Period ${i + 1}`);
    const ctx = document.getElementById('fcChart').getContext('2d');
    if (fcChartInstance) fcChartInstance.destroy();
    fcChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Projected value',
          data: data.forecast,
          borderColor: '#7f7fff',
          backgroundColor: 'rgba(127,127,255,0.15)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        plugins: { legend: { labels: { color: '#ccc' } } },
        scales: {
          x: { ticks: { color: '#aaa' } },
          y: { ticks: { color: '#aaa' } }
        }
      }
    });

    const finalValue = data.forecast[data.forecast.length - 1];
    summaryEl.textContent =
      `Starting at ${data.startingValue}, growing ${data.growthRatePct}% per period ` +
      `→ projected value after ${data.periods} periods: ${finalValue}`;
  } catch (err) {
    summaryEl.textContent = 'Error running forecast.';
  }
});

// --- Region cost estimator ---
async function loadRegions() {
  try {
    const res = await fetch('/api/regions');
    const data = await res.json();
    const select = document.getElementById('ceRegion');
    data.regions.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Could not load regions', err);
  }
}
loadRegions();

document.getElementById('ceRun').addEventListener('click', async () => {
  const baseCost = document.getElementById('ceBase').value;
  const region = document.getElementById('ceRegion').value;
  const resultEl = document.getElementById('ceResult');
  resultEl.textContent = 'Estimating...';

  try {
    const res = await fetch('/api/cost-estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseCost, region })
    });
    const data = await res.json();
    if (data.error) { resultEl.textContent = data.error; return; }
    resultEl.textContent =
      `Estimated cost in ${data.region}: $${data.estimatedCost} ` +
      `(multiplier ${data.multiplier}x)`;
  } catch (err) {
    resultEl.textContent = 'Error estimating cost.';
  }
});

// --- Currency converter ---
document.getElementById('ccRun').addEventListener('click', async () => {
  const amount = document.getElementById('ccAmount').value;
  const from = document.getElementById('ccFrom').value;
  const to = document.getElementById('ccTo').value;
  const resultEl = document.getElementById('ccResult');
  resultEl.textContent = 'Converting...';

  try {
    const res = await fetch('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, from, to })
    });
    const data = await res.json();
    if (data.error) { resultEl.textContent = data.error; return; }
    resultEl.textContent = `${data.amount} ${data.from} = ${data.converted} ${data.to}`;
  } catch (err) {
    resultEl.textContent = 'Error converting currency.';
  }
});

// --- Chat widget logic ---
const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

chatToggle.addEventListener('click', () => {
  chatWindow.classList.toggle('hidden');
});

function addMessage(text, sender) {
  const div = document.createElement('div');
  div.classList.add('msg', sender);
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  chatInput.value = '';

  addMessage('...', 'bot');
  const thinkingBubble = chatMessages.lastChild;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    thinkingBubble.textContent = data.reply;
  } catch (err) {
    thinkingBubble.textContent = 'Error: could not reach server.';
  }
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});
