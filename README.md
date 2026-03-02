# 🧮 Personalized Math Word Problem Learning System

An adaptive, intelligent learning platform built with the **MERN stack** that teaches math word problems using the **KL-UCB algorithm** and a **Prerequisite-Based Concept Graph**.

---

## 🚀 Overview

This platform dynamically personalizes the learning journey for each student. By mapping math skills as a Directed Acyclic Graph (DAG), the system ensures students only encounter problems within their **Zone of Proximal Development (ZPD)**—challenging enough to learn, but not so hard they get discouraged.

## ✨ Key Features

-   **Adaptive Learning Engine**: Powered by the **KL-UCB (Knowledge-Gradient Upper Confidence Bound)** algorithm to balance reinforcement and exploration.
-   **Intelligent Scaffolding**: Uses **DnD Kit** for interactive drag-and-drop questions and provides step-by-step feedback for incorrect answers.
-   **Concept Graph Architecture**: Hierarchical mastery tracking ensures foundational skills (e.g., simple addition) are solid before moving to complex word problems.
-   **Teacher Dashboard**: Sandbox environment for generating and verifying AI-crafted math problems using the **Google Gemini API**.
-   **Mathematical Precision**: Integrated with **mathjs** to ensure absolute accuracy in problem generation and student evaluation.
-   **Responsive & Gamified UI**: A modern, child-friendly interface built with **React**, **Sass**, and **Tailwind CSS**.

## 🛠️ Tech Stack

-   **Frontend**: React 19, Vite, Redux Toolkit, DnD Kit, Sass, Tailwind CSS.
-   **Backend**: Node.js, Express.js (v5), MongoDB, Mongoose.
-   **Utilities**: mathjs, Concurrently (for local development).

## 📁 Project Structure

```text
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Dashboard, DragDropQuestion, QuestionCard, etc.
│   │   ├── pages/          # Home, ConceptMap, SelectionLevel, Profile.
│   │   ├── store/          # Redux Toolkit slices (auth, api, game).
│   │   └── sass/           # Modular SCSS styles and variables.
├── server/                 # Express backend application
│   ├── models/             # Mongoose Schemas (User, Concept, Attempt).
│   ├── routes/             # API Endpoints.
│   ├── utils/              # KL-UCB Engine, Seeders, and math utilities.
│   └── controllers/        # Learning and game logic.
```

## ⚙️ Installation & Setup

### 1. Clone & Install
```bash
git clone https://github.com/Alif731/Personalized-web-based-learning-app-for-teaching-math-word-problems.git
cd Personalized-web-based-learning-app-for-teaching-math-word-problems
npm install
# Also install dependencies in subdirectories
cd client && npm install
cd ../server && npm install
cd ..
```

### 2. Environment Configuration
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_key
```

### 3. Run Development Servers
From the **root directory**, run both the frontend and backend concurrently:
```bash
npm run dev
```

---

## 🧠 The Learning Engine

### Mastery Detection
The system tracks a student's last N attempts. Once the success rate crosses a defined threshold (e.g., 80%), the concept node is marked as **Mastered**, unlocking the next tier of the Concept Graph.

### Safety Mode
If a student's performance drops significantly or becomes erratic, the engine automatically switches to a "Fixed Curriculum" mode to rebuild confidence before re-engaging the adaptive algorithm.

---

