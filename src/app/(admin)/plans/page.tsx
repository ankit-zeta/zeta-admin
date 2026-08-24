"use client";

import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

const planLinks = [
  { href: "/plans/sales-communication-essentials", label: "Sales & Communication Essentials", price: "₹2,000" },
  { href: "/plans/ecommerce-business-essentials", label: "E-Commerce & Online Business Essentials", price: "₹4,000" },
  { href: "/plans/digital-marketing-web-professional", label: "Digital Marketing & Web Professional", price: "₹8,000" },
  { href: "/plans/ai-advanced-digital-skills", label: "AI & Advanced Digital Skills", price: "₹14,000" },
];

const courseLinks = [
  { href: "/programs/meta-ads-deep-dive", label: "Meta Ads Course India" },
  { href: "/programs/google-ads-essentials", label: "Google Ads for Beginners" },
  { href: "/programs/shopify-store-setup", label: "Shopify Store Setup Course" },
  { href: "/programs/woocommerce-store-setup", label: "WooCommerce Course" },
  { href: "/programs/coding-foundations", label: "Coding for Absolute Beginners" },
  { href: "/programs/gen-ai-prompting-mastery", label: "AI Prompting Course" },
];

const startLinks = [
  { href: "/plans", label: "Online courses with certificates in India" },
  { href: "/plans/digital-marketing-web-professional", label: "Learn digital marketing step by step" },
  { href: "/work", label: "Freelancing & gig work opportunities" },
  { href: "/plans/sales-communication-essentials", label: "Sales skills course for beginners" },
  { href: "/plans/ai-advanced-digital-skills", label: "Learn AI tools & prompting" },
  { href: "/signup", label: "Create free account & start learning" },
];

const ecosystemLinks = [
  { href: "/work", label: "Work Opportunities" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/support/track", label: "Track a Ticket" },
];

const legalLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/acceptable-use", label: "Acceptable Use" },
  { href: "/intellectual-property", label: "IP Policy" },
  { href: "/cookie-policy", label: "Cookies" },
  { href: "/payment-terms", label: "Payment Terms" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/security", label: "Security" },
];

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 min-w-0">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-200 whitespace-nowrap">{title}</h4>
      <ul className="space-y-2.5 text-[13px] leading-snug text-neutral-400">
        {children}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#1C221F] text-neutral-300 border-t border-neutral-800 text-sm mt-auto relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-600 to-transparent" aria-hidden />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-14 pb-10">
        <div className="grid gap-x-10 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_.8fr]">
          <div className="space-y-4 sm:pr-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-base shadow-sm">Z</div>
              <span className="text-xl font-bold tracking-tight text-white">ZetaGrow</span>
            </div>
            <p className="text-neutral-400 text-[13px] leading-relaxed">
              Certificate courses in digital marketing, e-commerce, coding, AI tools and communication. Anyone can join — learn self-paced, earn verified certificates and apply for freelancing & gig work on our curated marketplace.
            </p>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Serving learners across India — Mumbai · Delhi NCR · Bengaluru · Hyderabad · Pune · Jaipur · Kochi & more
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              <span className="font-medium">Learn. Work. Grow.</span>
            </div>
          </div>
          <FooterCol title="Learning Plans">
            {planLinks.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="hover:text-white transition-colors">
                  {p.label} <span className="text-neutral-500">· {p.price}</span>
                </Link>
              </li>
            ))}
          </FooterCol>
          <FooterCol title="Popular Courses">
            {courseLinks.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="hover:text-white transition-colors">{c.label}</Link>
              </li>
            ))}
          </FooterCol>
          <FooterCol title="Start Learning Today">
            {startLinks.map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
              </li>
            ))}
          </FooterCol>
          <FooterCol title="Platform">
            {ecosystemLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
              </li>
            ))}
          </FooterCol>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-200 mb-3">Legal & Policies</h4>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-500">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">© {new Date().getFullYear()} ZetaGrow. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Shield className="w-4 h-4 text-brand-400" aria-hidden />
            <span>Compliant & Transparent Operations · Made in India 🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
