# Generates XP_LEVEL_COST in src/lib/xp/xpCurve.ts. Change a decision below and paste
# the table it prints, rather than hand-editing one row: the shape is the decision, and
# a single edited row is not a shape.
#
#   python3 docs/plans/xp/curve.py
#
# XP_LEVEL_COST[i] is the price of reaching level i + 2 - ONE RUNG, not a running total.
# There are 99 of them, one per level-up from level 2 to level 100, so the table's plain
# sum is xpForLevel(100). Level 100 is the top; there is no level 101 and no row for one.

# ── THE DECISIONS ─────────────────────────────────────────────────────────────
RAMP = [50 * (n + 1) for n in range(9)]   # reach levels 2-10: 50, 100 ... 450. Quick, and legible.
STEP_AT_11 = 700                          # reach level 11: half as dear again as level 10. "Harder after 10."
STEP_AT_21 = 1.25                         # reach level 21: a quarter dearer than level 20. "Harder after 20."
SPREAD = 2.0                              # the compounding rate TRIPLES between level 12 and level 100
TARGET = 999_999                          # xpForLevel(100). John: "you need 999,999 to get to the top level".

# ── THE ONE SOLVED NUMBER: the starting rate, g0 ─────────────────────────────────
def shape(g0):
    out = [float(STEP_AT_11)]
    for level in range(12, 101):          # reach 12 ... reach 100
        rate = g0 * (1 + SPREAD * (level - 12) / 88)
        nxt = out[-1] * STEP_AT_21 if level == 21 else out[-1] * (1 + rate)
        out.append(nxt)
    return RAMP + out

def step(x):                              # round to what a reader can see: 5s, then 25s, then 50s
    if x < 1_000: return 5
    if x < 10_000: return 25
    return 50

def rounded(raw):
    cost = []
    for x in raw:
        v = int(round(x / step(x)) * step(x))
        if cost and v <= cost[-1]: v = cost[-1] + step(cost[-1])
        cost.append(v)
    return cost

# Every rounded cost ends in 0 or 5, so the rounded table can reach FIVES at most: the
# largest multiple of five not above the target.
FIVES = TARGET - TARGET % 5

lo, hi = 1e-6, 0.3
for _ in range(200):
    mid = (lo + hi) / 2
    if sum(rounded(shape(mid))[:99]) < FIVES: lo = mid
    else: hi = mid
g0 = lo
cost = rounded(shape(g0))

# ── LANDING EXACTLY ─────────────────────────────────────────────────────────────
# Rounding leaves the total a few fives short of FIVES. That remainder is laid on the
# cheapest compounding rows, 5 at a time, starting at level 12 - where 5 is the natural
# unit - and only where the row stays below the one after it.
short = FIVES - sum(cost[:99])
assert short >= 0 and short % 5 == 0, short
index = 10
while short > 0:
    if cost[index] + 5 < cost[index + 1] and cost[index] + 5 < 1_000:
        cost[index] += 5
        short -= 5
    index += 1
    if index >= 98: index = 10

# Then LEVEL 100's OWN RUNG takes whatever is left below five, so the top is exactly
# John's number. The rounding is this generator's convenience and his number is the
# requirement; where they disagree, the last rung gives way. It is the one cost that
# may not end in 0 or 5.
TOP = 98                                  # XP_LEVEL_COST[98] is the price of reaching level 100
cost[TOP] += TARGET - sum(cost[:99])

assert len(cost) == 99, len(cost)
assert TOP == len(cost) - 1, "level 100's rung is the last row"
assert all(cost[i] > cost[i - 1] for i in range(1, len(cost))), "not strictly increasing"
assert all(c % 5 == 0 for i, c in enumerate(cost) if i != TOP), "a cost other than level 100's that does not end in 0 or 5"
cum = []
run = 0
for c in cost:
    run += c
    cum.append(run)
assert cum[98] == TARGET, cum[98]
assert sum(cost) == TARGET, sum(cost)

def reach(level):
    return 0 if level <= 1 else cum[level - 2]

def level_for(xp):
    for L in range(100, 1, -1):
        if xp >= reach(L): return L
    return 1

assert level_for(TARGET) == 100 and level_for(TARGET - 1) == 99

print(f"rate {g0*100:.3f}% a level at 12, rising to {g0*(1+SPREAD)*100:.3f}% at 100; xpForLevel(100) = {reach(100):,}")
print()
for row in range(0, 100, 10):
    print("  " + ", ".join(str(c) for c in cost[row:row + 10]) + ",")
print()
print("to reach (cumulative XP, then the price of that one rung):")
for L in (2, 5, 10, 11, 12, 20, 21, 25, 30, 40, 50, 60, 75, 90, 100):
    print(f"  L{L:<4} {reach(L):>9,}   (this rung {cost[L - 2]:>7,})")
print()
print("first ten levels are", f"{reach(10) / reach(100) * 100:.2f}% of the ladder")
