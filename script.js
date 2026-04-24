/**
 * SEAE - SISTEMA DE EVALUACIÓN DE ALTERNATIVAS ECONÓMICAS
 * Motor de Cálculos y Exportación
 */

// --- 1. FUNCIONES MATEMÁTICAS ---

// Calcula el Valor Presente Neto (VPN)
function calcularVPN(inversion, tasa, flujos) {
    let vpn = -inversion;
    const i = tasa / 100;
    flujos.forEach((f, periodo) => {
        vpn += f / Math.pow(1 + i, periodo + 1);
    });
    return vpn;
}

// Calcula el Costo Anual Equivalente (CAE)
function calcularCAE(vpn, tasa, n) {
    const i = tasa / 100;
    if (i === 0) return vpn / n;
    const factor = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    return vpn * factor;
}

// Calcula la Tasa Interna de Retorno (TIR) - Método Iterativo
function calcularTIR(inversion, flujos) {
    let tir = 0.1; // Estimación inicial 10%
    const maxIter = 100;
    const precision = 0.00001;

    for (let i = 0; i < maxIter; i++) {
        let vpn = -inversion;
        let dVpn = 0; // Derivada

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

    // 1. Cambiar estado a "PROCESANDO" inmediatamente
    estadoNodo.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">sync</span> PROCESANDO...`;
    estadoNodo.classList.remove('text-green-500', 'text-neutral-500');
    estadoNodo.classList.add('text-blue-500');

    // Usamos el delay para que el ojo humano note el proceso
    setTimeout(() => {
        // 2. Captura de Datos Alternativa A
        const invA = parseFloat(document.getElementById('inv_a').value) || 0;
        const tasaA = parseFloat(document.getElementById('tasa_a').value) || 0;
        const flujosA = Array.from(document.querySelectorAll('.f_a')).map(el => parseFloat(el.value) || 0);

        // 3. Captura de Datos Alternativa B
        const invB = parseFloat(document.getElementById('inv_b').value) || 0;
        const tasaB = parseFloat(document.getElementById('tasa_b').value) || 0;
        const flujosB = Array.from(document.querySelectorAll('.f_b')).map(el => parseFloat(el.value) || 0);

        // 4. Ejecución de Cálculos Financieros
        const vpnA = calcularVPN(invA, tasaA, flujosA);
        const vpnB = calcularVPN(invB, tasaB, flujosB);
        const n = flujosA.length;

        const caeA = calcularCAE(vpnA, tasaA, n);
        const caeB = calcularCAE(vpnB, tasaB, n);

        // 5. Actualización de Textos en Interfaz
        document.getElementById('res_vpn_a').innerText = `$${vpnA.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        document.getElementById('res_vpn_b').innerText = `$${vpnB.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        
        document.getElementById('res_cae_a').innerText = `$${caeA.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
        document.getElementById('res_cae_b').innerText = `$${caeB.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
        
        document.getElementById('res_tir_a').innerText = `${calcularTIR(invA, flujosA).toFixed(2)}%`;
        document.getElementById('res_tir_b').innerText = `${calcularTIR(invB, flujosB).toFixed(2)}%`;

        // 6. DETERMINAR MEJOR OPCIÓN (CAE)
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

        // 7. ACTUALIZACIÓN DEL RESUMEN VISUAL (BARRAS)
        const barA = document.getElementById('bar_a');
        const barB = document.getElementById('bar_b');
        const maxVpn = Math.max(Math.abs(vpnA), Math.abs(vpnB));

        if (maxVpn > 0) {
            barA.style.height = vpnA > 0 ? `${(vpnA / maxVpn) * 100}%` : '5%';
            barB.style.height = vpnB > 0 ? `${(vpnB / maxVpn) * 100}%` : '5%';
        }

        // 8. Lógica de Recomendación General
        const recoTxt = document.getElementById('recomendacion_txt');
        if (vpnB > vpnA) {
            recoTxt.innerHTML = `Elegir <span class="text-secondary font-bold text-lg">Alternativa B</span> por mayor VPN.`;
            recoTxt.className = "text-white antialiased tracking-wide"; 
        } else if (vpnA > vpnB) {
            recoTxt.innerHTML = `Elegir <span class="text-primary-container font-bold text-lg">Alternativa A</span> por mayor VPN.`;
            recoTxt.className = "text-white antialiased tracking-wide";
        } else {
            recoTxt.innerText = "Ambas alternativas son indiferentes.";
            recoTxt.className = "text-neutral-400 italic";
        }

        // 9. Cambiar a "CALCULADO" al finalizar
        estadoNodo.innerHTML = `<span class="material-symbols-outlined text-sm">verified</span> CALCULADO`;
        estadoNodo.classList.remove('text-blue-500');
        estadoNodo.classList.add('text-green-500');
        
        console.log("Cálculo finalizado con éxito.");
    }, 600); 
}
    
// --- 3. EXPORTACIONES ---

function exportarExcel() {
    const data = [
        ["REPORTE SEAE"],
        ["Métrica", "Alternativa A", "Alternativa B"],
        ["VPN", document.getElementById('res_vpn_a').innerText, document.getElementById('res_vpn_b').innerText],
        ["CAE", document.getElementById('res_cae_a').innerText, document.getElementById('res_cae_b').innerText],
        ["TIR", document.getElementById('res_tir_a').innerText, document.getElementById('res_tir_b').innerText]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "Reporte_Financiero.xlsx");
}

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Recuperamos el nombre real de Google
    const nombreAnalista = localStorage.getItem('usuarioSEAE') || "Analista Independiente";

    // --- ENCABEZADO GRIS ---
    doc.setFontSize(26);
    doc.setTextColor(45, 52, 54); // Gris muy oscuro
    doc.setFont("helvetica", "bold");
    doc.text("SEAE", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100); 
    doc.text("Sistema de Evaluación de Alternativas Económicas", 14, 30);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 35, 196, 35);

    // DATOS DINÁMICOS
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 42);
    doc.text(`Analista: ${nombreAnalista}`, 14, 47);

    // --- TABLA MONOCROMÁTICA ---
    doc.autoTable({
        startY: 55,
        head: [['Métrica de Evaluación', 'Alternativa A', 'Alternativa B']],
        body: [
            ['Valor Presente Neto (VPN)', document.getElementById('res_vpn_a').innerText, document.getElementById('res_vpn_b').innerText],
            ['Costo Anual Equivalente (CAE)', document.getElementById('res_cae_a').innerText, document.getElementById('res_cae_b').innerText],
            ['Tasa Interna de Retorno (TIR)', document.getElementById('res_tir_a').innerText, document.getElementById('res_tir_b').innerText]
        ],
        theme: 'striped',
        headStyles: { 
            fillColor: [45, 52, 54], // Gris oscuro profesional
            textColor: [255, 255, 255]
        },
        styles: { textColor: [60, 60, 60], fontSize: 10 }
    });

    // --- CONCLUSIÓN (SIEMPRE GRIS) ---
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setTextColor(45, 52, 54);
    doc.setFont("helvetica", "bold");
    doc.text("Conclusión del Análisis:", 14, finalY);

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80); // Gris estándar para el texto
    doc.setFont("helvetica", "italic");
    
    const recomendacionTxt = document.getElementById('recomendacion_txt').innerText;
    const splitTxt = doc.splitTextToSize(recomendacionTxt, 180);
    doc.text(splitTxt, 14, finalY + 8);

    doc.save(`Reporte_SEAE_${nombreAnalista.replace(/ /g, "_")}.pdf`);
}

