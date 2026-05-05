
"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Portfolio", href: "#portfolio" },
  { name: "Experience", href: "#experience" },
  { name: "Skills", href: "#skills" },
  { name: "Contact", href: "#contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 py-4",
        scrolled ? "bg-background/80 backdrop-blur-xl border-b py-3 shadow-lg" : "bg-transparent py-6"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="#home" className="text-2xl font-headline font-bold text-primary group">
          Mahendra<span className="text-foreground group-hover:text-primary transition-colors">.</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full hover:text-primary hover:bg-primary/5 transition-all duration-300"
            >
              {link.name}
            </Link>
          ))}
          <div className="ml-4 pl-4 border-l flex items-center gap-4">
            <ThemeToggle />
            <Button asChild className="rounded-full px-8 shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all font-bold">
              <Link href="#contact">Hire Me</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center space-x-3">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="rounded-full hover:bg-primary/10">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-x-0 top-full bg-background/95 backdrop-blur-2xl border-b animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col p-8 space-y-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-2xl font-headline font-bold hover:text-primary transition-colors text-center"
              >
                {link.name}
              </Link>
            ))}
            <Button asChild className="rounded-full py-8 text-xl font-bold" onClick={() => setIsOpen(false)}>
              <Link href="#contact">Let's Connect</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
