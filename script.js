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
        let nuevaTir = tir - vpn / dVpn;
        if (Math.abs(nuevaTir - tir) < precision) return nuevaTir * 100;
        tir = nuevaTir;
    }
    return 0;
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

        // Cálculos
        const vpnA = calcularVPN(invA, tasaA, flujosA);
        const vpnB = calcularVPN(invB, tasaB, flujosB);
        const n = flujosA.length || 1;

        const caeA = calcularCAE(vpnA, tasaA, n);
        const caeB = calcularCAE(vpnB, tasaB, n);

        // Actualización de Interfaz
        document.getElementById('res_vpn_a').innerText = `$${vpnA.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        document.getElementById('res_vpn_b').innerText = `$${vpnB.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        document.getElementById('res_cae_a').innerText = `$${caeA.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
        document.getElementById('res_cae_b').innerText = `$${caeB.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
        document.getElementById('res_tir_a').innerText = `${calcularTIR(invA, flujosA).toFixed(2)}%`;
        document.getElementById('res_tir_b').innerText = `${calcularTIR(invB, flujosB).toFixed(2)}%`;

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
    // Captura de datos de entrada (Inputs)
    const invA = document.getElementById('inv_a').value || "0";
    const tasaA = document.getElementById('tasa_a').value || "0";
    const flujosA = Array.from(document.querySelectorAll('.f_a')).map(el => el.value || "0").join(", ");

    const invB = document.getElementById('inv_b').value || "0";
    const tasaB = document.getElementById('tasa_b').value || "0";
    const flujosB = Array.from(document.querySelectorAll('.f_b')).map(el => el.value || "0").join(", ");

    const datos = {
        fecha: new Date().toLocaleString('es-SV', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        // Entradas
        invA, tasaA, flujosA,
        invB, tasaB, flujosB,
        // Resultados
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

 * Función auxiliar para forzar la descarga en entornos restringidos

 */

function forzarDescarga(blob, nombreArchivo) {

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.style.display = 'none';

    a.href = url;

    a.download = nombreArchivo;

   

    // Es vital agregar el elemento al DOM para que Nativefier lo reconozca

    document.body.appendChild(a);

    a.click();

   

    // Limpieza

    setTimeout(() => {

        document.body.removeChild(a);

        window.URL.revokeObjectURL(url);

    }, 100);

}



function exportarExcel() {

    const data = [

        ["REPORTE SEAE - SISTEMA DE EVALUACIÓN ECONÓMICA"],

        ["Fecha:", new Date().toLocaleDateString()],

        [],

        ["Métrica", "Alternativa A", "Alternativa B"],

        ["VPN", document.getElementById('res_vpn_a').innerText, document.getElementById('res_vpn_b').innerText],

        ["CAE", document.getElementById('res_cae_a').innerText, document.getElementById('res_cae_b').innerText],

        ["TIR", document.getElementById('res_tir_a').innerText, document.getElementById('res_tir_b').innerText]

    ];

   

    const ws = XLSX.utils.aoa_to_sheet(data);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Resultados");

   

    // Volvemos al método directo de la librería

    XLSX.writeFile(wb, "Reporte_Financiero_SEAE.xlsx");

}



function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 1. OBTENCIÓN DE DATOS Y METADATOS
    const nombreAnalista = localStorage.getItem('usuarioSEAE') || "(Analista independiente)";
    const fechaEmision = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    // Obtenemos los textos de los resultados (con validación de seguridad)
    const getVal = (id) => document.getElementById(id)?.innerText || "$0.00";
    const conclusion = document.getElementById('recomendacion_txt')?.innerText || "Sin conclusión disponible.";

   // --- CONFIGURACIÓN DE ESTILOS DE FUENTE ---



    doc.setFont("helvetica");



    // === ENCABEZADO PRINCIPAL (SEAE) ===



    doc.setFontSize(30);



    doc.setTextColor(28, 32, 39); // Un gris muy oscuro, casi negro



    doc.setFont("helvetica", "bold");



    doc.text("SEAE", 16, 25);



    doc.setFontSize(10);



    doc.setTextColor(110, 110, 110); // Gris para el subtítulo



    doc.setFont("helvetica", "normal");



    doc.text("Sistema de Evaluación de Alternativas Económicas", 16, 33);

    // Línea divisoria horizontal gris claro



    doc.setDrawColor(210, 210, 210);



    doc.line(16, 38, 194, 38);

    // === SECCIÓN DE METADATOS (Fecha y Analista) ===



    doc.setFontSize(10);



    doc.setTextColor(50, 50, 50);



    doc.setFont("helvetica", "bold");



    doc.text("Fecha de emisión:", 16, 50);



    doc.text("Analista:", 16, 56);

    doc.setFont("helvetica", "normal");



    doc.text(fechaEmision, 50, 50);



    doc.text(nombreAnalista, 35, 56);

    // === TABLA DE RESULTADOS ===
    doc.autoTable({
        startY: 75,
        margin: { left: 16, right: 16 },
        head: [['Métrica de Evaluación', 'Alternativa A', 'Alternativa B']],
        body: [
            ['Valor Presente Neto (VPN)', getVal('res_vpn_a'), getVal('res_vpn_b')],
            ['Costo Anual Equivalente (CAE)', getVal('res_cae_a'), getVal('res_cae_b')],
            ['Tasa Interna de Retorno (TIR)', getVal('res_tir_a'), getVal('res_tir_b')]
        ],
        theme: 'grid', // 'grid' se ve más técnico para ingeniería económica
        headStyles: {
            fillColor: [28, 32, 39],
            textColor: [255, 255, 255],
            fontSize: 10,
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [40, 40, 40],
            cellPadding: 4
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
            1: { halign: 'right' },
            2: { halign: 'right' }
        }
    });

    // === SECCIÓN DE CONCLUSIÓN (Manejo de texto largo) ===
    const finalY = doc.lastAutoTable.finalY + 15;
    
    doc.setFontSize(11);
    doc.setTextColor(28, 32, 39);
    doc.setFont("helvetica", "bold");
    doc.text("CONCLUSIÓN DEL ANÁLISIS", 16, finalY);

    // Dibujamos una pequeña línea debajo del título de conclusión
    doc.setDrawColor(200);
    doc.line(16, finalY + 2, 194, finalY + 2);

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.setFont("helvetica", "italic");

    // Dividir el texto de la conclusión para que no se salga del ancho de la página (178mm)
    const conclusionSplit = doc.splitTextToSize(conclusion, 178);
    doc.text(conclusionSplit, 16, finalY + 10);

    // === PIE DE PÁGINA ===
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Documento generado por SEAE - Página ${i} de ${pageCount}`, 16, 285);
    }

    // 4. GUARDAR EL ARCHIVO
    const sanitizedNombre = nombreAnalista.trim().replace(/\s+/g, '_');
    doc.save(`Reporte_Financiero_SEAE_${sanitizedNombre}.pdf`);
}


function exportarTXT() {

    const vpnA = document.getElementById('res_vpn_a').innerText;

    const vpnB = document.getElementById('res_vpn_b').innerText;

    const reco = document.getElementById('recomendacion_txt').innerText;

   

    const content = `REPORTE SEAE\nFECHA: ${new Date().toLocaleDateString()}\n${'-'.repeat(20)}\nALT A VPN: ${vpnA}\nALT B VPN: ${vpnB}\n${'-'.repeat(20)}\nCONCLUSIÓN: ${reco}`;

   

    // Método tradicional para TXT en navegador

    const element = document.createElement('a');

    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));

    element.setAttribute('download', "Reporte_Simulacion.txt");

    element.style.display = 'none';

    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);

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

window.onload = function() {
    limpiarPantalla();
    renderizarHistorialCompleto();
};

function generarInputsFlujo(tipo) {
    const contenedor = document.getElementById(`contenedor_f_${tipo}`);
    const inputAnios = document.getElementById(`num_anios_${tipo}`);
    const alerta = document.getElementById('alerta-limite');
    const sonido = document.getElementById('audio-alert');
    
    // Si el input está vacío, no borramos los cuadros inmediatamente para que no "parpadee"
    if (inputAnios.value === "") {
        return; 
    }

    let cantidad = parseInt(inputAnios.value);

    // Si es un número menor a 1, lo forzamos a 1 para que siempre haya donde escribir
    if (cantidad < 1) {
        cantidad = 1;
        inputAnios.value = 1;
    }

    // Validación de Máximo 30
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

    // Solo regeneramos si la cantidad de cuadros actuales es diferente a la solicitada
    // Esto evita que se borre lo que ya escribiste en los cuadros si solo estás cambiando el número de años
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
// Ejecutar al cargar la página para que no aparezca vacío
window.onload = () => {
    generarInputsFlujo('a');
    generarInputsFlujo('b'); // Si tienes alternativa B
};

function obtenerFlujos(tipo) {
    const inputs = document.querySelectorAll(`.f_${tipo}`);
    // Convertimos la lista de inputs en un Array de números
    return Array.from(inputs).map(input => parseFloat(input.value) || 0);
}

// Ejemplo de uso en tu lógica de cálculo:
const flujosA = obtenerFlujos('a'); 
// flujosA ahora es [45000, 48500, ...] dependiendo de cuántos años puso el usuario.