# AI 3D Site

A web app built with Flask (Python) featuring:
- A 3D mouse-reactive tilt card on the homepage
- An AI chat assistant (calls the Anthropic Claude API)
- A revenue/profit forecast tool with a live chart
- A cost estimator by world region
- A live currency converter

## Tech stack
- **Backend:** Python (Flask)
- **Frontend:** HTML, CSS, JavaScript
- **Libraries:** Chart.js (forecast chart), Frankfurter API (currency conversion)

## How to run

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. (Optional) Add your Anthropic API key for real AI chat responses.
   Either set an environment variable:
   ```
   set ANTHROPIC_API_KEY=your_key_here      # Windows
   export ANTHROPIC_API_KEY=your_key_here   # Mac/Linux
   ```
   or paste it directly into `app.py`.
   Without a key, the chat runs in demo mode and echoes your message back.

3. Run the app:
   ```
   python app.py
   ```

4. Open your browser to:
   ```
   http://localhost:5000
   ```

## Project structure
```
ai3dsite/
├── app.py                 # Flask backend + API routes
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html         # Main page
└── static/
    ├── style.css           # Styling incl. 3D tilt effect
    └── script.js           # Frontend logic for chat + tools
```

## Notes
- The currency converter requires an internet connection.
- Region cost multipliers in `app.py` are placeholder values for demo purposes.
