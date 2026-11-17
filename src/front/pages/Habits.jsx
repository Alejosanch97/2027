// Hábitos: rachas, escudos y el mapa de calor del año.
import { useMemo, useState } from "react";
import { Plus, Flame, Shield, Pencil } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import useActions from "../hooks/useActions";
import { Glass, PageHead, Modal, Form, Stat, cx } from "../components/ui";
import { todayStr, addDays, lastDays, weekStart, parseDay, habitCount, DOW, MON, shortDay } from "../lib/game";

const PERIOD = { day: "Cada día", week: "Por semana", month: "Por mes" };

export const Habits = () => {
	const { store } = useGlobalReducer();
	const act = useActions();
	const [modal, setModal] = useState(null);
	const today = todayStr();
	const habits = store.habits.filter((h) => h.active);
	const daily = habits.filter((h) => h.period === "day");
	const pillar = (id) => store.pillars.find((p) => p.id === id);
	const week = lastDays(7);
	const has = useMemo(() => { const set = new Set(store.habitLogs.map((l) => l.habit_id + "|" + l.day)); return (id, day) => set.has(id + "|" + day); }, [store.habitLogs]);
	const shielded = store.user.settings?.shielded_days || [];

	// Mapa de calor: 20 semanas, columnas de lunes a domingo
	const heat = useMemo(() => {
		const start = addDays(weekStart(today), -19 * 7), ids = new Set(daily.map((h) => h.id)), count = {};
		store.habitLogs.forEach((l) => { if (ids.has(l.habit_id)) count[l.day] = (count[l.day] || 0) + 1; });
		return Array.from({ length: 20 }, (_, w) => Array.from({ length: 7 }, (_, d) => {
			const day = addDays(start, w * 7 + d), n = count[day] || 0;
			return { day, n, lvl: day > today ? -1 : !daily.length || !n ? 0 : Math.ceil((n / daily.length) * 4), shield: shielded.includes(day) };
		}));
	}, [store.habitLogs, daily.length, today]); // eslint-disable-line

	const yesterday = addDays(today, -1);
	const yDone = daily.filter((h) => has(h.id, yesterday)).length;
	const canShield = store.user.shields > 0 && daily.length > 0 && yDone * 2 < daily.length && !shielded.includes(yesterday);
	const total30 = lastDays(30).reduce((a, d) => a + daily.filter((h) => has(h.id, d)).length, 0);
	const rate30 = daily.length ? Math.round((total30 / (daily.length * 30)) * 100) : 0;

	const fields = [
		{ name: "name", label: "Hábito", required: true, placeholder: "Ej. Leer 20 minutos" },
		{ name: "emoji", label: "Emoji" },
		{ name: "pillar_id", label: "Pilar", type: "select", options: store.pillars.map((p) => [p.id, `${p.emoji} ${p.name}`]) },
		{ name: "period", label: "Frecuencia", type: "select", options: Object.entries(PERIOD) },
		{ name: "target", label: "Veces por periodo", type: "number", min: 1 },
		{ name: "xp", label: "XP cada vez", type: "number", min: 1 },
	];

	const Row = ({ h }) => {
		const p = pillar(h.pillar_id), n = habitCount(h, store.habitLogs, today);
		return (
			<li className="habit-row" style={{ "--c": p?.color }}>
				<span className="item-emoji">{h.emoji}</span>
				<div className="grow habit-name">
					<b>{h.name}</b>
					<small className="muted">{h.period === "day" ? p?.short : `${n} de ${h.target} ${h.period === "week" ? "esta semana" : "este mes"}`} · +{h.xp} XP</small>
				</div>
				<div className="week-dots">
					{week.map((d) => (
						<button key={d} className={cx("dot", has(h.id, d) && "on", d === today && "today")} onClick={() => act.toggleHabit(h.id, d)}
							aria-label={`${h.name}, ${shortDay(d)}`} aria-pressed={has(h.id, d)} title={shortDay(d)}>
							<span>{DOW[parseDay(d).getDay()]}</span>
						</button>
					))}
				</div>
				<button className="btn icon ghost" onClick={() => setModal(h)} aria-label="Editar hábito"><Pencil size={14} /></button>
			</li>
		);
	};

	return (
		<>
			<PageHead title="Lo que haces cada día" sub="Un día cuenta para la racha cuando cumples al menos la mitad de tus hábitos diarios. Toca cualquier día de la semana para marcarlo.">
				<button className="btn primary" onClick={() => setModal({})}><Plus size={16} /> Nuevo hábito</button>
			</PageHead>

			<div className="grid g4 stats-row">
				<Glass className="pad streak-card">
					<Flame size={30} className={cx("flame", store.streak > 0 && "lit")} />
					<div><b className="num huge">{store.streak}</b><span className="muted">días de racha</span></div>
				</Glass>
				<Glass className="pad">
					<Stat label="Escudos de descanso" value={<><Shield size={20} color="var(--ice)" /> {store.user.shields}</>} sub="Ganas uno cada 7 días de racha" />
					{canShield && <button className="btn sm" onClick={() => act.useShield(yesterday)}>Cubrir ayer con un escudo</button>}
				</Glass>
				<Glass className="pad"><Stat label="Cumplimiento, 30 días" value={rate30 + "%"} sub={`${total30} marcas en hábitos diarios`} /></Glass>
				<Glass className="pad"><Stat label="Día perfecto" value="+30 XP" sub="Cuando marcas todos los diarios" /></Glass>
			</div>

			<Glass className="pad">
				<div className="between"><h3>Tus últimas 20 semanas</h3>
					<div className="heat-legend"><small className="muted">menos</small>{[0, 1, 2, 3, 4].map((l) => <i key={l} className={"heat-cell l" + l} />)}<small className="muted">más</small></div>
				</div>
				<div className="heat-scroll">
					<div className="heat">
						{heat.map((col, w) => (
							<div key={w} className="heat-col">
								<small className="heat-month">{parseDay(col[0].day).getDate() <= 7 ? MON[parseDay(col[0].day).getMonth()] : ""}</small>
								{col.map((c) => <i key={c.day} className={cx("heat-cell", "l" + c.lvl, c.day === today && "today", c.shield && "shield")} title={`${shortDay(c.day)}: ${c.n} de ${daily.length}${c.shield ? " (escudo)" : ""}`} />)}
							</div>
						))}
					</div>
				</div>
			</Glass>

			<div className="grid g2">
				<Glass className="pad">
					<h3>Diarios</h3>
					<ul className="list">{daily.map((h) => <Row key={h.id} h={h} />)}</ul>
				</Glass>
				<Glass className="pad">
					<h3>Semanales y mensuales</h3>
					<ul className="list">{habits.filter((h) => h.period !== "day").map((h) => <Row key={h.id} h={h} />)}</ul>
				</Glass>
			</div>

			<Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Editar hábito" : "Nuevo hábito"}>
				{modal && <Form key={modal.id || "new"} fields={fields}
					initial={{ emoji: "✅", period: "day", target: 1, xp: 10, pillar_id: store.pillars[0]?.id, ...modal }}
					onSubmit={async (v) => { if (modal.id) await act.update("habits", modal.id, v); else await act.create("habits", { ...v, position: store.habits.length }); setModal(null); }}
					onDelete={modal.id ? async () => { await act.update("habits", modal.id, { active: false }); setModal(null); } : null} />}
			</Modal>
		</>
	);
};
