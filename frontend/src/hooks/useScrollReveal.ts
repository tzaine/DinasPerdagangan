import { useEffect, useRef, useCallback } from "react";

/**
 * Scroll-reveal hook using Intersection Observer.
 * Attach the returned ref to a container element.
 * All children with class "reveal" will animate in when they enter the viewport.
 */
export function useScrollReveal() {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.setAttribute("data-visible", "true");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
        );

        const elements = container.querySelectorAll(".reveal");
        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    });

    const setRef = useCallback((node: HTMLDivElement | null) => {
        containerRef.current = node;
    }, []);

    return setRef;
}
