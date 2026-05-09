# 🤖 CaptionAI — Social Media Post & Caption Generator

An AI-powered web app that generates engaging social media captions, trending hashtags, and emoji suggestions for **Instagram, LinkedIn, Twitter, and Facebook** — built with **Flask + OpenAI**.

---

## 📁 Project Structure

```
SocialMediaGenerator/
├── app.py                 # Flask backend and /generate API
├── requirements.txt       # Python dependencies
├── .env.example           # Environment variable template
├── .env                   # Your secrets (not committed to git)
├── templates/
│   └── index.html         # Main frontend page (Jinja2 template)
├── static/
│   ├── style.css          # Styles, dark/light mode, animations
│   └── script.js          # Frontend logic, API calls, clipboard
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone / Navigate to project
```bash
cd SocialMediaGenerator
```

### 2. Create a virtual environment (recommended)
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up environment variables
```bash
# Copy the example file
copy .env.example .env       # Windows
cp  .env.example .env        # macOS/Linux

# Then open .env and paste your OpenAI API key
```

Your `.env` should look like:
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
FLASK_SECRET_KEY=supersecretkey
FLASK_ENV=development
```

### 5. Run the app
```bash
python app.py
```

Open your browser at: **http://localhost:5000**

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎯 Platform targeting | Instagram, LinkedIn, Twitter/X, Facebook |
| 📝 Post types | Promotional, Motivational, Educational, Funny |
| 🎙️ Tone | Professional, Casual, Friendly, Sarcastic |
| 🤖 AI captions | 3 unique, varied captions per generation |
| # Hashtags | 10 trending, platform-relevant hashtags |
| 😊 Emojis | Curated emoji suggestions with rationale |
| 💡 Platform tip | Context-aware tips for each platform |
| 📏 Word & char count | Per caption, shown live |
| 📋 Copy to clipboard | Individual captions, hashtags, emojis |
| 🌙 Dark / Light mode | Toggle persisted via localStorage |
| 📱 Mobile responsive | Works great on all screen sizes |
| ⚠️ Error handling | User-friendly API and validation errors |

---

## 🔌 API Reference

### `POST /generate`

**Request Body (JSON):**
```json
{
  "platform":        "Instagram",
  "post_type":       "Promotional",
  "tone":            "Casual",
  "target_audience": "Young professionals aged 25-35",
  "topic":           "Launch of our new productivity app"
}
```

**Success Response (200):**
```json
{
  "captions": [
    { "id": 1, "caption": "...", "word_count": 42, "char_count": 210 },
    { "id": 2, "caption": "...", "word_count": 35, "char_count": 175 },
    { "id": 3, "caption": "...", "word_count": 50, "char_count": 260 }
  ],
  "hashtags": ["#hashtag1", "#hashtag2", "..."],
  "emojis": {
    "recommended": ["🚀", "💡", "✨"],
    "description": "Why these emojis suit this content"
  },
  "platform_tip": "Platform-specific reach tip."
}
```

**Error Response (4xx / 5xx):**
```json
{ "error": "Human-readable error message." }
```

---

## 🛡️ Environment Variables

| Variable | Description | Required |
|---|---|---|
| `OPENAI_API_KEY` | Your OpenAI secret key | ✅ Yes |
| `FLASK_SECRET_KEY` | Any random string for Flask sessions | Recommended |
| `FLASK_ENV` | `development` or `production` | Optional |

> Get your OpenAI API key at: https://platform.openai.com/api-keys

---

## 🔧 Configuration

- **Model**: Default is `gpt-3.5-turbo`. Change to `gpt-4` in `app.py` if you have access.
- **Temperature**: Set to `0.85` for creative variety. Lower (e.g., `0.5`) = more consistent.
- **Max Tokens**: Set to `1200`. Increase if captions are being cut off.

---

## 📦 Dependencies

```
flask>=3.0.0
openai>=1.14.0
python-dotenv>=1.0.0
```

---

## 📄 License

MIT License — free to use, modify, and distribute.
