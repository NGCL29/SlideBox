// SlideBox LMS Mobile Client Application • Black & Gold Premium Edition
let state = {
  activeTab: 'home',
  role: 'professor', // 'professor' | 'student'
  theme: 'dark',
  frameMode: 'phone', // 'phone' | 'full'
  courses: [],
  presentations: [],
  exercises: [],
  submissions: [],
  activities: [],
  stats: null,
  activeFilterPres: 'all',
  activeFilterEx: 'all',
  
  // Slide Player State
  currentDeck: null,
  currentSlideIndex: 0,
  laserActive: false,
  
  // Quiz Player State
  currentQuiz: null,
  quizAnswers: {},
  quizQuestionIndex: 0,
  quizCurrentScore: 0
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  updateClock();
  setInterval(updateClock, 1000);
  fetchAllData();

  // Register service worker if available
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const clockEl = document.getElementById('current-clock');
  if (clockEl) clockEl.textContent = `${hours}:${minutes}`;
}

function initTheme() {
  document.documentElement.classList.add('dark');
  state.theme = 'dark';
}

function toggleTheme() {
  // Always dark-first in luxury edition
  if (state.theme === 'dark') {
    document.documentElement.classList.remove('dark');
    state.theme = 'light';
  } else {
    document.documentElement.classList.add('dark');
    state.theme = 'dark';
  }
}

function toggleFrameMode() {
  const container = document.getElementById('phone-container');
  const label = document.getElementById('frame-toggle-label');
  if (state.frameMode === 'phone') {
    container.classList.add('mode-full');
    state.frameMode = 'full';
    label.textContent = 'Phone Frame View';
  } else {
    container.classList.remove('mode-full');
    state.frameMode = 'phone';
    label.textContent = 'Full Screen View';
  }
}

// ==========================================
// ROLE SWITCHER
// ==========================================
function setRole(newRole) {
  state.role = newRole;
  const profBtn = document.getElementById('role-prof-btn');
  const stuBtn = document.getElementById('role-student-btn');
  const badge = document.getElementById('role-badge');

  if (newRole === 'professor') {
    profBtn.className = 'px-2.5 py-1 rounded-lg text-xs font-bold transition gold-gradient-bg text-black shadow';
    stuBtn.className = 'px-2.5 py-1 rounded-lg text-xs font-semibold transition text-neutral-400 hover:text-white';
    badge.textContent = 'Professor Mode';
    badge.className = 'text-[9px] font-bold tracking-wider text-gold-400 uppercase';
  } else {
    stuBtn.className = 'px-2.5 py-1 rounded-lg text-xs font-bold transition gold-gradient-bg text-black shadow';
    profBtn.className = 'px-2.5 py-1 rounded-lg text-xs font-semibold transition text-neutral-400 hover:text-white';
    badge.textContent = 'Student Mode';
    badge.className = 'text-[9px] font-bold tracking-wider text-neutral-300 uppercase';
  }

  renderPresentations();
  renderExercises();
}

// ==========================================
// API DATA FETCHING
// ==========================================
async function fetchAllData() {
  try {
    const [coursesRes, presRes, exRes, statsRes, actsRes, subsRes] = await Promise.all([
      fetch('/api/courses').then(r => r.json()),
      fetch('/api/presentations').then(r => r.json()),
      fetch('/api/exercises').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/activities').then(r => r.json()),
      fetch('/api/submissions').then(r => r.json())
    ]);

    state.courses = coursesRes || [];
    state.presentations = presRes || [];
    state.exercises = exRes || [];
    state.stats = statsRes || null;
    state.activities = actsRes || [];
    state.submissions = subsRes || [];

    updateUI();
  } catch (err) {
    console.error('Error fetching SlideBox data:', err);
  }
}

function updateUI() {
  updateCourseSelects();
  updateStorageBadges();
  renderHome();
  renderPresentations();
  renderExercises();
  renderVault();
}

