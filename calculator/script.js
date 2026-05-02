function safeCalc(expr) {
  const tokens = expr.match(/(-?\d+\.?\d*)|([+\-*/])/g);
  if (!tokens) return NaN;
  const nums = [];
  const ops  = [];
  let i = 0;
  nums.push(parseFloat(tokens[i++]));
  while (i < tokens.length) {
    const op  = tokens[i++];
    const num = parseFloat(tokens[i++]);
    if (isNaN(num)) return NaN;
    ops.push(op);
    nums.push(num);
  }
  let j = 0;
  while (j < ops.length) {
    if (ops[j] === '*' || ops[j] === '/') {
      const res = ops[j] === '*' ? nums[j] * nums[j + 1] : nums[j] / nums[j + 1];
      nums.splice(j, 2, res);
      ops.splice(j, 1);
    } else { j++; }
  }
  let result = nums[0];
  for (let k = 0; k < ops.length; k++) {
    result = ops[k] === '+' ? result + nums[k + 1] : result - nums[k + 1];
  }
  return result;
}

const state = {
  displayExpr: '',
  calcExpr:    '',
  result:      '0',
  justEvaled:  false,
  waitingOp:   false,
  activeOp:    null,
  history:     JSON.parse(localStorage.getItem('calc_history') || '[]')
};

const resultEl   = document.getElementById('result');
const exprEl     = document.getElementById('expr');
const cursorEl   = document.getElementById('cursor');
const resultWrap = document.querySelector('.result-wrap');
const historyPanel   = document.getElementById('historyPanel');
const converterPanel = document.getElementById('converterPanel');
const overlay        = document.getElementById('overlay');
const historyList    = document.getElementById('historyList');
const convFromEl   = document.getElementById('convFrom');
const convToEl     = document.getElementById('convTo');
const convFromUnit = document.getElementById('convFromUnit');
const convToUnit   = document.getElementById('convToUnit');
const convNote     = document.getElementById('convNote');

function render() {
  const len = state.result.length;
  resultEl.style.fontSize = len > 13 ? '1.6rem' : len > 10 ? '2rem' : len > 7 ? '2.8rem' : '';
  exprEl.textContent   = state.displayExpr;
  resultEl.textContent = state.result;
}

function popResult() {
  resultEl.classList.remove('pop');
  void resultEl.offsetWidth;
  resultEl.classList.add('pop');
  setTimeout(() => resultEl.classList.remove('pop'), 180);
}

function shakeDisplay() {
  resultWrap.classList.remove('shake');
  void resultWrap.offsetWidth;
  resultWrap.classList.add('shake');
  setTimeout(() => resultWrap.classList.remove('shake'), 320);
}

const OPERATORS  = new Set(['+', '-', '*', '/']);
const OP_DISPLAY = { '+': ' + ', '-': ' − ', '*': ' × ', '/': ' ÷ ' };

function setActiveOp(op) {
  document.querySelectorAll('.btn-op').forEach(b => b.classList.remove('op-active'));
  state.activeOp = op;
  if (op) {
    const btn = document.querySelector(`.btn-op[data-value="${op}"]`);
    if (btn) btn.classList.add('op-active');
  }
}

