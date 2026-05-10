import { SectionEyebrow } from './SectionEyebrow';

/**
 * Single italic pull-quote, mid-scroll. Modeled on the LanX "Founders
 * Note" section — humanises the brand without an entire about page
 * detour.
 */
export function FoundersNote() {
  return (
    <section className="relative w-full px-6 py-24 md:px-10 lg:px-14">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <SectionEyebrow>Founders&apos; note</SectionEyebrow>
        <blockquote className="mt-6 font-heading text-2xl font-normal italic leading-[1.25] tracking-tight text-foreground md:text-4xl lg:text-[2.6rem]">
          &ldquo;The Method of Loci is two thousand years old. The screen is forty. We are building
          the bridge between them — a place you can actually live inside, one room at a time.&rdquo;
        </blockquote>
        <footer className="mt-8 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 font-heading text-gold"
          >
            K
          </span>
          <div className="text-left">
            <div className="font-heading text-sm tracking-tight text-foreground">
              The Memory Palace team
            </div>
            <div className="font-body text-xs text-muted-foreground">
              Practitioners &amp; builders
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
