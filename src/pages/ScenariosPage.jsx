import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const SCENARIOS = [
  { word: 'shopping',     emoji: '🛍️', title: 'Shopping',             desc: 'Clothing & groceries'   },
  { word: 'travel',       emoji: '✈️', title: 'Travel & Airport',      desc: 'Flights & check-in'     },
  { word: 'tourism',      emoji: '🗺️', title: 'Tourism & Directions',  desc: 'Directions & tours'     },
  { word: 'school',       emoji: '📚', title: 'School & Work',         desc: 'School & office'        },
  { word: 'daily',        emoji: '☀️', title: 'Daily Routine',         desc: 'Everyday conversations' },
  { word: 'emergency',    emoji: '🚨', title: 'Emergency',             desc: 'Urgent help'            },
  { word: 'meeting',      emoji: '💼', title: 'Meeting & Business',    desc: 'Business talk'          },
  { word: 'cafe',         emoji: '☕', title: 'Café & Restaurant',     desc: 'Order food & drinks'    },
  { word: 'hospital',     emoji: '🏥', title: 'Hospital',              desc: 'Doctor visits'          },
  { word: 'bank',         emoji: '🏦', title: 'Bank',                  desc: 'Banking'                },
  { word: 'postoffice',   emoji: '📮', title: 'Post Office',           desc: 'Mail & packages'        },
  { word: 'gym',          emoji: '💪', title: 'Gym',                   desc: 'Fitness & gym'          },
  { word: 'movietheater', emoji: '🎬', title: 'Movie Theater',         desc: 'Cinema & tickets'       },
  { word: 'hairsalon',    emoji: '💇', title: 'Hair Salon',            desc: 'Hair & styling'         },
  { word: 'gasstation',   emoji: '⛽', title: 'Gas Station',           desc: 'Fuel & car care'        },
  { word: 'pharmacy',     emoji: '💊', title: 'Pharmacy',              desc: 'Meds & prescriptions'   },
]

export default function ScenariosPage() {
  const navigate = useNavigate()
  const { currentPair } = useApp()

  const pairStr = typeof currentPair === 'string'
    ? currentPair
    : currentPair?.pair || currentPair?.code || currentPair?.id || 'es-en'
  const botLang = pairStr.split('-')[0]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden"
         style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-10 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full
                     bg-white border border-slate-200 text-slate-600
                     hover:bg-slate-100 transition-colors"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900">Chat Practice</h1>
          <p className="text-sm text-slate-400">
            {botLang === 'pt' ? 'Português' : 'Español'} → English
          </p>
        </div>
      </div>

      {/* Subtitle */}
      <p className="px-5 text-sm text-slate-500 mb-4">
        Choose a scenario to practice with the chatbot 🤖
      </p>

      {/* Scenario Grid */}
      <div className="px-5 grid grid-cols-2 gap-3 pb-10">
        {SCENARIOS.map((s) => (
          <button
            key={s.word}
            onClick={() =>
              navigate(`/chatbot?word=${s.word}&difficulty=easy`)
            }
            className="bg-white border border-slate-200 rounded-2xl p-4
                       flex flex-col items-center gap-2 shadow-sm
                       hover:border-cyan-400 hover:shadow-md
                       active:scale-95 transition-all text-center"
            style={{ minHeight: '100px' }}
          >
            <span className="text-3xl">{s.emoji}</span>
            <span className="text-sm font-bold text-slate-700 leading-tight">
              {s.title}
            </span>
            <span className="text-xs text-slate-500 leading-tight line-clamp-1">
              {s.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
