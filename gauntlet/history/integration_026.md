# Integration 026 — LOFT Mobile-First Camera Composition V1

## Outcome

Close putting now behaves like a deliberately composed mobile golf view. Portrait
keeps the complete golfer, putter, ball and cup visible together; short landscape
clears the centered map instrument; desktop retains its established world-first frame.

## Built

- frozen `LOFT_MOBILE_COMPOSITION_V1` camera specification
- smooth portrait blend from neutral framing to an authored golfer / ball split
- independent wide-phone release that keeps the golfer clear of the compact map
- slightly closer 5.0 m default putting envelope with the existing 3.0–7.2 m freedom
- raised putting look axis so the golfer clears the upper HUD and the ball / cup sit in
  the playable lower field
- identical composition profile in ready and swing-lock modes to prevent a framing
  jump when the stroke begins
- projection-based composition gate across 390 × 844, 844 × 390 and 1280 × 720

## Protected contracts

- full-shot position, zoom envelope, pitch, target line and normalized subject scale
  are unchanged
- pointer orbit, pinch / wheel zoom, swing lock, flight follow and result orbit remain
  intact
- ball, cup, putting physics, terrain, scoring, map, equipment and round state are
  untouched
- the camera reads `camera.aspect`; no browser-specific or pixel-sniffing branch exists

## Before / after

Before: a two-foot portrait setup projected the golfer body to approximately
`x = -0.20…0.35`, clipping the left side and pushing the head into the top instrument
band. Ball-to-cup separation was only about 3.2% of screen height.

After: the same body is entirely inside the safe field, ball and cup occupy the right
decision lane, the head clears the HUD, and true two-foot separation exceeds 4% of
screen height. Short landscape moves the subject away from the compact center map.

## Verification

- Terrain Gauntlet: 13 / 13 PASS
- Visual Gauntlet: 26 / 26 PASS
- all three real hole headings and distances pass the full-shot projection contract
- portrait, short-landscape and desktop close-putting frames inspected live
- putting aim and swing-lock frames pass the same safe-field checks
- max-zoom reset recovers a decision-scale golfer inside 45 fixed frames
- live warning / error log empty

## Honest result

This is a decisive interaction and presentation improvement, not a broader camera
rewrite. Flight and result framing remain intentionally unchanged. Extremely close
manual portrait zoom can still crop the golfer by player choice; Reset always restores
the authored frame.

## Next

The largest remaining raw gameplay discrepancy is the broad olive field presentation.
Build Coastal Turf & Light Readability V2: richer but restrained surface response,
clear maintained-cut hierarchy and stronger slope readability, while preserving the
exact `LOFT_FIELD_V4_CONTACT` geometry and physics identity.
