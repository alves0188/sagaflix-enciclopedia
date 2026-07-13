import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { Wallet, CreditCard, Send, History, MessageSquare, Plus, ArrowUpRight, ArrowDownLeft, Calendar, HelpCircle, Loader2 } from 'lucide-react';

export default function UserDashboard({ currentUser }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wallet'); // 'wallet' | 'transactions' | 'support' | 'withdrawals'
  
  // Form states
  const [depositAmount, setDepositAmount] = useState('');
  const [depositType, setDepositType] = useState('credits'); // 'credits' | 'subscription'
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);

  const [donateAuthor, setDonateAuthor] = useState('');
  const [donateAmount, setDonateAmount] = useState('');
  const [donateDesc, setDonateDesc] = useState('');
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [donateLoading, setDonateLoading] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBankKey, setWithdrawBankKey] = useState('');
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);

  useEffect(() => {
    fetchWalletAndLogs();
  }, [currentUser]);

  const fetchWalletAndLogs = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = { 'Authorization': `Bearer ${session.access_token}` };
      const baseUrl = window.API_BASE_URL || '';

      // 1. Fetch wallet
      const walletRes = await fetch(`${baseUrl}/api/wallet/balance`, { headers });
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      }

      // 2. Fetch transactions from Supabase directly via RLS
      const { data: txs, error: txsErr } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!txsErr) setTransactions(txs || []);

      // 3. Fetch support tickets from backend API
      const ticketsRes = await fetch(`${baseUrl}/api/support/tickets`, { headers });
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData || []);
      }

      // 4. Fetch authors (for donations)
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name, nickname')
        .eq('role', 'author');
      setAuthors(profs || []);

      // 5. Fetch withdrawals if author
      if (currentUser.role === 'author') {
        const { data: wds } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .order('created_at', { ascending: false });
        setWithdrawals(wds || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMockDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Informe um valor de depósito válido.');
      return;
    }

    setDepositLoading(true);
    try {
      const amount = parseFloat(depositAmount);
      const baseUrl = window.API_BASE_URL || '';
      
      const payload = {
        event: 'payment.succeeded',
        user_id: currentUser.id,
        amount: depositType === 'subscription' ? 14.90 : amount,
        gateway_ref: `stripe_${Date.now()}`,
        type: depositType
      };

      const res = await fetch(`${baseUrl}/api/wallet/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(depositType === 'subscription' ? 'Assinatura ativada com sucesso!' : 'Créditos adicionados com sucesso!');
        setDepositAmount('');
        setIsDepositOpen(false);
        fetchWalletAndLogs();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Erro ao processar depósito.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao processar depósito.');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!donateAuthor || !donateAmount || parseFloat(donateAmount) <= 0) {
      toast.error('Preencha todos os campos com valores válidos.');
      return;
    }

    setDonateLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const baseUrl = window.API_BASE_URL || '';

      const res = await fetch(`${baseUrl}/api/wallet/donate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          author_id: donateAuthor,
          amount: parseFloat(donateAmount),
          description: donateDesc
        })
      });

      if (res.ok) {
        toast.success('Doação realizada com sucesso!');
        setDonateAmount('');
        setDonateDesc('');
        setIsDonateOpen(false);
        fetchWalletAndLogs();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Erro ao transferir créditos.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao transferir créditos.');
    } finally {
      setDonateLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || !withdrawBankKey) {
      toast.error('Preencha os dados de saque corretamente.');
      return;
    }

    setWithdrawLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const baseUrl = window.API_BASE_URL || '';

      const res = await fetch(`${baseUrl}/api/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          bank_token: withdrawBankKey
        })
      });

      if (res.ok) {
        toast.success('Solicitação de saque enviada com sucesso!');
        setWithdrawAmount('');
        setWithdrawBankKey('');
        setIsWithdrawOpen(false);
        fetchWalletAndLogs();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Erro ao solicitar saque.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao solicitar saque.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) {
      toast.error('Preencha o assunto e a mensagem do chamado.');
      return;
    }

    setTicketLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const baseUrl = window.API_BASE_URL || '';

      const res = await fetch(`${baseUrl}/api/support/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          subject: ticketSubject,
          message: ticketMessage
        })
      });

      if (res.ok) {
        toast.success('Chamado de suporte aberto com sucesso!');
        setTicketSubject('');
        setTicketMessage('');
        setIsTicketOpen(false);
        fetchWalletAndLogs();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Erro ao abrir chamado.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao abrir chamado.');
    } finally {
      setTicketLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={32} color="var(--accent-gold)" />
        <p>Carregando dados da carteira...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem', color: 'var(--text-main)' }}>
      
      {/* Wallet Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Balance Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(20, 20, 20, 0.4) 100%)', 
          border: '1px solid var(--accent-gold)', 
          borderRadius: '12px', 
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '160px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'bold' }}>Carteira Sagaflix</span>
            <Wallet size={24} color="var(--accent-gold)" />
          </div>
          <div>
            <h2 style={{ margin: '0.5rem 0', fontSize: '2.5rem', fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>
              R$ {parseFloat(wallet?.balance || 0).toFixed(2)}
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Disponível para doações e leitura premium</p>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div style={{ 
          background: 'var(--card-bg)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px', 
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '160px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'bold' }}>Plano de Assinatura</span>
            <CreditCard size={24} color={wallet?.subscription_status === 'active' ? '#4CAF50' : 'var(--text-muted)'} />
          </div>
          <div>
            <h3 style={{ margin: '0.5rem 0', fontSize: '1.4rem', color: wallet?.subscription_status === 'active' ? '#4CAF50' : 'var(--text-muted)' }}>
              {wallet?.subscription_status === 'active' ? 'Plano Premium Ativo' : 'Nenhum Plano Ativo'}
            </h3>
            {wallet?.subscription_status === 'active' && wallet?.subscription_expires_at ? (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={14} /> Expira em: {new Date(wallet.subscription_expires_at).toLocaleDateString('pt-BR')}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assine por R$ 14,90/mês para liberar tudo</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => { setDepositType('credits'); setIsDepositOpen(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}>
          <Plus size={18} /> Adicionar Créditos
        </button>
        <button onClick={() => { setDepositType('subscription'); setIsDepositOpen(true); }} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}>
          <CreditCard size={18} /> {wallet?.subscription_status === 'active' ? 'Renovar Assinatura' : 'Assinar Premium'}
        </button>
        <button onClick={() => setIsDonateOpen(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}>
          <Send size={18} /> Apoiar Autor
        </button>
        {currentUser.role === 'author' && (
          <button onClick={() => setIsWithdrawOpen(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>
            <ArrowUpRight size={18} /> Solicitar Saque
          </button>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '2rem' }}>
        <button 
          onClick={() => setActiveTab('wallet')}
          style={{ background: 'none', border: 'none', padding: '1rem 0', color: activeTab === 'wallet' ? 'var(--accent-gold)' : 'var(--text-muted)', borderBottom: activeTab === 'wallet' ? '2px solid var(--accent-gold)' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Carteira e Logs
        </button>
        <button 
          onClick={() => setActiveTab('support')}
          style={{ background: 'none', border: 'none', padding: '1rem 0', color: activeTab === 'support' ? 'var(--accent-gold)' : 'var(--text-muted)', borderBottom: activeTab === 'support' ? '2px solid var(--accent-gold)' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Suporte e Chamados ({tickets.length})
        </button>
        {currentUser.role === 'author' && (
          <button 
            onClick={() => setActiveTab('withdrawals')}
            style={{ background: 'none', border: 'none', padding: '1rem 0', color: activeTab === 'withdrawals' ? 'var(--accent-gold)' : 'var(--text-muted)', borderBottom: activeTab === 'withdrawals' ? '2px solid var(--accent-gold)' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Histórico de Saques ({withdrawals.length})
          </button>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === 'wallet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>Histórico de Transações</h4>
          {transactions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Nenhuma transação registrada na sua carteira.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {transactions.map(tx => (
                <div key={tx.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: tx.type === 'deposit' || tx.type === 'donation_receive' ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {tx.type === 'deposit' || tx.type === 'donation_receive' ? <ArrowDownLeft color="#4CAF50" size={20} /> : <ArrowUpRight color="#F44336" size={20} />}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{tx.description || 'Transação de Créditos'}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: tx.type === 'deposit' || tx.type === 'donation_receive' ? '#4CAF50' : '#F44336' }}>
                      {tx.type === 'deposit' || tx.type === 'donation_receive' ? '+' : '-'} R$ {parseFloat(tx.amount).toFixed(2)}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ref: {tx.gateway_ref || 'interna'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'support' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>Chamados de Suporte</h4>
            <button onClick={() => setIsTicketOpen(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}>
              <Plus size={16} /> Abrir Novo Chamado
            </button>
          </div>

          {tickets.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Você não possui nenhum chamado de suporte em aberto.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tickets.map(tk => (
                <div key={tk.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{tk.subject}</strong>
                    <span style={{ 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      background: tk.status === 'open' ? 'rgba(255,193,7,0.15)' : 'rgba(76,175,80,0.15)',
                      color: tk.status === 'open' ? '#FFC107' : '#4CAF50'
                    }}>
                      {tk.status === 'open' ? 'Em aberto' : 'Resolvido'}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{tk.message}</p>
                  {tk.reply && (
                    <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid var(--accent-gold)', borderRadius: '0 4px 4px 0' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>Resposta da Curadoria:</p>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>{tk.reply}</p>
                    </div>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aberto em: {new Date(tk.created_at).toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'withdrawals' && currentUser.role === 'author' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)' }}>Histórico de Saques</h4>
          {withdrawals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Você não realizou solicitações de saque ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {withdrawals.map(wd => (
                <div key={wd.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>Solicitação de Saque</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chave/Conta: {wd.bank_token}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Solicitado em: {new Date(wd.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-gold)' }}>R$ {parseFloat(wd.amount).toFixed(2)}</p>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold',
                      background: wd.status === 'pending' ? 'rgba(255,193,7,0.15)' : wd.status === 'approved' ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)',
                      color: wd.status === 'pending' ? '#FFC107' : wd.status === 'approved' ? '#4CAF50' : '#F44336'
                    }}>
                      {wd.status === 'pending' ? 'Pendente' : wd.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Deposit/Subscription Modal */}
      {isDepositOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--accent-gold)', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', fontSize: '1.5rem' }}>
              {depositType === 'subscription' ? 'Assinatura Premium' : 'Adicionar Créditos'}
            </h3>
            
            <form onSubmit={handleMockDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {depositType === 'subscription' ? (
                <div style={{ background: 'rgba(212,175,55,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--accent-gold)' }}>Valor: R$ 14,90/mês</p>
                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Ao assinar, você desbloqueia leitura de livros premium, doações e vantagens de gamificação!
                  </p>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Valor do Depósito (R$)</label>
                  <input 
                    type="number" 
                    min="5" 
                    step="0.01" 
                    required 
                    value={depositAmount} 
                    onChange={e => setDepositAmount(e.target.value)} 
                    placeholder="Min R$ 5,00"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.8rem', borderRadius: '4px' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsDepositOpen(false)} className="btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>Cancelar</button>
                <button type="submit" disabled={depositLoading} className="btn-primary" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {depositLoading && <Loader2 className="animate-spin" size={16} />}
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Ticket Modal */}
      {isTicketOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', fontSize: '1.5rem' }}>Novo Chamado de Suporte</h3>
            
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Assunto / Tema</label>
                <input 
                  type="text" 
                  required 
                  value={ticketSubject} 
                  onChange={e => setTicketSubject(e.target.value)} 
                  placeholder="Ex: Reembolso, Dúvidas de Assinatura..."
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.8rem', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Mensagem / Reclamação</label>
                <textarea 
                  required 
                  rows={4}
                  value={ticketMessage} 
                  onChange={e => setTicketMessage(e.target.value)} 
                  placeholder="Descreva seu problema ou solicitação detalhadamente..."
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.8rem', borderRadius: '4px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsTicketOpen(false)} className="btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>Cancelar</button>
                <button type="submit" disabled={ticketLoading} className="btn-primary" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {ticketLoading && <Loader2 className="animate-spin" size={16} />}
                  Enviar Chamado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout/Withdrawal Modal (Authors Only) */}
      {isWithdrawOpen && currentUser.role === 'author' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', fontSize: '1.5rem' }}>Solicitar Saque</h3>
            
            <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Valor do Saque (R$)</label>
                <input 
                  type="number" 
                  min="10" 
                  step="0.01" 
                  required 
                  value={withdrawAmount} 
                  onChange={e => setWithdrawAmount(e.target.value)} 
                  placeholder={`Max R$ ${parseFloat(wallet?.balance || 0).toFixed(2)}`}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.8rem', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Chave PIX / Conta de Destino</label>
                <input 
                  type="text" 
                  required 
                  value={withdrawBankKey} 
                  onChange={e => setWithdrawBankKey(e.target.value)} 
                  placeholder="Informe CPF, E-mail, Celular ou Ag/CC"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.8rem', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsWithdrawOpen(false)} className="btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>Cancelar</button>
                <button type="submit" disabled={withdrawLoading} className="btn-primary" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {withdrawLoading && <Loader2 className="animate-spin" size={16} />}
                  Confirmar Saque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Donate Credits Modal */}
      {isDonateOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: 'var(--accent-gold)', fontSize: '1.5rem' }}>Apoiar um Autor</h3>
            
            <form onSubmit={handleDonate} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Escolha o Autor</label>
                <select 
                  required 
                  value={donateAuthor} 
                  onChange={e => setDonateAuthor(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.8rem', borderRadius: '4px' }}
                >
                  <option value="" disabled style={{ background: '#222' }}>Selecionar Autor...</option>
                  {authors.map(auth => (
                    <option key={auth.id} value={auth.id} style={{ background: '#222' }}>{auth.name} ({auth.nickname})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Valor do Apoio (R$)</label>
                <input 
                  type="number" 
                  min="1" 
                  step="0.01" 
                  required 
                  value={donateAmount} 
                  onChange={e => setDonateAmount(e.target.value)} 
                  placeholder={`Max R$ ${parseFloat(wallet?.balance || 0).toFixed(2)}`}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.8rem', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Mensagem (Opcional)</label>
                <input 
                  type="text" 
                  value={donateDesc} 
                  onChange={e => setDonateDesc(e.target.value)} 
                  placeholder="Deixe uma mensagem de apoio!"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.8rem', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsDonateOpen(false)} className="btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>Cancelar</button>
                <button type="submit" disabled={donateLoading} className="btn-primary" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {donateLoading && <Loader2 className="animate-spin" size={16} />}
                  Enviar Créditos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
