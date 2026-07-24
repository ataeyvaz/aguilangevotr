import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import AppLayout from '../components/layout/AppLayout'

import ProfileSetup   from '../pages/ProfileSetup'
import LanguageSelect from '../pages/LanguageSelect'
import CategorySelect from '../pages/CategorySelect'
import FlashCards     from '../pages/FlashCards'
import Dashboard      from '../pages/Dashboard'
import ParentGate     from '../pages/parent/ParentGate'
import ParentPanel    from '../pages/parent/ParentPanel'
import LearnedWords   from '../pages/LearnedWords'
import LearningReport from '../pages/LearningReport'
import Reinforce      from '../pages/Reinforce'
import StatsPage      from '../pages/StatsPage'
import DialogueScreen from '../pages/DialogueScreen'
import ProfilePage    from '../pages/ProfilePage'
import GrammarPage    from '../pages/GrammarPage'
import GrammarLessonPage from '../pages/GrammarLessonPage'
import LearnHub       from '../pages/LearnHub'
import DictionaryPage from '../pages/DictionaryPage'
import TicTacToe     from '../pages/TicTacToePage'
import LevelsPage     from '../pages/LevelsPage'
import PlacementTest  from '../components/PlacementTest'
import Study          from '../pages/Study'
import Practice       from '../pages/Practice'
import ChatBot        from '../pages/ChatBot'
import ScenariosPage from '../pages/ScenariosPage'
import ScenarioRunner from '../pages/ScenarioRunner'
import QuizCore from '../pages/QuizCore'
import SentenceBuilder from '../pages/SentenceBuilder'
import Shadowing from '../pages/Shadowing'
import FillBlank from '../pages/FillBlank'
import PatternDrill from '../pages/PatternDrill'
import ChainMode from '../pages/ChainMode'
import DialogueComplete from '../pages/DialogueComplete'
import Dictation from '../pages/Dictation'

// ── Akıllı yönlendirme (root "/") ────────────────────────
function SmartRoot() {
  const { profile } = useApp()
  // Seviye testi artık ZORUNLU DEĞİL — eğitim akışına müdahale etmez.
  // İsteğe bağlı olarak Profil > "Seviyeni Ölç" üzerinden çalışır.
  if (!profile) return <Navigate to="/setup"     replace />
  return               <Navigate to="/dashboard" replace />
}

// ── Router ───────────────────────────────────────────────
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root → akıllı yönlendirme */}
        <Route path="/" element={<SmartRoot />} />

        {/* Standalone — layout yok */}
        <Route path="/setup"           element={<ProfileSetup />} />
        <Route path="/placement-test"  element={<PlacementTest />} />
        <Route path="/study"           element={<Study />} />
        <Route path="/practice"        element={<Practice />} />
        <Route path="/chatbot"         element={<ChatBot />} />
        <Route path="/ChatBot" element={<Navigate to="/chatbot" replace />} />
        <Route path="/scenarios"       element={<ScenariosPage />} />
        <Route path="/scenario"        element={<ScenarioRunner />} />
        <Route path="/quiz-core"       element={<QuizCore />} />
        <Route path="/sentence"        element={<SentenceBuilder />} />
        <Route path="/shadow"          element={<Shadowing />} />
        <Route path="/fill-blank"      element={<FillBlank />} />
        <Route path="/pattern"         element={<PatternDrill />} />
        <Route path="/chain"           element={<ChainMode />} />
        <Route path="/complete"        element={<DialogueComplete />} />
        <Route path="/dictation"       element={<Dictation />} />
        <Route path="/language"        element={<LanguageSelect />} />
        <Route path="/settings"          element={<ParentGate />} />
        <Route path="/settings/panel"  element={<ParentPanel />} />

        {/* Layout içinde — sidebar + bottomnav var */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/categories"  element={<CategorySelect />} />
          <Route path="/learn"       element={<FlashCards />} />
          <Route path="/quiz"        element={<QuizCore />} />
          <Route path="/learn-hub"   element={<LearnHub />} />
          <Route path="/grammar"     element={<GrammarPage />} />
          <Route path="/grammar/:lessonId" element={<GrammarLessonPage />} />
          <Route path="/dialogue"    element={<DialogueScreen />} />
          <Route path="/profile"     element={<ProfilePage />} />
          <Route path="/learned"     element={<LearnedWords />} />
          <Route path="/report"      element={<LearningReport />} />
          <Route path="/reinforce"   element={<Reinforce />} />
          <Route path="/stats"       element={<StatsPage />} />
          <Route path="/dictionary"  element={<DictionaryPage />} />
          <Route path="/levels"      element={<LevelsPage />} />
          <Route path="/tictactoe"   element={<TicTacToe />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
