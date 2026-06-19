import React, { useEffect, useRef } from 'react';
import {
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Filler,
  ChartConfiguration,
} from 'chart.js';

Chart.register(LinearScale, LineController, LineElement, PointElement, Filler);

// --- TYPY ---
interface Point {
  x: number;
  y: number;
}

interface LineState {
  points: Point[];
  localBaseY: number; // Środek obecnego kanału (lokalne min/max)
  regime: 'CONSOLIDATION' | 'BREAKOUT'; // Faza rynku
  regimePointsLeft: number; // Ile punktów potrwa obecna faza
  breakoutDirection: number; // 1 (góra) lub -1 (dół)
  volatility: number;
  alpha: number;
  colorRGB: string;
}

// --- SUBTELNE KOLORY (RGB) ---
const AMBIENT_COLORS = [
  '0, 255, 136', // Neon Green
  '0, 204, 255', // Tech Cyan
  '153, 51, 255', // Deep Purple
  '255, 51, 102', // Neon Red
];

const NUMBER_OF_LINES = 4;
// Zmniejszamy minimalnie prędkość przesuwania, bo gęstsze punkty tworzą więcej detali
const PAN_SPEED = 0.6;

const BackgroundChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalWidth = window.innerWidth;

    // Funkcja generująca pojedynczą linię i jej historię "wstecz"
    const createInitialLine = (index: number): LineState => {
      const state: LineState = {
        points: [],
        localBaseY: 30 + Math.random() * 40,
        regime: 'CONSOLIDATION',
        regimePointsLeft: Math.floor(Math.random() * 50) + 30, // Startujemy w boczniaku
        breakoutDirection: 1,
        // Nieco mniejsza zmienność bazowa, bo wymuszamy ostre skoki sztucznie
        volatility: Math.random() * 1.2 + 0.8,
        alpha: 0.25,
        colorRGB: AMBIENT_COLORS[index % AMBIENT_COLORS.length],
      };

      let currentX = -100;
      let currentY = state.localBaseY;

      // Generujemy punkty aż za prawą krawędź ekranu
      while (currentX < totalWidth + 100) {
        state.points.push({ x: currentX, y: currentY });

        // --- MASZYNA STANÓW: Zmiana fazy rynku ---
        if (state.regimePointsLeft <= 0) {
          if (state.regime === 'CONSOLIDATION') {
            // Przejście w wybicie (nagły skok)
            state.regime = 'BREAKOUT';
            state.regimePointsLeft = Math.floor(Math.random() * 4) + 2; // Wybicie trwa krótko (2-5 punktów)

            // Decydujemy o kierunku - staramy się nie wylecieć za ekran
            if (currentY < 20) state.breakoutDirection = 1;
            else if (currentY > 80) state.breakoutDirection = -1;
            else state.breakoutDirection = Math.random() > 0.5 ? 1 : -1;
          } else {
            // Koniec wybicia, rynek się uspokaja i ustala nowe wsparcie/opór
            state.regime = 'CONSOLIDATION';
            state.regimePointsLeft = Math.floor(Math.random() * 70) + 40; // Boczniak trwa długo
            state.localBaseY = currentY; // Nowa baza wokół której oscylujemy
          }
        }
        state.regimePointsLeft--;

        // --- GENEROWANIE KOLEJNEGO PUNKTU ---

        // Punkty są teraz ZNACZNIE GĘŚCIEJ (od 4 do 14 px od siebie)
        const gapX = Math.random() * 10 + 4;
        currentX += gapX;

        if (state.regime === 'CONSOLIDATION') {
          // Kanciaste odbijanie się w lokalnym kanale (góra, dół, góra, dół)
          const bounceNoise = (Math.random() - 0.5) * state.volatility * 4;
          currentY = state.localBaseY + bounceNoise;

          // Minimalny dryf samego kanału (żeby nie było idealnie płasko)
          state.localBaseY += (Math.random() - 0.5) * 0.3;
        } else {
          // Wybicie: ostre, kierunkowe skoki bez wracania do bazy
          const jumpSize =
            Math.random() * state.volatility * 2.5 + state.volatility;
          currentY += state.breakoutDirection * jumpSize;
        }

        // Twardy limit, żeby nie rysowało poza canvasem
        currentY = Math.max(5, Math.min(95, currentY));
      }

      return state;
    };

    const lines: LineState[] = Array.from({ length: NUMBER_OF_LINES }).map(
      (_, i) => createInitialLine(i),
    );

    const getGradient = (colorRGB: string, alpha: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, `rgba(${colorRGB}, ${alpha * 0.25})`);
      gradient.addColorStop(1, `rgba(${colorRGB}, 0)`);
      return gradient;
    };

    const chartConfig: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        datasets: lines.map((line) => ({
          borderColor: `rgba(${line.colorRGB}, ${line.alpha})`,
          backgroundColor: getGradient(line.colorRGB, line.alpha),
          borderWidth: 1.5,
          pointRadius: 0,
          fill: 'start',
          tension: 0, // Kanciaste łączenia między bliskimi punktami
          data: line.points,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            display: true,
            min: -10,
            max: 110,
            grid: { color: 'rgba(255, 255, 255, 0.02)' },
            border: { display: false },
            ticks: { display: false },
          },
          x: {
            type: 'linear',
            display: true,
            min: 0,
            max: totalWidth,
            grid: { color: 'rgba(255, 255, 255, 0.02)' },
            border: { display: false },
            ticks: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: false,
      },
    };

    const chart = new Chart(ctx, chartConfig);
    let animationId: number;

    const updateLines = () => {
      let needsRender = false;

      lines.forEach((line, index) => {
        // Przesunięcie całej "kanciastej" struktury w lewo
        line.points.forEach((p) => {
          p.x -= PAN_SPEED;
        });

        // Czyszczenie starych danych z lewej strony
        if (line.points.length > 0 && line.points[0].x < -150) {
          line.points.shift();
        }

        // Doklejanie nowych punktów po prawej
        const lastPoint = line.points[line.points.length - 1];
        if (lastPoint.x < totalWidth + 50) {
          // Dokładnie ta sama logika co przy inicjalizacji
          if (line.regimePointsLeft <= 0) {
            if (line.regime === 'CONSOLIDATION') {
              line.regime = 'BREAKOUT';
              line.regimePointsLeft = Math.floor(Math.random() * 4) + 2;
              if (lastPoint.y < 20) line.breakoutDirection = 1;
              else if (lastPoint.y > 80) line.breakoutDirection = -1;
              else line.breakoutDirection = Math.random() > 0.5 ? 1 : -1;
            } else {
              line.regime = 'CONSOLIDATION';
              line.regimePointsLeft = Math.floor(Math.random() * 70) + 40;
              line.localBaseY = lastPoint.y;
            }
          }
          line.regimePointsLeft--;

          const gapX = Math.random() * 10 + 4;
          let nextY = lastPoint.y;

          if (line.regime === 'CONSOLIDATION') {
            const bounceNoise = (Math.random() - 0.5) * line.volatility * 4;
            nextY = line.localBaseY + bounceNoise;
            line.localBaseY += (Math.random() - 0.5) * 0.3;
          } else {
            const jumpSize =
              Math.random() * line.volatility * 2.5 + line.volatility;
            nextY = lastPoint.y + line.breakoutDirection * jumpSize;
          }

          nextY = Math.max(5, Math.min(95, nextY));

          line.points.push({ x: lastPoint.x + gapX, y: nextY });
        }

        chart.data.datasets[index].data = line.points;
        chart.data.datasets[index].backgroundColor = getGradient(
          line.colorRGB,
          line.alpha,
        );
        needsRender = true;
      });

      if (needsRender) {
        chart.update('none');
      }

      animationId = requestAnimationFrame(updateLines);
    };

    animationId = requestAnimationFrame(updateLines);

    return () => {
      cancelAnimationFrame(animationId);
      chart.destroy();
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: '#050507',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default BackgroundChart;
