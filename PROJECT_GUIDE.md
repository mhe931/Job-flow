# JobFlow AI: Project Guide & Development Context
**Version:** 3.0 (BYOK Architecture)
**Last Updated:** 2026-01-30
**Architecture:** Python 3.11+ | Streamlit | SQLAlchemy | google-genai (Unified SDK)

---

## 1. Project Overview
JobFlow AI is a production-grade career orchestration platform migrated to a **Bring Your Own Key (BYOK)** architecture. It empowers users to provide their own Google Gemini API credentials, guaranteeing data privacy and personal quota management. The system dynamically handshakes with the API to select the most capable model available (e.g., Gemini 3.0 Flash, 2.5 Pro) for resume analysis and strategic mapping.

---

## 2. Technical Stack (2026 Standard)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | Streamlit 1.30+ | "Liquid Glass" aesthetic, Session State management |
| **Data Validation** | Pydantic 2.5+ | Type-safe schemas (UserProfile, SearchMatrix) |
| **Persistence** | SQLAlchemy 2.0+ | SQLite with WAL mode for concurrency |
| **LLM SDK** | **google-genai 1.0+** | Unified SDK replacing legacy `google-generativeai` |
| **Auth** | Dynamic BYOK | Runtime key injection per functional scope |
| **Encryption** | cryptography 41.0+ | AES-256-GCM for optional key persistence |

---

## 3. Dynamic Model Resolution (`engine.py`)
The system no longer relies on hardcoded model names. It implements a discovery logic:

1.  **Handshake**: `get_best_model(api_key)` initializes a client.
2.  **Inventory**: Calls `client.models.list()` to see what the user supports.
3.  **Prioritization**:
    *   `gemini-3-flash` (First Choice for speed/intelligence balance)
    *   `gemini-2.5-pro` (Complex reasoning)
    *   `gemini-1.5-flash-latest` (Fallback)
    *   `gemini-1.5-flash` (Legacy Fallback)

---

## 4. UI Architecture (`app.py`)
- **Design System**: "Liquid Glass" (Dark mode, glassmorphism containers, neon accents).
- **State Management**: All buttons trigger `on_click` callbacks to modify `st.session_state`.
- **Navigation**:
    - **Login**: Minimalist, includes direct link to AI Studio.
    - **Ingestion**: Tabbed interface (Paste/URL/Upload).
    - **Matrix**: Editable Dataframe.
    - **SERP**: Job discovery with Recede Logic.

---

## 5. Development Workflow
1.  **Setup**: `pip install -r requirements.txt` (ensure `google-genai` is present).
2.  **Test**: `python -m unittest tests/test_handshake.py` to verify model discovery.
3.  **Run**: `streamlit run app.py`

---