function updateStorageBadges() {
  if (!state.stats) return;
  const pct = state.stats.percentage_used || 0;
  const usedMb = (state.stats.total_bytes / (1024 * 1024)).toFixed(1);
  const totalMb = (state.stats.quota_bytes / (1024 * 1024)).toFixed(0);

  const headerStorage = document.getElementById('header-storage-pct');
  if (headerStorage) headerStorage.textContent = `${pct}% used`;

  const homeUsed = document.getElementById('home-storage-used');
  const homeTotal = document.getElementById('home-storage-total');
  const homeBar = document.getElementById('home-storage-bar');
  const homePresCount = document.getElementById('home-pres-count');
  const homeExCount = document.getElementById('home-ex-count');
  const homeSubCount = document.getElementById('home-sub-count');

  if (homeUsed) homeUsed.textContent = `${usedMb} MB`;
  if (homeTotal) homeTotal.textContent = `of ${totalMb} MB Quota`;
  if (homeBar) homeBar.style.width = `${Math.min(100, Math.max(8, pct))}%`;
  if (homePresCount) homePresCount.textContent = state.stats.presentations_count;
  if (homeExCount) homeExCount.textContent = state.stats.exercises_count;
  if (homeSubCount) homeSubCount.textContent = state.stats.submissions_count;

  // Vault tab stats
  const vaultUsedTxt = document.getElementById('vault-used-txt');
  const vaultBarPres = document.getElementById('vault-bar-pres');
  const vaultBarEx = document.getElementById('vault-bar-ex');
  const vaultBarSub = document.getElementById('vault-bar-sub');
  const vaultPresMb = document.getElementById('vault-pres-mb');
  const vaultExMb = document.getElementById('vault-ex-mb');
  const vaultSubMb = document.getElementById('vault-sub-mb');

  if (vaultUsedTxt) vaultUsedTxt.textContent = `${usedMb} MB Used`;
  if (vaultPresMb) vaultPresMb.textContent = `${((state.stats.breakdown?.presentations || 0) / (1024 * 1024)).toFixed(1)} MB`;
  if (vaultExMb) vaultExMb.textContent = `${((state.stats.breakdown?.exercises || 0) / (1024 * 1024)).toFixed(1)} MB`;
  if (vaultSubMb) vaultSubMb.textContent = `${((state.stats.breakdown?.submissions || 0) / (1024 * 1024)).toFixed(1)} MB`;

  const presPct = state.stats.total_bytes > 0 ? (state.stats.breakdown.presentations / state.stats.total_bytes) * 100 : 50;
  const exPct = state.stats.total_bytes > 0 ? (state.stats.breakdown.exercises / state.stats.total_bytes) * 100 : 30;
  const subPct = state.stats.total_bytes > 0 ? (state.stats.breakdown.submissions / state.stats.total_bytes) * 100 : 20;

  if (vaultBarPres) vaultBarPres.style.width = `${presPct}%`;
  if (vaultBarEx) vaultBarEx.style.width = `${exPct}%`;
  if (vaultBarSub) vaultBarSub.style.width = `${subPct}%`;

  const vaultPresCount = document.getElementById('vault-pres-count');
  const vaultExCount = document.getElementById('vault-ex-count');
  const vaultSubCount = document.getElementById('vault-sub-count');
  const vaultCourseCount = document.getElementById('vault-course-count');

  if (vaultPresCount) vaultPresCount.textContent = `${state.stats.presentations_count} Decks`;
  if (vaultExCount) vaultExCount.textContent = `${state.stats.exercises_count} Tasks`;
  if (vaultSubCount) vaultSubCount.textContent = `${state.stats.submissions_count} Submissions`;
  if (vaultCourseCount) vaultCourseCount.textContent = `${state.stats.courses_count} Enrolled`;
}

function updateCourseSelects() {
  const pptSelect = document.getElementById('ppt-course-select');
  const exSelect = document.getElementById('ex-course-select');
  const exPresSelect = document.getElementById('ex-presentation-select');

  if (pptSelect) {
    pptSelect.innerHTML = state.courses.map(c => 
      `<option value="${c.id}">${c.code}: ${c.title}</option>`
    ).join('');
  }

  if (exSelect) {
    exSelect.innerHTML = state.courses.map(c => 
      `<option value="${c.id}">${c.code}: ${c.title}</option>`
    ).join('');
  }

  if (exPresSelect) {
    exPresSelect.innerHTML = `<option value="">-- Standalone Exercise --</option>` + 
      state.presentations.map(p => 
        `<option value="${p.id}">${p.course_code}: ${p.title}</option>`
      ).join('');
  }
}

// ==========================================
// VIEW RENDERING
// ==========================================

// 1. Home Dashboard
function renderHome() {
  // Courses List
  const coursesContainer = document.getElementById('home-courses-list');
  if (coursesContainer) {
    coursesContainer.innerHTML = state.courses.map(c => `
      <div class="shrink-0 w-44 p-3.5 rounded-2xl bg-obsidian-900 border border-neutral-800 hover:border-gold-500/40 shadow-sm flex flex-col justify-between transition">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-black px-2 py-0.5 rounded-md gold-gradient-bg text-black">
              ${escapeHtml(c.code)}
            </span>
            <span class="text-[9px] text-neutral-400 font-medium">${escapeHtml(c.term)}</span>
          </div>
          <h4 class="text-xs font-bold text-white leading-tight line-clamp-2">
            ${escapeHtml(c.title)}
          </h4>
          <p class="text-[10px] text-gold-300/80 mt-1 truncate">
            ${escapeHtml(c.instructor)}
          </p>
        </div>
        <div class="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400">
          <span>${c.presentations_count || 0} decks</span>
          <span>${c.exercises_count || 0} exercises</span>
        </div>
      </div>
    `).join('');
  }

  // Recent Presentations
  const presCarousel = document.getElementById('home-presentations-carousel');
  if (presCarousel) {
    const recent = state.presentations.slice(0, 3);
    if (recent.length === 0) {
      presCarousel.innerHTML = `<p class="text-xs text-neutral-500 italic py-2">No presentations uploaded yet.</p>`;
    } else {
      presCarousel.innerHTML = recent.map(p => `
        <div class="p-3 rounded-2xl bg-obsidian-900 border border-neutral-800 hover:border-gold-500/40 shadow-sm flex items-center justify-between transition">
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center font-black text-xs shrink-0 text-black shadow-sm">
              ${p.extension ? p.extension.replace('.', '').toUpperCase() : 'PPT'}
            </div>
            <div class="truncate">
              <div class="flex items-center gap-1.5">
                <span class="text-[9px] font-bold px-1.5 py-0.2 rounded text-gold-300 bg-gold-500/10 border border-gold-500/20">
                  ${escapeHtml(p.course_code)}
                </span>
                <span class="text-[9px] text-neutral-400">Week ${p.week_number}</span>
              </div>
              <h4 class="text-xs font-bold text-white truncate mt-0.5">
                ${escapeHtml(p.title)}
              </h4>
              <p class="text-[10px] text-neutral-400">
                ${p.slide_count} slides • ${(p.file_size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          </div>
          <button onclick="openSlidePlayer('${p.id}')" class="px-2.5 py-1.5 rounded-xl bg-obsidian-800 border border-gold-500/30 text-gold-300 hover:gold-gradient-bg hover:text-black transition text-xs font-bold shrink-0 ml-2">
            Open
          </button>
        </div>
      `).join('');
    }
  }

  // Active Exercises
  const exList = document.getElementById('home-exercises-list');
  if (exList) {
    const pending = state.exercises.slice(0, 3);
    if (pending.length === 0) {
      exList.innerHTML = `<p class="text-xs text-neutral-500 italic py-2">No active exercises available.</p>`;
    } else {
      exList.innerHTML = pending.map(e => `
        <div class="p-3 rounded-2xl bg-obsidian-900 border border-neutral-800 hover:border-gold-500/40 shadow-sm flex items-center justify-between transition">
          <div class="truncate">
            <div class="flex items-center gap-1.5 mb-0.5">
              <span class="text-[9px] font-bold uppercase tracking-wider text-gold-400">
                ${escapeHtml(e.exercise_type)}
              </span>
              <span class="text-[9px] text-neutral-400">• ${escapeHtml(e.course_code)}</span>
              <span class="text-[9px] text-gold-300 font-bold">${e.points} pts</span>
            </div>
            <h4 class="text-xs font-bold text-white truncate">
              ${escapeHtml(e.title)}
            </h4>
          </div>
          <button onclick="${e.exercise_type === 'quiz' ? `openQuizModal('${e.id}')` : `openSubmissionModal('${e.id}')`}" class="px-2.5 py-1.5 rounded-xl bg-obsidian-800 border border-gold-500/30 text-gold-300 hover:gold-gradient-bg hover:text-black transition text-xs font-bold shrink-0 ml-2">
            ${e.exercise_type === 'quiz' ? 'Start' : 'Submit'}
          </button>
        </div>
      `).join('');
    }
  }
}

