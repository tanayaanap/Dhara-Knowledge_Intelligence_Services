# 🌿 Project DHARA – AI-Powered Crop Intelligence System

An intelligent agriculture assistant that uses **Machine Learning + OCR + Chatbot AI** to help farmers make better crop decisions.

---

## 🚀 Features

### 🌾 Crop Recommendation

* Predicts **top 5 crops** based on:

  * Nitrogen (N), Phosphorus (P), Potassium (K)
  * Temperature, Humidity
  * pH, Rainfall
* Uses a trained **XGBoost model**

### 📄 Soil Report Upload (OCR)

* Upload **image/PDF soil reports**
* Extracts values using **Tesseract OCR**
* Handles:

  * Ranges (e.g., 20–50 → midpoint)
  * Units & noisy text
* Auto-fills missing values using **smart defaults**

### 🤖 AI Chat Assistant

* Ask farming-related queries
* Instant chatbot responses

### 🔐 Authentication System

* User **register/login/logout**
* Session-based authentication

### 💻 Modern Frontend

* Built with **React + **
* Styled using **Tailwind CSS (glassmorphism UI)**
* Uses **React Router DOM** for navigation

---

## 🗂️ Project Structure

```
Dhara-Knowledge_Intelligence_Services/
│
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── chatbot.py
│   ├── xgboost_model.pkl
│   ├── label_encoder.pkl
│   ├── requirements.txt
│   ├── uploads/
│   └── instance/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md
```

---

## ⚙️ Backend Setup (Flask)

### 1. Create Virtual Environment

```
python -m venv venv
```

### 2. Activate Environment

**Windows:**

```
venv\Scripts\activate
```

### 3. Install Dependencies

```
pip install -r requirements.txt
```

### 4. Run Flask Server

```
cd backend
python app.py
```

➡️ Backend runs on:

```
http://localhost:5000
```

---

## 💻 Frontend Setup (React + Vite)

### 1. Install Dependencies

```
cd frontend
npm install
```

### 2. Run Development Server

```
npm run dev
```

➡️ Frontend runs on:

```
http://localhost:3000
```

---

## 🔗 Frontend ↔ Backend Connection

Configured using Vite proxy:

```js
server: {
  host: '127.0.0.1',
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

---

## 📡 API Endpoints

### 🔐 Auth

* `POST /api/register`
* `POST /api/login`
* `GET /api/user`
* `POST /api/logout`

### 🌾 Prediction

* `POST /api/predict`

### 📄 Upload

* `POST /api/upload`

### 🤖 Chat

* `POST /api/chat`

---

## 🧠 Machine Learning

* Model: **XGBoost Classifier**
* Input Features:

  * N, P, K
  * Temperature
  * Humidity
  * pH
  * Rainfall
* Output:

  * Top 5 crops with probabilities

---

## 🧪 OCR & Parsing

* Uses:

  * **pytesseract**
  * **PIL**
  * **PyMuPDF (fitz)**
* Extracts:

  * Soil nutrients (NPK)
  * pH
  * Environmental values
* Smart handling:

  * Noisy OCR text
  * Unit variations
  * Missing values → auto-filled

---

## 🌱 Future Improvements

* Disease prediction module
* Weather API integration
* Multi-language support
* Farmer dashboard analytics
* Mobile responsiveness upgrade

---

## 👨‍💻 Author

Built as part of an AI + Web Development project combining:

* Machine Learning
* Full Stack Development
* UI/UX Design

---

## 📜 License

This project is for educational and development purposes.

---

🌾 *Empowering farmers with AI-driven insights.*
