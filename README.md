# Project DHARA - AI-Powered Crop Intelligence System

An intelligent agriculture assistant that uses Machine Learning + OCR + Chatbot AI to help farmers make better crop decisions.

## Features

### Crop Recommendation
- Predicts top 5 crops based on Nitrogen, Phosphorus, Potassium, Temperature, Humidity, pH, Rainfall
- Uses a trained XGBoost model

### Fertilizer Recommendation
- Predicts the best fertilizer based on Nitrogen, Phosphorous, Potassium, Temperature, Moisture, Rainfall, pH, Organic Carbon, Soil Type, Crop Type
- Uses a trained classifier model with label-encoded soil/crop categories
- Returns the recommended fertilizer, confidence score, and suggested application quantity per acre

### Soil Report Upload (OCR)
- Upload image/PDF soil reports
- Extracts values using Tesseract OCR
- Handles ranges, units, and noisy text
- Auto-fills missing values using smart defaults

### AI Chat Assistant
- Ask farming-related queries
- Instant chatbot responses

### Authentication System
- User register/login/logout
- Session-based authentication

### Modern Frontend
- Built with React
- Styled using Tailwind CSS (glassmorphism UI)
- Uses React Router DOM for navigation

## API Endpoints

### Auth
- POST /api/register
- POST /api/login
- GET /api/user
- POST /api/logout

### Prediction
- POST /api/predict

### Fertilizer
- POST /api/recommend-fertilizer
  - Body: nitrogen, phosphorous, potassium, temperature, moisture, rainfall, ph, carbon, soil_type, crop_type
  - Returns: recommended_fertilizer, quantity, confidence

### Upload
- POST /api/upload

### Chat
- POST /api/chat

## Machine Learning

### Crop Recommendation
- Model: XGBoost Classifier
- Input Features: N, P, K, Temperature, Humidity, pH, Rainfall
- Output: Top 5 crops with probabilities

### Fertilizer Recommendation
- Model: trained classifier (see train_fertilizer.py)
- Input Features: Nitrogen, Phosphorous, Potassium, Temperature, Moisture, Rainfall, pH, Organic Carbon, Soil Type, Crop Type
- Output: Recommended fertilizer, confidence score, suggested application quantity

## Future Improvements
- Disease prediction module
- Weather API integration
- Multi-language support
- Farmer dashboard analytics
- Mobile responsiveness upgrade

## Author
Built as part of an AI + Web Development project combining Machine Learning, Full Stack Development, and UI/UX Design.

## License
This project is for educational and development purposes.
