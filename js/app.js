// js/app.js

// --- MODULE: UI & THEMES ---
window.toggleTheme = function() {
    const body = document.body; body.classList.toggle('light-mode');
    const isLight = body.classList.contains('light-mode');
    document.getElementById('theme-meta').content = isLight ? '#f8fafc' : '#0f172a';
    localStorage.setItem('cinePhysicsTheme', isLight ? 'light' : 'dark');
}

window.toggleMobileMenu = function() { document.getElementById('nav-tabs').classList.toggle('open'); }

window.insertSymbol = function(symbol) {
    const input = document.getElementById('equation-input');
    if (input.value.trim() !== '' && !input.value.endsWith(' ') && !input.value.endsWith('(')) {
        input.value += ' ' + symbol;
    } else {
        input.value += symbol;
    }
    input.focus();
}

window.switchTab = function(evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    if(evt) evt.currentTarget.classList.add('active');
    else { let btn = document.querySelector(`.tab-btn[onclick*="${tabName}"]`); if(btn) btn.classList.add('active'); }
    document.getElementById('nav-tabs').classList.remove('open');
    if(tabName === 'dashboard') window.populateDashboard();
}

window.populateDropdowns = function(filterText = '') {
    // Array of all dropdown IDs that need to be populated
    const selects = ['calc-select', 'deriv-target', 'card-select', 'equation-symbol-picker'];
    
    let sortedKeys = Object.keys(window.dimDict).sort((a, b) => window.dimDict[a].name.localeCompare(window.dimDict[b].name));
    
    selects.forEach(selId => {
        let sel = document.getElementById(selId);
        if(!sel) return;
        
        let currentVal = sel.value;
        
        // Use special placeholder text for the symbol picker
        let defaultText = selId === 'equation-symbol-picker' ? 'Insert Any Quantity...' : 'Select a quantity...';
        sel.innerHTML = `<option value="" disabled selected>${defaultText}</option>`;
        
        sortedKeys.forEach(key => {
            if (key.startsWith('__TMP')) return;
            let name = window.dimDict[key].name;
            if (name.toLowerCase().includes(filterText.toLowerCase()) || key.toLowerCase().includes(filterText.toLowerCase())) {
                sel.add(new Option(`${name} (${key})`, key));
            }
        });
        
        // Restore previous selection if it still exists in the filtered list
        if(currentVal && Array.from(sel.options).some(opt => opt.value === currentVal)) {
            sel.value = currentVal;
        }
    });
}

// --- MODULE: SAVES & PROGRESS ---
window.SAVE_VERSION = 1;
window.userStats = { 
    askedQIds: { mechanics: [], thermo: [], em: [], modern: [], eqs: [] }, 
    chapterCorrect: { mechanics: 0, thermo: 0, em: 0, modern: 0 }, 
    chapterTotal: { mechanics: 0, thermo: 0, em: 0, modern: 0 }, 
    badges: [], streak: 0, xp: 0, highestStreak: 0, perfectRounds: 0, totalQsSolved: 0, bossesDefeated: 0, lastDailyDate: null, dailyCompleted: false 
};

window.allBadges = { 'daily_scholar': '🎖️ Daily Scholar', 'first_perfect': '🏆 First Perfect Score', 'streak_10': '🔥 10 Streak', 'century': '🧠 Century Club' };

