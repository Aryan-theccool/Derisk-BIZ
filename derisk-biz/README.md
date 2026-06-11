# DeRisk.biz — Corporate Governance & Risk Intelligence Platform 🛡️

[![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20MongoDB%20%7C%20Vanilla%20JS-blue)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas%20%7C%20Local%20JSON-green)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-MIT-purple)](#)
[![Deployment](https://img.shields.io/badge/Deployable-Render%20%7C%20Heroku%20%7C%20VPS-orange)](#)

A high-performance, mobile-responsive assessment platform designed to identify hidden governance vulnerabilities and legal risks. Built with **zero heavy frameworks** to ensure near-zero load times, premium typography, and a modern, high-contrast dark financial-technology design language.

---

## 🗺️ System Architecture

```mermaid
graph TD
    Client[User Browser]
    Admin[Admin Panel /admin]
    Express[Express.js Server]
    Mongo[MongoDB Atlas Cloud]
    LocalDB[Local JSON Fallback data/local-db.json]

    Client -->|Submissions & Contact Form| Express
    Admin -->|API Requests with X-Admin-Token| Express
    Express -->|Primary Storage| Mongo
    Express -.->|Automatic Fallback if Offline| LocalDB
```

---

## ⚡ Interactive Feature Highlights

<details>
<summary><b>📋 Double-Step "Check-then-Continue" Survey Logic</b> (Click to expand)</summary>

*   **State-Gated Feedback**: Selecting an answer does not instantly spoil the result. The selection is visually stored first.
*   **Verification Mode**: Clicking the **Next** button locks the selection and reveals whether the user's choice is correct or incorrect.
*   *Wrong Answers* are highlighted in red, *Correct Answers* in green, and a detailed description is shown indicating the best option.
*   Clicking **Next** a second time transitions the user to the next question.
</details>

<details>
<summary><b>📊 Enterprise Admin Dashboard (/admin)</b> (Click to expand)</summary>

*   **Real-time Analytics**: Displays submissions per day (historical 14-day line chart), total contact leads, consultation requests, and completion metrics.
*   **Risk Profile Breakdown**: Displays risk categories (Low, Moderate, High Vulnerability) based on scores.
*   **Lead Operations**: View full respondent profiles (their contact info, exact answer logs, and assessment scores) and delete outdated data.
*   **CSV Exporter**: Single-click downloads for assessment submissions and contact leads.
</details>

<details>
<summary><b>🛡️ Dual-Database Resiliency</b> (Click to expand)</summary>

*   **MongoDB Atlas Cloud**: Stores all production client data. Includes direct connection strings to bypass Windows DNS/SRV bugs.
*   **Auto-Fallback Storage**: If the database is offline or unconfigured, the app falls back to `data/local-db.json` automatically, meaning it is functional out-of-the-box.
</details>

---

## 🚀 Interactive Quick Start

Follow these interactive checklists to get the application running on your machine:

### 1. Installation
- [ ] Install **Node.js** (v16+) on your computer.
- [ ] Clone or open this repository.
- [ ] Navigate to the project directory and install dependencies:
  ```bash
  npm install
  ```

### 2. Configuration (`.env`)
Create a file named `.env` in the root directory. You can customize the database and login credentials here:

```env
# MongoDB Connection String (Atlas Direct Replica-Set Format)
MONGODB_URI=mongodb+srv://aryanbhadoria100_db_user:Aryan#101@cluster0.xrwowdv.mongodb.net/derisk?retryWrites=true&w=majority

# Port for the Express server to run on
PORT=3000

# Secret password/token to log in to the admin panel (/admin)
ADMIN_TOKEN=Testing
```

> [!NOTE]
> If you do not create a `.env` file, the app will start in **Demo Mode** and save all records to `data/local-db.json`.

### 3. Startup
- [ ] Start the development server:
  ```bash
  npm start
  ```
- [ ] Open [http://localhost:3000](http://localhost:3000) in your web browser.
- [ ] To manage leads, navigate to [http://localhost:3000/admin](http://localhost:3000/admin) and use your configured `ADMIN_TOKEN`.

---

## 🔌 API Documentation

| Method | Route | Security | Payload / Parameters | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | None | Server health check & active storage status |
| **POST** | `/api/submissions` | Public | `{ email, name, company, surveys: { ... } }` | Saves user survey answers and outputs results |
| **POST** | `/api/contact` | Public | `{ name, email, company, message, wantsConsultation }` | Submits standard contact form & consulting requests |
| **POST** | `/api/admin/login` | Token | `{ token }` | Validates admin token for logging in |
| **GET** | `/api/admin/stats` | Header Auth | None (Requires `X-Admin-Token` header) | Returns calculations, risk levels, and 14-day history |
| **GET** | `/api/admin/submissions` | Header Auth | None | Lists all saved survey assessments |
| **GET** | `/api/admin/contacts` | Header Auth | None | Lists all contact forms & consultation inquiries |
| **DELETE** | `/api/admin/submissions/:id`| Header Auth | `:id` of the record | Deletes a assessment submission |
| **DELETE** | `/api/admin/contacts/:id` | Header Auth | `:id` of the record | Deletes a contact lead |
| **GET** | `/api/admin/export/submissions`| Header Auth | None | Downloads all submissions as a `.csv` spreadsheet |
| **GET** | `/api/admin/export/contacts` | Header Auth | None | Downloads all contact leads as a `.csv` spreadsheet |

---

## 🛠️ Troubleshooting & FAQ

<details>
<summary><b>❓ Q: How do I change the Admin Password?</b></summary>

Simply edit the `ADMIN_TOKEN` value inside the `.env` file, save the file, and restart your server (`npm start`). The new password is immediately active.
</details>

<details>
<summary><b>❓ Q: The local server starts, but says MONGODB_URI is failing?</b></summary>

Ensure your MongoDB Atlas network settings allow connection requests from your current IP address (in the MongoDB Atlas panel under **Network Access** -> click **Allow access from anywhere (0.0.0.0/0)** for testing). 
</details>

<details>
<summary><b>❓ Q: Where is my local fallback database saved?</b></summary>

It is saved in a JSON format in `data/local-db.json` inside the project folder. You can safely open and read this file at any time during development.
</details>

---

## 📂 Project Directory Structure

```text
derisk-biz/
├── data/
│   └── local-db.json        # Auto-created local database fallback
├── public/
│   ├── admin/
│   │   ├── index.html       # Admin panel markup
│   │   ├── admin.js         # Admin panel API rendering logic
│   │   └── admin.css        # Admin panel visual layout
│   ├── index.html           # Public landing page (Assessments, Contact)
│   ├── style.css            # Dark fintech premium styling
│   ├── questions.js         # Exact survey question data structures
│   └── app.js               # Main survey engine and news ticker handler
├── server.js                # Express Server + MongoDB Mongoose Schemas
├── .env                     # Configuration variables (gitignored)
├── package.json             # NPM dependencies & startup scripts
└── README.md                # Interactive documentation
```
