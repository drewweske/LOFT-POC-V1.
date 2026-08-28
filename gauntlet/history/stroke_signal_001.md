# THE SIGNAL 001 — proprietary stroke control

Trigger:
The first dedicated putting build crashed on release and the input still did not communicate power clearly enough.

Critical bug:
feedback.flight() was called for a putt without startFlight(), causing lastTrailPoint.copy() on null.

Fix:
- feedback.flight() self-initializes defensively
- putting never runs airborne trail feedback

UX critic verdict:
LOSS on clarity.

Largest meaningful gap:
The system had useful mechanics but no single visual idea that explained what the player's hand was doing across putts, chips and full swings.

Rebuild:
THE SIGNAL.

The official LOFT orange dimple becomes the input token.
A path of quiet Cream dimples extends backward from the ball.
The Orange Signal follows the physical backstroke and returns through the ball.

Full shots:
- The Line = intent
- Cream SET mark = suggested backstroke for that intent
- Orange Signal = actual stroke
- tempo / path / smoothness / commitment = strike quality

Putting:
- Signal = physical stroke
- translucent LOFT ghost ball = predicted stop
- feet = only explicit distance datum
- ON PACE = target alignment cue

Control architecture:
Distance now comes primarily from backstroke depth instead of a vague multi-variable power blend.

Result:
The player can understand power before contact without a slider, meter or separate button.
