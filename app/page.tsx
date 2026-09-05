'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'

const games = [
  { num: 1, team1: 'Resolut1on + 4 игрока', team2: '5 игроков', time: '14:00–15:00', side: 'Составы пересобираются перед каждым раундом' },
  { num: 2, team1: 'Resolut1on + 4 игрока', team2: '5 игроков', time: '15:15–16:15', side: 'Новые тиммейты — никто не повторяется' },
  { num: 3, team1: 'Resolut1on + 4 игрока', team2: '5 игроков', time: '16:30–17:30', side: 'Составы пересобираются перед каждым раундом' },
  { num: 4, team1: 'Resolut1on + 4 игрока', team2: '5 игроков', time: '17:45–18:45', side: 'Новые тиммейты — никто не повторяется' },
]

const finalGame = {
  team1: 'Resolut1on + Финалисты',
  team2: 'All-Stars MVP',
  time: '19:15–20:15',
  side: 'Пятёрку All-Stars выбирают голосованием в большом перерыве',
}

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const colors = ['#ff6600', '#ff9900', '#ffcc00', '#ff4400', '#ff8800']

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -Math.random() * 0.5 - 0.1,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.4 + 0.05,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width }
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10

        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.shadowColor = p.color
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.restore()
      }
      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />
}

function Schedule() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)

  const handleScroll = useCallback(() => {
    const focusPoint = window.innerHeight * 0.45
    let closestIndex = -1
    let closestDist = Infinity

    for (let i = 0; i < cardRefs.current.length; i++) {
      const el = cardRefs.current[i]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      const cardCenter = rect.top + rect.height / 2
      const dist = Math.abs(cardCenter - focusPoint)
      if (dist < closestDist && rect.top < window.innerHeight && rect.bottom > 0) {
        closestDist = dist
        closestIndex = i
      }
    }

    // Only activate if closest card is reasonably close to focus point
    if (closestDist < window.innerHeight * 0.35) {
      setActiveIndex(closestIndex)
    } else {
      setActiveIndex(-1)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const totalCards = games.length + 1 // games + final

  return (
    <section className="relative z-10 py-16 md:py-24 bg-[#070710]">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-10 md:mb-14 text-center">Расписание</h2>

        <div className="flex flex-col gap-4 md:gap-5">
          {games.map((game, i) => {
            const isActive = activeIndex === i
            return (
              <div key={game.num}>
                <div
                  ref={(el) => { cardRefs.current[i] = el }}
                  className={`bg-white/[0.04] border rounded-xl p-5 md:p-7 transition-all duration-500 cursor-default ${
                    isActive
                      ? 'scale-[1.02] bg-white/[0.07] border-amber-500/25 shadow-[0_0_35px_rgba(255,150,0,0.1)]'
                      : 'border-white/[0.08] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-base md:text-lg font-black tracking-wide transition-colors duration-500 ${
                      isActive ? 'text-amber-400' : 'text-white'
                    }`}>GAME {game.num}</span>
                    <span className={`text-sm md:text-base font-mono font-bold transition-colors duration-500 ${
                      isActive ? 'text-white/70' : 'text-white/50'
                    }`}>{game.time}</span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <span className="text-base md:text-xl text-white font-bold">{game.team1}</span>
                    <span className={`text-sm font-bold uppercase transition-colors duration-500 ${
                      isActive ? 'text-amber-500/60' : 'text-white/30'
                    }`}>vs</span>
                    <span className="text-base md:text-xl text-white/60 font-semibold">{game.team2}</span>
                  </div>

                  <div className={`mt-4 pt-3 border-t transition-colors duration-500 ${
                    isActive ? 'border-amber-500/15' : 'border-white/[0.06]'
                  }`}>
                    <span className="text-sm text-white/30">
                      {game.side}
                    </span>
                  </div>
                </div>

                {i < games.length - 1 && (
                  <div className="my-3 md:my-4 mx-4 md:mx-8 py-3 px-5 bg-white/[0.02] border border-white/[0.05] rounded-lg text-center">
                    <span className="text-sm font-semibold text-white/30">Перерыв · 15 мин</span>
                  </div>
                )}
              </div>
            )
          })}

          {/* Big break */}
          <div className="my-2 md:my-3 mx-4 md:mx-8 py-4 px-5 bg-amber-500/[0.05] border border-amber-500/10 rounded-lg text-center">
            <span className="text-sm md:text-base font-bold text-amber-400/50">Большой перерыв · голосование All-Stars · 30 мин</span>
          </div>

          {/* FINAL */}
          {(() => {
            const isActive = activeIndex === games.length
            return (
              <div
                ref={(el) => { cardRefs.current[games.length] = el }}
                className={`bg-gradient-to-br border rounded-xl p-5 md:p-7 transition-all duration-500 cursor-default ${
                  isActive
                    ? 'from-amber-500/[0.14] to-orange-500/[0.08] border-amber-500/35 shadow-[0_0_50px_rgba(255,150,0,0.15)] scale-[1.02]'
                    : 'from-amber-500/[0.08] to-orange-500/[0.04] border-amber-500/20 shadow-[0_0_40px_rgba(255,150,0,0.04)] hover:from-amber-500/[0.1] hover:to-orange-500/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg md:text-xl font-black text-amber-400 tracking-wide">ФИНАЛ</span>
                  <span className={`text-sm md:text-base font-mono font-bold transition-colors duration-500 ${
                    isActive ? 'text-amber-400/70' : 'text-amber-400/50'
                  }`}>{finalGame.time}</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <span className="text-lg md:text-2xl text-white font-black">{finalGame.team1}</span>
                  <span className="text-sm font-bold text-amber-500/40 uppercase">vs</span>
                  <span className="text-lg md:text-2xl text-amber-200/70 font-bold">{finalGame.team2}</span>
                </div>

                <div className={`mt-4 pt-3 border-t transition-colors duration-500 ${
                  isActive ? 'border-amber-500/20' : 'border-amber-500/10'
                }`}>
                  <span className="text-sm text-white/30">
                    {finalGame.side}
                  </span>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Duration */}
        <div className="mt-10 md:mt-14 flex items-center justify-between px-5 md:px-7 py-5 md:py-6 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          <span className="text-sm md:text-base font-semibold text-white/40 uppercase tracking-wide">Длительность</span>
          <span className="text-xl md:text-2xl font-black text-white">~ 6 ч 15 мин</span>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#070710] text-white overflow-x-hidden">
      <Particles />

      {/* ========== HERO ========== */}
      <section className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center">

        {/* Dota 2 art background */}
        <div className="absolute inset-0 z-[0]">
          <Image
            src="/dota-bg.jpg"
            alt=""
            fill
            className="object-cover object-center blur-[2px] scale-105"
            priority
          />
          <div className="absolute inset-0 bg-[#070710]/60" />
          <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-[#070710] to-transparent" />
          <div className="absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-[#070710]/50 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#070710_100%)]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-5 md:px-8 pt-28 md:pt-36 pb-20">
          <p className="text-sm md:text-base tracking-[0.2em] text-white/50 uppercase font-medium">
            6 сентября · TimeHub, Убуд · старт 14:00
          </p>

          <h1 className="mt-5 text-7xl md:text-[120px] lg:text-[140px] font-black leading-[0.85] tracking-tight text-white drop-shadow-[0_4px_40px_rgba(0,0,0,0.6)]">
            ШОУМАТЧ
          </h1>

          <p className="mt-4 text-lg md:text-2xl font-bold tracking-[0.1em] text-white/70 uppercase">
            Dota 2 · предприниматели
          </p>

          <p className="mt-5 md:mt-6 text-white/80 text-base md:text-lg leading-relaxed max-w-xl">
            Шоуматч предпринимателей с участием <span className="text-white font-bold">Resolut1on</span> —
            финалиста The International 6 и The International 12.
            20 игроков, 5 раундов. Каждый сыграет в одной команде с про-игроком.
            Играем офлайн в клубе — или залетай онлайн из любой точки мира.
          </p>

          {/* Player — sticker style */}
          <div className="mt-8 flex items-center gap-5">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.6)] flex-shrink-0">
              <Image
                src="/resolut1on.png"
                alt="Resolut1on"
                width={96}
                height={96}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="text-left">
              <span className="text-xl md:text-2xl font-black tracking-wide text-white">RESOLUT1ON</span>
              <div className="flex gap-2 mt-2">
                <span className="text-xs md:text-sm font-bold px-3 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  Финалист TI6
                </span>
                <span className="text-xs md:text-sm font-bold px-3 py-1 rounded-md bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/25">
                  Финалист TI12
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <a
            href="https://t.me/TimeHub_PC?text=%D0%A0%D0%B5%D0%B1%D1%8F%D1%82%2C%20%D1%85%D0%BE%D1%87%D1%83%20%D0%B7%D0%B0%D0%BD%D1%8F%D1%82%D1%8C%20%D0%BC%D0%B5%D1%81%D1%82%D0%BE%20%D0%BD%D0%B0%20%D1%88%D0%BE%D1%83-%D0%BC%D0%B0%D1%82%D1%87%D0%B5.%20%D0%9A%D0%B8%D0%B4%D0%B0%D0%B9%D1%82%D0%B5%20%D0%B8%D0%BD%D1%84%D1%83%20%E2%80%94%20%D1%87%D1%82%D0%BE%2C%20%D0%B3%D0%B4%D0%B5%2C%20%D0%BA%D0%BE%D0%B3%D0%B4%D0%B0.%20%D0%93%D0%BE%D1%82%D0%BE%D0%B2%20%D0%BA%D0%B0%D1%82%D0%B0%D1%82%D1%8C%20%F0%9F%8E%AE"
            target="_blank"
            rel="noopener"
            className="mt-8 w-full md:w-auto inline-flex items-center justify-center px-14 py-4 bg-amber-500 text-[#070710] font-bold text-base tracking-[0.1em] uppercase rounded-lg hover:bg-amber-400 active:scale-[0.98] transition-all duration-200 max-w-sm shadow-[0_0_30px_rgba(245,158,11,0.25)]"
          >
            Участвовать
          </a>

          {/* Location inline */}
          <a
            href="https://maps.app.goo.gl/dhTeocsaCkTyLpJy6?g_st=ic"
            target="_blank"
            rel="noopener"
            className="mt-4 flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-sm font-medium">TimeHub, Убуд · Открыть на карте</span>
          </a>

          <p className="mt-3 text-sm text-white/50">
            Не в Убуде? <span className="text-white/80 font-medium">Можно залететь онлайн</span> — играешь из дома, команды те же
          </p>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-5 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1">
          <span className="text-xs font-medium tracking-[0.15em] text-white/30 uppercase">Расписание</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 animate-pulse">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section className="relative z-10 py-14 md:py-16 border-t border-white/5 border-b border-b-white/5 bg-[#070710]">
        <div className="max-w-5xl mx-auto px-6 md:px-8 flex justify-center gap-14 md:gap-32">
          {[
            { value: '20', label: 'Игроков' },
            { value: '5', label: 'Раундов' },
            { value: '14:00', label: 'Старт' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-5xl md:text-7xl font-black tracking-tight text-white">
                {stat.value}
              </div>
              <div className="mt-2 text-sm md:text-base font-medium tracking-wide text-white/40 uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== SCHEDULE ========== */}
      <Schedule />

      {/* ========== VIBE / ATMOSPHERE ========== */}
      <section className="relative z-10 py-16 md:py-24 bg-[#070710]">
        <div className="max-w-5xl mx-auto px-5 md:px-8">

          {/* Row 1 — photo left, text right */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-14">
            <div className="w-full md:w-1/2 aspect-[4/3] relative rounded-2xl overflow-hidden group">
              <Image
                src="/vibe-1.jpg"
                alt="Тусовка предпринимателей"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070710]/60 via-transparent to-transparent" />
            </div>
            <div className="w-full md:w-1/2 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                Больше, чем игра
              </h3>
              <p className="mt-4 text-base md:text-lg text-white/60 leading-relaxed">
                Это место, где предприниматели становятся тиммейтами. Где бизнес-разговоры начинаются с &laquo;gg wp&raquo;, а знакомства — с драфта героев.
              </p>
            </div>
          </div>

          {/* Row 2 — text left, photo right */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-14 mt-14 md:mt-20">
            <div className="w-full md:w-1/2 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                Просто чилл за компами
              </h3>
              <p className="mt-4 text-base md:text-lg text-white/60 leading-relaxed">
                Никаких конференц-залов и бейджиков. Игровой клуб, 20 компов, умные ребята и Dota на большом экране. Днём — матчи, вечером — afterparty на Бали. Всё просто.
              </p>
            </div>
            <div className="w-full md:w-1/2 aspect-[4/3] relative rounded-2xl overflow-hidden group">
              <Image
                src="/vibe-2.jpg"
                alt="Атмосфера ивента"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070710]/60 via-transparent to-transparent" />
            </div>
          </div>

          {/* CTA with urgency */}
          <div className="mt-16 md:mt-20 text-center">
            <p className="text-white/40 text-sm md:text-base font-bold uppercase tracking-[0.15em] mb-3">
              Всего 19 мест
            </p>
            <p className="text-white/70 text-lg md:text-xl font-semibold mb-8">
              5 раундов · офлайн в клубе или онлайн · тусовка предпринимателей
            </p>
            <a
              href="https://t.me/TimeHub_PC?text=%D0%A0%D0%B5%D0%B1%D1%8F%D1%82%2C%20%D1%85%D0%BE%D1%87%D1%83%20%D0%B7%D0%B0%D0%BD%D1%8F%D1%82%D1%8C%20%D0%BC%D0%B5%D1%81%D1%82%D0%BE%20%D0%BD%D0%B0%20%D1%88%D0%BE%D1%83-%D0%BC%D0%B0%D1%82%D1%87%D0%B5.%20%D0%9A%D0%B8%D0%B4%D0%B0%D0%B9%D1%82%D0%B5%20%D0%B8%D0%BD%D1%84%D1%83%20%E2%80%94%20%D1%87%D1%82%D0%BE%2C%20%D0%B3%D0%B4%D0%B5%2C%20%D0%BA%D0%BE%D0%B3%D0%B4%D0%B0.%20%D0%93%D0%BE%D1%82%D0%BE%D0%B2%20%D0%BA%D0%B0%D1%82%D0%B0%D1%82%D1%8C%20%F0%9F%8E%AE"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center w-full md:w-auto px-14 py-4 bg-amber-500 text-[#070710] font-bold text-base tracking-[0.1em] uppercase rounded-lg hover:bg-amber-400 active:scale-[0.98] transition-all duration-200 max-w-sm mx-auto shadow-[0_0_30px_rgba(245,158,11,0.25)]"
            >
              Успей занять место
            </a>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 pb-8">
        <div className="flex items-center justify-between py-4 border-t border-white/5">
          <span className="text-xs font-medium text-white/20 uppercase tracking-wide">Resolut1on Showmatch Series</span>
          <span className="text-xs font-medium text-white/20 uppercase tracking-wide">BALI · СЕЗОН 2</span>
        </div>
      </footer>
    </div>
  )
}
