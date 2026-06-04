// js/engine.js
window.toSuperscript = function(numStr) { return numStr.toString().split('').map(char => ({ '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '.': '⋅' }[char] || char)).join(''); }
window.formatDim = function(dim) {
    let str = '';
    if (dim.M) str += 'M' + (dim.M !== 1 ? window.toSuperscript(dim.M) : '');
    if (dim.L) str += 'L' + (dim.L !== 1 ? window.toSuperscript(dim.L) : '');
    if (dim.T) str += 'T' + (dim.T !== 1 ? window.toSuperscript(dim.T) : '');
    if (dim.I) str += 'I' + (dim.I !== 1 ? window.toSuperscript(dim.I) : '');
    if (dim.K) str += 'K' + (dim.K !== 1 ? window.toSuperscript(dim.K) : '');
    if (dim.mol) str += 'mol' + (dim.mol !== 1 ? window.toSuperscript(dim.mol) : '');
    return str === '' ? 'Dimensionless' : '[' + str + ']';
}
window.isDimensionless = function(dim) { return dim.M === 0 && dim.L === 0 && dim.T === 0 && dim.I === 0 && dim.K === 0 && dim.mol === 0; }
window.operateDims = function(d1, d2, op, scalar = 1) {
    let res = {M:0,L:0,T:0,I:0,K:0,mol:0};
    for(let k in res) res[k] = op === 'add' ? d1[k] + (d2[k] * scalar) : d1[k] - d2[k];
    return res;
}

const mathFuncNames = ['sin', 'cos', 'tan', 'log', 'ln', 'exp', 'sqrt'];

window.parseFlatMultiplication = function(expr) {
    let result = createDim(0,0,0,0,0,0);
    
    // Preprocess spaces into explicit multiplication
    expr = expr.trim().replace(/\s+/g, '*'); 
    
    const regex = /(__TMP_\d+__|[a-zA-Z_0-9]+)([\²\³\⁴\⁵\⁻]|\^(?:\-?\d*\.?\d+|\(\-?\d+\/\d+\)))?/g;
    let match;
    
    while ((match = regex.exec(expr)) !== null) {
        let variable = match[1];
        let vLower = variable.toLowerCase();
        
        // Catch aliases and case-variations dynamically
        if (window.aliasMap[vLower]) {
            variable = window.aliasMap[vLower];
        }

        // Ignore pure math functions or raw numbers
        if (mathFuncNames.includes(variable) || !isNaN(variable)) continue; 

        // Extract and process exponents safely
        let powerStr = match[2] || "1";
        let power = 1;
        
        if (powerStr.startsWith('^(')) {
            let parts = powerStr.replace('^(', '').replace(')', '').split('/');
            power = parseFloat(parts[0]) / parseFloat(parts[1]);
        } else {
            powerStr = powerStr.replace('²', '2').replace('³', '3').replace('⁴', '4').replace('⁵', '5').replace('⁻', '-').replace('^', '');
            power = parseFloat(powerStr);
        }
        
        // Add dimension exponents mathematically
        if (window.dimDict[variable]) {
            result = window.operateDims(result, window.dimDict[variable], 'add', power);
        }
    }
    
    return result;
}


window.parseDivision = function(expr) {
    let parts = expr.split('/');
    let result = window.parseFlatMultiplication(parts[0]);
    for(let i = 1; i < parts.length; i++) result = window.operateDims(result, window.parseFlatMultiplication(parts[i]), 'subtract');
    return result;
}

window.activeTempTokens = [];
window.evaluateTermRecursively = function(term) {
    let currentStr = term, consistencyError = null, tempCounter = 0;

    while(currentStr.includes('(')) {
        let lastOpen = currentStr.lastIndexOf('('), nextClose = currentStr.indexOf(')', lastOpen);
        if(nextClose === -1) break; 
        let innerExpr = currentStr.substring(lastOpen + 1, nextClose);
        if(innerExpr.includes('/') && !isNaN(innerExpr.split('/')[0])) break; 

        let prefix = currentStr.substring(0, lastOpen).trim();
        let matchedFunc = mathFuncNames.find(func => prefix.endsWith(func));
        let isSqrt = (!matchedFunc && prefix.endsWith('sqrt'));
        if(isSqrt) lastOpen = currentStr.lastIndexOf('sqrt');
        else if(matchedFunc) lastOpen = currentStr.lastIndexOf(matchedFunc);

        let innerTerms = innerExpr.split(/[\+\-]/).map(t => t.trim()).filter(t => t);
        let firstInnerDim = null, firstInnerDimStr = "";

        for(let i=0; i<innerTerms.length; i++) {
            let evaluated = window.parseDivision(innerTerms[i]);
            let dimStr = window.formatDim(evaluated);
            if(i === 0) { firstInnerDim = evaluated; firstInnerDimStr = dimStr; }
            else if(dimStr !== firstInnerDimStr) return { error: `Inside parentheses, you tried to combine ${firstInnerDimStr} and ${dimStr}`, obj1: firstInnerDim, obj2: evaluated };
        }

        let powerToApply = 1;
        if(matchedFunc) {
            if (matchedFunc === 'sqrt') powerToApply = 0.5;
            else {
                if(!window.isDimensionless(firstInnerDim)) return { error: `Argument of ${matchedFunc}() must be dimensionless. You provided ${firstInnerDimStr}` };
                firstInnerDim = {M:0,L:0,T:0,I:0,K:0,mol:0}; 
            }
            lastOpen = currentStr.lastIndexOf(matchedFunc);
        } 

        let afterParen = currentStr.substring(nextClose + 1);
        let expMatch = afterParen.match(/^([\²\³\⁴\⁵\⁻]|\^(?:\-?\d*\.?\d+|\(\-?\d+\/\d+\)))/);
        let charsToReplace = nextClose + 1;

        if (expMatch && !isSqrt && !matchedFunc) { 
            let powerStr = expMatch[1];
            if(powerStr.startsWith('^(')) {
                let parts = powerStr.replace('^(', '').replace(')', '').split('/');
                powerToApply *= (parseFloat(parts[0]) / parseFloat(parts[1]));
            } else powerToApply *= parseFloat(powerStr.replace('²', '2').replace('³', '3').replace('⁴', '4').replace('⁵', '5').replace('⁻', '-').replace('^', ''));
            charsToReplace += expMatch[1].length;
        }

        for(let key in firstInnerDim) firstInnerDim[key] *= powerToApply;
        let tempToken = `__TMP_${tempCounter}__`;
        window.dimDict[tempToken] = { ...firstInnerDim }; 
        window.activeTempTokens.push(tempToken); tempCounter++;
        currentStr = currentStr.substring(0, lastOpen) + tempToken + currentStr.substring(charsToReplace);
    }
    return { dim: window.parseDivision(currentStr), error: consistencyError };
}

window.cleanupTempTokens = function() {
    window.activeTempTokens.forEach(token => delete window.dimDict[token]);
    window.activeTempTokens = [];
}
