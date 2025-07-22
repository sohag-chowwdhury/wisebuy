# 🤖 AI Market Research Setup Guide

## **🚨 New Feature: Real Amazon & eBay Product Research**

Your dashboard now includes **AI-powered market research** that finds real Amazon and eBay product links using Claude and Gemini AI!

## **✨ What This Does**

- 🔍 **Smart Search**: Uses Claude AI to generate optimal search keywords
- 🛒 **Amazon Research**: Finds real Amazon product listings and prices
- 🏪 **eBay Research**: Finds real eBay listings with seller ratings
- 📊 **Market Analysis**: Calculates average prices, market demand, and insights
- 💾 **Database Storage**: Saves all research data to your `market_research_data` table

## **🛠️ Setup Instructions**

### **Step 1: Add New Database Columns**

Run this SQL in your Supabase SQL editor:

```sql
-- Run the entire sql/add_ebay_columns.sql file
-- This adds eBay, Facebook, Mercari columns + market analysis fields
```

### **Step 2: Add AI API Keys**

Add these environment variables to your `.env.local`:

```bash
# AI Services for Market Research
ANTHROPIC_API_KEY=your_claude_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Alternative names (fallbacks)
GOOGLE_AI_API_KEY=your_gemini_api_key_here
```

### **Step 3: Get API Keys**

**🤖 Claude API (Anthropic):**
1. Go to: https://console.anthropic.com/
2. Sign up/login
3. Go to API Keys → Create Key
4. Copy the key to `ANTHROPIC_API_KEY`

**🧠 Gemini API (Google):**
1. Go to: https://aistudio.google.com/app/apikey
2. Sign up/login with Google account
3. Create API key
4. Copy the key to `GEMINI_API_KEY`

## **🎯 How to Use**

### **1. From Dashboard**
- Go to your product dashboard
- Click the **"🔍 Research"** button on any product
- Wait for AI to find Amazon & eBay links
- View results in toast notification

### **2. API Endpoint**
```bash
# Start research for a product
POST /api/dashboard/products/{product_id}/research

# Get existing research data  
GET /api/dashboard/products/{product_id}/research
```

### **3. Database Data**
All research results are saved to `market_research_data` table:
- Amazon price & URL
- eBay price & URL with seller ratings
- Market demand analysis
- Price range calculations
- AI confidence scores
- Search keywords used

## **📊 What Gets Researched**

**🔍 For each product, AI finds:**

**Amazon Data:**
- Product listings with real URLs
- Current market prices
- Product conditions (new/used/refurbished)
- Confidence scores

**eBay Data:**
- Active listings with real URLs
- Seller ratings and feedback
- Sold listing counts
- Shipping costs

**Market Analysis:**
- Average market price
- Price range (min/max)
- Market demand level (high/medium/low) 
- Competitor count
- Recommended pricing
- AI insights and recommendations

## **🎛️ Advanced Configuration**

### **Custom Search Strategy**
The AI automatically:
- Generates smart search keywords
- Tries multiple search variations
- Includes brand + model combinations
- Uses category-specific terms

### **Market Analysis Features**
- **Demand Detection**: Analyzes listing counts and pricing
- **Price Optimization**: Suggests competitive pricing
- **Trend Analysis**: Identifies market patterns
- **Confidence Scoring**: Rates data accuracy

### **Error Handling**
- Automatic fallbacks if APIs fail
- Graceful degradation with partial data
- Retry logic for temporary failures
- Comprehensive error logging

## **💡 Tips for Best Results**

1. **Good Product Names**: More specific = better results
   - ✅ "Apple iPhone 13 Pro Max 128GB"  
   - ❌ "Phone"

2. **Include Model Numbers**: Helps AI find exact matches
   - ✅ "Sony WH-1000XM4 Wireless Headphones"
   - ❌ "Sony Headphones"

3. **Set Brand/Category**: Improves search accuracy
   - Use product brand and category fields

4. **Monitor API Usage**: Both Claude and Gemini have usage limits
   - Check your API dashboards regularly

## **🔧 Troubleshooting**

**"Research failed" errors:**
- Check your API keys are correct
- Verify API keys have sufficient credits
- Check network connectivity

**No results found:**
- Product name might be too vague
- Try adding more specific details
- Check if product exists on Amazon/eBay

**Database errors:**
- Run the SQL schema updates
- Check Supabase connection
- Verify table permissions

## **📈 Database Schema**

The `market_research_data` table now includes:

```sql
-- Core marketplace data
amazon_price, amazon_link, amazon_url_status
ebay_price, ebay_link, ebay_seller_rating, ebay_condition
facebook_price, mercari_price

-- Market analysis  
average_market_price, price_range_min, price_range_max
market_demand, competitor_count, ai_confidence
trending_score, seasonal_factor

-- Metadata
search_keywords[], marketplace_urls (JSON)
research_sources[], last_price_check
```

## **🚀 Next Steps**

1. **Run the SQL updates**
2. **Add your API keys**  
3. **Test with a product**
4. **Check the results in database**
5. **Integrate with your pipeline**

Your dashboard now has **real-time AI market research**! 🎉

**Questions?** Check the logs for detailed research progress and results. 