/**
 * Animated stat counter using IntersectionObserver.
 * @module StatsCounter
 */
import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { WEBSITE_COLORS } from "@/lib/website/constants";

/** Single stat item configuration. */
export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
}

/** Props for {@link StatsCounter}. */
export interface StatsCounterProps {
  stats: readonly StatItem[];
}

/**
 * Animates numbers when scrolled into view.
 * @param props - Array of stat items to display
 */
export function StatsCounter({ stats }: StatsCounterProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", md: `repeat(${stats.length}, 1fr)` },
        gap: { xs: 2, md: 4 },
        py: { xs: 4, md: 5 },
        px: { xs: 2, md: 6 },
        bgcolor: WEBSITE_COLORS.bgNavy,
        color: "common.white",
      }}
    >
      {stats.map((stat) => (
        <Counter key={stat.label} {...stat} />
      ))}
    </Box>
  );
}

function Counter({ label, value, suffix = "", decimals = 0 }: StatItem) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.floor(display).toLocaleString();

  return (
    <Box ref={ref} sx={{ textAlign: "center" }}>
      <Typography
        variant="h3"
        sx={{ fontWeight: 700, color: "secondary.main", mb: 0.5 }}
      >
        {formatted}
        {suffix}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  );
}
