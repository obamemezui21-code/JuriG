#!/bin/bash
# Setup script for UI/UX System
# Run this after npm install to verify all files are in place

echo "🎨 UI/UX System Setup Verification"
echo "=================================="
echo ""

# Check if all required files exist
files_to_check=(
  "src/utils/contrastUtils.js"
  "src/utils/icons.js"
  "src/components/AccessibleText.jsx"
  "src/components/ImageWithOverlay.jsx"
  "src/components/ThemeToggle.jsx"
  "src/context/ThemeContext.jsx"
  "src/styles/responsive.css"
  "src/styles/themeToggle.css"
  "src/pages/UIUXDemo.jsx"
  "UI_UX_SYSTEM.md"
  "AI_CODE_GENERATION_INSTRUCTIONS.md"
  "QUICK_MIGRATION_GUIDE.md"
)

missing_files=()

for file in "${files_to_check[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file"
    missing_files+=("$file")
  fi
done

echo ""
echo "=================================="

if [ ${#missing_files[@]} -eq 0 ]; then
  echo "✅ All UI/UX system files are in place!"
  echo ""
  echo "Next steps:"
  echo "1. npm start"
  echo "2. Check for the theme toggle button in top-right corner"
  echo "3. Try toggling between light and dark modes"
  echo "4. View demo at: http://localhost:3000/uiux-demo (when added to routes)"
  echo ""
  echo "Documentation:"
  echo "- UI_UX_SYSTEM.md - Full system documentation"
  echo "- AI_CODE_GENERATION_INSTRUCTIONS.md - For developers"
  echo "- QUICK_MIGRATION_GUIDE.md - How to use in existing pages"
else
  echo "⚠️  Missing ${#missing_files[@]} files:"
  for file in "${missing_files[@]}"; do
    echo "  - $file"
  done
  echo ""
  echo "Please ensure all files from the UI/UX system are created."
fi
