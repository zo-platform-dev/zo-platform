# User Guide - ZO Platform

Complete guide to using ZO Platform for web scraping and automation.

---

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Creating Tasks](#creating-tasks)
4. [Using Templates](#using-templates)
5. [Viewing Results](#viewing-results)
6. [API Keys](#api-keys)
7. [Settings](#settings)
8. [Advanced Features](#advanced-features)
9. [Tips & Best Practices](#tips--best-practices)
10. [FAQ](#faq)

---

## 🚀 Getting Started

### Creating Your Account

1. Navigate to ZO Platform URL
2. Click **Sign Up**
3. Enter your details:
   - Full Name
   - Email Address
   - Password (minimum 6 characters)
4. Click **Create Account**
5. You'll be automatically logged in

### First Login

1. Go to the login page
2. Enter your email and password
3. Click **Login**
4. You'll see the Dashboard

---

## 📊 Dashboard Overview

The dashboard provides an overview of your scraping activities:

### Statistics Cards
- **Total Tasks**: All tasks you've created
- **Completed**: Successfully completed tasks
- **Running**: Currently executing tasks
- **Failed**: Tasks that encountered errors

### Recent Tasks
- View your 5 most recent tasks
- Click on any task to see details
- See task status at a glance

### Statistics Chart
- Visual representation of task statuses
- Bar chart showing distribution

---

## 📝 Creating Tasks

### Basic Task Creation

1. Navigate to **Tasks** page
2. Click **Create Task** button
3. Fill in the form:

#### Required Fields

**Task Name**
- Give your task a descriptive name
- Example: "Daily News Scraping"

**Type**
- **Web Scrape**: Extract data from websites
- **API**: Call external APIs
- **Automation**: Run automated workflows
- **Custom**: Execute custom code

**Method**
- **Cheerio**: Fast, lightweight (static content)
- **Puppeteer**: Full browser (dynamic content)
- **Axios**: Simple HTTP requests
- **Playwright**: Modern browser automation

**URL**
- The website or API endpoint to scrape
- Example: `https://example.com/products`

#### Optional Fields

**Description**
- Add notes about what this task does
- Helps you remember the purpose

**Selectors** (for web scraping)
- CSS selectors to extract specific data
- JSON format:
```json
{
  "title": ".product-title",
  "price": ".product-price",
  "image": ".product-image"
}
```

**Schedule**
- Enable to run automatically
- Use cron expressions:
  - Daily at 9 AM: `0 9 * * *`
  - Every 6 hours: `0 */6 * * *`
  - Weekly on Monday: `0 9 * * 1`

### Example: Scraping Product Prices

```
Name: Amazon Price Monitor
Type: Web Scrape
Method: Puppeteer
URL: https://amazon.com/dp/B08N5WRWNW

Selectors:
{
  "title": "#productTitle",
  "price": ".a-price-whole",
  "rating": ".a-icon-star",
  "availability": "#availability span"
}

Schedule: 0 */6 * * * (Every 6 hours)
```

### Running a Task

1. Go to **Tasks** page
2. Find your task
3. Click the **Run** button (▶️)
4. Task status changes to "Running"
5. Wait for completion

---

## 📋 Using Templates

Templates are pre-configured scraping setups for common websites.

### Browse Templates

1. Navigate to **Templates** page
2. Filter by category:
   - Social Media
   - E-commerce
   - News
   - Jobs
   - Real Estate
   - Travel
   - Finance

### Use a Template

1. Click on a template card
2. Click **Use Template**
3. Customize the task name
4. Adjust URL if needed
5. Click **Create**
6. Run the task

### Create Your Own Template

1. Create a successful task first
2. Go to **Templates** page
3. Click **Create Template**
4. Fill in template details
5. Toggle **Make Public** to share with others

---

## 📊 Viewing Results

### Task Results Page

1. Navigate to **Tasks**
2. Click on a completed task
3. View the **Results** section

### Result Information

- **Total Items**: Number of items scraped
- **Duration**: Time taken to complete
- **Version**: Result version number
- **Timestamp**: When the scraping occurred

### Exporting Data

1. Go to task details
2. Click **Export** button
3. Choose format:
   - **JSON**: Raw data format
   - **CSV**: Excel-compatible
   - **XML**: XML format
   - **Excel**: .xlsx format
4. Click **Download**

### Data Preview

- View scraped data in JSON format
- Browse through results
- Check data quality

---

## 🔑 API Keys

API keys allow external access to ZO Platform.

### Creating an API Key

1. Navigate to **API Keys** page
2. Click **Create API Key**
3. Enter a name (e.g., "n8n Integration")
4. Click **Create**
5. **Copy the key immediately** (you won't see it again)

### Using API Keys

**In HTTP Requests:**
```bash
curl -H "Authorization: Bearer zo_your_api_key_here" \
     https://your-zo-platform.com/api/tasks
```

**In n8n:**
- Add HTTP Request node
- Authentication: Header Auth
- Header Name: `Authorization`
- Header Value: `Bearer zo_your_api_key_here`

### Managing API Keys

- **Last Used**: See when key was last accessed
- **Rotate**: Generate new key with same name
- **Delete**: Remove key (cannot be undone)

---

## ⚙️ Settings

### Account Settings

**Profile**
- Update your name
- Change email address
- Save changes

**Security**
- Change password
- Requires current password
- New password must be 6+ characters

### Preferences

**Language**
- Switch between English and Arabic (العربية)
- Interface adjusts to RTL/LTR automatically

**Theme**
- Light mode (default)
- Dark mode (coming soon)

**Notifications**
- Email notifications for task completion
- Webhook notifications for integrations

---

## 🎯 Advanced Features

### Proxy Configuration

For websites that block scrapers:

1. Edit task
2. Enable **Proxy**
3. Enter proxy details:
   - Host
   - Port
   - Username (optional)
   - Password (optional)

### Custom Code Execution

For complex scraping logic:

1. Select **Type**: Custom
2. Add custom JavaScript:
```javascript
// Custom scraping code
const data = await page.evaluate(() => {
  return {
    title: document.querySelector('h1').textContent,
    items: Array.from(document.querySelectorAll('.item')).map(el => ({
      name: el.querySelector('.name').textContent,
      price: el.querySelector('.price').textContent
    }))
  };
});

// Set result
result = data;
```

### Retry Configuration

Automatically retry failed tasks:

1. Edit task
2. Enable **Retry**
3. Set **Max Attempts** (default: 3)
4. Failed tasks retry with exponential backoff

### Webhooks

Get notified when tasks complete:

1. Navigate to **Webhooks** page
2. Create webhook with your URL
3. Select events:
   - Task Completed
   - Task Failed
   - Data Refreshed
4. Receive POST requests with results

---

## 💡 Tips & Best Practices

### Choosing the Right Method

**Use Cheerio when:**
- Scraping static HTML
- Need fast performance
- Low resource usage

**Use Puppeteer when:**
- Content loads with JavaScript
- Need to interact with page
- Handle dynamic content

**Use Axios when:**
- Calling APIs
- Simple HTTP requests
- No HTML parsing needed

### Writing Good Selectors

**Do:**
- Use specific classes: `.product-title`
- Use IDs when available: `#main-content`
- Test selectors in browser DevTools

**Don't:**
- Use too generic selectors: `div`
- Rely on element position: `div:nth-child(3)`
- Use inline styles as selectors

### Avoiding Blocks

1. **Use realistic User-Agent strings**
2. **Add delays between requests**
3. **Rotate proxies**
4. **Respect robots.txt**
5. **Don't scrape too frequently**

### Scheduling Best Practices

- Schedule during off-peak hours
- Don't overload target servers
- Use appropriate intervals
- Consider timezone differences

---

## ❓ FAQ

### How often can I run tasks?

Free tier: Unlimited, but please be respectful of target websites.

### Can I scrape any website?

You can scrape public data, but:
- Respect Terms of Service
- Follow robots.txt
- Don't scrape personal data without permission
- Be ethical

### What if my task fails?

1. Check the error message
2. Verify the URL is accessible
3. Test selectors in browser
4. Enable retry mechanism
5. Contact support if needed

### How do I export large datasets?

Use pagination or batch processing:
- Scrape in smaller chunks
- Export each batch separately
- Combine results later

### Can I scrape authenticated websites?

Yes, with custom code:
- Add login logic
- Store session cookies
- Include authentication headers

### How do I handle CAPTCHA?

Options:
- Use CAPTCHA solving services
- Implement delays
- Use residential proxies
- Consider API alternatives

### What's the data retention policy?

- Results stored indefinitely
- Can delete anytime
- Export before deleting tasks

### Can I share templates?

Yes! Make templates public to share with the community.

### How do I get support?

- Check documentation
- Search FAQ
- Open GitHub issue
- Email support@zo-platform.com
- Join Discord community

---

## 🎓 Tutorials

### Tutorial 1: Scraping News Headlines

**Goal**: Get latest news from a news website

1. Create new task
2. Name: "BBC News Headlines"
3. URL: `https://bbc.com/news`
4. Method: Cheerio
5. Selectors:
```json
{
  "headline": ".gs-c-promo-heading__title",
  "link": ".gs-c-promo-heading",
  "time": "time"
}
```
6. Run and view results

### Tutorial 2: Monitoring Product Availability

**Goal**: Check if product is in stock

1. Create task: "Product Stock Monitor"
2. URL: Product page URL
3. Method: Puppeteer
4. Selectors:
```json
{
  "availability": ".a-size-medium.a-color-success",
  "price": ".a-price-whole"
}
```
5. Schedule: Every 6 hours
6. Enable notifications

### Tutorial 3: Aggregating Job Listings

**Goal**: Collect jobs from multiple sites

1. Create template for each job site
2. Use template for consistent scraping
3. Schedule all tasks
4. Export and combine results
5. Set up daily email notifications

---

## 📞 Support Resources

- **Documentation**: Full docs at docs.zo-platform.com
- **API Reference**: api-docs at your-domain.com/api-docs
- **GitHub**: github.com/zo-platform
- **Community**: Discord and forums
- **Email**: support@zo-platform.com

---

**Happy Scraping! 🚀**

*Last Updated: October 2026*