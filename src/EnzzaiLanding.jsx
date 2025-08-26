import React, { useEffect, useMemo, useState, useRef } from "react";
import { Play, Hash, Clock, CheckCircle2, Rocket, Copy, ExternalLink } from "lucide-react";

/* === Настройки проекта (можно менять отсюда) === */
const SETTINGS = {
    heroImage: "/hero.jpg",
    heroZoom: 80,                 // насколько крупно показывать картинку на фоне
    heroPosition: "10% center",   // куда смещён фокус
    twitchUrl: "https://www.twitch.tv/enzzai",
    telegramUrl: "https://t.me/enzzai",
    stickers: [                   // расположение стикеров 7TV на главной
        { id: "01G3WRY4S8000AVHF824CCM7CX", top: "55%", left: "3%", w: 120, float: 10 },
        { id: "01G06ZCDB80002CSRM1J6EVQ0R", top: "12%", left: "45%", w: 138, float: 12, flip: true },
        { id: "01F6NPEJT0000B70V1XA8MNBC9", top: "60%", left: "55%", w: 96, float: 9 },
        { id: "01H07F15D00002ETD2HQRT8J3Z", top: "10%", left: "85%", w: 128, float: 13 },
        { id: "01F6ME9FRG0005TFYTWP1H8R42", top: "1%", left: "60%", w: 100, float: 11 },
        { id: "01GHQENYF00009Z46GDGJ19FCQ", top: "50%", left: "76%", w: 92, float: 10 },
    ],
};

/* === Логика выплат каждые 10 дней (от 22.04.2025) === */
const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
const firstPayout = new Date(2025, 3, 22);

function nextPayoutDate(from = new Date()) {
    const diff = Math.max(0, from - firstPayout);
    const steps = Math.ceil((diff + 1) / tenDaysMs);
    const date = new Date(firstPayout.getTime() + steps * tenDaysMs);
    return date < from ? new Date(date.getTime() + tenDaysMs) : date;
}

