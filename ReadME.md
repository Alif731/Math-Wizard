This implementation guide provides a step-by-step roadmap for building the **Personalized Web-Based Learning System**, integrating the **MERN stack**, **KL-UCB algorithm**, and a **Prerequisite-Based Concept Graph**.

---

#  Project Implementation Guide: Adaptive Math Learning System

## 1. System Architecture & Tech Stack

The project follows a modular 3-tier architecture:

* 
**Frontend**: React.js (Vite), Tailwind CSS (for child-friendly UI).


* 
**Backend**: Node.js & Express.js (Learning Orchestrator).


* 
**Database**: MongoDB (to handle the flexible hierarchical Concept Graph).


* 
**AI Engine**: Google Gemini API (used exclusively for teacher-verified content generation).



---

## 2. Phase 1: Knowledge Modeling (Month 1)

### **Task 1.1: Design the Concept Graph**

Instead of a linear path, map math word problems as a Directed Acyclic Graph (DAG).

* 
**Node Definition**: Each node represents a specific skill (e.g., "Single-digit Addition with Distractors").


* 
**Dependencies**: Define edges where "Concept A" must be mastered before "Concept B" enters the **Zone of Proximal Development (ZPD)**.



### **Task 1.2: Curate Initial Problem Sets**

* 
**Initial Bank**: Create a manual seed of 10–15 questions per concept node to test the adaptive engine.


* 
**Difficulty Scaling**: Categorize questions within nodes by cognitive complexity: **Direct**, **Distractor**, **Comparison Trap**, and **Algebraic**.



---

## 3. Phase 2: Core Algorithm Development (Month 2)

### **Task 2.1: Activity Selector (KL-UCB)**

Implement the **Multi-Armed Bandit (KL-UCB)** algorithm:

* 
**ZPD Constraint**: The selector can *only* pull concepts from the current ZPD boundary.


* 
**Exploration/Exploitation**: The algorithm balances practicing "shaky" concepts versus introducing a new concept from the graph.



### **Task 2.2: Mastery Detection (Sliding Window)**

Apply a conservative mastery check:

* 
**Window Logic**: Maintain an array of the last  attempts (e.g., 8–10) per concept.


* 
**Promotion**: If the success rate exceeds  (e.g., 80%), mark the node as **Mastered** and update the ZPD boundary.



---

## 4. Phase 3: Teacher-Controlled AI & Safety (Month 2.5)

### **Task 3.1: Simulated AI Generator**

* 
**Sandbox**: Build a teacher-only dashboard to generate new problem variations using Gemini.


* 
**Verification Gate**: Generated questions remain in a "Draft" status until a teacher manually reviews and clicks "Approve".


* 
**Symbolic Check**: Use `mathjs` in the backend to ensure the AI's story problem actually equals the intended numerical answer.



### **Task 3.2: Safety & Fallback Engine**

* 
**Fallback Mode**: If a student's performance is erratic or very low, trigger "Safe Mode"—a predefined, fixed curriculum sequence that ignores the bandit algorithm.


* 
**Audit Logging**: Every selection made by the KL-UCB and every mastery change must be logged for teacher review.



---

## 5. Phase 4: UI, Scaffolding & Gamification (Month 3)

### **Task 4.1: Scaffolding UI**

Design interactive feedback for incorrect responses:

* 
**Visual Aids**: Implement React components for bar models (Part-Part-Whole) or number lines to visualize the word problem.


* 
**Step-by-Step**: Break down multi-step problems into smaller, manageable chunks after a mistake.



### **Task 4.2: Reward Mechanism**

* 
**Star/Cookie Jar**: Create a visual reward system where students earn digital tokens for streaks or mastering new graph nodes.


* 
**Progress Dashboard**: A student-facing view showing their "unlocked" nodes in the Concept Graph.



---

## 6. Implementation Checklist & Data Schema

| Feature | Data Requirements | Safety Constraint |
| --- | --- | --- |
| **Concept Graph** | Node ID, Parent IDs, Mastery Status | No node unlocked without parents.

 |
| **Attempt Logger** | Student ID, Concept ID, Score, Timestamp | Immutable log for audit purposes.

 |
| **AI Generator** | Topic, Difficulty Level, Math Operation | No direct AI output to students.

 |
| **ZPD State** | Current Active Nodes, KL-UCB Scores | Strictly bounded to the graph edges.

 |

