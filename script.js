const slideEl = document.getElementById('slide');
const slideNav = document.getElementById('slideNav');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const btnPrevStep = document.getElementById('btnPrevStep');
const btnNextStep = document.getElementById('btnNextStep');
const btnPrevSlide = document.getElementById('btnPrevSlide');
const btnNextSlide = document.getElementById('btnNextSlide');
const helpDialog = document.getElementById('helpDialog');

let currentSlide = 0;
let currentStep = 0;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function traceClone(state, extra = {}) {
  return JSON.parse(JSON.stringify({ ...state, ...extra }));
}

function renderCode(lines, activeLine = -1, compact = false, dangerLine = -1) {
  return `
    <div class="code-wrap">
      <div class="code ${compact ? 'tight-code' : ''}">
        ${lines.map((line, i) => {
          const isActive = i === activeLine;
          const isDanger = isActive && i === dangerLine;
          const cls = isDanger ? 'break-active' : (isActive ? 'active' : (activeLine >= 0 ? 'dim' : ''));
          return `<span class="code-line ${cls}">${line}</span>`;
        }).join('')}
      </div>
    </div>`;
}

function renderConsole(lines, tall = false) {
  if (!lines || !lines.length) {
    return '<div class="console-line muted">Aún no hay salida.</div>';
  }
  return `<div class="console ${tall ? 'tall' : ''}">${lines.map(([kind, txt]) => `<div class="console-line ${kind}">${escapeHtml(txt)}</div>`).join('')}</div>`;
}

function renderVarGrid(items) {
  const densityClass = items.length >= 8 ? 'dense-4' : (items.length >= 5 ? 'dense-3' : '');
  return `<div class="var-grid ${densityClass}">${items.map(item => `
    <div class="var-box ${item.accent ? 'accent' : ''}" title="${escapeHtml(item.label)}: ${escapeHtml(item.value)}">
      <div class="var-name">${escapeHtml(item.label)}</div>
      <div class="var-value">${escapeHtml(item.value)}</div>
    </div>`).join('')}</div>`;
}

function renderSequence(arr, opts = {}) {
  const {
    label = 'secuencia',
    activeIndices = [],
    mutedIndices = [],
    negative = true,
    type = 'list'
  } = opts;

  const open = type === 'tuple' ? '(' : '[';
  const close = type === 'tuple' ? ')' : ']';

  return `
    <div class="sequence-board">
      <div class="seq-label">${escapeHtml(label)}</div>
      <div class="sequence-grid">
        ${arr.map((value, i) => `
          <div class="seq-cell ${activeIndices.includes(i) ? 'highlight' : ''} ${mutedIndices.includes(i) ? 'muted' : ''}">
            <span class="seq-index">${i}${negative ? ` · ${i - arr.length}` : ''}</span>
            <span class="seq-value">${escapeHtml(typeof value === 'string' ? `"${value}"` : Array.isArray(value) ? JSON.stringify(value) : value)}</span>
          </div>`).join('')}
      </div>
      <div class="legend-note">${open} ... ${close} &nbsp;·&nbsp; arriba: índice normal, abajo: índice negativo</div>
    </div>`;
}

function renderTupleOfPairs(tuple, activeIndex = null, highlightX = false) {
  return `
    <div class="sequence-board">
      <div class="seq-label">tupla de coordenadas</div>
      <div class="sequence-grid">
        ${tuple.map((pair, i) => `
          <div class="seq-cell ${i === activeIndex ? 'highlight' : ''}">
            <span class="seq-index">${i}</span>
            <span class="seq-value">(${pair[0]}, ${pair[1]})</span>
          </div>`).join('')}
      </div>
      ${activeIndex !== null ? `<div class="result-box"><strong>Elemento seleccionado:</strong> coordenadas[${activeIndex}] = (${tuple[activeIndex][0]}, ${tuple[activeIndex][1]})${highlightX ? ` &nbsp;→&nbsp; <strong>X = ${tuple[activeIndex][0]}</strong>` : ''}</div>` : ''}
    </div>`;
}

function renderSetBox(title, values, mode = '') {
  return `
    <div class="set-box">
      <div class="seq-label">${escapeHtml(title)}</div>
      <div class="set-chip-row">
        ${values.map(v => `<span class="set-chip ${mode}">${escapeHtml(v)}</span>`).join('')}
      </div>
    </div>`;
}

function renderSetCompare(a, b, result, resultTitle) {
  return `
    <div class="set-zone">
      ${renderSetBox('Conjunto A', a, 'hitA')}
      ${renderSetBox('Conjunto B', b, 'hitB')}
      ${renderSetBox(resultTitle, result, 'hitBoth')}
    </div>`;
}

function renderDictEntries(entries, activeKey = null) {
  return `<div class="dict-grid">${entries.map(([k, v]) => `
    <div class="dict-entry ${k === activeKey ? 'active' : ''}">
      <strong>${escapeHtml(k)}</strong>
      <span>${escapeHtml(Array.isArray(v) ? JSON.stringify(v) : v)}</span>
    </div>`).join('')}</div>`;
}

const listExerciseCode = [
  `<span class="var">pesos</span> = [<span class="num">1200</span>, <span class="num">850</span>, <span class="num">920</span>, <span class="num">1100</span>, <span class="num">980</span>, <span class="num">1130</span>, <span class="num">950</span>, <span class="num">880</span>, <span class="num">754</span>, <span class="num">678</span>, <span class="num">823</span>, <span class="num">389</span>, <span class="num">1342</span>, <span class="num">368</span>, <span class="num">1678</span>, <span class="num">453</span>, <span class="num">569</span>]`,
  `<span class="var">maximo</span> = <span class="kw">max</span>(<span class="var">pesos</span>)`,
  `<span class="var">minimo</span> = <span class="kw">min</span>(<span class="var">pesos</span>)`,
  `<span class="var">promedio</span> = <span class="kw">sum</span>(<span class="var">pesos</span>) / <span class="kw">len</span>(<span class="var">pesos</span>)`,
  `<span class="var">pesos</span>[<span class="num">2</span>] = <span class="var">maximo</span>`,
  `<span class="var">pesos</span>[<span class="num">5</span>] = <span class="var">minimo</span>`,
  `<span class="var">pesos</span>[<span class="num">-1</span>] = <span class="var">promedio</span>`,
  `<span class="kw">print</span>(<span class="var">pesos</span>)`
];

function buildListExerciseTrace() {
  const original = [1200, 850, 920, 1100, 980, 1130, 950, 880, 754, 678, 823, 389, 1342, 368, 1678, 453, 569];
  const trace = [];
  const out = [];
  const state = { pesos: [...original], maximo: '—', minimo: '—', promedio: '—', activeIndices: [] };
  const push = (line, message, indices = []) => trace.push(traceClone(state, { line, message, activeIndices: indices, console: [...out] }));

  push(0, 'Partimos de la lista original de pesos.', []);
  state.maximo = Math.max(...state.pesos); push(1, `Calculamos el máximo: ${state.maximo}.`, [14]);
  state.minimo = Math.min(...state.pesos); push(2, `Calculamos el mínimo: ${state.minimo}.`, [13]);
  state.promedio = (state.pesos.reduce((a,b) => a+b, 0) / state.pesos.length).toFixed(2); push(3, `Calculamos el promedio: 15064 / 17 = ${state.promedio}.`, []);
  state.pesos[2] = Number(state.maximo); push(4, 'Reemplazamos el tercer elemento (índice 2) por el máximo.', [2, 14]);
  state.pesos[5] = Number(state.minimo); push(5, 'Reemplazamos el sexto elemento (índice 5) por el mínimo.', [5, 13]);
  state.pesos[state.pesos.length - 1] = Number(state.promedio); push(6, 'Reemplazamos el último elemento (índice -1) por el promedio.', [state.pesos.length - 1]);
  out.push(['output', `[${state.pesos.join(', ')}]`]); push(7, 'Mostramos la lista final con los cambios.', []);
  return trace;
}

const tupleExerciseCode = [
  `<span class="var">coordenadas</span> = ((<span class="num">2.3</span>, <span class="num">5.1</span>), (<span class="num">7.6</span>, <span class="num">8.0</span>), (<span class="num">5.5</span>, <span class="num">9.0</span>), (<span class="num">8.5</span>, <span class="num">6.5</span>), (<span class="num">6.5</span>, <span class="num">6.5</span>), (<span class="num">13.0</span>, <span class="num">8.0</span>), (<span class="num">1.5</span>, <span class="num">3.5</span>), (<span class="num">6.5</span>, <span class="num">2.5</span>), (<span class="num">15.5</span>, <span class="num">17.5</span>), (<span class="num">9.0</span>, <span class="num">11.0</span>), (<span class="num">6.0</span>, <span class="num">4.0</span>))`,
  `<span class="var">posicion</span> = <span class="num">4</span>`,
  `<span class="var">indice</span> = <span class="var">posicion</span> - <span class="num">1</span>`,
  `<span class="var">sensor</span> = <span class="var">coordenadas</span>[<span class="var">indice</span>]`,
  `<span class="var">coord_x</span> = <span class="var">sensor</span>[<span class="num">0</span>]`,
  `<span class="kw">print</span>(<span class="var">coord_x</span>)`
];

function buildTupleExerciseTrace() {
  const coords = [[2.3, 5.1], [7.6, 8.0], [5.5, 9.0], [8.5, 6.5], [6.5, 6.5], [13.0, 8.0], [1.5, 3.5], [6.5, 2.5], [15.5, 17.5], [9.0, 11.0], [6.0, 4.0]];
  const trace = [];
  const out = [];
  const state = { posicion: '—', indice: '—', sensor: '—', coord_x: '—', activeIndex: null };
  const push = (line, message) => trace.push(traceClone(state, { line, message, console: [...out] }));
  push(0, 'Partimos de la tupla de coordenadas.', []);
  state.posicion = 4; push(1, 'Supongamos que el usuario pide la posición 4.', []);
  state.indice = 3; state.activeIndex = 3; push(2, 'Convertimos posición humana a índice Python: 4 - 1 = 3.', []);
  state.sensor = '(8.5, 6.5)'; push(3, 'Tomamos coordenadas[3], que corresponde al cuarto sensor.', []);
  state.coord_x = 8.5; push(4, 'Accedemos al primer valor del par: sensor[0] = 8.5.', []);
  out.push(['output', '8.5']); push(5, 'Mostramos la coordenada X.', []);
  return { coords, trace };
}

const setExerciseCode = [
  `<span class="var">sensores_area1</span> = {<span class="str">"S1"</span>, <span class="str">"S2"</span>, <span class="str">"S3"</span>}`,
  `<span class="var">sensores_area2</span> = {<span class="str">"S2"</span>, <span class="str">"S3"</span>, <span class="str">"S4"</span>}`,
  `<span class="var">comunes</span> = <span class="var">sensores_area1</span> &amp; <span class="var">sensores_area2</span>`,
  `<span class="kw">print</span>(<span class="var">comunes</span>)`
];

function buildSetExerciseTrace() {
  const a = ['S1', 'S2', 'S3'];
  const b = ['S2', 'S3', 'S4'];
  const trace = [];
  const out = [];
  const state = { comunes: [], title: 'intersección' };
  const push = (line, message) => trace.push(traceClone(state, { line, message, console: [...out] }));
  push(0, 'Definimos el primer conjunto de sensores.', []);
  push(1, 'Definimos el segundo conjunto de sensores.', []);
  state.comunes = ['S2', 'S3']; push(2, 'La intersección conserva solo los elementos que aparecen en ambos conjuntos.', []);
  out.push(['output', "{'S2', 'S3'}"]); push(3, 'Mostramos el resultado de la intersección.', []);
  return { a, b, trace };
}