// 2. Presentations Vault
function renderPresentations() {
  const container = document.getElementById('presentations-list-container');
  if (!container) return;

  const searchQuery = (document.getElementById('pres-search-input')?.value || '').toLowerCase();
  
  let list = state.presentations.filter(p => {
    if (searchQuery) {
      const matchTitle = (p.title || '').toLowerCase().includes(searchQuery);
      const matchDesc = (p.description || '').toLowerCase().includes(searchQuery);
      const matchCourse = (p.course_code || '').toLowerCase().includes(searchQuery);
      if (!matchTitle && !matchDesc && !matchCourse) return false;
    }
    if (state.activeFilterPres === 'fav') return p.is_favorite === 1;
    if (state.activeFilterPres === 'pptx') return (p.extension || '').includes('ppt');
    if (state.activeFilterPres === 'pdf') return (p.extension || '').includes('pdf');
    return true;
  });

  if (list.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-neutral-500">
        <svg class="w-12 h-12 mx-auto mb-2 opacity-40 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
        <p class="text-xs font-medium text-neutral-400">No presentations match your criteria.</p>
        <button onclick="openUploadTab('presentation')" class="mt-2 text-xs font-bold text-gold-400 underline">Upload your first PPT deck</button>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(p => `
    <div class="p-4 rounded-2xl bg-obsidian-900 border border-neutral-800 hover:border-gold-500/40 shadow-sm space-y-3 transition">
      <div class="flex items-start justify-between">
        <div class="flex items-start gap-3">
          <div class="w-11 h-11 rounded-xl gold-gradient-bg text-black flex items-center justify-center font-black text-xs shrink-0 shadow">
            ${p.extension ? p.extension.replace('.', '').toUpperCase() : 'PPT'}
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded text-gold-300 bg-gold-500/10 border border-gold-500/30">
                ${escapeHtml(p.course_code)}
              </span>
              <span class="text-[10px] text-neutral-400">Week ${p.week_number}</span>
            </div>
            <h4 class="text-xs font-bold text-white mt-1 leading-snug">
              ${escapeHtml(p.title)}
            </h4>
            <p class="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">
              ${escapeHtml(p.description || 'No description provided')}
            </p>
          </div>
        </div>
        
        <!-- Favorite Star -->
        <button onclick="toggleFavorite('${p.id}')" class="p-1 text-neutral-500 hover:text-gold-400 transition" title="Favorite">
          <svg class="w-5 h-5 ${p.is_favorite ? 'text-gold-400 fill-gold-400' : ''}" fill="${p.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
          </svg>
        </button>
      </div>

      <!-- File Details Pill -->
      <div class="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-800">
        <span class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          ${p.slide_count} slides • ${(p.file_size / (1024 * 1024)).toFixed(1)} MB
        </span>
        <span class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          ${p.views_count} views
        </span>
        ${p.linked_exercises_count > 0 ? `
          <span class="text-gold-400 font-bold cursor-pointer hover:underline" onclick="jumpToPresentationExercises('${p.id}')">
            🔗 ${p.linked_exercises_count} exercises
          </span>
        ` : ''}
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 pt-1">
        <button onclick="openSlidePlayer('${p.id}')" class="flex-1 py-2 rounded-xl gold-gradient-bg text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-98">
          <svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Open Slide Deck
        </button>

        <a href="/api/presentations/${p.id}/download" download="${escapeHtml(p.original_name)}" class="px-3 py-2 rounded-xl bg-obsidian-800 border border-neutral-700 hover:border-gold-500/40 text-neutral-200 font-bold text-xs flex items-center justify-center transition" title="Download PPTX">
          <svg class="w-4 h-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        </a>

        ${state.role === 'professor' ? `
          <button onclick="deletePresentation('${p.id}')" class="p-2 rounded-xl bg-obsidian-800 border border-neutral-700 text-neutral-400 hover:text-rose-400 hover:border-rose-500/40 transition" title="Delete">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// 3. Exercises Hub
function renderExercises() {
  const container = document.getElementById('exercises-list-container');
  if (!container) return;

  let list = state.exercises.filter(e => {
    if (state.activeFilterEx === 'quiz') return e.exercise_type === 'quiz';
    if (state.activeFilterEx === 'assignment') return e.exercise_type === 'assignment';
    if (state.activeFilterEx === 'coding') return e.exercise_type === 'coding';
    return true;
  });

  if (list.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-neutral-500">
        <svg class="w-12 h-12 mx-auto mb-2 opacity-40 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        <p class="text-xs font-medium text-neutral-400">No exercises published in this category.</p>
        <button onclick="openUploadTab('exercise')" class="mt-2 text-xs font-bold text-gold-400 underline">Add a new exercise</button>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(e => `
    <div class="p-4 rounded-2xl bg-obsidian-900 border border-neutral-800 hover:border-gold-500/40 shadow-sm space-y-3 transition">
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-1.5 mb-1">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded text-gold-300 bg-gold-500/10 border border-gold-500/20 uppercase tracking-wider">
              ${escapeHtml(e.exercise_type)}
            </span>
            <span class="text-[10px] text-neutral-400 font-semibold">${escapeHtml(e.course_code)}</span>
            <span class="text-[10px] font-bold text-gold-400">${e.points} Points</span>
          </div>
          <h4 class="text-xs font-bold text-white leading-snug">
            ${escapeHtml(e.title)}
          </h4>
          <p class="text-[11px] text-neutral-400 mt-1 line-clamp-2">
            ${escapeHtml(e.description || 'Complete tasks according to instructions')}
          </p>
        </div>
      </div>

      <!-- Linked Presentation info -->
      ${e.presentation_title ? `
        <div class="p-2.5 rounded-xl bg-obsidian-950 border border-gold-500/20 flex items-center justify-between text-[11px]">
          <span class="text-neutral-400 flex items-center gap-1 truncate">
            📑 Deck: <strong class="text-neutral-200 truncate">${escapeHtml(e.presentation_title)}</strong>
          </span>
          <button onclick="openSlidePlayer('${e.presentation_id}')" class="text-gold-400 font-bold shrink-0 hover:underline">
            Review Slides
          </button>
        </div>
      ` : ''}

      <!-- Footer & Action -->
      <div class="flex items-center justify-between pt-1 border-t border-neutral-800">
        <span class="text-[10px] text-neutral-400">
          Due: ${e.due_date ? new Date(e.due_date).toLocaleDateString() : 'End of Term'}
        </span>

        <div class="flex items-center gap-2">
          ${e.filename ? `
            <a href="/uploads/${e.file_path}" download="${escapeHtml(e.original_name)}" class="px-2.5 py-1.5 rounded-xl bg-obsidian-800 border border-neutral-700 text-neutral-300 text-xs font-semibold hover:border-gold-500/40 transition" title="Download Worksheet">
              📥 Sheet
            </a>
          ` : ''}

          <button onclick="${e.exercise_type === 'quiz' ? `openQuizModal('${e.id}')` : `openSubmissionModal('${e.id}')`}" class="px-4 py-1.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs shadow-sm transition active:scale-95">
            ${e.exercise_type === 'quiz' ? 'Take Quiz ⚡' : 'Submit Work 📤'}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// 4. Vault Analytics
function renderVault() {
  const subsContainer = document.getElementById('vault-submissions-list');
  if (subsContainer) {
    if (state.submissions.length === 0) {
      subsContainer.innerHTML = `<p class="text-xs text-neutral-500 italic">No submissions recorded yet.</p>`;
    } else {
      subsContainer.innerHTML = state.submissions.map(s => `
        <div class="p-2.5 rounded-xl bg-obsidian-950 border border-neutral-800 flex items-center justify-between text-xs">
          <div>
            <div class="font-bold text-white">${escapeHtml(s.student_name)} <span class="text-[10px] text-neutral-400 font-normal">(${escapeHtml(s.student_id)})</span></div>
            <div class="text-[10px] text-gold-300/80">${escapeHtml(s.exercise_title)}</div>
          </div>
          <div class="text-right">
            <span class="font-bold text-gold-400">${s.score !== null ? `${s.score}/${s.max_points} pts` : 'Pending'}</span>
            <div class="text-[9px] text-neutral-400">${new Date(s.submitted_at).toLocaleDateString()}</div>
          </div>
        </div>
      `).join('');
    }
  }

  const actsContainer = document.getElementById('vault-activities-list');
  if (actsContainer) {
    if (state.activities.length === 0) {
      actsContainer.innerHTML = `<p class="text-xs text-neutral-500 italic">No recent activity.</p>`;
    } else {
      actsContainer.innerHTML = state.activities.slice(0, 10).map(a => `
        <div class="p-2 rounded-xl bg-obsidian-950 border border-neutral-800 flex items-center justify-between">
          <div>
            <strong class="text-neutral-200">${escapeHtml(a.title)}</strong>
            <p class="text-[10px] text-neutral-400">${escapeHtml(a.details || '')}</p>
          </div>
          <span class="text-[9px] text-gold-400 shrink-0 ml-2 font-mono">${new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      `).join('');
    }
  }
}

// ==========================================
// NAVIGATION & TAB SWITCHING
// ==========================================
function switchTab(tabId) {
  state.activeTab = tabId;

  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.add('hidden'));
  
  const target = document.getElementById(`view-${tabId}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.className = 'nav-btn flex flex-col items-center justify-center w-14 py-1 text-neutral-500 hover:text-neutral-300';
  });

  const activeBtn = document.getElementById(`nav-btn-${tabId}`);
  if (activeBtn) {
    activeBtn.className = 'nav-btn flex flex-col items-center justify-center w-14 py-1 text-gold-400 font-bold';
  }

  if (tabId === 'presentations') renderPresentations();
  if (tabId === 'exercises') renderExercises();
  if (tabId === 'vault') renderVault();
}

function openUploadTab(mode) {
  switchTab('upload');
  setUploadMode(mode);
}

function setUploadMode(mode) {
  const presBtn = document.getElementById('upload-mode-pres');
  const exBtn = document.getElementById('upload-mode-ex');
  const formPres = document.getElementById('form-upload-presentation');
  const formEx = document.getElementById('form-upload-exercise');

  if (mode === 'presentation') {
    presBtn.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition gold-gradient-bg text-black shadow';
    exBtn.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition text-neutral-400 hover:text-white';
    formPres.classList.remove('hidden');
    formEx.classList.add('hidden');
  } else {
    exBtn.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition gold-gradient-bg text-black shadow';
    presBtn.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition text-neutral-400 hover:text-white';
    formEx.classList.remove('hidden');
    formPres.classList.add('hidden');
  }
}

function filterPresentations(filterType) {
  state.activeFilterPres = filterType;
  document.querySelectorAll('.filter-pres-chip').forEach(c => {
    c.className = 'filter-pres-chip px-3 py-1 rounded-full font-medium bg-obsidian-900 text-neutral-300 border border-neutral-800 shrink-0';
  });
  const activeChip = document.getElementById(`filter-pres-${filterType}`);
  if (activeChip) {
    activeChip.className = 'filter-pres-chip px-3 py-1 rounded-full font-bold gold-gradient-bg text-black shadow-sm shrink-0';
  }
  renderPresentations();
}

function filterExercises(filterType) {
  state.activeFilterEx = filterType;
  document.querySelectorAll('.filter-ex-chip').forEach(c => {
    c.className = 'filter-ex-chip px-3 py-1 rounded-full font-medium bg-obsidian-900 text-neutral-300 border border-neutral-800 shrink-0';
  });
  const activeChip = document.getElementById(`filter-ex-${filterType}`);
  if (activeChip) {
    activeChip.className = 'filter-ex-chip px-3 py-1 rounded-full font-bold gold-gradient-bg text-black shadow-sm shrink-0';
  }
  renderExercises();
}

// ==========================================
// UPLOAD HANDLING (PPT & EXERCISE)
// ==========================================
function setupEventListeners() {
  document.getElementById('btn-toggle-frame')?.addEventListener('click', toggleFrameMode);
  document.getElementById('btn-theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('role-prof-btn')?.addEventListener('click', () => setRole('professor'));
  document.getElementById('role-student-btn')?.addEventListener('click', () => setRole('student'));

  const pptDropzone = document.getElementById('ppt-dropzone');
  const pptInput = document.getElementById('ppt-file-input');
  
  if (pptDropzone && pptInput) {
    pptDropzone.addEventListener('click', () => pptInput.click());
    pptInput.addEventListener('change', () => {
      if (pptInput.files.length > 0) {
        showPptFileSelected(pptInput.files[0]);
      }
    });

    pptDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      pptDropzone.classList.add('border-gold-500', 'bg-gold-500/10');
    });
    pptDropzone.addEventListener('dragleave', () => {
      pptDropzone.classList.remove('border-gold-500', 'bg-gold-500/10');
    });
    pptDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      pptDropzone.classList.remove('border-gold-500', 'bg-gold-500/10');
      if (e.dataTransfer.files.length > 0) {
        pptInput.files = e.dataTransfer.files;
        showPptFileSelected(e.dataTransfer.files[0]);
      }
    });
  }

  const exDropzone = document.getElementById('ex-dropzone');
  const exInput = document.getElementById('ex-file-input');
  if (exDropzone && exInput) {
    exDropzone.addEventListener('click', () => exInput.click());
    exInput.addEventListener('change', () => {
      if (exInput.files.length > 0) {
        showExFileSelected(exInput.files[0]);
      }
    });
  }

  document.getElementById('form-upload-presentation')?.addEventListener('submit', handlePptSubmit);
  document.getElementById('form-upload-exercise')?.addEventListener('submit', handleExerciseSubmit);
  document.getElementById('pres-search-input')?.addEventListener('input', renderPresentations);
}

function showPptFileSelected(file) {
  const badge = document.getElementById('ppt-file-badge');
  const nameEl = document.getElementById('ppt-file-name');
  const sizeEl = document.getElementById('ppt-file-size');
  const dropText = document.getElementById('ppt-drop-text');

  if (badge && nameEl && sizeEl) {
    badge.classList.remove('hidden');
    badge.classList.add('flex');
    nameEl.textContent = file.name;
    sizeEl.textContent = `(${(file.size / 1024).toFixed(0)} KB)`;
    dropText.textContent = 'Presentation selected: Ready to upload';
  }

  const titleInput = document.getElementById('ppt-title-input');
  if (titleInput && !titleInput.value) {
    titleInput.value = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
  }
}

function showExFileSelected(file) {
  const badge = document.getElementById('ex-file-badge');
  const nameEl = document.getElementById('ex-file-name');
  const sizeEl = document.getElementById('ex-file-size');
  if (badge && nameEl && sizeEl) {
    badge.classList.remove('hidden');
    badge.classList.add('flex');
    nameEl.textContent = file.name;
    sizeEl.textContent = `(${(file.size / 1024).toFixed(0)} KB)`;
  }
}

async function handlePptSubmit(e) {
  e.preventDefault();
  const fileInput = document.getElementById('ppt-file-input');
  const courseId = document.getElementById('ppt-course-select')?.value;
  const title = document.getElementById('ppt-title-input')?.value;
  const weekNumber = document.getElementById('ppt-week-input')?.value || '1';
  const desc = document.getElementById('ppt-desc-input')?.value || '';

  if (!fileInput.files || fileInput.files.length === 0) {
    alert('Please select or drop a PPT/PPTX presentation file.');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('course_id', courseId);
  formData.append('title', title);
  formData.append('week_number', weekNumber);
  formData.append('description', desc);

  const progressBox = document.getElementById('ppt-upload-progress-box');
  const progressBar = document.getElementById('ppt-progress-bar');
  const progressPct = document.getElementById('ppt-upload-pct');
  const submitBtn = document.getElementById('ppt-submit-btn');

  progressBox.classList.remove('hidden');
  submitBtn.disabled = true;

  let progress = 0;
  const interval = setInterval(() => {
    progress = Math.min(95, progress + 15);
    progressBar.style.width = `${progress}%`;
    progressPct.textContent = `${progress}%`;
  }, 100);

  try {
    const res = await fetch('/api/presentations/upload', {
      method: 'POST',
      body: formData
    });

    clearInterval(interval);
    progressBar.style.width = '100%';
    progressPct.textContent = '100%';

    const data = await res.json();
    if (res.ok) {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#fde68a', '#ffffff', '#aa771c']
        });
      }

      setTimeout(() => {
        progressBox.classList.add('hidden');
        submitBtn.disabled = false;
        document.getElementById('form-upload-presentation').reset();
        document.getElementById('ppt-file-badge').classList.add('hidden');
        document.getElementById('ppt-drop-text').textContent = 'Tap or Drag PPT / PPTX file here';

        fetchAllData().then(() => {
          if (data.id) {
            openSlidePlayer(data.id);
          } else {
            switchTab('presentations');
          }
        });
      }, 500);
    } else {
      alert(`Upload error: ${data.error}`);
      progressBox.classList.add('hidden');
      submitBtn.disabled = false;
    }
  } catch (err) {
    clearInterval(interval);
    progressBox.classList.add('hidden');
    submitBtn.disabled = false;
    alert(`Upload failed: ${err.message}`);
  }
}

