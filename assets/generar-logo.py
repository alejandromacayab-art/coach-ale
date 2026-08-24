from PIL import Image, ImageDraw, ImageFont
import math

BG    = (11, 21, 33)
WHITE = (255, 255, 255)
RED   = (212, 32, 39)
AVENIR = "/System/Library/Fonts/Avenir Next.ttc"

def build(S=2048, bg=BG, transparent=False, ink=None):
    """Dibuja el logo de Coach Ale. S = lado en píxeles."""
    global WHITE
    _w = WHITE
    if ink: WHITE = ink                       # versión para fondos claros
    im = Image.new("RGBA", (S, S), (0,0,0,0) if transparent else bg+(255,))
    d  = ImageDraw.Draw(im)
    u  = lambda v: v*S                       # normalizado -> píxeles
    def rr(x0,y0,x1,y1,r,fill):
        d.rounded_rectangle((u(x0),u(y0),u(x1),u(y1)), radius=u(r), fill=fill)

    # ---------- teléfono ----------
    pw = u(0.021)                                   # grosor del trazo
    d.rounded_rectangle((u(.376),u(.150),u(.624),u(.585)), radius=u(.048),
                        outline=WHITE, width=int(pw))
    # muesca superior
    rr(.462,.150,.538,.176,.013, WHITE)

    # ---------- wifi ----------
    cx, cy = .5, .333
    for rad, th in ((.036,.016),(.064,.017),(.092,.018)):
        d.arc((u(cx-rad),u(cy-rad),u(cx+rad),u(cy+rad)), 213, 327, fill=RED, width=int(u(th)))
    d.ellipse((u(cx-.013),u(cy-.013),u(cx+.013),u(cy+.013)), fill=RED)

    # ---------- barra ----------
    rr(.246,.368,.268,.402,.006, WHITE)            # tope exterior
    rr(.274,.332,.300,.438,.008, WHITE)            # manguito
    rr(.306,.305,.336,.465,.008, RED)              # disco 1
    rr(.342,.305,.372,.465,.008, RED)              # disco 2
    rr(.628,.305,.658,.465,.008, RED)
    rr(.664,.305,.694,.465,.008, RED)
    rr(.700,.332,.726,.438,.008, WHITE)
    rr(.732,.368,.754,.402,.006, WHITE)
    rr(.360,.373,.640,.397,.004, WHITE)            # barra central

    # ---------- "A" triangular ----------
    ax, ay0, ay1, hw = .5, .348, .516, .102
    th = .027
    d.polygon([(u(ax),u(ay0)), (u(ax+hw),u(ay1)), (u(ax-hw),u(ay1))], fill=WHITE)
    ihw, ib = hw-th*1.65, ay1-th
    iy0 = ay0 + th*1.40
    hole = bg+(255,) if not transparent else (0,0,0,0)
    d.polygon([(u(ax),u(iy0)), (u(ax+ihw),u(ib)), (u(ax-ihw),u(ib))], fill=hole)
    rr(ax+.002, ib-.056, ax+ihw-.002, ib-.030, .003, WHITE)   # travesaño de la A

    # ---------- textos ----------
    f_coach = ImageFont.truetype(AVENIR, int(u(.058)), index=5)   # Medium
    f_ale   = ImageFont.truetype(AVENIR, int(u(.150)), index=8)   # Heavy

    def tracked(text, font, y, tracking, fill=WHITE):
        widths = [d.textlength(c, font=font) for c in text]
        total  = sum(widths) + tracking*(len(text)-1)
        x = u(.5) - total/2
        for c, w in zip(text, widths):
            d.text((x, y), c, font=font, fill=fill)
            x += w + tracking
        return total

    total = tracked("COACH", f_coach, u(.628), u(.038))
    dy = u(.628) + u(.030)
    gap = u(.030)
    rr((u(.5)-total/2-gap-u(.115))/S, (dy-u(.004))/S,
       (u(.5)-total/2-gap)/S,        (dy+u(.004))/S, .002, RED)
    rr((u(.5)+total/2+gap)/S,        (dy-u(.004))/S,
       (u(.5)+total/2+gap+u(.115))/S,(dy+u(.004))/S, .002, RED)

    w_ale = d.textlength("ALE", font=f_ale)
    d.text((u(.5)-w_ale/2, u(.735)), "ALE", font=f_ale, fill=WHITE)
    WHITE = _w
    return im

SYMBOL_BOX = (.230, .132, .770, .603)         # recorte del símbolo, sin los textos

def symbol(S=2048, transparent=True, ink=None):
    """Solo el símbolo: barra + teléfono + wifi + A."""
    full = build(2048, transparent=transparent, ink=ink)
    b = SYMBOL_BOX
    return full.crop((int(b[0]*2048), int(b[1]*2048), int(b[2]*2048), int(b[3]*2048)))

def app_icon(size, frac=.80, bg=BG):
    sym = symbol(transparent=True)
    c = Image.new("RGBA",(size,size), bg+(255,))
    w = int(size*frac); h = max(1,round(w*sym.size[1]/sym.size[0]))
    m = sym.resize((w,h), Image.LANCZOS)
    c.paste(m, ((size-w)//2,(size-h)//2), m)
    return c.convert("RGB")

NAVY = (28, 39, 51)          # Deep Navy de la marca, para fondos claros

if __name__ == "__main__":
    import os
    os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")
    # logotipo completo
    build(2048, transparent=True).resize((1024,1024), Image.LANCZOS).save("assets/logo-dark.png")
    build(2048, transparent=True, ink=NAVY).resize((1024,1024), Image.LANCZOS).save("assets/logo-light.png")
    # símbolo suelto (cabecera)
    for name, ink in (("assets/symbol-dark.png", None), ("assets/symbol-light.png", NAVY)):
        sy = symbol(transparent=True, ink=ink)
        w,h = sy.size
        sy.resize((512, round(512*h/w)), Image.LANCZOS).save(name)
    # iconos de la app
    app_icon(512).save("icons/icon-512.png")
    app_icon(192).save("icons/icon-192.png")
    app_icon(180).save("icons/apple-touch-icon.png")
    app_icon(512, frac=.60).save("icons/maskable-512.png")
    print("logotipo, símbolo e iconos regenerados")
