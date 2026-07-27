// Google Apps Script Web App URL mo
const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbz8VVpaOIYLJnmYSSWeejZWuORPWvKUh1PjmLIS1eUe9iRRmouNdjbpLHNdAMklPo94/exec';

let servicesData = [];
let activeItems = [];
let historyLogs = JSON.parse(localStorage.getItem('jessah_history_logs')) || [];
let isHistoryFolded = false;

// Official Branding Footer HTML
const brandingFooterHTML = `
    <div style="text-align: center; margin-top: 15px; padding-top: 8px; border-top: 1px dashed rgba(255,77,136,0.4); font-size: 11px; font-weight: 800; color: #ffb6c1; letter-spacing: 1px;">
        Powered by : 2xaiten
    </div>
`;

// Web Audio API Click Sound
function playClickSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.04);
        
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) {}
}

async function initApp() {
    await fetchServicesFromSheet();
    renderReceipt();
    renderAggregatedSummary();
    renderHistoryLogs();
}

async function fetchServicesFromSheet() {
    const container = document.getElementById('servicesListContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="loading-container">
            <div class="spinner-box">
                <div class="heart-spinner">💖</div>
            </div>
            <div class="loading-text">loading data from Jessah Database... ✨</div>
        </div>
    `;

    try {
        const response = await fetch(SHEET_API_URL);
        const data = await response.json();
        
        servicesData = data.map(item => ({
            category: item.category ? `${item.category} Category` : 'General',
            name: item.itemName,
            price: parseFloat(item.price) || 0,
            bracket: `Bracket ${item.rate}`,
            commission: parseFloat(item.rate) || 0
        })).filter(item => item.name);

        renderServices();
    } catch (error) {
        container.innerHTML = `<div class="empty-log">Failed to load services from Database.</div>`;
    }
}

function renderServices() {
    const container = document.getElementById('servicesListContainer');
    if (!container) return;
    
    if (servicesData.length === 0) {
        container.innerHTML = `<div class="empty-log">No services found.</div>`;
        return;
    }

    let html = '';
    let currentCat = '';
    
    servicesData.forEach((service, index) => {
        if (service.category !== currentCat) {
            currentCat = service.category;
            html += `<div class="category-title">${currentCat}</div>`;
        }
        html += `
            <div class="service-row" onclick="playClickSound(); addService(${index})">
                <div class="service-info">
                    <strong>${service.name}</strong>
                    <span class="service-bracket-tag">${service.bracket}</span>
                </div>
                <div class="service-price">₱${service.price}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function addService(index) {
    const service = servicesData[index];
    const existing = activeItems.find(item => item.name === service.name);
    if (existing) {
        existing.qty += 1;
    } else {
        activeItems.push({
            name: service.name,
            price: service.price,
            commission: service.commission,
            bracket: service.bracket,
            qty: 1,
            isCustom: false
        });
    }
    showToast(`Added: ${service.name}`);
    updateAll();
}

function addCustomService() {
    playClickSound();
    const priceInput = document.getElementById('customPriceInput');
    const price = parseFloat(priceInput.value);
    if (isNaN(price) || price <= 0) {
        showToast('Please enter a valid custom price!');
        return;
    }
    
    activeItems.push({
        name: 'Custom Add-On',
        price: price,
        commission: 0.10,
        bracket: '10% Comm.',
        qty: 1,
        isCustom: true
    });
    
    priceInput.value = '';
    showToast('Custom Add-On Added!');
    updateAll();
}

function changeQty(index, delta) {
    playClickSound();
    activeItems[index].qty += delta;
    if (activeItems[index].qty <= 0) {
        activeItems.splice(index, 1);
    }
    updateAll();
}

function removeItem(index) {
    playClickSound();
    activeItems.splice(index, 1);
    updateAll();
}

function updateAll() {
    renderReceipt();
    renderAggregatedSummary();
    renderHistoryLogs();
}

function renderReceipt() {
    const container = document.getElementById('activeReceiptContainer');
    if (!container) return;

    if (activeItems.length === 0) {
        container.innerHTML = `
            <div class="receipt-box" style="text-align: center; opacity: 0.7;">
                <div class="receipt-header" style="border:none; margin:0; padding-bottom:0;">
                    <h3 style="font-size: 15px; color: #ffb6c1;">Active Receipt Logger</h3>
                    <p style="font-size: 11px; margin-top: 4px;">Click services above to start calculating commission.</p>
                </div>
            </div>
        `;
        return;
    }

    let totalComm = 0;
    let bracketSubtotals = {};

    let itemsHtml = activeItems.map((item, index) => {
        let itemTotalComm = item.price * item.commission * item.qty;
        totalComm += itemTotalComm;

        if (!bracketSubtotals[item.bracket]) {
            bracketSubtotals[item.bracket] = 0;
        }
        bracketSubtotals[item.bracket] += itemTotalComm;

        return `
            <div class="receipt-item-row">
                <div class="item-details">
                    <span class="item-name">${item.name}</span>
                    <span class="item-meta">₱${item.price} x ${item.qty} (${item.bracket})</span>
                </div>
                <div class="item-comm-side">
                    <span class="item-comm">₱${itemTotalComm.toFixed(2)}</span>
                    <div class="qty-controls">
                        <button onclick="changeQty(${index}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${index}, 1)">+</button>
                        <button class="delete-btn" onclick="removeItem(${index})">x</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    let bracketsHtml = Object.keys(bracketSubtotals).map(bracket => `
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #ffb6c1; margin: 4px 0; font-weight: 600;">
            <span>Subtotal (${bracket}):</span>
            <span>₱${bracketSubtotals[bracket].toFixed(2)}</span>
        </div>
    `).join('');

    const now = new Date();
    const currentDateStr = now.toLocaleString('en-US', { 
        month: 'numeric', day: 'numeric', year: 'numeric', 
        hour: 'numeric', minute: 'numeric', hour12: true 
    });

    container.innerHTML = `
        <div class="receipt-box" id="activeReceiptBoxContent">
            <div class="receipt-header">
                <h3>Jessah Nail Studio</h3>
                <p>Active Commission Receipt</p>
                <p style="font-size: 11px; color: #ffb6c1; margin: 2px 0;">🕒 ${currentDateStr}</p>
                <p class="tech-display">Tech: ${document.getElementById('techNameInput')?.value || 'JESSAH'}</p>
            </div>
            ${itemsHtml}
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,77,136,0.4);">
                ${bracketsHtml}
            </div>
            <div class="receipt-total">
                <span>Total Commission:</span>
                <span>₱${totalComm.toFixed(2)}</span>
            </div>
            <button class="glass-btn" onclick="playClickSound(); saveCurrentLog()">Save Log to History</button>
            <button class="glass-btn glass-btn-download" onclick="playClickSound(); downloadBoxAsImage('activeReceiptBoxContent', 'Active_Receipt')">📥 Download Image</button>
            ${brandingFooterHTML}
        </div>
    `;
}

function saveCurrentLog() {
    if (activeItems.length === 0) return;
    const techName = document.getElementById('techNameInput')?.value || 'JESSAH';
    
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { 
        month: 'numeric', day: 'numeric', year: 'numeric', 
        hour: 'numeric', minute: 'numeric', hour12: true 
    });

    let totalComm = activeItems.reduce((sum, item) => sum + (item.price * item.commission * item.qty), 0);
    
    historyLogs.push({
        date: timestamp,
        tech: techName,
        items: [...activeItems],
        total: totalComm
    });

    localStorage.setItem('jessah_history_logs', JSON.stringify(historyLogs));

    activeItems = [];
    showToast('Log saved successfully!');
    updateAll();
}

function renderAggregatedSummary() {
    const container = document.getElementById('aggregatedSummaryBox');
    if (!container) return;

    if (historyLogs.length === 0) {
        container.innerHTML = `
            <div class="receipt-box" style="text-align: center; opacity: 0.7;">
                <div class="receipt-header" style="border:none; margin:0; padding-bottom:0;">
                    <h3 style="font-size: 15px; color: #ffb6c1;">Summary Report</h3>
                    <p style="font-size: 11px; margin-top: 4px;">No saved logs to summarize yet.</p>
                </div>
            </div>
        `;
        return;
    }

    let aggregatedItemsMap = {};
    let bracketSubtotals = {};
    let grandTotal = 0;

    historyLogs.forEach(log => {
        log.items.forEach(item => {
            if (!aggregatedItemsMap[item.name]) {
                aggregatedItemsMap[item.name] = {
                    name: item.name,
                    price: item.price,
                    bracket: item.bracket,
                    commission: item.commission,
                    qty: 0,
                    totalComm: 0
                };
            }
            aggregatedItemsMap[item.name].qty += item.qty;
            let itemComm = item.price * item.commission * item.qty;
            aggregatedItemsMap[item.name].totalComm += itemComm;

            if (!bracketSubtotals[item.bracket]) {
                bracketSubtotals[item.bracket] = 0;
            }
            bracketSubtotals[item.bracket] += itemComm;

            grandTotal += itemComm;
        });
    });

    let aggregatedItemsHtml = Object.values(aggregatedItemsMap).map(item => `
        <div class="receipt-item-row">
            <div class="item-details">
                <span class="item-name">${item.name}</span>
                <span class="item-meta">₱${item.price} x ${item.qty} (${item.bracket})</span>
            </div>
            <div class="item-comm-side">
                <span class="item-comm">₱${item.totalComm.toFixed(2)}</span>
            </div>
        </div>
    `).join('');

    let bracketsHtml = Object.keys(bracketSubtotals).map(bracket => `
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #ffb6c1; margin: 4px 0; font-weight: 600;">
            <span>Subtotal (${bracket}):</span>
            <span>₱${bracketSubtotals[bracket].toFixed(2)}</span>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="receipt-box" id="aggregatedSummaryContent">
            <div class="receipt-header">
                <h3>Summary Report</h3>
                <p>All-Time Aggregated Breakdown</p>
            </div>
            ${aggregatedItemsHtml}
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,77,136,0.4);">
                ${bracketsHtml}
            </div>
            <div class="receipt-total">
                <span>Grand Total:</span>
                <span>₱${grandTotal.toFixed(2)}</span>
            </div>
            <button class="glass-btn glass-btn-download" onclick="playClickSound(); downloadBoxAsImage('aggregatedSummaryContent', 'Aggregated_Summary')">📥 Download Image</button>
            ${brandingFooterHTML}
        </div>
    `;
}

function toggleHistoryFold() {
    playClickSound();
    isHistoryFolded = !isHistoryFolded;
    renderHistoryLogs();
}

function deleteHistoryLog(index) {
    playClickSound();
    if (confirm(`Gusto mo bang burahin ang Log #${index + 1}?`)) {
        historyLogs.splice(index, 1);
        localStorage.setItem('jessah_history_logs', JSON.stringify(historyLogs));
        showToast('Log deleted successfully!');
        updateAll();
    }
}

function deleteAllHistoryLogs() {
    playClickSound();
    if (confirm("Gusto mo bang burahin LAHAT ng history logs? Hindi na ito maibabalik.")) {
        historyLogs = [];
        localStorage.removeItem('jessah_history_logs');
        showToast('All logs deleted successfully!');
        updateAll();
    }
}

function renderHistoryLogs() {
    const container = document.getElementById('historyLogsContainer');
    if (!container) return;

    if (historyLogs.length === 0) {
        container.innerHTML = ``;
        return;
    }

    let toggleHeaderHtml = `
        <div style="display: flex; gap: 8px; margin-top: 25px; margin-bottom: 12px;">
            <button class="collapse-header-btn" style="margin-top:0; flex: 1;" onclick="toggleHistoryFold()">
                <span>📁 Individual History Logs (${historyLogs.length})</span>
                <span>${isHistoryFolded ? '▶ Expand' : '▼ Collapse'}</span>
            </button>
            <button class="glass-btn glass-btn-danger" style="margin-top:0; flex: 0 0 110px; font-size:12px; padding:8px;" onclick="deleteAllHistoryLogs()">🗑️ Delete All</button>
        </div>
    `;

    if (isHistoryFolded) {
        container.innerHTML = toggleHeaderHtml;
        return;
    }

    let logsHtml = historyLogs.map((log, logIndex) => {
        let logBracketSubtotals = {};
        log.items.forEach(item => {
            let itemComm = item.price * item.commission * item.qty;
            if (!logBracketSubtotals[item.bracket]) {
                logBracketSubtotals[item.bracket] = 0;
            }
            logBracketSubtotals[item.bracket] += itemComm;
        });

        let logBracketsHtml = Object.keys(logBracketSubtotals).map(bracket => `
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #ffb6c1; margin: 4px 0; font-weight: 600;">
                <span>Subtotal (${bracket}):</span>
                <span>₱${logBracketSubtotals[bracket].toFixed(2)}</span>
            </div>
        `).join('');

        return `
            <div class="receipt-box" id="historyLog-${logIndex}" style="margin-bottom: 10px; position: relative;">
                <div class="receipt-header">
                    <h3>Log #${logIndex + 1}</h3>
                    <p style="font-size: 11px; color: #ffb6c1; margin: 2px 0;">🕒 ${log.date}</p>
                    <p class="tech-display">Tech: ${log.tech}</p>
                </div>
                ${log.items.map(item => `
                    <div class="receipt-item-row">
                        <div class="item-details">
                            <span class="item-name">${item.name}</span>
                            <span class="item-meta">₱${item.price} x ${item.qty} (${item.bracket})</span>
                        </div>
                        <div class="item-comm-side">
                            <span class="item-comm">₱${(item.price * item.commission * item.qty).toFixed(2)}</span>
                        </div>
                    </div>
                `).join('')}
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,77,136,0.4);">
                    ${logBracketsHtml}
                </div>
                <div class="receipt-total">
                    <span>Total:</span>
                    <span>₱${log.total.toFixed(2)}</span>
                </div>
                <div class="action-buttons-row" style="display: flex; gap: 8px; margin-top: 10px;">
                    <button class="glass-btn glass-btn-download" style="flex: 1; margin:0;" onclick="playClickSound(); downloadBoxAsImage('historyLog-${logIndex}', 'Log_${logIndex + 1}')">📥 Download Image</button>
                    <button class="glass-btn glass-btn-danger" style="flex: 0 0 90px; margin:0;" onclick="deleteHistoryLog(${logIndex})">🗑️ Delete</button>
                </div>
                ${brandingFooterHTML}
            </div>
        `;
    }).join('');

    container.innerHTML = toggleHeaderHtml + logsHtml;
}

function downloadBoxAsImage(elementId, label) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Hanapin ang action buttons sa loob ng box na ito para pansamantalang itago habang kinukuhanan ng litrato
    const actionRow = element.querySelector('.action-buttons-row');
    if (actionRow) {
        actionRow.style.display = 'none';
    }

    html2canvas(element, {
        backgroundColor: '#120a12',
        scale: 2
    }).then(canvas => {
        // Ibalik ang action buttons pagkatapos kuhanan ng litrato
        if (actionRow) {
            actionRow.style.display = 'flex';
        }

        const link = document.createElement('a');
        link.download = `${label}_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast(`${label} downloaded as image!`);
    }).catch(err => {
        if (actionRow) {
            actionRow.style.display = 'flex';
        }
        showToast('Failed to download image.');
    });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

window.onload = initApp;