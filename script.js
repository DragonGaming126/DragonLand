const STORAGE_KEY = 'fireStreakData2026';

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  workouts: {},
  totalPompes: 0,
  totalTractions: 0,
  totalAbdos: 0,
  bestStreak: 0,
  challenge: {
    active: false,
    type: '100pompes30j',
    startDate: '2026-03-01'
  }
};

let currentMonth = new Date();
let currentExercises = [];

const exercisesDB = [
  { name: "Pompes classiques",          tags: ["pectoraux", "pompes", "push"] },
  { name: "Pompes diamant",              tags: ["triceps", "pompes", "push"] },
  { name: "Pompes larges",               tags: ["pectoraux", "pompes", "push"] },
  { name: "Pompes déclinées",            tags: ["pectoraux sup", "pompes", "push"] },
  { name: "Pompes pike / shoulder taps", tags: ["épaules", "pompes", "push"] },
  { name: "Tractions pronation",         tags: ["dos", "tractions", "pull"] },
  { name: "Tractions supination",        tags: ["biceps", "tractions", "pull"] },
  { name: "Tractions neutres",           tags: ["dos", "biceps", "tractions", "pull"] },
  { name: "Dips sur barres",             tags: ["triceps", "pectoraux", "push"] },
  { name: "Dips sur banc",               tags: ["triceps", "push"] },
  { name: "Squats au poids du corps",    tags: ["quadriceps", "jambes", "bas du corps"] },
  { name: "Fentes marchées",             tags: ["quadriceps", "fessiers", "jambes"] },
  { name: "Mollets debout",              tags: ["mollets", "jambes"] },
  { name: "Relevés de jambes suspendu",  tags: ["abdos inférieurs", "core"] },
  { name: "Crunchs classiques",          tags: ["abdos supérieurs", "core"] },
  { name: "Russian twists",              tags: ["obliques", "core"] },
  { name: "Planche (temps)",             tags: ["gainage", "core", "isométrique"] },
  { name: "Mountain climbers",           tags: ["cardio", "core", "dynamique"] },
  { name: "Burpees",                     tags: ["cardio", "full body", "explosif"] },
  { name: "Jumping jacks",               tags: ["cardio", "échauffement"] },
];

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function isDone(date) {
  const w = data.workouts[date];
  return Array.isArray(w) && w.length > 0;
}

function calculateStreak() {
  let streak = 0;
  let date = new Date();
  while (true) {
    if (isDone(date.toISOString().split('T')[0])) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else break;
  }
  const oldBest = data.bestStreak;
  data.currentStreak = streak;
  if (streak > oldBest) {
    data.bestStreak = streak;
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }
  save();
}

function updateTodayScreen() {
  const streak = data.currentStreak || 0;
  document.getElementById('streak-circle').textContent = streak;
  document.getElementById('current-streak').textContent = streak + ' jours';
  document.getElementById('best-streak').textContent = `Meilleur : ${data.bestStreak || 0} jours`;

  const today = getToday();
  if (isDone(today)) {
    document.getElementById('status').innerHTML = 'Entraînement validé aujourd’hui 🔥';
  } else {
    document.getElementById('status').textContent = 'Pas encore fait aujourd’hui…';
  }
}

function updateStats() {
  let pompes = 0, tractions = 0, core = 0, total = 0;

  Object.values(data.workouts).forEach(arr => {
    if (!Array.isArray(arr)) return;
    arr.forEach(ex => {
      const reps = ex.series * ex.reps;
      total += reps;
      const name = ex.name.toLowerCase();
      if (name.includes('pompe')) pompes += reps;
      if (name.includes('traction') || name.includes('dips')) tractions += reps;
      if (name.includes('abdo') || name.includes('crunch') || name.includes('planche') || name.includes('russian') || name.includes('mountain')) core += reps;
    });
  });

  document.getElementById('total-pompes').textContent = pompes;
  document.getElementById('total-tractions').textContent = tractions;
  document.getElementById('total-abdos').textContent = core;
  document.getElementById('total-reps').textContent = total;

  let level = 'Débutant';
  if (total > 20000) level = 'Légende 🔥🔥🔥🔥';
  else if (total > 10000) level = 'Élite 🔥🔥🔥';
  else if (total > 5000) level = 'Avancé 🔥🔥';
  else if (total > 1500) level = 'Inter 🔥';

  document.getElementById('level').textContent = `Niveau : ${level}`;

  const challengeSec = document.getElementById('challenge-section');
  if (!data.challenge?.active) {
    challengeSec.style.display = 'none';
    return;
  }

  challengeSec.style.display = 'block';
  let daysDone = 0;
  const start = data.challenge.startDate;
  const today = getToday();

  Object.keys(data.workouts).forEach(d => {
    if (d < start || d > today) return;
    const arr = data.workouts[d];
    if (!Array.isArray(arr)) return;
    const dayPompes = arr
      .filter(ex => ex.name.toLowerCase().includes('pompe'))
      .reduce((sum, ex) => sum + ex.series * ex.reps, 0);
    if (dayPompes >= 100) daysDone++;
  });

  const pct = Math.min(100, (daysDone / 30) * 100);
  document.getElementById('challenge-bar').style.width = pct + '%';
  document.getElementById('challenge-status').textContent = `${daysDone}/30 jours (${pct.toFixed(0)}%)`;
}

