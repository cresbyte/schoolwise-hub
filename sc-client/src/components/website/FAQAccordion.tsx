/**
 * FAQ accordion for parent resources and admissions pages.
 * @module FAQAccordion
 */
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { FaqItem } from "@/lib/website/data";

/** Props for {@link FAQAccordion}. */
export interface FAQAccordionProps {
  items: FaqItem[];
}

/**
 * Expandable FAQ list using MUI Accordion.
 * @param props - FAQ question/answer pairs
 */
export function FAQAccordion({ items }: FAQAccordionProps) {
  return (
    <>
      {items.map((item, i) => (
        <Accordion
          key={item.id}
          defaultExpanded={i === 0}
          disableGutters
          sx={{ mb: 1, "&::before": { display: "none" } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600 }}>{item.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {item.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
}
