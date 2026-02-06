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
    ],
    default: "direct",
  },
  difficulty: { type: Number, default: 1 }, // 1-10 scale
  options: [{ type: String }], // For multiple choice if needed, otherwise empty for input

  visualData: {
    parts: [{ 
      value: Number, 
      label: String, 
      color: String 
    }],
    showTotal: Boolean // If true, we show "?"; if false, we might show the total
  },

  correctAnswer: { type: String, required: true },
  explanation: { type: String },
  generatedByAI: { type: Boolean, default: false },
  verifiedByTeacher: { type: Boolean, default: true }, // Manual seed is verified
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
