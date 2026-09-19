import { ReactNode } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";

export interface AccordionItem {
  id: string;
  icon?: string;
  title: string;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  /** Index of the item open by default. Use -1 for all closed. */
  defaultOpen?: number;
}

/**
 * Accordion built on Headless UI's Disclosure (the Tailwind team's official
 * accessible component library), styled with Tailwind utility classes.
 * Each item is an independent Disclosure with full keyboard + ARIA support.
 */
export function Accordion({ items, defaultOpen = 0 }: AccordionProps) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, index) => (
        <Disclosure
          key={item.id}
          defaultOpen={index === defaultOpen}
          as="div"
          className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-all duration-200 hover:shadow-md data-[open]:border-accent/60 data-[open]:shadow-md data-[open]:shadow-accent/10"
        >
          {({ open }) => (
            <>
              <DisclosureButton className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                {item.icon && (
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl transition-colors ${
                      open
                        ? "bg-accent/15"
                        : "bg-[var(--surface-2)] group-hover:bg-accent/10"
                    }`}
                  >
                    {item.icon}
                  </span>
                )}
                <span className="flex-1 text-lg font-bold tracking-tight text-[var(--text)]">
                  {item.title}
                </span>
                <span
                  className={`shrink-0 text-xl leading-none text-[var(--muted)] transition-transform duration-300 ${
                    open ? "rotate-180" : ""
                  }`}
                >
                  ⌄
                </span>
              </DisclosureButton>

              <div className="overflow-hidden">
                <DisclosurePanel
                  transition
                  className="origin-top px-5 pb-5 pl-[4.75rem] leading-relaxed text-[var(--muted)] transition duration-200 ease-out data-[closed]:-translate-y-2 data-[closed]:opacity-0"
                >
                  <div className="border-t border-[var(--border)] pt-4">
                    {item.content}
                  </div>
                </DisclosurePanel>
              </div>
            </>
          )}
        </Disclosure>
      ))}
    </div>
  );
}
