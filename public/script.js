// Global state
let parsedExpenses = [];
let notionConfig = {};

// DOM elements
const elements = {
    notionToken: document.getElementById('notionToken'),
    databaseUrl: document.getElementById('databaseUrl'),
    testConnection: document.getElementById('testConnection'),
    connectionStatus: document.getElementById('connectionStatus'),
    keepText: document.getElementById('keepText'),
    parseExpenses: document.getElementById('parseExpenses'),
    parseStatus: document.getElementById('parseStatus'),
    expensesPreview: document.getElementById('expensesPreview'),
    uploadExpenses: document.getElementById('uploadExpenses'),
    editExpenses: document.getElementById('editExpenses'),
    uploadStatus: document.getElementById('uploadStatus'),
    uploadResults: document.getElementById('uploadResults'),
    startOver: document.getElementById('startOver'),
    steps: {
        step1: document.getElementById('step1'),
        step2: document.getElementById('step2'),
        step3: document.getElementById('step3'),
        step4: document.getElementById('step4')
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    elements.testConnection.addEventListener('click', testNotionConnection);
    elements.parseExpenses.addEventListener('click', parseKeepExpenses);
    elements.uploadExpenses.addEventListener('click', uploadToNotion);
    elements.editExpenses.addEventListener('click', goBackToEdit);
    elements.startOver.addEventListener('click', startOverProcess);
    
    // Load saved data from localStorage
    loadSavedData();
});

// Save and load data from localStorage
function saveData() {
    localStorage.setItem('keep2notion_token', elements.notionToken.value);
    localStorage.setItem('keep2notion_database', elements.databaseUrl.value);
}

function loadSavedData() {
    const savedToken = localStorage.getItem('keep2notion_token');
    const savedDatabase = localStorage.getItem('keep2notion_database');
    
    if (savedToken) elements.notionToken.value = savedToken;
    if (savedDatabase) elements.databaseUrl.value = savedDatabase;
}

// Test Notion connection
async function testNotionConnection() {
    const token = elements.notionToken.value.trim();
    const databaseUrl = elements.databaseUrl.value.trim();
    
    if (!token || !databaseUrl) {
        showStatus('connectionStatus', 'Please fill in both Notion token and database URL', 'error');
        return;
    }
    
    showLoadingButton(elements.testConnection, 'Testing...');
    showStatus('connectionStatus', 'Testing connection to Notion...', 'info');
    
    try {
        const response = await fetch('/api/test-notion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notionToken: token,
                databaseUrl: databaseUrl
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('connectionStatus', result.message, 'success');
            notionConfig = { token, databaseUrl };
            saveData();
            
            // Show step 2 after successful connection
            setTimeout(() => {
                showStep(2);
            }, 1500);
        } else {
            showStatus('connectionStatus', `Connection failed: ${result.error}`, 'error');
        }
    } catch (error) {
        showStatus('connectionStatus', `Network error: ${error.message}`, 'error');
    } finally {
        hideLoadingButton(elements.testConnection, 'Test Connection');
    }
}

// Parse Keep expenses
async function parseKeepExpenses() {
    const keepText = elements.keepText.value.trim();
    
    if (!keepText) {
        showStatus('parseStatus', 'Please paste your Google Keep text', 'error');
        return;
    }
    
    showLoadingButton(elements.parseExpenses, 'Parsing...');
    showStatus('parseStatus', 'Parsing your expenses...', 'info');
    
    try {
        const response = await fetch('/api/parse-expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                keepText: keepText
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            parsedExpenses = result.expenses;
            showStatus('parseStatus', `Successfully parsed ${result.count} expenses`, 'success');
            
            // Generate preview
            generateExpensesPreview();
            
            // Show step 3 after successful parsing
            setTimeout(() => {
                showStep(3);
            }, 1500);
        } else {
            showStatus('parseStatus', `Parsing failed: ${result.error}`, 'error');
        }
    } catch (error) {
        showStatus('parseStatus', `Network error: ${error.message}`, 'error');
    } finally {
        hideLoadingButton(elements.parseExpenses, 'Parse Expenses');
    }
}

