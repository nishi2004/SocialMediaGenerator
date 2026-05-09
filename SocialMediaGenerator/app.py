"""
app.py - Flask Backend for Social Media Post & Caption Generator
=================================================================
This is the main application file. It handles:
- Serving the frontend (index.html)
- Exposing the /generate API endpoint
- Communicating with the OpenAI API
- Returning structured JSON responses
"""

import os
import json
import re
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from the .env file
load_dotenv()

# Initialize the Flask application
app = Flask(__name__)



#  Route: Home Page
@app.route("/")
def index():
    """Serve the main HTML page."""
    return render_template("index.html")


#  Route: /generate  (POST)
@app.route("/generate", methods=["POST"])
def generate():
    """
    API endpoint that accepts JSON input and returns AI-generated
    social media captions, hashtags, and emoji suggestions.

    Expected JSON body:
    {
        "platform":        "Instagram",
        "post_type":       "Promotional",
        "tone":            "Casual",
        "target_audience": "Young professionals",
        "topic":           "New product launch"
    }
    """
    try:
        # ── 0. Configure Gemini 
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            return jsonify({
                "error": "Gemini API key not configured. Please set GEMINI_API_KEY in .env."
            }), 500
        
        genai.configure(api_key=api_key)
        
        # We use a model that is fast and good for text generation
        # gemini-2.5-flash is the recommended default for general text tasks
        model = genai.GenerativeModel('gemini-2.5-flash',
            system_instruction=(
                "You are an expert social media content strategist and copywriter. "
                "You create high-converting, engaging social media posts tailored to "
                "specific platforms, audiences, and tones. Always respond with valid "
                "JSON only — no markdown, no extra text."
            )
        )

        # ── 1. Parse and validate the request body ─────────────────
        data = request.get_json(force=True)

        platform        = data.get("platform", "").strip()
        post_type       = data.get("post_type", "").strip()
        tone            = data.get("tone", "").strip()
        target_audience = data.get("target_audience", "").strip()
        topic           = data.get("topic", "").strip()

        # Basic validation – all fields required
        if not all([platform, post_type, tone, target_audience, topic]):
            return jsonify({
                "error": "All fields are required. Please fill in every input."
            }), 400

        # ── 2. Build the structured prompt ─────────────────────────
        prompt = build_prompt(platform, post_type, tone, target_audience, topic)

        # ── 3. Call the Gemini API ─────────────────────────────────
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.85,
                response_mime_type="application/json",
            )
        )

        # ── 4. Extract and parse the response ─────────────────────
        raw_content = response.text.strip()

        result = json.loads(raw_content)

        # ── 5. Return the parsed JSON to the frontend ──────────────
        return jsonify(result), 200

    except json.JSONDecodeError:
        # The model returned something that isn't valid JSON
        return jsonify({
            "error": "The AI returned an unexpected format. Please try again."
        }), 500

    except Exception as e:
        # Catch-all for API errors, network issues, etc.
        error_msg = str(e)
        return jsonify({"error": f"An error occurred: {error_msg}"}), 500


# ─────────────────────────────────────────────
#  Helper: Build Dynamic Prompt
# ─────────────────────────────────────────────
def build_prompt(platform: str, post_type: str, tone: str,
                 target_audience: str, topic: str) -> str:
    """
    Constructs a detailed, structured prompt for the AI model.
    The prompt instructs the model to return strict JSON so the
    frontend can parse it reliably.
    """

    # Platform-specific character limit hints
    char_limits = {
        "Twitter":   "Keep each caption under 280 characters.",
        "Instagram": "Captions can be up to 2200 characters; use line breaks for readability.",
        "LinkedIn":  "Professional tone; captions can be up to 3000 characters.",
        "Facebook":  "Conversational; captions can be up to 63,206 characters but keep them concise.",
    }
    limit_hint = char_limits.get(platform, "")

    prompt = f"""
Generate 3 unique, highly engaging {platform} posts about "{topic}".

Post Details:
- Post Type: {post_type}
- Tone: {tone}
- Target Audience: {target_audience}
- Platform: {platform}

Guidelines:
- Each caption must feel distinct (vary structure: one punchy, one storytelling, one CTA-focused).
- {limit_hint}
- Use emojis naturally within captions where appropriate for the platform.
- Reflect the {tone} tone throughout.
- Speak directly to: {target_audience}

Return ONLY the following JSON structure (no markdown, no extra text):

{{
  "captions": [
    {{
      "id": 1,
      "caption": "Full caption text with emojis inline",
      "word_count": 42,
      "char_count": 210
    }},
    {{
      "id": 2,
      "caption": "Full caption text with emojis inline",
      "word_count": 35,
      "char_count": 175
    }},
    {{
      "id": 3,
      "caption": "Full caption text with emojis inline",
      "word_count": 50,
      "char_count": 260
    }}
  ],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5",
               "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"],
  "emojis": {{
    "recommended": ["🔥", "💡", "🚀", "✨", "🎯"],
    "description": "Short explanation of why these emojis suit this content"
  }},
  "platform_tip": "One sentence tip specific to {platform} for maximising reach."
}}
""".strip()

    return prompt


# ─────────────────────────────────────────────
#  Entry Point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    # debug=True enables auto-reload on code changes (development only)
    app.run(debug=True, host="0.0.0.0", port=5000)