/* таймер обратного отсчёта */
function useCountdown(target) {
    const [ms, setMs] = useState(() => Math.max(0, target - new Date()));
    useEffect(() => {
        const id = setInterval(() => setMs(Math.max(0, target - new Date())), 1000);
        return () => clearInterval(id);
    }, [target]);
    const s = Math.floor(ms / 1000);
    return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

/* === UI базовые блоки === */
const Container = ({ className = "", children }) => (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
);

const Card = ({ className = "", children }) => (
    <div className={`rounded-2xl bg-white/5 p-6 shadow-xl ring-1 ring-white/10 ${className}`}>{children}</div>
);

const SectionTitle = ({ eyebrow, title, desc }) => (
    <div className="mb-8 text-center">
        {eyebrow && <p className="mb-2 text-sm uppercase tracking-widest text-white/60">{eyebrow}</p>}
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl md:text-5xl">{title}</h2>
        {desc && <p className="mx-auto mt-3 max-w-2xl text-white/70">{desc}</p>}
    </div>
);

/* кнопки с эффектами */
const ShinyButton = ({ className = "", children, ...props }) => (
    <button {...props}
        className={`cursor-hover relative group overflow-hidden rounded-2xl px-6 py-3 font-semibold
    bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg hover:shadow-xl transition-transform hover:scale-[1.02] ${className}`}>
        <span className="relative z-10">{children}</span>
        {/* проблеск света при наведении */}
        <span className="pointer-events-none absolute inset-0">
            <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/40 blur-md opacity-0 group-hover:opacity-100 animate-[shine_1.2s_ease-in-out]" />
        </span>
    </button>
);

const GlassButton = ({ className = "", children, ...props }) => (
    <button {...props} className={`cursor-hover inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-medium hover:bg-white/20 transition ${className}`}>{children}</button>
);

/* === Стикеры 7TV на фоне === */
const stickerUrl = (id, scale = 3, ext = "webp") =>
    `https://cdn.7tv.app/emote/${id}/${Math.min(4, Math.max(1, scale))}x.${ext}`;

const toAxis = (v, axis) => (typeof v === "string" && v.endsWith("%") ? `${v.slice(0, -1)}${axis === "y" ? "vh" : "vw"}` : typeof v === "number" ? `${v}px` : v);

function StickerLayer({ items = [], z = 18 }) {
    const scale = typeof window !== "undefined" && window.devicePixelRatio >= 2 ? 3 : 2;
    return (
        <div className="pointer-events-none sticky top-0 left-0 w-screen" style={{ zIndex: z }}>
            <div className="relative h-full">
                {items.map((it, i) => {
                    const dur = (it.float ?? 10) + i * 0.12;
                    const style = {
                        position: "absolute",
                        top: toAxis(it.top, "y"),
                        left: toAxis(it.left, "x"),
                        width: it.w ? `${it.w}px` : "72px",
                        transform: `${it.flip ? "scaleX(-1) " : ""}translateZ(0)`,
                        animation: `floatY ${dur}s ease-in-out infinite`,
                        filter: "drop-shadow(0 10px 20px rgba(0,0,0,.35))",
                    };
                    return (
                        <img
                            key={`${it.id}-${i}`}
                            src={stickerUrl(it.id, scale, "webp")}
                            alt=""
                            loading="lazy"
                            style={style}
                            onError={(e) => (e.currentTarget.src = stickerUrl(it.id, scale, "gif"))}
                        />
                    );
                })}
            </div>
        </div>
    );
}

/* === Конфетти при клике === */
function burstConfetti(x = innerWidth / 2, y = innerHeight / 2) {
    const colors = ["#a78bfa", "#f0abfc", "#c4b5fd", "#f472b6", "#60a5fa"];
    for (let i = 0; i < 26; i++) {
        const el = document.createElement("span");
        el.className = "confetti";
        el.style.background = colors[i % colors.length];
        el.style.left = x + "px";
        el.style.top = y + "px";
        document.body.appendChild(el);

        // случайные траектории
        const dx = (Math.random() - 0.5) * 360;
        const dy = (Math.random() - 0.9) * 460;
        const rotate = (Math.random() - 0.5) * 180;

        el.animate(
            [{ transform: "translate(0,0) rotate(0deg)", opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`, opacity: 0 }],
            { duration: 1200 + Math.random() * 600, easing: "cubic-bezier(.2,.6,.2,1)" }
        ).onfinish = () => el.remove();
    }
}

/* === Кастомный курсор === */
function Cursor() {
    const [pos, setPos] = useState({ x: -100, y: -100 });
    const [hover, setHover] = useState(false);
    const [down, setDown] = useState(false);

    useEffect(() => {
        const mv = (e) => setPos({ x: e.clientX, y: e.clientY });
        const md = () => setDown(true);
        const mu = () => setDown(false);
        const mo = (e) => setHover(!!e.target.closest("a,button,[role='button'],.cursor-hover"));
        window.addEventListener("pointermove", mv);
        window.addEventListener("pointerdown", md);
        window.addEventListener("pointerup", mu);
        window.addEventListener("mouseover", mo);
        return () => {
            window.removeEventListener("pointermove", mv);
            window.removeEventListener("pointerdown", md);
            window.removeEventListener("pointerup", mu);
            window.removeEventListener("mouseover", mo);
        };
    }, []);

    const style = { left: pos.x, top: pos.y, transform: "translate(-50%,-50%)" };
    return (
        <div className="pointer-events-none fixed inset-0 z-[90] hidden md:block">
            <div className="cursor-spotlight" style={style} />
            <div className="cursor-ring" style={{ ...style, transform: `translate(-50%,-50%) scale(${hover ? 1.4 : 1})`, opacity: 0.95 }} />
            <div className="cursor-dot" style={{ ...style, transform: `translate(-50%,-50%) scale(${down ? 0.7 : 1})` }} />
        </div>
    );
}

/* === Фон с падающими треугольниками === */
function DynamicBackground() {
    const ref = useRef(null);
    const mouse = useRef({ x: 0.5, y: 0.5 });

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        // параметры анимации
        const COUNT = 110;
        const SIZE_MIN = 10, SIZE_MAX = 22;
        const SPEED_MIN = 35, SPEED_MAX = 85;
        const COLORS = ["#8B5CF6", "#A78BFA", "#60A5FA", "#F0ABFC", "#F472B6"];

        let w = 0, h = 0, raf = 0, last = 0;

        const resize = () => {
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            w = window.innerWidth; h = window.innerHeight;
            canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
            canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();

        const onMove = (e) => {
            mouse.current.x = e.clientX / w;
            mouse.current.y = e.clientY / h;
        };
        window.addEventListener("resize", resize);
        window.addEventListener("pointermove", onMove, { passive: true });

        const rnd = (a, b) => a + Math.random() * (b - a);
        const pick = (arr) => arr[(Math.random() * arr.length) | 0];

        // массив треугольников
        const tris = Array.from({ length: COUNT }, () => ({
            x: Math.random() * w, y: Math.random() * h,
            s: rnd(SIZE_MIN, SIZE_MAX), sp: rnd(SPEED_MIN, SPEED_MAX),
            rot: Math.random() * Math.PI * 2, rs: rnd(-1, 1) * 0.7,
            col: pick(COLORS), phase: Math.random() * Math.PI * 2,
        }));

        const drawTri = (s) => {
            ctx.beginPath();
            ctx.moveTo(0, -0.62 * s);
            ctx.lineTo(0.54 * s, 0.31 * s);
            ctx.lineTo(-0.54 * s, 0.31 * s);
            ctx.closePath();
            ctx.fill();
        };

        const loop = (now) => {
            const dt = Math.min(0.05, (now - last) * 0.001 || 0.016); last = now;
            ctx.clearRect(0, 0, w, h);
            for (const p of tris) {
                p.y += p.sp * dt; p.rot += p.rs * dt;
                if (p.y - p.s > h) { p.y = -p.s - 2; p.x = Math.random() * w; p.sp = rnd(SPEED_MIN, SPEED_MAX); p.s = rnd(SIZE_MIN, SIZE_MAX); }
                const ox = (mouse.current.x - 0.5) * 18;
                const oy = (mouse.current.y - 0.5) * 12;
                ctx.save(); ctx.translate(p.x + ox, p.y + oy); ctx.rotate(p.rot);
                ctx.fillStyle = p.col; ctx.globalAlpha = 0.14;
                ctx.shadowColor = p.col; ctx.shadowBlur = 6;
                drawTri(p.s); ctx.restore();
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove); };
    }, []);

    return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ background: "transparent", zIndex: 5 }} />;
}

/* === Главная страница === */
export default function EnzzaiLanding() {
    const nextPayout = useMemo(() => nextPayoutDate(), []);
    const { days, hours, minutes, seconds } = useCountdown(nextPayout);
    const [tab, setTab] = useState("how"); // активная вкладка (how | rewards | rules)

    return (
        <div className="relative w-screen min-h-screen overflow-x-hidden body-font bg-[#0b0f17] text-white">
            {/* фон-анимация на канвасе, лежит под всем контентом */}
            <DynamicBackground />

            {/* ===== HERO (верхняя шапка) ===== */}
            <header className="relative h-[78vh] overflow-hidden">
                {/* фон с картинкой. размер/позиция берутся из SETTINGS */}
                <div
                    className="pointer-events-none absolute top-0 left-0 h-full w-screen bg-no-repeat"
                    style={{
                        backgroundImage: `url('${SETTINGS.heroImage}')`,
                        backgroundPosition: SETTINGS.heroPosition,
                        backgroundSize: `auto ${SETTINGS.heroZoom}%`,
                    }}
                />

                {/* лёгкие цветные «пятна», чисто для глубины */}
                <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
                <div className="absolute left-40 top-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

                {/* затемнение вниз, чтобы текст читался */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/45" />

                {/* слой со стикерами 7TV. липнут к верхнему краю в пределах хедера */}
                <StickerLayer items={SETTINGS.stickers} z={18} />

                {/* контейнер с навигацией и правым контентом */}
                <Container className="relative z-20 pt-8 pb-20">
                    {/* верхняя строка: лого + ссылки */}
                    <div className="mb-8 flex items-center justify-between">
                        <a href="#top" className="flex items-center gap-3 cursor-hover">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-black font-black">E</div>
                            <span className="text-lg font-semibold tracking-wide">ENZZAI</span>
                        </a>
                        <div className="flex items-center gap-3">
                            <a
                                href={SETTINGS.twitchUrl}
                                target="_blank" rel="noreferrer"
                                className="cursor-hover rounded-xl bg-violet-600/90 px-4 py-2 text-sm font-semibold hover:bg-violet-500"
                            >
                                Twitch
                            </a>
                            <a
                                href={SETTINGS.telegramUrl}
                                target="_blank" rel="noreferrer"
                                className="cursor-hover rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
                            >
                                Telegram
                            </a>
                        </div>
                    </div>

                    {/* основной блок героя: текст справа (на больших экранах) */}
                    <div className="grid items-center gap-27 md:grid-cols-12">
                        <div className="md:col-span-5 md:col-start-8 md:max-w-none md:ml-0 md:pr-2 lg:pr-6">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur">
                                <Rocket className="h-4 w-4" /> Челлендж для зрителей
                            </span>

                            <h1 className="font-display mt-3 text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
                                Заработай на видео{" "}
                                <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                                    с Энзаем
                                </span>
                            </h1>

                            <p className="mt-3 text-white/85">
                                Снимай и выкладывай в TikTok, YouTube Shorts или Reels. Добавь{" "}
                                <span className="font-semibold">#enzzai</span> и ссылку на Twitch — получай 💸 за просмотры.
                            </p>

                            {/* CTA кнопки */}
                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <ShinyButton onClick={() => setTab("how")}>Как участвовать</ShinyButton>

                                {/* Копирую шаблон и стреляю конфетти для фидбэка */}
                                <GlassButton
                                    onClick={async (e) => {
                                        try {
                                            await navigator.clipboard.writeText("twitch: enzzai #enzzai");
                                            burstConfetti(e.clientX, e.clientY);
                                        } catch {
                                            // ничего страшного, если clipboard не доступен
                                        }
                                    }}
                                >
                                    <Copy className="h-5 w-5" /> Копировать шаблон
                                </GlassButton>
                            </div>

                            {/* таймер до следующей выплаты */}
                            <div className="mt-6 flex items-center gap-3 text-white/80">
                                <Clock className="h-5 w-5" />
                                <span className="text-sm">Следующая выплата через</span>
                                <span className="rounded-xl bg-white/10 px-3 py-1 text-sm font-semibold">
                                    {days}д {hours}ч {minutes}м {seconds}с
                                </span>
                            </div>
                        </div>
                    </div>
                </Container>
            </header>

            {/* ===== ВКЛАДКИ с инфой ===== */}
            <section id="info" className="py-10">
                <Container>
                    {/* переключалка вкладок. простая, без router */}
                    <div className="mx-auto mb-6 flex w-full max-w-2xl items-center justify-center gap-2 rounded-2xl bg-white/5 p-2 ring-1 ring-white/10">
                        {[
                            { id: "how", label: "Как участвовать" },
                            { id: "rewards", label: "Выплаты" },
                            { id: "rules", label: "Правила" },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`cursor-hover w-full rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === t.id ? "bg-violet-600 text-white" : "bg-transparent text-white/80 hover:bg-white/10"
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* контент вкладок */}
                    {tab === "how" && (
                        <>
                            <SectionTitle
                                eyebrow="Инструкция"
                                title="Как участвовать"
                                desc="4 шага, чтобы начать зарабатывать."
                            />
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {[
                                    { t: "Сними видео", d: "Энзай — главное лицо в ролике." },
                                    { t: "Опубликуй", d: "TikTok / YouTube Shorts / Reels. Дата — с 22.04.2025." },
                                    { t: "Укажи теги", d: "Хештег #enzzai и ссылка на Twitch: enzzai." },
                                    { t: "Жди выплату", d: "Начисления каждые 10 дней. За 1 ролик — 1 раз." },
                                ].map((x, i) => (
                                    <Card key={i}>
                                        <h3 className="mb-2 text-lg font-bold">{x.t}</h3>
                                        <p className="text-white/80">{x.d}</p>
                                    </Card>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/80">
                                <Hash className="h-4 w-4" />
                                Пример описания:{" "}
                                <code className="rounded bg-white/10 px-2 py-1">twitch: enzzai #enzzai</code>
                            </div>
                        </>
                    )}

                    {tab === "rewards" && (
                        <>
                            <SectionTitle
                                eyebrow="Выплаты"
                                title="Сколько платим за просмотры"
                                desc="Просмотры не суммируются."
                            />
                            <div className="grid gap-6 sm:grid-cols-3 text-center">
                                {[
                                    { views: "100.000+", amount: "1.250💸" },
                                    { views: "500.000+", amount: "2.000💸", hi: true }, // средний подчёркиваю как «самый частый»
                                    { views: "1.000.000+", amount: "6.000💸" },
                                ].map((r, i) => (
                                    <Card key={i} className={r.hi ? "ring-2 ring-violet-500" : ""}>
                                        <div className="text-3xl font-extrabold">{r.views}</div>
                                        <div className="mt-1 text-white/80">просмотров</div>
                                        <div className="mt-6 text-4xl font-extrabold text-violet-300">{r.amount}</div>
                                    </Card>
                                ))}
                            </div>
                            <p className="mt-6 text-center text-sm text-white/60">
                                Оплата за 1 ролик — 1 раз. Выплаты каждые 10 дней.
                            </p>
                        </>
                    )}

                    {tab === "rules" && (
                        <>
                            <SectionTitle eyebrow="Важно" title="Правила участия" />
                            <div className="grid gap-6 md:grid-cols-2">
                                {[
                                    "Принимаются только видео, опубликованные с 22.04.2025.",
                                    "В видео Энзай обязан быть главным лицом (иначе отклонение).",
                                    "Обязательно: #enzzai и ссылка на Twitch в описании/на экране.",
                                    "Запрещено накручивать просмотры/лайки/комментарии.",
                                    "Модератор может запросить доказательства честности.",
                                    "За обман — отказ в выплате.",
                                ].map((rule, i) => (
                                    <Card key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-1 h-6 w-6 flex-shrink-0 text-violet-300" />
                                        <p className="leading-relaxed text-white/85">{rule}</p>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </Container>
            </section>

            {/* ===== Блок с клипами (для вдохновения) ===== */}
            <section id="clips" className="py-10">
                <Container>
                    <SectionTitle
                        eyebrow="Вдохновись"
                        title="Лучшие моменты"
                        desc="Посмотри клипы и придумай свой вирусный ролик."
                    />
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            { title: "Прямой эфир на Twitch", href: SETTINGS.twitchUrl, note: "Откроется канал Энзая" },
                            { title: "Клип #1", href: "https://www.twitch.tv/enzzai/clip/AbnegateSuccessfulSwanHoneyBadger-5PoZFNZySPpmXqxd?filter=clips&range=30d&sort=time", note: "2 пачки соли" },
                            { title: "Клип #2", href: "https://www.twitch.tv/enzzai/clip/SecretiveStormyAyeayeDxAbomb-ewXwn5UrhAsmFg5A?filter=clips&range=30d&sort=time", note: "в гонке enzzai @WHYLOLLYCRY" },
                        ].map((c, i) => (
                            <a
                                key={i}
                                href={c.href}
                                target="_blank" rel="noreferrer"
                                className="cursor-hover group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                            >
                                <div className="mb-3 flex items-center gap-2 text-sm text-white/70">
                                    <Play className="h-4 w-4" />
                                    <span>{c.note}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">{c.title}</h3>
                                    <ExternalLink className="h-5 w-5 opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                                </div>
                            </a>
                        ))}
                    </div>
                </Container>
            </section>

            {/* ===== Подвал ===== */}
            <footer className="border-t border-white/10 py-10 text-center text-sm text-white/60">
                <Container>
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p>© {new Date().getFullYear()} ENZZAI. Сообщество зрителей.</p>
                        <div className="flex items-center gap-3">
                            <a href={SETTINGS.twitchUrl} target="_blank" rel="noreferrer" className="cursor-hover rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20">Twitch</a>
                            <a href={SETTINGS.telegramUrl} target="_blank" rel="noreferrer" className="cursor-hover rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20">Telegram</a>
                        </div>
                    </div>
                </Container>
            </footer>

            {/* курсор — держу в самом конце, чтобы точно перекрывал всё */}
            <Cursor />
        </div>
    );
}

