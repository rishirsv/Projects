# PRD – Net Worth Movement Insights Dashboard

*Product Requirements Document for implementing net worth tracking and investment-focused financial insights*

---

## 1. Introduction / Overview

Personal Capital currently focuses on transaction categorization and spending analysis, which is valuable but doesn't address the core financial driver for high net worth individuals: **net worth growth and investment performance**. For someone with ~$750k in assets, tracking whether they spent $100 more on restaurants is less impactful than understanding how their investment portfolio is performing and optimizing cash flow for maximum investment potential.

This feature creates a **Net Worth Movement Dashboard** that tracks monthly net worth progression, analyzes what's driving changes (investments vs spending), and provides actionable insights for optimizing financial growth rather than just expense management.

The goal is to shift focus from "How much did I spend?" to "How is my net worth growing and what's driving it?"

---

## 2. Goals

1. **Primary Goal**: Track monthly net worth progression with clear attribution to investments vs spending
2. **Investment Focus**: Monitor asset allocation and performance vs benchmarks (S&P 500, Bitcoin, etc.)
3. **Cash Flow Optimization**: Calculate investable surplus and opportunity cost of spending
4. **FI/FIRE Progress**: Track progress toward financial independence with timeline projections
5. **Actionable Insights**: Provide investment-focused recommendations rather than spending reduction tips

---

## 3. User Stories

| ID | User Story | Acceptance Criteria |
|----|------------|-------------------|
| U1 | *As a high net worth individual, I want to see my monthly net worth progression so I can track my financial growth trajectory* | Dashboard shows net worth trend line with monthly data points and % change |
| U2 | *As an investor, I want to understand what's driving my net worth changes so I can optimize my strategy* | Clear attribution showing investment gains vs spending impact on net worth |
| U3 | *As someone with a crypto-heavy portfolio, I want to monitor asset allocation drift so I can rebalance appropriately* | Visual asset allocation breakdown with alerts for significant drift |
| U4 | *As a FIRE-focused individual, I want to see how my spending affects my FI timeline so I can make informed trade-offs* | Cost-of-inaction analysis showing "spending $X delays FI by Y months" |
| U5 | *As a busy professional, I want automated insights about my financial performance so I don't have to manually analyze data* | Monthly insights generated automatically with key performance metrics |

---

## 4. Functional Requirements

### 4.1 Net Worth Tracking
1. **FR-1**: The system must allow manual entry of monthly net worth snapshots (total assets - total liabilities)
2. **FR-2**: The system must display net worth progression as a trend line chart over time
3. **FR-3**: The system must calculate and display month-over-month net worth change in both dollar amount and percentage
4. **FR-4**: The system must track net worth velocity (rate of change) with trend indicators

### 4.2 Asset Allocation Monitoring
5. **FR-5**: The system must allow users to categorize net worth by asset class (Cash, Stocks, Crypto, Real Estate, Other)
6. **FR-6**: The system must display current asset allocation as a pie chart with percentages
7. **FR-7**: The system must detect significant allocation drift (>5% from target) and provide alerts
8. **FR-8**: The system must allow users to set target asset allocation percentages

### 4.3 Investment Performance Analysis
9. **FR-9**: The system must calculate investment gains/losses impact on net worth changes
10. **FR-10**: The system must compare investment performance to benchmark indices (configurable)
11. **FR-11**: The system must separate investment performance from cash flow impact on net worth
12. **FR-12**: The system must provide rebalancing recommendations when allocation drifts significantly

### 4.4 Cash Flow Integration
13. **FR-13**: The system must calculate monthly cash flow surplus (income - expenses) from transaction data
14. **FR-14**: The system must show investable cash flow as a key metric
15. **FR-15**: The system must calculate opportunity cost of discretionary spending in investment terms
16. **FR-16**: The system must recommend optimal cash allocation based on available surplus

### 4.5 FI/FIRE Progress Tracking
17. **FR-17**: The system must allow users to set financial independence target (25x annual expenses or custom amount)
18. **FR-18**: The system must calculate and display progress toward FI goal as percentage and dollar amount
19. **FR-19**: The system must project timeline to reach FI based on current net worth growth rate
20. **FR-20**: The system must show impact of spending changes on FI timeline ("reducing spending by $X accelerates FI by Y months")

