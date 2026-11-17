// Tablero de visión con cinco estilos. Las imágenes se agregan pegando un enlace.
import { useState } from "react";
import { Plus } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import useActions from "../hooks/useActions";
import { PageHead, Modal, Form, Tabs, Empty, Glass, cx } from "../components/ui";

export const STYLES = [["collage", "Collage"], ["galeria", "Galería"], ["pelicula", "Película"], ["mosaico", "Mosaico"], ["constelacion", "Constelación"]];

// Una pieza del tablero. También la usa el Estreno.
export function VisionTile({ item, index = 0, total = 1, onClick }) {
	const [broken, setBroken] = useState(false);
	const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
	const style = {
		"--c": item.color, "--i": index, "--rot": ((index * 37) % 9) - 4 + "deg",
		"--x": (50 + Math.cos(angle) * 39).toFixed(2) + "%", "--y": (50 + Math.sin(angle) * 39).toFixed(2) + "%",
	};
	const Tag = onClick ? "button" : "div";
	return (
		<Tag className="vtile" style={style} onClick={onClick}>
			<div className="vtile-img">
				{item.image_url && !broken ? <img src={item.image_url} alt="" loading="lazy" onError={() => setBroken(true)} /> : <span className="vtile-emoji">{item.emoji}</span>}
			</div>
			<div className="vtile-txt"><b>{item.title}</b>{item.caption && <small>{item.caption}</small>}</div>
		</Tag>
	);
}

export const Vision = () => {
	const { store } = useGlobalReducer();
	const act = useActions();
	const [modal, setModal] = useState(null);
	const style = store.user.settings?.board_style || "collage";
	const items = store.vision;

	return (
		<>
			<PageHead title="Míralo antes de vivirlo" sub="Pega el enlace de una imagen para cada sueño y elige cómo quieres verlos. Este tablero también aparece en tu estreno.">
				<button className="btn primary" onClick={() => setModal({})}><Plus size={16} /> Agregar imagen</button>
			</PageHead>
			<Tabs value={style} onChange={(s) => act.saveProfile({ settings: { board_style: s } })} options={STYLES} />

			{items.length ? (
				<div className={cx("board", style)}>
					{style === "constelacion" && <div className="board-core"><b>2027</b></div>}
					{items.map((it, i) => <VisionTile key={it.id} item={it} index={i} total={items.length} onClick={() => setModal(it)} />)}
				</div>
			) : <Glass className="pad"><Empty emoji="🖼️" title="Tu tablero está vacío">Agrega la primera imagen de algo que quieras ver hecho realidad en 2027.</Empty></Glass>}

			<Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Editar pieza" : "Nueva pieza del tablero"}>
				{modal && <Form key={modal.id || "new"} fields={[
					{ name: "title", label: "¿Qué quieres ver cumplido?", required: true },
					{ name: "caption", label: "Una frase que te lo recuerde" },
					{ name: "image_url", label: "Enlace de la imagen", placeholder: "https://…", hint: "Clic derecho sobre una foto en la web y copia la dirección de la imagen. Sin enlace se muestra el emoji." },
					{ name: "emoji", label: "Emoji" }, { name: "color", label: "Color", type: "color" },
				]} initial={{ emoji: "✨", color: "#E8B95B", ...modal }}
					onSubmit={async (v) => { if (modal.id) await act.update("vision", modal.id, v); else await act.create("vision", { ...v, position: items.length }); setModal(null); }}
					onDelete={modal.id ? async () => { await act.remove("vision", modal.id); setModal(null); } : null} />}
			</Modal>
		</>
	);
};
