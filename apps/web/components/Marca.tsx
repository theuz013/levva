/** Marca provisória: as abóbadas da Pampulha reduzidas a um traço. */
export function Marca({ tamanho = 28, cor = 'currentColor' }: { tamanho?: number; cor?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: cor }}>
      <svg width={tamanho * 1.5} height={tamanho} viewBox="0 0 42 28" aria-hidden="true">
        <path d="M2 26V16a7 7 0 0 1 14 0v10" fill="none" stroke={cor} strokeWidth="3" strokeLinecap="round" />
        <path d="M16 26V11a10 10 0 0 1 20 0v15" fill="none" stroke={cor} strokeWidth="3" strokeLinecap="round" />
        <path d="M1 26.5h40" stroke={cor} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span style={{ fontWeight: 800, fontSize: tamanho * 0.86, letterSpacing: '-0.02em', lineHeight: 1 }}>Levva</span>
    </span>
  );
}
