# Automated Academic Report Generator

A full-stack web application that automates the generation of academic activity reports such as **Workshops, FDP/STTP, Certification Programs, Outreach Programs, and In-House Events**.  
The system allows users to input event details through a web interface and automatically generate **formatted PDF and Word reports**.

This project reduces the manual effort required to prepare institutional documentation for academic activities.

---

## Features

- Generate **academic activity reports automatically**
- Supports multiple activity types:
  - Certification Programs
  - FDP / STTP
  - In-House Events
  - Outreach Programs
  - Seminars / Workshops
- Export reports as:
  - **PDF**
  - **Word (.docx)**
- Structured report formatting with institutional layout
- Upload and include **event images and captions**
- Backend APIs for report generation and download
- Database integration for storing report data

---

## Tech Stack

### Frontend
- React
- Vite
- CSS

### Backend
- Node.js
- Express.js

### Database
- MySQL

### Document Generation
- PDF generation libraries
- Word document generation utilities

---

## Project Structure

```
academic-report-generator
│
├── backend
│   ├── assets
│   ├── config
│   │   └── db.js
│   ├── controllers
│   │   ├── pdfGenerators
│   │   ├── wordGenerators
│   │   └── shared
│   ├── routes
│   ├── database
│   └── app.js
│
├── frontend
│   ├── public
│   └── src
│       ├── components
│       ├── pages
│       ├── styles
│       └── images
│
└── package.json
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/academic-report-generator.git
cd academic-report-generator
```

---

### 2. Setup Backend

```bash
cd backend
npm install
```

Configure the database connection inside:

```
backend/config/db.js
```

Import the SQL files from:

```
backend/database/
```

Start the backend server:

```bash
node app.js
```

---

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on:

```
http://localhost:5173
```

---

## Usage

1. Open the web application.
2. Select the type of academic activity.
3. Fill in event details such as:
   - Title
   - Date
   - Venue
   - Participants
   - Description
4. Upload relevant images if required.
5. Generate and download the report as **PDF or Word document**.

---

## Example Use Cases

- College **NBA / NAAC documentation**
- Department **event reports**
- Faculty **activity documentation**
- Institutional **academic records**

---

## Contributors

This project was developed during a **college internship** by a team of five students.

- Joel Bijo 
- Arya [https://github.com/AryaKSuryavanshi25]
- Joel [https://github.com/joelljoy]
- Shifa [https://github.com/shifamulla02]
- Satya  
