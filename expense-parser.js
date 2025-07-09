const moment = require('moment');

class ExpenseParser {
  constructor() {
    // Valid payment modes
    this.validModes = ['UPI', 'Cash', 'Card', 'IMPS', 'Bank A/C'];
  }

  parseKeepNotes(keepText) {
    const expenses = [];
    const lines = keepText.trim().split('\n');
    let currentDate = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Check if line is a date
      const dateMatch = this.extractDate(line);
      if (dateMatch) {
        currentDate = dateMatch;
        continue;
      }

      // Check if line is an expense entry (starts with bullet point)
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        const expense = this.parseExpenseLine(line, currentDate);
        if (expense) {
          expenses.push(expense);
        }
      }
    }

    return expenses;
  }

  extractDate(line) {
    // Match patterns like "Monday, 23rd June" or "Tuesday, 24th June"
    const datePattern = /^([A-Za-z]+),\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)$/;
    const match = line.match(datePattern);
    
    if (match) {
      const [, dayName, day, month] = match;
      const currentYear = new Date().getFullYear();
      
      // Create date string in format that moment can parse
      const dateStr = `${day} ${month} ${currentYear}`;
      const parsedDate = moment(dateStr, 'D MMMM YYYY');
      
      if (parsedDate.isValid()) {
        return parsedDate.format('YYYY-MM-DD');
      }
    }
    
    return null;
  }

  parseExpenseLine(line, date) {
    // Remove bullet point and trim
    const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
    
    // Pattern to match: "Description - Amount (Mode)" or "Description - +Amount (Mode)"
    const expensePattern = /^(.+?)\s*-\s*([+\-]?\d+(?:\.\d{2})?)\s*\(([^)]+)\)$/;
    const match = cleanLine.match(expensePattern);
    
    if (!match) {
      console.warn(`Could not parse expense line: ${line}`);
      return null;
    }

    const [, title, amountStr, modeStr] = match;
    
    // Parse amount and determine type
    const isGain = amountStr.startsWith('+');
    const amount = parseFloat(amountStr.replace(/[+\-]/, ''));
    const finalAmount = isGain ? amount : -amount;
    const type = isGain ? '+' : '-';

    // Parse payment modes (can be comma-separated)
    const modes = this.parsePaymentModes(modeStr);

    return {
      title: title.trim(),
      amount: finalAmount,
      date: date,
      type: type,
      modes: modes,
      tag: null, // Always leave tag blank as requested
      originalLine: line
    };
  }

  parsePaymentModes(modeStr) {
    // Split by comma and clean up
    const modes = modeStr.split(',')
      .map(mode => mode.trim())
      .filter(mode => this.validModes.includes(mode));
    
    return modes.length > 0 ? modes : [modeStr.trim()]; // Fallback to original if no valid modes found
  }



  // Helper method to validate parsed expenses
  validateExpenses(expenses) {
    const errors = [];
    
    expenses.forEach((expense, index) => {
      if (!expense.title) {
        errors.push(`Expense ${index + 1}: Missing title`);
      }
      if (expense.amount === undefined || isNaN(expense.amount)) {
        errors.push(`Expense ${index + 1}: Invalid amount`);
      }
      if (!expense.date) {
        errors.push(`Expense ${index + 1}: Missing date`);
      }
      if (!expense.modes || expense.modes.length === 0) {
        errors.push(`Expense ${index + 1}: Missing payment mode`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = ExpenseParser; 