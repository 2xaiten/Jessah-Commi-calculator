// Google Apps Script Web App URL mo[cite: 2]
const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbz8VVpaOIYLJnmYSSWeejZWuORPWvKUh1PjmLIS1eUe9iRRmouNdjbpLHNdAMklPo94/exec';[cite: 2]

let servicesData = [];[cite: 2]
let activeItems = [];[cite: 2]
let historyLogs = JSON.parse(localStorage.getItem('jessah_history_logs')) || [];[cite: 2]
let isHistoryFolded = false;[cite: 2]

// Official Branding Footer HTML[cite: 2]
const brandingFooterHTML = `
    <div style="text-align: center; margin-top: 15px; padding-top: 8px; border-top: 1px dashed rgba(255,77,136,0.4); font-size: 11px; font-weight: 800; color: #ffb6c1; letter-spacing: 1px;">
        Powered by : 2xaiten
    </div>
`;[cite: 2]

// Web Audio API Click Sound[cite: 2]
function playClickSound() {[cite: 2]
    try {[cite: 2]
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();[cite: 2]
        const osc = audioCtx.createOscillator();[cite: 2]
        const gain = audioCtx.createGain();[cite: 2]
        
        osc.type = 'sine';[cite: 2]
        osc.frequency.setValueAtTime(450, audioCtx.currentTime);[cite: 2]
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.04);[cite: 2]
        
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);[cite: 2]
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);[cite: 2]
        
        osc.connect(gain);[cite: 2]
        gain.connect(audioCtx.destination);[cite: 2]
        
        osc.start();[cite: 2]
        osc.stop(audioCtx.currentTime + 0.04);[cite: 2]
    } catch (e) {}[cite: 2]
}

async function initApp() {[cite: 2]
    await fetchServicesFromSheet();[cite: 2]
    renderReceipt();[cite: 2]
    renderAggregatedSummary();[cite: 2]
    renderHistoryLogs();[cite: 2]
}

async function fetchServicesFromSheet() {[cite: 2]
    const container = document.getElementById('servicesListContainer');[cite: 2]
    if (!container) return;[cite: 2]

    container.innerHTML = `
        <div class="loading-container">
            <div class="spinner-box">
                <div class="heart-spinner">💖</div>
            </div>
            <div class="loading-text">loading data from Jessah Database... ✨</div>
        </div>
    `;[cite: 2]

    try {[cite: 2]
        const response = await fetch(SHEET_API_URL);[cite: 2]
        const data = await response.json();[cite: 2]
        
        servicesData = data.map(item => ({[cite: 2]
            category: item.category ? `${item.category} Category` : 'General',[cite: 2]
            name: item.itemName,[cite: 2]
            price: parseFloat(item.price) || 0,[cite: 2]
            bracket: `Bracket ${item.rate}`,[cite: 2]
            commission: parseFloat(item.rate) || 0[cite: 2]
        })).filter(item => item.name);[cite: 2]

        renderServices();[cite: 2]
    } catch (error) {[cite: 2]
        container.innerHTML = `<div class="empty-log">Failed to load services from Database.</div>`;[cite: 2]
    }
}

function renderServices() {[cite: 2]
    const container = document.getElementById('servicesListContainer');[cite: 2]
    if (!container) return;[cite: 2]
    
    if (servicesData.length === 0) {[cite: 2]
        container.innerHTML = `<div class="empty-log">No services found.</div>`;[cite: 2]
        return;[cite: 2]
    }

    let html = '';[cite: 2]
    let currentCat = '';[cite: 2]
    
    servicesData.forEach((service, index) => {[cite: 2]
        if (service.category !== currentCat) {[cite: 2]
            currentCat = service.category;[cite: 2]
            html += `<div class="category-title">${currentCat}</div>`;[cite: 2]
        }
        html += `
            <div class="service-row" onclick="playClickSound(); addService(${index})">
                <div class="service-info">
                    <strong>${service.name}</strong>
                    <span class="service-bracket-tag">${service.bracket}</span>
                </div>
                <div class="service-price">₱${service.price}</div>
            </div>
        `;[cite: 2]
    });
    container.innerHTML = html;[cite: 2]
}

