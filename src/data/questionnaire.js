export const QUESTION_SETS = {
	it: {
		label: 'IT Solutions',
		questions: [
			{
				key: 'current_state',
				label: "What's the current state of your IT infrastructure?",
				type: 'single',
				options: [
					'Nothing set up yet',
					'Basic setup, needs improvement',
					'Established, need specific help',
					'Not sure',
				],
			},
			{
				key: 'help_needed',
				label: 'What do you need help with? (select all that apply)',
				type: 'multi',
				options: [
					'Infrastructure & systems setup',
					'Ongoing technical support',
					'Security & access',
					'Tooling & workflow automation',
					'Something else',
				],
			},
			{
				key: 'team_size',
				label: 'How large is your team?',
				type: 'single',
				options: ['1–5', '6–20', '21–50', '50+'],
			},
			{
				key: 'timeline',
				label: "What's your timeline?",
				type: 'single',
				options: ['ASAP', 'Within a month', '1–3 months', 'Just exploring'],
			},
			{
				key: 'budget',
				label: 'Do you have a budget range in mind?',
				type: 'single',
				options: ['Under $2k/mo', '$2k–5k/mo', '$5k–10k/mo', "Let's discuss", 'Not sure yet'],
			},
			{
				key: 'notes',
				label: 'Anything else we should know?',
				type: 'text',
			},
		],
	},
	media: {
		label: 'Media Solutions',
		questions: [
			{
				key: 'deliverables',
				label: 'What are you looking to create? (select all that apply)',
				type: 'multi',
				options: [
					'Brand identity',
					'Video content',
					'Marketing campaign',
					'Social media management',
					'Website content',
					'Something else',
				],
			},
			{
				key: 'brand_assets',
				label: 'Do you have existing brand assets (logo, colors, etc.)?',
				type: 'single',
				options: ['Yes, fully developed', 'Some, needs refinement', 'No, starting fresh'],
			},
			{
				key: 'main_goal',
				label: "What's the main goal?",
				type: 'single',
				options: [
					'Launch a new product/brand',
					'Grow audience/engagement',
					'Generate leads/sales',
					'Refresh an existing brand',
					'Not sure yet',
				],
			},
			{
				key: 'timeline',
				label: "What's your timeline?",
				type: 'single',
				options: ['ASAP', 'Within a month', '1–3 months', 'Just exploring'],
			},
			{
				key: 'budget',
				label: 'Do you have a budget range in mind?',
				type: 'single',
				options: ['Under $2k/mo', '$2k–5k/mo', '$5k–10k/mo', "Let's discuss", 'Not sure yet'],
			},
			{
				key: 'notes',
				label: 'Anything else we should know?',
				type: 'text',
			},
		],
	},
	management: {
		label: 'Management Solutions',
		questions: [
			{
				key: 'support_type',
				label: 'What kind of operational support do you need? (select all that apply)',
				type: 'multi',
				options: [
					'Project management',
					'Process design',
					'Vendor & resource coordination',
					'Reporting & tracking',
					'Something else',
				],
			},
			{
				key: 'current_approach',
				label: 'How is your team currently managing this?',
				type: 'single',
				options: [
					'Ad hoc, no real process',
					'Spreadsheets / informal tools',
					'Some tools, but inconsistent',
					'Established process, need more capacity',
				],
			},
			{
				key: 'team_size',
				label: 'How large is your team?',
				type: 'single',
				options: ['1–5', '6–20', '21–50', '50+'],
			},
			{
				key: 'timeline',
				label: "What's your timeline?",
				type: 'single',
				options: ['ASAP', 'Within a month', '1–3 months', 'Just exploring'],
			},
			{
				key: 'budget',
				label: 'Do you have a budget range in mind?',
				type: 'single',
				options: ['Under $2k/mo', '$2k–5k/mo', '$5k–10k/mo', "Let's discuss", 'Not sure yet'],
			},
			{
				key: 'notes',
				label: 'Anything else we should know?',
				type: 'text',
			},
		],
	},
	general: {
		label: 'Getting started',
		questions: [
			{
				key: 'areas_of_interest',
				label: "Which areas are you interested in? (select all that apply)",
				type: 'multi',
				options: ['IT Solutions', 'Media Solutions', 'Management Solutions', 'Not sure yet'],
			},
			{
				key: 'main_goal',
				label: "What's the main problem you're trying to solve right now?",
				type: 'text',
			},
			{
				key: 'timeline',
				label: "What's your timeline?",
				type: 'single',
				options: ['ASAP', 'Within a month', '1–3 months', 'Just exploring'],
			},
			{
				key: 'budget',
				label: 'Do you have a budget range in mind?',
				type: 'single',
				options: ['Under $2k/mo', '$2k–5k/mo', '$5k–10k/mo', "Let's discuss", 'Not sure yet'],
			},
			{
				key: 'notes',
				label: 'Anything else we should know?',
				type: 'text',
			},
		],
	},
};

export function sectionFromTopic(topic) {
	if (topic === 'IT Solutions') return 'it';
	if (topic === 'Media Solutions') return 'media';
	if (topic === 'Management Solutions') return 'management';
	return 'general';
}