function inputDigit(val) {
  if (state.justEvaled) {
    state.displayExpr = val === '.' ? '0.' : val;
    state.calcExpr    = state.displayExpr;
    state.result      = state.displayExpr;
    state.justEvaled  = false;
    state.waitingOp   = false;
    setActiveOp(null);
    cursorEl.classList.remove('hidden');
    render();
    return;
  }
  if (state.waitingOp) {
    state.displayExpr += val === '.' ? '0.' : val;
    state.calcExpr    += val === '.' ? '0.' : val;
    state.result       = val === '.' ? '0.' : val;
    state.waitingOp    = false;
    setActiveOp(null);
    cursorEl.classList.remove('hidden');
    render();
    return;
  }
  if (val === '.') {
    const lastOpIdx = Math.max(
      state.calcExpr.lastIndexOf('+'), state.calcExpr.lastIndexOf('-'),
      state.calcExpr.lastIndexOf('*'), state.calcExpr.lastIndexOf('/')
    );
    const seg = state.calcExpr.slice(lastOpIdx + 1);
    if (seg.includes('.')) return;
    if (seg === '') {
      state.displayExpr += '0.';
      state.calcExpr    += '0.';
      state.result       = state.result === '0' ? '0.' : state.result + '.';
      render();
      return;
    }
  }
  const lastOpIdx = Math.max(
    state.calcExpr.lastIndexOf('+'), state.calcExpr.lastIndexOf('-'),
    state.calcExpr.lastIndexOf('*'), state.calcExpr.lastIndexOf('/')
  );
  const currentSeg = state.calcExpr.slice(lastOpIdx + 1);
  if (currentSeg === '0' && val !== '.') {
    state.displayExpr = state.displayExpr.slice(0, -1) + val;
    state.calcExpr    = state.calcExpr.slice(0, -1) + val;
    state.result      = val;
    render();
    return;
  }
  state.displayExpr += val;
  state.calcExpr    += val;
  state.result       = state.calcExpr.slice(lastOpIdx + 1) || '0';
  cursorEl.classList.remove('hidden');
  render();
}

function inputOperator(op) {
  if (state.calcExpr === '' && state.result === '0') {
    if (op === '-') {
      state.displayExpr = '−';
      state.calcExpr    = '-';
      state.waitingOp   = false;
      setActiveOp(op);
      render();
    }
    return;
  }
  if (state.waitingOp) {
    const dLen = OP_DISPLAY[state.activeOp]?.length || 3;
    state.displayExpr = state.displayExpr.slice(0, -dLen) + OP_DISPLAY[op];
    state.calcExpr    = state.calcExpr.slice(0, -1) + op;
    setActiveOp(op);
    render();
    return;
  }
  if (state.justEvaled) {
    state.displayExpr = state.result + OP_DISPLAY[op];
    state.calcExpr    = state.result + op;
    state.justEvaled  = false;
    state.waitingOp   = true;
    setActiveOp(op);
    cursorEl.classList.remove('hidden');
    render();
    return;
  }
  state.displayExpr += OP_DISPLAY[op];
  state.calcExpr    += op;
  state.waitingOp    = true;
  setActiveOp(op);
  cursorEl.classList.remove('hidden');
  render();
}

function toggleSign() {
  if (state.result === '0' || state.result === 'Error') return;
  const lastOpIdx = Math.max(
    state.calcExpr.lastIndexOf('+'), state.calcExpr.lastIndexOf('-'),
    state.calcExpr.lastIndexOf('*'), state.calcExpr.lastIndexOf('/')
  );
  const prefix  = state.calcExpr.slice(0, lastOpIdx + 1);
  const seg     = state.calcExpr.slice(lastOpIdx + 1);
  if (!seg) return;
  const negated = seg.startsWith('-') ? seg.slice(1) : '-' + seg;
  state.calcExpr = prefix + negated;
  const dLastOpIdx = Math.max(
    state.displayExpr.lastIndexOf(' + '), state.displayExpr.lastIndexOf(' − '),
    state.displayExpr.lastIndexOf(' × '), state.displayExpr.lastIndexOf(' ÷ ')
  );
  const dPrefix = dLastOpIdx >= 0 ? state.displayExpr.slice(0, dLastOpIdx + 3) : '';
  const dSeg    = dLastOpIdx >= 0 ? state.displayExpr.slice(dLastOpIdx + 3) : state.displayExpr;
  state.displayExpr = dPrefix + (dSeg.startsWith('−') ? dSeg.slice(1) : '−' + dSeg);
  state.result = negated;
  render();
}

