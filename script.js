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
    
// --- 3. EXPORTACIONES (VERSIÓN COMPATIBLE CON ESCRITORIO) ---

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

    // 1. OBTENCIÓN DE DATOS ACTUALES
    // Obtenemos el nombre del analista del localStorage o usamos el valor predeterminado de la interfaz
    const nombreAnalista = localStorage.getItem('usuarioSEAE') || document.getElementById('nombre_analista_principal')?.innerText || "Analista Independiente";
    const fechaEmision = new Date().toLocaleDateString('es-ES');
    
    // Obtenemos la recomendación actual de la interfaz
    const conclusion = document.getElementById('recomendacion_txt').innerText;

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

    // === TABLA DE RESULTADOS (Using autoTable) ===
    doc.autoTable({
        startY: 65,
        margin: { left: 16, right: 16 },
        head: [['Métrica de Evaluación', 'Alternativa A', 'Alternativa B']],
        body: [
            ['Valor Presente Neto (VPN)', document.getElementById('res_vpn_a').innerText, document.getElementById('res_vpn_b').innerText],
            ['Costo Anual Equivalente (CAE)', document.getElementById('res_cae_a').innerText, document.getElementById('res_cae_b').innerText],
            ['Tasa Interna de Retorno (TIR)', document.getElementById('res_tir_a').innerText, document.getElementById('res_tir_b').innerText]
        ],
        theme: 'striped',
        headStyles: { 
            fillColor: [40, 45, 53], // Gris oscuro de la cabecera
            textColor: [255, 255, 255], 
            fontStyle: 'bold',
            halign: 'left' // Alineación a la izquierda para la primera columna
        },
        bodyStyles: { 
            textColor: [60, 60, 60],
            valign: 'middle'
        },
        alternateRowStyles: {
            fillColor: [248, 249, 251] // Gris muy claro para filas alternas
        },
        columnStyles: {
            1: { halign: 'right' }, // Alternativa A a la derecha
            2: { halign: 'right' }  // Alternativa B a la derecha
        }
    });

    // === SECCIÓN DE CONCLUSIÓN (Debajo de la tabla) ===
    // Obtenemos la coordenada Y donde terminó la tabla
    const finalY = doc.lastAutoTable.finalY;

    doc.setFontSize(12);
    doc.setTextColor(28, 32, 39);
    doc.setFont("helvetica", "bold");
    doc.text("Conclusión del Análisis:", 16, finalY + 20);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "italic");
    
    // Usamos textWithLink o splitTextToSize si la conclusión es muy larga, 
    // pero para frases cortas text() está bien.
    doc.text(conclusion, 16, finalY + 28);

    // 4. GUARDAR EL ARCHIVO
    // Usamos el nombre del analista para el nombre del archivo, limpiando espacios
    const nombreArchivo = `Reporte_SEAE_${nombreAnalista.replace(/ /g, "_")}.pdf`;
    doc.save(nombreArchivo);
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
window.onload = function() {
    // Busca todos los inputs de tipo número y texto y los vacía
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.value = '';
    });
    
    // Si tienes etiquetas de resultados (VPN, CAE, TIR), cámbialas a su valor inicial
    document.getElementById('res_vpn_a').innerText = '$0.00';
    document.getElementById('res_vpn_b').innerText = '$0.00';
    // Repite con los demás resultados...
    
    console.log("Sistema SEAE reiniciado.");
};

function limpiarPantalla() {
    // 1. Limpiar los cuadros de entrada
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => input.value = '');

    // 2. Reiniciar textos de resultados
    const resultados = ['res_vpn_a', 'res_vpn_b', 'res_cae_a', 'res_cae_b', 'res_tir_a', 'res_tir_b'];
    resultados.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = id.includes('tir') ? '0.00%' : '$0.00';
    });

    // 3. ELIMINAR LAS BARRAS (El fix que faltaba)
    document.getElementById('bar_a').style.height = '0%';
    document.getElementById('bar_b').style.height = '0%';

    // 4. Reiniciar textos informativos
    document.getElementById('res_mejor_cae').innerText = 'Indiferente';
    document.getElementById('recomendacion_txt').innerText = 'Esperando nuevos datos...';
    document.getElementById('estado_sistema').innerHTML = 'SISTEMA LISTO';
    
    console.log("Limpieza total completada.");
}
