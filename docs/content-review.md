# Fact/Rumor neutrality and source review

Status: a concrete checklist; **classification review assigned to Claude, unfinished**. Ali approved implementing the modernization and releasing the playtest; that permission is not a classification sign-off. Source of truth: [`stops/04-fact-or-rumor.js`](../assets/games/community-builders/stops/04-fact-or-rumor.js), `CLAIMS` and `SRC`; Stop 4 has been extracted from `cb.js`. The claim numbers below identify the array's reading order for review, with claim 01 corresponding to `CLAIMS[0]`; they are not invented external research IDs. Interface feedback is authored in `assets/games/community-builders/locales/{en,es}/stop-04.json`, especially `T.ok.fact` and `T.tipFact`.

## Evidence boundary

Pecan Grove's company proposal, Regional Review, State Environment Office and board dates are **fictional in-world material used in this game**. The source IDs below point to that authored story evidence. They do not establish scientific facts about any real data center, town, health effect, water supply, tax outcome or employment outcome. No outside scientific citation has been fabricated for this review.

The revised fact choices refer to what the dated proposal says. A proposal can support “the proposal lists X”; it cannot, by itself, prove that X will happen. The game's feedback now makes that distinction. Questions that need an unfinished study or decision stay in “We don't know yet”. Rumors include hopeful and worried claims, and are evaluated by the source rather than which side they favor.

The actual Peek panel now includes an inspectable, clearly fictional proposal excerpt for all three `plan` claims. It is authored in the EN/ES `T.planExcerpt` JSON arrays and shows the September 3 date, a daily water-use estimate, jobs while building versus after opening, and proposed backup-engine use. It does not invent a water quantity, guarantee employment, or approve the project. The water claim is limited to the proposal including an estimate. The excerpt and its Spanish wording still need Claude's review; implementation is not human approval.

## Source register

| Source ID in code | Authored evidence                                                                 | Supports in the story                                 | Does not establish                                               | Human review |
| ----------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- | ------------ |
| `plan`            | Company proposal dated September 3, described as publicly readable at the library | What the proposal lists or says                       | Actual water use, guaranteed jobs, actual engine operating hours | Pending      |
| `air`             | Air permit still under review                                                     | That the permit review is unfinished                  | Whether smoke will reach the clinic or any health outcome        | Pending      |
| `sound`           | Sound study unfinished, due in spring                                             | That a site-specific sound study is not available yet | Either an inaudible site or certain sleep disturbance            | Pending      |
| `tax`             | Board has not decided on tax breaks; meeting in November                          | That the tax decision is pending                      | The eventual school funding outcome                              | Pending      |

## Per-claim checklist

| Claim | Kid-facing claim, shortened for review                         | Current basket    | Source ID                               | Decision to review                                                 | Status  |
| ----- | -------------------------------------------------------------- | ----------------- | --------------------------------------- | ------------------------------------------------------------------ | ------- |
| 01    | Uses no water at all                                           | Rumor             | None; friend-of-friend/chat explanation | Absolute hopeful claim has no shown evidence                       | Pending |
| 02    | Every well dries up next year                                  | Rumor             | None; friend-of-friend/chat explanation | Absolute worried claim has no shown evidence                       | Pending |
| 03    | September 3 proposal lists a daily water-use estimate            | Checked fact      | `plan`                                  | It is a fact about the text of the proposal, not actual future use | Pending |
| 04    | Everyone gets a job there                                      | Rumor             | None                                    | An unsupported promise, not a supported count                      | Pending |
| 05    | Not one job goes to local people                               | Rumor             | None                                    | Unsupported opposite absolute; same evidentiary standard           | Pending |
| 06    | Proposal lists many building jobs and fewer jobs after opening | Checked fact      | `plan`                                  | Attribute the comparison to the proposal; do not guarantee jobs    | Pending |
| 07    | Lights go out in every house                                   | Rumor             | None                                    | Unsupported feared outcome                                         | Pending |
| 08    | Everyone's power bill goes down                                | Rumor             | None                                    | Unsupported hoped-for outcome                                      | Pending |
| 09    | Backup engines run all day, every day                          | Rumor             | None                                    | Unsupported operating claim                                        | Pending |
| 10    | Proposal says backup engines run for cuts and short tests      | Checked fact      | `plan`                                  | What the proposal states; actual operation is not proved           | Pending |
| 11    | Every student receives a laptop next month                     | Rumor             | None                                    | Unsupported blanket promise                                        | Pending |
| 12    | School gets lots of new money                                  | We don't know yet | `tax`                                   | School funding remains an outcome to determine                     | Pending |
| 13    | No hum is heard from the farm fence                            | We don't know yet | `sound`                                 | Study is unfinished; avoid a guarantee of no sound                 | Pending |
| 14    | Hum keeps children awake                                       | We don't know yet | `sound`                                 | Study is unfinished; avoid asserting an outcome                    | Pending |
| 15    | Backup-engine smoke reaches the clinic                         | We don't know yet | `air`                                   | Review is unfinished; avoid asserting exposure                     | Pending |

