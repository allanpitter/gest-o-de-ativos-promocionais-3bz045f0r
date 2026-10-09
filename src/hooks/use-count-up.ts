import { useEffect, useState } from 'react'

export function useCountUp(target: number, duration: number = 800) {
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    let start = 0
    const finalValue = Number(target) || 0
    if (finalValue === 0) {
      setCount(0)
      return
    }
    const stepTime = 16
    const steps = Math.ceil(duration / stepTime)
    const increment = finalValue / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      start += increment
      if (currentStep >= steps) {
        setCount(finalValue)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [target, duration])

  return count
}
