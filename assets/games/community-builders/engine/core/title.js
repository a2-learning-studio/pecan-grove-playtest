export default function createTitle(ctx) {
  function showTitle() {
    if (ctx.activeLifecycle) {
      ctx.activeLifecycle.dispose();
      ctx.activeLifecycle = null;
    }
    ctx.inStop = false;
    ctx.mode = "title";
    ctx.setTitle(null);
    var gu = ctx.btn(
      ctx.W.grownups,
      "cb-btn--onstage cb-btn--big",
      function () {
        ctx.openGrownups(gu);
      },
      "family",
    );
    var chapters = ctx.h(
      "ul",
      { class: "cb-hero__chapters" },
      ctx.W.chapters.map(function (c, i) {
        var li = ctx.h("li", null, [
          ctx.h("i", { "aria-hidden": "true" }),
          ctx.h("span", { text: c }),
        ]);
        li.style.setProperty("--cb-chap", ctx.CHAP[i]);
        return li;
      }),
    );
    ctx.screen([
      ctx.h("section", { class: "cb-hero", "aria-labelledby": "cb-hero-h" }, [
        ctx.img("town-map", "", "cb-hero__art", true),
        ctx.h("span", { class: "cb-hero__scrim", "aria-hidden": "true" }),
        ctx.h("div", { class: "cb-hero__copy" }, [
          ctx.h("h2", { class: "cb-vh", id: "cb-hero-h", text: ctx.W.series }),
          ctx.h("p", { class: "cb-hero__lead", text: ctx.W.intro1 }),
          ctx.h("p", { class: "cb-hero__note" }, [
            ctx.ico("star", "cb-ico--fill"),
            ctx.h("span", { text: ctx.W.intro2 }),
          ]),
          ctx.h("div", { class: "cb-row" }, [
            ctx.btn(
              ctx.W.start,
              "cb-btn--go cb-btn--big",
              function () {
                ctx.showMap();
              },
              "go",
              true,
            ),
            gu,
          ]),
          chapters,
        ]),
      ]),
    ]);
  }
  ctx.publish({ showTitle });
}
