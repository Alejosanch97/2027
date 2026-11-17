import { useState } from "react";
import { LogOut } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import useActions from "../hooks/useActions";
import { Glass, PageHead, Form, Field, cx } from "../components/ui";
import { soundOn, setSound } from "../lib/fx";

const SKIES = [["auto", "Según la hora"], ["dawn", "Amanecer"], ["day", "Día"], ["dusk", "Atardecer"], ["night", "Noche"]];

export const Profile = () => {
	const { store } = useGlobalReducer();
	const act = useActions();
	const [sound, setS] = useState(soundOn());
	const s = store.user.settings || {};

	return (
		<>
			<PageHead title="Tu cuenta" sub={"Sesión iniciada como @" + store.user.username}>
				<button className="btn danger ghost" onClick={act.logout}><LogOut size={15} /> Cerrar sesión</button>
			</PageHead>
			<div className="grid g2">
				<Glass className="pad">
					<h3>Cómo te ve la plataforma</h3>
					<Form fields={[
						{ name: "display_name", label: "Nombre", required: true },
						{ name: "motto", label: "Tu lema para 2027", type: "textarea", rows: 2 },
						{ name: "email", label: "Correo (opcional)", type: "email" },
						{ name: "water_goal", label: "Meta diaria de agua en ml", type: "number", min: 500, step: 50 },
					]} initial={{ display_name: store.user.display_name, motto: store.user.motto, email: store.user.email || "", water_goal: s.water_goal || 2500 }}
						onSubmit={async (v) => { const r = await act.saveProfile({ ...v, settings: { water_goal: +v.water_goal || 2500 } }); if (r) act.toast({ tone: "good", title: "Perfil guardado" }); }} />
				</Glass>

				<div className="col">
					<Glass className="pad">
						<h3>Ambiente</h3>
						<span className="field-label">Cielo de fondo</span>
						<div className="chips">
							{SKIES.map(([id, label]) => <button key={id} className={cx("chip-btn", (s.sky || "auto") === id && "on")} onClick={() => act.saveProfile({ settings: { sky: id } })}>{label}</button>)}
						</div>
						<Field label="Sonidos al ganar XP">
							<div className="chips">
								<button className={cx("chip-btn", sound && "on")} onClick={() => { setSound(true); setS(true); }}>Encendidos</button>
								<button className={cx("chip-btn", !sound && "on")} onClick={() => { setSound(false); setS(false); }}>Apagados</button>
							</div>
						</Field>
					</Glass>
					<Glass className="pad">
						<h3>Cambiar la clave</h3>
						<p className="muted">Se guarda cifrada con hash. Usa 6 caracteres o más.</p>
						<Form fields={[
							{ name: "current", label: "Clave actual", type: "password", required: true },
							{ name: "next", label: "Clave nueva", type: "password", required: true },
						]} submit="Actualizar clave" onSubmit={(v) => act.changePassword(v.current, v.next)} />
					</Glass>
				</div>
			</div>
		</>
	);
};
