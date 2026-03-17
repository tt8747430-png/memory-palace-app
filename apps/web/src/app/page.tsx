function HomePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold md:text-4xl">Memory Palace</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Spatial learning platform — scaffold complete.
        </p>
      </div>
    </div>
  );
}

// Next.js App Router requires a default export for route segment entry files.
export default HomePage;