window.initStats = function() {
    let saved = localStorage.getItem('cinePhysicsHQ_Save');
    if (saved) { let parsed = JSON.parse(saved); if (parsed.version === 1) window.userStats = parsed.data; else window.userStats = parsed.data; }
    
    if(!window.userStats.chapterCorrect) window.userStats.chapterCorrect = { mechanics: 0, thermo: 0, em: 0, modern: 0 };
    if(!window.userStats.chapterTotal) window.userStats.chapterTotal = { mechanics: 0, thermo: 0, em: 0, modern: 0 };
    if(!window.userStats.totalQsSolved) window.userStats.totalQsSolved = 0; 
    if(!window.userStats.bossesDefeated) window.userStats.bossesDefeated = 0;

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

window.renderBadges = function() { 
    const c = document.getElementById('badges-ui'); if(!c) return;
    c.innerHTML = ''; for(let k in window.allBadges) c.innerHTML += `<div class="badge ${window.userStats.badges.includes(k)?'':'locked'}">${window.allBadges[k]}</div>`; 
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

// --- MODULE: EQUATION CHECKER ---

// Extracts and maps variables to their dimensions for educational breakdown
window.explainTerm = function(term) {
    let explanation = "";
    let processed = new Set();
    const mathFuncs = ['sin', 'cos', 'tan', 'log', 'ln', 'exp', 'sqrt'];
    
    const regex = /[a-zA-Z_]+/g;
    let match;
    while((match = regex.exec(term)) !== null) {
        let rawVar = match[0];
        let lookupVar = rawVar;
        let vLower = rawVar.toLowerCase();
        
        if(vLower === 'ke') lookupVar = 'KE';
        else if(vLower === 'pe') lookupVar = 'PE';
        else if(vLower === 'pr') lookupVar = 'Pr';

        let mappedVar = window.aliasMap[lookupVar] || lookupVar;
        
        if(mathFuncs.includes(mappedVar.toLowerCase())) continue;

        if(window.dimDict[mappedVar] && !processed.has(mappedVar)) {
            explanation += `<span style="color:var(--text-muted); font-size: 0.95rem;">↳ ${rawVar} = ${window.dimDict[mappedVar].name} = ${window.formatDim(window.dimDict[mappedVar])}</span>\n`;
            processed.add(mappedVar);
        }
    }
    return explanation;
}

window.getDimExplanation = function(lhsObj, rhsObj) {
    let diffs = []; const labels = {M:'Mass', L:'Length', T:'Time', I:'Current', K:'Temperature', mol:'Amount'};
    for(let key in lhsObj) if(lhsObj[key] !== rhsObj[key]) diffs.push(`${labels[key]} exponent differs (LHS: ${lhsObj[key]}, RHS: ${rhsObj[key]})`);
    return diffs.join('<br>• ');
}

window.loadPreset = function(eq) { document.getElementById('equation-input').value = eq; window.verifyEquation(); }

window.verifyEquation = function() {
    const input = document.getElementById('equation-input').value;
    const outputPanel = document.getElementById('checker-output');
    if (!input.includes('=')) { outputPanel.innerHTML = '<span class="error-text">❌ Error: Equation must contain an "=" sign.</span>'; return; }
    
    const [lhsRaw, rhsRaw] = input.split('=');
    const lhsTerms = lhsRaw.split(/[\+\-](?![^\(]*\))/).map(t => t.trim()).filter(t => t);
    const rhsTerms = rhsRaw.split(/[\+\-](?![^\(]*\))/).map(t => t.trim()).filter(t => t);
    
    let outputHTML = `<div class="animate-pop">Equation: <strong style="font-size: 1.2rem;">${input}</strong>\n\n`;
    let globalError = null;

    function evaluateSide(sideName, terms) {
        let html = `<div style="margin-bottom:0.5rem;"><strong style="color:var(--accent); font-size:1.1rem;">${sideName} Breakdown:</strong></div>`;
        let firstDimObj = null, firstDimStr = null, isInternallyConsistent = true;
        
        for (let i = 0; i < terms.length; i++) {
            let evalResult = window.evaluateTermRecursively(terms[i]);
            if(evalResult.error) { globalError = evalResult.error; return { error: true }; }
            let dimStr = window.formatDim(evalResult.dim);
            let explanation = window.explainTerm(terms[i]);

            html += `<div style="background:rgba(255,255,255,0.02); padding:1rem; border-radius:6px; margin-bottom:1rem; border:1px solid var(--border);">`;
            html += `<strong>Term:</strong> [${terms[i]}]\n`;
            if(explanation) html += `${explanation}`;
            html += `\n<strong>➜ Result: <span style="color:var(--gold);">${dimStr}</span></strong></div>`;

            if (i === 0) { firstDimObj = evalResult.dim; firstDimStr = dimStr; }
            else if (dimStr !== firstDimStr) isInternallyConsistent = false;
        }
        return { html, isInternallyConsistent, dimObj: firstDimObj, dimStr: firstDimStr };
    }

    const lhsData = evaluateSide('LHS', lhsTerms);
    if(globalError) { outputPanel.innerHTML = outputHTML + `<div class="edu-note"><span class="marshall-text">⚡ Dimension Marshall:</span><br><span class="dialogue-quote">"Math error detected. ${globalError}"</span></div></div>`; window.cleanupTempTokens(); return; }
    
    const rhsData = evaluateSide('RHS', rhsTerms);
    if(globalError) { outputPanel.innerHTML = outputHTML + `<div class="edu-note"><span class="marshall-text">⚡ Dimension Marshall:</span><br><span class="dialogue-quote">"Math error detected. ${globalError}"</span></div></div>`; window.cleanupTempTokens(); return; }

    outputHTML += lhsData.html + rhsData.html + `<strong>Final Verification:</strong>\n`;
    let marshallTutor = "";

    if (!lhsData.isInternallyConsistent) {
        outputHTML += `<span class="error-text">✖ LHS terms are not dimensionally identical.</span>`;
        marshallTutor = `"Cadet, you cannot add apples to oranges. The terms on the left side of the equation have different dimensions."`;
    } else if (!rhsData.isInternallyConsistent) {
        outputHTML += `<span class="error-text">✖ RHS terms are not dimensionally identical.</span>`;
        marshallTutor = `"The terms on the right side are mathematically incompatible. Check your addition/subtraction."`;
    } else if (lhsData.dimStr !== rhsData.dimStr) {
        outputHTML += `[LHS] = ${lhsData.dimStr}\n[RHS] = ${rhsData.dimStr}\n<span class="error-text">✖ [LHS] ≠ [RHS] -> Invalid</span>`;
        marshallTutor = `"The dimensions disagree. Here is exactly why:<br>• ` + window.getDimExplanation(lhsData.dimObj, rhsData.dimObj) + `"`;
    } else {
        outputHTML += `[LHS] = ${lhsData.dimStr}\n[RHS] = ${rhsData.dimStr}\n<span class="success-text">✔ [LHS] = [RHS] -> Homogeneous</span>`;
        marshallTutor = `"Well done. The equation is perfectly balanced."`;
    }
    
    outputHTML += `\n\n<div class="edu-note"><span class="marshall-text">⚡ Dimension Marshall:</span><br><span class="dialogue-quote">${marshallTutor}</span></div></div>`;
    outputPanel.innerHTML = outputHTML;
    window.cleanupTempTokens();
}

// --- MODULE: QUANTITY DISCOVERY ---
window.parseDirectDimInput = function() {
    let str = document.getElementById('direct-dim-search').value.replace(/\[|\]/g, '').replace(/\s+/g, '').replace(/\^/g, '').toUpperCase();
    let target = { M:0, L:0, T:0, I:0, K:0, mol:0 };
    const regex = /([MLTIK]|MOL)([\²\³\⁴\⁵\⁻]|-?\d*\.?\d+)?/g; let match;
    while((match = regex.exec(str)) !== null) {
        let dim = match[1], pow = parseFloat((match[2] || "1").replace('²', '2').replace('³', '3').replace('⁴', '4').replace('⁵', '5').replace('⁻', '-'));
        if(dim === 'M') target.M = pow; if(dim === 'L') target.L = pow; if(dim === 'T') target.T = pow;
        if(dim === 'I') target.I = pow; if(dim === 'K') target.K = pow; if(dim === 'MOL') target.mol = pow;
    }
    document.getElementById('spin-m').value = target.M; document.getElementById('spin-l').value = target.L; document.getElementById('spin-t').value = target.T;
    document.getElementById('spin-i').value = target.I; document.getElementById('spin-k').value = target.K; document.getElementById('spin-mol').value = target.mol;
    window.discoverQuantity();
}

window.discoverQuantity = function() {
    let targetDim = {
        M: parseFloat(document.getElementById('spin-m').value)||0, L: parseFloat(document.getElementById('spin-l').value)||0, 
        T: parseFloat(document.getElementById('spin-t').value)||0, I: parseFloat(document.getElementById('spin-i').value)||0, 
        K: parseFloat(document.getElementById('spin-k').value)||0, mol: parseFloat(document.getElementById('spin-mol').value)||0
    };
    let matches = [];
    for(let key in window.dimDict) {
        if(!key.startsWith('__TMP') && window.formatDim(window.dimDict[key]) === window.formatDim(targetDim)) matches.push({ key: key, name: window.dimDict[key].name, units: window.dimDict[key].units });
    }
    let html = `<div class="animate-pop"><strong>Searching for:</strong> ${window.formatDim(targetDim)}\n\n`;
    if(matches.length > 0) {
        html += `<span class="success-text">Matches Found (${matches.length}):</span>\n\n`;
        matches.forEach(m => {
            let unitStr = m.units ? ` <span style="font-size:0.9rem; color:var(--text-muted);">(${m.units[0]})</span>` : "";
            html += `<div style="margin-bottom: 0.5rem;">✓ ${m.name}${unitStr} <button class="secondary-btn" onclick="window.switchTab(null, 'calculator'); document.getElementById('calc-select').value='${m.key}'; window.calculateDimensionTree();">Show Tree</button></div>`;
        });
        if(matches.length > 1) html += `<div class="edu-note"><strong>Why multiple answers?</strong><br>Different physical quantities can have identical dimensions. Dimensional analysis alone cannot distinguish between them.</div>`;
    } else {
        html += `<span class="error-text">No standard quantity found.</span>\n\nPossible constructed quantity:\n<strong style="color:var(--accent);">${window.buildSyntheticDerivation(targetDim.M, targetDim.L, targetDim.T, targetDim.I, targetDim.K, targetDim.mol)}</strong>`;
    }
    document.getElementById('discovery-output').innerHTML = html + `</div>`;
}

window.buildSyntheticDerivation = function(M, L, T, I, K, mol) {
    if(M===0 && L===0 && T===0 && I===0 && K===0 && mol===0) return 'Pure Number (Dimensionless)';
    let num = [], den = [];
    const addPart = (exp, name) => { if(exp > 0) num.push(`${name}${exp>1?'^'+exp:''}`); else if(exp < 0) den.push(`${name}${exp<-1?'^'+(-exp):''}`); };
    addPart(M, 'Mass'); addPart(L, 'Length'); addPart(T, 'Time'); addPart(I, 'Current'); addPart(K, 'Temperature'); addPart(mol, 'Amount');
    let nStr = num.length > 0 ? num.join(' × ') : '1', dStr = den.length > 0 ? den.join(' × ') : '';
    return dStr ? `(${nStr}) / (${dStr})` : nStr;
}

// --- MODULE: DIMENSION TREE & MEMORY CARDS ---
window.calculateDimensionTree = function() {
    const sym = document.getElementById('calc-select').value;
    if(!sym) return;
    const data = window.dimDict[sym];
    let html = `<div class="tree-container animate-pop"><div class="card-node final"><div class="card-title">${data.name}</div><div class="card-final-dim">${window.formatDim(data)}</div></div>`;
    if (data.concept.length > 1) {
        html += `<div class="tree-arrow">↑<br><span style="font-size:1rem;">(${data.op || "derived"})</span></div><div class="tree-row">`;
        html += `<div class="card-node"><div class="card-title">${data.concept[0]}</div><div class="card-dim">${data.breakdown[0]}</div></div>`;
        html += `<div class="card-node"><div class="card-title">${data.concept[1]}</div><div class="card-dim">${data.breakdown[1]}</div></div></div>`;
    } else {
        html += `<div class="tree-arrow">↑</div><div class="card-node"><div class="card-title">${data.concept[0] || ""}</div><div class="card-dim">${data.breakdown[0] || ""}</div></div>`;
    }
    html += `<div class="app-box">`;
    if(data.units && data.units.length > 0) html += `<strong>Units:</strong> ${data.units.join(', ')}<br>`;
    if(data.app) html += `<strong>Application:</strong> ${data.app}`;
    document.getElementById('calc-output').innerHTML = html + `</div></div>`;
}

window.generateMemoryCard = function() {
    const sym = document.getElementById('card-select').value;
    if(!sym) return;
    const data = window.dimDict[sym];
    document.getElementById('card-output').innerHTML = `
    <div class="memory-card animate-pop">
        <div class="mc-header"><h3 class="mc-title">${data.name}</h3><div class="mc-dim">${window.formatDim(data)}</div></div>
        <div class="mc-section"><div class="mc-label">Formula / Derivation</div><div class="mc-value">${data.concept.join(` ${data.op || 'derived'} `)}</div></div>
        <div class="mc-section"><div class="mc-label">Standard Units</div><div class="mc-value">${data.units ? data.units.join(', ') : 'Dimensionless'}</div></div>
        <div class="mc-section"><div class="mc-label">Physics Application</div><div class="mc-value">${data.app || 'Theoretical modeling'}</div></div>
        <div class="mc-mistake"><strong>⚠️ Common Mistake:</strong><br>${data.mistake}</div>
        <div class="mc-tip"><strong>💡 JEE / NEET Tip:</strong><br>${data.jeeTip}</div>
    </div>`;
}

// --- MODULE: FORMULA DERIVATOR & BUCKINGHAM PI ---
window.loadDerivatorPreset = function(target, vars) { document.getElementById('deriv-target').value = target; document.getElementById('deriv-vars').value = vars; window.deriveFormula(); }

window.deriveFormula = function() {
    const targetSym = document.getElementById('deriv-target').value, input = document.getElementById('deriv-vars').value, out = document.getElementById('deriv-output');
    if(!targetSym) return; let targetDim = window.dimDict[targetSym], vars = input.split(',').map(v => v.trim()).filter(v => v), validVars = [];
    for(let v of vars) { let m = window.aliasMap[v] || v; if(!window.dimDict[m]){ out.innerHTML=`<span class="error-text">❌ Unknown variable: ${v}</span>`; return; } validVars.push({orig:v, dims:window.dimDict[m]}); }
    if(validVars.length === 0) return;
    const baseDims = ['M', 'L', 'T', 'I', 'K', 'mol']; let matrix=[], activeDims=[];
    for(let d of baseDims) {
        let row=[], hasNonZero=false; for(let v of validVars) { row.push(v.dims[d]); if(v.dims[d]!==0) hasNonZero=true; }
        row.push(targetDim[d]); if(hasNonZero || targetDim[d]!==0) { matrix.push(row); activeDims.push(d); }
    }
    let rows = matrix.length, cols = validVars.length, lead = 0;
    for (let r = 0; r < rows; r++) {
        if (lead >= cols) break; let i = r; while (matrix[i][lead] === 0) { i++; if (i === rows) { i = r; lead++; if (lead === cols) break; } }
        if (lead < cols) {
            let temp = matrix[i]; matrix[i] = matrix[r]; matrix[r] = temp; let lv = matrix[r][lead]; for (let j = 0; j <= cols; j++) matrix[r][j] /= lv; 
            for (let x = 0; x < rows; x++) { if (x !== r) { let mult = matrix[x][lead]; for (let j = 0; j <= cols; j++) matrix[x][j] -= mult * matrix[r][j]; } }
            lead++;
        }
    }
    for(let r = 0; r < rows; r++) {
        let allZero = true; for(let c = 0; c < cols; c++) if(Math.abs(matrix[r][c]) > 1e-7) allZero = false;
        if(allZero && Math.abs(matrix[r][cols]) > 1e-7) { out.innerHTML = `<span class="error-text">❌ Impossible to derive ${window.dimDict[targetSym].name} from (${validVars.map(v=>v.orig).join(', ')}). Dimensions do not match.</span>`; return; }
    }
    let pivots = 0;
    for (let r = 0; r < rows; r++) {
        let hasPivot = false; for (let c = 0; c < cols; c++) { if (Math.abs(matrix[r][c] - 1) < 1e-7) { let isP = true; for (let x = 0; x < rows; x++) if (x !== r && Math.abs(matrix[x][c]) > 1e-7) isP = false; if (isP) { hasPivot = true; break; } } }
        if (hasPivot) pivots++;
    }
    if (pivots < cols) { out.innerHTML = `<span class="error-text">❌ Underdetermined system (Rank ${pivots} < Variables ${cols}).</span>`; return; }
    let numStr="", denStr="";
    for(let c=0; c<cols; c++) {
        let power = 0;
        for(let r=0; r<rows; r++) { if(Math.abs(matrix[r][c] - 1) < 1e-7) { let isP = true; for(let x=0; x<rows; x++) if(x!==r && Math.abs(matrix[x][c]) > 1e-7) isP = false; if(isP) { power = matrix[r][cols]; break; } } }
        if(Math.abs(power) > 1e-7) {
            let pStr = Math.abs(power-0.5)<1e-7?"^(1/2)":Math.abs(power-0.3333333)<1e-7?"^(1/3)":Math.abs(power-1.5)<1e-7?"^(3/2)":Math.abs(power)!==1?"^"+parseFloat(Math.abs(power).toFixed(2)):"";
            if(power > 0) numStr += `${validVars[c].orig}${pStr} `; else denStr += `${validVars[c].orig}${pStr} `;
        }
    }
    out.innerHTML = `<div class="animate-pop"><span class="success-text" style="font-size:1.4rem;">${targetSym} ∝ ${numStr.trim()||'1'} ${denStr?'/ ('+denStr.trim()+')':''}</span></div>`;
}

window.loadPiPreset = function(v) { document.getElementById('pi-input').value = v; window.solveBuckingham(); }
window.solveBuckingham = function() {
    const out = document.getElementById('pi-output'), input = document.getElementById('pi-input').value;
    let vars = input.split(',').map(v => v.trim()).filter(v => v), validVars = [];
    for(let v of vars) { let m = window.aliasMap[v] || v; if(!window.dimDict[m]){ out.innerHTML=`<span class="error-text">❌ Unknown variable: ${v}</span>`; return; } validVars.push({orig:v, mapped:m, dims:window.dimDict[m]}); }
    if(validVars.length === 0) return;
    let matrix=[], activeDims=[];
    for(let d of ['M','L','T','I','K','mol']) {
        let row=[], hasNonZero=false; for(let v of validVars) { row.push(v.dims[d]); if(v.dims[d]!==0) hasNonZero=true; }
        if(hasNonZero) { matrix.push(row); activeDims.push(d); }
    }
    let rows = matrix.length, cols = validVars.length, numGroups = cols - rows;
    if(numGroups <= 0) { out.innerHTML = `<span class="error-text">Not enough variables. Require more variables than fundamental dimensions.</span>`; return; }
    let lead=0;
    for (let r = 0; r < rows; r++) {
        if (lead >= cols) break; let i = r; while (matrix[i][lead] === 0) { i++; if (i === rows) { i = r; lead++; if (lead === cols) break; } }
        if (lead < cols) {
            let temp = matrix[i]; matrix[i] = matrix[r]; matrix[r] = temp; let lv = matrix[r][lead]; for (let j = 0; j < cols; j++) matrix[r][j] /= lv;
            for (let x = 0; x < rows; x++) { if (x !== r) { let mult = matrix[x][lead]; for (let j = 0; j < cols; j++) matrix[x][j] -= mult * matrix[r][j]; } } lead++;
        }
    }
    let pivotCols = [], freeCols = [];
    for (let r = 0; r < rows; r++) { for (let c = 0; c < cols; c++) { if (Math.abs(matrix[r][c] - 1) < 1e-7) { let isP = true; for (let x = 0; x < rows; x++) if (x !== r && Math.abs(matrix[x][c]) > 1e-7) isP = false; if (isP) { pivotCols.push(c); break; } } } }
    for(let c = 0; c < cols; c++) if(!pivotCols.includes(c)) freeCols.push(c);

    let html = `<div class="animate-pop">Analyzing: ${validVars.map(v=>v.orig).join(', ')}\nExpected Groups: ${numGroups}\n\n`;
    let sortedInput = vars.map(v => (window.aliasMap[v.toLowerCase()] || v.toLowerCase())).slice().sort().join(',');
    if(window.knownPiGroups[sortedInput]) html += `<div class="known-pi"><strong>Known Dimensionless Group:</strong><br>${window.knownPiGroups[sortedInput]}</div>\n`;

    for(let i=0; i<freeCols.length; i++) {
        let free = freeCols[i], vec = new Array(cols).fill(0); vec[free] = 1;
        for(let r = 0; r < pivotCols.length; r++) vec[pivotCols[r]] = -matrix[r][free];
        let numStr = "", denStr = "";
        for(let j=0; j<cols; j++) {
            let exp = vec[j];
            if(Math.abs(exp) > 1e-7) {
                let varName = validVars[j].orig, powerStr = Math.abs(exp) !== 1 ? window.toSuperscript(Math.abs(exp)) : "";
                if(exp > 0) numStr += `${varName}${powerStr} `; else denStr += `${varName}${powerStr} `;
            }
        }
        html += `<span class="success-text" style="font-size:1.2rem;">π${i+1} = ${numStr.trim()||'1'} ${denStr ? '/ (' + denStr.trim() + ')' : ''}</span>\n\n`;
    }
    out.innerHTML = html + `</div>`;
}

// --- MODULE: BOSS BATTLE ARENA ---
window.chalScore = 0; window.chalTotal = 0; window.sessionXP = 0; window.chalCurrentAnswer = null; window.chalCurrentContext = null; window.currentQuestionDiff = 'easy';
window.bossHP = 100; window.chalMaxQuestions = 10;

window.getUniqueQuestion = function(poolArray, categoryKey) {
    let available = poolArray.filter(q => !window.userStats.askedQIds[categoryKey].includes(q.id || q));
    if(available.length === 0) { window.userStats.askedQIds[categoryKey] = []; available = poolArray; }
    let q = available[Math.floor(Math.random() * available.length)];
    window.userStats.askedQIds[categoryKey].push(q.id || q); window.saveStats(); return q;
}

window.startChallengeLoader = function() {
    window.bossHP = 100; window.chalScore = 0; window.chalTotal = 0; window.sessionXP = 0;
    const box = document.getElementById('challenge-box');
    if(!box) return;
    box.innerHTML = `<div class="animate-pop" style="font-size: 1.5rem; color: var(--accent); padding: 3rem 0;">⚡ Syncing Dimension Realm...</div>`;
    setTimeout(window.startChallenge, 800);
}

window.updateBossUI = function(contentHTML, isHit) {
    const box = document.getElementById('challenge-box');
    let bossBar = `
        <div class="boss-header"><span class="chaos-text">Chaos Dimensioneer</span><span style="color:var(--chaos);">${window.bossHP} / 100 HP</span></div>
        <div class="hp-bar-container"><div class="hp-bar" style="width: ${window.bossHP}%"></div></div>
    `;
    box.innerHTML = `<div class="${isHit ? 'shake-anim' : 'animate-pop'}" style="width:100%;">${bossBar}${contentHTML}</div>`;
}

window.startChallenge = function() {
    const types = [1, 2, 3]; const type = types[Math.floor(Math.random() * types.length)];
    let validKeys = Object.keys(window.dimDict).filter(k => !k.startsWith('__TMP') && window.dimDict[k].name !== 'Length' && window.dimDict[k].name !== 'Distance'); 
    const chapterFilter = document.getElementById('chal-chapter').value;
    let activeChapter = chapterFilter === 'all' ? ['mechanics', 'thermo', 'em', 'modern'][Math.floor(Math.random()*4)] : chapterFilter;
    validKeys = validKeys.filter(k => window.dimDict[k].chapter === activeChapter);

    if(type === 1 || type === 2) {
        const randomKey = window.getUniqueQuestion(validKeys, activeChapter), item = window.dimDict[randomKey];
        window.currentQuestionDiff = item.diff; let xp = window.currentQuestionDiff==='easy'?10:window.currentQuestionDiff==='medium'?15:window.currentQuestionDiff==='hard'?25:50;
        let diffTag = `<div class="diff-tag" style="position:relative; float:right;">Difficulty: ${window.currentQuestionDiff.toUpperCase()} | +${xp} XP</div>`;

        if(type === 1) {
            window.chalCurrentAnswer = window.formatDim(item).replace(/\[|\]/g, ''); 
            window.updateBossUI(`${diffTag}<div class="marshall-text">⚡ Dimension Marshall:</div><div class="dialogue-quote">"Strike him by revealing the true dimensions of <strong style="color:var(--accent);">${item.name}</strong>."</div>
            <input type="text" id="chal-ans-input" placeholder="e.g., ML2T-2" style="max-width: 300px; margin: 0 auto; text-align: center;">
            <div class="challenge-btn-group"><button onclick="checkChallenge(1)">Attack</button></div>`, false);
        } else {
            window.chalCurrentAnswer = randomKey; let options = [randomKey];
            let allKeys = Object.keys(window.dimDict).filter(k => !k.startsWith('__TMP'));
            while(options.length < 4) { let fake = allKeys[Math.floor(Math.random() * allKeys.length)]; if(!options.includes(fake) && window.formatDim(window.dimDict[fake]) !== window.formatDim(item)) options.push(fake); }
            options.sort(() => Math.random() - 0.5);
            let btnHtml = options.map(opt => `<button onclick="checkChallenge(2, '${opt}')">${window.dimDict[opt].name}</button>`).join('');
            window.updateBossUI(`${diffTag}<div class="chaos-text" style="font-size:1rem;">🌌 Chaos Dimensioneer:</div><div class="dialogue-quote">"You will never guess what quantity hides behind <strong style="color:var(--accent);">${window.formatDim(item)}</strong>!"</div>
            <div class="challenge-btn-group" style="flex-direction: column; max-width: 400px; margin: 0 auto;">${btnHtml}</div>`, false);
        }
    } else {
        const baseEqs = [{ id: 'eq1', eq: 'v = u + a t', valid: true, lhs: '[LT⁻¹]', rhs: '[LT⁻¹]', diff: 'easy', ch: 'mechanics' }, { id: 'eq4', eq: 'F = m a', valid: true, lhs: '[MLT⁻²]', rhs: '[MLT⁻²]', diff: 'easy', ch: 'mechanics' }, { id: 'eq8', eq: 'V = I R', valid: true, lhs: '[ML²T⁻³I⁻¹]', rhs: '[ML²T⁻³I⁻¹]', diff: 'medium', ch: 'em' }, { id: 'eq9', eq: 'E = h f', valid: true, lhs: '[ML²T⁻²]', rhs: '[ML²T⁻²]', diff: 'jee-advanced', ch: 'modern' }, { id: 'eq7', eq: 'P V = n R_gas Temp', valid: true, lhs: '[ML²T⁻²]', rhs: '[ML²T⁻²]', diff: 'hard', ch:'thermo' }];
        let eqPool = baseEqs;
        if(chapterFilter !== 'all') eqPool = baseEqs.filter(e => e.ch === chapterFilter);
        if(eqPool.length === 0) eqPool = baseEqs; 
        
        const cEq = { ...window.getUniqueQuestion(eqPool, 'eqs') };
        window.currentQuestionDiff = cEq.diff; let xp = window.currentQuestionDiff==='easy'?10:window.currentQuestionDiff==='medium'?15:window.currentQuestionDiff==='hard'?25:50;
        
        if(Math.random() > 0.5) {
            cEq.valid = false; const ruinMap = {'a': 'v', 'v': 's', 'm': 's', 'F': 'P', 'R_gas': 'HC', 'I': 'q'};
            for(let r in ruinMap) { if(cEq.eq.includes(r)) { cEq.eq = cEq.eq.replace(new RegExp(r), ruinMap[r]); cEq.rhs = `[Mismatch]`; break; } }
        }
        window.chalCurrentAnswer = cEq.valid; window.chalCurrentContext = { lhs: cEq.lhs, rhs: cEq.rhs };
        window.updateBossUI(`<div class="diff-tag" style="position:relative; float:right;">Difficulty: ${window.currentQuestionDiff.toUpperCase()} | +${xp} XP</div>
            <div class="chaos-text" style="font-size:1rem;">🌌 Chaos Dimensioneer:</div><div class="dialogue-quote">"Behold my perfect physics: <strong>${cEq.eq}</strong>. Flawless!"</div>
            <div class="marshall-text" style="font-size:1rem; margin-top:-10px;">⚡ Dimension Marshall:</div><div class="dialogue-quote" style="font-size:0.9rem;">"Cadet, is this equation dimensionally correct, or is it a trap?"</div>
            <div class="challenge-btn-group"><button onclick="checkChallenge(3, true)">Valid</button><button onclick="checkChallenge(3, false)">Trap (Invalid)</button></div>`, false);
    }
}

window.checkChallenge = function(type, answer) {
    let isCorrect = false, explanation = '';
    if(type === 1) {
        let cleanStr = document.getElementById('chal-ans-input').value.replace(/\[|\]/g, '').replace(/\s+/g, '').replace(/\^/g, '').toUpperCase();
        let M=0, L=0, T=0, I=0, K=0, mol=0; const regex = /([MLTIK]|MOL)([\²\³\⁴\⁵\⁻]|-?\d*\.?\d+)?/g; let match;
        while((match = regex.exec(cleanStr)) !== null) { let dim = match[1], pow = parseFloat((match[2] || "1").replace('²', '2').replace('³', '3').replace('⁴', '4').replace('⁵', '5').replace('⁻', '-')); if(dim==='M') M=pow; if(dim==='L') L=pow; if(dim==='T') T=pow; if(dim==='I') I=pow; if(dim==='K') K=pow; if(dim==='MOL') mol=pow; }
        if(window.formatDim(createDim(M, L, T, I, K, mol)).replace(/\[|\]/g, '') === window.chalCurrentAnswer || (!window.chalCurrentAnswer && M===0&&L===0&&T===0&&I===0)) isCorrect = true;
        explanation = `Correct Dimensions: <strong>[${window.chalCurrentAnswer || 'Dimensionless'}]</strong>`;
    } else if(type === 2) { isCorrect = (answer === window.chalCurrentAnswer); explanation = `Correct Quantity: <strong>${window.dimDict[window.chalCurrentAnswer].name}</strong>`;
    } else if(type === 3) { isCorrect = (answer === window.chalCurrentAnswer); explanation = `LHS = ${window.chalCurrentContext.lhs}<br>RHS = ${window.chalCurrentContext.rhs}`; }

    window.chalTotal++; window.userStats.totalQsSolved++;
    let chapterKey = document.getElementById('chal-chapter').value;
    if(chapterKey === 'all') chapterKey = 'mechanics'; 
    window.userStats.chapterTotal[chapterKey]++;
    
    let earnedXP = 0, mResponse = "";
    if(isCorrect) {
        window.chalScore++; window.userStats.streak++; window.userStats.chapterCorrect[chapterKey]++;
        if(window.userStats.streak > window.userStats.highestStreak) window.userStats.highestStreak = window.userStats.streak;
        earnedXP = window.currentQuestionDiff==='easy'?10:window.currentQuestionDiff==='medium'?15:window.currentQuestionDiff==='hard'?25:50;
        window.bossHP = Math.max(0, window.bossHP - 10);
        mResponse = `"Direct hit! The dimensions are balanced."`;
        window.sessionXP += earnedXP; window.userStats.xp += earnedXP;
    } else { window.userStats.streak = 0; mResponse = `"Missed! Re-examine your assumptions."`; }

    let questUi = document.getElementById('daily-quest-ui');
    if(window.chalScore >= 7 && !window.userStats.dailyCompleted && questUi) { window.userStats.dailyCompleted = true; window.sessionXP += 100; window.userStats.xp += 100; if(!window.userStats.badges.includes('daily_scholar')) window.userStats.badges.push('daily_scholar'); }
    if(window.chalTotal === window.chalMaxQuestions && window.chalScore === window.chalMaxQuestions) { window.sessionXP += 50; window.userStats.xp += 50; window.userStats.perfectRounds++; window.userStats.bossesDefeated++; }
    else if(window.chalTotal === window.chalMaxQuestions && window.chalScore >= 7) { window.userStats.bossesDefeated++; }
    window.saveStats();

    let nextAction = window.bossHP <= 0 || window.chalTotal >= window.chalMaxQuestions ? `<button class="primary-btn" style="background: var(--gold); color: #000; max-width:250px; margin: 0 auto;" onclick="showResults()">View Battle Results</button>` : `<button class="primary-btn" style="max-width:250px; margin: 0 auto;" onclick="startChallenge()">Next Strike</button>`;
    window.updateBossUI(`
        <div class="marshall-text" style="font-size:1rem;">⚡ Dimension Marshall:</div><div class="dialogue-quote">${mResponse}</div>
        <div style="font-size: 2rem; color: ${isCorrect?'var(--success)':'var(--error)'}; margin-bottom: 0.5rem;">${isCorrect?'Direct Hit! ⚔️':'Blocked! 🛡️'} <span style="font-size: 1rem; color: var(--xp-color);">${isCorrect?'+'+earnedXP+' XP':''}</span></div>
        <div style="margin-bottom: 1.5rem; color: var(--text-muted); font-size: 1.1rem;">${explanation}</div>${nextAction}
    `, isCorrect);
}

window.showResults = function() {
    const percent = window.chalTotal > 0 ? Math.round((window.chalScore / window.chalTotal) * 100) : 0;
    if(percent === 100 && !window.userStats.badges.includes('first_perfect')) window.userStats.badges.push('first_perfect'); window.saveStats();
    let title = percent === 100 ? '👑 FLAWLESS VICTORY' : percent >= 70 ? '🏆 BOSS DEFEATED' : '💀 RETREAT';
    document.getElementById('challenge-box').innerHTML = `
        <div class="challenge-result animate-pop">
            <h4 style="color:var(--text-muted); letter-spacing:2px; margin-bottom:0.5rem;">⚡ BATTLE REPORT</h4>
            <h2>${title}</h2>
            <div class="stats"><strong>Boss Damage:</strong> ${window.chalScore * 10}% <br><strong>Accuracy:</strong> ${percent}% <br><strong style="color:var(--xp-color);">XP Gained:</strong> +${window.sessionXP}</div>
            <div class="marshall-text">⚡ Dimension Marshall:</div><div class="message" style="font-style: italic;">"${percent >= 70 ? 'The Chaos Dimensioneer has fled. The realm is secure.' : 'We must train harder before facing him again.'}"</div>
            <div style="display:flex; gap:1rem; justify-content:center; max-width: 400px; margin: 0 auto;">
                <button class="primary-btn" onclick="startChallengeLoader()">Battle Again</button>
            </div>
        </div>`;
}

// --- BOOTSTRAP INITIALIZATION ---
window.onload = () => {
    if(localStorage.getItem('cinePhysicsTheme') === 'light') { 
        document.body.classList.add('light-mode'); 
        document.getElementById('theme-meta').content = '#f8fafc'; 
    }
    window.populateDropdowns('');
    window.discoverQuantity(); 
    window.initStats(); 
};
