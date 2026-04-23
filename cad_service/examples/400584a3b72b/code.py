import cadquery as cq

SIDE = 150

result = (
    cq.Workplane("XY")
      .box(SIDE, SIDE, SIDE)
)