## Approval questions

- Does each checked-fact choice have a nonempty source ID that exists in `SRC`?
- Does the displayed source actually support the limited wording of the claim?
- Are worried and hopeful claims held to the same standard?
- Does “We don't know yet” stay a valid, honest outcome rather than being treated as failure?
- Are any new claims about real-world effects clearly supported by real sources before being added?
- Do English and Spanish convey the same degree of certainty?
- For the three fact-tagged records, do claim 03 (`CLAIMS[2]`), claim 06 (`CLAIMS[5]`) and claim 10 (`CLAIMS[9]`) still reference the exact source ID `plan`? Recheck this mapping if the array changes.
- Does the displayed fictional excerpt support the three limited proposal-text claims, and is its qualification clear to children?

Reviewer: Claude (assigned by Ali). Review date: Pending. Required edits: Pending. Approval: **Not yet signed off**.

## Stop 13 source checklist

The poster-building stop also calls checked cards facts. Its source register and classifications remain authored data in `stops/13-spread-the-word-right.js`; kid-facing text lives in the EN/ES `stop-13.json` banks. These are in-world documents, not external evidence. Keep proposed outcomes attributed to the proposal or notes. The June 2 first plan is older material; swapping a card must use the revised source/date.

| Record / locale key | Claim to review | Source ID | Status |
| --- | --- | --- | --- |
| `FACTS[0]` / `bank.b0009` | Plan lists many jobs during building | `plan` | Claude pending |
| `FACTS[1]` / `bank.b0010` | Plan shows lights pointing down, away from homes | `plan` | Claude pending |
| `FACTS[2]` / `bank.b0011` | Board notes describe a proposed building far from the chapel | `board` | Claude pending |
| `FACTS[3]` / `bank.b0012` | Board notes propose an expert search for old graves | `board` | Claude pending |
| `FACTS[4]` / `bank.b0013` | Plan lists few jobs after opening | `plan` | Claude pending |
| `FACTS[5]` / `bank.b0014` | Plan lists daily water use | `plan` | Claude pending |
| `FACTS[6]` / `bank.b0015` | Plan says engines would run for power cuts and short tests | `plan` | Claude pending |
| `FACTS[7]` / `bank.b0016` | Air permit is not decided | `state` | Claude pending |
| `OLDS[0].nt` / `bank.b0018` | Revised plan proposes electrician classes next year, if approved | `plan` | Claude pending |
| `OLDS[1].nt` / `bank.b0020` | Revised plan retains big pecan trees by the creek | `plan` | Claude pending |
| `OLDS[2].nt` / `bank.b0022` | Revised plan proposes river water rather than wells | `plan` | Claude pending |
| `OLDS[3].nt` / `bank.b0024` | Sound study remains unfinished, due in spring | `board` | Claude pending |

Stop 13 register: `plan` = company plan at the library, September 3; `board` = Planning Board notes, September 24; `state` = State Environment Office letter, October 2; `first` = first company plan, June 2. A source label alone is not proof of a real-world outcome. The code gate verifies references, not factual truth or neutral framing.

## Automated source gate

`node tools/check-fact-sources.mjs` parses all authored game JS and JSON without executing it. It checks every static fact-tagged object, legacy fact claim tuple, and `FACTS`/`CLAIMS`/`OLDS` bank against its source register. Runtime fact records derived from validated banks must trace back to those banks. Missing/empty/unknown IDs and uninspectable fact banks fail the check. The current snapshot has 15 authored fact/update records plus four checked runtime derivations. The test suite invokes this gate; this is not a three-claim whitelist.

The same gate also checks the separate real-world register, [`fact-sources.json`](fact-sources.json). Stop 10's 16 real-place cards, the grown-up notes about Georgia (Stops 1, 6 and 15) and Stop 1's kids' definition of a data center each list outside sources (official records first; news only when it reports an official action), a checked date and a status. A card's place, note and "Did it work?" stamp must match its register entry, and editing a checked line in English or Spanish fails the gate until someone re-checks the sources and records the new wording fingerprint. The October 2026 check corrected four Stop 10 cards (Frederick County, South Fulton, Pennsylvania, Prince William County) and the Stop 1 and Stop 6 Georgia notes; one card (the Mansfield lights) is recorded as not confirmed. The educator sheet prints this register, its checked date and the corrections contact for grown-ups. A green gate still says only that sources are recorded and the wording has not changed since the check; it is not a neutrality review.

A green gate says the source reference exists. Claude must still assess source support, certainty, balance and EN/ES equivalence. New real-world scientific, health, tax or employment assertions need appropriate external primary sources before being presented as settled.