function renderExerciseList() {
  const container = document.getElementById('exercise-list');
  container.innerHTML = '';
  currentExercises.forEach((ex, i) => {
    const totalReps = (ex.series || 1) * (ex.reps || 0);
    const div = document.createElement('div');
    div.className = 'exercise-item';
    div.innerHTML = `
      <div class="exercise-header">
        <span class="exercise-name">${ex.name}</span>
        <button class="remove-ex" data-i="${i}">×</button>
      </div>
      <div class="series-reps">
        <input type="number" value="${ex.series || 1}" min="1" placeholder="Séries" data-i="${i}" data-f="series">
        <input type="number" value="${ex.reps || 0}" min="0" placeholder="Répétitions" data-i="${i}" data-f="reps">
      </div>
      <div class="ex-total">Total : ${totalReps} reps</div>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', e => {
      const i = e.target.dataset.i;
      const f = e.target.dataset.f;
      currentExercises[i][f] = parseInt(e.target.value) || (f === 'series' ? 1 : 0);
      renderExerciseList();
    });
  });

  container.querySelectorAll('.remove-ex').forEach(btn => {
    btn.onclick = () => {
      currentExercises.splice(parseInt(btn.dataset.i), 1);
      renderExerciseList();
    };
  });
}

function renderExercises(filterTag = 'all', search = '') {
  const list = document.getElementById('ex-list');
  list.innerHTML = '';

  exercisesDB
    .filter(ex => {
      if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterTag !== 'all' && !ex.tags.some(tag => tag.includes(filterTag))) return false;
      return true;
    })
    .forEach(ex => {
      const div = document.createElement('div');
      div.className = 'ex-option';
      div.innerHTML = `
        <div style="font-weight:600; font-size:1.1rem;">${ex.name}</div>
        <div class="ex-tags">${ex.tags.join(' · ')}</div>
      `;
      div.onclick = () => {
        currentExercises.push({ name: ex.name, series: 3, reps: 10 });
        renderExerciseList();
        document.getElementById('exercise-selector').style.display = 'none';
      };
      list.appendChild(div);
    });
}

function initExerciseSelector() {
  document.querySelectorAll('.tag-filter').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tag-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tag = btn.dataset.tag;
      const search = document.getElementById('ex-search').value;
      renderExercises(tag, search);
    };
  });

  document.getElementById('ex-search').addEventListener('input', e => {
    const activeTag = document.querySelector('.tag-filter.active')?.dataset.tag || 'all';
    renderExercises(activeTag, e.target.value);
  });

  renderExercises('all', '');
}

function generateCalendar() {
  const y = currentMonth.getFullYear();
  const m = currentMonth.getMonth();
  document.getElementById('month-title').textContent =
    new Intl.DateTimeFormat('fr-FR', {month:'long', year:'numeric'}).format(currentMonth);

  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'day-name';
    el.textContent = d;
    grid.appendChild(el);
  });

  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const start = first.getDay() || 7;

  for (let i = 1; i < start; i++) {
    grid.appendChild(Object.assign(document.createElement('div'), {className: 'day empty'}));
  }

  const today = getToday();

  for (let d = 1; d <= last.getDate(); d++) {
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const el = document.createElement('div');
    el.className = 'day';
    el.textContent = d;
    el.dataset.date = dateStr;

    if (dateStr === today) el.classList.add('today');

    const workout = data.workouts[dateStr];
    if (Array.isArray(workout) && workout.length > 0) {
      el.classList.add('done');
    } else if (dateStr < today) {
      el.classList.add('missing');
    }

    grid.appendChild(el);
  }

  grid.querySelectorAll('.day.done').forEach(el => {
    el.onclick = () => {
      const dateStr = el.dataset.date;
      const arr = data.workouts[dateStr];
      if (!Array.isArray(arr)) return;

      let html = '';
      let tot = 0;
      arr.forEach(ex => {
        const r = ex.series * ex.reps;
        tot += r;
        html += `<div>${ex.name} : ${ex.series} × ${ex.reps} = ${r}</div>`;
      });

      document.getElementById('modal-date').textContent =
        new Date(dateStr).toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'});
      document.getElementById('modal-stats').innerHTML = html;
      document.getElementById('modal-total').textContent = `Total : ${tot} répétitions`;
      document.getElementById('day-detail-modal').style.display = 'flex';
    };
  });
}

// ─── Événements ───
document.querySelectorAll('nav button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('nav button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(b.dataset.screen).classList.add('active');
    if (b.dataset.screen === 'calendar') generateCalendar();
  };
});

document.getElementById('btn-add-today').onclick = () =>
  document.querySelector('nav button[data-screen="add"]').click();

document.getElementById('btn-cancel').onclick = () =>
  document.querySelector('nav button[data-screen="today"]').click();

document.getElementById('btn-save').onclick = () => {
  const today = getToday();
  if (currentExercises.length === 0 && !confirm("Journée vide ?")) return;

  data.workouts[today] = currentExercises.map(ex => ({
    name: ex.name,
    series: ex.series || 1,
    reps: ex.reps || 0
  }));

  calculateStreak();
  save();
  currentExercises = [];
  renderExerciseList();
  updateTodayScreen();
  updateStats();
  alert("Enregistré ! 🔥");
  document.querySelector('nav button[data-screen="today"]').click();
};

document.getElementById('add-exercise-btn').onclick = () =>
  document.getElementById('exercise-selector').style.display = 'flex';

document.getElementById('close-selector').onclick = () =>
  document.getElementById('exercise-selector').style.display = 'none';

document.getElementById('modal-close').onclick = () =>
  document.getElementById('day-detail-modal').style.display = 'none';

document.getElementById('day-detail-modal').onclick = e => {
  if (e.target.id === 'day-detail-modal') document.getElementById('day-detail-modal').style.display = 'none';
};

document.getElementById('prev-month').onclick = () => {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  generateCalendar();
};

document.getElementById('next-month').onclick = () => {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  generateCalendar();
};

// Init
initExerciseSelector();
calculateStreak();
updateTodayScreen();
updateStats();
generateCalendar();