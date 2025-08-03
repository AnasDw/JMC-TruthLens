# TruthLens AI - Fact-Checking Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.26.7-1677ff)](https://ant.design/)

TruthLens AI is a cutting-edge fact-checking platform that uses advanced AI technology to verify the truthfulness of statements, news articles, and claims. Built with modern web technologies, it provides real-time fact verification with source attribution and credibility scoring.

## ✨ Features

- 🤖 **AI-Powered Verification** - Advanced fact-checking with multiple source verification
- ⚡ **Instant Analysis** - Get comprehensive results in seconds
- 🔍 **Transparent Sources** - Clear attribution and credibility scores
- 📊 **Real-time Progress** - Live task tracking with step-by-step updates
- 📱 **Responsive Design** - Modern UI that works on all devices
- 📚 **Verification History** - Browse and review past fact-checks
- 🎨 **Modern UI/UX** - Beautiful, intuitive interface with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun package manager
- TruthLens AI Backend API running (default: http://localhost:8000)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AnasDw/JMC-TruthLens.git
   cd TruthLens/website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.4.5](https://nextjs.org/) with TypeScript
- **UI Components**: [Ant Design 5.26.7](https://ant.design/)
- **Animations**: [Framer Motion 12.23.12](https://www.framer.com/motion/)
- **State Management**: [TanStack React Query 5.84.1](https://tanstack.com/query)
- **Icons**: [Ant Design Icons 6.0.0](https://ant.design/components/icon)
- **Styling**: CSS-in-JS with Ant Design theming

## 📁 Project Structure

```
src/
├── features/            # Feature-specific components
│   ├── components/      # Shared feature components
│   └── fact-check/      # Fact-checking feature
│       ├── components/
│       ├── hooks/
│       └── types/
├── hooks/               # Custom React hooks
├── pages/               # Next.js pages
│   ├── api/            # API routes
│   ├── _app.tsx        # App configuration
│   └── index.tsx       # Home page
├── styles/              # Global styles
└── types/               # TypeScript type definitions
```

## 🎨 Design System

The application uses a consistent design system with:

- **Primary Color**: `#764ba2` (Purple gradient)
- **Secondary Color**: `#667eea` (Blue gradient)
- **Typography**: Modern font stack with proper hierarchy
- **Spacing**: Consistent 8px grid system
- **Animations**: Smooth transitions with Framer Motion
- **Theme**: Customized Ant Design theme

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### API Integration

The frontend communicates with the TruthLens AI backend API:

- **Fact Check**: `POST /api/verify/text`
- **Task Status**: `GET /api/task/{task_id}/status`
- **Task History**: `GET /api/tasks/`

## 📱 Features Overview

### Fact-Checking Interface
- Clean, modern input interface
- Real-time validation
- Support for various content types

### Progress Tracking
- Visual step-by-step progress indicator
- Real-time status updates
- Error handling with retry options

### Results Display
- Color-coded verification results
- Detailed analysis with source attribution
- Interactive reference links
- Safety indicators

### History Management
- Browse past verification requests
- Filter by status and date
- Quick access to previous results

## 🎯 Usage

1. **Submit Content**: Enter any statement, claim, or news article
2. **Track Progress**: Watch real-time analysis progress
3. **Review Results**: Get detailed verification with sources
4. **Browse History**: Access past verifications anytime

## 🔨 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

The project follows:
- TypeScript strict mode
- ESLint configuration
- Prettier formatting (recommended)
- Component-first architecture


## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Ant Design](https://ant.design/) for the beautiful UI components
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [TanStack Query](https://tanstack.com/query) for data fetching


## 👥 Authors

<div >

### 🚀 Development Team

<table align="center">
<tr>
<td align="center" width="50%">
<a href="https://github.com/Anas-Emad-Dweik">
<img src="https://github.com/Anas-Emad-Dweik.png" width="120px" alt="Anas Dweik" style="border-radius: 50%;"/>
</a>
<br/>
<h3>💻 Anas Dweik</h3>
<p><strong>Full Stack Developer</strong></p>
<p><em>Backend Specialist</em></p>

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Anas-Emad-Dweik)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:aansdw@edu.jmc.ac.il)

**Student ID:** `322362013`

<details>
<summary>🛠️ <strong>Key Contributions</strong></summary>

- 🏗️ **Backend Architecture** - Spring Boot setup & configuration
- 🔐 **Security Implementation** - Authentication & authorization
- 📊 **Database Design** - Entity modeling & relationships
- 🛒 **Order Management** - Checkout flow & order processing
- 📱 **API Development** - RESTful endpoints & controllers

</details>
</td>

<td align="center" width="50%">
<a href="https://github.com/Amr-Shwieky2">
<img src="https://github.com/Amr-Shwieky2.png" width="120px" alt="Amr Shwiki" style="border-radius: 50%;"/>
</a>
<br/>
<h3>🎨 Amr Shwiki</h3>
<p><strong>Full Stack Developer</strong></p>
<p><em>Frontend Specialist</em></p>

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Amr-Shwieky2)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:amrsh@edu.jmc.ac.il)

**Student ID:** `212443485`

<details>
<summary>🛠️ <strong>Key Contributions</strong></summary>

- 🎨 **UI/UX Design** - Modern responsive interface design
- 🌐 **Frontend Development** - Thymeleaf templates & styling
- 📱 **JavaScript Features** - Cart functionality & interactions
- 🎯 **User Experience** - Navigation & user flow optimization
- 📋 **Testing & QA** - Frontend testing & bug fixes

</details>
</td>
</tr>
</table>

</div>

<div align="center">

---
