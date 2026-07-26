# Dhara Mobile Migration Plan

## Source Inventory

### Backend APIs
- `GET /` health check.
- `POST /api/login` session login with `{ email, password }`, returns `{ success, user }`.
- `POST /api/register` creates a user with `{ name, email, password }`. Backend currently ignores `location` and `land_size` on registration.
- `GET /api/user` returns session auth status and user summary.
- `GET /api/profile` returns authenticated profile `{ name, email, location, land_size }`.
- `PUT /api/profile` updates `{ name, location, land_size }`.
- `POST /api/logout` clears the Flask session.
- `GET /api/stats` returns `{ total, crop, disease, fertilizer }`.
- `POST /api/predict` accepts `{ N, P, K, temperature, humidity, ph, rainfall }`, returns ranked crop predictions.
- `POST /api/ocr-scan` accepts multipart `file`, returns extracted soil fields and raw OCR text.
- `POST /api/chat` accepts `{ message }`, returns `{ reply }`.

### Backend Gaps Found
- TODO: `POST /api/predict-disease` is referenced by the web app but is not implemented in `backend/app.py`.
- TODO: `POST /api/recommend-fertilizer` is referenced by the web app but is not implemented in `backend/app.py`.
- TODO: forgot password and token refresh are not supported because auth is Flask session-cookie based.

## Web Pages Mapped
- `Dashboard` -> mobile `Home` tab with stats, feature shortcuts, pull-to-refresh.
- `CropPrediction` -> mobile `Crop` tab with manual form and OCR report scan.
- `DiseasePrediction` -> represented in `Activity` as unavailable until backend route exists.
- `Fertilizer` -> represented in `Activity` as unavailable until backend route exists.
- `AboutUs` -> folded into `Activity` with mission/product context.
- `Login` -> mobile stack route `/login`.
- `Register` -> mobile stack route `/register`.
- `Profile` -> mobile `Profile` tab with edit and logout.
- `Home.jsx` chat assistant -> mobile `AI` tab.

## Shared Models
- `User`: `id`, `email`, `name`, `location`, `land_size`.
- `Stats`: `total`, `crop`, `disease`, `fertilizer`.
- `CropPredictionInput`: `N`, `P`, `K`, `temperature`, `humidity`, `ph`, `rainfall`.
- `CropPredictionResult`: ranked `{ crop, probability }`.
- `OcrScanResult`: extracted soil fields plus raw OCR text.
- `ChatMessage`: local mobile UI model for assistant history.

## Mobile Navigation
- Bottom tabs: `Home`, `Crop`, `AI`, `Activity`, `Profile`.
- Stack routes outside tabs: `/login`, `/register`.
- Profile tab gates account editing behind current session state.

## Implementation Notes
- Uses Expo Router, React Query, Axios, React Hook Form, Zod, AsyncStorage, Secure Store, Expo Vector Icons, and Expo Document Picker.
- Sensitive session cookie storage uses Secure Store on native and AsyncStorage fallback on web.
- API base URL defaults to the Expo dev host on iOS/web and `10.0.2.2` for Android emulator; override with `EXPO_PUBLIC_API_URL`.
