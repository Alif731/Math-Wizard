import Avatar from "boring-avatars";

export const AVATAR_VARIANTS = [
  "beam",
  "marble",
  "pixel",
  "ring",
  "sunset",
  "bauhaus",
];

// Reusable colors for your theme
const PALETTES = {
  wizard: ["#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#1e1b4b"],
  cyber: ["#10b981", "#059669", "#34d399", "#064e3b", "#020617"],
  ocean: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#0c4a6e", "#f0f9ff"],
  arcade: ["#ff0055", "#00ffcc", "#3300ff", "#ffff00", "#1a1a1a"],
  sunset: ["#f43f5e", "#fb923c", "#fbbf24", "#e11d48", "#2e1065"],
  forest: ["#365314", "#65a30d", "#bef264", "#ecfccb", "#064e3b"],
  candy: ["#ff71ce", "#01cdfe", "#05ffa1", "#b967ff", "#fffb96"],
};

const UserAvatar = ({ name, variant, size = 40 }) => {
  const seed = name || "guest";

  // 1. Convert the seed string into a number
  const seedNum = seed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // 2. Round through the palettes
  const paletteKeys = Object.keys(PALETTES);
  const chosenKey = paletteKeys[seedNum % paletteKeys.length];
  const colors = PALETTES[chosenKey];

  const safeVariant = AVATAR_VARIANTS.includes(variant) ? variant : "beam";

  return (
    <Avatar
      size={size}
      name={seed}
      variant={safeVariant}
      colors={colors} // Automatically picks wizard, cyber, ocean, or arcade!
    />
  );
};
export default UserAvatar;
