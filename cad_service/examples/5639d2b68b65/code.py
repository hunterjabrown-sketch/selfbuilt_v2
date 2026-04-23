import cadquery as cq

LENGTH = 200
WIDTH  = 100
HEIGHT = 40

result = (
    cq.Workplane("XY")
      .box(LENGTH, WIDTH, HEIGHT)
)