const dictExerciseCode = [
  `<span class="var">stock_prod</span> = {<span class="str">"PROD01"</span>: <span class="num">60</span>, <span class="str">"PROD02"</span>: <span class="num">95</span>, <span class="str">"PROD03"</span>: <span class="num">111</span>}`,
  `<span class="var">n</span> = <span class="num">5</span>`,
  `<span class="kw">for</span> <span class="var">i</span> <span class="kw">in</span> <span class="kw">range</span>(<span class="var">n</span>):`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">cod_producto</span> = <span class="kw">input</span>(<span class="str">"Código: "</span>)`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">cantidad</span> = <span class="kw">int</span>(<span class="kw">input</span>(<span class="str">"Cantidad: "</span>))`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">if</span> <span class="var">cod_producto</span> <span class="kw">in</span> <span class="var">stock_prod</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">stock_prod</span>[<span class="var">cod_producto</span>] += <span class="var">cantidad</span>`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">else</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">stock_prod</span>[<span class="var">cod_producto</span>] = <span class="var">cantidad</span>`,
  `<span class="kw">print</span>(<span class="var">stock_prod</span>)`
];

function buildDictExerciseTrace() {
  const entries = [['PROD01', 59], ['PROD04', 90], ['PROD02', 63], ['PROD03',84], ['PROD02',52]];
  const trace = [];
  const out = [];
  const state = {
    stock: { PROD01: 60, PROD02: 95, PROD03: 111 },
    n: '—', i:'—', cod_producto: '—', cantidad: '—', inStock: '—'
  };
  const push = (line, message, activeKey = null, extra={}) => trace.push(traceClone(state, { line, message, activeKey, console: [...out], ...extra }));
  push(0, 'Partimos del diccionario de stock inicial.');
  state.n=5; push(1, 'Sabemos que se registrarán 5 recepciones de almacén.');
  entries.forEach(([code, qty], idx) => {
    state.i=idx;
    state.cod_producto='—'; state.cantidad='—'; state.inStock='—';
    push(2, `El for inicia la recepción ${idx+1} de 5.`);
    state.cod_producto = code; out.push(['input', `Código ${idx+1}: ${code}`]); push(3, `Leemos el código ${code}.`, code);
    state.cantidad = qty; out.push(['input', `Cantidad ${idx+1}: ${qty}`]); push(4, `Leemos la cantidad ${qty}.`, code);
    const exists = Object.prototype.hasOwnProperty.call(state.stock, code);
    state.inStock = exists ? 'Sí' : 'No';
    push(5, `Preguntamos si ${code} ya existe como clave.`, code, {condition:`${code} in stock_prod → ${exists}`});
    if (exists) {
      const before=state.stock[code];
      state.stock[code] += qty;
      push(6, `Existe: ${before} + ${qty} = ${state.stock[code]}. Actualizamos esa misma clave.`, code);
    } else {
      push(7, `${code} no existe: entramos al else.`, code);
      state.stock[code] = qty;
      push(8, `Creamos la nueva clave ${code} con stock inicial ${qty}.`, code);
    }
  });
  out.push(['output', "{'PROD01': 119, 'PROD02': 210, 'PROD03': 195, 'PROD04': 90}"]);
  push(9, 'Mostramos el diccionario actualizado después de las 5 recepciones.', null);
  return trace;
}

const whileSalesCode = [
  `<span class="var">dict_precios</span> = {<span class="str">"L"</span>: <span class="num">70</span>, <span class="str">"J"</span>: <span class="num">30</span>, <span class="str">"V"</span>: <span class="num">80</span>}`,
  `<span class="var">dict_ventas</span> = {}`,
  `<span class="var">cnt_ventas</span> = <span class="num">1</span>`,
  `<span class="kw">while</span> <span class="kw">True</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">nombre</span> = <span class="kw">input</span>(<span class="str">"Nombre: "</span>)`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">tipo_producto</span> = <span class="kw">input</span>(<span class="str">"Tipo (L/J/V): "</span>).upper()`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">while</span> <span class="var">tipo_producto</span> <span class="kw">not in</span> <span class="var">dict_precios</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">print</span>(<span class="str">"ERROR"</span>)`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">tipo_producto</span> = <span class="kw">input</span>(<span class="str">"Tipo (L/J/V): "</span>).upper()`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">cantidad</span> = <span class="kw">int</span>(<span class="kw">input</span>(<span class="str">"Cantidad: "</span>))`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">while</span> <span class="var">cantidad</span> &lt;= <span class="num">0</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">print</span>(<span class="str">"ERROR"</span>)`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">cantidad</span> = <span class="kw">int</span>(<span class="kw">input</span>(<span class="str">"Cantidad: "</span>))`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">monto_antes_dsc</span> = <span class="var">cantidad</span> * <span class="var">dict_precios</span>[<span class="var">tipo_producto</span>]`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">if</span> <span class="var">tipo_producto</span> == <span class="str">"L"</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">descuento</span> = (<span class="var">cantidad</span> // <span class="num">10</span>) * <span class="num">3</span> * <span class="var">dict_precios</span>[<span class="var">tipo_producto</span>]`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">elif</span> <span class="var">tipo_producto</span> == <span class="str">"J"</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">if</span> <span class="var">cantidad</span> &gt; <span class="num">30</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">descuento</span> = <span class="num">0.20</span> * <span class="var">monto_antes_dsc</span>`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">else</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">descuento</span> = <span class="num">0</span>`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">else</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">descuento</span> = (<span class="var">cantidad</span> // <span class="num">5</span>) * <span class="num">15</span>`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">if</span> <span class="var">cantidad</span> &gt; <span class="num">25</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">descuento</span> += <span class="num">50</span>`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">monto_despues_dsc</span> = <span class="var">monto_antes_dsc</span> - <span class="var">descuento</span>`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">dict_ventas</span>[<span class="var">cnt_ventas</span>] = [<span class="var">nombre</span>, <span class="var">tipo_producto</span>, <span class="var">cantidad</span>, <span class="var">monto_antes_dsc</span>, <span class="var">descuento</span>, <span class="var">monto_despues_dsc</span>]`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">respuesta</span> = <span class="kw">input</span>(<span class="str">"¿Otra venta?"</span>).upper()`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">if</span> <span class="var">respuesta</span> == <span class="str">"SI"</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">cnt_ventas</span> += <span class="num">1</span>`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">else</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">break</span>`,
  `<span class="var">minimo_descuento</span> = <span class="num">10000000</span>`,
  `<span class="var">cnt_ventas_V</span> = <span class="num">0</span>`,
  `<span class="kw">for</span> <span class="var">i</span> <span class="kw">in</span> <span class="var">dict_ventas</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">descuento</span> = <span class="var">dict_ventas</span>[<span class="var">i</span>][<span class="num">4</span>]`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">if</span> <span class="var">descuento</span> &lt; <span class="var">minimo_descuento</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">minimo_descuento</span> = <span class="var">descuento</span>`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">cliente_minimo</span> = <span class="var">dict_ventas</span>[<span class="var">i</span>][<span class="num">0</span>]`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">if</span> <span class="var">dict_ventas</span>[<span class="var">i</span>][<span class="num">1</span>] == <span class="str">"V"</span>:`,
  `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">cnt_ventas_V</span> += <span class="num">1</span>`,
  `<span class="var">porc_ventas_v</span> = <span class="var">cnt_ventas_V</span> / <span class="var">cnt_ventas</span>`,
  `<span class="kw">print</span>(<span class="var">cliente_minimo</span>, <span class="var">minimo_descuento</span>, <span class="var">porc_ventas_v</span>)`
];

function buildWhileSalesTrace() {
  const trace = [];
  const out = [];
  const state = {
    dict_precios: { L: 70, J: 30, V: 80 },
    dict_ventas: {},
    cnt_ventas: 1,
    nombre: '—', tipo_producto: '—', cantidad: '—', monto_antes_dsc: '—', descuento: '—', monto_despues_dsc: '—', respuesta: '—',
    minimo_descuento: '—', cliente_minimo: '—', cnt_ventas_V: '—', porc_ventas_v: '—', activeKey: null
  };
  const push = (line, message, extra = {}) => trace.push(traceClone(state, { line, message, console: [...out], ...extra }));

  push(0, 'Creamos el diccionario de precios por tipo de producto.');
  push(1, 'Creamos dict_ventas vacío: aquí iremos guardando cada venta completa.');
  push(2, 'Inicializamos cnt_ventas = 1. Este número también será la clave de cada venta.');
  push(3, 'Entramos al while True. El ciclo continuará hasta ejecutar break.');

  // Venta 1: Ana. Forzamos dos errores para visualizar los while de validación.
  state.nombre = 'Ana'; out.push(['input', 'Nombre: Ana']); push(4, 'Leemos el nombre de la primera cliente.');
  state.tipo_producto = 'X'; out.push(['input', 'Tipo: X']); push(5, 'El primer tipo ingresado es X.');
  push(6, 'Evaluamos la validación: X no pertenece a dict_precios, por eso el while interno se ejecuta.', { condition: 'X not in dict_precios → True' });
  out.push(['output', 'ERROR: tipo incorrecto']); push(7, 'Mostramos el mensaje de error.');
  state.tipo_producto = 'L'; out.push(['input', 'Tipo: L']); push(8, 'Se vuelve a pedir el tipo y ahora se ingresa L.');
  push(6, 'Volvemos a evaluar: L sí existe como clave del diccionario; el while de validación termina.', { condition: 'L not in dict_precios → False' });
  state.cantidad = 0; out.push(['input', 'Cantidad: 0']); push(9, 'La primera cantidad ingresada es 0.');
  push(10, 'Como cantidad <= 0 es verdadero, entra al segundo while de validación.', { condition: '0 <= 0 → True' });
  out.push(['output', 'ERROR: cantidad debe ser mayor a 0']); push(11, 'Mostramos el error de cantidad.');
  state.cantidad = 20; out.push(['input', 'Cantidad: 20']); push(12, 'Se vuelve a pedir la cantidad y ahora es 20.');
  push(10, 'Ahora 20 <= 0 es falso; termina la validación.', { condition: '20 <= 0 → False' });
  state.monto_antes_dsc = 20 * 70; push(13, 'Calculamos el monto antes del descuento: 20 × 70 = 1400.');
  push(14, 'El tipo es L, así que entra en la primera regla de descuento.', { condition: 'L == L → True' });
  state.descuento = Math.floor(20 / 10) * 3 * 70; push(15, 'Por cada 10 libros, 3 son gratis: 2 grupos × 3 × 70 = 420.');
  state.monto_despues_dsc = 1400 - 420; push(25, 'Monto final: 1400 - 420 = 980.');
  state.dict_ventas[1] = ['Ana', 'L', 20, 1400, 420, 980]; state.activeKey = '1'; push(26, 'Guardamos la venta completa dentro de dict_ventas[1].');
  state.respuesta = 'SI'; out.push(['input', '¿Otra venta?: SI']); push(27, 'La respuesta es SI.');
  push(28, 'Evaluamos SI == SI: verdadero.', { condition: 'SI == SI → True' });
  state.cnt_ventas = 2; push(29, 'Incrementamos cnt_ventas a 2. La siguiente venta usará la clave 2.');
  push(3, 'Regresamos al inicio del while True para registrar otra venta.');

  // Venta 2: Bruno, vestuario.
  state.nombre = 'Bruno'; state.tipo_producto = '—'; state.cantidad = '—'; state.monto_antes_dsc = '—'; state.descuento = '—'; state.monto_despues_dsc = '—'; state.respuesta = '—'; state.activeKey = null;
  out.push(['input', 'Nombre: Bruno']); push(4, 'Leemos el nombre del segundo cliente.');
  state.tipo_producto = 'V'; out.push(['input', 'Tipo: V']); push(5, 'El tipo ingresado es V.');
  push(6, 'V sí existe en dict_precios, así que no entra a la validación.', { condition: 'V not in dict_precios → False' });
  state.cantidad = 30; out.push(['input', 'Cantidad: 30']); push(9, 'Leemos cantidad = 30.');
  push(10, '30 <= 0 es falso, por lo que la cantidad es válida.', { condition: '30 <= 0 → False' });
  state.monto_antes_dsc = 30 * 80; push(13, 'Calculamos monto antes del descuento: 30 × 80 = 2400.');
  push(14, 'V == L es falso, por eso no usa la regla de libros.', { condition: 'V == L → False' });
  push(16, 'V == J también es falso, así que llegamos al else de vestuario.', { condition: 'V == J → False' });
  push(21, 'Entramos al else correspondiente a V.');
  state.descuento = Math.floor(30 / 5) * 15; push(22, 'Descuento por grupos de 5: 6 × 15 = 90.');
  push(23, 'Además, 30 > 25 es verdadero.', { condition: '30 > 25 → True' });
  state.descuento += 50; push(24, 'Sumamos S/ 50 adicionales: descuento total = 140.');
  state.monto_despues_dsc = 2400 - 140; push(25, 'Monto final: 2400 - 140 = 2260.');
  state.dict_ventas[2] = ['Bruno', 'V', 30, 2400, 140, 2260]; state.activeKey = '2'; push(26, 'Guardamos la segunda venta dentro de dict_ventas[2].');
  state.respuesta = 'NO'; out.push(['input', '¿Otra venta?: NO']); push(27, 'La respuesta es NO.');
  push(28, 'NO == SI es falso, por eso entra al else.', { condition: 'NO == SI → False' });
  push(30, 'Entramos al else de la decisión final.');
  push(31, 'Ejecutamos break: se interrumpe inmediatamente el while principal y el flujo salta a la primera línea posterior al ciclo. No termina el programa.');

  // Resumen posterior al while.
  state.minimo_descuento = 10000000; push(32, 'Inicializamos minimo_descuento con un valor muy grande.');
  state.cnt_ventas_V = 0; push(33, 'Inicializamos el contador de ventas tipo V en 0.');

  // Venta 1 en el for.
  state.activeKey = '1'; push(34, 'El for toma la venta 1.');
  state.descuento = 420; push(35, 'dict_ventas[1][4] corresponde al descuento: 420.');
  push(36, '420 < 10000000 es verdadero: tenemos un nuevo mínimo.', { condition: '420 < 10000000 → True' });
  state.minimo_descuento = 420; push(37, 'Actualizamos minimo_descuento = 420.');
  state.cliente_minimo = 'Ana'; push(38, 'Guardamos cliente_minimo = Ana.');
  push(39, 'La venta 1 es tipo L, por lo que no incrementa cnt_ventas_V.', { condition: 'L == V → False' });

  // Venta 2 en el for.
  state.activeKey = '2'; push(34, 'El for toma la venta 2.');
  state.descuento = 140; push(35, 'dict_ventas[2][4] corresponde al descuento: 140.');
  push(36, '140 < 420 es verdadero: encontramos un descuento menor.', { condition: '140 < 420 → True' });
  state.minimo_descuento = 140; push(37, 'Actualizamos minimo_descuento = 140.');
  state.cliente_minimo = 'Bruno'; push(38, 'Guardamos cliente_minimo = Bruno.');
  push(39, 'La venta 2 sí es tipo V.', { condition: 'V == V → True' });
  state.cnt_ventas_V = 1; push(40, 'Incrementamos cnt_ventas_V = 1.');
  state.porc_ventas_v = '50%'; push(41, 'Calculamos 1 / 2 = 0.50 → 50% de las ventas fueron V.');
  out.push(['output', 'Cliente mínimo descuento: Bruno']);
  out.push(['output', 'Mínimo descuento: 140']);
  out.push(['output', 'Porcentaje de ventas V: 50%']);
  push(42, 'Mostramos el resultado final del ejercicio.');
  return trace;
}



const trainingAdvancedCode = [
  `<span class="var">lista_calorias</span> = []`,
  `<span class="var">lista_km</span> = []`,
  `<span class="var">lista_velocidad</span> = []`,
  `<span class="var">dict_entrenamiento</span> = {}`,
  `<span class="var">n</span> = <span class="kw">int</span>(<span class="kw">input</span>(<span class="str">"Número de días: "</span>))`,
  `<span class="kw">while</span> <span class="kw">not</span> (<span class="num">1</span> &lt;= <span class="var">n</span> &lt;= <span class="num">30</span>):`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">print</span>(<span class="str">"Error: ingresa entre 1 y 30"</span>)`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">n</span> = <span class="kw">int</span>(<span class="kw">input</span>(<span class="str">"Número de días: "</span>))`,
  `<span class="kw">for</span> <span class="var">i</span> <span class="kw">in</span> <span class="kw">range</span>(<span class="var">n</span>):`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">calorias</span> = <span class="kw">float</span>(<span class="kw">input</span>(<span class="str">"Calorías: "</span>))`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">km</span> = <span class="kw">float</span>(<span class="kw">input</span>(<span class="str">"Kilómetros: "</span>))`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">velocidad</span> = <span class="kw">float</span>(<span class="kw">input</span>(<span class="str">"Velocidad: "</span>))`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">lista_calorias</span>.append(<span class="var">calorias</span>)`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">lista_km</span>.append(<span class="var">km</span>)`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">lista_velocidad</span>.append(<span class="var">velocidad</span>)`,
  `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">dict_entrenamiento</span>[<span class="var">i</span> + <span class="num">1</span>] = [<span class="var">calorias</span>, <span class="var">km</span>, <span class="var">velocidad</span>]`,
  `<span class="var">total_calorias</span> = <span class="kw">sum</span>(<span class="var">lista_calorias</span>)`,
  `<span class="var">promedio_velocidad</span> = <span class="kw">sum</span>(<span class="var">lista_velocidad</span>) / <span class="kw">len</span>(<span class="var">lista_velocidad</span>)`,
  `<span class="var">km_total</span> = <span class="kw">sum</span>(<span class="var">lista_km</span>)`,
  `<span class="kw">print</span>(<span class="var">total_calorias</span>, <span class="var">promedio_velocidad</span>, <span class="var">km_total</span>)`
];

