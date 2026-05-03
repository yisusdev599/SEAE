/**
 * SEAE - SISTEMA DE EVALUACIÓN DE ALTERNATIVAS ECONÓMICAS
 * Motor de Cálculos y Exportación Profesional
 */

// --- 1. FUNCIONES MATEMÁTICAS ---

function calcularVPN(inversion, tasa, flujos) {
    let vpn = -inversion;
    const i = tasa / 100;
    flujos.forEach((f, periodo) => {
        vpn += f / Math.pow(1 + i, periodo + 1);
    });
    return vpn;
}

function calcularCAE(vpn, tasa, n) {
    const i = tasa / 100;
    if (i === 0) return vpn / n;
    const factor = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    return vpn * factor;
}

function calcularTIR(inversion, flujos) {
    let tir = 0.1; 
    const maxIter = 100;
    const precision = 0.00001;
    for (let i = 0; i < maxIter; i++) {
        let vpn = -inversion;
        let dVpn = 0;
        flujos.forEach((f, t) => {
            const p = t + 1;
            vpn += f / Math.pow(1 + tir, p);
            dVpn -= (p * f) / Math.pow(1 + tir, p + 1);
        });
        if (dVpn === 0) return NaN; // Evita división por cero
        let nuevaTir = tir - vpn / dVpn;
        if (Math.abs(nuevaTir - tir) < precision) return nuevaTir * 100;
        tir = nuevaTir;
    }
    // No convergió → retorna NaN en vez de 0 para no dar un resultado falso
    return NaN;
}

// Detecta si los flujos cambian de signo más de una vez (TIR múltiple posible)
function tieneCambiosDeSignoMultiples(flujos) {
    let cambios = 0;
    for (let i = 1; i < flujos.length; i++) {
        if ((flujos[i] >= 0 && flujos[i - 1] < 0) || (flujos[i] < 0 && flujos[i - 1] >= 0)) {
            cambios++;
        }
    }
    return cambios > 1;
}

// --- 2. FUNCIÓN DE CONTROLADOR (EJECUCIÓN) ---