async function handleExerciseSubmit(e) {
  e.preventDefault();
  const fileInput = document.getElementById('ex-file-input');
  const courseId = document.getElementById('ex-course-select')?.value;
  const presId = document.getElementById('ex-presentation-select')?.value;
  const title = document.getElementById('ex-title-input')?.value;
  const exType = document.getElementById('ex-type-input')?.value || 'quiz';
  const points = document.getElementById('ex-points-input')?.value || '100';
  const dueDate = document.getElementById('ex-due-input')?.value;
  const desc = document.getElementById('ex-desc-input')?.value || '';

  const formData = new FormData();
  if (fileInput.files && fileInput.files.length > 0) {
    formData.append('file', fileInput.files[0]);
  }
  formData.append('course_id', courseId);
  formData.append('presentation_id', presId);
  formData.append('title', title);
  formData.append('exercise_type', exType);
  formData.append('points', points);
  formData.append('due_date', dueDate);
  formData.append('description', desc);

  try {
    const res = await fetch('/api/exercises/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#d4af37', '#fde68a', '#ffffff']
        });
      }
      document.getElementById('form-upload-exercise').reset();
      document.getElementById('ex-file-badge').classList.add('hidden');
      fetchAllData().then(() => switchTab('exercises'));
    } else {
      alert(`Error creating exercise: ${data.error}`);
    }
  } catch (err) {
    alert(`Exercise upload failed: ${err.message}`);
  }
}