function inputPercent() {
  if (state.waitingOp || state.calcExpr === '') return;
  const lastOpIdx = Math.max(
    state.calcExpr.lastIndexOf('+'), state.calcExpr.lastIndexOf('-'),
    state.calcExpr.lastIndexOf('*'), state.calcExpr.lastIndexOf('/')
  );
  const prefix = state.calcExpr.slice(0, lastOpIdx + 1);
  const lastOp = lastOpIdx >= 0 ? state.calcExpr[lastOpIdx] : null;
  const seg    = state.calcExpr.slice(lastOpIdx + 1);
  const num    = parseFloat(seg);
  if (isNaN(num)) return;
  let pctVal;
  if ((lastOp === '+' || lastOp === '-') && prefix.length > 1) {
    const base = safeCalc(prefix.slice(0, -1));
    pctVal = isNaN(base) ? num / 100 : (base * num) / 100;
  } else {
    pctVal = num / 100;
  }
  const pctStr = String(parseFloat(pctVal.toFixed(10)));
  state.calcExpr    = prefix + pctStr;
  state.displayExpr = prefix.replace(/\+/g,' + ').replace(/-/g,' − ').replace(/\*/g,' × ').replace(/\//g,' ÷ ') + pctStr;
  state.result = pctStr;
  render();
}

function calculate() {
  if (state.calcExpr === '' || state.waitingOp) { shakeDisplay(); return; }
  if (state.justEvaled) return;
  const raw         = safeCalc(state.calcExpr);
  const displayFull = state.displayExpr + ' =';
  if (!isFinite(raw) || isNaN(raw)) {
    state.result      = raw === Infinity || raw === -Infinity ? "Can't ÷ 0" : 'Error';
    state.displayExpr = displayFull;
    shakeDisplay();
  } else {
    const result = parseFloat(raw.toFixed(10));
    addHistory(state.displayExpr, result);
    state.result      = String(result);
    state.displayExpr = displayFull;
  }
  state.calcExpr   = (state.result === 'Error' || state.result === "Can't ÷ 0") ? '' : state.result;
  state.justEvaled = true;
  state.waitingOp  = false;
  setActiveOp(null);
  cursorEl.classList.add('hidden');
  popResult();
  render();
}

function clearAll() {
  state.displayExpr = '';
  state.calcExpr    = '';
  state.result      = '0';
  state.justEvaled  = false;
  state.waitingOp   = false;
  setActiveOp(null);
  cursorEl.classList.remove('hidden');
  render();
}

function deleteLast() {
  if (state.justEvaled || state.result === 'Error' || state.result === "Can't ÷ 0") { clearAll(); return; }
  if (state.waitingOp) {
    const dLen = OP_DISPLAY[state.activeOp]?.length || 3;
    state.displayExpr = state.displayExpr.slice(0, -dLen);
    state.calcExpr    = state.calcExpr.slice(0, -1);
    state.waitingOp   = false;
    setActiveOp(null);
    render();
    return;
  }
  if (state.calcExpr.length <= 1) { clearAll(); return; }
  state.calcExpr    = state.calcExpr.slice(0, -1);
  state.displayExpr = state.displayExpr.slice(0, -1);
  const lastOpIdx = Math.max(
    state.calcExpr.lastIndexOf('+'), state.calcExpr.lastIndexOf('-'),
    state.calcExpr.lastIndexOf('*'), state.calcExpr.lastIndexOf('/')
  );
  state.result = state.calcExpr.slice(lastOpIdx + 1) || '0';
  render();
}

function addHistory(expr, result) {
  state.history.unshift({ expr, result });
  if (state.history.length > 50) state.history.pop();
  localStorage.setItem('calc_history', JSON.stringify(state.history));
  renderHistory();
}

function renderHistory() {
  if (!state.history.length) {
    historyList.innerHTML = '<li class="history-empty">No calculations yet</li>';
    return;
  }
  historyList.innerHTML = state.history.map((h, i) => `
    <li class="history-item" data-index="${i}">
      <div class="h-expr">${h.expr}</div>
      <div class="h-result">= ${h.result}</div>
    </li>`).join('');
}

historyList.addEventListener('click', e => {
  const item = e.target.closest('.history-item');
  if (!item) return;
  const h = state.history[+item.dataset.index];
  state.result = String(h.result); state.displayExpr = ''; state.calcExpr = String(h.result);
  state.justEvaled = true; state.waitingOp = false;
  render(); closePanel(historyPanel);
});

document.getElementById('historyClear').addEventListener('click', () => {
  state.history = []; localStorage.removeItem('calc_history'); renderHistory();
});

function openPanel(panel) { panel.classList.add('open'); panel.setAttribute('aria-hidden','false'); overlay.classList.add('show'); }
function closePanel(panel) { panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); overlay.classList.remove('show'); }
function closeAllPanels() { closePanel(historyPanel); closePanel(converterPanel); }