function addService(index) {[cite: 2]
    const service = servicesData[index];[cite: 2]
    const existing = activeItems.find(item => item.name === service.name);[cite: 2]
    if (existing) {[cite: 2]
        existing.qty += 1;[cite: 2]
    } else {[cite: 2]
        activeItems.push({[cite: 2]
            name: service.name,[cite: 2]
            price: service.price,[cite: 2]
            commission: service.commission,[cite: 2]
            bracket: service.bracket,[cite: 2]
            qty: 1,[cite: 2]
            isCustom: false[cite: 2]
        });[cite: 2]
    }
    showToast(`Added: ${service.name}`);[cite: 2]
    updateAll();[cite: 2]
}

function addCustomService() {[cite: 2]
    playClickSound();[cite: 2]
    const priceInput = document.getElementById('customPriceInput');[cite: 2]
    const price = parseFloat(priceInput.value);[cite: 2]
    if (isNaN(price) || price <= 0) {[cite: 2]
        showToast('Please enter a valid custom price!');[cite: 2]
        return;[cite: 2]
    }
    
    activeItems.push({[cite: 2]
        name: 'Custom Add-On',[cite: 2]
        price: price,[cite: 2]
        commission: 0.10,[cite: 2]
        bracket: '10% Comm.',[cite: 2]
        qty: 1,[cite: 2]
        isCustom: true[cite: 2]
    });[cite: 2]
    
    priceInput.value = '';[cite: 2]
    showToast('Custom Add-On Added!');[cite: 2]
    updateAll();[cite: 2]
}

function changeQty(index, delta) {[cite: 2]
    playClickSound();[cite: 2]
    activeItems[index].qty += delta;[cite: 2]
    if (activeItems[index].qty <= 0) {[cite: 2]
        activeItems.splice(index, 1);[cite: 2]
    }
    updateAll();[cite: 2]
}

function removeItem(index) {[cite: 2]
    playClickSound();[cite: 2]
    activeItems.splice(index, 1);[cite: 2]
    updateAll();[cite: 2]
}

function updateAll() {[cite: 2]
    renderReceipt();[cite: 2]
    renderAggregatedSummary();[cite: 2]
    renderHistoryLogs();[cite: 2]
}

