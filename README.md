# SkillSwap — Student Peer Skill Exchange Platform

A lightweight, accessible full-stack web application for university students to exchange skills (teaching and learning) with peers on campus.

Built with **HTML5, CSS3, Vanilla JavaScript, Node.js, Express, and MySQL (via XAMPP)**.

---

## 4 Core Features (Solo Project)

1. **Student Registration & Session Authentication**:
   - Secure account registration with input validation.
   - Password hashing using `bcrypt`.
   - Server-side session management with `express-session`.

2. **Skill Posting & Management (CRUD)**:
   - Students can publish skills they want to **teach** or skills they want to **learn**.
   - Categorized by subject (Coding, Music, Language, Sports, Art, Academic, Other).
   - Students can manage and delete their postings from their dashboard.

3. **Browse, Search & Multi-criteria Filtering**:
   - Public browse portal displaying active skill cards.
   - Real-time keyword search (title and description).
   - Filter by category and skill type ("Can Teach" vs. "Wants to Learn").
   - Live updates with accessible `aria-live` region.

4. **Student Peer Connection & Interest System**:
   - Students can send an interest request with an optional personal message to connect on any skill.
   - Recipients receive requests on their dashboard with **Accept** and **Decline** options.
   - Once accepted, contact details (verified university emails) are revealed to both students to start collaborating.

---

## Accessibility & Evaluation Compliance (WAVE)

Designed to achieve zero errors in the **WAVE Web Accessibility Evaluation Tool**:
- **Semantic HTML5**: Full document structure with `<header>`, `<nav>`, `<main id="main-content">`, `<section>`, `<article>`, and `<footer>`.
- **Heading Order**: Strictly ordered `<h1>` &rarr; `<h2>` &rarr; `<h3>` without skipping levels.
- **Labels & Forms**: Every input, select, and textarea has an explicit `<label for="...">` with a corresponding `id`.
- **No Reliance on Color Alone**: Required fields and error messages are written in explicit text with `role="alert"`. Placeholders are used only as supplementary hints.
- **WCAG 2.1 AA Contrast**: High-contrast text colors exceeding 4.5:1 ratio.
- **Keyboard Navigation**: Includes a skip navigation link (`Skip to main content`) and high-visibility focus indicators.

---

## Tech Stack & Project Structure

- **Frontend**: Handcrafted HTML5, CSS3 (minimal, clean ~250 lines), Vanilla JavaScript (no external libraries).
- **Backend**: Node.js & Express.
- **Database**: MySQL (XAMPP).
- **Authentication**: `express-session` & `bcrypt`.

```
webtech_proj/
├── public/
│   ├── css/
│   │   └── style.css          # Clean, accessible styling
│   ├── js/
│   │   └── app.js             # Vanilla JS for all 3 pages
│   ├── index.html             # Browse & search skills
│   ├── login.html             # Login & registration forms
│   └── dashboard.html         # User dashboard & posting
├── server/
│   ├── db.js                  # MySQL pool & auto-schema verification
│   ├── middleware/
│   │   └── auth.js            # Session authentication middleware
│   ├── routes/
│   │   ├── auth.js            # Register, login, logout, profile
│   │   ├── skills.js          # CRUD operations for skills
│   │   └── interests.js       # Student connection requests
│   └── server.js              # Express app entry point
├── schema.sql                 # MySQL schema script
├── package.json
└── .env
```

---

## How to Run Locally

### 1. Start MySQL in XAMPP
Open the **XAMPP Control Panel** and click **Start** next to **MySQL** (port 3306). Apache is not required because Express handles the web server.

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
npm start
```
The application will automatically verify/create the `skillswap` database and tables on startup.

### 4. Open in Browser
Navigate to:
```
http://localhost:5000
```
