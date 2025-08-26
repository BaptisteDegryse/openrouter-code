import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface OpenRouterModel {
	id: string;
	name: string;
	description?: string;
	context_length: number;
	pricing: {
		prompt: string;
		completion: string;
	};
	top_provider?: {
		context_length?: number;
		max_completion_tokens?: number;
	};
	architecture?: {
		modality?: string;
		tokenizer?: string;
		instruct_type?: string;
	};
	supported_parameters?: string[];
}

interface ModelCache {
	models: OpenRouterModel[];
	timestamp: number;
}

const CACHE_DIR = path.join(os.homedir(), '.openrouter');
const CACHE_FILE = path.join(CACHE_DIR, 'models-cache.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Popular models to highlight
const POPULAR_MODELS = [
	'anthropic/claude-3.5-sonnet',
	'anthropic/claude-3-opus',
	'openai/gpt-4-turbo-preview',
	'openai/gpt-4o',
	'google/gemini-pro-1.5',
	'meta-llama/llama-3.1-405b-instruct',
	'mistralai/mistral-large',
	'deepseek/deepseek-coder',
	'cohere/command-r-plus',
];

function ensureCacheDir(): void {
	if (!fs.existsSync(CACHE_DIR)) {
		fs.mkdirSync(CACHE_DIR, {recursive: true});
	}
}

function loadCache(): ModelCache | null {
	try {
		if (fs.existsSync(CACHE_FILE)) {
			const cacheData = fs.readFileSync(CACHE_FILE, 'utf8');
			const cache: ModelCache = JSON.parse(cacheData);

			// Check if cache is still valid
			if (Date.now() - cache.timestamp < CACHE_DURATION) {
				return cache;
			}
		}
	} catch (error) {
		console.warn('Failed to load model cache:', error);
	}
	return null;
}

function saveCache(models: OpenRouterModel[]): void {
	try {
		ensureCacheDir();
		const cache: ModelCache = {
			models,
			timestamp: Date.now(),
		};
		fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
	} catch (error) {
		console.warn('Failed to save model cache:', error);
	}
}

function getModelRecencyScore(modelId: string): number {
	const id = modelId.toLowerCase();

	// Higher scores for newer model versions
	if (id.includes('4.5') || id.includes('4-5')) return 100;
	if (id.includes('4.0') || id.includes('4-0')) return 95;
	if (id.includes('3.5') || id.includes('3-5')) return 90;
	if (id.includes('3.1') || id.includes('3-1')) return 85;
	if (id.includes('3.0') || id.includes('3-0')) return 80;
	if (id.includes('2.5') || id.includes('2-5')) return 75;
	if (id.includes('2.1') || id.includes('2-1')) return 70;
	if (id.includes('2.0') || id.includes('2-0')) return 65;

	// Recent model keywords
	if (id.includes('2024') || id.includes('2025')) return 60;
	if (id.includes('turbo') || id.includes('preview')) return 55;
	if (id.includes('instruct') || id.includes('chat')) return 50;
	if (id.includes('latest') || id.includes('new')) return 45;

	// Default score for older models
	return 0;
}

export async function fetchOpenRouterModels(
	apiKey?: string,
): Promise<OpenRouterModel[]> {
	// Try to load from cache first
	const cache = loadCache();
	if (cache) {
		return cache.models;
	}

	try {
		const headers: any = {
			'Content-Type': 'application/json',
			'HTTP-Referer': 'https://github.com/openrouter-code-cli',
			'X-Title': 'OpenRouter Code CLI',
		};

		// API key is optional for fetching models
		if (apiKey) {
			headers['Authorization'] = `Bearer ${apiKey}`;
		}

		const response = await fetch('https://openrouter.ai/api/v1/models', {
			method: 'GET',
			headers,
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch models: ${response.status} ${response.statusText}`,
			);
		}

		const data = (await response.json()) as {data: OpenRouterModel[]};
		const models = data.data || [];

		// Sort models with popular ones first, then by recency (newer models first), then alphabetically
		const sortedModels = models.sort((a, b) => {
			const aPopular = POPULAR_MODELS.includes(a.id);
			const bPopular = POPULAR_MODELS.includes(b.id);

			if (aPopular && !bPopular) return -1;
			if (!aPopular && bPopular) return 1;
			if (aPopular && bPopular) {
				return POPULAR_MODELS.indexOf(a.id) - POPULAR_MODELS.indexOf(b.id);
			}

			// For non-popular models, prioritize newer versions
			const aScore = getModelRecencyScore(a.id);
			const bScore = getModelRecencyScore(b.id);

			if (aScore !== bScore) {
				return bScore - aScore; // Higher score (newer) first
			}

			return a.id.localeCompare(b.id);
		});

		// Cache the results
		saveCache(sortedModels);

		return sortedModels;
	} catch (error) {
		console.warn('Failed to fetch OpenRouter models:', error);

		// Return a default list of known models as fallback
		return getDefaultModels();
	}
}

export function getDefaultModels(): OpenRouterModel[] {
	return [
		{
			id: 'anthropic/claude-3.5-sonnet',
			name: 'Claude 3.5 Sonnet',
			description: 'Most intelligent model from Anthropic',
			context_length: 200000,
			pricing: {prompt: '0.003', completion: '0.015'},
			supported_parameters: ['tools'],
		},
		{
			id: 'anthropic/claude-3-opus',
			name: 'Claude 3 Opus',
			description: 'Powerful model for complex tasks',
			context_length: 200000,
			pricing: {prompt: '0.015', completion: '0.075'},
			supported_parameters: ['tools'],
		},
		{
			id: 'openai/gpt-4-turbo-preview',
			name: 'GPT-4 Turbo',
			description: 'Latest GPT-4 Turbo with vision',
			context_length: 128000,
			pricing: {prompt: '0.01', completion: '0.03'},
			supported_parameters: ['tools'],
		},
		{
			id: 'openai/gpt-4o',
			name: 'GPT-4o',
			description: 'Multimodal GPT-4',
			context_length: 128000,
			pricing: {prompt: '0.005', completion: '0.015'},
			supported_parameters: ['tools'],
		},
		{
			id: 'google/gemini-pro-1.5',
			name: 'Gemini Pro 1.5',
			description: "Google's advanced model",
			context_length: 2800000,
			pricing: {prompt: '0.0025', completion: '0.0075'},
			supported_parameters: ['tools'],
		},
		{
			id: 'meta-llama/llama-3.1-405b-instruct',
			name: 'Llama 3.1 405B',
			description: "Meta's largest open model",
			context_length: 128000,
			pricing: {prompt: '0.003', completion: '0.003'},
		},
		{
			id: 'meta-llama/llama-3.1-70b-instruct',
			name: 'Llama 3.1 70B',
			description: 'Efficient large model from Meta',
			context_length: 128000,
			pricing: {prompt: '0.00052', completion: '0.00075'},
		},
		{
			id: 'mistralai/mistral-large',
			name: 'Mistral Large',
			description: "Mistral's flagship model",
			context_length: 128000,
			pricing: {prompt: '0.003', completion: '0.009'},
			supported_parameters: ['tools'],
		},
		{
			id: 'deepseek/deepseek-coder',
			name: 'DeepSeek Coder',
			description: 'Specialized for coding tasks',
			context_length: 16000,
			pricing: {prompt: '0.00014', completion: '0.00028'},
		},
		{
			id: 'cohere/command-r-plus',
			name: 'Command R+',
			description: "Cohere's RAG-optimized model",
			context_length: 128000,
			pricing: {prompt: '0.003', completion: '0.015'},
			supported_parameters: ['tools'],
		},
	];
}

export function supportsTools(model: OpenRouterModel): boolean {
	return model.supported_parameters?.includes('tools') || false;
}

export function filterModelsWithTools(
	models: OpenRouterModel[],
): OpenRouterModel[] {
	return models.filter(supportsTools);
}

export function filterModelsWithoutTools(
	models: OpenRouterModel[],
): OpenRouterModel[] {
	return models.filter(model => !supportsTools(model));
}

export function formatModelForDisplay(model: OpenRouterModel): string {
	const name = model.name || model.id;
	const context = model.context_length
		? ` (${(model.context_length / 1000).toFixed(0)}k context)`
		: '';
	const pricing = model.pricing
		? ` - $${model.pricing.prompt}/$${model.pricing.completion}`
		: '';
	const toolSupport = supportsTools(model) ? ' [Tools]' : '';
	return `${name}${context}${pricing}${toolSupport}`;
}

export function formatModelCostInfo(model: OpenRouterModel): string {
	if (!model.pricing) return '';

	const promptCost = parseFloat(model.pricing.prompt) * 1000; // Convert to per million
	const completionCost = parseFloat(model.pricing.completion) * 1000; // Convert to per million

	// Format costs with appropriate precision for per million pricing
	const formatCost = (cost: number): string => {
		if (cost >= 100) return `$${cost.toFixed(0)}`;
		if (cost >= 10) return `$${cost.toFixed(1)}`;
		if (cost >= 1) return `$${cost.toFixed(2)}`;
		return `$${cost.toFixed(3)}`;
	};

	return `${formatCost(promptCost)}/${formatCost(
		completionCost,
	)} per 1M tokens`;
}

export function clearModelCache(): void {
	try {
		if (fs.existsSync(CACHE_FILE)) {
			fs.unlinkSync(CACHE_FILE);
		}
	} catch (error) {
		console.warn('Failed to clear model cache:', error);
	}
}
