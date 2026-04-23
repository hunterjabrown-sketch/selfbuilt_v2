import cadquery as cq
import math

# Dimensions from BuildSpec
RADIUS = 914   # 3 ft arc radius (equals ramp height for standard quarter pipe)
WIDTH  = 1220  # 4 ft wide

# Quarter-pipe profile in XZ plane:
#   Start at origin (0, 0) — bottom of arc / floor level
#   Arc to (RADIUS, RADIUS) — top of ramp
#   Line down to (RADIUS, 0) — vertical back wall base
#   Close back to origin — floor
result = (
    cq.Workplane("XZ")
      .moveTo(0, 0)
      .radiusArc((RADIUS, RADIUS), RADIUS)  # concave quarter-circle transition
      .lineTo(RADIUS, 0)
      .close()
      .extrude(WIDTH)
)