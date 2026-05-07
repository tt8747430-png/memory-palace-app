/**
 * SkipToContent — accessibility skip navigation link.
 *
 * Visually hidden by default; revealed on keyboard focus so users who navigate
 * by keyboard can bypass the sidebar/nav and jump directly to the page's main
 * content region. The target element must have `id="main-content"`.
 *
 * Pattern: https://www.w3.org/TR/WCAG20-TECHS/G1.html
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
    >
      Skip to main content
    </a>
  );
}
