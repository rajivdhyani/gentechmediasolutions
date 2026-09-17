const TOPICS = new Set(['IT Solutions', 'Media Solutions', 'Management Solutions', 'Not sure yet']);

function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

export async function onRequestPost({ request, env }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, 400);
	}

	const name = String(body.name ?? '').trim();
	const email = String(body.email ?? '').trim();
	const topic = String(body.topic ?? '').trim();
	const message = String(body.message ?? '').trim();

	if (!name || !email || !message || !TOPICS.has(topic)) {
		return json({ error: 'Missing or invalid fields.' }, 400);
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json({ error: 'Invalid email address.' }, 400);
	}

	const result = await env.DB.prepare(
		'INSERT INTO contacts (name, email, topic, message) VALUES (?, ?, ?, ?)'
	)
		.bind(name, email, topic, message)
		.run();

	return json({ ok: true, contactId: result.meta.last_row_id });
}
