# Expense Tracker

A personal expense tracking web app built with **HTML, CSS, and vanilla JavaScript**. All data is stored in the browser's `localStorage` — no backend or database required.

## Features

- Add income and expense transactions (description, amount, category, date)
- Dashboard with live Total Balance, Total Income, and Total Expenses
- Recent Transactions list with delete (with confirmation)
- Search transactions by description or category
- Filter by All / Income / Expense
- Sort by newest, oldest, highest amount, lowest amount
- Data persists across page refreshes via `localStorage`
- Responsive layout for desktop, tablet, and mobile
- Basic accessibility: semantic HTML, labels, keyboard-friendly controls

## Tech Stack

- HTML5
- CSS3 (CSS variables for the design system)
- Vanilla JavaScript (no frameworks, no build step)

## Project Structure

```
expense-tracker/
├── index.html      # Page structure: dashboard, form, transaction list
├── style.css       # Design system + layout + responsive rules
├── script.js       # App logic: state, localStorage, rendering, events
├── README.md
└── .gitignore
```

## Running Locally

No build tools or installs needed. Just open `index.html` in a browser, e.g.:

```bash
open index.html        # macOS
start index.html       # Windows
```

Or use VS Code's "Live Server" extension for auto-reload while editing.

## Deploying to Vercel

1. Push this project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), sign in, and click **"Add New Project"**.
3. Import the GitHub repo.
4. Framework preset: choose **"Other"** (this is a static site, no build step needed).
5. Click **Deploy**.

Vercel will give you a live URL in under a minute.

## Notes

- This is a **frontend-only** project. `localStorage` is per-browser and per-device — it is not a real database and data won't sync across devices.
- Transaction IDs are generated client-side using the current timestamp plus a random number, which is sufficient for a single-user local app.
# Expance