function buildTrainingAdvancedTrace() {
  const days = [
    [110.0, 8.0, 11.3],
    [115.0, 13.6, 10.6],
    [145.0, 12.9, 11.7],
    [87.0, 8.0, 7.8],
    [132.0, 13.0, 12.8]
  ];
  const trace=[]; const out=[];
  const state={n:'—',i:'—',calorias:'—',km:'—',velocidad:'—',lista_calorias:[],lista_km:[],lista_velocidad:[],dict_entrenamiento:{},total_calorias:'—',promedio_velocidad:'—',km_total:'—'};
  const push=(line,message,extra={})=>trace.push(traceClone(state,{line,message,console:[...out],...extra}));
  push(0,'Creamos una lista vacía para calorías.');
  push(1,'Creamos una lista vacía para kilómetros.');
  push(2,'Creamos una lista vacía para velocidades.');
  push(3,'Creamos un diccionario vacío para guardar el resumen de cada día.');
  state.n=0; out.push(['input','Número de días: 0']); push(4,'El usuario ingresa 0 días.');
  push(5,'Validamos el rango: 0 no está entre 1 y 30.',{condition:'not (1 <= 0 <= 30) → True'});
  out.push(['output','Error: ingresa entre 1 y 30']); push(6,'Como la condición del while es verdadera, mostramos el error.');
  state.n=5; out.push(['input','Número de días: 5']); push(7,'Volvemos a pedir el dato y ahora recibimos 5.');
  push(5,'Revisamos otra vez: 5 sí está entre 1 y 30, así que el while de validación termina.',{condition:'not (1 <= 5 <= 30) → False'});
  days.forEach((d,idx)=>{
    state.i=idx;
    push(8,`El for inicia el día ${idx+1} de ${state.n}.`);
    state.calorias=d[0]; out.push(['input',`Día ${idx+1} calorías: ${d[0]}`]); push(9,`Leemos calorías = ${d[0]}.`);
    state.km=d[1]; out.push(['input',`Día ${idx+1} km: ${d[1]}`]); push(10,`Leemos kilómetros = ${d[1]}.`);
    state.velocidad=d[2]; out.push(['input',`Día ${idx+1} velocidad: ${d[2]}`]); push(11,`Leemos velocidad = ${d[2]}.`);
    state.lista_calorias.push(d[0]); push(12,`append agrega ${d[0]} a lista_calorias.`);
    state.lista_km.push(d[1]); push(13,`append agrega ${d[1]} a lista_km.`);
    state.lista_velocidad.push(d[2]); push(14,`append agrega ${d[2]} a lista_velocidad.`);
    state.dict_entrenamiento[idx+1]=[d[0],d[1],d[2]]; push(15,`Guardamos el día ${idx+1} dentro del diccionario usando la clave ${idx+1}.`);
  });
  state.total_calorias=state.lista_calorias.reduce((a,b)=>a+b,0); push(16,`sum(lista_calorias) = ${state.total_calorias}.`);
  state.promedio_velocidad=(state.lista_velocidad.reduce((a,b)=>a+b,0)/state.lista_velocidad.length).toFixed(2); push(17,`Promedio de velocidad = ${state.promedio_velocidad}.`);
  state.km_total=state.lista_km.reduce((a,b)=>a+b,0); push(18,`Kilómetros totales = ${state.km_total}.`);
  out.push(['output',`Total calorías: ${state.total_calorias}`]);
  out.push(['output',`Promedio velocidad: ${state.promedio_velocidad}`]);
  out.push(['output',`Kilómetros recorridos: ${state.km_total}`]);
  push(19,'Mostramos el resumen final calculado a partir de las colecciones.');
  return trace;
}

function renderTrainingCollections(t) {
  const compact=(arr)=>arr.length?`[${arr.join(', ')}]`:'[]';
  return `
    <div class="training-stack">
      <div class="training-line"><strong>lista_calorias</strong><span>${escapeHtml(compact(t.lista_calorias))}</span></div>
      <div class="training-line"><strong>lista_km</strong><span>${escapeHtml(compact(t.lista_km))}</span></div>
      <div class="training-line"><strong>lista_velocidad</strong><span>${escapeHtml(compact(t.lista_velocidad))}</span></div>
      <div class="training-line"><strong>dict_entrenamiento</strong><span>${escapeHtml(JSON.stringify(t.dict_entrenamiento))}</span></div>
    </div>`;
}

const listTrace = buildListExerciseTrace();
const tupleBundle = buildTupleExerciseTrace();
const setBundle = buildSetExerciseTrace();
const dictTrace = buildDictExerciseTrace();
const whileSalesTrace = buildWhileSalesTrace();
const trainingAdvancedTrace = buildTrainingAdvancedTrace();

function conceptSlide(kicker, title, subtitle, bodyHtml) {
  return `
    <div class="slide-kicker">${kicker}</div>
    <h2 class="slide-title">${title}</h2>
    <p class="slide-subtitle">${subtitle}</p>
    ${bodyHtml}`;
}

function renderProblemStatement({source, title, context, asks = [], data = '', note = ''}) {
  return `
    <div class="problem-statement">
      <div class="problem-source">${escapeHtml(source)}</div>
      <h3>${title}</h3>
      <p>${context}</p>
      ${data ? `<div class="problem-data">${data}</div>` : ''}
      ${asks.length ? `<div class="problem-asks"><strong>El programa debe:</strong>${asks.map((x,i)=>`<div class="problem-ask"><span>${i+1}</span><p>${x}</p></div>`).join('')}</div>` : ''}
      ${note ? `<div class="source-note">${note}</div>` : ''}
    </div>`;
}

function renderResolutionPlan(items) {
  return `<div class="resolution-plan">${items.map((x,i)=>`
    <div class="resolution-plan-item">
      <span class="resolution-num">${i+1}</span>
      <div><strong>${x.title}</strong><p>${x.text}</p></div>
    </div>`).join('')}</div>`;
}

function renderProblemAnnotation(part, explanation) {
  return `
    <div class="problem-annotation">
      <div class="problem-annotation-label">PARTE DEL PROBLEMA</div>
      <strong>${part}</strong>
      <span>${explanation}</span>
    </div>`;
}

