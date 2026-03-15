"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/faq";

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <Accordion type="multiple" className="w-full">
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:text-primary">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