// ==========================================
// INTERACTIVE PRESENTATION SLIDE VIEWER
// ==========================================
async function openSlidePlayer(presId) {
  try {
    const res = await fetch(`/api/presentations/${presId}`);
    if (!res.ok) return;
    const pres = await res.json();

    state.currentDeck = pres;
    state.currentSlideIndex = 0;

    let slides = [];
    try {
      slides = JSON.parse(pres.slides_data || '[]');
    } catch (e) {
      slides = [];
    }

    state.currentDeck.slides = slides;

    document.getElementById('player-pres-title').textContent = pres.title;
    document.getElementById('player-pres-course').textContent = `${pres.course_code}: ${pres.course_title}`;
    
    const dlBtn = document.getElementById('player-btn-download');
    if (dlBtn) {
      dlBtn.onclick = () => {
        window.location.href = `/api/presentations/${pres.id}/download`;
      };
    }

    const linkedBox = document.getElementById('player-linked-ex-box');
    const linkedEx = state.exercises.find(e => e.presentation_id === pres.id);
    if (linkedBox) {
      if (linkedEx) {
        linkedBox.classList.remove('hidden');
        linkedBox.classList.add('flex');
      } else {
        linkedBox.classList.add('hidden');
        linkedBox.classList.remove('flex');
      }
    }

    renderCurrentSlide();
    document.getElementById('modal-slide-player').classList.remove('hidden');
  } catch (err) {
    console.error('Error opening presentation player:', err);
  }
}

