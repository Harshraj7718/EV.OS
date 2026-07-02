export const SectionFallback = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div
      className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
      role="status"
      aria-label="Loading section"
    />
  </div>
);
