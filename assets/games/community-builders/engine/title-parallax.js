/* Decorative depth follows a fine pointer only while full motion is enabled. */
export function titleParallax(root, hero) {
  if (!hero || hero.dataset.pointerParallax) return;
  hero.dataset.pointerParallax = "true";
  const art = hero.querySelector(".cb-hero__art");
  if (!art) return;
  const reset = () => {
    art.style.removeProperty("--cb-title-pointer-x");
    art.style.removeProperty("--cb-title-pointer-y");
  };
  hero.addEventListener("pointermove", (event) => {
    if (
      event.pointerType === "touch" ||
      root.dataset.motion !== "full" ||
      root.classList.contains("is-paused")
    ) {
      reset();
      return;
    }
    const rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const axis = (value, origin, size) =>
      Math.max(-4, Math.min(4, ((value - origin) / size - 0.5) * 8));
    art.style.setProperty(
      "--cb-title-pointer-x",
      axis(event.clientX, rect.left, rect.width) + "px",
    );
    art.style.setProperty(
      "--cb-title-pointer-y",
      axis(event.clientY, rect.top, rect.height) + "px",
    );
  });
  hero.addEventListener("pointerleave", reset);
}
