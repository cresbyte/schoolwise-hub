/**
 * Stats band — animated counting numbers shown when entering the viewport.
 * @module StatsBand
 */
"use client";
import { useEffect, useRef, useState } from "react";
import {Box,Container,Typography,Grid} from "@mui/material";
import { motion, useInView } from "framer-motion";
import type { SchoolStat } from "@/lib/website/data";
import { KAB } from "@/theme/websiteTheme";

interface StatsBandProps {
  stats: SchoolStat[];
}

function useCountUp(target: number, decimals = 0, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / 60;
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(id);
      } else {
        setValue(start);
      }
    }, 20);
    return () => clearInterval(id);
  }, [active, target]);
  return decimals ? value.toFixed(decimals) : Math.floor(value);
}

function StatItem({ stat }: { stat: SchoolStat }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const displayed = useCountUp(stat.value, stat.decimals ?? 0, inView);

  return (
    <Box
      ref={ref}
      sx={{
        textAlign: "center",
        px: 2,
        py: { xs: 3, md: 0 },
        position: "relative",
        "&:not(:last-child)::after": {
          content: '""',
          position: "absolute",
          right: 0,
          top: "20%",
          height: "60%",
          width: 1,
          bgcolor: "rgba(255,255,255,0.15)",
          display: { xs: "none", md: "block" },
        },
      }}
    >
      <Typography
        component="div"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 800,
          fontSize: { xs: "2.25rem", md: "3rem" },
          color: "#fff",
          lineHeight: 1,
          mb: 0.5,
        }}
      >
        {displayed}
        {stat.suffix && (
          <Box component="span" sx={{ color: KAB.secondaryLight, fontSize: "0.6em" }}>
            {stat.suffix}
          </Box>
        )}
      </Typography>
      <Typography
        sx={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 13,
          fontWeight: 500,
          color: "rgba(255,255,255,0.65)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {stat.label}
      </Typography>
    </Box>
  );
}

/** Animated statistics strip. */
export function StatsBand({ stats }: StatsBandProps) {
  return (
    <Box sx={{ bgcolor: KAB.primary, py: { xs: 5, md: 6 } }}>
      <Container maxWidth="xl">
        <Grid
          container
          spacing={2}
        >
          {stats.map((stat) => (
            <Grid size={{xs:6, md:3}}>
            <StatItem key={stat.label} stat={stat} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
