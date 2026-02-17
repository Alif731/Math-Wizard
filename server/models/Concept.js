const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "direct",
      "distractor",
      "comparison_trap",
      "algebraic",
      "conceptual",
      "visual",
      "icons_items" 
    ],
    default: "direct",
  },
  difficulty: { type: Number, default: 1 },
  options: [{ type: String }],

  visualData: {
    // --- Bar Model Fields ---
    parts: [{ 
      value: Number, 
      label: String, 
      color: String 
    }],
    showTotal: Boolean,

    // --- Icon Model Fields (Moved INSIDE here) ---
    operator: String, // Stores "+" or "-"
    groups: [{        
      count: Number, 
      icon: String,   // "apple", "car", etc.
      label: String 
    }],
    dragOptions: [String]
  },

  correctAnswer: { type: String, required: true },
  explanation: { type: String },
  generatedByAI: { type: Boolean, default: false },
  verifiedByTeacher: { type: Boolean, default: true },
});
const conceptSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // e.g., 'add_single'
    title: { type: String, required: true },
    description: { type: String },
    prerequisites: [{ type: String }], // List of concept IDs
    questions: [questionSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Concept", conceptSchema);