function renderCurrentSlide() {
  if (!state.currentDeck || !state.currentDeck.slides) return;
  const slides = state.currentDeck.slides;
  const slide = slides[state.currentSlideIndex] || slides[0];

  const badgeEl = document.getElementById('slide-badge');
  const counterEl = document.getElementById('slide-counter-badge');
  const titleEl = document.getElementById('slide-title');
  const subtitleEl = document.getElementById('slide-subtitle');
  const bulletsEl = document.getElementById('slide-bullets');
  const notesEl = document.getElementById('slide-notes');

  if (badgeEl) badgeEl.textContent = slide.badge || `Slide ${state.currentSlideIndex + 1}`;
  if (counterEl) counterEl.textContent = `Slide ${state.currentSlideIndex + 1} / ${slides.length}`;
  if (titleEl) titleEl.textContent = slide.title || 'Untitled Slide';
  if (subtitleEl) subtitleEl.textContent = slide.subtitle || '';
  if (notesEl) notesEl.textContent = slide.notes || 'No notes for this slide.';

  if (bulletsEl) {
    bulletsEl.innerHTML = (slide.bullets || []).map(b => `
      <li class="flex items-start gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-gold-400 mt-1.5 shrink-0"></span>
        <span class="leading-relaxed text-neutral-200">${escapeHtml(b)}</span>
      </li>
    `).join('');
  }

  const thumbBar = document.getElementById('slide-thumbnails-bar');
  if (thumbBar) {
    thumbBar.innerHTML = slides.map((s, idx) => `
      <button onclick="goToSlide(${idx})" class="w-2.5 h-2.5 rounded-full transition ${idx === state.currentSlideIndex ? 'gold-gradient-bg scale-125' : 'bg-neutral-700 hover:bg-neutral-500'}"></button>
    `).join('');
  }
}