document.getElementById('btnHistory').addEventListener('click', () => { renderHistory(); openPanel(historyPanel); });
document.getElementById('historyClose').addEventListener('click', () => closePanel(historyPanel));
document.getElementById('btnConverter').addEventListener('click', () => { setConvType('length'); openPanel(converterPanel); });
document.getElementById('converterClose').addEventListener('click', () => closePanel(converterPanel));
document.getElementById('btnCurrency').addEventListener('click', () => { setConvType('currency'); openPanel(converterPanel); });
overlay.addEventListener('click', closeAllPanels);

const CONV_DATA = {
  length: {
    units: [
      { val:'mm', label:'mm – Millimeter' }, { val:'cm', label:'cm – Centimeter' },
      { val:'m',  label:'m  – Meter'      }, { val:'km', label:'km – Kilometer'  },
      { val:'in', label:'in – Inch'       }, { val:'ft', label:'ft – Foot'       },
      { val:'yd', label:'yd – Yard'       }, { val:'mi', label:'mi – Mile'       }
    ],
    toBase: { mm:0.001, cm:0.01, m:1, km:1000, in:0.0254, ft:0.3048, yd:0.9144, mi:1609.344 }
  },
  weight: {
    units: [
      { val:'mg', label:'mg – Milligram' }, { val:'g',  label:'g  – Gram'     },
      { val:'kg', label:'kg – Kilogram'  }, { val:'t',  label:'t  – Tonne'    },
      { val:'oz', label:'oz – Ounce'     }, { val:'lb', label:'lb – Pound'    }
    ],
    toBase: { mg:0.000001, g:0.001, kg:1, t:1000, oz:0.0283495, lb:0.453592 }
  },
  temp: {
    units: [
      { val:'C', label:'°C – Celsius' }, { val:'F', label:'°F – Fahrenheit' }, { val:'K', label:'K – Kelvin' }
    ],
    toBase: null
  },
  currency: {
    units: [
      { val:'USD', label:'USD – US Dollar'        }, { val:'EUR', label:'EUR – Euro'              },
      { val:'GBP', label:'GBP – British Pound'    }, { val:'INR', label:'INR – Indian Rupee'      },
      { val:'JPY', label:'JPY – Japanese Yen'     }, { val:'CAD', label:'CAD – Canadian Dollar'   },
      { val:'AUD', label:'AUD – Australian Dollar'}, { val:'CNY', label:'CNY – Chinese Yuan'      }
    ],
    toBase: { USD:1, EUR:0.92, GBP:0.79, INR:83.1, JPY:149.5, CAD:1.36, AUD:1.53, CNY:7.24 }
  }
};

let currentConvType = 'length';

function setConvType(type) {
  currentConvType = type;
  document.querySelectorAll('.conv-tab').forEach(t => t.classList.toggle('active', t.dataset.type === type));
  const data = CONV_DATA[type];
  [convFromUnit, convToUnit].forEach((sel, i) => {
    sel.innerHTML = data.units.map(u => `<option value="${u.val}">${u.label}</option>`).join('');
    sel.selectedIndex = i === 0 ? 0 : 1;
  });
  convFromEl.value = ''; convToEl.value = '';
  convNote.textContent = type === 'currency' ? '⚠ Rates are approximate and not live.' : '';
}

function convertValue() {
  const val  = parseFloat(convFromEl.value);
  const from = convFromUnit.value;
  const to   = convToUnit.value;
  if (isNaN(val)) { convToEl.value = ''; return; }
  if (currentConvType === 'temp') { convToEl.value = convertTemp(val, from, to); return; }
  const rates = CONV_DATA[currentConvType].toBase;
  convToEl.value = parseFloat(((val * rates[from]) / rates[to]).toFixed(8));
}

function convertTemp(val, from, to) {
  let c = from === 'C' ? val : from === 'F' ? (val - 32) * 5 / 9 : val - 273.15;
  if (to === 'C') return parseFloat(c.toFixed(4));
  if (to === 'F') return parseFloat((c * 9 / 5 + 32).toFixed(4));
  return parseFloat((c + 273.15).toFixed(4));
}

