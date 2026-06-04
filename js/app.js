// js/app.js
// --- MODULE: UI & THEMES ---
window.toggleTheme = function() {
    const body = document.body; body.classList.toggle('light-mode');
    const isLight = body.classList.contains('light-mode');
    document.getElementById('theme-meta').content = isLight ? '#f8fafc' : '#0f172a';
    localStorage.setItem('cinePhysicsTheme', isLight ? 'light' : 'dark');
}

window.toggleMobileMenu = function() { document.getElementById('nav-tabs').classList.toggle('open'); }

window.switchTab = function(evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    if(evt) evt.currentTarget.classList.add('active');
    else { let btn = document.querySelector(`.tab-btn[onclick*="${tabName}"]`); if(btn) btn.classList.add('active'); }
    document.getElementById('nav-tabs').classList.remove('open');
    if(tabName === 'dashboard') window.populateDashboard();
}

window.filterDropdownList = function(inputId, selectId) {
    let filterText = document.getElementById(inputId).value, sel = document.getElementById(selectId);
    let currentVal = sel.value, sortedKeys = Object.keys(window.dimDict).sort((a, b) => window.dimDict[a].name.localeCompare(window.dimDict[b].name));
    sel.innerHTML = '<option value="" disabled selected>Select a quantity...</option>';
    sortedKeys.forEach(key => {
        if (key.startsWith('__TMP')) return;
        let name = window.dimDict[key].name;
        if (name.toLowerCase().includes(filterText.toLowerCase()) || key.toLowerCase().includes(filterText.toLowerCase())) {
            sel.add(new Option(`${name} (${key})`, key));
        }
    });
    if(currentVal && Array.from(sel.options).some(opt => opt.value === currentVal)) sel.value = currentVal;
}

// --- MODULE: SAVES & PROGRESS (Local Storage) ---
window.SAVE_VERSION = 1;
window.userStats = { askedQIds: { mechanics: [], thermo: [], em: [], modern: [], eqs: [] }, chapterCorrect: { mechanics: 0, thermo: 0, em: 0, modern: 0 }, chapterTotal: { mechanics: 0, thermo: 0, em: 0, modern: 0 }, badges: [], streak: 0, xp: 0, highestStreak: 0, perfectRounds: 0, totalQsSolved: 0, bossesDefeated: 0, lastDailyDate: null, dailyCompleted: false };

window.initStats = function() {
    let saved = localStorage.getItem('cinePhysicsHQ_Save');
    if (saved) { let parsed = JSON.parse(saved); if (parsed.version === 1) window.userStats = parsed.data; else window.userStats = parsed.data; }
    if(!window.userStats.chapterCorrect) window.userStats.chapterCorrect = { mechanics: 0, thermo: 0, em: 0, modern: 0 };
    if(!window.userStats.chapterTotal) window.userStats.chapterTotal = { mechanics: 0, thermo: 0, em: 0, modern: 0 };
    if(!window.userStats.totalQsSolved) window.userStats.totalQsSolved = 0; if(!window.userStats.bossesDefeated) window.userStats.bossesDefeated = 0;

    const today = new Date().toDateString();
    if(window.userStats.lastDailyDate !== today) { window.userStats.lastDailyDate = today; window.userStats.dailyCompleted = false; }
    
    const questUi = document.getElementById('daily-quest-ui');
    if(questUi && window.userStats.dailyCompleted) { questUi.innerHTML = `⚡ <strong>Daily Mission:</strong> Completed!`; questUi.style.color = "var(--success)"; }
    window.renderBadges(); window.populateDashboard();
}

window.saveStats = function() { 
    localStorage.setItem('cinePhysicsHQ_Save', JSON.stringify({ version: window.SAVE_VERSION, data: window.userStats })); 
    window.renderBadges(); window.populateDashboard(); 
}

const allBadges = { 'daily_scholar': '🎖️ Daily Scholar', 'first_perfect': '🏆 First Perfect Score', 'streak_10': '🔥 10 Streak', 'century': '🧠 Century Club' };