const slides = [
  {
    title: '¿Qué son las colecciones?',
    short: 'Idea central · en movimiento',
    steps: 7,
    render(step) {
      const states = [
        { values: [], active: [], code: 0, title: 'Primero vemos el problema.', msg: 'Sin colección, cuatro notas suelen terminar en cuatro variables separadas.' },
        { values: [13], active: [0], code: 1, title: 'Creamos una sola variable que puede contener varios datos.', msg: 'La lista empieza con el primer elemento.' },
        { values: [13, 15], active: [1], code: 2, title: 'La colección crece.', msg: 'Ahora el segundo dato vive dentro de la misma estructura.' },
        { values: [13, 15, 18, 20], active: [2,3], code: 3, title: 'Ya tenemos los cuatro datos juntos.', msg: 'En vez de cuatro variables separadas, tenemos una sola colección.' },
        { values: [13, 15, 18, 20], active: [2], code: 4, title: 'Una colección permite acceder a un elemento.', msg: 'notas[2] toma el elemento de índice 2: 18.' },
        { values: [13, 16, 18, 20], active: [1], code: 5, title: 'Si es una lista, también podemos modificarla.', msg: 'notas[1] = 16 cambia solo el segundo elemento.' },
        { values: [13, 16, 18, 20], active: [0,1,2,3], code: 6, title: 'Y luego podemos recorrer todos sus elementos.', msg: 'for nota in notas procesa un valor de la colección en cada vuelta.' }
      ];
      const s = states[step];
      const code = [
        `<span class="var">nota1</span> = <span class="num">13</span> &nbsp; <span class="var">nota2</span> = <span class="num">15</span> &nbsp; <span class="var">nota3</span> = <span class="num">18</span> &nbsp; <span class="var">nota4</span> = <span class="num">20</span>`,
        `<span class="var">notas</span> = [<span class="num">13</span>]`,
        `<span class="var">notas</span> = [<span class="num">13</span>, <span class="num">15</span>]`,
        `<span class="var">notas</span> = [<span class="num">13</span>, <span class="num">15</span>, <span class="num">18</span>, <span class="num">20</span>]`,
        `<span class="var">tercera_nota</span> = <span class="var">notas</span>[<span class="num">2</span>]`,
        `<span class="var">notas</span>[<span class="num">1</span>] = <span class="num">16</span>`,
        `<span class="kw">for</span> <span class="var">nota</span> <span class="kw">in</span> <span class="var">notas</span>: &nbsp; <span class="kw">print</span>(<span class="var">nota</span>)`
      ];
      const noCollection = `
        <div class="collection-diagram">
          <div class="node active">nota1 = 13</div><div class="arrow">·</div><div class="node active">nota2 = 15</div><div class="arrow">·</div><div class="node active">nota3 = 18</div>
        </div>
        <div class="collection-diagram" style="grid-template-columns:1fr 1fr 1fr;margin-top:8px">
          <div class="node">nota4 = 20</div><div class="arrow">→</div><div class="node">4 variables separadas</div>
        </div>`;
      return conceptSlide(
        'Idea central',
        `${s.title}`,
        'En lugar de memorizar una definición, vamos a ver cómo una colección aparece y empieza a ser útil paso a paso.',
        `
          <div class="sequence-row compact-grid">
            <div>
              ${renderCode(code, s.code)}
              <div class="step-callout">${s.msg}</div>
            </div>
            <div>
              ${step === 0 ? noCollection : renderSequence(s.values, { label: 'notas', activeIndices: s.active, negative: step >= 4 })}
              <div class="flow">
                <div class="flow-node ${step >= 1 ? 'active' : ''}">Agrupar</div><div class="flow-arrow">→</div>
                <div class="flow-node ${step >= 4 ? 'active' : ''}">Acceder</div><div class="flow-arrow">→</div>
                <div class="flow-node ${step >= 5 ? 'active' : ''}">Modificar</div><div class="flow-arrow">→</div>
                <div class="flow-node ${step >= 6 ? 'active' : ''}">Recorrer</div>
              </div>
            </div>
          </div>`
      );
    }
  },
  {
    title: 'Cuatro formas de guardar información',
    short: 'Analogías + código mínimo',
    steps: 10,
    render(step) {
      const frames = [
        {
          title: 'Antes de hablar de Python, piensa en <span class="highlight">recipientes</span>.',
          subtitle: 'Todos guardan información, pero cada uno resuelve una necesidad distinta.',
          active: 'none',
          note: 'Primero reconoce la necesidad. Después asociamos esa necesidad con una colección y recién entonces con código.',
          code: '<span class="comment"># Todavía no memorices sintaxis.</span><br><span class="comment"># Pregunta: ¿cómo necesito usar los datos?</span>'
        },
        {
          title: 'LIST es como una <span class="highlight">fila de casillas numeradas</span>.',
          subtitle: 'La posición importa y puedes cambiar lo que hay dentro.',
          active: 'list',
          note: 'Ejemplo: notas de prácticas. Quiero conservar el orden y quizá corregir una nota después.',
          code: '<span class="var">notas</span> = [<span class="num">13</span>, <span class="num">15</span>, <span class="num">18</span>]'
        },
        {
          title: 'LIST: el número entre corchetes indica una <span class="highlight">posición</span>.',
          subtitle: 'Puedes leer o reemplazar un elemento sin reconstruir toda la colección.',
          active: 'list',
          note: 'notas[1] significa “el elemento de índice 1”. Después podemos cambiarlo a 16.',
          code: '<span class="kw">print</span>(<span class="var">notas</span>[<span class="num">1</span>]) <span class="comment"># 15</span><br><span class="var">notas</span>[<span class="num">1</span>] = <span class="num">16</span>'
        },
        {
          title: 'TUPLE se parece a LIST, pero está <span class="highlight">sellada</span>.',
          subtitle: 'La posición importa, pero el contenido se considera fijo.',
          active: 'tuple',
          note: 'Ejemplo: una coordenada (X, Y). La posición 0 es X y la 1 es Y; no queremos cambiarla accidentalmente.',
          code: '<span class="var">sensor</span> = (<span class="num">8.5</span>, <span class="num">6.5</span>)'
        },
        {
          title: 'TUPLE: puedes consultar posiciones, pero <span class="highlight">no modificar</span>.',
          subtitle: 'Eso comunica que el dato debería permanecer estable.',
          active: 'tuple',
          note: 'sensor[0] funciona. sensor[0] = 10 no está permitido.',
          code: '<span class="kw">print</span>(<span class="var">sensor</span>[<span class="num">0</span>]) <span class="comment"># 8.5</span><br><span class="comment"># sensor[0] = 10  → error</span>'
        },
        {
          title: 'SET es como una <span class="highlight">lista de miembros únicos</span>.',
          subtitle: 'Importa quién está, no cuántas veces apareció ni en qué posición.',
          active: 'set',
          note: 'Ejemplo: sensores activos. Si S2 aparece dos veces, en el conjunto solo queda una vez.',
          code: '<span class="var">sensores</span> = {<span class="str">"S1"</span>, <span class="str">"S2"</span>, <span class="str">"S2"</span>}<br><span class="comment"># queda {"S1", "S2"}</span>'
        },
        {
          title: 'SET responde muy bien preguntas de <span class="highlight">pertenencia</span>.',
          subtitle: 'También permite intersección, diferencia y unión entre grupos.',
          active: 'set',
          note: 'La pregunta natural es “¿S2 está activo?” y no “¿qué hay en la posición 1?”.',
          code: '<span class="str">"S2"</span> <span class="kw">in</span> <span class="var">sensores</span> <span class="comment"># True</span>'
        },
        {
          title: 'DICT es como un <span class="highlight">casillero con etiquetas</span>.',
          subtitle: 'Cada etiqueta —la clave— lleva directamente a un valor.',
          active: 'dict',
          note: 'Ejemplo: precio por código. No necesito recordar una posición; uso el código PZ101.',
          code: '<span class="var">precios</span> = {<span class="str">"PZ100"</span>: <span class="num">35.5</span>, <span class="str">"PZ101"</span>: <span class="num">42.0</span>}'
        },
        {
          title: 'DICT: la <span class="highlight">clave</span> reemplaza la idea de posición.',
          subtitle: 'Esto es ideal cuando cada dato tiene un identificador natural.',
          active: 'dict',
          note: 'precios["PZ101"] busca el valor usando el código del producto.',
          code: '<span class="var">precio</span> = <span class="var">precios</span>[<span class="str">"PZ101"</span>] <span class="comment"># 42.0</span>'
        },
        {
          title: 'Las cuatro guardan datos, pero responden <span class="highlight">preguntas distintas</span>.',
          subtitle: 'Posición, cambio, pertenencia o clave: esa es la diferencia que debes reconocer.',
          active: 'all',
          note: 'LIST: posición + cambios. TUPLE: posición + fijo. SET: pertenencia + únicos. DICT: clave → valor.',
          code: '<span class="comment"># list  → ¿qué hay en esta posición?</span><br><span class="comment"># tuple → ¿qué valor fijo hay aquí?</span><br><span class="comment"># set   → ¿está o no está?</span><br><span class="comment"># dict  → ¿qué valor corresponde a esta clave?</span>'
        }
      ];
      const f=frames[step];
      const on=(name)=>f.active==='all'||f.active===name?'active':'';
      return conceptSlide(
        'Primera comparación',
        f.title,
        f.subtitle,
        `
          <div class="analogy-grid">
            <div class="analogy-card ${on('list')}">
              <div class="analogy-icon">1&nbsp;&nbsp;2&nbsp;&nbsp;3</div>
              <h3>LIST</h3>
              <div class="analogy-visual"><span>13</span><span>15</span><span>18</span></div>
              <p><strong>Pregunta natural:</strong> “¿qué hay en esta posición?”</p>
              <small>Ordenada · se puede cambiar · puede repetir</small>
            </div>
            <div class="analogy-card ${on('tuple')}">
              <div class="analogy-icon">🔒</div>
              <h3>TUPLE</h3>
              <div class="analogy-visual"><span>8.5</span><span>6.5</span></div>
              <p><strong>Pregunta natural:</strong> “¿cuál es el valor fijo de esta posición?”</p>
              <small>Ordenada · no se modifica · puede repetir</small>
            </div>
            <div class="analogy-card ${on('set')}">
              <div class="analogy-icon">✓</div>
              <h3>SET</h3>
              <div class="analogy-visual pills"><span>S1</span><span>S2</span><span>S3</span></div>
              <p><strong>Pregunta natural:</strong> “¿está o no está?”</p>
              <small>Sin repetidos · sin posición útil</small>
            </div>
            <div class="analogy-card ${on('dict')}">
              <div class="analogy-icon">🏷</div>
              <h3>DICT</h3>
              <div class="keyvalue-mini"><span>PZ100</span><b>35.5</b><span>PZ101</span><b>42.0</b></div>
              <p><strong>Pregunta natural:</strong> “¿qué valor corresponde a esta clave?”</p>
              <small>Clave → valor · se puede actualizar</small>
            </div>
          </div>
          <div class="analogy-code-panel">
            <div><span class="seq-label">Código mínimo</span><div class="code analogy-code">${f.code}</div></div>
            <div class="analogy-explain"><strong>Traducción humana</strong><span>${f.note}</span></div>
          </div>`
      );
    }
  },
  {
    title: 'Cómo elegir una colección',
    short: 'Árbol de decisión para empezar',
    steps: 6,
    render(step) {
      const prompts = [
        {q:'Primero: ¿quiero guardar varios datos relacionados?', a:'Sí → necesito una colección.', focus:'start'},
        {q:'¿Necesito recordar el orden o la posición?', a:'Sí → piensa primero en LIST o TUPLE.', focus:'order'},
        {q:'Si importa la posición: ¿los datos pueden cambiar?', a:'Sí → LIST. No deberían cambiar → TUPLE.', focus:'mutable'},
        {q:'¿No me importa la posición, sino saber quién pertenece al grupo?', a:'SET. Además elimina repetidos.', focus:'set'},
        {q:'¿Cada dato tiene un código, nombre o etiqueta natural?', a:'DICT. La clave te lleva directamente al valor.', focus:'dict'},
        {q:'Resumen: no elijas por los símbolos. Elige por la pregunta que quieres responder.', a:'Posición + cambio → list · Posición + fijo → tuple · Pertenencia → set · Clave → dict', focus:'all'}
      ];
      const x=prompts[step];
      return conceptSlide(
        'Decisión antes del código',
        'Para elegir una colección, hazte <span class="highlight">una pregunta a la vez</span>.',
        'Este árbol está pensado para alguien que todavía no programa: primero decides qué necesitas representar y después aprendes la sintaxis.',
        `
          <div class="decision-tree-simple">
            <div class="tree-question ${step===0?'active':''}">1. ¿Varios datos relacionados?</div>
            <div class="tree-down">↓</div>
            <div class="tree-question ${step===1?'active':''}">2. ¿Importa el orden / posición?</div>
            <div class="tree-branches">
              <div class="tree-branch">
                <div class="tree-label">SÍ</div>
                <div class="tree-question ${step===2?'active':''}">¿Puede cambiar?</div>
                <div class="tree-results">
                  <div class="tree-result list ${step===2||step===5?'active':''}">LIST<br><small>orden + cambios</small></div>
                  <div class="tree-result tuple ${step===2||step===5?'active':''}">TUPLE<br><small>orden + fijo</small></div>
                </div>
              </div>
              <div class="tree-branch">
                <div class="tree-label">NO / NO ES LO PRINCIPAL</div>
                <div class="tree-results vertical">
                  <div class="tree-result set ${step===3||step===5?'active':''}">SET<br><small>pertenencia + únicos</small></div>
                  <div class="tree-result dict ${step===4||step===5?'active':''}">DICT<br><small>clave → valor</small></div>
                </div>
              </div>
            </div>
          </div>
          <div class="decision-banner"><strong>${x.q}</strong><br>${x.a}</div>
          ${step===5?'<div class="source-note">Ejemplo rápido: notas que corriges → list; coordenada fija → tuple; asistentes únicos → set; precio por código → dict.</div>':''}`
      );
    }
  },
  {
    title: 'LIST vs TUPLE',
    short: 'La diferencia es cambiar o no cambiar',
    steps: 6,
    render(step) {
      const list0=['Ana','Luis','Ana'];
      const tuple0=['Ana','Luis','Ana'];
      const listShown = step >= 3 ? ['Ana','Pedro','Ana'] : list0;
      const messages = [
        'Las dos guardan varios valores en un orden. A simple vista parecen casi iguales.',
        'En ambas, la posición 1 contiene "Luis". Las dos permiten acceso por posición.',
        'En ambas puede repetirse "Ana". Los duplicados no son la diferencia.',
        'Ahora intentamos cambiar el segundo elemento. En la LIST sí funciona.',
        'Intentamos exactamente lo mismo en la TUPLE. No está permitido modificarla.',
        'Pregunta decisiva: ¿los datos deberán cambiar después? Sí → list. No deberían cambiar → tuple.'
      ];
      return conceptSlide(
        'Diferencia 1',
        'LIST y TUPLE se parecen hasta que preguntas: <span class="highlight">¿puedo cambiar el contenido?</span>',
        'Para alguien que recién empieza, esta es la diferencia más importante entre ambas.',
        `
          <div class="beginner-compare two">
            <div class="beginner-panel ${step===3?'good-card':''}">
              <div class="seq-label">LIST · editable</div>
              ${renderSequence(listShown,{label:'alumnos',activeIndices:step===1?[1]:step===3?[1]:[],negative:false})}
              <div class="plain-code">alumnos = ["Ana", "Luis", "Ana"]</div>
              ${step>=3?'<div class="plain-action ok">alumnos[1] = "Pedro" &nbsp; ✓ sí cambia</div>':''}
            </div>
            <div class="beginner-panel ${step===4?'warn-card':''}">
              <div class="seq-label">TUPLE · fija</div>
              ${renderSequence(tuple0,{label:'alumnos_fijos',activeIndices:step===1?[1]:step===4?[1]:[],negative:false,type:'tuple'})}
              <div class="plain-code">alumnos_fijos = ("Ana", "Luis", "Ana")</div>
              ${step>=4?'<div class="plain-action no">alumnos_fijos[1] = "Pedro" &nbsp; ✗ no se permite</div>':''}
            </div>
          </div>
          <div class="step-callout">${messages[step]}</div>
          ${step===5?'<div class="decision-banner"><strong>Regla fácil:</strong> si necesitas corregir, agregar o quitar elementos, piensa primero en <b>list</b>. Si quieres representar un grupo fijo, piensa en <b>tuple</b>.</div>':''}`
      );
    }
  },
  {
    title: 'LIST vs SET',
    short: 'Orden y repetidos',
    steps: 6,
    render(step) {
      const listVals=['S1','S2','S2','S3'];
      const setVals=['S1','S2','S3'];
      const messages=[
        'Partimos del mismo registro de sensores. S2 apareció dos veces.',
        'LIST conserva exactamente lo registrado: orden y repetidos.',
        'SET se queda con sensores únicos: S2 aparece una sola vez.',
        'Si preguntas “¿cuál fue el segundo registro?”, LIST tiene sentido porque existe una posición.',
        'Si preguntas “¿S2 está activo?” o “¿qué sensores coinciden entre dos áreas?”, SET es más natural.',
        'Regla decisiva: frecuencia y posición → list. Pertenencia y elementos únicos → set.'
      ];
      return conceptSlide(
        'Diferencia 2',
        'LIST conserva el registro; SET conserva <span class="highlight">quién pertenece al grupo</span>.',
        'Un set no es una lista “sin ordenar”: representa otro tipo de pregunta.',
        `
          <div class="beginner-compare two">
            <div class="beginner-panel ${step===1||step===3?'accent-card':''}">
              <div class="seq-label">LIST</div>
              ${renderSequence(listVals,{label:'registros',activeIndices:step===3?[1]:[],negative:false})}
              <div class="plain-question">${step>=3?'¿Cuál fue el segundo registro? → S2':'Conserva S1, S2, S2, S3'}</div>
            </div>
            <div class="beginner-panel ${step===2||step===4?'good-card':''}">
              <div class="seq-label">SET</div>
              ${renderSetBox('sensores únicos',setVals,'hitBoth')}
              <div class="plain-question">${step>=4?'¿S2 está activo? → Sí':'S2 no se duplica'}</div>
            </div>
          </div>
          <div class="step-callout">${messages[step]}</div>
          ${step===5?'<div class="decision-banner"><strong>Ojo:</strong> si contar cuántas veces aparece algo importa, no conviertas automáticamente a set porque perderías esa información.</div>':''}`
      );
    }
  },
  {
    title: 'LIST vs DICT',
    short: 'Posición frente a clave',
    steps: 6,
    render(step) {
      const messages=[
        'Supongamos que tienes tres precios. Una lista los puede guardar.',
        'Pero para obtener PZ101 desde la lista necesitas saber que está en la posición 1.',
        'En un diccionario, el código PZ101 se convierte en la clave del precio.',
        'Ahora preguntas directamente por PZ101, sin recordar una posición.',
        'También puedes actualizar PZ101 usando la misma clave.',
        'Regla decisiva: si cada dato tiene un nombre, código o identificador natural, dict suele representar mejor el problema.'
      ];
      const dictEntries=step>=4?[['PZ100',35.5],['PZ101',45.0],['PZ102',38.5]]:[['PZ100',35.5],['PZ101',42.0],['PZ102',38.5]];
      return conceptSlide(
        'Diferencia 3',
        'LIST pregunta por una <span class="highlight">posición</span>; DICT pregunta por una <span class="highlight">clave</span>.',
        'Esta diferencia suele ser más fácil de entender pensando en un catálogo o agenda.',
        `
          <div class="beginner-compare two">
            <div class="beginner-panel ${step===0||step===1?'accent-card':''}">
              <div class="seq-label">LIST · posición</div>
              ${renderSequence([35.5,42.0,38.5],{label:'precios',activeIndices:step===1?[1]:[],negative:false})}
              <div class="plain-question">${step>=1?'Para PZ101 tengo que saber: “está en índice 1”':'Solo veo tres valores en orden.'}</div>
            </div>
            <div class="beginner-panel ${step>=2?'good-card':''}">
              <div class="seq-label">DICT · clave</div>
              ${renderDictEntries(dictEntries,step>=2?'PZ101':null)}
              <div class="plain-question">${step===2?'PZ101 identifica directamente su precio.':step===3?'precios["PZ101"] → 42.0':step>=4?'precios["PZ101"] = 45.0':'Cada código apunta a un valor.'}</div>
            </div>
          </div>
          <div class="step-callout">${messages[step]}</div>
          ${step===5?'<div class="decision-banner"><strong>Ejemplos de claves:</strong> código de producto, DNI, nombre de estación, tipo de motor, ID de cliente.</div>':''}`
      );
    }
  },
  {
    title: 'Mapa general de colecciones',
    short: 'Resumen después de las diferencias',
    steps: 8,
    render(step) {
      const examples = [
        {
          active: 'list',
          title: 'LIST: una secuencia que puede cambiar',
          question: 'Tengo temperaturas registradas por turno y quiero corregir una lectura.',
          code: `<span class="var">temperaturas</span> = [<span class="num">720</span>, <span class="num">745</span>, <span class="num">710</span>, <span class="num">760</span>]<br><span class="var">temperaturas</span>[<span class="num">2</span>] = <span class="num">715</span>`,
          result: 'Con list puedo acceder por índice, conservar repetidos y modificar elementos.'
        },
        {
          active: 'tuple',
          title: 'TUPLE: una secuencia que quiero mantener fija',
          question: 'Tengo una coordenada de sensor (X, Y) que representa un dato fijo.',
          code: `<span class="var">sensor</span> = (<span class="num">8.5</span>, <span class="num">6.5</span>)<br><span class="var">x</span> = <span class="var">sensor</span>[<span class="num">0</span>]`,
          result: 'Con tuple también accedo por índice, pero no debería modificar su contenido.'
        },
        {
          active: 'set',
          title: 'SET: me importa quién está, no la posición',
          question: 'Quiero saber qué sensores están activos sin repetir códigos.',
          code: `<span class="var">sensores</span> = {<span class="str">"S1"</span>, <span class="str">"S2"</span>, <span class="str">"S2"</span>, <span class="str">"S3"</span>}<br><span class="comment"># queda: {"S1", "S2", "S3"}</span>`,
          result: 'set elimina duplicados y es natural para pertenencia, intersección y diferencia.'
        },
        {
          active: 'dict',
          title: 'DICT: busco un valor usando una clave',
          question: 'Quiero consultar rápidamente el precio asociado a un código de pieza.',
          code: `<span class="var">precios</span> = {<span class="str">"PZ100"</span>: <span class="num">35.5</span>, <span class="str">"PZ101"</span>: <span class="num">42.0</span>}<br><span class="var">precio</span> = <span class="var">precios</span>[<span class="str">"PZ101"</span>]`,
          result: 'dict no se consulta por “posición 1”; se consulta por una clave con significado.'
        },
        {
          active: 'list',
          title: 'LIST vs TUPLE: la diferencia decisiva es la mutabilidad',
          question: 'Ambas son ordenadas y permiten índices. ¿Qué cambia realmente?',
          code: `<span class="var">lista</span> = [<span class="num">10</span>, <span class="num">20</span>, <span class="num">30</span>]<br><span class="var">tupla</span> = (<span class="num">10</span>, <span class="num">20</span>, <span class="num">30</span>)<br><span class="comment"># lista[1] = 99 ✓ &nbsp;&nbsp; tupla[1] = 99 ✗</span>`,
          result: 'Si necesito cambiar el contenido, list. Si quiero expresar que debe permanecer fijo, tuple.'
        },
        {
          active: 'set',
          title: 'LIST vs SET: repetidos y posición cambian el problema',
          question: 'Tengo ["A", "A", "B"]. ¿Importa que A aparezca dos veces?',
          code: `<span class="var">lista</span> = [<span class="str">"A"</span>, <span class="str">"A"</span>, <span class="str">"B"</span>]<br><span class="var">conjunto</span> = {<span class="str">"A"</span>, <span class="str">"A"</span>, <span class="str">"B"</span>} <span class="comment"># {"A", "B"}</span>`,
          result: 'List conserva frecuencia y posición. Set conserva pertenencia y elimina repetidos.'
        },
        {
          active: 'dict',
          title: 'LIST vs DICT: “posición” no es lo mismo que “identidad”',
          question: 'Para buscar el stock de PROD03, ¿quiero recordar su posición o su código?',
          code: `<span class="var">stocks</span> = {<span class="str">"PROD01"</span>: <span class="num">60</span>, <span class="str">"PROD03"</span>: <span class="num">111</span>}<br><span class="var">stock</span> = <span class="var">stocks</span>[<span class="str">"PROD03"</span>]`,
          result: 'Cuando el dato tiene una clave natural —código, nombre, ID— dict suele representar mejor el problema.'
        },
        {
          active: 'all',
          title: 'Resumen: elige por la operación que necesitas',
          question: 'No memorices solo símbolos. Pregunta cómo vas a acceder y qué quieres conservar.',
          code: `<span class="comment"># list  → posición + cambios + repetidos</span><br><span class="comment"># tuple → posición + datos fijos</span><br><span class="comment"># set   → pertenencia + sin repetidos</span><br><span class="comment"># dict  → clave → valor</span>`,
          result: 'La estructura correcta hace que el código exprese mejor la intención del problema.'
        }
      ];
      const e = examples[step];
      const activeClass = (name) => e.active === 'all' || e.active === name ? 'active' : '';
      const finalTable = step === 7 ? `
        <table class="comparison-table mini-compare">
          <thead><tr><th>Criterio</th><th>list</th><th>tuple</th><th>set</th><th>dict</th></tr></thead>
          <tbody>
            <tr><td>Acceso</td><td class="codey">índice</td><td class="codey">índice</td><td class="codey">pertenencia</td><td class="codey">clave</td></tr>
            <tr><td>Mutable</td><td class="good">Sí</td><td class="warn">No</td><td class="good">Sí</td><td class="good">Sí</td></tr>
            <tr><td>Repetidos</td><td class="good">Sí</td><td class="good">Sí</td><td class="warn">No</td><td class="warn">claves no</td></tr>
          </tbody>
        </table>` : '';
      return conceptSlide(
        'Mapa general',
        'La diferencia se entiende mejor con <span class="highlight">problemas concretos</span>.',
        'Cada micro-paso mantiene el mismo mapa, pero cambia el caso para mostrar por qué una colección resulta más natural que otra.',
        `
          <div class="collection-types collection-types-compact">
            <div class="type-card ${activeClass('list')}"><h3>list</h3><p>Ordenada + mutable.</p><div class="type-tags"><span>[]</span><span>índice</span><span>repetidos</span></div></div>
            <div class="type-card ${activeClass('tuple')}"><h3>tuple</h3><p>Ordenada + inmutable.</p><div class="type-tags"><span>()</span><span>índice</span><span>fija</span></div></div>
            <div class="type-card ${activeClass('set')}"><h3>set</h3><p>Sin repetidos.</p><div class="type-tags"><span>{}</span><span>in</span><span>&amp; - ^</span></div></div>
            <div class="type-card ${activeClass('dict')}"><h3>dict</h3><p>Clave → valor.</p><div class="type-tags"><span>{k:v}</span><span>clave</span><span>mutable</span></div></div>
          </div>
          <div class="example-focus">
            <div class="example-question"><span>CASO</span><strong>${e.title}</strong><p>${e.question}</p></div>
            <div class="example-code code">${e.code}</div>
          </div>
          <div class="step-callout"><strong>Por qué importa:</strong> ${e.result}</div>
          ${finalTable}`
      );
    }
  },
  {
    title: '¿Cuál colección elegirías?',
    short: 'Mini-casos de decisión',
    steps: 6,
    render(step) {
      const cases = [
        { problem: 'Registrar las temperaturas de 9 hornos en el orden en que se midieron.', answer: 'list', why: 'Importa el orden, pueden repetirse valores y quizá necesitemos corregir una medición.', code: `temperaturas = [720, 745, 710, ...]` },
        { problem: 'Guardar una coordenada fija (X, Y) de un sensor.', answer: 'tuple', why: 'Son valores relacionados, ordenados y no deberían cambiar accidentalmente.', code: `sensor = (8.5, 6.5)` },
        { problem: 'Saber qué modelos de dron se usaron al menos una vez, sin duplicados.', answer: 'set', why: 'Nos importa pertenencia, no frecuencia ni posición.', code: `drones = {"DR-01", "DR-02", "DR-03"}` },
        { problem: 'Consultar los caballos de fuerza usando el tipo de motor como código.', answer: 'dict', why: 'La pregunta natural es “dame el valor asociado a esta clave”.', code: `motores = {"A": 25, "B": 40}` },
        { problem: 'Guardar cada venta con nombre, tipo, cantidad y total, manteniendo todas las ventas.', answer: 'dict + list', why: 'El diccionario identifica cada venta y una lista puede almacenar los campos de esa venta.', code: `ventas[id] = [nombre, tipo, cantidad, total]` },
        { problem: 'Regla rápida para escoger.', answer: 'pregunta por el acceso', why: 'Posición y cambios → list. Posición fija → tuple. Pertenencia → set. Clave → dict.', code: `¿posición?  ¿clave?  ¿repetidos?  ¿modificar?` }
      ];
      const c = cases[step];
      const options = ['list','tuple','set','dict'];
      return conceptSlide(
        'Elegir la colección',
        'Antes de programar, pregunta: <span class="highlight">¿qué necesito hacer con los datos?</span>',
        'Estos casos conectan directamente con ejercicios del material de clase.',
        `
          <div class="decision-case">
            <div class="decision-prompt"><div class="seq-label">Problema ${step + 1}</div><h3>${c.problem}</h3></div>
            <div class="decision-options">
              ${options.map(o => `<div class="decision-option ${c.answer.includes(o) ? 'chosen' : ''}">${o}</div>`).join('')}
            </div>
            <div class="result-box"><strong>Elección:</strong> ${c.answer}<br><strong>Razón:</strong> ${c.why}</div>
            <div class="code decision-code">${escapeHtml(c.code)}</div>
          </div>`
      );
    }
  },
  {
    title: 'Secuencias, índices y slicing',
    short: 'Acceso por posición',
    steps: 5,
    render(step) {
      const arr = ['P', 'y', 't', 'h', 'o', 'n'];
      const active = [[], [0, 5], [1, 2, 3], [0, 2, 4], []][step];
      const result = [
        'Las secuencias permiten acceder por índice.',
        'Python acepta índices normales y negativos.',
        'mensaje[1:4] devuelve "yth" porque toma inicio inclusivo y fin exclusivo.',
        'mensaje[:5:2] devuelve "Pto" porque avanza de 2 en 2.',
        'Regla clave: inicio incluido, fin excluido y paso opcional.'
      ][step];
      return conceptSlide(
        'Secuencias',
        'Listas, tuplas y strings comparten una idea clave: <span class="highlight">son secuencias</span>.',
        'Eso significa que tienen orden y, por lo tanto, se pueden recorrer o cortar usando índices y slicing.',
        `
          <div class="sequence-row">
            <div>
              ${renderSequence(arr, { label: 'mensaje = "Python"', activeIndices: active, type: 'list' })}
              <div class="result-box"><strong>Micro-idea actual:</strong> ${result}</div>
            </div>
            <div class="rule-list">
              <div class="rule-item ${step === 1 ? 'accent-card' : ''}"><strong>Índice normal</strong><div>0, 1, 2, 3...</div></div>
              <div class="rule-item ${step === 1 ? 'accent-card' : ''}"><strong>Índice negativo</strong><div>-1 es el último, -2 el penúltimo.</div></div>
              <div class="rule-item ${step === 2 ? 'accent-card' : ''}"><strong>Slicing</strong><div>secuencia[inicio:fin:paso]</div></div>
              <div class="rule-item ${step === 4 ? 'accent-card' : ''}"><strong>Regla de oro</strong><div>el índice final no entra en el resultado.</div></div>
            </div>
          </div>`
      );
    }
  },
  {
    title: 'Listas: mutabilidad y crecimiento',
    short: 'append vs extend',
    steps: 5,
    render(step) {
      const base = [13, 15, 18];
      let shown = [...base];
      let message = 'Partimos de una lista sencilla de notas.';
      let activeIndices = [];
      if (step >= 1) {
        shown[1] = 16;
        activeIndices = [1];
        message = 'Como la lista es mutable, podemos cambiar el elemento de índice 1.';
      }
      if (step >= 2) {
        shown = [13, 16, 18, 20];
        activeIndices = [3];
        message = 'append(20) agrega un solo elemento al final.';
      }
      if (step === 3) {
        shown = [13, 16, 18, 20, '[30, 40]'];
        activeIndices = [4];
        message = 'append([30, 40]) agrega la lista completa como un único elemento anidado.';
      }
      if (step === 4) {
        shown = [13, 16, 18, 20, 30, 40];
        activeIndices = [4, 5];
        message = 'extend([30, 40]) agrega cada elemento de la secuencia por separado.';
      }
      return conceptSlide(
        'Listas',
        'La lista es la colección más flexible cuando los datos <span class="highlight">van a cambiar</span>.',
        'Aquí aparece una distinción muy importante que suele confundir: append y extend no hacen lo mismo.',
        `
          <div class="sequence-row compact-grid">
            <div>
              ${renderCode([
                `<span class="var">notas</span> = [<span class="num">13</span>, <span class="num">15</span>, <span class="num">18</span>]`,
                `<span class="var">notas</span>[<span class="num">1</span>] = <span class="num">16</span>`,
                `<span class="var">notas</span>.append(<span class="num">20</span>)`,
                `<span class="var">notas</span>.append([<span class="num">30</span>, <span class="num">40</span>])`,
                `<span class="var">notas</span>.extend([<span class="num">30</span>, <span class="num">40</span>])`
              ], step)}
            </div>
            <div>
              ${renderSequence(shown, { label: 'estado actual de notas', activeIndices, negative: false })}
              <div class="step-callout">${message}</div>
              <div class="source-note">La casuística clave es la última: <strong>append</strong> inserta un elemento; <strong>extend</strong> descompone una secuencia e inserta sus elementos.</div>
            </div>
          </div>`
      );
    }
  },
  {
    title: 'Ejercicio de listas',
    short: 'LISTA · funciones + asignación',
    steps: listTrace.length + 2,
    render(step) {
      if (step === 0) {
        return conceptSlide(
          'PROBLEMA RESUELTO · LISTA + FUNCIONES',
          'Primero leemos el <span class="highlight">problema completo</span>.',
          'Antes de escribir código, separaremos exactamente qué pide el enunciado.',
          renderProblemStatement({
            source: 'Guía 5 · Colecciones · Ejercicio 3',
            title: 'Pesos de bloques prefabricados',
            context: 'Se tiene una lista con los pesos de bloques prefabricados. Un valor debe corregirse antes de realizar cálculos de carga.',
            data: '<code>pesos = [1200, 850, 920, 1100, 980, 1130, 950, 880, 754, 678, 823, 389, 1342, 368, 1678, 453, 569]</code>',
            asks: [
              'Reemplazar el <strong>tercer elemento</strong> por el valor máximo de la lista.',
              'Reemplazar el <strong>sexto elemento</strong> por el valor mínimo de la lista.',
              'Reemplazar el <strong>último elemento</strong> por el promedio de los pesos.',
              'Mostrar la lista con todos los cambios realizados.'
            ],
            note: 'Para trabajar con Python interpretaremos “tercer elemento” como índice 2 y “sexto elemento” como índice 5.'
          })
        );
      }
      if (step === 1) {
        return conceptSlide(
          'PROBLEMA RESUELTO · LISTA + FUNCIONES',
          'Traducimos el enunciado a <span class="highlight">cuatro tareas pequeñas</span>.',
          'Esta planificación permite entender para qué existe cada grupo de líneas antes de ejecutarlo.',
          renderResolutionPlan([
            {title:'1. Obtener los valores que necesitamos', text:'Calcular máximo, mínimo y promedio antes de modificar la lista.'},
            {title:'2. Ubicar las posiciones pedidas', text:'Tercer elemento → índice 2; sexto elemento → índice 5; último elemento → índice -1.'},
            {title:'3. Hacer los reemplazos', text:'Asignar cada resultado a la posición que indica el problema.'},
            {title:'4. Mostrar el resultado', text:'Imprimir la lista final para comprobar los cambios.'}
          ])
        );
      }
      const t = listTrace[step - 2];
      const annotations = {
        0:['Dato inicial del problema','Cargamos exactamente la lista de pesos proporcionada por el enunciado.'],
        1:['“Reemplazar por el máximo”','Primero necesitamos descubrir cuál es el peso máximo para poder usarlo después en la tercera posición.'],
        2:['“Reemplazar por el mínimo”','Calculamos el mínimo que luego colocaremos en el sexto elemento.'],
        3:['“Reemplazar por el promedio”','Calculamos el promedio antes de cambiar la lista, porque el enunciado se refiere a los pesos originales.'],
        4:['“Reemplaza la posición 3 por el máximo”','La tercera posición humana corresponde al índice 2 de Python.'],
        5:['“Reemplaza la posición 6 por el mínimo”','La sexta posición humana corresponde al índice 5 de Python.'],
        6:['“La última posición por el promedio”','El índice -1 permite acceder directamente al último elemento.'],
        7:['“Muestre la lista con los cambios”','Esta salida permite verificar que las tres modificaciones se realizaron.']
      };
      const a=annotations[t.line];
      return conceptSlide(
        'PROBLEMA RESUELTO · LISTA + FUNCIONES',
        'Lista: reemplazar posiciones usando <span class="highlight">máximo, mínimo y promedio</span>.',
        'Ahora ejecutamos la solución línea por línea y conectamos cada instrucción con el enunciado.',
        `
          <div class="logic-board compact-exercise">
            <div>${renderCode(listExerciseCode, t.line, true)}</div>
            <div class="trace-panel">
              ${renderVarGrid([
                { label: 'maximo', value: t.maximo },
                { label: 'minimo', value: t.minimo },
                { label: 'promedio', value: t.promedio }
              ])}
              ${renderSequence(t.pesos, { label: 'pesos', activeIndices: t.activeIndices, negative: true })}
              ${renderConsole(t.console, true)}
            </div>
          </div>
          <div class="step-callout">${t.message}</div>
          ${renderProblemAnnotation(a[0],a[1])}`
      );
    }
  },
  {
    title: 'Tuplas: acceso sin modificación',
    short: 'Inmutabilidad',
    steps: 4,
    render(step) {
      const tuple = ['Lima', 'Perú', 196];
      const messages = [
        'La tupla se parece a la lista en el acceso por índice, pero no en la mutabilidad.',
        'pais[1] funciona: podemos leer elementos por posición.',
        'pais[1] = "Chile" no funciona: una tupla no se modifica después de creada.',
        'Las tuplas son muy útiles para coordenadas, fechas, registros fijos o valores que no deberían alterarse.'
      ];
      return conceptSlide(
        'Tuplas',
        'Una tupla es una secuencia <span class="highlight">ordenada e inmutable</span>.',
        'La idea central no es “usa paréntesis”, sino “estos datos deben mantenerse fijos”.',
        `
          <div class="sequence-row">
            <div>
              ${renderCode([
                `<span class="var">pais</span> = (<span class="str">"Lima"</span>, <span class="str">"Perú"</span>, <span class="num">196</span>)`,
                `<span class="kw">print</span>(<span class="var">pais</span>[<span class="num">1</span>])`,
                `<span class="comment"># Esto produciría error</span>`,
                `<span class="comment"># pais[1] = "Chile"</span>`
              ], Math.min(step, 3))}
            </div>
            <div>
              ${renderSequence(tuple, { label: 'pais', activeIndices: step === 1 ? [1] : [], type: 'tuple' })}
              <div class="grid-2">
                <div class="card ${step === 1 ? 'good-card' : ''}"><h3>Se puede leer</h3><p>Acceder por índice es completamente válido.</p></div>
                <div class="card ${step >= 2 ? 'warn-card' : ''}"><h3>No se puede modificar</h3><p>La estructura está pensada para conservar el valor original.</p></div>
              </div>
              <div class="step-callout">${messages[step]}</div>
            </div>
          </div>`
      );
    }
  },
  {
    title: 'Ejercicio de tuplas',
    short: 'TUPLA · doble índice',
    steps: tupleBundle.trace.length + 2,
    render(step) {
      if (step === 0) {
        return conceptSlide(
          'PROBLEMA RESUELTO · TUPLA + DOBLE ÍNDICE',
          'Primero entendemos <span class="highlight">qué dato debemos encontrar</span>.',
          'El reto no es modificar la tupla: es navegar correctamente dentro de una tupla que contiene otras tuplas.',
          renderProblemStatement({
            source: 'Guía 5 · Colecciones · Ejercicio 9',
            title: 'Coordenadas de sensores de un brazo robótico',
            context: 'Un brazo robótico utiliza sensores con coordenadas fijas X-Y. El usuario debe indicar la posición de un sensor y el programa debe mostrar su coordenada X.',
            data: '<code>coordenadas = ((2.3,5.1), (7.6,8.0), (5.5,9.0), (8.5,6.5), ...)</code>',
            asks: [
              'Solicitar la <strong>posición</strong> del sensor que se quiere consultar.',
              'Obtener la tupla correspondiente a ese sensor.',
              'Mostrar únicamente la <strong>coordenada X</strong> del sensor seleccionado.'
            ]
          })
        );
      }
      if (step === 1) {
        return conceptSlide(
          'PROBLEMA RESUELTO · TUPLA + DOBLE ÍNDICE',
          'La solución requiere <span class="highlight">entrar dos veces</span>.',
          'Primero elegimos el sensor; después elegimos X dentro del par (X, Y).',
          renderResolutionPlan([
            {title:'1. Leer la posición pedida',text:'El usuario piensa en posiciones 1, 2, 3...'},
            {title:'2. Convertir a índice Python',text:'Como Python comienza en 0, posición 4 corresponde al índice 3.'},
            {title:'3. Obtener el sensor',text:'coordenadas[indice] devuelve una tupla como (8.5, 6.5).'},
            {title:'4. Obtener X',text:'sensor[0] toma el primer valor del par, que es la coordenada X.'}
          ])
        );
      }
      const t = tupleBundle.trace[step - 2];
      const annotations={
        0:['Datos fijos del problema','Las coordenadas están en una tupla porque el ejercicio las trata como datos ya definidos.'],
        1:['“Solicite la posición de un elemento”','Guardamos la posición que el usuario quiere consultar.'],
        2:['Adaptar la posición al índice','Restamos 1 para pasar de la numeración humana al índice de Python.'],
        3:['Seleccionar el sensor','Con el índice correcto obtenemos la tupla (X, Y) completa del sensor.'],
        4:['“Muestre la coordenada X”','Dentro del par (X, Y), el índice 0 corresponde a X.'],
        5:['Salida solicitada','Mostramos únicamente el valor X, tal como pide el enunciado.']
      };
      const a=annotations[t.line];
      return conceptSlide(
        'PROBLEMA RESUELTO · TUPLA + DOBLE ÍNDICE',
        'Tupla de tuplas: obtener la <span class="highlight">coordenada X</span> de un sensor.',
        'Cada micro-paso indica qué parte concreta del problema estamos resolviendo.',
        `
          <div class="logic-board compact-exercise">
            <div>${renderCode(tupleExerciseCode, t.line, true)}</div>
            <div class="trace-panel">
              ${renderVarGrid([
                { label: 'posicion', value: t.posicion },
                { label: 'indice', value: t.indice },
                { label: 'sensor', value: t.sensor },
                { label: 'coord_x', value: t.coord_x }
              ])}
              ${renderTupleOfPairs(tupleBundle.coords, t.activeIndex, t.line >= 4)}
              ${renderConsole(t.console)}
            </div>
          </div>
          <div class="step-callout">${t.message}</div>
          ${renderProblemAnnotation(a[0],a[1])}`
      );
    }
  },
  {
    title: 'Conjuntos: operaciones clave',
    short: 'Intersección y diferencia',
    steps: 5,
    render(step) {
      const A = ['S1', 'S2', 'S3'];
      const B = ['S2', 'S3', 'S4'];
      const resultByStep = [
        { title: 'Observación inicial', values: ['S1', 'S2', 'S3', 'S4'], msg: 'Los sets no se usan para acceder por posición. Se usan mucho para pertenencia y comparación entre grupos.' },
        { title: 'A ∩ B', values: ['S2', 'S3'], msg: 'Intersección: elementos que aparecen en ambos conjuntos.' },
        { title: 'A - B', values: ['S1'], msg: 'Diferencia: elementos que están en A pero no en B.' },
        { title: 'B - A', values: ['S4'], msg: 'La diferencia depende del orden: ahora tomamos los que están en B y no en A.' },
        { title: 'A ^ B', values: ['S1', 'S4'], msg: 'Diferencia simétrica: elementos que aparecen en uno u otro, pero no en ambos.' }
      ][step];
      return conceptSlide(
        'Conjuntos',
        'Un set sirve cuando la pregunta principal es: <span class="highlight">“¿qué elementos coinciden, faltan o sobran?”</span>',
        'También elimina repetidos automáticamente, pero en clase suele destacar más por sus operaciones entre conjuntos.',
        `
          <div class="sequence-row">
            <div>${renderSetCompare(A, B, resultByStep.values, resultByStep.title)}</div>
            <div class="rule-list">
              <div class="rule-item ${step === 1 ? 'accent-card' : ''}"><strong>Intersección</strong><div>A &amp; B</div></div>
              <div class="rule-item ${step === 2 ? 'accent-card' : ''}"><strong>Diferencia</strong><div>A - B</div></div>
              <div class="rule-item ${step === 4 ? 'accent-card' : ''}"><strong>Diferencia simétrica</strong><div>A ^ B</div></div>
              <div class="rule-item"><strong>Unión</strong><div>A | B</div></div>
            </div>
          </div>
          <div class="step-callout">${resultByStep.msg}</div>`
      );
    }
  },
  {
    title: 'Ejercicio de conjuntos',
    short: 'SET · intersección',
    steps: setBundle.trace.length + 2,
    render(step) {
      if (step === 0) {
        return conceptSlide(
          'PROBLEMA RESUELTO · SET + INTERSECCIÓN',
          'Antes de usar <code>&amp;</code>, identificamos la palabra clave del problema: <span class="highlight">“ambas áreas”</span>.',
          'Esa frase nos dice que necesitamos los elementos que pertenecen simultáneamente a dos conjuntos.',
          renderProblemStatement({
            source: 'Guía 5 · Colecciones · Ejercicio 18',
            title: 'Sensores activos en dos áreas de producción',
            context: 'Se tienen dos conjuntos de sensores activos. El técnico necesita identificar los sensores que ya están activos en ambas áreas para evitar redundancias.',
            data: '<code>sensores_area1 = {"S1", "S2", "S3"}</code><br><code>sensores_area2 = {"S2", "S3", "S4"}</code>',
            asks: ['Mostrar los sensores que se encuentran activos en <strong>ambas áreas</strong>.']
          })
        );
      }
      if (step === 1) {
        return conceptSlide(
          'PROBLEMA RESUELTO · SET + INTERSECCIÓN',
          'Traducimos “está en A <span class="highlight">y</span> está en B” a una operación de conjuntos.',
          'La intersección ya representa exactamente esa necesidad.',
          renderResolutionPlan([
            {title:'1. Representar cada área',text:'Cada grupo de sensores se guarda como un set.'},
            {title:'2. Buscar coincidencias',text:'La intersección A & B conserva solo elementos presentes en ambos conjuntos.'},
            {title:'3. Mostrar el resultado',text:'El conjunto resultante contiene únicamente los sensores comunes.'}
          ])
        );
      }
      const t = setBundle.trace[step - 2];
      const annotations={
        0:['Primer grupo del problema','Creamos el conjunto que representa los sensores activos del área 1.'],
        1:['Segundo grupo del problema','Creamos el conjunto que representa los sensores activos del área 2.'],
        2:['“Sensores activos en ambas áreas”','La intersección conserva exactamente los sensores que aparecen en los dos grupos.'],
        3:['Salida solicitada','Mostramos el conjunto común para que el técnico pueda identificar las redundancias.']
      };
      const a=annotations[t.line];
      return conceptSlide(
        'PROBLEMA RESUELTO · SET + INTERSECCIÓN',
        'Conjuntos: encontrar los sensores activos en <span class="highlight">ambas áreas</span>.',
        'Ahora seguimos la solución línea por línea.',
        `
          <div class="logic-board compact-exercise">
            <div>${renderCode(setExerciseCode, t.line)}</div>
            <div class="trace-panel">
              ${renderSetCompare(setBundle.a, setBundle.b, t.comunes.length ? t.comunes : ['—'], 'comunes')}
              ${renderConsole(t.console)}
            </div>
          </div>
          <div class="step-callout">${t.message}</div>
          ${renderProblemAnnotation(a[0],a[1])}`
      );
    }
  },
  {
    title: 'Diccionarios: clave → valor',
    short: 'Consulta y actualización',
    steps: 5,
    render(step) {
      const states = [
        { entries: [['A', 25], ['B', 40], ['C', 30]], active: null, msg: 'Un diccionario relaciona una clave con un valor. No se accede por índice, sino por clave.' },
        { entries: [['A', 25], ['B', 40], ['C', 30]], active: 'B', msg: 'motores["B"] permite obtener rápidamente el valor asociado a esa clave.' },
        { entries: [['A', 25], ['B', 40], ['C', 30], ['F', 45]], active: 'F', msg: 'También podemos agregar nuevas claves.' },
        { entries: [['A', 25], ['B', 50], ['C', 30], ['F', 45]], active: 'B', msg: 'Si la clave ya existe, podemos actualizar su valor.' },
        { entries: [['A', 25], ['B', 50], ['F', 45]], active: 'C', msg: 'Y también podemos eliminar entradas cuando ya no se necesitan.' }
      ][step];
      return conceptSlide(
        'Diccionarios',
        'El diccionario es ideal cuando el acceso principal es por <span class="highlight">clave</span>.',
        'Piensa en preguntas como “¿cuánto vale este código?”, “¿qué stock tiene este producto?” o “¿qué temperatura tiene esta estación?”.',
        `
          <div class="sequence-row">
            <div>${renderCode([
              `<span class="var">motores</span> = {<span class="str">"A"</span>: <span class="num">25</span>, <span class="str">"B"</span>: <span class="num">40</span>, <span class="str">"C"</span>: <span class="num">30</span>}`,
              `<span class="kw">print</span>(<span class="var">motores</span>[<span class="str">"B"</span>])`,
              `<span class="var">motores</span>[<span class="str">"F"</span>] = <span class="num">45</span>`,
              `<span class="var">motores</span>[<span class="str">"B"</span>] = <span class="num">50</span>`,
              `<span class="kw">del</span> <span class="var">motores</span>[<span class="str">"C"</span>]`
            ], step)}</div>
            <div>
              ${renderDictEntries(states.entries, states.active)}
              <div class="step-callout">${states.msg}</div>
            </div>
          </div>`
      );
    }
  },
  {
    title: 'Ejercicio con diccionario',
    short: 'DICT + FOR + IF',
    steps: dictTrace.length + 2,
    render(step) {
      if (step === 0) {
        return conceptSlide(
          'PROBLEMA RESUELTO · DICT + FOR + IF',
          'Primero identificamos las <span class="highlight">dos situaciones</span> que el programa debe distinguir.',
          'Este ejercicio trabajado en el notebook de clase simula recepciones de almacén sobre un stock existente.',
          renderProblemStatement({
            source: 'Notebook S09 · Inventarios',
            title: 'Actualizar el stock con nuevas recepciones',
            context: 'Se parte de un diccionario con stock inicial. Se registran cinco recepciones, cada una con código de producto y cantidad recibida.',
            data: '<code>stock_prod = {"PROD01": 60, "PROD02": 95, "PROD03": 111}</code>',
            asks: [
              'Procesar las <strong>5 recepciones</strong> una por una.',
              'Si el código ya existe, <strong>sumar</strong> la cantidad recibida al stock actual.',
              'Si el código no existe, <strong>crear una nueva clave</strong> con esa cantidad.',
              'Mostrar el diccionario final actualizado.'
            ]
          })
        );
      }
      if (step === 1) {
        return conceptSlide(
          'PROBLEMA RESUELTO · DICT + FOR + IF',
          'La estructura del problema casi nos dicta la solución: <span class="highlight">FOR para repetir + IF para decidir</span>.',
          'El diccionario permite encontrar un producto por su código sin depender de una posición.',
          renderResolutionPlan([
            {title:'1. Guardar el stock inicial',text:'El código del producto funciona como clave y la cantidad como valor.'},
            {title:'2. Repetir cinco recepciones',text:'El for procesa cada ingreso una sola vez.'},
            {title:'3. Preguntar si la clave existe',text:'if cod_producto in stock_prod separa producto conocido de producto nuevo.'},
            {title:'4. Actualizar o crear',text:'Si existe, sumamos; si no, el else agrega una nueva entrada.'},
            {title:'5. Mostrar el inventario',text:'Al final vemos el stock acumulado después de todas las recepciones.'}
          ])
        );
      }
      const t = dictTrace[step - 2];
      let a;
      if(t.line===0) a=['Stock inicial','Representamos el inventario existente como pares código → cantidad.'];
      else if(t.line===1) a=['“Cinco recepciones”','Definimos cuántas veces debe repetirse el registro.'];
      else if(t.line===2) a=['Procesar cada recepción','El for inicia una nueva vuelta para el siguiente ingreso.'];
      else if(t.line===3 || t.line===4) a=['Datos de cada recepción','Leemos el código y la cantidad que llegan al almacén.'];
      else if(t.line===5) a=['Distinguir producto existente o nuevo','El if pregunta si el código ya está entre las claves del diccionario.'];
      else if(t.line===6) a=['“Si ya existe, sumar”','Actualizamos el valor de la misma clave acumulando la cantidad recibida.'];
      else if(t.line===7 || t.line===8) a=['“Si no existe, agregar”','El else crea una nueva clave para el producto que antes no estaba registrado.'];
      else a=['Mostrar el stock final','Después de procesar las cinco recepciones imprimimos el diccionario actualizado.'];
      return conceptSlide(
        'PROBLEMA RESUELTO · DICT + FOR + IF',
        'Actualizar un stock usando <span class="highlight">for + if + dict</span>.',
        'Cada anotación indica exactamente qué requisito del problema está resolviendo la línea activa.',
        `
          <div class="logic-board compact-exercise">
            <div>${renderCode(dictExerciseCode, t.line, true)}</div>
            <div class="trace-panel">
              ${renderVarGrid([
                { label: 'recepción', value: t.i==='—'?'—':`${Number(t.i)+1}/${t.n}` },
                { label: 'cod_producto', value: t.cod_producto },
                { label: 'cantidad', value: t.cantidad },
                { label: '¿existe?', value: t.inStock }
              ])}
              ${t.condition?`<div class="condition-box"><div class="condition-expression">${escapeHtml(t.condition)}</div></div>`:''}
              ${renderDictEntries(Object.entries(t.stock), t.activeKey)}
              ${renderConsole(t.console, true)}
            </div>
          </div>
          <div class="step-callout">${t.message}</div>
          ${renderProblemAnnotation(a[0],a[1])}`
      );
    }
  },
  {
    title: 'Problema avanzado: entrenamiento',
    short: 'Listas + dict + while + for',
    steps: trainingAdvancedTrace.length + 2,
    render(step) {
      if(step===0){
        return conceptSlide(
          'PROBLEMA AVANZADO · LISTAS + DICT + WHILE + FOR',
          'Primero vemos el problema completo: aquí se combinan <span class="highlight">validación, repetición y colecciones</span>.',
          'El objetivo no es solo guardar datos: también debemos validarlos y producir estadísticas al final.',
          renderProblemStatement({
            source:'Guía 4 · Estructura FOR · Ejercicio 5',
            title:'Plan de entrenamiento en caminadora',
            context:'Se registran los resultados diarios de un plan de entrenamiento de hasta 30 días.',
            asks:[
              'Solicitar el número de días N y comprobar que esté en el rango permitido.',
              'Para cada día, registrar calorías quemadas, kilómetros recorridos y velocidad promedio.',
              'Al finalizar, calcular el total de calorías, el promedio de velocidad y los kilómetros totales.'
            ],
            note:'La guía formal indica N > 1 y N ≤ 30. El notebook de clase usado como base valida 1 ≤ N ≤ 30. La animación conserva el código del notebook y usa N = 5, por lo que esta diferencia no afecta el ejemplo mostrado.'
          })
        );
      }
      if(step===1){
        return conceptSlide(
          'PROBLEMA AVANZADO · LISTAS + DICT + WHILE + FOR',
          'Dividimos el problema en <span class="highlight">cuatro responsabilidades</span>.',
          'Esto ayuda a entender por qué aparecen juntos while, for, listas y un diccionario.',
          renderResolutionPlan([
            {title:'1. Preparar dónde guardar los datos',text:'Tres listas almacenan cada indicador; el diccionario agrupa los tres valores por día.'},
            {title:'2. Validar N con while',text:'Mientras el número de días sea inválido, se vuelve a pedir.'},
            {title:'3. Registrar N días con for',text:'Cada vuelta solicita los tres indicadores y los agrega a las colecciones.'},
            {title:'4. Calcular el reporte',text:'sum() y len() permiten obtener los tres resultados pedidos.'}
          ])
        );
      }
      const t=trainingAdvancedTrace[step-2];
      let a;
      if(t.line<=3) a=['Preparar el almacenamiento','Creamos las colecciones que conservarán los datos de todos los días.'];
      else if(t.line===4) a=['“Solicitar el número de días N”','Leemos cuántos días tendrá el plan de entrenamiento.'];
      else if(t.line>=5 && t.line<=7) a=['Validar el número de días','El while impide continuar hasta recibir un N dentro del rango que usa el notebook.'];
      else if(t.line===8) a=['“Para cada día”','El for garantiza una vuelta por cada día del entrenamiento.'];
      else if(t.line>=9 && t.line<=11) a=['Registrar los tres indicadores diarios','Leemos calorías, kilómetros y velocidad del día actual.'];
      else if(t.line>=12 && t.line<=15) a=['Conservar los datos de cada día','append alimenta las listas y el diccionario guarda los tres datos bajo la clave del día.'];
      else if(t.line===16) a=['“Total de calorías quemadas”','Sumamos todos los valores almacenados en lista_calorias.'];
      else if(t.line===17) a=['“Promedio de velocidad”','Sumamos las velocidades y dividimos entre la cantidad de días registrados.'];
      else if(t.line===18) a=['“Kilómetros totales recorridos”','Sumamos todos los kilómetros guardados.'];
      else a=['Mostrar el reporte final','Presentamos los tres indicadores solicitados por el problema.'];
      return conceptSlide(
        'PROBLEMA AVANZADO · LISTAS + DICT + WHILE + FOR',
        'Registrar varios días de entrenamiento usando <span class="highlight">colecciones + validación + repetición</span>.',
        'La línea activa se conecta directamente con una parte concreta del enunciado.',
        `
          <div class="logic-board compact-exercise">
            <div>${renderCode(trainingAdvancedCode,t.line,true)}</div>
            <div class="trace-panel">
              ${renderVarGrid([
                {label:'n',value:t.n},
                {label:'día actual',value:t.i==='—'?'—':Number(t.i)+1},
                {label:'calorías',value:t.calorias},
                {label:'km',value:t.km},
                {label:'velocidad',value:t.velocidad}
              ])}
              ${t.condition?`<div class="condition-box"><div class="condition-expression">${escapeHtml(t.condition)}</div></div>`:''}
              ${renderTrainingCollections(t)}
              ${t.total_calorias!=='—'?renderVarGrid([
                {label:'total calorías',value:t.total_calorias},
                {label:'promedio velocidad',value:t.promedio_velocidad},
                {label:'km totales',value:t.km_total}
              ]):''}
              ${renderConsole(t.console,true)}
            </div>
          </div>
          <div class="step-callout">${t.message}</div>
          ${renderProblemAnnotation(a[0],a[1])}`
      );
    }
  },
  {
    title: 'Colecciones + WHILE',
    short: 'Cómo se conectan los temas',
    steps: 6,
    render(step) {
      const points = [
        { title: 'Sí: en los materiales hay un ejercicio que usa WHILE.', msg: 'El notebook S10 registra ventas repetidamente dentro de while True y guarda cada venta en un diccionario.' },
        { title: 'El WHILE controla cuánto tiempo seguimos registrando.', msg: 'No sabemos de antemano cuántos clientes habrá. Por eso no conviene un for con una cantidad fija.' },
        { title: 'Los WHILE internos validan datos.', msg: 'Un while valida el tipo L/J/V y otro obliga a que la cantidad sea mayor a cero.' },
        { title: 'El diccionario conserva cada venta.', msg: 'dict_ventas[cnt_ventas] guarda una lista con nombre, tipo, cantidad, subtotal, descuento y total final.' },
        { title: '¿Y cómo termina while True?', msg: 'Como True nunca se vuelve False, necesitamos una salida explícita. En este ejercicio esa salida es break.' },
        { title: 'Después del BREAK, el programa continúa fuera del WHILE.', msg: 'break no termina Python ni el programa completo: salta a la primera instrucción que está después del ciclo.' }
      ][step];
      return conceptSlide(
        'Colecciones + WHILE',
        points.title,
        'Este ejercicio une WHILE, validación, IF, listas y diccionarios en un solo programa.',
        `
          <div class="flow">
            <div class="flow-node ${step <= 4 ? 'active' : ''}">while True</div><div class="flow-arrow">→</div>
            <div class="flow-node ${step >= 2 && step <= 4 ? 'active' : ''}">validar</div><div class="flow-arrow">→</div>
            <div class="flow-node ${step >= 3 && step <= 4 ? 'active' : ''}">guardar en dict</div><div class="flow-arrow">→</div>
            <div class="flow-node ${step >= 4 ? 'active' : ''}">¿otra venta?</div><div class="flow-arrow">→</div>
            <div class="flow-node ${step >= 4 ? 'active break-node' : ''}">break</div>
          </div>
          <div class="grid-2">
            <div class="card accent-card"><h3>while True</h3><p>Por sí solo, no tiene una condición que llegue a False. Puede repetirse indefinidamente.</p></div>
            <div class="card ${step >= 4 ? 'good-card' : ''}"><h3>break</h3><p>Interrumpe inmediatamente el ciclo más cercano y continúa con el código que está después de ese ciclo.</p></div>
          </div>
          ${step >= 4 ? `
            <div class="break-mini-flow">
              <div class="break-step">respuesta = "NO"</div><div class="break-arrow">→</div>
              <div class="break-step">if respuesta == "SI" → False</div><div class="break-arrow">→</div>
              <div class="break-step danger-step">break</div><div class="break-jump">SALTA</div>
              <div class="break-step after-step">minimo_descuento = ...</div>
            </div>` : ''}
          <div class="step-callout">${points.msg}</div>
          <div class="source-note"><strong>Muy importante:</strong> el <code>if</code> decide si se ejecuta <code>break</code>, pero <code>break</code> sale del <strong>while</strong>, no del if. Si hubiera ciclos anidados, saldría únicamente del ciclo más cercano que lo contiene.</div>`
      );
    }
  },
  {
    title: 'BREAK: el IF decide cuándo salir',
    short: 'Ejemplo grande: contador 1 → 3 → salida',
    steps: 17,
    render(step) {
      const lines = [
        `<span class="var">contador</span> = <span class="num">1</span>`,
        `<span class="kw">while</span> <span class="var">contador</span> &lt;= <span class="num">5</span>:`,
        `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">print</span>(<span class="str">"Inicio de vuelta"</span>, <span class="var">contador</span>)`,
        `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">if</span> <span class="var">contador</span> == <span class="num">3</span>:`,
        `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">print</span>(<span class="str">"Se cumplió la condición"</span>)`,
        `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">break</span>`,
        `&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">print</span>(<span class="str">"No hubo break"</span>)`,
        `&nbsp;&nbsp;&nbsp;&nbsp;<span class="var">contador</span> += <span class="num">1</span>`,
        `<span class="kw">print</span>(<span class="str">"Fuera del while"</span>)`
      ];
      const frames = [
        {line:0,c:1,test:'—',state:'antes del while',danger:false,done:[],cancel:[],console:[],msg:'Primero inicializamos contador = 1. Todavía no hemos entrado al ciclo.'},
        {line:1,c:1,test:'1 <= 5 → True',state:'entra al while',danger:false,done:[],cancel:[],console:[],msg:'La condición del while es verdadera, así que comienza la primera vuelta.'},
        {line:2,c:1,test:'—',state:'vuelta 1',danger:false,done:[1],cancel:[],console:[['output','Inicio de vuelta 1']],msg:'Ejecutamos la primera línea del cuerpo: mostramos que estamos en la vuelta 1.'},
        {line:3,c:1,test:'1 == 3 → False',state:'IF = False',danger:false,done:[1],cancel:[],console:[['output','Inicio de vuelta 1']],msg:'El if pregunta si contador llegó a 3. Como es falso, NO entramos al bloque que contiene break.'},
        {line:6,c:1,test:'1 == 3 → False',state:'sigue dentro',danger:false,done:[1],cancel:[],console:[['output','Inicio de vuelta 1'],['output','No hubo break']],msg:'Como no entramos al if, llegamos a esta línea: “No hubo break”.'},
        {line:7,c:2,test:'—',state:'fin vuelta 1',danger:false,done:[1],cancel:[],console:[['output','Inicio de vuelta 1'],['output','No hubo break']],msg:'Aumentamos contador de 1 a 2. Ahora el while puede intentar otra vuelta.'},
        {line:1,c:2,test:'2 <= 5 → True',state:'entra otra vez',danger:false,done:[1],cancel:[],console:[['output','Inicio de vuelta 1'],['output','No hubo break']],msg:'La condición del while sigue siendo verdadera para contador = 2.'},
        {line:2,c:2,test:'—',state:'vuelta 2',danger:false,done:[1,2],cancel:[],console:[['output','Inicio de vuelta 1'],['output','No hubo break'],['output','Inicio de vuelta 2']],msg:'Comienza la segunda vuelta.'},
        {line:3,c:2,test:'2 == 3 → False',state:'IF = False',danger:false,done:[1,2],cancel:[],console:[['output','Inicio de vuelta 1'],['output','No hubo break'],['output','Inicio de vuelta 2']],msg:'2 todavía no es 3, así que break sigue sin ejecutarse.'},
        {line:6,c:2,test:'2 == 3 → False',state:'sigue dentro',danger:false,done:[1,2],cancel:[],console:[['output','Inicio de vuelta 1'],['output','No hubo break'],['output','Inicio de vuelta 2'],['output','No hubo break']],msg:'Otra vez llegamos a “No hubo break”.'},
        {line:7,c:3,test:'—',state:'fin vuelta 2',danger:false,done:[1,2],cancel:[],console:[['output','Inicio de vuelta 1'],['output','No hubo break'],['output','Inicio de vuelta 2'],['output','No hubo break']],msg:'Incrementamos contador: ahora vale 3.'},
        {line:1,c:3,test:'3 <= 5 → True',state:'entra vuelta 3',danger:false,done:[1,2],cancel:[],console:[['output','Inicio de vuelta 1'],['output','No hubo break'],['output','Inicio de vuelta 2'],['output','No hubo break']],msg:'El while todavía permite entrar, porque 3 <= 5 es verdadero.'},
        {line:2,c:3,test:'—',state:'vuelta 3',danger:false,done:[1,2,3],cancel:[],console:[['output','Inicio de vuelta 1'],['output','No hubo break'],['output','Inicio de vuelta 2'],['output','No hubo break'],['output','Inicio de vuelta 3']],msg:'Comienza la tercera vuelta. Esta será diferente.'},
        {line:3,c:3,test:'3 == 3 → True',state:'IF = True',danger:false,done:[1,2,3],cancel:[],console:[['output','Inicio de vuelta 1'],['output','No hubo break'],['output','Inicio de vuelta 2'],['output','No hubo break'],['output','Inicio de vuelta 3']],msg:'Ahora la condición del if es verdadera. Por eso el flujo ENTRA al bloque donde está break.'},
        {line:4,c:3,test:'3 == 3 → True',state:'dentro del IF',danger:false,done:[1,2,3],cancel:[],console:[['output','Inicio de vuelta 1'],['output','No hubo break'],['output','Inicio de vuelta 2'],['output','No hubo break'],['output','Inicio de vuelta 3'],['output','Se cumplió la condición']],msg:'Primero se ejecuta el print dentro del if. La siguiente línea es break.'},
        {line:5,c:3,test:'3 == 3 → True',state:'BREAK',danger:true,done:[1,2,3],cancel:[4,5],console:[['output','Inicio de vuelta 1'],['output','No hubo break'],['output','Inicio de vuelta 2'],['output','No hubo break'],['output','Inicio de vuelta 3'],['output','Se cumplió la condición']],msg:'BREAK se ejecuta AHORA. Se abandona el while inmediatamente: no se imprime “No hubo break”, no se incrementa contador y las vueltas 4 y 5 no ocurren.'},
        {line:8,c:3,test:'—',state:'fuera del while',danger:false,done:[1,2,3],cancel:[4,5],console:[['output','Inicio de vuelta 1'],['output','No hubo break'],['output','Inicio de vuelta 2'],['output','No hubo break'],['output','Inicio de vuelta 3'],['output','Se cumplió la condición'],['output','Fuera del while']],msg:'El programa continúa en la primera línea que está fuera del while. break termina el ciclo, no el programa.'}
      ];
      const f=frames[step];
      const chip=(n)=>{
        if(f.cancel.includes(n)) return `<div class="break-iter cancelled">${n}<small>NO ocurre</small></div>`;
        if(n===3 && step===15) return `<div class="break-iter breaking">${n}<small>BREAK</small></div>`;
        if(f.done.includes(n)) return `<div class="break-iter done">${n}<small>procesada</small></div>`;
        return `<div class="break-iter">${n}<small>pendiente</small></div>`;
      };
      return conceptSlide(
        'BREAK · ejemplo explícito',
        'BREAK solo ocurre cuando <span class="highlight">la condición del IF es verdadera</span>.',
        'Seguimos un contador del 1 al 5. El objetivo es salir exactamente cuando contador llegue a 3.',
        `
          <div class="break-big-layout">
            <div>
              ${renderCode(lines, f.line, false, f.danger ? 5 : -1)}
              <div class="break-iterations">${[1,2,3,4,5].map(chip).join('')}</div>
              <div class="break-equation-row">
                <div class="break-eq-label">Condición relevante</div>
                <div class="break-eq ${step>=13&&step<=15?'hot':''}">${escapeHtml(f.test)}</div>
              </div>
            </div>
            <div class="trace-panel">
              ${renderVarGrid([{label:'contador',value:f.c},{label:'condición',value:f.test},{label:'estado',value:f.state}])}
              ${renderConsole(f.console,true)}
              <div class="break-story">
                <div class="break-story-step ${step>=1?'active':''}"><strong>1</strong><span>El while permite una vuelta.</span></div>
                <div class="break-story-step ${step>=3?'active':''}"><strong>2</strong><span>El if pregunta: ¿contador == 3?</span></div>
                <div class="break-story-step ${step===15?'danger':''}"><strong>3</strong><span>Solo si da True se ejecuta break.</span></div>
                <div class="break-story-step ${step===16?'success':''}"><strong>4</strong><span>El programa continúa fuera del while.</span></div>
              </div>
              ${step===15?'<div class="break-live break-live-large"><strong>BREAK EJECUTADO</strong><span>La línea roja indica el momento exacto del corte. Las vueltas 4 y 5 quedan anuladas.</span></div>':''}
              ${step===16?'<div class="break-after-banner"><strong>↓ SALTO REALIZADO</strong><span>El flujo aterriza aquí: <code>print("Fuera del while")</code></span></div>':''}
            </div>
          </div>
          <div class="step-callout">${f.msg}</div>`
      );
    }
  },
  {
    title: 'Ejercicio WHILE: registro de ventas',
    short: 'DICT + WHILE + IF + FOR',
    steps: whileSalesTrace.length + 2,
    render(step) {
      if(step===0){
        return conceptSlide(
          'PROBLEMA AVANZADO · DICT + WHILE + IF + FOR',
          'Primero leemos el <span class="highlight">problema completo</span>: registrar ventas, aplicar descuentos y cerrar con estadísticas.',
          'Aquí casi todos los conceptos de las clases anteriores se conectan en un solo programa.',
          renderProblemStatement({
            source:'Guía 3 · WHILE · Ejercicio integrador de ventas',
            title:'Ventas al por menor',
            context:'El programa registra compras de clientes mientras el usuario desee continuar. Cada compra tiene nombre, tipo de producto y cantidad de unidades.',
            data:'<div class="problem-mini-table"><div><strong>L</strong><span>Libros · S/70</span><small>Por cada 10 unidades, no paga 3.</small></div><div><strong>J</strong><span>Juguetería · S/30</span><small>Más de 30 unidades → 20% de descuento.</small></div><div><strong>V</strong><span>Vestuario · S/80</span><small>S/15 por cada 5; si supera 25, S/50 adicional.</small></div></div>',
            asks:[
              'Validar que el tipo sea L, J o V y que la cantidad sea mayor que cero.',
              'Calcular descuento y monto final para cada cliente.',
              'Preguntar si se desea registrar otro cliente; si responde NO, terminar el registro.',
              'Al final, indicar el cliente con menor descuento y el porcentaje de clientes que compraron V.'
            ]
          })
        );
      }
      if(step===1){
        return conceptSlide(
          'PROBLEMA AVANZADO · DICT + WHILE + IF + FOR',
          'El enunciado se divide en <span class="highlight">seis bloques de responsabilidad</span>.',
          'Cuando veamos el código, cada anotación indicará en cuál de estos bloques estamos.',
          renderResolutionPlan([
            {title:'1. Preparar precios y almacenamiento',text:'Un diccionario permite consultar el precio por tipo y otro conservará todas las ventas.'},
            {title:'2. Repetir clientes',text:'while True permite seguir registrando hasta que el usuario decida terminar.'},
            {title:'3. Validar entradas',text:'while internos obligan a corregir tipo y cantidad antes de calcular.'},
            {title:'4. Calcular la compra',text:'if/elif/else aplica la regla de descuento correspondiente y obtiene el monto final.'},
            {title:'5. Guardar y decidir si continuar',text:'La venta se almacena y break corta el while cuando la respuesta indica terminar.'},
            {title:'6. Generar estadísticas',text:'Un for recorre las ventas guardadas para obtener el menor descuento y el porcentaje V.'}
          ])
        );
      }
      const t = whileSalesTrace[step-2];
      const salesEntries = Object.entries(t.dict_ventas);
      let a;
      if(t.line<=2) a=['Preparar precios y ventas','Creamos las estructuras que permiten consultar precios y conservar cada operación registrada.'];
      else if(t.line===3) a=['“El ingreso debe continuar mientras el usuario así lo desee”','while True inicia el ciclo principal que repetirá el registro de clientes.'];
      else if(t.line===4 || t.line===5) a=['Solicitar datos del cliente','Leemos nombre y tipo de producto para la compra actual.'];
      else if(t.line>=6 && t.line<=8) a=['“Si el tipo no es válido, solicitar nuevamente”','Este while se repite únicamente mientras el tipo no pertenezca al diccionario de precios.'];
      else if(t.line>=9 && t.line<=12) a=['“Cantidad de unidades compradas (>0)”','El segundo while evita procesar una cantidad inválida.'];
      else if(t.line===13) a=['Calcular el importe antes del descuento','Multiplicamos cantidad por el precio unitario obtenido desde dict_precios.'];
      else if(t.line>=14 && t.line<=24) a=['Aplicar las reglas de descuento','La cadena if / elif / else selecciona la regla correspondiente a L, J o V.'];
      else if(t.line===25) a=['“Monto a pagar después del descuento”','Restamos el descuento al subtotal para obtener el monto final del cliente.'];
      else if(t.line===26) a=['Conservar la venta','Guardamos en dict_ventas todos los datos que después necesitaremos para el reporte.'];
      else if(t.line>=27 && t.line<=31) a=['“Preguntar si desea registrar otro cliente”','La respuesta decide si incrementamos el contador o ejecutamos break para salir del while.'];
      else if(t.line===32 || t.line===33) a=['Preparar el reporte estadístico','Inicializamos las variables que usaremos para buscar el menor descuento y contar ventas V.'];
      else if(t.line>=34 && t.line<=40) a=['Analizar todas las ventas registradas','El for recorre dict_ventas: compara descuentos y cuenta las compras de tipo V.'];
      else if(t.line===41) a=['“Porcentaje de clientes que compraron V”','Dividimos la cantidad de ventas V entre el total de clientes registrados.'];
      else a=['Mostrar el reporte final','Presentamos el cliente con menor descuento y el porcentaje de compras V.'];
      return conceptSlide(
        'PROBLEMA AVANZADO · DICT + WHILE + IF + FOR',
        'WHILE + diccionario: registrar ventas hasta que el usuario diga <span class="highlight">NO</span>.',
        'Simularemos dos ventas; la primera incluye errores de entrada para mostrar también las validaciones.',
        `
          <div class="logic-board compact-exercise">
            <div>${renderCode(whileSalesCode, t.line, true, t.line === 31 ? 31 : -1)}</div>
            <div class="trace-panel">
              ${renderVarGrid([
                { label: 'cnt_ventas', value: t.cnt_ventas },
                { label: 'nombre', value: t.nombre },
                { label: 'tipo', value: t.tipo_producto },
                { label: 'cantidad', value: t.cantidad },
                { label: 'subtotal', value: t.monto_antes_dsc },
                { label: 'descuento', value: t.descuento },
                { label: 'final', value: t.monto_despues_dsc },
                { label: 'respuesta', value: t.respuesta }
              ])}
              ${t.condition ? `<div class="condition-box"><div class="condition-expression">${escapeHtml(t.condition)}</div></div>` : ''}
              ${t.line === 31 ? `<div class="break-live"><strong>BREAK EJECUTADO</strong><span>El flujo no vuelve a <code>while True</code>. Salta a la primera instrucción que está después del ciclo.</span></div>` : ''}
              <div class="seq-label">dict_ventas</div>
              ${salesEntries.length ? renderDictEntries(salesEntries, t.activeKey) : '<div class="dict-box">{}</div>'}
              ${renderConsole(t.console, true)}
              ${t.minimo_descuento !== '—' ? renderVarGrid([
                { label: 'mínimo descuento', value: t.minimo_descuento },
                { label: 'cliente mínimo', value: t.cliente_minimo },
                { label: 'ventas V', value: t.cnt_ventas_V },
                { label: '% V', value: t.porc_ventas_v }
              ]) : ''}
            </div>
          </div>
          <div class="step-callout">${t.message}</div>
          ${renderProblemAnnotation(a[0],a[1])}`
      );
    }
  },
  {
    title: 'Cierre y regla de elección',
    short: 'Resumen',
    steps: 4,
    render(step) {
      const summaries = [
        ['list', 'Si la información cambiará y quieres recorrerla por posición, suele ser tu primera opción.'],
        ['tuple', 'Si la información debe mantenerse fija, usa tuple.'],
        ['set', 'Si necesitas comparar grupos, quitar repetidos o trabajar con pertenencia, usa set.'],
        ['dict', 'Si una clave te lleva a un dato, usa dict.']
      ];
      return conceptSlide(
        'Cierre',
        'Elegir bien la colección hace que el código sea <span class="highlight">más natural</span>.',
        'La sintaxis importa, pero la verdadera habilidad es reconocer qué estructura representa mejor el problema.',
        `
          <div class="summary-grid">
            ${summaries.map(([name, desc], i) => `
              <div class="summary-card ${step === i ? 'accent-card' : ''}">
                <h3>${name}</h3>
                <p>${desc}</p>
              </div>`).join('')}
          </div>
          <div class="grid-2">
            <div class="card good-card"><h3>Después de esta PPT</h3><p>Ya deberías poder leer colecciones, acceder a elementos, modificar listas y diccionarios, y reconocer cuándo usar conjuntos o tuplas.</p></div>
            <div class="card accent-card"><h3>Qué sigue al practicar</h3><p>Resolver los demás ejercicios de la guía reutilizando exactamente estos patrones.</p></div>
          </div>
          <div class="step-callout">${[
            'Vuelve a la pregunta “¿quiero modificar la secuencia?” → si sí, piensa en list.',
            'Si no se debe modificar, tuple ayuda a expresar que el dato es fijo.',
            'Si el foco está en coincidencias y diferencias entre grupos, piensa en set.',
            'Si el foco está en buscar por clave, dict es casi siempre la estructura correcta.'
          ][step]}</div>`
      );
    }
  }
];