document.getElementById('convSwap').addEventListener('click', () => {
  [convFromUnit.value, convToUnit.value] = [convToUnit.value, convFromUnit.value];
  convFromEl.value = convToEl.value; convertValue();
});

document.getElementById('convUse').addEventListener('click', () => {
  const val = convToEl.value; if (!val) return;
  state.result = val; state.calcExpr = val; state.displayExpr = '';
  state.justEvaled = true; state.waitingOp = false;
  render(); closePanel(converterPanel);
});

convFromEl.addEventListener('input', convertValue);
convFromUnit.addEventListener('change', convertValue);
convToUnit.addEventListener('change', convertValue);
document.querySelectorAll('.conv-tab').forEach(tab => tab.addEventListener('click', () => setConvType(tab.dataset.type)));

document.querySelector('.btn-grid').addEventListener('click', e => {
  const btn = e.target.closest('.btn'); if (!btn) return;
  const { action, value } = btn.dataset;
  if (action === 'clear')   return clearAll();
  if (action === 'delete')  return deleteLast();
  if (action === 'sign')    return toggleSign();
  if (action === 'equals')  return calculate();
  if (action === 'percent') return inputPercent();
  if (OPERATORS.has(value)) return inputOperator(value);
  if (value !== undefined)  return inputDigit(value);
});

const KEY_MAP = {
  '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
  '.':'.','%':'%','+':'+','-':'-','*':'*','/':'/',
  'Enter':'=','=':'=','Backspace':'DEL','Delete':'C','Escape':'C'
};

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const mapped = KEY_MAP[e.key]; if (!mapped) return;
  e.preventDefault();
  const sel = mapped==='=' ? '[data-action="equals"]' : mapped==='DEL' ? '[data-action="delete"]' :
              mapped==='C' ? '[data-action="clear"]'  : mapped==='%'   ? '[data-action="percent"]' :
              `[data-value="${mapped}"]`;
  const btn = document.querySelector(sel);
  if (btn) { btn.classList.add('key-active'); setTimeout(() => btn.classList.remove('key-active'), 130); }
  if (mapped === '=')        return calculate();
  if (mapped === 'DEL')      return deleteLast();
  if (mapped === 'C')        return clearAll();
  if (mapped === '%')        return inputPercent();
  if (OPERATORS.has(mapped)) return inputOperator(mapped);
  inputDigit(mapped);
});

const sizeIcon  = document.getElementById('sizeIcon');
const sizeLabel = document.getElementById('sizeLabel');
const SIZES       = ['compact', 'normal', 'large'];
const SIZE_ICONS  = { compact:'density_small', normal:'density_medium', large:'density_large' };
const SIZE_LABELS = { compact:'Compact', normal:'Normal', large:'Large' };

function applySize(size) {
  document.documentElement.classList.remove(...SIZES);
  if (size !== 'normal') document.documentElement.classList.add(size);
  sizeIcon.textContent  = SIZE_ICONS[size];
  sizeLabel.textContent = SIZE_LABELS[size];
  localStorage.setItem('calc_size', size);
}

document.getElementById('btnSize').addEventListener('click', () => {
  const cur = SIZES.find(s => document.documentElement.classList.contains(s)) || 'normal';
  applySize(SIZES[(SIZES.indexOf(cur) + 1) % SIZES.length]);
});

const themeIcon  = document.getElementById('themeIcon');
const themeLabel = document.getElementById('themeLabel');

function applyTheme(isLight) {
  document.documentElement.classList.toggle('light', isLight);
  themeIcon.textContent  = isLight ? 'light_mode' : 'dark_mode';
  themeLabel.textContent = isLight ? 'Light' : 'Dark';
  localStorage.setItem('calc_theme', isLight ? 'light' : 'dark');
}

document.getElementById('btnTheme').addEventListener('click', () => {
  applyTheme(!document.documentElement.classList.contains('light'));
});

applyTheme(localStorage.getItem('calc_theme') === 'light');
applySize(localStorage.getItem('calc_size') || 'normal');
setConvType('length');
render();
