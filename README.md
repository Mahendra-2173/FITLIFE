# FitLife AI — Smart Fridge-to-Recipe Engine & Personal Health Suite

> **Frontend Internship Assignment Submission**  
> *Chosen Track: **Fridge-to-Recipe (Primary)** with supporting Fitness & Daily Health Management.*

FitLife AI is a production-grade, full-stack application built with **React 19**, **Node.js / Express**, **Zod**, and **Groq AI (LLaMA 3.3 70B)**. Rather than being a conversational chatbot, it transforms unpredictable LLM output into **interactive, stateful culinary & fitness tools**: scalable recipes with dynamic ingredient scaling, step-by-step cooking checklists with embedded timers, smart ingredient substitutions, and personalized fitness routines.

---

## 1. Project Overview

FitLife AI bridges the gap between what you have in your kitchen and what you need for optimal nutrition and fitness.
- **Primary Feature (Fridge-to-Recipe)**: Input the ingredients currently inside your refrigerator, specify dietary goals (high protein, keto, vegetarian, vegan, etc.) and exclusions, and the AI generates a chef-grade, macro-balanced recipe with interactive cooking steps, timers, and dynamic serving multipliers.
- **Supporting Features**: Guided workout stopwatch with rest countdowns and exercise alternatives, Mifflin-St Jeor body analysis (BMI, BMR, TDEE, macros), daily schedule timetable, hydration tracking, and analytics.

---

## 2. Main Features

### 🍳 Fridge-to-Recipe Generator (Primary Feature)
- **Free-Form & Tagged Ingredient Entry**: Type ingredients or click to add common staples (Chicken, Spinach, Oats, Eggs, Chickpeas, Olive oil, etc.).
- **Dietary & Lifestyle Filtering**: High-Protein, Vegetarian, Non-Vegetarian, Vegan, Keto / Low-Carb, Mediterranean, Gluten-Free.
- **Customizable Constraints**: Exclude unwanted ingredients (e.g., cilantro, dairy, pork), specify allergies, and cap cooking time (15, 25, 35, 50 mins).
- **Dynamic Serving Scaler**: Seamlessly adjust servings (1x, 2x, 4x, 6x); all ingredient quantities recalculate instantaneously in real time.
- **Interactive Checklists**: Check off prepped ingredients and mark cooking steps as completed.
- **Interactive Embedded Step Timers**: Cooking steps with specified durations include one-click start/pause timers with Web Audio chimes upon completion.
- **Smart Ingredient Substitutions**: Practical, chef-curated 1:1 ingredient alternatives for dietary flexibility.
- **Estimated Nutrition Breakdown**: Calories, protein, net carbs, fat, and fiber per serving with clear estimation disclaimers.
- **Follow-Up AI Refinement Loop**: Edit the recipe without starting over (e.g. *"Make it spicier"*, *"Convert for an air fryer"*).
- **Offline / Fallback Resilience**: If the AI model times out or rate limits, a verified, schema-compliant fallback recipe is displayed with a transparent notification badge.

### 🏋️ Supporting Fitness & Daily Management Features
- **Guided Workout Runner**: Real-time session stopwatch, set counter, rest countdown interval, audio cues, and exercise replacement.
- **Body Analysis & Calculators**: Mifflin-St Jeor BMR, BMI visualization gauge, TDEE, and macro distribution.
- **Exercise Library**: Searchable database categorized by muscle groups with biomechanical cues.
- **Daily Timetable**: Reorderable daily schedule with category tags and completion progress.
- **Habits Tracker**: Quick-add hydration logging (+250ml, +500ml, +750ml), sleep duration logger, and manual step entry.
- **Analytics & Progress**: Historical weight trend visualization via Recharts.
- **AI Coach**: Structured protocol advice (action checklist, nutrition tip, training cue, safety note) — **not** a chat bubble.

---

## 3. Tech Stack

- **Frontend**: React 19 (Hooks, Context API, Functional Components), React Router v7, Recharts, Lucide Icons, Modern Dark Slate & Emerald Green Design System.
- **Tooling**: Vite 8, Tailwind CSS v4, Oxlint.
- **Backend**: Node.js, Express.js, Zod (Structured schema validation), Groq SDK (`llama-3.3-70b-versatile`), CORS, Morgan.
- **Database**: In-memory store with optional MongoDB / Mongoose connection.

---

## 4. Project Architecture

