"""
Zynga Poker Advisor — compact layout: cards top, keypad|result middle, suits bottom
"""
import tkinter as tk
from advisor_engine import eval_hand, simulate_equity

BG      = "#0d1117"
SURF    = "#161c27"
BTN     = "#1e2535"
BTN2    = "#252d3d"
BORDER  = "#2a3347"
TEXT    = "#dde3f0"
DIM     = "#4a5a72"
ACCENT  = "#4f6ef7"
SUCCESS = "#38b56a"
DANGER  = "#e05252"
WARNING = "#e0a030"
PURPLE  = "#9b72f0"
TEAL    = "#38a3d4"

SUIT_CLR  = {"♠": "#c8d8f0", "♥": "#e05252", "♦": "#e05252", "♣": "#38b56a"}
SUIT_CODE = {"♠": "s", "♥": "h", "♦": "d", "♣": "c"}
ACT_CLR   = {"FOLD": DANGER,   "CHECK": SUCCESS, "CALL": TEAL,    "RAISE": WARNING}
ACT_BG    = {"FOLD": "#2a1212","CHECK": "#0f2a1a","CALL": "#0d1f2e","RAISE": "#2a1c08"}

SUITS     = ["♠", "♥", "♦", "♣"]
RANK_CODE = {"10": "T"}

GRID_ROWS = [
    ["J",  "Q",  "K" ],
    ["8",  "9",  "10"],
    ["5",  "6",  "7" ],
    ["2",  "3",  "4" ],
]