function nextSlide() {
  if (!state.currentDeck?.slides) return;
  if (state.currentSlideIndex < state.currentDeck.slides.length - 1) {
    state.currentSlideIndex++;
    renderCurrentSlide();
  }
}

function prevSlide() {
  if (!state.currentDeck?.slides) return;
  if (state.currentSlideIndex > 0) {
    state.currentSlideIndex--;
    renderCurrentSlide();
  }
}

function goToSlide(index) {
  if (!state.currentDeck?.slides) return;
  state.currentSlideIndex = index;
  renderCurrentSlide();
}

function closeSlidePlayer() {
  document.getElementById('modal-slide-player').classList.add('hidden');
  disableLaserPointer();
}

function jumpToLinkedExerciseFromPlayer() {
  if (!state.currentDeck) return;
  const linkedEx = state.exercises.find(e => e.presentation_id === state.currentDeck.id);
  closeSlidePlayer();
  if (linkedEx) {
    if (linkedEx.exercise_type === 'quiz') {
      openQuizModal(linkedEx.id);
    } else {
      openSubmissionModal(linkedEx.id);
    }
  } else {
    switchTab('exercises');
  }
}

function toggleLaserPointer() {
  state.laserActive = !state.laserActive;
  const btn = document.getElementById('btn-toggle-laser');
  const stage = document.getElementById('slide-stage');

  if (state.laserActive) {
    btn.classList.add('gold-gradient-bg', 'text-black');
    stage.classList.add('laser-active');
    stage.addEventListener('mousemove', handleLaserMove);
  } else {
    disableLaserPointer();
  }
}

function disableLaserPointer() {
  state.laserActive = false;
  const btn = document.getElementById('btn-toggle-laser');
  const stage = document.getElementById('slide-stage');
  btn?.classList.remove('gold-gradient-bg', 'text-black');
  stage?.classList.remove('laser-active');
  stage?.removeEventListener('mousemove', handleLaserMove);
  const dot = document.querySelector('.laser-dot');
  if (dot) dot.remove();
}

function handleLaserMove(e) {
  let dot = document.querySelector('.laser-dot');
  if (!dot) {
    dot = document.createElement('div');
    dot.className = 'laser-dot';
    document.body.appendChild(dot);
  }
  dot.style.left = `${e.clientX}px`;
  dot.style.top = `${e.clientY}px`;
}

// ==========================================
// INTERACTIVE QUIZ MODAL
// ==========================================
function openQuizModal(exerciseId) {
  const ex = state.exercises.find(item => item.id === exerciseId);
  if (!ex) return;

  state.currentQuiz = ex;
  state.quizQuestionIndex = 0;
  state.quizAnswers = {};
  state.quizCurrentScore = 0;

  try {
    state.currentQuiz.questions = JSON.parse(ex.questions_data || '[]');
  } catch (e) {
    state.currentQuiz.questions = [];
  }

  document.getElementById('quiz-course-code').textContent = ex.course_code;
  document.getElementById('quiz-modal-title').textContent = ex.title;

  renderQuizQuestion();
  document.getElementById('modal-quiz').classList.remove('hidden');
}

function renderQuizQuestion() {
  if (!state.currentQuiz?.questions) return;
  const questions = state.currentQuiz.questions;
  const q = questions[state.quizQuestionIndex];

  document.getElementById('quiz-progress-text').textContent = `Question ${state.quizQuestionIndex + 1} of ${questions.length}`;
  document.getElementById('quiz-score-badge').textContent = `Score: ${state.quizCurrentScore} pts`;
  document.getElementById('quiz-progress-bar').style.width = `${((state.quizQuestionIndex + 1) / questions.length) * 100}%`;
  document.getElementById('quiz-question-text').textContent = q.question;

  const expBox = document.getElementById('quiz-explanation-box');
  expBox.classList.add('hidden');

  const container = document.getElementById('quiz-options-container');
  container.innerHTML = q.options.map((opt, idx) => `
    <button onclick="selectQuizOption(${idx})" id="quiz-opt-${idx}" class="w-full text-left p-3.5 rounded-xl border border-neutral-800 bg-obsidian-950 hover:border-gold-500/60 text-xs text-neutral-200 font-medium transition flex items-center justify-between">
      <span>${escapeHtml(opt)}</span>
      <span class="w-4 h-4 rounded-full border border-neutral-700 flex items-center justify-center shrink-0 ml-2" id="quiz-opt-icon-${idx}"></span>
    </button>
  `).join('');

  document.getElementById('quiz-next-btn').textContent = state.quizQuestionIndex === questions.length - 1 ? 'Finish & Record Grade' : 'Next Question →';
}

