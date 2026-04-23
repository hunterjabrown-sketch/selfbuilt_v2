import cadquery as cq

L = 1220  # 4 ft
W = 610   # 2 ft
H = 406   # 16 in
T = 18    # 3/4 plywood

outer = cq.Workplane("XY").box(L, W, H)
inner = cq.Workplane("XY").box(L - 2*T, W - 2*T, H + 1)
result = outer.cut(inner)
