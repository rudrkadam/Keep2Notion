![Keep2Icon](public/title.png)

# Keep2Notion

Automate the transfer of your daily expenses from Google Keep Notes to your Notion database.

## ✨ Features

- **Simple Web Interface**: Easy-to-use local web application
- **Smart Parsing**: Automatically extracts expenses, amounts, dates, and payment modes from your Google Keep text
- **Notion Integration**: Seamlessly uploads parsed expenses to your Notion database
- **Preview Before Upload**: Review and verify parsed expenses before sending to Notion
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 📋 Prerequisites

- Node.js (version 14 or higher)
- A Notion account with a database for expenses
- Google Keep notes with your expense data

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
# Clone or download this project
cd Keep2Notion

# Install required packages
npm install
```

### 2. Set Up Notion Integration

1. **Create Notion Integration**:
   - Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
   - Click "New integration"
   - Give it a name (e.g., "Keep2Notn")
   - Copy the "Internal Integration Secret" token

2. **Share Your Database**:
   - Open your Notion expense database
   - Click on more options, then "Connections" → "Add connection"
   - Search for your integration name and add it

3. **Get Database URL**:
   - Copy the URL of your Notion database (`Ctrl + L`)

### 3. Notion Database Structure

Your Notion database should have these columns (property types):

| Column Name | Property Type | Options |
|-------------|---------------|---------|
| **Date** | Date | - |
| **Amount** | Number | - |
| **Tag** | Select | Food & Drinks, College, Recharge / Bill, Entertainment, Travel, Subscription, Shopping, Miscellaneous |
| **Title** | Title | - |
| **Mode** | Multi-select | UPI, Cash, Card, IMPS, Bank A/C |
| **Type** | Select | +, - |

## ⚡️ Running the Application

```bash
npm start
```

The application will start on `http://localhost:3000`

## 📖 Usage Guide

### Step 1: Configure Notion
1. Enter your Notion Integration Secret Token
2. Paste your Notion database URL
3. Click "Test Connection"

### Step 2: Paste Google Keep Text
Format your Google Keep notes like this:
```
Wednesday, 25th June
• Bus Ticket - 20 (Cash)
• Metro Ticket - 22 (Card)
• Breakfast - 50 (UPI)
• Amazon Refund - +200 (Bank A/C)

Thursday, 26th June
• Cold Coffee - 50 (UPI)
• Auto Rickshaw - 100 (UPI)
• Mom - +5000 (IMPS)
```

### Step 3: Review Parsed Data
- Check if expenses are parsed correctly
- Verify amounts and payment modes

### Step 4: Upload to Notion
- Click "Upload to Notion" to transfer all expenses
- View the upload results and summary

## 📝 Google Keep Format Rules

- **Date Format**: `Day, DDth Month` (e.g., "Monday, 23rd June")
- **Expense Format**: `• Description - Amount (PaymentMode)`
- **Spend**: `42` (no plus sign) → Negative amount in Notion
- **Gain**: `+500` (with plus sign) → Positive amount in Notion
- **Payment Modes**: UPI, Cash, Card, IMPS, Bank A/C