```
FITLIFE/
├── .gitignore                # Root gitignore protecting secrets & build artifacts
├── package.json              # Root workspace manifest with multi-process runner
├── start.js                  # Zero-dependency launcher for backend + frontend
├── README.md                 # Complete documentation
│
├── backend/
│   ├── .env.example          # Template environment file
│   ├── package.json          # Express, groq-sdk, zod, mongoose
│   ├── test-suite.js         # Automated test suite for validation & AI fallbacks
│   └── src/
│       ├── index.js          # Express server entry point
│       ├── routes/           # REST endpoints
│       │   ├── nutrition.js  # Recipe generation, refinement, and meal plans
│       │   ├── workout.js    # Workouts and exercise replacement
│       │   ├── bodyAnalysis.js
│       │   ├── profile.js
│       │   ├── schedule.js
│       │   ├── coach.js
│       │   └── progress.js
│       ├── services/
│       │   ├── groqService.js # AI integration, JSON repair, timeouts, fallbacks
│       │   └── calculators.js # Scientific health formulas (BMR, BMI, TDEE)
│       └── validators/
│           └── schemas.js    # Zod schemas (Recipe, Workout, Schedule, Coach)
│
└── frontend/
    ├── package.json          # React, Vite, Recharts, Lucide
    ├── vite.config.js        # Vite config with backend API proxy
    └── src/
        ├── index.css         # Modern SaaS design system (Emerald / Slate)
        ├── App.jsx           # App shell with ErrorBoundary & routing
        ├── api/index.js      # Axios client with AbortSignal cancellation
        ├── context/          # UserContext, NutritionContext, WorkoutContext
        ├── components/       # Sidebar, BottomNav, PageHeader, ErrorBoundary, etc.
        └── pages/
            ├── Nutrition.jsx        # PRIMARY: Fridge-to-Recipe Suite
            ├── Dashboard.jsx        # SaaS Dashboard with Recipe Spotlight
            ├── WorkoutSession.jsx   # Guided workout runner with timers
            ├── Workouts.jsx         # AI workout generator + prompt bar
            ├── ExerciseLibrary.jsx  # Muscle group library & search
            ├── BodyAnalysis.jsx     # BMI, BMR, TDEE, macro calculations
            ├── DailyPlanner.jsx     # Reorderable timetable
            ├── ActivityTracker.jsx  # Hydration & sleep loggers
            ├── Progress.jsx         # Analytics & Recharts trends
            ├── AICoach.jsx          # Structured consultation blocks
            ├── Profile.jsx          # User settings
            └── Onboarding.jsx       # 4-step wizard
```

---

## 5. Installation Instructions

Per assignment requirements, running the project locally is straightforward:

```bash
# 1. Clone repository and navigate to root directory
git clone <repo_url>
cd FITLIFE

# 2. Install dependencies (root, backend, and frontend)
npm install
npm install --prefix backend
npm install --prefix frontend

# 3. Configure backend environment (optional - verified offline fallbacks work automatically)
cp backend/.env.example backend/.env

# 4. Start both backend and frontend concurrently
npm start
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`

---

## 6. Environment Variables

Create `backend/.env` based on `backend/.env.example`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `GROQ_API_KEY` | Groq AI API key (`gsk_...` from console.groq.com) | *Optional* (falls back to offline templates) |
| `MONGODB_URI` | MongoDB connection URI | *Optional* (falls back to memory store) |

---

## 7. Backend Setup

To run only the backend server:

```bash
cd backend
npm install
npm start
# Server listens on http://localhost:5000
```

To run the automated validation test suite:

```bash
npm test
```

---

## 8. Frontend Setup

To run only the frontend development server:

```bash
cd frontend
npm install
npm run dev
# Vite server starts at http://localhost:5173
```

To create an optimized production build:

```bash
npm run build --prefix frontend
```

---

## 9. How AI Integration Works

