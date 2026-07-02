/**
 * Row of social-profile icon links, driven by the nav config.
 * @module SocialIcons
 */
import Box from "@mui/material/Box";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import { SOCIAL_LINKS } from "@/lib/website/nav";

const ICONS = {
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  youtube: YouTubeIcon,
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
} as const;

/** Props for {@link SocialIcons}. */
export interface SocialIconsProps {
  /** Icon colour. */
  color?: string;
  /** Hover colour. */
  hoverColor?: string;
  /** Icon pixel size. */
  size?: number;
}

/**
 * Renders the configured social links as accessible icon buttons.
 * @param props - Colour and size overrides
 */
export function SocialIcons({ color = "#fff", hoverColor, size = 16 }: SocialIconsProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      {SOCIAL_LINKS.map((s) => {
        const Icon = ICONS[s.icon];
        return (
          <Box
            key={s.label}
            component="a"
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              color,
              transition: "color 0.2s ease",
              "&:hover": { color: hoverColor ?? "#fff" },
            }}
          >
            <Icon sx={{ fontSize: size }} />
          </Box>
        );
      })}
    </Box>
  );
}