// Generate expenses preview table
function generateExpensesPreview() {
    if (parsedExpenses.length === 0) {
        elements.expensesPreview.innerHTML = '<p>No expenses parsed.</p>';
        return;
    }
    
    let html = `
        <h3>📊 Parsed Expenses (${parsedExpenses.length} items)</h3>
        <table class="expenses-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Tag</th>
                    <th>Mode</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    parsedExpenses.forEach(expense => {
        const amountClass = expense.amount >= 0 ? 'positive' : 'negative';
        const amountDisplay = expense.amount >= 0 ? `+${expense.amount}` : expense.amount;
        const tagDisplay = expense.tag 
            ? `<span class="expense-tag">${expense.tag}</span>`
            : `<span class="expense-tag empty">No tag</span>`;
        
        const modesDisplay = expense.modes.map(mode => 
            `<span class="expense-mode">${mode}</span>`
        ).join('');
        
        html += `
            <tr>
                <td>${expense.date || 'No date'}</td>
                <td>${expense.title}</td>
                <td class="expense-amount ${amountClass}">${amountDisplay}</td>
                <td>${expense.type}</td>
                <td>${tagDisplay}</td>
                <td><div class="expense-modes">${modesDisplay}</div></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <p style="margin-top: 10px; color: #718096; font-size: 14px;">
            Review the parsed data above. You can edit the original text and re-parse if needed.
        </p>
    `;
    
    elements.expensesPreview.innerHTML = html;
}

// Upload expenses to Notion
async function uploadToNotion() {
    if (parsedExpenses.length === 0) {
        showStatus('uploadStatus', 'No expenses to upload', 'error');
        return;
    }
    
    showLoadingButton(elements.uploadExpenses, 'Uploading...');
    showStatus('uploadStatus', `Uploading ${parsedExpenses.length} expenses to Notion...`, 'info');
    
    try {
        const response = await fetch('/api/upload-expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notionToken: notionConfig.token,
                databaseUrl: notionConfig.databaseUrl,
                expenses: parsedExpenses
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('uploadStatus', result.message, 'success');
            
            // Show detailed results
            generateUploadResults(result);
            
            // Show step 4 after successful upload
            setTimeout(() => {
                showStep(4);
            }, 2000);
        } else {
            showStatus('uploadStatus', `Upload failed: ${result.error}`, 'error');
        }
    } catch (error) {
        showStatus('uploadStatus', `Network error: ${error.message}`, 'error');
    } finally {
        hideLoadingButton(elements.uploadExpenses, 'Upload to Notion');
    }
}

// Generate upload results
function generateUploadResults(result) {
    const { summary, results } = result;
    
    let html = `
        <div class="upload-summary">
            <h3>📈 Upload Summary</h3>
            <p><strong>Total expenses:</strong> ${summary.total}</p>
            <p><strong>Successfully uploaded:</strong> <span style="color: #22543d;">${summary.success}</span></p>
            <p><strong>Failed:</strong> <span style="color: #742a2a;">${summary.errors}</span></p>
        </div>
    `;
    
    if (results && results.length > 0) {
        html += `
            <div class="upload-details" style="margin-top: 20px;">
                <h4>📋 Detailed Results</h4>
                <ul style="margin-top: 10px;">
        `;
        
        results.forEach(item => {
            const icon = item.success ? '✅' : '❌';
            const style = item.success ? 'color: #22543d;' : 'color: #742a2a;';
            const error = item.error ? ` - ${item.error}` : '';
            
            html += `<li style="${style}">${icon} ${item.expense}${error}</li>`;
        });
        
        html += `
                </ul>
            </div>
        `;
    }
    
    elements.uploadResults.innerHTML = html;
}

// Navigation functions
function showStep(stepNumber) {
    // Hide all steps
    Object.values(elements.steps).forEach(step => {
        step.style.display = 'none';
    });
    
    // Show the requested step
    elements.steps[`step${stepNumber}`].style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBackToEdit() {
    showStep(2);
}

function startOverProcess() {
    // Clear parsed data
    parsedExpenses = [];
    
    // Clear text areas
    elements.keepText.value = '';
    elements.expensesPreview.innerHTML = '';
    elements.uploadResults.innerHTML = '';
    
    // Hide status messages
    hideStatus('parseStatus');
    hideStatus('uploadStatus');
    
    // Go back to step 2
    showStep(2);
}

// Utility functions
function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
}

function hideStatus(elementId) {
    const element = document.getElementById(elementId);
    element.style.display = 'none';
}

function showLoadingButton(button, text) {
    button.disabled = true;
    button.innerHTML = `<span class="loading"></span>${text}`;
}

function hideLoadingButton(button, text) {
    button.disabled = false;
    button.innerHTML = text;
}

// Help modal functions
function showHelp() {
    document.getElementById('helpModal').style.display = 'flex';
}

function closeHelp() {
    document.getElementById('helpModal').style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('helpModal');
    if (event.target === modal) {
        closeHelp();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Escape key closes modal
    if (event.key === 'Escape') {
        closeHelp();
    }
    
    // Ctrl/Cmd + Enter in textarea triggers parsing
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (document.activeElement === elements.keepText) {
            parseKeepExpenses();
        }
    }
}); 