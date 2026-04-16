export function cn(...inputs: Array<string | undefined | null | false>): string {
	// Simple implementation without external deps for now
	return inputs.filter(Boolean).join(' ');
}
