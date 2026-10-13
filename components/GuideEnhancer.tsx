"use client";

import { useEffect } from "react";

// Adds copy buttons to code blocks, highlights the current section in the contents,
// and opens a folded section when someone jumps to it.
export default function GuideEnhancer() {
  useEffect(() => {
    // Copy buttons
    document.querySelectorAll<HTMLPreElement>(".guide pre").forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "Copy";
      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code")?.innerText ?? pre.innerText;
        try {
          await navigator.clipboard.writeText(code.replace(/\n$/, ""));
          btn.textContent = "Copied";
        } catch {
          btn.textContent = "Select and copy";
        }
        setTimeout(() => (btn.textContent = "Copy"), 1500);
      });
      pre.appendChild(btn);
    });

    // Open folded sections when their link is followed
    const openTarget = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      const details = el?.closest("details") ?? (el instanceof HTMLDetailsElement ? el : null);
      if (details && !details.open) {
        details.open = true;
        el?.scrollIntoView();
      }
    };
    openTarget();
    window.addEventListener("hashchange", openTarget);

    // Highlight the section being read
    const links = new Map<string, HTMLAnchorElement[]>();
    document.querySelectorAll<HTMLAnchorElement>("[data-toc]").forEach((a) => {
      const key = a.dataset.toc!;
      links.set(key, [...(links.get(key) ?? []), a]);
    });
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (!visible.length) return;
        const id = (visible[0].target as HTMLElement).dataset.section!;
        document.querySelectorAll("[data-toc].active").forEach((a) => a.classList.remove("active"));
        links.get(id)?.forEach((a) => a.classList.add("active"));
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("hashchange", openTarget);
      observer.disconnect();
    };
  }, []);

  return null;
}
