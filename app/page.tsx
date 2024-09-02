'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"

// Types
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Position = [number, number]

// Constants
const GRID_SIZE = 20
const CELL_SIZE = 20
const INITIAL_SNAKE: Position[] = [[10, 10]]
const INITIAL_DIRECTION: Direction = 'RIGHT'
const INITIAL_SPEED = 100

// Helper functions
const getRandomPosition = (): Position => [
  Math.floor(Math.random() * GRID_SIZE),
  Math.floor(Math.random() * GRID_SIZE),
]

const moveSnake = (snake: Position[], direction: Direction): Position[] => {
  const head = snake[0]
  const newHead: Position = [...head]

  switch (direction) {
    case 'UP':
      newHead[1] = (newHead[1] - 1 + GRID_SIZE) % GRID_SIZE
      break
    case 'DOWN':
      newHead[1] = (newHead[1] + 1) % GRID_SIZE
      break
    case 'LEFT':
      newHead[0] = (newHead[0] - 1 + GRID_SIZE) % GRID_SIZE
      break
    case 'RIGHT':
      newHead[0] = (newHead[0] + 1) % GRID_SIZE
      break
  }

  return [newHead, ...snake.slice(0, -1)]
}

const checkCollision = (snake: Position[]): boolean => {
  const [head, ...body] = snake
  return body.some(segment => segment[0] === head[0] && segment[1] === head[1])
}

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION)
  const [food, setFood] = useState<Position>(getRandomPosition())
  const [score, setScore] = useState<number>(0)
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(INITIAL_SPEED)
  const audioContextRef = useRef<AudioContext | null>(null)

  const moveFood = useCallback(() => {
    let newFood: Position
    do {
      newFood = getRandomPosition()
    } while (snake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1]))
    setFood(newFood)
  }, [snake])

  const resetGame = () => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    moveFood()
    setScore(0)
    setGameOver(false)
    setSpeed(INITIAL_SPEED)
  }

  const changeSpeed = (multiplier: number) => {
    setSpeed(INITIAL_SPEED / multiplier)
  }

  const playSound = useCallback((frequency: number, duration: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    const oscillator = audioContextRef.current.createOscillator()
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
    oscillator.connect(audioContextRef.current.destination)
    oscillator.start()
    oscillator.stop(audioContextRef.current.currentTime + duration)
  }, [])

  useEffect(() => {
    if (gameOver) return

    const handleKeyPress = (e: KeyboardEvent) => {
      let newDirection: Direction | null = null
      switch (e.key) {
        case 'ArrowUp':
          newDirection = direction !== 'DOWN' ? 'UP' : null
          break
        case 'ArrowDown':
          newDirection = direction !== 'UP' ? 'DOWN' : null
          break
        case 'ArrowLeft':
          newDirection = direction !== 'RIGHT' ? 'LEFT' : null
          break
        case 'ArrowRight':
          newDirection = direction !== 'LEFT' ? 'RIGHT' : null
          break
      }
      if (newDirection) {
        setDirection(newDirection)
        playSound(220, 0.1) // Play a sound when changing direction
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    const gameLoop = setInterval(() => {
      setSnake(prevSnake => {
        const newSnake = moveSnake(prevSnake, direction)
        const head = newSnake[0]

        if (head[0] === food[0] && head[1] === food[1]) {
          setScore(prev => prev + 1)
          moveFood()
          playSound(440, 0.1) // Play a sound when eating food
          return [head, ...prevSnake]
        }

        if (checkCollision(newSnake)) {
          setGameOver(true)
          playSound(110, 0.5) // Play a sound when game over
          clearInterval(gameLoop)
        }

        return newSnake
      })
    }, speed)

    return () => {
      clearInterval(gameLoop)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [direction, food, gameOver, moveFood, speed, playSound])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Snake Game</h1>
      <div className="mb-4">Score: {score}</div>
      <div className="p-4 border-4 border-dotted border-gray-400 rounded-lg">
        <div
          className="grid bg-white"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
            const x = index % GRID_SIZE
            const y = Math.floor(index / GRID_SIZE)
            const isSnake = snake.some(segment => segment[0] === x && segment[1] === y)
            const isFood = food[0] === x && food[1] === y

            return (
              <div
                key={index}
                className={`${
                  isSnake
                    ? 'bg-green-500'
                    : isFood
                    ? 'bg-red-500'
                    : 'bg-gray-100'
                }`}
                style={{ width: CELL_SIZE, height: CELL_SIZE }}
              />
            )
          })}
        </div>
      </div>
      {gameOver && (
        <div className="mt-4 text-xl font-bold text-red-500">Game Over!</div>
      )}
      <div className="mt-4 space-x-4">
        <Button onClick={resetGame}>
          {gameOver ? 'Restart Game' : 'New Game'}
        </Button>
        <Button onClick={() => changeSpeed(1)} disabled={speed === INITIAL_SPEED}>
          1x Speed
        </Button>
        <Button onClick={() => changeSpeed(2)} disabled={speed === INITIAL_SPEED / 2}>
          2x Speed
        </Button>
        <Button onClick={() => changeSpeed(3)} disabled={speed === INITIAL_SPEED / 3}>
          3x Speed
        </Button>
      </div>
    </div>
  )
}

export default SnakeGame