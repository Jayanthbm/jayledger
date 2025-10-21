#!/bin/bash

# Move to project root
cd "$(dirname "$0")"

# Create main folders
mkdir -p src/components/core
mkdir -p src/theme
mkdir -p src/screens

# Create core component files
touch src/components/core/Button.jsx
touch src/components/core/Card.jsx
touch src/components/core/Divider.jsx
touch src/components/core/Text.jsx
touch src/components/core/Loader.jsx
touch src/components/core/Skeleton.jsx

# Create theme files
touch src/theme/colors.js
touch src/theme/typography.js

# Create screens
touch src/screens/HomeScreen.jsx

echo "✅ All folders and files created successfully!"
