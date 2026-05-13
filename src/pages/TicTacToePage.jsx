import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../i18n/translations'

const DIFFICULTIES = {
  EASY: { delay: 800, label: 'Easy' },
  MEDIUM: { delay: 400, label: 'Medium' },
  HARD: { delay: 200, label: 'Hard' }
}

const GRID_CONFIGS = {
  TINY: { size: 3, winLength: 3, label: '3x3' },
  SMALL: { size: 4, winLength: 4, label: '4x4' },
  MEDIUM: { size: 5, winLength: 4, label: '5x5' },
  LARGE: { size: 6, winLength: 5, label: '6x6' }
}

const generateWinningCombinations = (gridSize, winLength) => {
  const combos = []
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col <= gridSize - winLength; col++) {
      const combo = []
      for (let i = 0; i < winLength; i++) {
        combo.push(row * gridSize + col + i)
      }
      combos.push(combo)
    }
  }
  
  for (let col = 0; col < gridSize; col++) {
    for (let row = 0; row <= gridSize - winLength; row++) {
      const combo = []
      for (let i = 0; i < winLength; i++) {
        combo.push((row + i) * gridSize + col)
      }
      combos.push(combo)
    }
  }
  
  for (let row = 0; row <= gridSize - winLength; row++) {
    for (let col = 0; col <= gridSize - winLength; col++) {
      const combo = []
      for (let i = 0; i < winLength; i++) {
        combo.push((row + i) * gridSize + col + i)
      }
      combos.push(combo)
    }
  }
  
  for (let row = 0; row <= gridSize - winLength; row++) {
    for (let col = winLength - 1; col < gridSize; col++) {
      const combo = []
      for (let i = 0; i < winLength; i++) {
        combo.push((row + i) * gridSize + col - i)
      }
      combos.push(combo)
    }
  }
  
  return combos
}

