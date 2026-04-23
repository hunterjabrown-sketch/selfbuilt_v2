import cadquery as cq

RADIUS = 1220  # 4 ft
WIDTH = 1220

result = (
    cq.Workplane("XZ")
      .moveTo(0, 0)
      .radiusArc((RADIUS, RADIUS), RADIUS)
      .lineTo(RADIUS, 0)
      .close()
      .extrude(WIDTH)
)
