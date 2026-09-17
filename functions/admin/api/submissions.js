const STATUSES = new Set(['new', 'contacted', 'closed']);

function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
	});
}

export async function onRequestGet({ env }) {
	const { results: contacts } = await env.DB.prepare(
		`SELECT id, name, email, topic, message, status, created_at
		 FROM contacts ORDER BY created_at DESC, id DESC`
	).all();

	const { results: responses } = await env.DB.prepare(
		`SELECT id, contact_id, section, answers_json, created_at
		 FROM questionnaire_responses ORDER BY created_at DESC, id DESC`
	).all();

	const byContact = new Map();
	const unlinked = [];
	for (const row of responses) {
		const parsed = {
			id: row.id,
			section: row.section,
			answers: JSON.parse(row.answers_json),
			created_at: row.created_at,
		};
		if (row.contact_id === null) unlinked.push(parsed);
		else if (!byContact.has(row.contact_id)) byContact.set(row.contact_id, parsed);
	}

	const submissions = contacts.map((contact) => ({
		...contact,
		questionnaire: byContact.get(contact.id) ?? null,
	}));

	return json({ submissions, unlinkedResponses: unlinked });
}

export async function onRequestPatch({ request, env }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, 400);
	}

	const id = Number(body.id);
	const status = String(body.status ?? '');

	if (!Number.isInteger(id) || id <= 0 || !STATUSES.has(status)) {
		return json({ error: 'Invalid id or status.' }, 400);
	}

	const result = await env.DB.prepare('UPDATE contacts SET status = ? WHERE id = ?')
		.bind(status, id)
		.run();

	if (result.meta.changes === 0) return json({ error: 'Submission not found.' }, 404);

	return json({ ok: true });
}
