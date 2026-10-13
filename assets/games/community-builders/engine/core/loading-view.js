/* Real resource completion drives the meter; a fast transition never flashes it. */
export default function createLoadingView(ctx) {
  function loadingTask(retry) {
    if (ctx.activeLoading) ctx.activeLoading.finish();
    var weights = { manifest: 5, module: 40, art: 35, voice: ctx.vOn ? 20 : 0 },
      done = { manifest: 0, module: 0, art: 0, voice: 0 },
      panel = null,
      bar = null,
      tip = null,
      timer = 0,
      tips = 0,
      closed = false,
      announced = 0;
    var labels = ctx.window.CBLocale.read("core", ctx.L).loading;
    function percent() {
      var sum = 0,
        total = 0;
      Object.keys(weights).forEach(function (key) {
        sum += done[key] * weights[key];
        total += weights[key];
      });
      return Math.round((sum / total) * 100);
    }
    function paint() {
      if (!panel) return;
      var value = percent();
      bar.value = value;
      var quarter = Math.floor(value / 25) * 25;
      if (quarter > announced) {
        announced = quarter;
        ctx.say(labels.progress + ": " + quarter + "%");
      }
    }
    function show() {
      if (closed || panel) return;
      panel = ctx.h("section", {
        class: "cb-loading-overlay",
        "aria-labelledby": "cb-load-heading",
        "data-cb-novoice": "",
      });
      var crest = ctx.h("span", {
        class: "cb-loading-crest",
        "aria-hidden": "true",
      });
      ctx.setAuthoredMarkup(crest, ctx.CREST);
      bar = ctx.h("progress", {
        max: 100,
        value: percent(),
        "aria-label": labels.progress,
      });
      tip = ctx.h("p", { text: labels.tips[0] });
      panel.append(
        crest,
        ctx.h("h2", { id: "cb-load-heading", text: labels.title }),
        bar,
        tip,
      );
      ctx.root.appendChild(panel);
      paint();
      function rotate() {
        if (closed) return;
        tip.textContent = labels.tips[++tips % labels.tips.length];
        timer = ctx.setTimeout(rotate, 4000);
      }
      timer = ctx.setTimeout(rotate, 4000);
    }
    var gate = ctx.setTimeout(show, 300);
    function finish() {
      if (closed) return;
      Object.keys(done).forEach(function (key) {
        done[key] = 1;
      });
      paint();
      closed = true;
      ctx.clearTimeout(gate);
      ctx.clearTimeout(timer);
      if (panel) panel.remove();
      if (ctx.activeLoading === task) {
        ctx.activeLoading = null;
        ctx.root.removeAttribute("aria-busy");
      }
    }
    ctx.root.setAttribute("aria-busy", "true");
    var task = {
      set: function (key, value) {
        if (key in done) done[key] = Math.max(0, Math.min(1, value));
        paint();
      },
      art: function (scope) {
        var images = [].slice.call(scope.querySelectorAll("img"));
        function decoded(image) {
          return (image.decode ? image.decode() : Promise.resolve()).catch(
            function (error) {
              // Rerendering the title can abort a decode for an image already replaced.
              if (!image.isConnected) return;
              if (image.complete && image.naturalWidth > 0) return;
              throw error;
            },
          );
        }
        return Promise.all(images.map(decoded))
          .then(function () {
            var replacements = [].slice
              .call(scope.querySelectorAll("img"))
              .filter(function (image) {
                return images.indexOf(image) === -1;
              });
            return Promise.all(replacements.map(decoded));
          })
          .then(function () {
            done.art = 1;
            paint();
          });
      },
      finish: finish,
      fail: function () {
        if (closed) return;
        ctx.clearTimeout(gate);
        ctx.clearTimeout(timer);
        show();
        ctx.clearTimeout(timer);
        ctx.clear(tip);
        tip.textContent = labels.fail;
        panel.appendChild(
          ctx.btn(labels.retry, "cb-btn--go", function () {
            finish();
            retry();
          }),
        );
        ctx.root.removeAttribute("aria-busy");
      },
    };
    ctx.activeLoading = task;
    return task;
  }
  ctx.publish({ loadingTask });
}
