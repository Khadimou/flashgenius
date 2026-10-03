export interface SM2Result {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: Date
}

/**
 * SM-2 spaced repetition algorithm.
 * quality: 0=rien, 1=tres dur, 2=dur, 3=ok, 4=bien, 5=facile
 */
export function sm2(
  quality: 0 | 1 | 2 | 3 | 4 | 5,
  easeFactor: number,
  interval: number,
  repetitions: number
): SM2Result {
  let ef = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (ef < 1.3) ef = 1.3

  let newInterval: number
  let newReps: number

  if (quality < 3) {
    // Echec : recommencer
    newReps = 0
    newInterval = 1
  } else {
    newReps = repetitions + 1
    if (repetitions === 0) newInterval = 1
    else if (repetitions === 1) newInterval = 6
    else newInterval = Math.round(interval * ef)
  }

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + newInterval)

  return { easeFactor: ef, interval: newInterval, repetitions: newReps, dueDate }
}

export const QUALITY_LABELS: Record<number, string> = {
  0: '😵 Rien',
  1: '😰 Tres dur',
  2: '😓 Dur',
  3: '🤔 OK',
  4: '😊 Bien',
  5: '🤩 Facile',
}