### 4.6 Dashboard and Reporting
21. **FR-21**: The system must provide a unified dashboard showing all key net worth metrics
22. **FR-22**: The system must generate automated monthly insights with key performance highlights
23. **FR-23**: The system must allow export of net worth data for external analysis
24. **FR-24**: The system must maintain historical data for trend analysis and performance tracking

---

## 5. Non-Goals (Out of Scope)

- **Real-time portfolio tracking** - Manual monthly snapshots only for MVP
- **Automatic bank/brokerage integration** - Manual data entry to start
- **Complex investment analytics** - Focus on high-level allocation and performance
- **Detailed spending optimization** - Investment focus, not expense micromanagement
- **Tax optimization features** - Pure net worth tracking without tax implications
- **Multi-currency support** - CAD only for initial version
- **Social features** - No sharing or comparison with others
- **Mobile-specific interface** - Google Sheets based solution

---

## 6. Design Considerations

### 6.1 User Interface
- **Dashboard Layout**: Single sheet with key metrics cards and charts
- **Color Coding**: Green for positive trends, red for negative, blue for neutral
- **Chart Types**: Line chart for net worth trend, pie chart for asset allocation
- **Progressive Disclosure**: Summary metrics with drill-down capability

### 6.2 Data Input Method
- **Manual Entry**: Simple form for monthly net worth snapshots
- **Validation**: Ensure data consistency and flag unusual changes
- **Historical Import**: Ability to backfill historical data

### 6.3 Integration Points
- **Transaction Data**: Leverage existing categorized transactions for cash flow analysis
- **Categorization System**: Use existing categories but focus on investment-relevant groupings

---

## 7. Technical Considerations

### 7.1 Data Architecture
- **New Sheet**: `NetWorth_Tracking` with columns: Date, TotalAssets, TotalLiabilities, NetWorth, Cash, Stocks, Crypto, RealEstate, Other
- **Integration**: Connect with existing transaction data for cash flow calculations
- **Caching**: Cache calculations for performance, refresh monthly

### 7.2 Calculation Engine
- **Performance**: Must handle 12+ months of data efficiently
- **Accuracy**: Financial calculations must be precise to 2 decimal places
- **Validation**: Check for data consistency and flag anomalies

### 7.3 Dependencies
- **Existing System**: Builds on current transaction categorization infrastructure
- **Google Charts**: For visualization components
- **Apps Script Limits**: Ensure calculations complete within execution time limits

---

## 8. Success Metrics

1. **User Engagement**: Monthly active usage of net worth dashboard
2. **Data Quality**: 95%+ of monthly snapshots entered consistently
3. **Insight Accuracy**: Net worth attribution analysis within 5% of actual causes
4. **Decision Impact**: User reports making 2+ investment decisions per quarter based on insights
5. **Time to Value**: Users gain actionable insights within 5 minutes of opening dashboard

---

## 9. Open Questions

1. **Benchmark Selection**: Which investment benchmarks should be included by default? (S&P 500, TSX, Bitcoin, etc.)
2. **Alert Thresholds**: What percentage changes should trigger rebalancing alerts? (5%, 10%, 15%?)
3. **FI Target Calculation**: Should we use 25x expenses rule or allow custom FI targets?
4. **Data Refresh Frequency**: Monthly snapshots or allow more frequent updates?
5. **Historical Data**: How many months of historical data should we support for trend analysis?
6. **Asset Categories**: Are Cash, Stocks, Crypto, Real Estate, Other sufficient or need more granular breakdown?
7. **Performance Comparison**: Should we compare against user's historical performance or just market benchmarks?
8. **Opportunity Cost Framing**: How should we present investment opportunity cost of spending? (monthly, annual, impact on FI timeline?)

---

## 10. Implementation Priority

### Phase 1 (MVP - Week 1-2)
- Basic net worth tracking with manual entry
- Simple trend visualization
- Asset allocation pie chart
- Month-over-month change calculation

### Phase 2 (Core Features - Week 3-4)
- Investment vs cash flow attribution
- FI progress tracking with timeline
- Automated monthly insights generation
- Integration with transaction cash flow data

### Phase 3 (Enhanced Analytics - Week 5-6)
- Benchmark performance comparison
- Rebalancing recommendations
- Opportunity cost calculations
- Advanced dashboard with multiple visualizations

---

*This PRD focuses on delivering maximum value for investment-focused users by tracking what matters most: net worth growth and the factors driving it.*