"use client";

import Link from "next/link";

/**
 * Text wordmark — avoids relying on missing /PowerPlay.png in minimal checkouts.
 */
export default function BrandWordmark({
  href = "/",
  className = "",
  textClassName = "text-xl sm:text-2xl md:text-[1.65rem] lg:text-[1.85rem]",
}) {
  const inner = (
    <span
      className={`font-display font-bold tracking-tight whitespace-nowrap ${textClassName}`}
    >
      <span className="text-[#F1324D]">APT</span>
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
        -Casino
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={`logo inline-flex items-center ${className}`}>
        {inner}
      </Link>
    );
  }

  return <span className={className}>{inner}</span>;
}
