const mongoose = require("mongoose");

const conceptSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    prerequisites: [{ type: String }],
    
    questions: [
      {
        text: { type: String, required: true },
        correctAnswer: { type: String, required: true },
        type: {
          type: String,
          enum: ["direct", "distractor", "comparison_trap", "algebraic", "conceptual", "visual", "icons_items"],
          default: "direct",
        },
        difficulty: { type: Number, default: 1 },
        options: [String],

        operands: [Number],

        visualData: {
          showTotal: Boolean,
          operator: String,
          dragOptions: [String],

          parts: [{
            value: Number,
            label: String,
            color: String
          }],
          
          groups: [{
            count: Number,
            icon: String,
            label: String
          }]
        },

        explanation: String,
        generatedByAI: { type: Boolean, default: false },
        verifiedByTeacher: { type: Boolean, default: true },
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Concept", conceptSchema);