function exportarTXT() {
    const vpnA = document.getElementById('res_vpn_a').innerText;
    const vpnB = document.getElementById('res_vpn_b').innerText;
    const content = `REPORTE SEAE\n----------------\nALT A VPN: ${vpnA}\nALT B VPN: ${vpnB}`;
    
    const blob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    
    // En lugar de a.click(), abrimos el blob directamente
    window.open(url, '_blank'); 
}
// Actualización del Resumen Visual
const vpnA = parseFloat(document.getElementById('res_vpn_a').innerText.replace(/[^0-9.-]+/g,""));
const vpnB = parseFloat(document.getElementById('res_vpn_b').innerText.replace(/[^0-9.-]+/g,""));

const barA = document.getElementById('bar_a');
const barB = document.getElementById('bar_b');

// Encontramos el valor máximo para normalizar las barras al 100%
const maxVal = Math.max(Math.abs(vpnA), Math.abs(vpnB));

if (maxVal > 0) {
    // Si el VPN es negativo, la barra se queda en 5% para mostrar presencia, 
    // si es positivo, se calcula su proporción.
    barA.style.height = vpnA > 0 ? `${(vpnA / maxVal) * 100}%` : '5%';
    barB.style.height = vpnB > 0 ? `${(vpnB / maxVal) * 100}%` : '5%';
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}

