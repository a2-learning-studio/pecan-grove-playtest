# Performance verification

The build enforces a 120 KB compressed script limit, a 40 KB compressed stylesheet limit, a 15 KB compressed critical stylesheet limit, and a 120 KB font limit. See the generated build receipts for measurements from a particular build. The font subset preserves variable weight axes and checks the accented letters and punctuation used in Spanish.

Only the critical stylesheet blocks the introduction. Full game styles are requested when Start is chosen; a failed request leaves a retryable introduction. Stops fetch their own code, styles and bilingual text banks. Responsive map art offers AVIF and WebP, and cropped art measures the displayed crop before selecting a source width. A small map placeholder fills the art while the image decodes.

GitHub Actions runs Lighthouse navigation audits three times for each language, requiring performance at least 95, accessibility 100, best practices 100, LCP at most 2.5 seconds, FCP at most 1.5 seconds, TBT at most 50 ms and no layout shift. Separate Lighthouse user flows open the actual title, map, Stop 1 and Stop 2 three times per language. Their snapshots check accessibility and best practices; their interaction traces check TBT and layout shift where Lighthouse supplies these metrics. Snapshot and timespan reports do not produce navigation LCP or a comparable navigation performance score. We do not substitute those missing metrics or claim a pass for them.

Reports are attached to the performance workflow artifact. Authored checks and build budgets are not a substitute for a completed browser run. Cold-cache Slow 4G image timing, physical controllers, assistive technology and native mobile install behavior require their own verification.