function ejecutarSimulacion() {
    const estadoNodo = document.getElementById('estado_sistema');

    estadoNodo.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">sync</span> PROCESANDO...`;
    estadoNodo.classList.remove('text-green-500', 'text-neutral-500');
    estadoNodo.classList.add('text-blue-500');

    setTimeout(() => {
        // Captura de Datos
        const invA = parseFloat(document.getElementById('inv_a').value) || 0;
        const tasaA = parseFloat(document.getElementById('tasa_a').value) || 0;
        const flujosA = Array.from(document.querySelectorAll('.f_a')).map(el => parseFloat(el.value) || 0);

        const invB = parseFloat(document.getElementById('inv_b').value) || 0;
        const tasaB = parseFloat(document.getElementById('tasa_b').value) || 0;
        const flujosB = Array.from(document.querySelectorAll('.f_b')).map(el => parseFloat(el.value) || 0);

        // --- VALIDACIÓN DE TASAS ---
        if (tasaA < 0 || tasaA > 100) {
            alert("⚠️ La tasa de la Alternativa A debe estar entre 0% y 100%.");
            estadoNodo.innerHTML = 'SISTEMA LISTO';
            estadoNodo.classList.replace('text-blue-500', 'text-neutral-500');
            return;
        }
        if (tasaB < 0 || tasaB > 100) {
            alert("⚠️ La tasa de la Alternativa B debe estar entre 0% y 100%.");
            estadoNodo.innerHTML = 'SISTEMA LISTO';
            estadoNodo.classList.replace('text-blue-500', 'text-neutral-500');
            return;
        }

        // Cálculos
        const vpnA = calcularVPN(invA, tasaA, flujosA);
        const vpnB = calcularVPN(invB, tasaB, flujosB);
        const n = flujosA.length || 1;

        const caeA = calcularCAE(vpnA, tasaA, n);
        const caeB = calcularCAE(vpnB, tasaB, n);

        // --- CÁLCULO DE TIR CON MANEJO DE NaN ---
        const tirA = calcularTIR(invA, flujosA);
        const tirB = calcularTIR(invB, flujosB);

        const formatearTIR = (tir) => isNaN(tir) ? "No calculable" : `${tir.toFixed(2)}%`;

        // Actualización de Interfaz
        document.getElementById('res_vpn_a').innerText = `$${vpnA.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('res_vpn_b').innerText = `$${vpnB.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('res_cae_a').innerText = `$${caeA.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
        document.getElementById('res_cae_b').innerText = `$${caeB.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
        document.getElementById('res_tir_a').innerText = formatearTIR(tirA);
        document.getElementById('res_tir_b').innerText = formatearTIR(tirB);

        // --- ADVERTENCIA DE TIR MÚLTIPLE ---
        const advertenciaTIR = document.getElementById('advertencia_tir');
        if (advertenciaTIR) {
            const hayTirMultiple = tieneCambiosDeSignoMultiples(flujosA) || tieneCambiosDeSignoMultiples(flujosB);
            if (hayTirMultiple) {
                advertenciaTIR.classList.remove('hidden');
            } else {
                advertenciaTIR.classList.add('hidden');
            }
        }

        // Determinación de Mejor Opción
        const mejorCaeElement = document.getElementById('res_mejor_cae');
        if (caeA > caeB) {
            mejorCaeElement.innerText = "Alternativa A";
            mejorCaeElement.className = "text-xl font-bold text-primary-container";
        } else if (caeB > caeA) {
            mejorCaeElement.innerText = "Alternativa B";
            mejorCaeElement.className = "text-xl font-bold text-secondary";
        } else {
            mejorCaeElement.innerText = "Indiferente";
            mejorCaeElement.className = "text-xl font-bold text-white";
        }

        // Barras Visuales
        const barA = document.getElementById('bar_a');
        const barB = document.getElementById('bar_b');
        const maxVpn = Math.max(Math.abs(vpnA), Math.abs(vpnB), 1);
        barA.style.height = vpnA > 0 ? `${(vpnA / maxVpn) * 100}%` : '5%';
        barB.style.height = vpnB > 0 ? `${(vpnB / maxVpn) * 100}%` : '5%';

        // Recomendación
        const recoTxt = document.getElementById('recomendacion_txt');
        if (vpnB > vpnA) {
            recoTxt.innerHTML = `Elegir <span class="text-secondary font-bold text-lg">Alternativa B</span> por mayor VPN.`;
        } else if (vpnA > vpnB) {
            recoTxt.innerHTML = `Elegir <span class="text-primary-container font-bold text-lg">Alternativa A</span> por mayor VPN.`;
        } else {
            recoTxt.innerText = "Ambas alternativas son indiferentes.";
        }

        estadoNodo.innerHTML = `<span class="material-symbols-outlined text-sm">verified</span> CALCULADO`;
        estadoNodo.classList.replace('text-blue-500', 'text-green-500');

        // GUARDADO AUTOMÁTICO EN HISTORIAL
        guardarEnHistorial();

    }, 600); 
}

// --- 3. SISTEMA DE HISTORIAL (FUERA PARA ALCANCE GLOBAL) ---

function guardarEnHistorial() {
    const invA = document.getElementById('inv_a').value || "0";
    const tasaA = document.getElementById('tasa_a').value || "0";
    const flujosA = Array.from(document.querySelectorAll('.f_a')).map(el => el.value || "0").join(", ");

    const invB = document.getElementById('inv_b').value || "0";
    const tasaB = document.getElementById('tasa_b').value || "0";
    const flujosB = Array.from(document.querySelectorAll('.f_b')).map(el => el.value || "0").join(", ");

    const datos = {
        fecha: new Date().toLocaleString('es-SV', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        invA, tasaA, flujosA,
        invB, tasaB, flujosB,
        vpnA: document.getElementById('res_vpn_a').innerText,
        vpnB: document.getElementById('res_vpn_b').innerText,
        caeA: document.getElementById('res_cae_a').innerText,
        caeB: document.getElementById('res_cae_b').innerText,
        tirA: document.getElementById('res_tir_a').innerText,
        tirB: document.getElementById('res_tir_b').innerText,
        mejor: document.getElementById('res_mejor_cae').innerText
    };

    if (datos.vpnA === "$0.00" && datos.vpnB === "$0.00") return;

    let historial = JSON.parse(localStorage.getItem('historial_seae')) || [];
    historial.unshift(datos);
    historial = historial.slice(0, 10); 
    localStorage.setItem('historial_seae', JSON.stringify(historial));
}

function abrirHistorial() {
    renderizarHistorialCompleto();
    document.getElementById('modalHistorial')?.classList.remove('hidden');
}

function cerrarHistorial() {
    document.getElementById('modalHistorial')?.classList.add('hidden');
}

function renderizarHistorialCompleto() {
    const contenedor = document.getElementById('lista-historial-completo');
    if (!contenedor) return;
    const historial = JSON.parse(localStorage.getItem('historial_seae')) || [];
    
    if (historial.length === 0) {
        contenedor.innerHTML = `<div class="py-20 text-center text-neutral-600 text-lg">No hay registros disponibles.</div>`;
        return;
    }

    contenedor.innerHTML = historial.map(item => {
        const esAltA = item.mejor.includes("Alternativa A");
        const badgeStyle = esAltA 
            ? "bg-blue-500/20 text-blue-400 ring-blue-400/40" 
            : "bg-emerald-500/20 text-emerald-400 ring-emerald-400/40";

        return `
        <div class="p-8 mb-8 bg-[#0d1117] border border-neutral-800 rounded-3xl shadow-2xl transition-all hover:border-neutral-700">
            
            <div class="flex justify-between items-center mb-8 border-b border-neutral-800/50 pb-4">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-neutral-500 text-xl">event_note</span>
                    <span class="text-neutral-500 font-bold text-xs uppercase tracking-[0.3em]">${item.fecha}</span>
                </div>
                <span class="text-xs px-6 py-2 rounded-full font-black uppercase tracking-widest ring-2 ${badgeStyle}">
                    GANADOR: ${item.mejor}
                </span>
            </div>

            <div class="grid grid-cols-2 gap-12">
                
                <div class="space-y-6">
                    <div class="px-2">
                        <p class="text-blue-500 font-black text-xs uppercase tracking-widest mb-2">Entradas Alt. A</p>
                        <p class="text-sm text-neutral-400">Inversión: <span class="text-white font-bold">$${item.invA}</span> | Tasa: <span class="text-white font-bold">${item.tasaA}%</span></p>
                        <p class="text-xs text-neutral-500 italic mt-1 opacity-70">Flujos: ${item.flujosA}</p>
                    </div>
                    
                    <div class="${esAltA ? 'bg-blue-500/10 border-blue-500/30' : 'bg-neutral-900/50 border-neutral-800'} p-6 rounded-2xl border space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="text-white font-bold text-sm">VPN:</span>
                            <span class="${esAltA ? 'text-blue-400' : 'text-neutral-300'} font-mono text-2xl font-black">${item.vpnA}</span>
                        </div>
                        <div class="flex justify-between text-base text-neutral-400 border-t border-neutral-800/50 pt-3">
                            <span>CAE:</span>
                            <span class="font-bold text-white">${item.caeA}</span>
                        </div>
                        <div class="flex justify-between text-base text-neutral-400">
                            <span>TIR:</span>
                            <span class="font-bold text-white">${item.tirA}</span>
                        </div>
                    </div>
                </div>

                <div class="space-y-6 border-l border-neutral-800/50 pl-12">
                    <div class="px-2">
                        <p class="text-emerald-500 font-black text-xs uppercase tracking-widest mb-2">Entradas Alt. B</p>
                        <p class="text-sm text-neutral-400">Inversión: <span class="text-white font-bold">$${item.invB}</span> | Tasa: <span class="text-white font-bold">${item.tasaB}%</span></p>
                        <p class="text-xs text-neutral-500 italic mt-1 opacity-70">Flujos: ${item.flujosB}</p>
                    </div>
                    
                    <div class="${!esAltA ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-neutral-900/50 border-neutral-800'} p-6 rounded-2xl border space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="text-white font-bold text-sm">VPN:</span>
                            <span class="${!esAltA ? 'text-emerald-400' : 'text-neutral-300'} font-mono text-2xl font-black">${item.vpnB}</span>
                        </div>
                        <div class="flex justify-between text-base text-neutral-400 border-t border-neutral-800/50 pt-3">
                            <span>CAE:</span>
                            <span class="font-bold text-white">${item.caeB}</span>
                        </div>
                        <div class="flex justify-between text-base text-neutral-400">
                            <span>TIR:</span>
                            <span class="font-bold text-white">${item.tirB}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function borrarTodoElHistorial() {
    if(confirm("¿Estás seguro de que deseas eliminar permanentemente todos los registros del historial?")) {
        localStorage.setItem('historial_seae', JSON.stringify([]));
        renderizarHistorialCompleto();
    }
}

/**
 * Genera una conclusión detallada y profesional basada en los resultados calculados
 */
function generarConclusion() {
    const ganador   = document.getElementById('res_mejor_cae')?.innerText || "N/A";
    const vpnA      = document.getElementById('res_vpn_a')?.innerText || "$0.00";
    const vpnB      = document.getElementById('res_vpn_b')?.innerText || "$0.00";
    const caeA      = document.getElementById('res_cae_a')?.innerText || "$0.00";
    const caeB      = document.getElementById('res_cae_b')?.innerText || "$0.00";
    const tirA      = document.getElementById('res_tir_a')?.innerText || "0.00%";
    const tirB      = document.getElementById('res_tir_b')?.innerText || "0.00%";
    const tasaA     = document.getElementById('tasa_a')?.value || "0";
    const tasaB     = document.getElementById('tasa_b')?.value || "0";

    const altGanadora = ganador.trim() === "Alternativa A" ? "Alternativa A" : ganador.trim() === "Alternativa B" ? "Alternativa B" : null;

    if (!altGanadora) {
        return "Ambas alternativas presentan indicadores equivalentes. Se recomienda evaluar factores cualitativos adicionales como riesgo operativo, liquidez y alineación estratégica antes de tomar una decisión.";
    }

    const vpnGanador  = altGanadora === "Alternativa A" ? vpnA : vpnB;
    const vpnPerdedor = altGanadora === "Alternativa A" ? vpnB : vpnA;
    const caeGanador  = altGanadora === "Alternativa A" ? caeA : caeB;
    const tirGanador  = altGanadora === "Alternativa A" ? tirA : tirB;
    const tasaGanador = altGanadora === "Alternativa A" ? tasaA : tasaB;

    return `Tras el análisis comparativo de ambas alternativas, se recomienda seleccionar la ${altGanadora}. ` +
           `Esta opción presenta el Valor Presente Neto más favorable (${vpnGanador}) frente a ${vpnPerdedor} de la alternativa contraria, ` +
           `un Costo/Beneficio Anual Equivalente (CAE) de ${caeGanador} y una Tasa Interna de Retorno (TIR) de ${tirGanador}, ` +
           `evaluada a una tasa de descuento del ${tasaGanador}%. ` +
           `Desde el punto de vista financiero, la ${altGanadora} representa la decisión de inversión más eficiente según los criterios de VPN y CAE aplicados.`;
}

/**
 * Función auxiliar para forzar la descarga en entornos restringidos
 */
function forzarDescarga(blob, nombreArchivo) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

function exportarExcel() {
    const estiloCabecera = {
        fill: { fgColor: { rgb: "1C2027" } },
        font: { color: { rgb: "FFFFFF" }, bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        border: { 
            top: { style: "thin" }, 
            bottom: { style: "thin" }, 
            left: { style: "thin" }, 
            right: { style: "thin" } 
        }
    };

    const estiloSubtitulo = { font: { bold: true, sz: 12 } };
    const formatoMoneda = '_-$* #,##0.00_-;-$* #,##0.00_-;_-$* "-"??_-;_-@_-';

    const getNum = (id) => {
        const el = document.getElementById(id);
        if (!el) return 0;
        let valor = (el.tagName === 'INPUT') ? el.value : el.innerText;
        return parseFloat(valor.replace(/[^\d.-]/g, '')) || 0;
    };

    const celdaMoneda = (val) => ({ 
        v: val, t: 'n', z: formatoMoneda, 
        s: { alignment: { horizontal: "right" } } 
    });

    const obtenerFlujosExcel = (tipo) => {
        const contenedor = document.getElementById(`contenedor_f_${tipo}`);
        if (!contenedor) return [];
        return Array.from(contenedor.querySelectorAll('input')).map(i => parseFloat(i.value) || 0);
    };

    const vpnA = getNum('res_vpn_a');
    const vpnB = getNum('res_vpn_b');
    const caeA = getNum('res_cae_a');
    const caeB = getNum('res_cae_b');
    const invA = getNum('inv_a'); 
    const invB = getNum('inv_b');
    const flujosA = obtenerFlujosExcel('a');
    const flujosB = obtenerFlujosExcel('b');
    const maxPeriodos = Math.max(flujosA.length, flujosB.length);
    
    const ganador = document.getElementById('res_mejor_cae')?.innerText || "Alternativa A";
    const detalleTexto = generarConclusion();

    const tasaA = document.getElementById('tasa_a')?.value || "0";
    const tasaB = document.getElementById('tasa_b')?.value || "0";

    const data = [
        [{ v: "REPORTE SISTEMA DE EVALUACIÓN ECONÓMICA (SEAE)", s: { font: { bold: true, sz: 14 } } }],
        ["Fecha de emisión:", new Date().toLocaleString()],
        [],
        [
            { v: "INDICADORES CLAVE", s: estiloCabecera }, 
            { v: "ALTERNATIVA A", s: estiloCabecera }, 
            { v: "ALTERNATIVA B", s: estiloCabecera }, 
            { v: "DIFERENCIA", s: estiloCabecera }
        ],
        ["Tasa de Descuento (%)",
            { v: `${tasaA}%`, s: { alignment: { horizontal: "right" } } },
            { v: `${tasaB}%`, s: { alignment: { horizontal: "right" } } },
            ""
        ],
        ["Valor Presente Neto (VPN)", celdaMoneda(vpnA), celdaMoneda(vpnB), celdaMoneda(Math.abs(vpnA - vpnB))],
        ["Costo Anual Equivalente (CAE)", celdaMoneda(caeA), celdaMoneda(caeB), celdaMoneda(Math.abs(caeA - caeB))],
        ["Tasa Interna de Retorno (TIR)", 
            { v: document.getElementById('res_tir_a')?.innerText || "0.00%", s: { alignment: { horizontal: "right" } } },
            { v: document.getElementById('res_tir_b')?.innerText || "0.00%", s: { alignment: { horizontal: "right" } } }, 
            ""
        ],
        [],
        [{ v: "DESGLOSE DE FLUJOS POR PERIODO", s: estiloSubtitulo }],
        ["Inversión Inicial (Año 0)", celdaMoneda(invA), celdaMoneda(invB), ""],
    ];

    for (let i = 0; i < maxPeriodos; i++) {
        data.push([
            `Flujo de Efectivo - Año ${i + 1}`,
            flujosA[i] !== undefined ? celdaMoneda(flujosA[i]) : "",
            flujosB[i] !== undefined ? celdaMoneda(flujosB[i]) : "",
            ""
        ]);
    }

    data.push(
        [],
        [{ v: "VEREDICTO ESTRATÉGICO", s: estiloSubtitulo }],
        ["OPCIÓN PREFERENTE:", { v: ganador.toUpperCase(), s: { font: { bold: true, color: { rgb: "1F4E78" } } } }],
        [],
        [{ v: "CONCLUSIÓN DEL ANÁLISIS", s: { font: { bold: true, sz: 11 } } }]
    );

    // Partir la conclusión en líneas de ~90 caracteres para que se lea bien en Excel
    const palabras = detalleTexto.split(' ');
    let lineaActual = '';
    const lineas = [];
    palabras.forEach(palabra => {
        if ((lineaActual + ' ' + palabra).trim().length > 90) {
            lineas.push(lineaActual.trim());
            lineaActual = palabra;
        } else {
            lineaActual = (lineaActual + ' ' + palabra).trim();
        }
    });
    if (lineaActual) lineas.push(lineaActual.trim());

    lineas.forEach(linea => {
        data.push([{ v: linea, s: { font: { italic: true, color: { rgb: "444444" } } } }]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 95 }, { wch: 22 }, { wch: 22 }, { wch: 22 }]; 

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte SEAE");

    XLSX.writeFile(wb, `Reporte_SEAE_Completo.xlsx`, { cellStyles: true });
}

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const nombreAnalista = localStorage.getItem('usuarioSEAE') || "(Analista independiente)";
    const fechaEmision = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    const getVal = (id) => document.getElementById(id)?.innerText || "$ 0.00";
    const getInp = (id) => document.getElementById(id)?.value || "0";
    const conclusion = generarConclusion();

    const extraerFlujos = (tipo) => {
        const contenedor = document.getElementById(`contenedor_f_${tipo}`);
        if (!contenedor) return [];
        return Array.from(contenedor.querySelectorAll('input')).map(i => parseFloat(i.value) || 0);
    };

    const flujosA = extraerFlujos('a');
    const flujosB = extraerFlujos('b');
    const maxPeriodos = Math.max(flujosA.length, flujosB.length);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.setTextColor(28, 32, 39);
    doc.text("SEAE", 16, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "normal");
    doc.text("Sistema de Evaluación de Alternativas Económicas", 16, 33);
    doc.setDrawColor(210, 210, 210);
    doc.line(16, 38, 194, 38);

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text("Fecha de emisión:", 16, 48);
    doc.text("Analista:", 16, 54);
    doc.setFont("helvetica", "normal");
    doc.text(fechaEmision, 50, 48);
    doc.text(nombreAnalista, 35, 54);

    doc.autoTable({
        startY: 65,
        margin: { left: 16, right: 16 },
        head: [['Métrica de Evaluación', 'Alternativa A', 'Alternativa B']],
        body: [
            ['Tasa de Descuento (%)', `${getInp('tasa_a')}%`, `${getInp('tasa_b')}%`],
            ['Valor Presente Neto (VPN)', getVal('res_vpn_a'), getVal('res_vpn_b')],
            ['Costo Anual Equivalente (CAE)', getVal('res_cae_a'), getVal('res_cae_b')],
            ['Tasa Interna de Retorno (TIR)', getVal('res_tir_a'), getVal('res_tir_b')]
        ],
        theme: 'grid',
        headStyles: { fillColor: [28, 32, 39], halign: 'center' },
        columnStyles: { 
            0: { fontStyle: 'bold', cellWidth: 80 }, 
            1: { halign: 'right' }, 
            2: { halign: 'right' } 
        }
    });

    const yFlujos = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(28, 32, 39);
    doc.text("DESGLOSE DE FLUJOS POR PERIODO", 16, yFlujos);

    const filasFlujos = [
        ['Inversión Inicial (Año 0)', `$ ${parseFloat(getInp('inv_a')).toLocaleString()}`, `$ ${parseFloat(getInp('inv_b')).toLocaleString()}`]
    ];

    for (let i = 0; i < maxPeriodos; i++) {
        filasFlujos.push([
            `Flujo de Efectivo - Año ${i + 1}`,
            flujosA[i] !== undefined ? `$ ${flujosA[i].toLocaleString()}` : "---",
            flujosB[i] !== undefined ? `$ ${flujosB[i].toLocaleString()}` : "---"
        ]);
    }

    doc.autoTable({
        startY: yFlujos + 5,
        margin: { left: 16, right: 16 },
        head: [['Concepto', 'Alternativa A', 'Alternativa B']],
        body: filasFlujos,
        theme: 'striped',
        headStyles: { fillColor: [220, 220, 220], textColor: [50, 50, 50], fontStyle: 'bold' },
        columnStyles: { 
            0: { cellWidth: 80 }, 
            1: { halign: 'right' }, 
            2: { halign: 'right' } 
        }
    });

    const yConclu = doc.lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("CONCLUSIÓN DEL ANÁLISIS", 16, yConclu);
    doc.line(16, yConclu + 2, 194, yConclu + 2);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(80);
    const splitText = doc.splitTextToSize(conclusion, 178);
    doc.text(splitText, 16, yConclu + 10);

    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`SEAE - Documento Técnico - Página ${i} de ${pageCount}`, 16, 285);
    }

    doc.save(`Reporte_SEAE_${new Date().getTime()}.pdf`);
}

function exportarTexto() {
    try {
        const vpnA    = document.getElementById('res_vpn_a')?.innerText || "0.00";
        const vpnB    = document.getElementById('res_vpn_b')?.innerText || "0.00";
        const caeA    = document.getElementById('res_cae_a')?.innerText || "0.00";
        const caeB    = document.getElementById('res_cae_b')?.innerText || "0.00";
        const tirA    = document.getElementById('res_tir_a')?.innerText || "0.00%";
        const tirB    = document.getElementById('res_tir_b')?.innerText || "0.00%";
        const ganador = document.getElementById('res_mejor_cae')?.innerText || "N/A";
        const invA    = document.getElementById('inv_a')?.value || "0";
        const invB    = document.getElementById('inv_b')?.value || "0";
        const tasaA   = document.getElementById('tasa_a')?.value || "0";
        const tasaB   = document.getElementById('tasa_b')?.value || "0";
        const flujosA = Array.from(document.querySelectorAll('.f_a')).map(el => `$${el.value || "0"}`).join(", ");
        const flujosB = Array.from(document.querySelectorAll('.f_b')).map(el => `$${el.value || "0"}`).join(", ");
        const conclusion = generarConclusion();
        const fecha   = new Date().toLocaleString('es-SV');

        const contenido = [
            "=========================================",
            "   REPORTE DE EVALUACIÓN FINANCIERA SEAE  ",
            "=========================================",
            `Fecha de emisión : ${fecha}`,
            `Analista         : ${localStorage.getItem('usuarioSEAE') || "(Analista independiente)"}`,
            "",
            "-----------------------------------------",
            "  PARÁMETROS DE ENTRADA",
            "-----------------------------------------",
            `Alternativa A -> Inversión: $${invA} | Tasa de descuento: ${tasaA}% | Flujos: ${flujosA}`,
            `Alternativa B -> Inversión: $${invB} | Tasa de descuento: ${tasaB}% | Flujos: ${flujosB}`,
            "",
            "-----------------------------------------",
            "  INDICADORES CALCULADOS",
            "-----------------------------------------",
            `Alternativa A -> Tasa: ${tasaA}% | VPN: ${vpnA} | CAE: ${caeA} | TIR: ${tirA}`,
            `Alternativa B -> Tasa: ${tasaB}% | VPN: ${vpnB} | CAE: ${caeB} | TIR: ${tirB}`,
            "",
            "-----------------------------------------",
            "  VEREDICTO",
            "-----------------------------------------",
            `Mejor opción: ${ganador}`,
            "",
            "-----------------------------------------",
            "  CONCLUSIÓN DEL ANÁLISIS",
            "-----------------------------------------",
            conclusion,
            "",
            "========================================="
        ].join("\n");

        const blob = new Blob([contenido], { type: 'text/plain' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Reporte_SEAE_${ganador.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error("Error al exportar TXT:", error);
        alert("Primero debes realizar el cálculo para generar el reporte.");
    }
}

// --- 4. LIMPIEZA Y UTILIDADES ---

function limpiarPantalla() {
    document.querySelectorAll('input').forEach(input => input.value = '');
    const resultados = ['res_vpn_a', 'res_vpn_b', 'res_cae_a', 'res_cae_b', 'res_tir_a', 'res_tir_b'];
    resultados.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = id.includes('tir') ? '0.00%' : '$0.00';
    });
    document.getElementById('bar_a').style.height = '0%';
    document.getElementById('bar_b').style.height = '0%';
    document.getElementById('res_mejor_cae').innerText = 'Indiferente';
    document.getElementById('recomendacion_txt').innerText = 'Esperando nuevos datos...';
    document.getElementById('estado_sistema').innerHTML = 'SISTEMA LISTO';
    document.getElementById('estado_sistema').className = "text-xs font-bold text-neutral-500 flex items-center gap-1";
}

function generarInputsFlujo(tipo) {
    const contenedor = document.getElementById(`contenedor_f_${tipo}`);
    const inputAnios = document.getElementById(`num_anios_${tipo}`);
    const alerta = document.getElementById('alerta-limite');
    const sonido = document.getElementById('audio-alert');
    
    if (inputAnios.value === "") {
        return; 
    }

    let cantidad = parseInt(inputAnios.value);

    if (cantidad < 1) {
        cantidad = 1;
        inputAnios.value = 1;
    }

    if (cantidad > 30) {
        cantidad = 30;
        inputAnios.value = 30;
        
        inputAnios.classList.add('border-red-500', 'ring-2', 'ring-red-500/50');
        if (sonido) {
            sonido.currentTime = 0;
            sonido.play().catch(() => {});
        }
        if (alerta) alerta.classList.remove('hidden');
        
        setTimeout(() => {
            if (alerta) alerta.classList.add('hidden');
            inputAnios.classList.remove('border-red-500', 'ring-2', 'ring-red-500/50');
        }, 2500);
    }

    if (contenedor.children.length !== cantidad) {
        contenedor.innerHTML = '';
        for (let i = 1; i <= cantidad; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            const focusCol = tipo === 'a' ? 'focus:border-primary-container' : 'focus:border-secondary';
            input.className = `f_${tipo} w-full bg-neutral-950 border border-neutral-800 rounded text-[10px] p-2 text-center text-white outline-none transition-all ${focusCol}`;
            input.placeholder = `${i}`;
            contenedor.appendChild(input);
        }
    }
}

// FIX: Función auxiliar global para obtener flujos (sin conflicto de redeclaración)
function obtenerFlujos(tipo) {
    const inputs = document.querySelectorAll(`.f_${tipo}`);
    return Array.from(inputs).map(input => parseFloat(input.value) || 0);
}

// Un único listener de carga que une todo lo necesario al inicio
window.addEventListener('load', function() {
    limpiarPantalla();
    renderizarHistorialCompleto();
    generarInputsFlujo('a');
    generarInputsFlujo('b');
});