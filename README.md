# TruthLens AI

An Advanced Fake News Detection system packaged as a browser extension.

## Setup and Execution

### Prerequisites

- Docker and Docker Compose
- Node.js 18.x or higher (for website)
- Python 3.12+ (for backend)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/AnasDw/JMC-TruthLens.git
   cd TruthLens
   ```

2. **Start the database services**
   ```bash
   docker-compose up -d
   ```
   This will start:
   - MongoDB on port 27017
   - Mongo Express (database UI) on port 8081

3. **Set up and run the backend**
   
   Follow the detailed instructions in [backend/README.md](./backend/README.md) to:
   - Install Python dependencies with Poetry
   - Configure environment variables (API keys, etc.)
   - Start the server

4. **Set up and run the website**
   
   Follow the instructions in [website/README.md](./website/README.md) to:
   - Install Node.js dependencies
   - Start the Next.js development server
   - Access the web interface at http://localhost:3000


### Services Overview

- **Backend API**: http://localhost:8000 (FastAPI server)
- **Website**: http://localhost:3000 (Next.js app)
- **Database UI**: http://localhost:8081 (Mongo Express)
- **MongoDB**: localhost:27017


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