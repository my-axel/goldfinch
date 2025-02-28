# 🐦 Goldfinch

Goldfinch is a sophisticated retirement planning platform that empowers individuals and families to take control of their financial future. Built with modern technology and designed for transparency, it provides comprehensive management of diverse pension types (ETF, Company, Insurance), real-time portfolio tracking, and intelligent retirement strategies. With features like multi-currency support, smart analytics, and personalized recommendations, Goldfinch transforms complex retirement planning into a structured, accessible journey for everyone.

## 🚀 Main Features

### Dashboard
- **Portfolio Overview**: Complete view of your retirement journey
  - Total portfolio value and growth rates
  - Contribution tracking and investment returns
  - Historical performance analysis
  - Quick actions for common tasks

### Household Management
- **Family Planning**: Manage retirement planning for the whole family
  - Add and manage household members
  - Track individual and combined portfolios
  - View household-level analytics
  - Customize settings per member

### Pension Plans
- **ETF-Based Pensions**: Create and manage ETF investment portfolios
  - Real-time ETF data integration
  - Performance tracking and analytics
  - Contribution planning and monitoring
  - Multi-currency support with automatic exchange rates
- **Company Pensions**: Track employer-provided retirement benefits
  - Record and monitor company contributions
  - Track vesting schedules
  - Document benefit terms
- **Insurance Pensions**: Manage insurance-based retirement products
  - Track policy values and returns
  - Monitor premium payments
  - Document policy terms and conditions

### Compass
- **Retirement Navigation**: Smart analysis and guidance
  - Gap analysis tools
  - Personalized recommendations
  - Interactive retirement planning
  - Risk assessment and optimization

### Payout Strategy
- **Retirement Income Planning**: Plan your retirement withdrawals
  - Timeline visualization
  - Scenario planning
  - Withdrawal strategy optimization
  - Tax-efficient distribution planning

## ⚙️ Core Features

### Currency Management
- **Multi-Currency Support**: Comprehensive handling of international currencies with EUR as base
- **Real-Time Exchange Rates**: Daily updates from European Central Bank (ECB)
- **Historical Rate Data**: Access to exchange rates dating back to 1999
- **Automatic Conversion**: Seamless currency conversion for all financial calculations

### Data Formatting
- **Locale-Aware Formatting**: Intelligent number and date formatting based on user locale
- **Currency Display**: Proper currency symbol placement and formatting
- **Percentage Handling**: Standardized percentage formatting across the application
- **Date Standardization**: Consistent date formatting with timezone support

### Calculation Engine
- **Projection System**: Sophisticated retirement projection calculations with multiple scenarios
- **Monthly Compounding**: Accurate interest calculations with monthly compounding
- **Contribution Tracking**: Detailed tracking of regular and one-time contributions
- **Performance Analytics**: Comprehensive performance metrics and statistics

### User Experience
- **Responsive Design**: Fully responsive interface optimized for all device sizes
- **Real-Time Updates**: Immediate reflection of changes in calculations and projections
- **Data Validation**: Comprehensive input validation and error handling
- **Accessibility**: WCAG-compliant interface with full keyboard navigation

## 💻 Tech Stack

### Frontend
- **Next.js 15** with App Router and TurboPack
- **React 19** with Server Components
- **TypeScript 5**
- **Tailwind CSS 4** with PostCSS 8
- **Radix UI** components with Shadcn UI (Canary)
- **Recharts** for data visualization
- **React Hook Form** with Zod validation
- **Axios** for API communication

### Backend
- **FastAPI** with Pydantic 2
- **SQLAlchemy 2.0** with async support
- **Alembic** for database migrations
- **Celery 5.4** with RabbitMQ for task processing
- **YFinance** for ETF data integration
- **PostgreSQL** for data persistence
- **Uvicorn** for ASGI server

## 🗺️ Roadmap

> For detailed progress tracking, implementation status, and upcoming features, see [PROGRESS.md](PROGRESS.md)

### Current Focus
- Completing core pension management features
- Implementing the central dashboard
- Building the currency and internationalization system

### Key Milestones
1. Core Dashboard Implementation
2. Complete Pension Plans Integration
3. Compass Feature Development
4. Payout Strategy Implementation

### Long-Term Vision
- Advanced analytics with machine learning
- Extended asset class support
- Enhanced automation and integrations
- Mobile application development

## 🛠️ Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL

### Setup
1. Clone the repository
2. Install frontend dependencies: `npm install`
3. Install backend dependencies: `pip install -r src/backend/requirements.txt`
4. Set up environment variables
5. Run database migrations: `alembic upgrade head`
6. Start the development server: `npm run dev`

## 📝 License

This project is open-source software licensed under the MIT license.