export default function TicTacToePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  const [gridConfig, setGridConfig] = useState(() => {
    const saved = localStorage.getItem('tictactoe_grid')
    return saved ? JSON.parse(saved) : GRID_CONFIGS.TINY
  })
  const [difficulty, setDifficulty] = useState(() => {
    const saved = localStorage.getItem('tictactoe_difficulty')
    return saved ? JSON.parse(saved) : DIFFICULTIES.MEDIUM
  })
  const [board, setBoard] = useState([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [winner, setWinner] = useState(null)
  const [winningLine, setWinningLine] = useState([])
  const [scores, setScores] = useState({ player: 0, computer: 0 })
  const [timeLeft, setTimeLeft] = useState(15)
  const [timerActive, setTimerActive] = useState(true)
  
  const boardSize = gridConfig.size * gridConfig.size
  const winningCombos = generateWinningCombinations(gridConfig.size, gridConfig.winLength)
  
  const timerRef = useRef(null)

  useEffect(() => {
    const savedScores = localStorage.getItem('tictactoe_scores')
    if (savedScores) {
      try {
        setScores(JSON.parse(savedScores))
      } catch {
        localStorage.removeItem('tictactoe_scores')
      }
    }
  }, [])

  useEffect(() => {
    setBoard(Array(boardSize).fill(null))
  }, [boardSize])

  useEffect(() => {
    if (timerActive && !winner && isPlayerTurn) {
      setTimeLeft(15)
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsPlayerTurn(false)
            return 15
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [timerActive, winner, isPlayerTurn])

  const checkWinner = useCallback((currentBoard, player) => {
    for (const combo of winningCombos) {
      if (combo.every(index => currentBoard[index] === player)) {
        return combo
      }
    }
    return null
  }, [winningCombos])

  const checkATA = useCallback((currentBoard) => {
    const gridSize = gridConfig.size
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col <= gridSize - 3; col++) {
        const idx1 = row * gridSize + col
        const idx2 = row * gridSize + col + 1
        const idx3 = row * gridSize + col + 2
        if (currentBoard[idx1] === 'A' && currentBoard[idx2] === 'T' && currentBoard[idx3] === 'A') {
          return [idx1, idx2, idx3]
        }
      }
    }
    return null
  }, [gridConfig.size])

  const countOpenEnds = (board, combo, player) => {
    const firstCell = board[combo[0]]
    const lastCell = board[combo[combo.length - 1]]
    let ends = 0
    
    const firstIndex = combo[0]
    const lastIndex = combo[combo.length - 1]
    const firstRow = Math.floor(firstIndex / gridConfig.size)
    const firstCol = firstIndex % gridConfig.size
    const lastRow = Math.floor(lastIndex / gridConfig.size)
    const lastCol = lastIndex % gridConfig.size
    
    if (firstRow > 0 && board[(firstRow - 1) * gridConfig.size + firstCol] === null) ends++
    if (firstCol > 0 && board[firstRow * gridConfig.size + firstCol - 1] === null) ends++
    if (lastRow < gridConfig.size - 1 && board[(lastRow + 1) * gridConfig.size + lastCol] === null) ends++
    if (lastCol < gridConfig.size - 1 && board[lastRow * gridConfig.size + lastCol + 1] === null) ends++
    
    return ends
  }

  const getAIMove = useCallback((currentBoard) => {
    const emptyIndices = currentBoard
      .map((cell, index) => (cell === null ? index : null))
      .filter(index => index !== null)

    if (emptyIndices.length === 0) return null

    for (const index of emptyIndices) {
      const testBoard = [...currentBoard]
      testBoard[index] = 'T'
      if (checkWinner(testBoard, 'T')) {
        return index
      }
    }

    for (const index of emptyIndices) {
      const testBoard = [...currentBoard]
      testBoard[index] = 'A'
      if (checkWinner(testBoard, 'A')) {
        return index
      }
    }

    if (difficulty === DIFFICULTIES.HARD) {
      let bestScore = -Infinity
      let bestMove = null
      
      for (const index of emptyIndices) {
        const testBoard = [...currentBoard]
        testBoard[index] = 'T'
        
        let score = 0
        for (const combo of winningCombos) {
          if (combo.includes(index)) {
            const openEnds = countOpenEnds(testBoard, combo, 'T')
            if (openEnds >= 2) score += 50
            else if (openEnds === 1) score += 10
          }
        }
        
        if (score > bestScore) {
          bestScore = score
          bestMove = index
        }
      }
      
      if (bestMove !== null) {
        return bestMove
      }
    }

    const center = Math.floor(boardSize / 2)
    if (currentBoard[center] === null) {
      return center
    }

    const corners = [0, gridConfig.size - 1, boardSize - gridConfig.size, boardSize - 1]
      .filter(i => currentBoard[i] === null)
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)]
    }

    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)]
  }, [checkWinner, difficulty, winningCombos, gridConfig.size, boardSize])

  useEffect(() => {
    if (isPlayerTurn || winner) {
      return
    }

    const timer = setTimeout(() => {
      setBoard(currentBoard => {
        const aiMove = getAIMove(currentBoard)
        if (aiMove === null) return currentBoard

        const newBoard = [...currentBoard]
        newBoard[aiMove] = 'T'
        
        const winLine = checkWinner(newBoard, 'T')
        if (winLine) {
          setWinner('T')
          setWinningLine(winLine)
          setScores(prev => {
            const newScores = { ...prev, computer: prev.computer + 1 }
            localStorage.setItem('tictactoe_scores', JSON.stringify(newScores))
            return newScores
          })
        } else if (newBoard.every(cell => cell !== null)) {
          setWinner('draw')
        } else {
          setIsPlayerTurn(true)
        }
        return newBoard
      })
    }, difficulty.delay)

    return () => clearTimeout(timer)
  }, [isPlayerTurn, winner, getAIMove, checkWinner, difficulty])

  const handleCellClick = (index) => {
    if (board[index] !== null || !isPlayerTurn || winner) {
      return
    }

    const newBoard = [...board]
    newBoard[index] = 'A'
    setBoard(newBoard)

    const ataLine = checkATA(newBoard)
    if (ataLine) {
      setWinner('ATA')
      setWinningLine(ataLine)
      setScores(prev => {
        const newScores = { ...prev, player: prev.player + 1 }
        localStorage.setItem('tictactoe_scores', JSON.stringify(newScores))
        return newScores
      })
      return
    }

    const winLine = checkWinner(newBoard, 'A')
    if (winLine) {
      setWinner('A')
      setWinningLine(winLine)
      setScores(prev => {
        const newScores = { ...prev, player: prev.player + 1 }
        localStorage.setItem('tictactoe_scores', JSON.stringify(newScores))
        return newScores
      })
    } else if (newBoard.every(cell => cell !== null)) {
      setWinner('draw')
    } else {
      setIsPlayerTurn(false)
    }
  }

  const resetGame = () => {
    setBoard(Array(boardSize).fill(null))
    setIsPlayerTurn(true)
    setWinner(null)
    setWinningLine([])
    setTimeLeft(15)
  }

  const resetScores = () => {
    setScores({ player: 0, computer: 0 })
    localStorage.removeItem('tictactoe_scores')
    resetGame()
  }

  const changeGrid = (config) => {
    setGridConfig(config)
    localStorage.setItem('tictactoe_grid', JSON.stringify(config))
    setBoard(Array(config.size * config.size).fill(null))
    resetGame()
  }

  const changeDifficulty = (diff) => {
    setDifficulty(diff)
    localStorage.setItem('tictactoe_difficulty', JSON.stringify(diff))
  }

  const getResultMessage = () => {
    if (winner === 'ATA') {
      return { emoji: '🏆', message: 'ATA! You Win!' }
    } else if (winner === 'A') {
      return { emoji: '🎉', message: 'You Win!' }
    } else if (winner === 'T') {
      return { emoji: '🤖', message: 'Computer Wins' }
    } else {
      return { emoji: '🤝', message: 'Draw!' }
    }
  }

  const result = getResultMessage()
  const timerColor = timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-yellow-500' : 'text-teal-500'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-6">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        <h1 className="text-3xl font-bold text-center text-white mb-2">Tic Tac Toe 🎮</h1>
        
        <div className="flex justify-center gap-2 mb-4">
          {Object.values(GRID_CONFIGS).map((config) => (
            <button
              key={config.label}
              onClick={() => changeGrid(config)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                gridConfig.label === config.label
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-2 mb-4">
          {Object.values(DIFFICULTIES).map((diff) => (
            <button
              key={diff.label}
              onClick={() => changeDifficulty(diff)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                difficulty.label === diff.label
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {diff.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-8 mb-4 text-slate-300">
          <div className="text-center">
            <div className="text-sm text-slate-500">A (You)</div>
            <div className="text-2xl font-bold text-teal-500">{scores.player}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500">T (CPU)</div>
            <div className="text-2xl font-bold text-slate-400">{scores.computer}</div>
          </div>
        </div>

        <div className={`text-center mb-4 flex items-center justify-center gap-2 ${timerColor}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-lg font-bold">{timeLeft}s</span>
        </div>

        <div className="text-center mb-4">
          {!winner && (
            <p className="text-slate-400">
              {isPlayerTurn ? "Your turn (A)" : "Computer thinking..."}
            </p>
          )}
        </div>

        {winner && (
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">{result.emoji}</div>
            <div className="text-2xl font-bold text-white mb-4">{result.message}</div>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        )}

        <div className={`grid gap-2 bg-slate-700 p-2 rounded-xl`}
          style={{ gridTemplateColumns: `repeat(${gridConfig.size}, 1fr)` }}>
          {board.map((cell, index) => {
            const isWinningCell = winningLine.includes(index)
            return (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={cell !== null || !isPlayerTurn || winner !== null}
                className={`
                  aspect-square min-h-[60px] rounded-lg font-bold text-2xl
                  flex items-center justify-center transition-all
                  ${cell === null && isPlayerTurn && !winner
                    ? 'bg-slate-600 hover:bg-slate-500 cursor-pointer'
                    : 'bg-slate-600 cursor-not-allowed'
                  }
                  ${isWinningCell ? 'ring-4 ring-yellow-400 ring-inset' : ''}
                `}
              >
                {cell === 'A' && (
                  <span className="text-teal-500">A</span>
                )}
                {cell === 'T' && (
                  <span className="text-amber-400">T</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-6 text-center space-x-4">
          <button
            onClick={resetScores}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Reset Scores
          </button>
          <button
            onClick={resetGame}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  )
}
