'use client';

import { Banknote, CalendarClock, Car, FileText, LogOut, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { salvarToken } from '@/lib/api';
import s from './shell.module.css';

const NAV = [
  { href: '/cotacoes', rotulo: 'Cotações', icone: FileText },
  { href: '/corridas', rotulo: 'Corridas', icone: CalendarClock },
  { href: '/clientes', rotulo: 'Clientes', icone: Users },
  { href: '/motoristas', rotulo: 'Motoristas', icone: Car },
  { href: '/financeiro', rotulo: 'Financeiro', icone: Banknote },
];

export function Shell({ children, empresa = 'Operação Levva' }: { children: React.ReactNode; empresa?: string }) {
  const atual = usePathname();
  const router = useRouter();

  function sair() {
    salvarToken(null);
    router.push('/login');
  }

  return (
    <div className={s.shell}>
      <aside className={s.rail}>
        <div className={s.topo}>
          <img src="/levva-logo.png" alt="Levva Transporte Executivo" className={s.logo} width={168} height={33} />
          <span className={s.empresa}>{empresa}</span>
        </div>
        <nav aria-label="Principal" className={s.nav}>
          {NAV.map(({ href, rotulo, icone: Icone }) => {
            const ativo = atual.startsWith(href);
            return (
              <Link key={href} href={href} className={s.item} aria-current={ativo ? 'page' : undefined}>
                <Icone size={18} strokeWidth={1.75} aria-hidden="true" />
                <span>{rotulo}</span>
              </Link>
            );
          })}
        </nav>
        <button className={s.sair} onClick={sair}>
          <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>Sair</span>
        </button>
      </aside>
      <div className={s.conteudo}>{children}</div>
    </div>
  );
}
