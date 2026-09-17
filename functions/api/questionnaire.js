const SECTIONS = new Set(['it', 'media', 'management', 'general']);

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

	const section = String(body.section ?? '').trim();
	const contactId = body.contactId ? Number(body.contactId) : null;
	const answers = body.answers;

	if (!SECTIONS.has(section)) {
		return json({ error: 'Invalid section.' }, 400);
	}
	if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
		return json({ error: 'Invalid answers.' }, 400);
	}

	const result = await env.DB.prepare(
		'INSERT INTO questionnaire_responses (contact_id, section, answers_json) VALUES (?, ?, ?)'
	)
		.bind(contactId, section, JSON.stringify(answers))
		.run();

	return json({ ok: true, responseId: result.meta.last_row_id });
}
