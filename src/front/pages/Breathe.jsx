// Respira: respiración guiada y registro de emociones.
import { useEffect, useRef, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import useGlobalReducer from "../hooks/useGlobalReducer";
import useActions from "../hooks/useActions";
import { Glass, PageHead, Slider, ChartTip, AXIS, GRID, cx } from "../components/ui";
import { todayStr, lastDays, shortDay } from "../lib/game";
import { play } from "../lib/fx";

const PATTERNS = [
	{ id: "caja", name: "Caja", desc: "Para enfocarte antes de trabajar", steps: [["Inhala", 4], ["Sostén", 4], ["Exhala", 4], ["Sostén", 4]] },
	{ id: "calma", name: "4-7-8", desc: "Para bajar revoluciones o dormir", steps: [["Inhala", 4], ["Sostén", 7], ["Exhala", 8]] },
	{ id: "coherencia", name: "Coherencia", desc: "Para equilibrar a mitad del día", steps: [["Inhala", 5], ["Exhala", 5]] },
];
const MOODS = ["😣", "😕", "😐", "🙂", "🤩"];
const EMOTIONS = ["Tranquilo", "Motivado", "Agradecido", "Orgulloso", "Cansado", "Ansioso", "Disperso", "Frustrado", "Nostálgico", "Ilusionado"];

export const Breathe = () => {
	const { store } = useGlobalReducer();
	const act = useActions();
	const today = todayStr();
	const log = store.dailyLogs.find((d) => d.day === today) || {};
	const [pattern, setPattern] = useState(PATTERNS[0]);
	const [minutes, setMinutes] = useState(2);
	const [run, setRun] = useState(null); // { step, left (s en el paso), total (s restantes) }
	const started = useRef(0);

	useEffect(() => {
		if (!run) return;
		const id = setTimeout(() => {
			if (run.total <= 1) { // terminó
				act.logFocus({ kind: "breath", minutes, label: "Respiración " + pattern.name });
				play("bell"); setRun(null); return;
			}
			if (run.left <= 1) {
				const step = (run.step + 1) % pattern.steps.length;
				play("tick");
				setRun({ step, left: pattern.steps[step][1], total: run.total - 1 });
			} else setRun({ ...run, left: run.left - 1, total: run.total - 1 });
		}, 1000);
		return () => clearTimeout(id);
	}, [run]); // eslint-disable-line

	const start = () => { started.current = Date.now(); play("tick"); setRun({ step: 0, left: pattern.steps[0][1], total: minutes * 60 }); };
	const [label, secs] = run ? pattern.steps[run.step] : ["Listo", 4];
	const scale = !run ? 0.72 : label === "Inhala" ? 1 : label === "Exhala" ? 0.6 : null; // null = mantener

	const byDay = Object.fromEntries(store.dailyLogs.map((d) => [d.day, d]));
	const data = lastDays(14).map((d) => ({ d: shortDay(d), Ánimo: byDay[d]?.mood ?? null, Energía: byDay[d]?.energy ?? null }));

	return (
		<>
			<PageHead title="Un minuto para volver a ti" sub="Como en tu reloj: respira con el círculo. Después cuéntale a tu bitácora cómo estás." />
			<div className="grid g2">
				<Glass className="pad breathe">
					<div className={cx("orb-wrap", run && "on")}>
						<div className="orb-ring" /><div className="orb-ring r2" />
						<div className="orb" style={{ ...(scale !== null ? { transform: `scale(${scale})` } : {}), transitionDuration: (run ? secs : 0.6) + "s" }}>
							<b>{label}</b>
							{run && <span className="num">{run.left}</span>}
						</div>
					</div>
					{run ? (
						<>
							<p className="muted num">Quedan {Math.floor(run.total / 60)}:{String(run.total % 60).padStart(2, "0")}</p>
							<button className="btn" onClick={() => setRun(null)}>Detener</button>
						</>
					) : (
						<>
							<div className="zones">
								{PATTERNS.map((p) => (
									<button key={p.id} className={cx("zone", pattern.id === p.id && "on")} onClick={() => setPattern(p)}>
										<b>{p.name}</b><span className="num">{p.steps.map((s) => s[1]).join(" · ")}</span><small>{p.desc}</small>
									</button>
								))}
							</div>
							<div className="row center">
								{[1, 2, 3, 5].map((m) => <button key={m} className={cx("chip-btn", minutes === m && "on")} onClick={() => setMinutes(m)}>{m} min</button>)}
								<button className="btn primary" onClick={start}>Empezar</button>
							</div>
						</>
					)}
				</Glass>

				<div className="col">
					<Glass className="pad">
						<h3>¿Cómo te sientes ahora?</h3>
						<div className="moods big">
							{MOODS.map((m, i) => <button key={i} className={cx("mood", log.mood === i + 1 && "on")} onClick={() => act.saveDaily(today, { mood: i + 1 })} aria-label={`Ánimo ${i + 1} de 5`}>{m}</button>)}
						</div>
						<Slider label="Energía" unit=" de 5" min="1" max="5" step="1" value={log.energy} fallback={3} onCommit={(v) => act.saveDaily(today, { energy: v })} />
						<span className="field-label">Ponle nombre</span>
						<div className="chips">
							{EMOTIONS.map((e) => <button key={e} className={cx("chip-btn", log.emotion === e && "on")} onClick={() => act.saveDaily(today, { emotion: log.emotion === e ? "" : e })}>{e}</button>)}
						</div>
					</Glass>
					<Glass className="pad chart-card">
						<h3>Ánimo y energía, 14 días</h3>
						<ResponsiveContainer width="100%" height={190}>
							<AreaChart data={data}>
								<defs><linearGradient id="gMood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E8B95B" stopOpacity=".45" /><stop offset="1" stopColor="#E8B95B" stopOpacity="0" /></linearGradient></defs>
								<CartesianGrid {...GRID} /><XAxis dataKey="d" {...AXIS} interval={2} /><YAxis {...AXIS} width={20} domain={[1, 5]} ticks={[1, 3, 5]} />
								<Tooltip content={<ChartTip fmt={(v) => v + " de 5"} />} />
								<Area dataKey="Ánimo" stroke="#E8B95B" strokeWidth={2} fill="url(#gMood)" connectNulls dot={{ r: 3, fill: "#E8B95B" }} />
								<Area dataKey="Energía" stroke="#7FC8C0" strokeWidth={2} fill="none" connectNulls dot={{ r: 2, fill: "#7FC8C0" }} />
							</AreaChart>
						</ResponsiveContainer>
					</Glass>
				</div>
			</div>
		</>
	);
};
