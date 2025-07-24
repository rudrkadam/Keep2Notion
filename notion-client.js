const { Client } = require('@notionhq/client');

class NotionClient {
  constructor(token, databaseId) {
    this.notion = new Client({
      auth: token,
    });
    this.databaseId = databaseId;
  }

  async testConnection() {
    try {
      const database = await this.notion.databases.retrieve({
        database_id: this.databaseId
      });
      console.log('✅ Successfully connected to Notion database:', database.title[0]?.text?.content || 'Untitled');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Notion:', error.message);
      return false;
    }
  }

  async getDatabaseSchema() {
    try {
      const database = await this.notion.databases.retrieve({
        database_id: this.databaseId
      });
      
      const schema = {};
      Object.entries(database.properties).forEach(([name, prop]) => {
        schema[name] = {
          type: prop.type,
          options: this.getPropertyOptions(prop)
        };
      });
      
      // Extract the database title (name)
      const title = database.title && database.title.length > 0
        ? database.title[0].text.content
        : 'Untitled';
      
      return { title, schema };
    } catch (error) {
      console.error('❌ Error fetching database schema:', error.message);
      throw error;
    }
  }

  getPropertyOptions(property) {
    switch (property.type) {
      case 'select':
        return property.select?.options?.map(opt => opt.name) || [];
      case 'multi_select':
        return property.multi_select?.options?.map(opt => opt.name) || [];
      default:
        return null;
    }
  }

  async addExpense(expense) {
    try {
      const properties = this.formatExpenseProperties(expense);
      
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties: properties,
      });

      console.log(`✅ Added expense: ${expense.title} - ${expense.amount >= 0 ? '+' : ''}${expense.amount}`);
      return response;
    } catch (error) {
      console.error(`❌ Error adding expense "${expense.title}":`, error.message);
      throw error;
    }
  }

  formatExpenseProperties(expense) {
    const properties = {};

    // Date property
    if (expense.date) {
      properties['Date'] = {
        date: {
          start: expense.date
        }
      };
    }

    // Amount property (negative for spend, positive for gain)
    if (expense.amount !== undefined) {
      properties['Amount'] = {
        number: expense.amount
      };
    }

    // Title property
    if (expense.title) {
      properties['Title'] = {
        title: [
          {
            text: {
              content: expense.title
            }
          }
        ]
      };
    }

    // Tag property (always left blank)
    if (expense.tag) {
      properties['Tag'] = {
        select: {
          name: expense.tag
        }
      };
    }

    // Mode property (multi-select for payment methods)
    if (expense.modes && expense.modes.length > 0) {
      properties['Mode'] = {
        multi_select: expense.modes.map(mode => ({ name: mode }))
      };
    }

    // Type property ("+" for gain, "-" for spend)
    if (expense.type) {
      properties['Type'] = {
        select: {
          name: expense.type
        }
      };
    }

    return properties;
  }
}

module.exports = NotionClient; 