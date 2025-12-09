/**
 * Color name to hex code mapping for product variants
 * Maps all 74 colors from the product catalog to their hex code equivalents
 */

export const COLOR_HEX_MAP: Record<string, string> = {
  "Antique Bronze": "#6B4423",
  "Aqua Green": "#00CED1",
  "Beige Wood": "#D2B48C",
  "Black": "#000000",
  "Black - Silver Chrome": "#1C1C1C",
  "Black Beauty": "#0A0A0A",
  "Black Ebony": "#1A1A1A",
  "Black Glass": "#0F0F0F",
  "Blue": "#0000FF",
  "Bottle Green": "#006A4E",
  "Bronze Blaze": "#CD7F32",
  "Bronze Mirror": "#8B4513",
  "Brown Mahogany": "#C04000",
  "Brush Silver": "#C0C0C0",
  "Caramel Brown": "#AF6E4D",
  "Champagne Gold": "#F7E7CE",
  "Charcoal Black": "#36454F",
  "Charcoal Grey": "#36454F",
  "Chocolate Hardwood": "#3D2817",
  "Chrome Bezel": "#E8E8E8",
  "Cinnamon Wood": "#D2691E",
  "Classic Grey": "#808080",
  "Copper Mirror": "#B87333",
  "Dark Chocolate Wood": "#3D2817",
  "Dark Walnut": "#3D2817",
  "Desert Gold": "#C19A6B",
  "Dusky Wood": "#8B7355",
  "Eco Grey": "#8C8C8C",
  "Firestorm Orange": "#FF4500",
  "Frosted Husky": "#E0E0E0",
  "Frosted State": "#F0F0F0",
  "Glacier White": "#F8F8FF",
  "Gold": "#FFD700",
  "Gold Blush": "#F5DEB3",
  "Gold Rush": "#DAA520",
  "Gold Shimmer": "#FFD700",
  "Golden Ash": "#DAA520",
  "Golden Pecan": "#C9A961",
  "Graphite": "#383838",
  "Graphite Black": "#1C1C1C",
  "Grey": "#808080",
  "Ice Silver": "#C0C0C0",
  "Icy White": "#F0F8FF",
  "Igloo White": "#F8F8FF",
  "Jet Black": "#0A0A0A",
  "Magnesium Grey": "#B0B0B0",
  "Marble": "#E8E8E8",
  "Metallic Gold": "#D4AF37",
  "Metallic Grey": "#A8A8A8",
  "Mocha Wood": "#6F4E37",
  "Moonlight Silver": "#C0C0C0",
  "Mountain Grey": "#6B6B6B",
  "Mystic Marble Finish": "#E8E8E8",
  "Nebula Black": "#1C1C1C",
  "Oak Wood": "#C19A6B",
  "Onyx Black": "#0F0F0F",
  "Raven Black": "#0A0A0A",
  "Red": "#FF0000",
  "Rose Gold": "#E8B4B8",
  "Ruby Red": "#E0115F",
  "Rustic Gold": "#CD853F",
  "Sandi Wood": "#C9A961",
  "Satin Chrome": "#C0C0C0",
  "Silky Silver": "#C0C0C0",
  "Silver Sheen": "#C0C0C0",
  "Snow White": "#FFFAFA",
  "Sparkle Black": "#1A1A1A",
  "Sterling Silver": "#C0C0C0",
  "Stone Grey": "#8B8680",
  "Velvet Black": "#0F0F0F",
  "Vintage Gold": "#CD853F",
  "White": "#FFFFFF",
  "White - Silver Chrome": "#F5F5F5",
  "White Marble Finish": "#F8F8F8"
};

/**
 * Get hex code for a color name
 * @param colorName - The color name to look up
 * @returns The hex code for the color, or a default gray if not found
 */
export function getColorHex(colorName: string | null | undefined): string {
  if (!colorName) {
    return "#808080"; // Default gray
  }
  
  // Try exact match first
  if (COLOR_HEX_MAP[colorName]) {
    return COLOR_HEX_MAP[colorName];
  }
  
  // Try case-insensitive match
  const normalizedName = colorName.trim();
  const found = Object.keys(COLOR_HEX_MAP).find(
    key => key.toLowerCase() === normalizedName.toLowerCase()
  );
  
  if (found) {
    return COLOR_HEX_MAP[found];
  }
  
  // Fallback to default gray
  return "#808080";
}

/**
 * Check if a color name exists in the mapping
 * @param colorName - The color name to check
 * @returns True if the color exists in the mapping
 */
export function hasColorHex(colorName: string | null | undefined): boolean {
  if (!colorName) {
    return false;
  }
  
  const normalizedName = colorName.trim();
  return Object.keys(COLOR_HEX_MAP).some(
    key => key.toLowerCase() === normalizedName.toLowerCase()
  );
}

/**
 * Get all available color names
 * @returns Array of all color names in the mapping
 */
export function getAllColorNames(): string[] {
  return Object.keys(COLOR_HEX_MAP);
}

