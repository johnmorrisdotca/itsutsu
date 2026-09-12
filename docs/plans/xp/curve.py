RAMP = [20*(i+1) for i in range(10)]
HANDOFF, REST, TARGET = 220, 90, 70000
def total_for(r): return sum(HANDOFF*r**k for k in range(REST))
lo, hi = 1.0000001, 1.20
for _ in range(300):
    mid=(lo+hi)/2
    if sum(RAMP)+total_for(mid) < TARGET: lo=mid
    else: hi=mid
r=(lo+hi)/2
raw = RAMP + [HANDOFF*r**k for k in range(REST)]
# Round every cost to a 0 or 5, nudging up when rounding would flatten a neighbour.
cost=[]
for x in raw:
    v = int(round(x/5.0)*5)
    if cost and v <= cost[-1]: v = cost[-1]+5
    cost.append(v)
assert len(cost)==100 and all(cost[i]>cost[i-1] for i in range(1,100)), "not strictly increasing"
cum=[]; run=0
for c in cost: run+=c; cum.append(run)
print(f"rate {(r-1)*100:.3f}%/level, doubles every {0.693/(r-1):.0f} levels, total {cum[-1]:,}")
print()
for row in range(0,100,10):
    print(", ".join(f"{c}" for c in cost[row:row+10])+",")
print()
def lvl(xp):
    for L in range(100,1,-1):
        if xp >= cum[L-2]: return L
    return 1
print("cumulative to reach a level (xpForLevel):")
for L in (2,5,10,15,20,25,30,40,50,60,70,80,90,100):
    print(f"  L{L:<4} {cum[L-2]:>8,}")
print()
print("what a player reaches:")
for label,xp in [("casual, month 1",1275),("casual, year 1",7700),("casual, year 3",20000),
                 ("committed, month 1",3300),("committed, year 1",25000),
                 ("committed, year 2",47000),("committed, year 3",69000),
                 ("tour only (one-offs, 3015)",3015)]:
    print(f"  {label:<30} {xp:>7,} XP -> L{lvl(xp)}")