window.renderBadges = function() { 
    const c = document.getElementById('badges-ui'); if(!c) return;
    c.innerHTML = ''; for(let k in allBadges) c.innerHTML += `<div class="badge ${window.userStats.badges.includes(k)?'':'locked'}">${allBadges[k]}</div>`; 
}

window.getLevelInfo = function(xp) {
    if (xp >= 5000) return { level: 6, title: 'Grandmaster' }; if (xp >= 2500) return { level: 5, title: 'Dimension Marshal' };
    if (xp >= 1000) return { level: 4, title: 'Specialist' }; if (xp >= 500) return { level: 3, title: 'Researcher' };
    if (xp >= 250) return { level: 2, title: 'Analyst' }; return { level: 1, title: 'Cadet' };
}

window.populateDashboard = function() {
    let lvl = window.getLevelInfo(window.userStats.xp); 
    let dashRank = document.getElementById('dash-rank');
    if(dashRank) {
        dashRank.innerText = window.userStats.xp >= 10000 ? '🌌 DIMENSION MARSHALL' : lvl.title;
        document.getElementById('dash-level').innerText = `Level ${lvl.level}`; document.getElementById('dash-xp').innerText = window.userStats.xp + " XP";
        document.getElementById('dash-total-qs').innerText = window.userStats.totalQsSolved || 0;
        document.getElementById('dash-perfect').innerText = window.userStats.perfectRounds || 0;
        document.getElementById('dash-streak').innerText = window.userStats.highestStreak || 0;
        document.getElementById('dash-boss').innerText = window.userStats.bossesDefeated || 0;

        let rate = window.userStats.totalQsSolved > 0 ? Math.round(((window.userStats.chapterCorrect.mechanics + window.userStats.chapterCorrect.thermo + window.userStats.chapterCorrect.em + window.userStats.chapterCorrect.modern) / window.userStats.totalQsSolved) * 100) : 0;
        document.getElementById('dash-rate').innerText = rate + "%";

        const calcMastery = (chap) => window.userStats.chapterTotal[chap] > 0 ? Math.round((window.userStats.chapterCorrect[chap] / window.userStats.chapterTotal[chap]) * 100) : 0;
        document.getElementById('dash-mech').innerText = calcMastery('mechanics') + "%"; document.getElementById('dash-therm').innerText = calcMastery('thermo') + "%";
        document.getElementById('dash-em').innerText = calcMastery('em') + "%"; document.getElementById('dash-mod').innerText = calcMastery('modern') + "%";

        const certBtn = document.getElementById('cert-btn');
        if(certBtn && (window.userStats.xp >= 250 || window.userStats.perfectRounds > 0)) {
            certBtn.style.display = "inline-block"; document.getElementById('cert-rank-display').innerText = window.userStats.xp >= 10000 ? 'Dimension Marshall' : lvl.title;
        }
    }
    let elXp = document.getElementById('chal-xp');
    if(elXp) {
        elXp.innerText = window.userStats.xp + " XP"; document.getElementById('pb-streak').innerText = window.userStats.highestStreak || 0; 
        document.getElementById('pb-perfect').innerText = window.userStats.bossesDefeated || 0; 
        document.getElementById('chal-level-display').innerText = window.userStats.xp > 10000 ? '🌌 DIMENSION MARSHALL' : `Level ${lvl.level} • ${lvl.title}`;
    }
}

// Ensure the app initializes when loaded
window.onload = () => {
    if(localStorage.getItem('cinePhysicsTheme') === 'light') { document.body.classList.add('light-mode'); document.getElementById('theme-meta').content = '#f8fafc'; }
    const calcSelect = document.getElementById('calc-select'), derivTarget = document.getElementById('deriv-target'), cardSelect = document.getElementById('card-select');
    const sortedKeys = Object.keys(window.dimDict).sort((a, b) => window.dimDict[a].name.localeCompare(window.dimDict[b].name));
    sortedKeys.forEach(symbol => {
        calcSelect.add(new Option(`${window.dimDict[symbol].name} (${symbol})`, symbol));
        derivTarget.add(new Option(`${window.dimDict[symbol].name} (${symbol})`, symbol));
        cardSelect.add(new Option(`${window.dimDict[symbol].name} (${symbol})`, symbol));
    });
    window.initStats(); 
};