function buildNav() {
  slideNav.innerHTML = slides.map((s, i) => `
    <button class="nav-item ${i === currentSlide ? 'active' : ''}" onclick="goSlide(${i})">
      <span class="nav-number">${i + 1}</span>
      <span class="nav-copy"><strong>${s.title}</strong><span>${s.short}</span></span>
    </button>`).join('');
}

const exerciseSlideClasses = {
  'Ejercicio de listas': 'exercise-list',
  'Ejercicio de tuplas': 'exercise-tuple',
  'Ejercicio de conjuntos': 'exercise-set',
  'Ejercicio con diccionario': 'exercise-dict',
  'Problema avanzado: entrenamiento': 'exercise-training',
  'Ejercicio WHILE: registro de ventas': 'exercise-sales'
};

function render() {
  const s = slides[currentSlide];
  const maxStep = Math.max(1, s.steps);
  currentStep = Math.max(0, Math.min(currentStep, maxStep - 1));
  slideEl.classList.remove('exercise-list','exercise-tuple','exercise-set','exercise-dict','exercise-training','exercise-sales');
  const exerciseClass = exerciseSlideClasses[s.title];
  if (exerciseClass) slideEl.classList.add(exerciseClass);
  slideEl.innerHTML = `<div class="micro-tag">Slide ${currentSlide + 1} · Micro-paso ${currentStep + 1}/${maxStep}</div>${s.render(currentStep)}`;

  // Al cambiar de micro-paso:
  // 1) la consola muestra por defecto lo último impreso;
  // 2) el código se desplaza hasta la línea que estamos analizando.
  requestAnimationFrame(() => {
    slideEl.querySelectorAll('.console').forEach(consoleEl => {
      consoleEl.scrollTop = consoleEl.scrollHeight;
    });

    slideEl.querySelectorAll('.code').forEach(codeEl => {
      const activeLine = codeEl.querySelector('.code-line.active, .code-line.break-active');
      if (!activeLine) return;

      const codeRect = codeEl.getBoundingClientRect();
      const lineRect = activeLine.getBoundingClientRect();
      const targetTop = codeEl.scrollTop
        + (lineRect.top - codeRect.top)
        - (codeEl.clientHeight - lineRect.height) / 2;

      const maxTop = Math.max(0, codeEl.scrollHeight - codeEl.clientHeight);
      codeEl.scrollTop = Math.max(0, Math.min(targetTop, maxTop));

      // Volvemos al inicio horizontal para que se vea la instrucción desde su comienzo.
      codeEl.scrollLeft = 0;
    });
  });

  progressBar.style.width = `${((currentStep + 1) / maxStep) * 100}%`;
  progressText.textContent = `Slide ${currentSlide + 1} de ${slides.length} · Paso ${currentStep + 1} de ${maxStep}`;
  buildNav();
  btnPrevStep.disabled = currentStep === 0;
  btnNextStep.textContent = currentStep === maxStep - 1 ? 'Slide siguiente →' : 'Siguiente paso →';
  btnPrevSlide.disabled = currentSlide === 0;
  btnNextSlide.disabled = currentSlide === slides.length - 1;
}