function renderReceipt() {[cite: 2]
    const container = document.getElementById('activeReceiptContainer');[cite: 2]
    if (!container) return;[cite: 2]

    if (activeItems.length === 0) {[cite: 2]
        container.innerHTML = `
            <div class="receipt-box" style="text-align: center; opacity: 0.7;">
                <div class="receipt-header" style="border:none; margin:0; padding-bottom:0;">
                    <h3 style="font-size: 15px; color: #ffb6c1;">Active Receipt Logger</h3>
                    <p style="font-size: 11px; margin-top: 4px;">Click services above to start calculating commission.</p>
                </div>
            </div>
        `;[cite: 2]
        return;[cite: 2]
    }

    let totalComm = 0;[cite: 2]
    let bracketSubtotals = {};[cite: 2]

    let itemsHtml = activeItems.map((item, index) => {[cite: 2]
        let itemTotalComm = item.price * item.commission * item.qty;[cite: 2]
        totalComm += itemTotalComm;[cite: 2]

        if (!bracketSubtotals[item.bracket]) {[cite: 2]
            bracketSubtotals[item.bracket] = 0;[cite: 2]
        }
        bracketSubtotals[item.bracket] += itemTotalComm;[cite: 2]

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
        `;[cite: 2]
    }).join('');[cite: 2]

    let bracketsHtml = Object.keys(bracketSubtotals).map(bracket => `
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #ffb6c1; margin: 4px 0; font-weight: 600;">
            <span>Subtotal (${bracket}):</span>
            <span>₱${bracketSubtotals[bracket].toFixed(2)}</span>
        </div>
    `).join('');[cite: 2]

    const now = new Date();[cite: 2]
    const currentDateStr = now.toLocaleString('en-US', { [cite: 2]
        month: 'numeric', day: 'numeric', year: 'numeric', [cite: 2]
        hour: 'numeric', minute: 'numeric', hour12: true [cite: 2]
    });[cite: 2]

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
            <div class="action-buttons-row" style="display: flex; gap: 8px; margin-top: 10px;">
                <button class="glass-btn glass-btn-download" style="flex: 1; margin:0;" onclick="playClickSound(); downloadBoxAsImage('activeReceiptBoxContent', 'Active_Receipt')">📥 Download Image</button>
            </div>
            ${brandingFooterHTML}
        </div>
    `;[cite: 2]
}

function saveCurrentLog() {[cite: 2]
    if (activeItems.length === 0) return;[cite: 2]
    const techName = document.getElementById('techNameInput')?.value || 'JESSAH';[cite: 2]
    
    const now = new Date();[cite: 2]
    const timestamp = now.toLocaleString('en-US', { [cite: 2]
        month: 'numeric', day: 'numeric', year: 'numeric', [cite: 2]
        hour: 'numeric', minute: 'numeric', hour12: true [cite: 2]
    });[cite: 2]

    let totalComm = activeItems.reduce((sum, item) => sum + (item.price * item.commission * item.qty), 0);[cite: 2]
    
    historyLogs.push({[cite: 2]
        date: timestamp,[cite: 2]
        tech: techName,[cite: 2]
        items: [...activeItems],[cite: 2]
        total: totalComm[cite: 2]
    });[cite: 2]

    localStorage.setItem('jessah_history_logs', JSON.stringify(historyLogs));[cite: 2]

    activeItems = [];[cite: 2]
    showToast('Log saved successfully!');[cite: 2]
    updateAll();[cite: 2]
}

function renderAggregatedSummary() {[cite: 2]
    const container = document.getElementById('aggregatedSummaryBox');[cite: 2]
    if (!container) return;[cite: 2]

    if (historyLogs.length === 0) {[cite: 2]
        container.innerHTML = `
            <div class="receipt-box" style="text-align: center; opacity: 0.7;">
                <div class="receipt-header" style="border:none; margin:0; padding-bottom:0;">
                    <h3 style="font-size: 15px; color: #ffb6c1;">Summary Report</h3>
                    <p style="font-size: 11px; margin-top: 4px;">No saved logs to summarize yet.</p>
                </div>
            </div>
        `;[cite: 2]
        return;[cite: 2]
    }

    let aggregatedItemsMap = {};[cite: 2]
    let bracketSubtotals = {};[cite: 2]
    let grandTotal = 0;[cite: 2]

    historyLogs.forEach(log => {[cite: 2]
        log.items.forEach(item => {[cite: 2]
            if (!aggregatedItemsMap[item.name]) {[cite: 2]
                aggregatedItemsMap[item.name] = {[cite: 2]
                    name: item.name,[cite: 2]
                    price: item.price,[cite: 2]
                    bracket: item.bracket,[cite: 2]
                    commission: item.commission,[cite: 2]
                    qty: 0,[cite: 2]
                    totalComm: 0[cite: 2]
                };[cite: 2]
            }
            aggregatedItemsMap[item.name].qty += item.qty;[cite: 2]
            let itemComm = item.price * item.commission * item.qty;[cite: 2]
            aggregatedItemsMap[item.name].totalComm += itemComm;[cite: 2]

            if (!bracketSubtotals[item.bracket]) {[cite: 2]
                bracketSubtotals[item.bracket] = 0;[cite: 2]
            }
            bracketSubtotals[item.bracket] += itemComm;[cite: 2]

            grandTotal += itemComm;[cite: 2]
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
    `).join('');[cite: 2]

    let bracketsHtml = Object.keys(bracketSubtotals).map(bracket => `
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #ffb6c1; margin: 4px 0; font-weight: 600;">
            <span>Subtotal (${bracket}):</span>
            <span>₱${bracketSubtotals[bracket].toFixed(2)}</span>
        </div>
    `).join('');[cite: 2]

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
            <div class="action-buttons-row" style="display: flex; gap: 8px; margin-top: 10px;">
                <button class="glass-btn glass-btn-download" style="flex: 1; margin:0;" onclick="playClickSound(); downloadBoxAsImage('aggregatedSummaryContent', 'Aggregated_Summary')">📥 Download Image</button>
            </div>
            ${brandingFooterHTML}
        </div>
    `;[cite: 2]
}

function toggleHistoryFold() {[cite: 2]
    playClickSound();[cite: 2]
    isHistoryFolded = !isHistoryFolded;[cite: 2]
    renderHistoryLogs();[cite: 2]
}

function deleteHistoryLog(index) {[cite: 2]
    playClickSound();[cite: 2]
    if (confirm(`Gusto mo bang burahin ang Log #${index + 1}?`)) {[cite: 2]
        historyLogs.splice(index, 1);[cite: 2]
        localStorage.setItem('jessah_history_logs', JSON.stringify(historyLogs));[cite: 2]
        showToast('Log deleted successfully!');[cite: 2]
        updateAll();[cite: 2]
    }
}

function deleteAllHistoryLogs() {[cite: 2]
    playClickSound();[cite: 2]
    if (confirm("Gusto mo bang burahin LAHAT ng history logs? Hindi na ito maibabalik.")) {[cite: 2]
        historyLogs = [];[cite: 2]
        localStorage.removeItem('jessah_history_logs');[cite: 2]
        showToast('All logs deleted successfully!');[cite: 2]
        updateAll();[cite: 2]
    }
}

function renderHistoryLogs() {[cite: 2]
    const container = document.getElementById('historyLogsContainer');[cite: 2]
    if (!container) return;[cite: 2]

    if (historyLogs.length === 0) {[cite: 2]
        container.innerHTML = ``;[cite: 2]
        return;[cite: 2]
    }

    let toggleHeaderHtml = `
        <div style="display: flex; gap: 8px; margin-top: 25px; margin-bottom: 12px;">
            <button class="collapse-header-btn" style="margin-top:0; flex: 1;" onclick="toggleHistoryFold()">
                <span>📁 Individual History Logs (${historyLogs.length})</span>
                <span>${isHistoryFolded ? '▶ Expand' : '▼ Collapse'}</span>
            </button>
            <button class="glass-btn glass-btn-danger" style="margin-top:0; flex: 0 0 110px; font-size:12px; padding:8px;" onclick="deleteAllHistoryLogs()">🗑️ Delete All</button>
        </div>
    `;[cite: 2]

    if (isHistoryFolded) {[cite: 2]
        container.innerHTML = toggleHeaderHtml;[cite: 2]
        return;[cite: 2]
    }

    let logsHtml = historyLogs.map((log, logIndex) => {[cite: 2]
        let logBracketSubtotals = {};[cite: 2]
        log.items.forEach(item => {[cite: 2]
            let itemComm = item.price * item.commission * item.qty;[cite: 2]
            if (!logBracketSubtotals[item.bracket]) {[cite: 2]
                logBracketSubtotals[item.bracket] = 0;[cite: 2]
            }
            logBracketSubtotals[item.bracket] += itemComm;[cite: 2]
        });

        let logBracketsHtml = Object.keys(logBracketSubtotals).map(bracket => `
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #ffb6c1; margin: 4px 0; font-weight: 600;">
                <span>Subtotal (${bracket}):</span>
                <span>₱${logBracketSubtotals[bracket].toFixed(2)}</span>
            </div>
        `).join('');[cite: 2]

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
        `;[cite: 2]
    }).join('');[cite: 2]

    container.innerHTML = toggleHeaderHtml + logsHtml;[cite: 2]
}

function downloadBoxAsImage(elementId, label) {[cite: 2]
    const element = document.getElementById(elementId);[cite: 2]
    if (!element) return;[cite: 2]
    
    const actionRow = element.querySelector('.action-buttons-row');[cite: 2]
    if (actionRow) {[cite: 2]
        actionRow.style.display = 'none';[cite: 2]
    }

    html2canvas(element, {[cite: 2]
        backgroundColor: '#120a12',[cite: 2]
        scale: 2[cite: 2]
    }).then(canvas => {[cite: 2]
        if (actionRow) {[cite: 2]
            actionRow.style.display = 'flex';[cite: 2]
        }

        const link = document.createElement('a');[cite: 2]
        link.download = `${label}_${Date.now()}.png`;[cite: 2]
        link.href = canvas.toDataURL('image/png');[cite: 2]
        link.click();[cite: 2]
        showToast(`${label} downloaded as image!`);[cite: 2]
    }).catch(err => {[cite: 2]
        if (actionRow) {[cite: 2]
            actionRow.style.display = 'flex';[cite: 2]
        }
        showToast('Failed to download image.');[cite: 2]
    });
}

function showToast(message) {[cite: 2]
    const toast = document.getElementById('toast');[cite: 2]
    if (!toast) return;[cite: 2]
    toast.textContent = message;[cite: 2]
    toast.classList.add('show');[cite: 2]
    setTimeout(() => {[cite: 2]
        toast.classList.remove('show');[cite: 2]
    }, 2000);[cite: 2]
}

window.onload = initApp;[cite: 2]