function selectQuizOption(selectedIndex) {
  const q = state.currentQuiz.questions[state.quizQuestionIndex];
  state.quizAnswers[q.id || `q${state.quizQuestionIndex + 1}`] = selectedIndex;

  q.options.forEach((_, idx) => {
    const btn = document.getElementById(`quiz-opt-${idx}`);
    btn.disabled = true;
    if (idx === q.correct_index) {
      btn.className = 'w-full text-left p-3.5 rounded-xl border border-gold-500 bg-gold-500/20 text-gold-200 text-xs font-bold transition flex items-center justify-between';
      document.getElementById(`quiz-opt-icon-${idx}`).innerHTML = '✓';
    } else if (idx === selectedIndex) {
      btn.className = 'w-full text-left p-3.5 rounded-xl border border-neutral-700 bg-obsidian-900 text-neutral-400 text-xs font-medium transition flex items-center justify-between';
      document.getElementById(`quiz-opt-icon-${idx}`).innerHTML = '✕';
    }
  });

  if (selectedIndex === q.correct_index) {
    const ptsPerQ = Math.round((state.currentQuiz.points || 100) / state.currentQuiz.questions.length);
    state.quizCurrentScore += ptsPerQ;
    document.getElementById('quiz-score-badge').textContent = `Score: ${state.quizCurrentScore} pts`;
  }

  if (q.explanation) {
    const expBox = document.getElementById('quiz-explanation-box');
    document.getElementById('quiz-explanation-text').textContent = q.explanation;
    expBox.classList.remove('hidden');
  }
}

async function nextQuizQuestion() {
  const questions = state.currentQuiz.questions;
  if (state.quizQuestionIndex < questions.length - 1) {
    state.quizQuestionIndex++;
    renderQuizQuestion();
  } else {
    try {
      const formData = new FormData();
      formData.append('student_name', 'Alex Rivera');
      formData.append('student_id', 'STU-9842');
      formData.append('submission_type', 'quiz_answers');
      formData.append('answers_data', JSON.stringify(state.quizAnswers));

      await fetch(`/api/exercises/${state.currentQuiz.id}/submit`, {
        method: 'POST',
        body: formData
      });

      if (typeof confetti === 'function') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#fde68a', '#ffffff', '#aa771c']
        });
      }

      alert(`Quiz Completed! Final Score: ${state.quizCurrentScore} / ${state.currentQuiz.points} points. Recorded in SlideBox gradebook.`);
      closeQuizModal();
      fetchAllData();
    } catch (e) {
      console.error(e);
      closeQuizModal();
    }
  }
}

function closeQuizModal() {
  document.getElementById('modal-quiz').classList.add('hidden');
}

// ==========================================
// EXERCISE SUBMISSION MODAL
// ==========================================
function openSubmissionModal(exerciseId) {
  const ex = state.exercises.find(e => e.id === exerciseId);
  if (!ex) return;

  document.getElementById('sub-exercise-id').value = ex.id;
  document.getElementById('sub-modal-title').textContent = ex.title;

  const form = document.getElementById('form-submit-work');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const studentName = document.getElementById('sub-student-name').value;
    const studentId = document.getElementById('sub-student-id').value;
    const fileInput = document.getElementById('sub-file-input');
    const notes = document.getElementById('sub-notes-input').value;

    const fd = new FormData();
    fd.append('student_name', studentName);
    fd.append('student_id', studentId);
    if (fileInput.files.length > 0) {
      fd.append('file', fileInput.files[0]);
    }
    fd.append('answers_data', JSON.stringify({ notes }));

    try {
      const res = await fetch(`/api/exercises/${ex.id}/submit`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (res.ok) {
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 80,
            spread: 70,
            colors: ['#d4af37', '#fde68a', '#ffffff']
          });
        }
        alert(`Success! Deliverable uploaded. Graded score: ${data.score}/${data.max_points} pts.`);
        closeSubmissionModal();
        fetchAllData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    }
  };

  document.getElementById('modal-submission').classList.remove('hidden');
}

function closeSubmissionModal() {
  document.getElementById('modal-submission').classList.add('hidden');
}

// ==========================================
// COURSE CREATOR MODAL
// ==========================================
function openNewCourseModal() {
  const modal = document.getElementById('modal-new-course');
  const form = document.getElementById('form-new-course');
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    const code = document.getElementById('course-code-input').value;
    const term = document.getElementById('course-term-input').value;
    const title = document.getElementById('course-title-input').value;
    const instructor = document.getElementById('course-instructor-input').value;
    const color = document.getElementById('course-color-input').value || '#d4af37';

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, term, title, instructor, color })
      });
      if (res.ok) {
        closeNewCourseModal();
        form.reset();
        fetchAllData();
      }
    } catch (err) {
      alert('Failed to create course');
    }
  };

  modal.classList.remove('hidden');
}

function closeNewCourseModal() {
  document.getElementById('modal-new-course').classList.add('hidden');
}

// ==========================================
// ITEM FAVORITING & DELETION
// ==========================================
async function toggleFavorite(presId) {
  try {
    const res = await fetch(`/api/presentations/${presId}/favorite`, { method: 'PUT' });
    if (res.ok) {
      const data = await res.json();
      const p = state.presentations.find(item => item.id === presId);
      if (p) p.is_favorite = data.is_favorite;
      renderPresentations();
    }
  } catch (e) {
    console.error(e);
  }
}

async function deletePresentation(presId) {
  if (!confirm('Are you sure you want to permanently delete this presentation from SlideBox?')) {
    return;
  }
  try {
    const res = await fetch(`/api/presentations/${presId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchAllData();
    }
  } catch (e) {
    alert('Deletion failed');
  }
}

function jumpToPresentationExercises(presId) {
  switchTab('exercises');
  state.activeFilterEx = 'all';
  renderExercises();
}

async function resetAndReseedData() {
  if (!confirm('Reset SlideBox database back to default lecture decks and exercises?')) return;
  alert('Re-seeding database...');
  window.location.reload();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