function nextStep() {
  const s = slides[currentSlide];
  if (currentStep < s.steps - 1) currentStep++;
  else if (currentSlide < slides.length - 1) { currentSlide++; currentStep = 0; }
  render();
}

function prevStep() {
  if (currentStep > 0) currentStep--;
  else if (currentSlide > 0) { currentSlide--; currentStep = slides[currentSlide].steps - 1; }
  render();
}

function nextSlide() { if (currentSlide < slides.length - 1) { currentSlide++; currentStep = 0; render(); } }
function prevSlide() { if (currentSlide > 0) { currentSlide--; currentStep = 0; render(); } }
function goSlide(i) { currentSlide = i; currentStep = 0; render(); }
function restartSlide() { currentStep = 0; render(); }
function toggleFullscreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); }

window.goSlide = goSlide;

btnNextStep.addEventListener('click', nextStep);
btnPrevStep.addEventListener('click', prevStep);
btnNextSlide.addEventListener('click', nextSlide);
btnPrevSlide.addEventListener('click', prevSlide);
document.getElementById('btnHelp').addEventListener('click', () => helpDialog.showModal());
document.getElementById('btnCloseHelp').addEventListener('click', () => helpDialog.close());
document.getElementById('btnFullscreen').addEventListener('click', toggleFullscreen);

document.addEventListener('keydown', (e) => {
  if (helpDialog.open && e.key !== 'Escape') return;
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextStep(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); prevStep(); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); nextSlide(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); prevSlide(); }
  else if (e.key.toLowerCase() === 'f') toggleFullscreen();
  else if (e.key.toLowerCase() === 'r') restartSlide();
});

render();