1. **Free-Form Input Collection**: The user enters available ingredients, dietary preferences, servings, and cooking time.
2. **Backend Gateway (`backend/src/routes/nutrition.js`)**: The request is validated by `validateRecipeRequest` before invoking the AI service.
3. **Structured Prompt Engineering (`backend/src/services/groqService.js`)**: The prompt acts as an executive chef, explicitly requesting valid JSON matching the exact `RecipeSchema` specification.
4. **Model Invocation with Timeout**: The backend calls Groq's `llama-3.3-70b-versatile` with temperature 0.6 and a strict 25-second `AbortController` timeout.
5. **JSON Extraction & Syntax Repair**: `extractJSON` cleans markdown code fences (` ```json `), strips trailing commas before closing braces, and handles unquoted keys.
6. **Zod Validation Gate**: `validateRecipe(parsed)` strictly validates the object structure.
7. **Frontend Rendering**: The frontend receives verified JSON and renders it into interactive stateful widgets (dynamic serving multipliers, step checkboxes, countdown timers, substitution panels).

---

## 10. How Structured Output is Validated

All AI output passes through Zod schemas in `backend/src/validators/schemas.js`:

- **`RecipeIngredientSchema`**: Enforces positive numeric quantity (`quantity: z.number().positive()`), non-empty name, and valid unit.
- **`RecipeInstructionSchema`**: Enforces positive integer step number, minimum instruction length, and non-negative timer minutes.
- **`RecipeSubstitutionSchema`**: Enforces original ingredient, substitute ingredient, and conversion ratio.
- **`EstimatedNutritionSchema`**: Enforces non-negative values for calories, protein, carbs, and fat, plus the mandatory estimation disclaimer.
- **`RecipeSchema`**: Validates the overall recipe entity, requiring at least one ingredient and instruction.

**Rule**: The backend *never* returns raw unvalidated AI output to the client. If validation fails, it triggers the verified fallback template and logs a detailed report.

---

## 11. Error-Handling & Resilience Approach

| Potential Failure Mode | How FITLIFE Handles It |
| :--- | :--- |
| **Malformed JSON** | `extractJSON` isolates outermost braces, strips trailing commas, removes JS comments, and repairs common syntax mistakes. |
| **Missing Fields / Wrong Types** | Zod rejects the response; the backend catches the error and serves a pre-validated fallback recipe. |
| **Slow Response (>25s)** | `AbortController` terminates the pending request and cleans up the timer; fallback data is served with a notice. |
| **Rate Limit (HTTP 429) / Invalid Key (401)** | Cleanly caught; logs meaningful message and returns 200 with `isFallback: true` so the user is never stranded with a blank screen. |
| **Stale Requests / Race Conditions** | Frontend uses `useRef(activeRequestId)` and `AbortController`. When a new generation or refinement is dispatched, previous in-flight responses are discarded. |
| **Client-Side Rendering Errors** | React `ErrorBoundary` (`frontend/src/components/ErrorBoundary.jsx`) wraps the application, preventing white-screen crashes and providing a one-click reload button. |

---

## 12. AI Tool Usage Disclosure

In compliance with the assignment instructions:
- **AI Assistance**: AI tools (Claude Sonnet & Gemini) were used for assisting with initial boilerplate structure, brainstorming edge-case failure modes in LLM JSON parsing, and verifying Mifflin-St Jeor algebraic formula implementations.
- **Original Work**: All architectural design decisions, Zod schema specifications, request cancellation logic, dynamic ingredient scaling math, UI component implementations, and CSS design system styling were authored and customized directly for this submission.

---

## 13. Known Limitations

1. **Demonstration Media**: The exercise library and recipes provide step-by-step written instructions and technique cues; full-motion animated 3D video models require external CDN bandwidth.
2. **Automated Wearable Sync**: Step counts and sleep are logged via user entry and quick-add actions rather than direct Apple Health / Google Fit Bluetooth syncing.
3. **Pantry Staple Assumptions**: The AI recipe engine assumes standard household cooking staples (cooking oil, salt, black pepper, water) unless explicitly listed in exclusions.

---

## 14. Time Spent

Total development time: **~7.5 hours**
- **Architecture & Scaffolding (1.0 hr)**: Setting up Express routes, Vite frontend, routing, and context providers.
- **Fridge-to-Recipe Engine & Zod Schemas (2.0 hrs)**: Structured JSON prompts, Zod validation, syntax repair, and fallback templates.
- **Frontend UI/UX & Interactive Tools (2.5 hrs)**: Dynamic serving scaler, checkable cooking steps, embedded step timers, and Recharts integration.
- **Failure Mode Hardening & Testing (1.0 hr)**: AbortController cancellation, race condition guards, error boundaries, and automated test suite.
- **Design System Polish & Documentation (1.0 hr)**: Dark slate & emerald green styling, mobile responsiveness testing, and README.
