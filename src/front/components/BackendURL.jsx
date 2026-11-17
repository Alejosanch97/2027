import React from "react";

export const BackendURL = () => (
	<div style={{ maxWidth: 560, margin: "12vh auto", padding: 24, fontFamily: "system-ui", color: "#F3EEE4" }}>
		<h2>Falta la variable VITE_BACKEND_URL</h2>
		<p>Crea un archivo <code>.env</code> en la raíz del proyecto (puedes copiar <code>.env.example</code>) con esta línea:</p>
		<pre style={{ background: "#13243B", padding: 14, borderRadius: 12 }}>VITE_BACKEND_URL=http://localhost:3001</pre>
		<p>Luego detén y vuelve a correr <code>npm run dev</code>.</p>
	</div>
);
