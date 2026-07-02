/**
 * Shared framer-motion animation variants for the public website.
 * Durations are short (150–350ms) with a consistent easing curve and
 * respect the user's prefers-reduced-motion setting at the component level.
 * @module motion
 */
import type { Variants, Transition } from "framer-motion";

/** Consistent easing curve used across all website motion. */
export const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

/** Base transition applied to most entrance animations. */
export const baseTransition: Transition = { duration: 0.35, ease: EASE };

/** Fade + slide up — default section/card entrance. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

/** Simple opacity fade. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: baseTransition },
};

/** Fade + slight scale — for imagery / hero elements. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: baseTransition },
};

/** Parent container that staggers its children on entrance. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/** Child item to pair with {@link staggerContainer}. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

/** Mega-menu dropdown open/close transition. */
export const dropdown: Variants = {
  hidden: { opacity: 0, y: -8, transition: { duration: 0.15, ease: EASE } },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE } },
};

/** Standard viewport config for scroll-triggered `whileInView`. */
export const viewportOnce = { once: true, margin: "-80px" } as const;