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
      announced = 0,
      cancelArt = [];
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
      cancelArt.splice(0).forEach(function (cancel) {
        cancel();
      });
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
        function criticalImages() {
          // Deferred portraits keep their normal browser loading lifecycle and must
          // not block the playable scene while they are outside the viewport.
          return [].filter.call(
            scope.querySelectorAll("img"),
            function (image) {
              return image.getAttribute("loading") !== "lazy";
            },
          );
        }
        var images = criticalImages();
        function sourceSelection(image) {
          var picture = image.parentElement;
          return JSON.stringify([
            image.currentSrc,
            image.getAttribute("src"),
            image.getAttribute("srcset"),
            image.getAttribute("sizes"),
            picture && picture.tagName === "PICTURE"
              ? [].map.call(
                  picture.querySelectorAll("source"),
                  function (source) {
                    return ["srcset", "sizes", "media", "type"].map(
                      function (key) {
                        return source.getAttribute(key);
                      },
                    );
                  },
                )
              : [],
          ]);
        }
        function loaded(image) {
          return new Promise(function (resolve, reject) {
            var waiting = true,
              timeout;
            function settle(failure, ready) {
              if (!waiting) return;
              waiting = false;
              ctx.clearTimeout(timeout);
              image.removeEventListener("load", loadedImage);
              image.removeEventListener("error", failedImage);
              var index = cancelArt.indexOf(cancel);
              if (index >= 0) cancelArt.splice(index, 1);
              if (failure) reject(failure);
              else resolve(ready);
            }
            function loadedImage() {
              settle(
                image.naturalWidth > 0
                  ? null
                  : new Error("Image failed to load"),
                true,
              );
            }
            function failedImage() {
              settle(new Error("Image failed to load"));
            }
            function cancel() {
              settle(null, false);
            }
            image.addEventListener("load", loadedImage);
            image.addEventListener("error", failedImage);
            cancelArt.push(cancel);
            timeout = ctx.setTimeout(failedImage, 15000);
            if (closed || !image.isConnected) cancel();
            else if (image.complete) loadedImage();
          });
        }
        function decoded(image, retries) {
          if (closed || !image.isConnected) return Promise.resolve();
          // Firefox can reject decode() before an eager request has completed.
          // Wait for the request's actual load/error result before decoding it.
          if (image.complete === false)
            return loaded(image).then(function (ready) {
              return ready ? decoded(image, retries) : undefined;
            });
          var source = sourceSelection(image),
            decoding;
          try {
            decoding = image.decode ? image.decode() : Promise.resolve();
          } catch (error) {
            decoding = Promise.reject(error);
          }
          return decoding.catch(function (error) {
            // Rerendering the title can abort a decode for an image already replaced.
            if (!image.isConnected) return;
            if (image.complete && image.naturalWidth > 0) return;
            // A responsive crop can select a new request while decode is pending.
            // currentSrc may still lag behind the changed sizes/srcset attributes.
            // Only a source-selection change may recover; an unchanged image fails.
            if (
              closed ||
              image.complete ||
              sourceSelection(image) === source ||
              retries >= 3
            )
              throw error;
            return loaded(image).then(function (ready) {
              return ready ? decoded(image, retries + 1) : undefined;
            });
          });
        }
        return Promise.all(
          images.map(function (image) {
            return decoded(image, 0);
          }),
        )
          .then(function () {
            var replacements = criticalImages().filter(function (image) {
              return images.indexOf(image) === -1;
            });
            return Promise.all(
              replacements.map(function (image) {
                return decoded(image, 0);
              }),
            );
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
        var again = ctx.btn(labels.retry, "cb-btn--go", function () {
          finish();
          retry();
        });
        panel.appendChild(again);
        ctx.root.removeAttribute("aria-busy");
        // The message and Try again come into view and take focus, wherever
        // the map was scrolled when the stop failed to load: Try again sits in
        // the middle of the screen with the message just above it.
        if (again.scrollIntoView)
          again.scrollIntoView({ block: "center", behavior: "auto" });
        again.focus({ preventScroll: true });
      },
    };
    ctx.activeLoading = task;
    return task;
  }
  ctx.publish({ loadingTask });
}
