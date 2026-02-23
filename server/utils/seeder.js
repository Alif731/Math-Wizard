const Concept = require("../models/Concept");
const User = require("../models/User");
const Attempt = require("../models/Attempt");

const conceptsData = [
  {
    id: "foundation_signs",
    title: "Foundation: Choosing Operations",
    description: "Identify whether to Add, Subtract, Multiply, or Divide.",
    prerequisites: [], // Start here
    questions: [
      // --- ADDITION SIGNS ---
      {
        text: "A box has 7 items. You add 5 more.",
        correctAnswer: "+",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [7, 5],
      },
      {
        text: "A box has 12 items. You add 4 more.",
        correctAnswer: "+",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [12, 4],
      },

      // --- SUBTRACTION SIGNS ---
      {
        text: "A box has 10 items. You remove 2.",
        correctAnswer: "-",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [10, 2],
      },
      {
        text: "A box has 5 items. You remove 3.",
        correctAnswer: "-",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [5, 3],
      },
      {
        text: "A box has 5 items. You remove 4.",
        correctAnswer: "-",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 1,
        options: ["+", "-", "×", "÷"],
        operands: [5, 4],
      },

      // --- MULTIPLICATION SIGNS (Difficulty 2) ---
      {
        text: "There are 4 boxes with 11 items in each.",
        correctAnswer: "×",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 2,
        options: ["+", "-", "×", "÷"],
        operands: [4, 11],
      },

      // --- DIVISION SIGNS (Difficulty 2) ---
      {
        text: "44 items are shared into 4 piles.",
        correctAnswer: "÷",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 2,
        options: ["+", "-", "×", "÷"],
        operands: [44, 4],
      },
      {
        text: "22 items are shared into 2 piles.",
        correctAnswer: "÷",
        concept: "foundation_signs",
        type: "conceptual",
        difficulty: 2,
        options: ["+", "-", "×", "÷"],
        operands: [22, 2],
      },
    ],
  },
  // ====================================================
  // 2. LEVEL 2: Bar Model
  // ====================================================
  {
    id: "visual_addition",
    title: "Visual Addition",
    description: "Using bar models to visualize addition.",
    prerequisites: ["foundation_signs"], // 1. Must master signs first
    questions: [
      {
        text: "Ella has 17 red marbles and 6 blue marbles. How many marbles does she have in total?",
        correctAnswer: "23",
        type: "visual", // <--- New Type
        difficulty: 1,
        visualData: {
          showTotal: true, // Shows the "?" bracket
          parts: [
            { value: 17, label: "17", color: "#fca5a5" },
            { value: 6, label: "6", color: "#93c5fd" },
          ],
        },
      },
      {
        text: "Liam has 10 stickers. He buys 5 more. How much stickers is there with him?",
        correctAnswer: "15",
        type: "visual",
        difficulty: 1,
        visualData: {
          showTotal: true,
          parts: [
            { value: 10, label: "10", color: "#fcd34d" }, // Yellow
            { value: 5, label: "5", color: "#86efac" }, // Green
          ],
        },
      },
      {
        text: "Sam has 18 cards. Someone gives them 6 more. How many cards do they have altogether?",
        correctAnswer: "24",
        type: "visual",
        difficulty: 1,
        visualData: {
          showTotal: true,
          parts: [
            { value: 18, label: "18", color: "#fc4d4d" },
            { value: 6, label: "6", color: "#efdc86" },
          ],
        },
      },
      {
        text: "In a class there are 9 boys and 13 girls. How many children are in the class?",
        correctAnswer: "22",
        type: "visual",
        difficulty: 2,
        visualData: {
          showTotal: true,
          parts: [
            { value: 9, label: "9", color: "#fd93d4" },
            { value: 13, label: "13", color: "#a5fce6" },
          ],
        },
      },
      {
        text: "A shop had 18 books. They received 3 more. How many books does the shop have now?",
        correctAnswer: "21",
        type: "visual",
        difficulty: 2,
        visualData: {
          showTotal: true,
          parts: [
            { value: 18, label: "18", color: "#E07A5F" },
            { value: 3, label: "3", color: "#F2CC8F" },
          ],
        },
      },
    ],
  },

  // ====================================================
  // 3. LEVEL: Icon items
  // ====================================================
  {
    id: "visual_icons",
    title: "Match the Operations",
    description: "Match The Following",
    prerequisites: ["visual_addition"],
    questions: [
      {
        text: "Connect the problem on the left to its correct answer on the right",
        correctAnswer: "matched",
        type: "icons_items",
        difficulty: 2,
        visualData: {
          leftItems: [
            {
              id: "L1",
              type: "iconEquation",
              groups: [
                { count: 4, icon: "cat" },
                { count: 2, icon: "cat" },
              ],
              operator: "+",
              matchId: "R1",
            },
            { id: "L2", type: "text", content: "15 - 8", matchId: "R2" }, // Equals 7
            {
              id: "L3",
              type: "iconEquation",
              groups: [
                { count: 3, icon: "banana" },
                { count: 3, icon: "banana" },
              ],
              operator: "×",
              matchId: "R3", // Equals 9
            },
            { id: "L4", type: "text", content: "12 ÷ 3", matchId: "R4" }, // Equals 4
          ],
          rightItems: [
            { id: "R3", type: "text", content: "9" },
            { id: "R4", type: "text", content: "4" },
            { id: "R1", type: "text", content: "6" },
            { id: "R5", type: "text", content: "8" }, // Distractor
            { id: "R2", type: "text", content: "7" },
          ],
        },
      },
      {
        text: "Connect the problem on the left to its correct answer on the right",
        correctAnswer: "matched",
        type: "icons_items",
        difficulty: 3,
        visualData: {
          leftItems: [
            {
              id: "L1",
              type: "iconEquation",
              groups: [
                { count: 5, icon: "orange" },
                { count: 3, icon: "orange" },
              ],
              operator: "+",
              matchId: "R1", // Equals 8
            },
            { id: "L2", type: "text", content: "14 - 5", matchId: "R2" }, // Equals 9
            {
              id: "L3",
              type: "iconEquation",
              groups: [
                { count: 3, icon: "pencil" },
                { count: 2, icon: "pencil" },
              ],
              operator: "×",
              matchId: "R3", // Equals 6
            },
            { id: "L4", type: "text", content: "16 ÷ 4", matchId: "R4" }, // Equals 4
          ],
          rightItems: [
            { id: "R4", type: "text", content: "4" },
            { id: "R2", type: "text", content: "9" },
            { id: "R5", type: "text", content: "10" }, // Distractor
            { id: "R3", type: "text", content: "6" },
            { id: "R1", type: "text", content: "8" },
          ],
        },
      },
      {
        text: "Connect the problem on the left to its correct answer on the right",
        correctAnswer: "matched",
        type: "icons_items",
        difficulty: 3,
        visualData: {
          leftItems: [
            {
              id: "L1",
              type: "iconEquation",
              groups: [
                { count: 3, icon: "dog" },
                { count: 4, icon: "dog" },
              ],
              operator: "+",
              matchId: "R1", // Equals 7
            },
            { id: "L2", type: "text", content: "20 - 8", matchId: "R2" }, // Equals 12
            {
              id: "L3",
              type: "iconEquation",
              groups: [
                { count: 5, icon: "apple" },
                { count: 2, icon: "apple" },
              ],
              operator: "×",
              matchId: "R3", // Equals 10
            },
            { id: "L4", type: "text", content: "15 ÷ 3", matchId: "R4" }, // Equals 5
          ],
          rightItems: [
            { id: "R1", type: "text", content: "7" },
            { id: "R5", type: "text", content: "15" }, // Distractor
            { id: "R3", type: "text", content: "10" },
            { id: "R2", type: "text", content: "12" },
            { id: "R4", type: "text", content: "5" },
          ],
        },
      },
      {
        text: "Connect the problem on the left to its correct answer on the right",
        correctAnswer: "matched",
        type: "icons_items",
        difficulty: 4,
        visualData: {
          leftItems: [
            {
              id: "L1",
              type: "iconEquation",
              groups: [
                { count: 6, icon: "star" },
                { count: 3, icon: "star" },
              ],
              operator: "+",
              matchId: "R1", // Equals 9
            },
            { id: "L2", type: "text", content: "18 - 7", matchId: "R2" }, // Equals 11
            {
              id: "L3",
              type: "iconEquation",
              groups: [
                { count: 4, icon: "car" },
                { count: 3, icon: "car" },
              ],
              operator: "×",
              matchId: "R3", // Equals 12
            },
            { id: "L4", type: "text", content: "20 ÷ 5", matchId: "R4" }, // Equals 4
          ],
          rightItems: [
            { id: "R2", type: "text", content: "11" },
            { id: "R1", type: "text", content: "9" },
            { id: "R4", type: "text", content: "4" },
            { id: "R3", type: "text", content: "12" },
            { id: "R5", type: "text", content: "10" }, // Distractor
          ],
        },
      },
      {
        text: "Connect the problem on the left to its correct answer on the right",
        correctAnswer: "matched",
        type: "icons_items",
        difficulty: 4,
        visualData: {
          leftItems: [
            {
              id: "L1",
              type: "iconEquation",
              groups: [
                { count: 2, icon: "banana" },
                { count: 6, icon: "banana" },
              ],
              operator: "+",
              matchId: "R1", // Equals 8
            },
            { id: "L2", type: "text", content: "11 - 4", matchId: "R2" }, // Equals 7
            {
              id: "L3",
              type: "iconEquation",
              groups: [
                { count: 5, icon: "pencil" },
                { count: 3, icon: "pencil" },
              ],
              operator: "×",
              matchId: "R3", // Equals 15
            },
            { id: "L4", type: "text", content: "18 ÷ 3", matchId: "R4" }, // Equals 6
          ],
          rightItems: [
            { id: "R3", type: "text", content: "15" },
            { id: "R4", type: "text", content: "6" },
            { id: "R5", type: "text", content: "9" }, // Distractor
            { id: "R1", type: "text", content: "8" },
            { id: "R2", type: "text", content: "7" },
          ],
        },
      },
    ],
  },
  // ====================================================
  // 4. LEVEL: Word Problems
  // ====================================================
  {
    id: "add_single",
    title: "Single Digit Addition",
    description: "Adding numbers from 0 to 9.",
    prerequisites: ["visual_addition"],
    questions: [
      {
        text: "If you have 4 apples and get 2 more, how many do you have?",
        correctAnswer: "6",
        type: "direct",
        difficulty: 1,
      },
      {
        text: "Raju has 9 pencils. Geeta gives him 3 more. How many pencils does Raju have now?",
        correctAnswer: "12",
        type: "direct",
        difficulty: 1,
      },
      // {
      //   text: "5 + 0 = ?",
      //   correctAnswer: "5",
      //   type: "distractor",
      //   difficulty: 1,
      // },
      // { text: "3 + 4", correctAnswer: "7", type: "direct", difficulty: 2 },
      // {
      //   text: "What is 9 + 1?",
      //   correctAnswer: "10",
      //   type: "direct",
      //   difficulty: 2,
      // },
    ],
  },
  {
    id: "sub_single",
    title: "Single Digit Subtraction",
    description: "Subtracting numbers from 0 to 9.",
    prerequisites: ["add_single"],
    questions: [
      { text: "5 - 2 = ?", correctAnswer: "3", type: "direct", difficulty: 1 },
      { text: "9 - 1 = ?", correctAnswer: "8", type: "direct", difficulty: 1 },
      {
        text: "You have 5 candies and eat 5. How many are left?",
        correctAnswer: "0",
        type: "distractor",
        difficulty: 2,
      },
    ],
  },
  {
    id: "add_double_no_carry",
    title: "Double Digit Addition (No Carry)",
    description: "Adding numbers like 10 + 20.",
    prerequisites: ["add_single"],
    questions: [
      {
        text: "10 + 10 = ?",
        correctAnswer: "20",
        type: "direct",
        difficulty: 3,
      },
      {
        text: "12 + 5 = ?",
        correctAnswer: "17",
        type: "direct",
        difficulty: 3,
      },
    ],
  },
  {
    id: "mixed_ops_basic",
    title: "Basic Mixed Operations",
    description: "Simple addition and subtraction mixed.",
    prerequisites: ["sub_single", "add_double_no_carry"],
    questions: [
      {
        text: "5 + 2 - 1 = ?",
        correctAnswer: "6",
        type: "algebraic",
        difficulty: 4,
      },
    ],
  },
];

const seedData = async () => {
  try {
    const count = await Concept.countDocuments();
    if (count > 0) return; // Already seeded

    await Concept.deleteMany({});
    await User.deleteMany({});
    await Attempt.deleteMany({});

    await Concept.insertMany(conceptsData);
    console.log("Concepts Seeded");

    const testUser = new User({
      username: "student1",
      role: "student",
      mastery: {},
      // zpdNodes: ["foundation_signs"], // sign selection
      // zpdNodes: ["visual_addition"], // bar
      zpdNodes: ["visual_icons"], // Drag and Drop
      // zpdNodes: ["add_single"], // normal
    });

    // Initialize mastery for root
    // testUser.mastery.set("foundation_signs", {// sign selection
    // testUser.mastery.set("visual_addition", {// bar
    testUser.mastery.set("visual_icons", {
      // Drag and Drop
      // testUser.mastery.set("add_single", {// normal
      status: "unlocked",
      successCount: 0,
      attemptCount: 0,
      lastAttempts: [],
    });

    await testUser.save();
    console.log("Test User Seeded");
  } catch (error) {
    console.error("Seeding Error:", error);
  }
};

module.exports = seedData;
