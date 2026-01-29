# JobFlow AI System Specification

**Version:** 2.1  
**Architecture:** Python 3.11+ | Streamlit | SQLAlchemy | Google GenAI (Unified SDK)  
**Date:** 2026-01-30

---

## 1. System Vision
JobFlow AI is a high-performance career orchestration platform designed to operate with a "Bring Your Own Key" (BYOK) architecture. Users provide their own Google Gemini API credentials, ensuring privacy, cost control, and personal quota management. The system leverages the unified `google-genai` SDK to dynamically select the best available model (Pro > Flash > Exp) based on the user's key capabilities.

---

## 2. Dynamic SDK Architecture (BYOK)

### 2.1 Unified Client Initialization
Instead of a global singleton client, the application now initializes a fresh `genai.Client` instance for every transactional scope where AI inference is required.

**Pattern:**
```python
def operation(input_data, api_key):
    client = genai.Client(api_key=api_key)
    # ... perform operation
```

### 2.2 Model Selection Logic (`get_best_model`)
The system queries the user's available models via `client.models.list()` and enforces a strict priority queue:
1.  **gemini-1.5-pro**: Preferred for complex reasoning (Scoring, Logic).
2.  **gemini-1.5-flash**: Preferred for speed/high-throughput (Resume Analysis, Matrix Gen).
3.  **gemini-2.0-flash-exp**: Fallback for cutting-edge features.

This logic prevents 404 errors by ensuring the requested model is actually accessible to the user's key.

---

## 3. UI/UX & State Machine

### 3.1 Minimalist Entry
- **Eliminated**: "Deploy" buttons and complex landing marketing.
- **Added**: Direct link to Google AI Studio for key retrieval.
- **Visuals**: "Liquid Glass" aesthetic with deep space backgrounds and glassmorphism.

### 3.2 Session State Control
The application uses explicit Streamlit Session State (`st.session_state`) to manage the ingestion flow, preventing resets during re-runs.

**Flow Stages (`ingestion_step`):**
1.  **Input**: User pastes text / uploads file / provides URL.
2.  **Verify**: User reviews normalized text (Markdown) and toggles "Show full" visibility.
3.  **Analyzing**: System locks state, calls API, updates `UserProfile`.
4.  **Complete**: Read-only summary, ready for Matrix Generation.

### 3.3 Event-Driven Interactions
All critical interactions (Processing, Confirming, Editing) use `on_click` callbacks to decouple logic from the rendering loop.

---

## 4. Component Interfaces

### 4.1 Engine (`engine.py`)
- **`get_best_model(api_key)`**: Discovers optimal model.
- **`analyze_profile(text, api_key)`**: Extracts skills/seniority.
- **`generate_search_matrix(profile, api_key)`**: Maps hubs/titles.
- **`calculate_match_score(...)`** & **`calculate_hire_probability(...)`**: Dual-score heuristics.

### 4.2 Application (`app.py`)
- **Login Page**: Validates Key via `test_api_key`.
- **Ingestion Page**: Verification loop + "Universal Ingesters".
- **Matrix Page**: Editable dataframes for Search Vectors.
- **Results Page**: Job listing and Recede Logic.

---

## 5. Security & Privacy
- **Ephemeral Keys**: API keys are stored in `st.session_state` (memory only) for the duration of the session by default.
- **Optional Persistence**: Users can choose to save their encrypted key in the local SQLite database for future convenience (feature available via `save_user`).
- **No Hardcoding**: All source code references to `GEMINI_API_KEY` env vars have been removed in favor of runtime injection.

---
