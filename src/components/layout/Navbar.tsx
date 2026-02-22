import Link from 'next/link';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/exam', label: 'Exam' },
  { href: '/flashcards', label: 'Flashcards' },
  { href: '/quiz', label: 'Quiz' },
  { href: '/progress', label: 'Progress' },
];

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
      <span className="font-bold text-blue-700 text-lg mr-4">CBO Prep</span>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
