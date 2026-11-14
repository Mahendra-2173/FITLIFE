# FITLIFE AI — Smart Fridge-to-Recipe & Fitness App

[![Live Demo](https://img.shields.io/badge/Live%20Demo-fitlife--2yuy.onrender.com-brightgreen?style=for-the-badge&logo=render)](https://fitlife-2yuy.onrender.com/)
[![GitHub repo](https://img.shields.io/badge/GitHub-Mahendra--2173%2FFITLIFE-red?style=for-the-badge&logo=github)](https://github.com/Mahendra-2173/FITLIFE)

> 🚀 **Live Demo URL:** [https://fitlife-2yuy.onrender.com/](https://fitlife-2yuy.onrender.com/)  
> **Frontend Internship Assignment Submission**  
> **Main Project:** Fridge-to-Recipe Generator (with extra Fitness & Health tools)

FitLife AI is a web app built with **React**, **Node.js**, and **Groq AI**. Instead of just chatting like a normal AI bot, it takes whatever food ingredients you have in your fridge and turns them into a real, easy-to-follow recipe card with cooking timers, checkable steps, and serving size buttons.

---

## 1. What Does This App Do?

FitLife AI helps you eat healthy with what you already have at home:
- **Smart Fridge-to-Recipe (Main Feature):** Type in the food items in your fridge, pick your diet (like high-protein, vegetarian, or keto), set your cooking time, and the AI creates a complete recipe for you.
- **Interactive Recipe Card:** Change servings (1x, 2x, 4x, 6x) to automatically update ingredient amounts, start built-in cooking timers with sounds, and check off steps as you cook.
- **Workout & Fitness Tools:** Simple workout plans with exercise timers, rest countdowns, and an exercise guide.
- **Daily Health Tracker:** Track your water intake, sleep hours, daily steps, and body stats (like BMI and calories).

---

## 2. Key Features

### 🍳 1. Fridge-to-Recipe Generator (Main Feature)
- **Add Ingredients:** Type ingredients or click popular buttons (Chicken, Eggs, Spinach, Oats, Chickpeas, etc.).
- **Diet Filters:** Choose High-Protein, Vegetarian, Non-Vegetarian, Vegan, Keto, or Gluten-Free.
- **Allergies & Dislikes:** Tell the app ingredients you want to avoid (like dairy, nuts, or spicy food).
- **Cooking Time:** Pick 15, 25, 35, or 50 minutes.
- **Portion Adjuster:** Click 1x, 2x, 4x, or 6x — all ingredient amounts recalculate instantly.
- **Built-in Timers:** Steps with cooking times have a timer button that beeps when your food is ready.
- **Checkable Steps:** Tick off ingredients as you prepare them and steps as you finish cooking.
- **Ingredient Swaps:** Suggests simple replacements if you are missing an item.
- **Always Works Offline:** If the AI is slow or your internet drops, a verified healthy recipe is shown so you never see a broken screen.

### 🏋️ 2. Workouts & Exercise Guide
- **Workout Timer:** Guided stopwatch that counts your workout time and gives you rest countdowns between sets.
- **Exercise List:** Easy guide with proper form tips and target muscles.

### 📊 3. Health & Daily Tracker
- **Body Stats:** Calculates your BMI (Body Mass Index) and daily calorie needs.
- **Quick Trackers:** One-click buttons to log water (+250ml, +500ml), sleep hours, and daily steps.
- **Progress Chart:** Visual chart showing your weight changes over time.
- **AI Coach:** Gives simple, bulleted tips for your daily health routine.

---

## 3. Tech Stack

- **Frontend:** React 19, Tailwind CSS, Lucide Icons, Recharts.
- **Backend:** Node.js, Express.
- **AI Engine:** Groq API (fast LLM responses).
- **Data Validation:** Zod (makes sure the AI always sends correct recipe data).

---

## 4. How to Run the App (Quick Setup)

You only need **Node.js** installed on your computer.

### Step 1: Open Terminal in Project Folder
```bash
git clone <your-repo-link>
cd FITLIFE
```

### Step 2: Install & Start in One Command
```bash
# Installs backend & frontend automatically, then launches both servers
npm install && npm start
```

Or step-by-step:
```bash
# 1. Install root, backend, and frontend packages
npm install

# 2. Start both backend and frontend concurrently
npm start
```

### Step 3: Add Your Groq API Key (Optional)
The app works out-of-the-box with pre-saved healthy recipes. To enable live AI generation:
1. Make a copy of `backend/.env.example` and name it `backend/.env`.
2. Add your free key from [console.groq.com](https://console.groq.com):
```env
GROQ_API_KEY=your_groq_api_key_here
```

- **Live Production App:** [https://fitlife-2yuy.onrender.com/](https://fitlife-2yuy.onrender.com/)
- **Local Frontend:** `http://localhost:5173`
- **Local Backend API:** `http://localhost:5000/api`

---

## 5. Automated Tests

Run the full validation and failure-handling test suite (30 comprehensive tests):
```bash
npm test
```
Covers:
- Zod schema validation & field rejection
- LLM JSON parsing, comment stripping & syntax repair
- Fallback recipe schema compliance across all serving multipliers
- Request cancellation & AbortController stale response guard
- Mifflin-St Jeor metabolic calculators (BMI, BMR, TDEE, macros)

---

## 6. How the AI Works (Simple Explanation)

1. **You enter ingredients:** For example: *"eggs, spinach, tomatoes"*.
2. **Backend asks Groq AI:** The server asks the AI to create a balanced recipe using only those items.
3. **AI responds with structured data:** The AI sends back the recipe name, calories, ingredients, and steps in clean JSON format (not raw text).
4. **Data check (Zod):** The backend checks the data to make sure no steps or ingredients are missing.
5. **Interactive UI shows up:** The React app displays the recipe with clickable checkboxes, timers, and serving buttons.

---

## 6. How We Handle Errors & Slow Internet

We made sure the user never gets stuck with a broken or blank screen:

| What Could Go Wrong | How FITLIFE Handles It |
| :--- | :--- |
| **AI gives messy text** | The backend automatically cleans up quotes and brackets to extract the recipe cleanly. |
| **AI response is missing info** | If any required field is missing, the app shows a tested backup recipe so the user always gets a recipe. |
| **Request takes too long (>25s)** | If the AI takes too long, the request is stopped and a healthy backup recipe is shown with an alert note. |
| **API key is missing or limit reached** | The app stays 100% usable by serving tested offline recipes with a friendly notice. |
| **User clicks "Generate" twice fast** | The app cancels the first request so only the newest recipe appears. |

---

## 7. AI Tools Used

In line with the assignment guidelines:
- **AI Tools Used:** Claude and Gemini were used to help plan project structure, brainstorm recipe validation rules, and check math formulas for calorie calculations.
- **Code Authoring:** All React components, custom CSS, layout designs, button logic, and recipe timers were written, styled, and tested specifically for this project.

---

## 8. Known Limitations

1. **Exercise Videos:** Exercises use clear written instructions and muscle diagrams rather than heavy video files to keep the app fast.
2. **Smartwatch Sync:** Water, sleep, and steps are entered manually using quick buttons instead of syncing with Apple Watch or Fitbit.
3. **Basic Pantry Items:** The AI assumes you have salt, pepper, oil, and water at home unless you list them as things to avoid.

---

## 9. Time Spent on Project

Total time: **~7.5 hours**
- **Setup & Backend API (1.0 hr):** Setting up Express server, routes, and Groq connection.
- **Fridge-to-Recipe Feature (2.0 hrs):** AI prompts, JSON data validation, and backup recipes.
- **Frontend & Interactive Components (2.5 hrs):** Serving size buttons, cooking timers, step checkboxes, and dark mode UI.
- **Error Handling & Mobile Testing (1.0 hr):** Testing slow internet, cancellation, and mobile screen layouts.
- **UI Polish & Documentation (1.0 hr):** Modern glass cards, simple README, and easy setup instructions.

---

## 10. Application Screenshots & Screen Recording

### 🎥 Screen Recording Demo
<!-- Add your recorded Loom, YouTube, or Google Drive link below -->
- **Video Demo Link:** `[Add your 60-90 second demo recording link here]`  
  *(A short screen recording demonstrating: 1. Adding ingredients, 2. AI recipe generation, 3. Adjusting serving sizes (1x/2x/4x), and 4. Starting a cooking timer with checkbox tracking).*

### 📸 Application Views
- **Fridge-to-Recipe Interactive Generator (Primary Feature):**  
  `docs/screenshots/recipe-generator.png`  
  *Dynamic serving scale multipliers, ingredient checkboxes, step countdown timers with audio cues, and smart substitution recommendations.*

- **Athletic Performance Dashboard (Red & Black Edition):**  
  `docs/screenshots/dashboard.png`  
  *Live calorie breakdown, Mifflin-St Jeor BMI gauge, today's workout spotlight, and hydration tracker.*

- **Initial Empty State & Workflow Guide:**  
  `docs/screenshots/empty-state.png`  
  *Intuitive 3-step culinary guide presented when no recipe has been generated yet.*

