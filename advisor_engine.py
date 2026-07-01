"""
Poker advisor engine using treys for hand evaluation.
No API, no internet, pure local logic.
"""
from treys import Card, Evaluator, Deck

evaluator = Evaluator()

# Hand strength thresholds (treys lower = better, 1=Royal Flush, 7462=worst)
RANK_THRESHOLDS = {
    1:    "Royal Flush",
    10:   "Straight Flush",
    166:  "Four of a Kind",
    322:  "Full House",
    1599: "Flush",
    1609: "Straight",
    2467: "Three of a Kind",
    3325: "Two Pair",
    6185: "One Pair",
    7462: "High Card",
}

def rank_to_name(rank: int) -> str:
    for threshold, name in RANK_THRESHOLDS.items():
        if rank <= threshold:
            return name
    return "High Card"


def parse_card(s: str) -> int:
    """Parse '2h', 'As', 'Td', 'Jc' etc into treys Card int."""
    s = s.strip()
    if len(s) < 2:
        raise ValueError(f"Carta invalida: {s}")
    rank = s[0].upper()
    suit = s[1].lower()
    return Card.new(rank + suit)


def eval_hand(hole: list[str], board: list[str]) -> dict:
    """
    Evaluate hand strength and return action recommendation.
    hole:  2 cards  e.g. ['Ah', 'Ks']
    board: 0,3,4,5 cards e.g. ['2d','7c','Jh']
    """
    all_cards = hole + board
    if len(set(all_cards)) < len(all_cards):
        raise ValueError("Carta repetida en el tablero")
    h = [parse_card(c) for c in hole]
    b = [parse_card(c) for c in board]
    street = {0:"preflop", 3:"flop", 4:"turn", 5:"river"}.get(len(b), "preflop")

    if street == "preflop":
        return _preflop_advice(hole)

    rank   = evaluator.evaluate(b, h)
    pct    = evaluator.get_five_card_rank_percentage(rank)  # 0=best, 1=worst
    name   = rank_to_name(rank)
    strength = 1.0 - pct  # 1=best hand possible, 0=worst

    action, reasoning = _postflop_action(strength, name, street)

    return {
        "street":   street,
        "hand":     name,
        "strength": round(strength, 3),
        "rank":     rank,
        "action":   action,
        "reasoning": reasoning,
    }


def _preflop_advice(hole: list[str]) -> dict:
    r1, s1 = hole[0][0].upper(), hole[0][1].lower()
    r2, s2 = hole[1][0].upper(), hole[1][1].lower()
    suited = s1 == s2

    ORDER = "AKQJT98765432"
    hi = min(r1, r2, key=lambda r: ORDER.index(r))
    lo = max(r1, r2, key=lambda r: ORDER.index(r))

    pair = r1 == r2
    hi_i = ORDER.index(hi)
    lo_i = ORDER.index(lo)

    # Premium
    if pair and hi_i <= 4:
        action, reason = "RAISE", f"Par premium ({hi}{hi}) - raise siempre"
    elif pair and hi_i <= 6:
        action, reason = "CALL", f"Par medio ({hi}{hi}) - call, fold ante re-raise grande"
    elif pair:
        action, reason = "CALL", f"Par chico ({hi}{hi}) - call para ver flop barato"
    elif hi_i <= 1 and lo_i <= 3:    # AK AQ AJ
        suf = " suited" if suited else ""
        action, reason = "RAISE", f"{hi}{lo}{suf} - mano premium, raise"
    elif hi_i == 0 and lo_i <= 8:
        if suited:
            action, reason = "CALL", f"A{lo} suited - call en posicion"
        else:
            action, reason = "FOLD", f"A{lo} offsuit - muy vulnerable, fold"
    elif hi_i <= 2 and lo_i <= 3 and suited:
        action, reason = "CALL", f"{hi}{lo} suited - call"
    elif hi_i <= 1 and lo_i <= 2:
        action, reason = "CALL", f"{hi}{lo} - call marginal"
    elif abs(hi_i - lo_i) == 1 and suited:
        action, reason = "CALL", f"{hi}{lo} suited connector - call para ver flop"
    else:
        action, reason = "FOLD", f"{hi}{lo} - mano debil, fold"

    return {
        "street":    "preflop",
        "hand":      "—",
        "strength":  None,
        "rank":      None,
        "action":    action,
        "reasoning": reason,
    }


def _postflop_action(strength: float, hand_name: str, street: str) -> tuple[str, str]:
    if strength >= 0.97:
        return "RAISE", f"{hand_name} - mano nutted, raise para extraer valor maximo"
    elif strength >= 0.85:
        return "RAISE", f"{hand_name} - mano muy fuerte, bet/raise value"
    elif strength >= 0.65:
        return "CALL",  f"{hand_name} - mano solida, call o bet value moderado"
    elif strength >= 0.45:
        return "CHECK", f"{hand_name} - mano marginal, check/call si es barato"
    elif strength >= 0.25:
        return "CHECK", f"{hand_name} - mano debil, check. Fold ante apuesta grande"
    else:
        return "FOLD",  f"{hand_name} - mano muy debil, fold ante cualquier apuesta"


def simulate_equity(hole: list[str], board: list[str], simulations: int = 2000) -> float:
    """Monte Carlo equity estimation against 1 random opponent."""
    h = [parse_card(c) for c in hole]
    b = [parse_card(c) for c in board]
    known = set(h + b)

    wins = 0
    for _ in range(simulations):
        deck = [c for c in Deck().cards if c not in known]
        import random
        random.shuffle(deck)

        opp      = deck[:2]
        runout   = deck[2: 2 + (5 - len(b))]
        full_board = b + runout

        my_rank  = evaluator.evaluate(full_board, h)
        opp_rank = evaluator.evaluate(full_board, opp)

        if my_rank < opp_rank:
            wins += 1
        elif my_rank == opp_rank:
            wins += 0.5

    return round(wins / simulations, 3)
