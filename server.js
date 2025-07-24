require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const NotionClient = require('./notion-client');
const ExpenseParser = require('./expense-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test Notion connection
app.post('/api/test-notion', async (req, res) => {
  try {
    const { notionToken, databaseUrl } = req.body;
    
    if (!notionToken || !databaseUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Notion token and database URL are required' 
      });
    }

    const databaseId = extractDatabaseId(databaseUrl);
    const notionClient = new NotionClient(notionToken, databaseId);
    
    const isConnected = await notionClient.testConnection();
    
    if (isConnected) {
      const { title, schema } = await notionClient.getDatabaseSchema();
      res.json({ 
        success: true, 
        message: 'Successfully connected to Notion database!',
        databaseName: title,
        schema: schema
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Failed to connect to Notion database' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Parse Keep notes
app.post('/api/parse-expenses', async (req, res) => {
  try {
    const { keepText } = req.body;
    
    if (!keepText) {
      return res.status(400).json({ 
        success: false, 
        error: 'Keep text is required' 
      });
    }

    const parser = new ExpenseParser();
    const expenses = parser.parseKeepNotes(keepText);
    
    res.json({ 
      success: true, 
      expenses: expenses,
      count: expenses.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Upload expenses to Notion
app.post('/api/upload-expenses', async (req, res) => {
  try {
    const { notionToken, databaseUrl, expenses } = req.body;
    
    if (!notionToken || !databaseUrl || !expenses) {
      return res.status(400).json({ 
        success: false, 
        error: 'Notion token, database URL, and expenses are required' 
      });
    }

    const databaseId = extractDatabaseId(databaseUrl);
    const notionClient = new NotionClient(notionToken, databaseId);
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const expense of expenses) {
      try {
        const result = await notionClient.addExpense(expense);
        results.push({ success: true, expense: expense.title });
        successCount++;
      } catch (error) {
        results.push({ 
          success: false, 
          expense: expense.title, 
          error: error.message 
        });
        errorCount++;
      }
    }

    res.json({ 
      success: true, 
      message: `Successfully uploaded ${successCount} expenses. ${errorCount} failed.`,
      results: results,
      summary: {
        total: expenses.length,
        success: successCount,
        errors: errorCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Helper function to extract database ID from Notion URL
function extractDatabaseId(url) {
  // Handle various Notion URL formats
  const patterns = [
    /notion\.so\/.*?([a-f0-9]{32})/i,
    /notion\.so\/.*?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1].replace(/-/g, '');
    }
  }
  
  throw new Error('Invalid Notion database URL. Please check the URL format.');
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Keep2Notion server running on http://localhost:${PORT}`);
  console.log(`📝 Open your browser and visit the URL above to start transferring expenses!`);
}); 