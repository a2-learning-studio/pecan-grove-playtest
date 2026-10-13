# English and Spanish copy review

Status: prepared for Claude, assigned by Ali to review Spanish; **not signed off**. Scope: the new controls, pause, save slots, badges and feedback-consent copy, plus the Stop 2 question frame below. Existing Stops 3–15 remain in the wider per-stop readability review.

Review the actual JSON sources: `assets/games/community-builders/engine/locales/{en,es}.json`, `assets/games/community-builders/locales/{en,es}/core.json` and `stop-02.json`, `assets/playtest/locales/{en,es}.json`, and `assets/playtest/locales/feedback-{en,es}.json`. The Stop 2 deliberately weak question frame is now authored in `locales/{en,es}/stop-02.json` (`bank` entries used by `FRAME.will`). All fifteen stop story/choice banks have moved to JSON. Grown-up sharing copy now uses core JSON `W.consentHeading`, `W.consentScores`, `W.consentDetails` and `W.consentAutoScores`; review it beside the intro equivalent. The new fictional proposal excerpt is in `stop-04.json` `T.planExcerpt` and needs the same Spanish and certainty review.

## Specific changes and review examples

| Context                    | Before or issue                      | Current/proposed English                                | Current/proposed Spanish                                                 | Review focus                                                       |
| -------------------------- | ------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Pause Resume               | No pause menu                        | Resume                                                  | Seguir jugando                                                           | A child understands that this returns to the same round            |
| Restart                    | No round-reset explanation           | Start this stop again? This round’s answers will reset. | ¿Empezar esta parada de nuevo? Se borrarán las respuestas de esta ronda. | The saved journey is not mistaken for the round's answers          |
| Feedback Send              | Save feedback now; automatic uploads | Send to the playtest team                               | Enviar al equipo de prueba                                               | Clearly sending, rather than only saving locally                   |
| Local feedback             | Saving and sending were combined     | Save draft on this device                               | Guardar borrador en este dispositivo                                     | Distinct from Send; verify the actual feedback locale wording      |
| Save slot title            | Unclear profile entry                | Load game                                               | Cargar partida                                                           | Familiar game language; no typed name                              |
| New slot                   | No explicit new slot flow            | New game                                                | Partida nueva                                                            | Distinguish a new animal player from replaying a stop              |
| Motion                     | Long explanation in settings         | Calm motion                                             | Movimiento tranquilo                                                     | Prefer this over technical animation terms                         |
| No timed pressure          | No explicit note                     | Take your time. This game has no timers.                | Tómate tu tiempo. Este juego no tiene límite de tiempo.                  | Assures children; does not refer to upload retry timers            |
| Stop 2 weak yes/no frame   | “¿Va a estar todo bien con {t}{d}?”  | Will everything be OK with {t}{d}?                      | ¿Todo va a salir bien con {t}{d}?                                        | Implemented wording; native approval pending. Preserve an intentionally weak yes/no question, not a model answer |
| Badge for checking sources | New badge                            | Source Checker                                          | Revisa fuentes                                                           | Natural child-facing phrasing                                      |
| Persistence badge          | New badge                            | Try-Again Hero                                          | Héroe de intentarlo otra vez                                             | Check naturalness and gender inclusion                             |
| Completion badge           | New badge                            | Pecan Grove Builder                                     | Constructor(a) de Pecan Grove                                            | Check whether the parenthesized form fits the audience             |

## Review procedure

1. Review the English and Spanish screens side by side on a phone and desktop.
2. Keep placeholders such as `{action}`, `{number}`, `{stars}`, `{badges}` and `{count}` unchanged.
3. Check question marks and accents, and read the copy aloud. Prefer concrete verbs and sentences of 15 words or fewer.
4. Check the choice intentionally teaches: a deliberately weak Stop 2 question must stay weak, even while its Spanish improves.
5. Use the actual screens to decide whether “puntaje”, “control”, “partida” and “parada” are natural for the intended library community.
6. List any unavoidable words, such as a civic body name, as documented readability exceptions rather than silently claiming grade-level success.
7. Check the [privacy and consent table](engine-human-review.md): local saving must not imply that opted-in scores never leave the device. Score sharing and automatic score sending are separate choices, both initially off. Turning them off does not delete already received records.
8. Review Save draft, Send, contact-removal preview, Edit and the two-second grown-up hold in both languages. Switch languages with a typed draft open: interface labels should translate while the player's own words stay unchanged. Do not describe contact scrubbing as a guarantee that free text contains no personal information.

Automated key and placeholder parity is tested. That catches a missing translation or broken substitution; it cannot establish native fluency. `Intl.PluralRules`, `Intl.ListFormat` and `Intl.RelativeTimeFormat` format the new controls' counts and save-slot dates.

## Sign-off

Reviewer: Pending. Native-language background: Pending. Date: Pending. Screens reviewed: Pending. Required changes: Pending. Approved: **No sign-off yet**.
