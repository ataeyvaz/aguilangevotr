# AguiLangEvoTR 🦅

Türkçe konuşanlar için dil öğrenme uygulaması. TR→EN, TR→ES, TR→PT dil çiftlerini destekler.
React, Vite ve Capacitor ile geliştirilmiştir.

## Features

- 📚 **Vocabulary Learning** - Interactive flashcards with audio support
- 🎯 **Quiz Modes** - Recognition, recall, and sentence building exercises
- 🗣️ **Speech Practice** - Voice recognition for pronunciation training
- 📝 **Grammar Lessons** - Structured lessons with examples and exercises
- 🎮 **Games** - Speed quiz and sentence building games
- 📊 **Progress Tracking** - Daily stats and word-level statistics

## Tech Stack

- **Frontend:** React 19 + Vite
- **Styling:** Tailwind CSS
- **Mobile:** Capacitor (Android)
- **Audio:** Web Speech API + MyMemory Translation API

## Getting Started

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
npm run android
```

## Project Structure

```
src/
  components/    # Reusable UI components
  pages/        # Main application pages
  hooks/        # Custom React hooks
  services/     # API and utility services
  store/        # State management
  data/         # JSON data files
  utils/        # Helper functions