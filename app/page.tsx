"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Star,
  Target,
  X,
} from "lucide-react";
import {
  GameState,
  LevelConfig,
  GameStatus,
  Position,
  Arrow,
  Particle,
} from "../types/game";

export default function BowArrowGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerName, setPlayerName] = useState("");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [arrows, setArrows] = useState(5);
  const [gameState, setGameState] = useState<GameStatus>("menu");
  const [isPulling, setIsPulling] = useState(false);
  const [pullStrength, setPullStrength] = useState(0);
  const [bowAngle, setBowAngle] = useState(0);
  const [hitMessage, setHitMessage] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const gameRef = useRef<GameState>({
    bow: { x: 100, y: 250 },
    target: { x: 700, y: 250, radius: 60 },
    arrow: null,
    particles: [],
    targetMoving: false,
    targetSpeed: 0,
    targetDirection: 1,
  });

  const levelConfig: Record<number, LevelConfig> = {
    1: {
      targetRadius: 60,
      moving: false,
      speed: 0,
      name: "Beginner",
      distance: 650,
    },
    2: {
      targetRadius: 50,
      moving: false,
      speed: 0,
      name: "Novice",
      distance: 700,
    },
    3: {
      targetRadius: 45,
      moving: true,
      speed: 1,
      name: "Skilled",
      distance: 700,
    },
    4: {
      targetRadius: 40,
      moving: true,
      speed: 1.5,
      name: "Expert",
      distance: 750,
    },
    5: {
      targetRadius: 35,
      moving: true,
      speed: 2,
      name: "Master",
      distance: 800,
    },
  };

  // Check mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Draw gradient background
  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0c0c2e");
      gradient.addColorStop(0.5, "#1a1a4a");
      gradient.addColorStop(1, "#2d2d6b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw stars
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.7;
        const size = Math.random() * 1.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    []
  );

  // Draw ground with better graphics
  const drawGround = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const groundHeight = 100;
      const groundY = height - groundHeight;

      // Ground gradient
      const groundGradient = ctx.createLinearGradient(0, groundY, 0, height);
      groundGradient.addColorStop(0, "#2d5a27");
      groundGradient.addColorStop(1, "#1a3d1c");
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, groundY, width, groundHeight);

      // Grass details
      ctx.fillStyle = "#3a7a34";
      for (let i = 0; i < width; i += 15) {
        const heightVariation = Math.sin(i * 0.1) * 8 + 10;
        ctx.fillRect(i, groundY - heightVariation, 2, heightVariation);
      }
    },
    []
  );

  const drawBow = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      pos: Position,
      angle: number,
      strength: number
    ) => {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle);

      // Bow body with gradient
      const bowGradient = ctx.createLinearGradient(-60, -60, 60, 60);
      bowGradient.addColorStop(0, "#5d4037");
      bowGradient.addColorStop(1, "#3e2723");

      ctx.strokeStyle = bowGradient;
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, 60, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.stroke();

      // Bow details
      ctx.strokeStyle = "#8d6e63";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 60, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.stroke();

      // Bow string
      ctx.strokeStyle = "#f5f5f5";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const topY = -50;
      const bottomY = 50;

      if (strength > 0) {
        const pullX = -strength * 0.8;
        ctx.moveTo(0, topY);
        ctx.lineTo(pullX, 0);
        ctx.lineTo(0, bottomY);
      } else {
        ctx.moveTo(0, topY);
        ctx.lineTo(0, bottomY);
      }
      ctx.stroke();

      // Draw arrow when pulling
      if (strength > 0) {
        const pullX = -strength * 0.8;

        // Arrow shaft
        ctx.strokeStyle = "#5d4037";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(pullX, 0);
        ctx.lineTo(pullX - 40, 0);
        ctx.stroke();

        // Arrow tip
        const tipGradient = ctx.createLinearGradient(
          pullX - 50,
          0,
          pullX - 40,
          0
        );
        tipGradient.addColorStop(0, "#78909c");
        tipGradient.addColorStop(1, "#b0bec5");
        ctx.fillStyle = tipGradient;
        ctx.beginPath();
        ctx.moveTo(pullX - 40, 0);
        ctx.lineTo(pullX - 50, -6);
        ctx.lineTo(pullX - 50, 6);
        ctx.closePath();
        ctx.fill();

        // Feathers
        ctx.fillStyle = "#e53935";
        ctx.beginPath();
        ctx.moveTo(pullX, 0);
        ctx.lineTo(pullX + 12, -10);
        ctx.lineTo(pullX + 12, 10);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    },
    []
  );

  const drawTarget = useCallback(
    (ctx: CanvasRenderingContext2D, target: Position & { radius: number }) => {
      const rings = [
        { color: "#f44336", radius: 1.0 },
        { color: "#ffffff", radius: 0.8 },
        { color: "#f44336", radius: 0.6 },
        { color: "#ffffff", radius: 0.4 },
        { color: "#ffd600", radius: 0.2 },
      ];

      // Target shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.arc(target.x + 3, target.y + 3, target.radius + 2, 0, Math.PI * 2);
      ctx.fill();

      rings.forEach((ring) => {
        ctx.fillStyle = ring.color;
        ctx.beginPath();
        ctx.arc(
          target.x,
          target.y,
          target.radius * ring.radius,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Ring border
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Bullseye detail
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius * 0.1, 0, Math.PI * 2);
      ctx.fill();
    },
    []
  );

  const drawArrow = useCallback(
    (ctx: CanvasRenderingContext2D, arrow: Arrow) => {
      ctx.save();
      ctx.translate(arrow.x, arrow.y);
      ctx.rotate(arrow.angle);

      // Arrow shadow
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(2, 2);
      ctx.lineTo(-38, 2);
      ctx.stroke();

      // Arrow shaft
      const shaftGradient = ctx.createLinearGradient(0, 0, -40, 0);
      shaftGradient.addColorStop(0, "#8d6e63");
      shaftGradient.addColorStop(1, "#5d4037");

      ctx.strokeStyle = shaftGradient;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-40, 0);
      ctx.stroke();

      // Arrow tip
      const tipGradient = ctx.createLinearGradient(0, 0, -10, 0);
      tipGradient.addColorStop(0, "#b0bec5");
      tipGradient.addColorStop(1, "#78909c");

      ctx.fillStyle = tipGradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-10, -6);
      ctx.lineTo(-10, 6);
      ctx.closePath();
      ctx.fill();

      // Feathers
      ctx.fillStyle = "#e53935";
      ctx.beginPath();
      ctx.moveTo(-40, 0);
      ctx.lineTo(-52, -10);
      ctx.lineTo(-52, 10);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    },
    []
  );

  const createHitEffect = useCallback((x: number, y: number) => {
    const game = gameRef.current;
    for (let i = 0; i < 50; i++) {
      game.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 40,
        size: Math.random() * 5 + 2,
        color: `hsl(${Math.random() * 30 + 40}, 100%, 50%)`,
      });
    }
  }, []);

  const createMissEffect = useCallback((x: number, y: number) => {
    const game = gameRef.current;
    for (let i = 0; i < 20; i++) {
      game.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 25,
        size: Math.random() * 4 + 1,
        color: "120, 120, 120",
      });
    }
  }, []);

  const updateArrow = useCallback(
    (arrow: Arrow) => {
      arrow.x += arrow.vx;
      arrow.y += arrow.vy;
      arrow.vy += 0.3; // gravity
      arrow.angle = Math.atan2(arrow.vy, arrow.vx);

      // Check collision with target
      const game = gameRef.current;
      const dx = arrow.x - game.target.x;
      const dy = arrow.y - game.target.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= game.target.radius && !arrow.hit) {
        arrow.hit = true;
        createHitEffect(arrow.x, arrow.y);
        setScore((prev) => prev + 100);
        setHitMessage("BULLSEYE! 🎯");

        setTimeout(() => {
          setHitMessage("");
          game.arrow = null;

          // Check if all arrows are used
          const remainingArrows = arrows - 1;
          if (remainingArrows <= 0) {
            // Level completed successfully
            setShowLevelComplete(true);
          } else {
            setGameState("ready");
          }
        }, 1000);
      } else if (arrow.y > 450 && !arrow.hit) {
        arrow.missed = true;
        createMissEffect(arrow.x, arrow.y);
        setArrows((prev) => prev - 1);

        setTimeout(() => {
          game.arrow = null;
          const remainingArrows = arrows - 1;

          if (remainingArrows <= 0) {
            setShowGameOver(true);
          } else {
            setGameState("ready");
          }
        }, 500);
      }
    },
    [arrows, createHitEffect, createMissEffect]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState === "menu") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = isMobile ? window.innerWidth - 40 : 900;
    const height = isMobile ? 400 : 500;

    canvas.width = width;
    canvas.height = height;

    // Adjust positions for mobile
    const bowX = isMobile ? 80 : 100;
    const config = levelConfig[level];
    gameRef.current.bow = { x: bowX, y: height / 2 };
    gameRef.current.target = {
      x: isMobile ? width - 100 : config.distance,
      y: height / 2,
      radius: config.targetRadius,
    };
    gameRef.current.targetMoving = config.moving;
    gameRef.current.targetSpeed = config.speed;

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      drawBackground(ctx, width, height);
      drawGround(ctx, width, height);

      // Update and draw target
      const game = gameRef.current;
      if (game.targetMoving && gameState === "ready") {
        game.target.y += game.targetSpeed * game.targetDirection;
        if (game.target.y <= 100 || game.target.y >= height - 150) {
          game.targetDirection *= -1;
        }
      }

      drawTarget(ctx, game.target);
      drawBow(ctx, game.bow, bowAngle, pullStrength);

      // Update and draw arrow
      if (game.arrow) {
        updateArrow(game.arrow);
        drawArrow(ctx, game.arrow);

        if (game.arrow.x > width || game.arrow.y > height || game.arrow.x < 0) {
          game.arrow = null;
          setGameState("ready");
        }
      }

      // Update and draw particles
      game.particles = game.particles.filter((p: any) => p.life > 0);
      game.particles.forEach((p: any) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;

        ctx.fillStyle = `hsla(${
          p.color.includes("hsl") ? p.color.split("(")[1].split(",")[0] : "50"
        }, 100%, 60%, ${p.life / 40})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [
    level,
    bowAngle,
    pullStrength,
    gameState,
    isMobile,
    drawBackground,
    drawGround,
    drawBow,
    drawTarget,
    drawArrow,
    updateArrow,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (gameState !== "ready" || arrows <= 0) return;
    setIsPulling(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== "ready" || arrows <= 0) return;
    setIsPulling(true);
    handleTouchMove(e); // Set initial angle
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    updateBowAngle(mouseX, mouseY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    updateBowAngle(touchX, touchY);
  };

  const updateBowAngle = (x: number, y: number) => {
    const game = gameRef.current;
    const dx = x - game.bow.x;
    const dy = y - game.bow.y;
    const angle = Math.atan2(dy, dx);
    setBowAngle(angle);

    if (isPulling) {
      const distance = Math.sqrt(dx * dx + dy * dy);
      setPullStrength(Math.min(distance * 0.5, 100));
    }
  };

  const handleMouseUp = () => {
    releaseArrow();
  };

  const handleTouchEnd = () => {
    releaseArrow();
  };

  const releaseArrow = () => {
    if (!isPulling || pullStrength < 10) {
      setIsPulling(false);
      setPullStrength(0);
      return;
    }

    const power = pullStrength * 0.15;
    const game = gameRef.current;

    game.arrow = {
      x: game.bow.x,
      y: game.bow.y,
      vx: Math.cos(bowAngle) * power,
      vy: Math.sin(bowAngle) * power,
      angle: bowAngle,
      hit: false,
      missed: false,
    };

    setGameState("flying");
    setIsPulling(false);
    setPullStrength(0);
  };

  const startGame = () => {
    if (!playerName.trim()) return;
    setGameState("ready");
    setLevel(1);
    setScore(0);
    setArrows(5);
  };

  const resetGame = () => {
    setGameState("menu");
    setPlayerName("");
    setLevel(1);
    setScore(0);
    setArrows(5);
    gameRef.current.arrow = null;
    gameRef.current.particles = [];
    setHitMessage("");
    setShowSuccess(false);
    setShowLevelComplete(false);
    setShowGameOver(false);
  };

  const nextLevel = () => {
    setShowLevelComplete(false);
    if (level < 5) {
      setLevel((prev) => prev + 1);
      setArrows(5);
      setGameState("ready");
    } else {
      setShowSuccess(true);
    }
  };

  const continuePlaying = () => {
    setShowSuccess(false);
    setLevel(1);
    setArrows(5);
    setScore(0);
    setGameState("ready");
  };

  const retryLevel = () => {
    setShowGameOver(false);
    setArrows(5);
    setGameState("ready");
  };

  const config = levelConfig[level];

  // Start Menu
  if (gameState === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-3xl p-6 md:p-12 max-w-md w-full border-2 border-yellow-500/30 shadow-2xl">
          <div className="text-center mb-6 md:mb-8">
            <div className="flex justify-center mb-4 md:mb-6">
              <Target className="w-12 h-12 md:w-16 md:h-16 text-yellow-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
              Archery Pro
            </h1>
            <p className="text-gray-300 text-base md:text-lg">
              Test your archery skills across multiple levels!
            </p>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-yellow-400 font-semibold mb-2 text-base md:text-lg">
                Enter Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Archer name..."
                className="w-full px-4 md:px-6 py-3 md:py-4 bg-gray-800 border-2 border-yellow-500/50 rounded-2xl text-white text-base md:text-lg placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-all"
                onKeyPress={(e) => e.key === "Enter" && startGame()}
              />
            </div>

            <button
              onClick={startGame}
              disabled={!playerName.trim()}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-bold py-3 md:py-4 px-6 md:px-8 rounded-2xl text-lg md:text-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🏹 Start Adventure
            </button>
          </div>

          <div className="mt-6 md:mt-8 text-center text-gray-400 text-sm md:text-base">
            <p>
              {isMobile ? "• Touch and drag to aim" : "• Aim with your mouse"}
            </p>
            <p>
              {isMobile
                ? "• Drag to pull the bow"
                : "• Click and drag to pull the bow"}
            </p>
            <p>{isMobile ? "• Release to shoot" : "• Release to shoot"}</p>
            <p>• Hit all targets to win!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-t-3xl p-4 md:p-6 border-b-2 border-yellow-500/50 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                Archery Pro
              </h1>
              <p className="text-gray-400 text-sm md:text-base">
                Welcome, {playerName}! • Level {level} - {config.name}
              </p>
            </div>

            <div className="flex gap-4 md:gap-8 items-center">
              <div className="text-center bg-gray-800/50 px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-yellow-500/30">
                <div className="text-xl md:text-2xl font-bold text-yellow-400">
                  {score}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">
                  Score
                </div>
              </div>

              <div className="text-center bg-gray-800/50 px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-green-500/30">
                <div className="text-xl md:text-2xl font-bold text-green-400">
                  {arrows}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">
                  Arrows
                </div>
              </div>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 md:p-3 rounded-2xl bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 transition-all"
              >
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                ) : (
                  <VolumeX className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="relative bg-black/40 backdrop-blur-sm rounded-b-3xl overflow-hidden border-2 border-yellow-500/30 shadow-2xl">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-auto cursor-crosshair touch-none"
            style={{ maxHeight: isMobile ? "400px" : "500px" }}
          />

          {/* Hit Message */}
          {hitMessage && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div
                className="text-4xl md:text-6xl font-black text-yellow-400 animate-pulse drop-shadow-2xl text-center"
                style={{
                  textShadow:
                    "0 0 30px rgba(255,215,0,0.9), 0 0 60px rgba(255,215,0,0.7)",
                }}
              >
                {hitMessage}
              </div>
            </div>
          )}

          {/* Pull Strength Indicator */}
          {isPulling && (
            <div
              className={`absolute ${
                isMobile ? "bottom-4 left-4" : "bottom-6 left-6"
              }`}
            >
              <div className="bg-gray-900/90 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4 rounded-2xl border-2 border-yellow-500/50 shadow-lg">
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="text-white font-bold text-sm md:text-lg">
                    POWER:
                  </span>
                  <div className="w-24 md:w-40 h-3 md:h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
                      style={{ width: `${pullStrength}%` }}
                    />
                  </div>
                  <span className="text-yellow-400 font-bold w-8 md:w-12 text-sm md:text-base">
                    {Math.round(pullStrength)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {gameState === "ready" && arrows > 0 && (
            <div
              className={`absolute ${
                isMobile ? "bottom-4 right-4" : "bottom-6 right-6"
              }`}
            >
              <div className="bg-gray-900/90 backdrop-blur-sm px-4 md:px-8 py-3 md:py-4 rounded-2xl border-2 border-yellow-500/50 shadow-lg">
                <p className="text-white font-semibold text-sm md:text-lg flex items-center gap-2">
                  🎯{" "}
                  {isMobile
                    ? "Drag to Aim & Shoot!"
                    : "Click & Drag to Aim & Shoot!"}
                </p>
              </div>
            </div>
          )}
        </div>

        {gameState !== ("menu" as any) && (
          <div className="mt-4 md:mt-6 text-center">
            <button
              onClick={resetGame}
              className="bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold py-2 md:py-3 px-6 md:px-8 rounded-2xl border-2 border-gray-600 transform hover:scale-105 transition-all flex items-center gap-2 md:gap-3 mx-auto backdrop-blur-sm text-sm md:text-base"
            >
              <RotateCcw className="w-4 h-4" />
              Restart Game
            </button>
          </div>
        )}
      </div>

      {/* Level Complete Modal */}
      {showLevelComplete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500 rounded-3xl p-1 max-w-md w-full shadow-2xl">
            <div className="bg-gray-900 rounded-2xl p-6 md:p-8 text-center">
              <div className="flex justify-center mb-4 md:mb-6">
                <Trophy className="w-16 h-16 md:w-20 md:h-20 text-yellow-400" />
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-4">
                LEVEL {level} COMPLETE! 🎯
              </h2>

              <p className="text-xl md:text-2xl text-yellow-400 mb-2">
                {playerName}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white mb-2">
                Score: {score}
              </p>

              <div className="flex justify-center gap-1 md:gap-2 mb-4 md:mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-6 h-6 md:w-8 md:h-8 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-gray-300 text-base md:text-lg mb-6 md:mb-8">
                {level < 5
                  ? `Ready for the next challenge? Level ${level + 1} awaits!`
                  : "You've completed all levels! You're an archery master!"}
              </p>

              <div className="space-y-3 md:space-y-4">
                <button
                  onClick={nextLevel}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 md:py-4 px-6 md:px-8 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all"
                >
                  {level < 5
                    ? `Continue to Level ${level + 1}`
                    : "View Results"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {showGameOver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-red-400 via-pink-400 to-rose-500 rounded-3xl p-1 max-w-md w-full shadow-2xl">
            <div className="bg-gray-900 rounded-2xl p-6 md:p-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500 mb-4">
                LEVEL {level} FAILED 💔
              </h2>

              <p className="text-2xl md:text-3xl text-yellow-400 mb-2">
                Score: {score}
              </p>
              <p className="text-xl text-gray-400 mb-6 md:mb-8">
                Out of arrows! Don't give up, {playerName}!
              </p>

              <div className="space-y-3 md:space-y-4">
                <button
                  onClick={retryLevel}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 md:py-4 px-6 md:px-8 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={resetGame}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-2xl border border-gray-600 transform hover:scale-105 transition-all"
                >
                  Main Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 rounded-3xl p-1 max-w-md w-full shadow-2xl">
            <div className="bg-gray-900 rounded-2xl p-6 md:p-8 text-center">
              <div className="flex justify-center mb-4 md:mb-6">
                <Trophy className="w-16 h-16 md:w-20 md:h-20 text-yellow-400" />
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
                CHAMPION! 🏆
              </h2>

              <p className="text-xl md:text-2xl text-yellow-400 mb-2">
                {playerName}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white mb-2">
                Final Score: {score}
              </p>

              <div className="flex justify-center gap-1 md:gap-2 mb-4 md:mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-6 h-6 md:w-8 md:h-8 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-gray-300 text-base md:text-lg mb-6 md:mb-8">
                You've mastered all levels! Your archery skills are legendary!
              </p>

              <div className="space-y-3 md:space-y-4">
                <button
                  onClick={continuePlaying}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-3 md:py-4 px-6 md:px-8 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all"
                >
                  Play Again
                </button>

                <button
                  onClick={resetGame}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-2xl border border-gray-600 transform hover:scale-105 transition-all"
                >
                  New Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
