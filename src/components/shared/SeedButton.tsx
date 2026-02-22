'use client';

export function SeedButton() {
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const btn = e.currentTarget;
    btn.textContent = 'Downloading... (this takes ~30s)';
    btn.classList.add('opacity-60', 'pointer-events-none');
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      btn.textContent = data.message || 'Done! Reloading...';
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      btn.textContent = 'Failed — check the terminal for errors';
      btn.classList.remove('opacity-60', 'pointer-events-none');
    }
  };

  return (
    <a
      href="/api/seed"
      onClick={handleClick}
      className="inline-block px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition cursor-pointer"
    >
      Download Question Bank
    </a>
  );
}
