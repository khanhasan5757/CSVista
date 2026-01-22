# CSVISTA

**CSV Data Visualization & Annotation Tool**

A lightweight, privacy-focused, **client-side CSV analytics platform** that enables users to explore, analyze, visualize, and annotate CSV datasets directly in the browser — with **no backend, no database, and no cloud upload**.

---

## ✨ Overview

CSVISTA is designed for students, researchers, and analysts who need a fast and secure way to work with structured CSV data without installing heavy software or uploading sensitive datasets to external servers.

All data processing is performed locally using modern web technologies.

---

## 🚀 Features

* 📁 Upload and parse CSV files
* 📋 Interactive data table

  * Sorting
  * Global search
  * Pagination
* 🔎 Multi-criteria filtering
* 📊 Statistical analysis

  * Mean, median, min, max
  * Standard deviation
  * Missing value detection
* 📈 Data visualization

  * Bar, line, scatter, pie & area charts
* 🔗 Correlation analysis (Pearson)
* 💡 Smart Insights

  * Outlier detection (IQR)
  * Correlation highlights
  * Missing data patterns
  * Data quality score
* 🔧 Data transformation

  * Calculated columns
  * Duplicate removal
  * Missing value handling
* 💾 Export options

  * CSV
  * JSON
  * PNG charts

---

## 🧠 Smart Insights Module

The Smart Insights tab automatically analyzes datasets and generates meaningful observations using statistical techniques:

* **Outlier detection:** Interquartile Range (IQR)
* **Correlation analysis:** Pearson correlation coefficient
* **Data quality assessment:** Missing value percentage

This enables rapid exploratory data analysis without manual computation.

---

## 🛠️ Tech Stack

| Layer         | Technology        |
| ------------- | ----------------- |
| Structure     | HTML5             |
| Styling       | CSS3              |
| Logic         | JavaScript (ES6+) |
| Visualization | Chart.js          |
| Architecture  | Fully client-side |

### Browser APIs Used

* FileReader API
* Canvas API
* Blob API
* LocalStorage API
* DOM API

---

## 🏗️ Architecture

```
CSV File
   ↓
FileReader API
   ↓
CSV Parser
   ↓
Central State Management
   ↓
Filtering & Statistics
   ↓
Visualization & Insights
   ↓
Transformation
   ↓
Export (CSV / JSON / PNG)
```

---

## 📂 Project Structure

```
CSVISTA/
│
├── index.html        # Application layout
├── style.css         # UI styling & responsiveness
├── script.js         # Core application logic
├── assets/           # Images / icons (optional)
└── README.md
```

---

## ▶️ Getting Started

### Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/csvista.git
   ```

2. Open the project:

   ```text
   index.html
   ```

3. Upload a CSV file and start analyzing.

✅ No installation
✅ No dependencies
✅ No server required

---

## 🔐 Data Privacy

* No backend server
* No cloud upload
* No database storage
* All data remains in browser memory

CSVISTA is suitable for **privacy-sensitive datasets**, including research and bioinformatics data.

---

## ⚠️ Limitations

* Performance depends on browser memory
* Very large files (>10–15 MB) may affect responsiveness
* No real-time collaboration
* No persistent cloud storage

---

## 🔮 Future Enhancements

* Support for Excel (.xlsx) and TSV formats
* Machine learning–based pattern detection
* User authentication & project saving
* Collaborative annotations
* Backend support for large datasets
* Accessibility and multilingual support