class App:
    def __init__(self, root):
        self.root = root
        self.root.title("Poker Advisor")
        self.root.configure(bg=BG)
        self.root.resizable(False, False)

        self.cards         = [None] * 7
        self.pending       = None
        self.pending_label = None
        self.cursor        = 0
        self.slot_btns     = []
        self.rank_btns     = {}
        self.suit_btns     = {}

        self._build()
        self._highlight_cursor()

    # ─────────────────────────────────────────────────────────────────────────

    def _build(self):
        # ── Header ──
        hdr = tk.Frame(self.root, bg="#080c12", pady=7)
        hdr.pack(fill="x")
        tk.Label(hdr, text="POKER  ADVISOR", bg="#080c12",
                 font=("Segoe UI", 9, "bold"), fg=DIM).pack()

        # ── Row 1: card slots (full width strip) ──
        strip = tk.Frame(self.root, bg=BG, padx=14, pady=10)
        strip.pack(fill="x")
        self._build_cards(strip)

        tk.Frame(self.root, bg=BORDER, height=1).pack(fill="x")

        # ── Row 2: keypad LEFT | result RIGHT ──
        mid = tk.Frame(self.root, bg=BG, padx=14, pady=10)
        mid.pack()

        kp_frame = tk.Frame(mid, bg=BG)
        kp_frame.pack(side="left", anchor="n", padx=(0, 12))
        self._build_keypad(kp_frame)

        res_frame = tk.Frame(mid, bg=SURF)
        res_frame.pack(side="left", anchor="n")
        self._build_result(res_frame)

        tk.Frame(self.root, bg=BORDER, height=1).pack(fill="x")

        # ── Row 3: suits + controls (bottom bar) ──
        bot = tk.Frame(self.root, bg=BG, padx=14, pady=10)
        bot.pack(fill="x")
        self._build_suits(bot)
        self._build_controls(bot)

    # ── Card slots ────────────────────────────────────────────────────────────

    def _build_cards(self, parent):
        groups = [
            ("MIS CARTAS", range(0, 2),    ACCENT),
            ("FLOP",       range(2, 5),    BTN2),
            ("TURN",       range(5, 6),    BTN2),
            ("RIVER",      range(6, 7),    BTN2),
        ]
        for label, indices, border in groups:
            col = tk.Frame(parent, bg=BG)
            col.pack(side="left", padx=(0, 14), anchor="n")
            tk.Label(col, text=label, bg=BG,
                     font=("Segoe UI", 7, "bold"), fg=DIM).pack(anchor="w")
            row = tk.Frame(col, bg=BG)
            row.pack(pady=(3, 0))
            for i in indices:
                wrap = tk.Frame(row, bg=border, padx=1, pady=1)
                wrap.pack(side="left", padx=(0, 3))
                b = tk.Button(wrap, text="?", width=4,
                              font=("Segoe UI", 13, "bold"),
                              bg=BTN, fg=DIM, activebackground=BTN2,
                              relief="flat", bd=0, cursor="hand2", pady=9,
                              command=lambda i=i: self._clear_slot(i))
                b.pack()
                self.slot_btns.append(b)

    # ── Keypad ────────────────────────────────────────────────────────────────

    def _build_keypad(self, parent):
        for ri, row in enumerate(GRID_ROWS):
            for ci, label in enumerate(row):
                is_face = RANK_CODE.get(label, label) in "AKQJ"
                b = tk.Button(parent, text=label, width=3,
                              font=("Segoe UI", 13, "bold"),
                              bg=BTN, fg=WARNING if is_face else TEXT,
                              activebackground=ACCENT, activeforeground="white",
                              relief="flat", bd=0, cursor="hand2",
                              command=lambda l=label: self._pick_rank(l))
                b.grid(row=ri, column=ci, padx=2, pady=2, ipady=8)
                self.rank_btns[label] = b

        b = tk.Button(parent, text="A", width=3,
                      font=("Segoe UI", 13, "bold"),
                      bg=BTN, fg=WARNING,
                      activebackground=ACCENT, activeforeground="white",
                      relief="flat", bd=0, cursor="hand2",
                      command=lambda: self._pick_rank("A"))
        b.grid(row=4, column=1, padx=2, pady=2, ipady=8)
        self.rank_btns["A"] = b

    # ── Result panel ──────────────────────────────────────────────────────────

    def _build_result(self, parent):
        # action band
        self.band = tk.Frame(parent, bg=BTN2, padx=20, pady=14)
        self.band.pack(fill="x")

        self.street_lbl = tk.Label(self.band, text="", bg=BTN2,
                                   font=("Segoe UI", 8, "bold"), fg=DIM)
        self.street_lbl.pack()

        self.action_lbl = tk.Label(self.band, text="—", bg=BTN2,
                                   font=("Segoe UI", 36, "bold"), fg=BORDER)
        self.action_lbl.pack(pady=(2, 0))

        tk.Frame(parent, bg=BORDER, height=1).pack(fill="x")

        # reasoning
        det = tk.Frame(parent, bg=SURF, padx=16, pady=10)
        det.pack(fill="x")

        self.hand_lbl = tk.Label(det, text="Ingresa tus 2 cartas", bg=SURF,
                                 font=("Segoe UI", 10, "bold"), fg=DIM,
                                 wraplength=200, justify="center")
        self.hand_lbl.pack()

        self.reason_lbl = tk.Label(det, text="", bg=SURF,
                                   font=("Segoe UI", 9), fg=DIM,
                                   wraplength=200, justify="center")
        self.reason_lbl.pack(pady=(6, 0))

        tk.Frame(parent, bg=BORDER, height=1).pack(fill="x")

        # equity
        eq = tk.Frame(parent, bg=SURF, padx=16, pady=10)
        eq.pack(fill="x")

        self.equity_lbl = tk.Label(eq, text="", bg=SURF,
                                   font=("Segoe UI", 10, "bold"), fg=PURPLE)
        self.equity_lbl.pack()

        self.eq_bar = tk.Canvas(eq, height=4, width=200,
                                bg=BTN2, highlightthickness=0)
        self.eq_bar.pack(pady=(5, 0))

    def _eq_draw(self, pct):
        self.eq_bar.delete("all")
        if pct is not None:
            c = SUCCESS if pct >= 0.55 else (WARNING if pct >= 0.40 else DANGER)
            self.eq_bar.create_rectangle(0, 0, int(200 * pct), 4, fill=c, outline="")

    # ── Suits + controls (bottom bar) ────────────────────────────────────────

    def _build_suits(self, parent):
        for suit in SUITS:
            b = tk.Button(parent, text=suit, width=3,
                          font=("Segoe UI", 20),
                          bg=SURF, fg=DIM,
                          activebackground=BTN2, activeforeground=SUIT_CLR[suit],
                          relief="flat", bd=0, cursor="hand2",
                          state="disabled",
                          command=lambda s=suit: self._pick_suit(s))
            b.pack(side="left", padx=3, ipady=5)
            self.suit_btns[suit] = b

    def _build_controls(self, parent):
        tk.Frame(parent, bg=BG, width=16).pack(side="left")
        tk.Button(parent, text="← Borrar",
                  font=("Segoe UI", 9, "bold"),
                  bg=BTN, fg=TEXT, activebackground=BTN2,
                  relief="flat", bd=0, padx=12, pady=7, cursor="hand2",
                  command=self._undo).pack(side="left", padx=(0, 6))
        tk.Button(parent, text="Limpiar",
                  font=("Segoe UI", 9, "bold"),
                  bg="#2a0f0f", fg=DANGER, activebackground="#3a1515",
                  relief="flat", bd=0, padx=12, pady=7, cursor="hand2",
                  command=self._reset).pack(side="left")

    # ── Input logic ──────────────────────────────────────────────────────────

    def _rank_fg(self, label):
        return WARNING if RANK_CODE.get(label, label) in "AKQJ" else TEXT

    def _pick_rank(self, label):
        if self.cursor >= 7:
            return
        for lbl, b in self.rank_btns.items():
            b.config(bg=BTN, fg=self._rank_fg(lbl))
        self.pending       = RANK_CODE.get(label, label)
        self.pending_label = label
        self.rank_btns[label].config(bg=ACCENT, fg="white")
        for s in SUITS:
            self.suit_btns[s].config(state="normal", fg=SUIT_CLR[s], bg=BTN)

    def _pick_suit(self, suit):
        if self.pending is None or self.cursor >= 7:
            return
        idx = self.cursor
        self.cards[idx] = self.pending + SUIT_CODE[suit]
        self.slot_btns[idx].config(text=self.pending_label + suit,
                                   fg=SUIT_CLR[suit], bg=SURF)
        self.pending = self.pending_label = None
        for lbl, b in self.rank_btns.items():
            b.config(bg=BTN, fg=self._rank_fg(lbl))
        for b in self.suit_btns.values():
            b.config(state="disabled", fg=DIM, bg=SURF)
        self.cursor = idx + 1
        while self.cursor < 7 and self.cards[self.cursor] is not None:
            self.cursor += 1
        self._highlight_cursor()
        self._maybe_analyze()

    def _clear_slot(self, idx):
        if self.cards[idx] is None:
            return
        self.cards[idx] = None
        self.slot_btns[idx].config(text="?", fg=DIM, bg=BTN)
        self.cursor = idx
        self._highlight_cursor()
        self._maybe_analyze()

    def _highlight_cursor(self):
        for i, b in enumerate(self.slot_btns):
            if self.cards[i] is not None:
                continue
            b.config(bg=ACCENT if i == self.cursor else BTN)

    def _undo(self):
        if self.pending:
            self.pending = self.pending_label = None
            for lbl, b in self.rank_btns.items():
                b.config(bg=BTN, fg=self._rank_fg(lbl))
            for b in self.suit_btns.values():
                b.config(state="disabled", fg=DIM, bg=SURF)
            return
        for i in range(6, -1, -1):
            if self.cards[i] is not None:
                self._clear_slot(i)
                return

    def _reset(self):
        self.cards = [None] * 7
        self.pending = self.pending_label = None
        self.cursor  = 0
        for b in self.slot_btns:
            b.config(text="?", fg=DIM, bg=BTN)
        for lbl, b in self.rank_btns.items():
            b.config(bg=BTN, fg=self._rank_fg(lbl))
        for b in self.suit_btns.values():
            b.config(state="disabled", fg=DIM, bg=SURF)
        self._idle("Ingresa tus 2 cartas")
        self._highlight_cursor()

    # ── Analysis ─────────────────────────────────────────────────────────────

    def _idle(self, msg):
        self.band.config(bg=BTN2)
        self.action_lbl.config(text="—", fg=BORDER, bg=BTN2)
        self.street_lbl.config(text="", bg=BTN2)
        self.hand_lbl.config(text=msg, fg=DIM)
        self.reason_lbl.config(text="")
        self.equity_lbl.config(text="")
        self._eq_draw(None)

    def _maybe_analyze(self):
        hole  = [c for c in self.cards[:2] if c]
        board = [c for c in self.cards[2:] if c]

        if len(hole) < 2:
            self._idle("Ingresa tus 2 cartas")
            return
        if len(board) in (1, 2):
            self._idle(f"Completa el flop ({len(board)}/3)")
            return

        try:
            result = eval_hand(hole, board)
            action = result["action"]
            bg     = ACT_BG.get(action, BTN2)
            street = {"preflop": "PRE-FLOP", "flop": "FLOP",
                      "turn": "TURN", "river": "RIVER"}.get(result["street"], "")

            self.band.config(bg=bg)
            self.action_lbl.config(text=action, fg=ACT_CLR.get(action, TEXT), bg=bg)
            self.street_lbl.config(text=street, bg=bg, fg=DIM)

            hand = result["hand"]
            self.hand_lbl.config(
                text=hand if hand not in ("—", "-") else "",
                fg=TEXT)
            self.reason_lbl.config(text=result["reasoning"])

            if len(board) >= 3:
                eq = simulate_equity(hole, board, simulations=2000)
                self.equity_lbl.config(text=f"Equity  {eq*100:.0f}%")
                self._eq_draw(eq)
            else:
                self.equity_lbl.config(text="")
                self._eq_draw(None)

        except Exception as e:
            msg = str(e)
            if not msg or msg.isdigit() or len(msg) < 6:
                msg = "Carta repetida"
            self._idle(msg)
            self.hand_lbl.config(fg=DANGER)


if __name__ == "__main__":
    root = tk.Tk()
    App(root)
    root.mainloop()
