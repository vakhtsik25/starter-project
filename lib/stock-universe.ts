// A curated set of well-known, long-established US large-caps — not the
// full market. Screening thousands of tickers would mean thousands of Yahoo
// requests per page load; this list is sized to stay fast and reliable.
// Extend it by adding entries here; no other file needs to change.
export type StockEntry = { ticker: string; name: string; industry: string };

export const STOCK_UNIVERSE: StockEntry[] = [
  // Technology
  { ticker: "AAPL", name: "Apple Inc.", industry: "Technology" },
  { ticker: "MSFT", name: "Microsoft Corp.", industry: "Technology" },
  { ticker: "NVDA", name: "NVIDIA Corp.", industry: "Technology" },
  { ticker: "GOOGL", name: "Alphabet Inc.", industry: "Technology" },
  { ticker: "META", name: "Meta Platforms Inc.", industry: "Technology" },

  // Financials
  { ticker: "JPM", name: "JPMorgan Chase & Co.", industry: "Financials" },
  { ticker: "BAC", name: "Bank of America Corp.", industry: "Financials" },
  { ticker: "GS", name: "Goldman Sachs Group Inc.", industry: "Financials" },
  { ticker: "V", name: "Visa Inc.", industry: "Financials" },
  { ticker: "MA", name: "Mastercard Inc.", industry: "Financials" },

  // Healthcare
  { ticker: "JNJ", name: "Johnson & Johnson", industry: "Healthcare" },
  { ticker: "UNH", name: "UnitedHealth Group Inc.", industry: "Healthcare" },
  { ticker: "PFE", name: "Pfizer Inc.", industry: "Healthcare" },
  { ticker: "LLY", name: "Eli Lilly and Co.", industry: "Healthcare" },
  { ticker: "ABBV", name: "AbbVie Inc.", industry: "Healthcare" },

  // Consumer Discretionary
  { ticker: "AMZN", name: "Amazon.com Inc.", industry: "Consumer Discretionary" },
  { ticker: "TSLA", name: "Tesla Inc.", industry: "Consumer Discretionary" },
  { ticker: "HD", name: "Home Depot Inc.", industry: "Consumer Discretionary" },
  { ticker: "MCD", name: "McDonald's Corp.", industry: "Consumer Discretionary" },
  { ticker: "NKE", name: "Nike Inc.", industry: "Consumer Discretionary" },

  // Consumer Staples
  { ticker: "PG", name: "Procter & Gamble Co.", industry: "Consumer Staples" },
  { ticker: "KO", name: "Coca-Cola Co.", industry: "Consumer Staples" },
  { ticker: "PEP", name: "PepsiCo Inc.", industry: "Consumer Staples" },
  { ticker: "WMT", name: "Walmart Inc.", industry: "Consumer Staples" },
  { ticker: "COST", name: "Costco Wholesale Corp.", industry: "Consumer Staples" },

  // Energy
  { ticker: "XOM", name: "Exxon Mobil Corp.", industry: "Energy" },
  { ticker: "CVX", name: "Chevron Corp.", industry: "Energy" },
  { ticker: "COP", name: "ConocoPhillips", industry: "Energy" },

  // Industrials
  { ticker: "BA", name: "Boeing Co.", industry: "Industrials" },
  { ticker: "CAT", name: "Caterpillar Inc.", industry: "Industrials" },
  { ticker: "GE", name: "GE Aerospace", industry: "Industrials" },
  { ticker: "UPS", name: "United Parcel Service Inc.", industry: "Industrials" },

  // Communication Services
  { ticker: "DIS", name: "Walt Disney Co.", industry: "Communication Services" },
  { ticker: "NFLX", name: "Netflix Inc.", industry: "Communication Services" },
  { ticker: "CMCSA", name: "Comcast Corp.", industry: "Communication Services" },
];
