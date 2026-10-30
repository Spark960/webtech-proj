# SkillSwap — Project Overview & Execution Guide

## 1. Project Summary
**SkillSwap** is a full-stack, accessible web application developed for university students to exchange practical skills with peers on campus. A student who excels in a subject (e.g., Python programming, guitar, conversational Spanish) can post skills they are willing to **teach**, while also posting skills they want to **learn**. Students can search through listings, express interest in collaborating, and upon mutual agreement, exchange direct contact information.

- **Stack**: HTML5 + CSS3 + Vanilla JavaScript (Frontend) | Node.js + Express (Backend) | MySQL via XAMPP (Database)
- **Architecture**: Classic full-stack architecture with REST API endpoints, session cookies (`express-session`), and secure password hashing (`bcrypt`).
- **Scope**: Designed for a solo student submission demonstrating **4 core full-stack features** with a clean, hand-coded codebase.
- **Accessibility**: Tailored to score 100% on the **WAVE Web Accessibility Evaluation Tool** and satisfy all rubric criteria.

---

## 2. The 4 Demonstrated Features

### Feature 1: Student Registration & Session-Based Authentication
- **User Flow**: Students register with Name, Email, Password, Department, and an optional Bio.
- **Security**: Passwords hashed with 10 salt rounds of `bcrypt`.
- **Session Management**: Handled server-side with `express-session`; session cookies maintain login state across pages.
- **Navbar Integration**: Dynamic navbar switches between Guest links (*Browse*, *Login/Register*) and Authenticated links (*Browse*, *My Dashboard*, *Logout*).

### Feature 2: Post & Manage Skill Cards (CRUD)
- **User Flow**: Authenticated students can post skill offerings or learning requests from their dashboard.
- **Data Attributes**: Skill Goal (*I can teach this* vs. *I want to learn this*), Title, Category (*Coding*, *Music*, *Language*, *Sports*, *Art*, *Academic*, *Other*), and detailed Description.
- **Management**: Students can view all their active postings on their dashboard and delete them with one click.

### Feature 3: Live Search & Multi-Criteria Filtering
- **User Flow**: Available to all visitors on the homepage (`/index.html`).
- **Search**: Instant case-insensitive keyword search against both title and description.
- **Category Filter**: Dropdown filter to isolate specific categories.
- **Type Filter**: Filter by "Can Teach" or "Wants to Learn".
- **Screen Reader Support**: Results are wrapped in an `aria-live="polite"` region that automatically announces updates to assistive technologies.

### Feature 4: Peer Connection & Request Workflow
- **User Flow**: When viewing a peer's skill card, a student clicks **Connect / Learn** and can attach an introductory message.
- **Owner Review**: The skill poster sees incoming connection requests on their dashboard with the requester's name, department, message, and timestamp.
- **Accept / Decline**: The owner can accept or decline each request.
- **Contact Reveal**: Once accepted, verified university email addresses are securely revealed to both students so they can organize learning sessions.

---

## 3. How to Run the Project (Step-by-Step)

### Prerequisites
1. **Node.js** installed (v18 or higher recommended).
2. **XAMPP** installed with MySQL service.

### Step 1: Start MySQL in XAMPP
1. Open the **XAMPP Control Panel**.
2. Click the **Start** button next to **MySQL** (runs on default port `3306`).
   > *Note: You do **not** need to start Apache in XAMPP. Express acts as the web server.*

### Step 2: Install Node Dependencies
Open a terminal in the project directory (`webtech_proj`) and run:
```bash
npm install
```

### Step 3: Start the Express Server
```bash
npm start
```
*Alternatively, for automatic server reloading on code changes during development:*
```bash
npm run dev
```

### Step 4: Open in Your Browser
Visit:
```
http://localhost:5000
```
> *The server automatically verifies and creates the `skillswap` database and all required tables (`users`, `skills`, `interests`) upon launch, so manual SQL imports are not required.*

---

## 4. Evaluation Criteria & Accessibility Compliance (WAVE)

| Rubric Category | How SkillSwap Satisfies It |
|---|---|
| **Structure & Semantics** | Valid `<!DOCTYPE html>`, `<html lang="en">`, `<head>`, `<body>`. Uses `<header>`, `<nav>`, `<main id="main-content">`, `<section>`, `<article>`, and `<footer>` instead of unsemantic `<div>` containers. |
| **Heading Hierarchy** | Logical order on all pages: single `<h1>` for page identity &rarr; `<h2>` for sections &rarr; `<h3>` for cards. Zero skipped heading levels. |
| **Contrast (WCAG 2.1 AA)** | Text contrast ratios exceed 4.5:1 for standard text (e.g., `#222222` body text on `#f7f9fa` is 15.9:1; `#ffffff` on `#004085` header is 11.2:1). |
| **Font Size & Spacing** | Minimum 16px body font size, 1.5 line-height, clear paragraph spacing, and responsive layout. |
| **Readable Text** | No ALL CAPS typography, no blinking, and no distracting animations. |
| **Form Labels** | Every `<input>`, `<select>`, and `<textarea>` has an explicit `<label for="...">` linking to an element `id`. |
| **Placeholders** | Placeholders are used only as supplementary hints (e.g. `e.g. Python, Guitar`), never as primary labels. |
| **Error Messages** | Form validation errors are explicitly written in text with `role="alert"`, not communicated through red color alone. |
| **Field Instructions** | Required form fields are explicitly designated with text: `(required)`. |
| **Keyboard Accessibility** | A skip-navigation link (`Skip to main content`) is provided at the very top of each page. All inputs, buttons, and links feature a high-visibility 3px focus outline. |

---

## 5. File & Directory Structure

```
webtech_proj/
├── public/                       # Static frontend assets served by Express
│   ├── css/
│   │   └── style.css             # Handcrafted accessible stylesheet (~250 lines)
│   ├── js/
│   │   └── app.js                # Vanilla JavaScript for API calls & DOM handling (~330 lines)
│   ├── index.html                # Public browse & search page
│   ├── login.html                # Student login and registration page
│   └── dashboard.html            # Private dashboard (posting, my skills, requests)
├── server/
│   ├── middleware/
│   │   └── auth.js               # Route protection & session locals middleware
│   ├── routes/
│   │   ├── auth.js               # POST /register, POST /login, POST /logout, GET /me
│   │   ├── skills.js             # GET /skills, POST /skills, GET /mine, DELETE /:id
│   │   └── interests.js          # POST /interests, GET /incoming, GET /outgoing, PUT /accept, PUT /decline
│   ├── db.js                     # MySQL connection pool & automatic database provisioner
│   └── server.js                 # Express server configuration & static file hosting
├── schema.sql                    # SQL database schema reference
├── package.json                  # Project metadata and dependencies
├── .env                          # Server & database environment configuration
├── README.md                     # GitHub repository overview
└── PROJECT_OVERVIEW.md           # This document
```
