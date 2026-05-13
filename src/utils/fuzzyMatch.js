

import Fuse from 'fuse.js'

export function checkAnswer(userInput, correctAnswer) {
  const clean = (str) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:'"]/g, '')

  const input = clean(userInput)
  const correct = clean(correctAnswer)

  if (input === correct) return { match: true, score: 1.0 }

  const fuse = new Fuse([correct], {
    includeScore: true,
    threshold: 0.3,
  })

  const result = fuse.search(input)

  if (result.length > 0) {
    const score = 1 - result[0].score
    return {
      match: score >= 0.7,
      score: score,
      suggestion: score >= 0.5 && score < 0.7 ? correctAnswer : null,
    }
  }

  return { match: false, score: 0 }
}

export function findBestOption(userInput, options) {
  const clean = (str) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:'"]/g, '')

  const fuse = new Fuse(options.map(clean), {
    includeScore: true,
    threshold: 0.5,
  })

  const results = fuse.search(clean(userInput))

  if (results.length > 0 && results[0].score < 0.5) {
    return {
      found: true,
      index: results[0].refIndex,
      score: 1 - results[0].score,
    }
  }

  return { found: false }
}

export function getPronunciationScore(transcript, expected) {
  const clean = (str) => str.toLowerCase().trim()
    .replace(/[.,!?;:'"]/g, '')
  
  const t = clean(transcript).split(' ')
  const e = clean(expected).split(' ')
  
  let matched = 0
  e.forEach(word => {
    if (t.some(tw => {
      const fuse = new Fuse([word], { threshold: 0.3 })
      return fuse.search(tw).length > 0
    })) matched++
  })
  
  const score = Math.round((matched / e.length) * 100)
  
  return {
    score,
    level: score >= 80 ? 'excellent' 
         : score >= 60 ? 'good'
         : score >= 40 ? 'almost'
         : 'tryagain',
    matched,
    total: e.length
  }
}