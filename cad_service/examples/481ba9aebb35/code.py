import cadquery as cq

OD = 300
H = 400
WALL = 12
FLOOR = 15

outer = cq.Workplane("XY").circle(OD/2).extrude(H)
inner = cq.Workplane("XY").circle(OD/2 - WALL).extrude(H - FLOOR).translate((0, 0, FLOOR))
result = outer.cut(inner)
