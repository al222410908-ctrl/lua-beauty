import { useState, useEffect, useRef } from 'react';
import { Smartphone, MessageSquare, Search, Send, X, PhoneOff, AlertTriangle } from 'lucide-react';


export default function TabBot({ token, showToast, botStatus, botLogs, logsEndRef }) {
  const [botSubTab, setBotSubTab] = useState('conexion');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [address, setAddress] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [indications, setIndications] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [quickResponses, setQuickResponses] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChatPhone, setSelectedChatPhone] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [manualMessageText, setManualMessageText] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const chatMessagesEndRef = useRef(null);
  const selectedChatPhoneRef = useRef(selectedChatPhone);

  useEffect(() => { selectedChatPhoneRef.current = selectedChatPhone; }, [selectedChatPhone]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data) {
        setWelcomeMessage(data.welcome_message || '');
        setHelpMessage(data.help_message || '');
        setAddress(data.address || '');
        setMapsUrl(data.maps_url || '');
        setIndications(data.indications || '');
        setWhatsappNumber(data.whatsapp_number || '');
      }
    } catch (_) {}
  };

  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const res = await fetch('/api/chat/list', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setActiveChats(data || []);
    } catch (_) {}
    finally { setLoadingChats(false); }
  };

  const fetchQuickResponses = async () => {
    try {
      const res = await fetch('/api/quick-responses', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setQuickResponses(data || []);
    } catch (_) {}
  };

  const fetchChatHistory = async (phone) => {
    if (!phone) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/chat/history/${encodeURIComponent(phone)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setChatMessages(data || []);
    } catch (_) {}
    finally { setLoadingHistory(false); }
  };

  // Update chat history when user is selected from WebSocket events
  useEffect(() => {
    if (selectedChatPhone) fetchChatHistory(selectedChatPhone);
  }, [selectedChatPhone]);

  // Auto-scroll chat messages
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (botSubTab === 'config') fetchSettings();
    else if (botSubTab === 'chat') { fetchChats(); fetchQuickResponses(); }
  }, [botSubTab]);

  // Listen for WebSocket chat updates from parent
  useEffect(() => {
    const refreshHandler = () => fetchChats();
    const messageHandler = (e) => {
      const msg = e.detail;
      if (!msg) return;
      const activePhone = selectedChatPhoneRef.current;
      const msgPhoneFormatted = msg.phone?.includes('@') ? msg.phone : `${msg.phone}@c.us`;
      const activePhoneFormatted = activePhone?.includes('@') ? activePhone : `${activePhone}@c.us`;
      if (activePhoneFormatted === msgPhoneFormatted) {
        setChatMessages(prev => [...prev, { sender: msg.sender, message: msg.message, timestamp: msg.timestamp }]);
      }
    };
    window.addEventListener('refresh-chats', refreshHandler);
    window.addEventListener('chat-message', messageHandler);
    return () => {
      window.removeEventListener('refresh-chats', refreshHandler);
      window.removeEventListener('chat-message', messageHandler);
    };
  }, []);

  const handleStartBot = async () => {
    try {
      const res = await fetch('/api/bot/start', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar bot');
      showToast('Enviado comando para iniciar el bot 🤖', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleStopBot = async () => {
    try {
      const res = await fetch('/api/bot/stop', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al detener bot');
      showToast('Enviado comando para detener el bot 🛑', 'info');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleLogoutBot = async () => {
    if (!window.confirm('¿Seguro? Esto cerrará la sesión de WhatsApp del bot (equivalente a cerrar WhatsApp Web desde el móvil). Tendrás que escanear el QR de nuevo.')) return;
    try {
      const res = await fetch('/api/bot/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al desvincular bot');
      showToast('Cerrando sesión de WhatsApp... Deberás escanear el QR de nuevo.', 'warning');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleForceStop = async () => {
    if (!window.confirm('¿Forzar apagado? Esto mata el proceso Chrome del bot aunque esté en estado roto. Útil si el bot se quedó bloqueado.')) return;
    try {
      const res = await fetch('/api/bot/force-stop', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al forzar apagado');
      showToast('✅ Bot detenido forzosamente. Puedes iniciarlo de nuevo.', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };


  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ welcome_message: welcomeMessage, help_message: helpMessage, address, maps_url: mapsUrl, indications, whatsapp_number: whatsappNumber })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      showToast('Configuración guardada correctamente ✨', 'success');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSavingSettings(false); }
  };

  const handleSendManualMessage = async (e) => {
    e.preventDefault();
    if (!selectedChatPhone || !manualMessageText.trim()) return;
    const textToSend = manualMessageText;
    setManualMessageText('');
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: selectedChatPhone, message: textToSend })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      showToast('Mensaje enviado. El bot se ha pausado por 30m 💬', 'success');
      setChatMessages(prev => [...prev, { sender: 'admin', message: textToSend, timestamp: new Date().toISOString() }]);
      fetchChats();
    } catch (err) { showToast(err.message, 'error'); setManualMessageText(textToSend); }
  };

  const handleTogglePauseChat = async (phone, shouldPause) => {
    try {
      const res = await fetch('/api/chat/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone, pause: shouldPause, minutes: 30 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar pausa');
      showToast(shouldPause ? 'Bot pausado para este chat (30m) ⏸️' : 'Bot reactivado para este chat ▶️', 'info');
      fetchChats();
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div className="bg-card border border-line/45 rounded-lg p-6 space-y-6 select-none">
      <div className="flex border-b border-line pb-2 mb-4 overflow-x-auto scrollbar-none gap-4">
        {[
          { id: 'conexion', label: 'Conexión & Terminal' },
          { id: 'config', label: 'Configuración de Mensajes' },
          { id: 'chat', label: 'Chat en Vivo & Control' }
        ].map(sub => (
          <button
            key={sub.id}
            onClick={() => setBotSubTab(sub.id)}
            className={`pb-1 text-xs font-semibold cursor-pointer border-b-2 ${botSubTab === sub.id ? 'border-terracotta text-terracotta' : 'border-transparent text-ink-soft hover:text-ink'}`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {botSubTab === 'conexion' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line/20 pb-4">
            <div className="flex items-center gap-4">
              <Smartphone className="w-8 h-8 text-terracotta" />
              <div>
                <h3 className="text-base font-bold text-ink uppercase tracking-wider">Vinculación de WhatsApp Bot</h3>
                <p className="text-xs text-ink-soft mt-1">Controla el ciclo de vida del chatbot y su vinculación con tu número móvil.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleStartBot} disabled={botStatus?.active}
                className={`px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer border ${botStatus?.active ? 'border-line/45 text-ink-soft/40 cursor-not-allowed opacity-50' : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500'}`}>
                Iniciar Bot
              </button>
              <button onClick={handleStopBot} disabled={!botStatus?.active}
                className={`px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer border ${!botStatus?.active ? 'border-line/45 text-ink-soft/40 cursor-not-allowed opacity-50' : 'bg-rose-600 border-rose-600 text-white hover:bg-rose-500'}`}>
                Detener Bot
              </button>
              <button onClick={handleLogoutBot}
                className="px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-rose-400 bg-rose-600 text-white hover:bg-rose-500">
                <PhoneOff className="w-3.5 h-3.5" />
                Cerrar Sesión WhatsApp
              </button>
              <button onClick={handleForceStop}
                title="Úsalo si el bot quedó bloqueado y no puedes iniciarlo"
                className="px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20">
                <AlertTriangle className="w-3.5 h-3.5" />
                Forzar Apagado
              </button>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 bg-bg-light/40 border border-line/35 p-5 rounded-lg flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
              {botStatus?.active ? (
                botStatus?.connected ? (
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                      <span>●</span> <span>Bot: Conectado</span>
                    </div>
                    <p className="text-[11px] text-ink-soft max-w-xs leading-relaxed">El chatbot de Lúa Beauty está activo.</p>
                  </div>
                ) : botStatus?.qr ? (
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
                      <span>●</span> <span>Escaneo QR Pendiente</span>
                    </div>
                    <div className="bg-white p-3 rounded border border-line inline-block">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(botStatus.qr)}`} alt="QR" className="w-[180px] h-[180px]" />
                    </div>
                    <p className="text-[11px] text-ink-soft max-w-xs leading-relaxed">Abre WhatsApp en tu teléfono, ve a Dispositivos Vinculados y escanea este código.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
                      <span>●</span> <span>Inicializando...</span>
                    </div>
                    <p className="text-[11px] text-ink-soft max-w-xs leading-relaxed">Conectando con el navegador headless en segundo plano.</p>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-full text-xs font-bold uppercase tracking-wider">
                    <span>●</span> <span>Servicio Apagado</span>
                  </div>
                  <p className="text-[11px] text-ink-soft max-w-xs leading-relaxed">El chatbot está actualmente inactivo.</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 bg-zinc-950 rounded-lg border border-zinc-800 p-4 flex flex-col h-[300px]">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3 text-zinc-500 font-mono text-[10px] select-none uppercase tracking-wider">
                <span>Terminal del Bot de WhatsApp</span>
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${botStatus?.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {botStatus?.active ? 'En vivo' : 'Apagado'}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto font-mono text-[10px] text-zinc-350 space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 text-left">
                {botLogs.length === 0 ? (
                  <p className="text-zinc-500 italic select-none">Consola vacía. Enciende el bot para ver eventos...</p>
                ) : (
                  botLogs.map((log, idx) => {
                    let color = 'text-zinc-300';
                    if (log.includes('[ERROR]')) color = 'text-rose-400';
                    if (log.includes('[SUCCESS]')) color = 'text-emerald-400';
                    if (log.includes('[WARNING]')) color = 'text-amber-400';
                    return <div key={idx} className={`leading-relaxed ${color} whitespace-pre-wrap break-all`}>{log}</div>;
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>
      )}

      {botSubTab === 'config' && (
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-terracotta" />
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Configuración de Respuestas del Chatbot</h4>
          </div>
          <p className="text-[11px] text-ink-soft leading-relaxed text-left">
            Personaliza los mensajes de auto-respuesta. Escribe <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-[10px]">{`{categories}`}</code> en el mensaje de bienvenida para enlistar dinámicamente las categorías.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase font-bold text-ink-soft block">Mensaje de Bienvenida / Menú Principal</label>
              <textarea value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} rows={5}
                className="w-full bg-bg-light border border-line/60 p-2.5 rounded text-xs text-ink focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta resize-y min-h-[120px]" required />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase font-bold text-ink-soft block">Mensaje de Asistencia (Ayuda)</label>
              <textarea value={helpMessage} onChange={e => setHelpMessage(e.target.value)} rows={5}
                className="w-full bg-bg-light border border-line/60 p-2.5 rounded text-xs text-ink focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta resize-y min-h-[120px]" required />
            </div>
          </div>
          <div className="border-t border-line/20 pt-4 flex items-center gap-3 mt-4">
            <Smartphone className="w-5 h-5 text-terracotta" />
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Datos de Contacto e Indicaciones</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase font-bold text-ink-soft block">Teléfono WhatsApp Comercial</label>
              <input type="text" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)}
                className="w-full bg-bg-light border border-line/60 p-2.5 rounded text-xs text-ink focus:outline-none focus:border-terracotta font-mono" required />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase font-bold text-ink-soft block">Dirección física</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                className="w-full bg-bg-light border border-line/60 p-2.5 rounded text-xs text-ink focus:outline-none focus:border-terracotta" />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase font-bold text-ink-soft block">Google Maps URL</label>
              <input type="url" value={mapsUrl} onChange={e => setMapsUrl(e.target.value)}
                className="w-full bg-bg-light border border-line/60 p-2.5 rounded text-xs text-ink focus:outline-none focus:border-terracotta" />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase font-bold text-ink-soft block">Indicaciones de entrega</label>
              <input type="text" value={indications} onChange={e => setIndications(e.target.value)}
                className="w-full bg-bg-light border border-line/60 p-2.5 rounded text-xs text-ink focus:outline-none focus:border-terracotta" />
            </div>
          </div>
          <div className="flex justify-end pt-3">
            <button type="submit" disabled={savingSettings}
              className="px-6 py-2 bg-terracotta hover:bg-terracotta/90 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
              {savingSettings ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      )}

      {botSubTab === 'chat' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[450px]">
          <div className="md:col-span-1 border border-line/45 rounded-lg flex flex-col h-full bg-bg-light/10 overflow-hidden">
            <div className="p-3 border-b border-line bg-card flex items-center gap-2">
              <Search className="w-4 h-4 text-ink-soft" />
              <input type="text" placeholder="Buscar chat por teléfono..." value={chatSearchQuery} onChange={e => setChatSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 text-xs text-ink focus:outline-none placeholder-ink-soft/50" />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-line/10">
              {loadingChats ? (
                <p className="text-xs text-ink-soft text-center py-6">Cargando...</p>
              ) : activeChats.length === 0 ? (
                <p className="text-[11px] text-ink-soft text-center py-6 italic">Aún no hay chats disponibles.</p>
              ) : (
                activeChats.filter(chat => chat.phone.includes(chatSearchQuery)).map(chat => {
                  const isSelected = selectedChatPhone === chat.phone;
                  const name = chat.phone.split('@')[0];
                  return (
                    <button key={chat.phone} onClick={() => setSelectedChatPhone(chat.phone)}
                      className={`w-full p-3 flex flex-col items-start gap-1 text-left cursor-pointer ${isSelected ? 'bg-terracotta/10 border-l-4 border-terracotta' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-ink">+{name}</span>
                        <span className={`w-2 h-2 rounded-full ${chat.paused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      </div>
                      <p className="text-[10px] text-ink-soft truncate w-full">{chat.message || 'Sin mensaje'}</p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="md:col-span-2 border border-line/45 rounded-lg flex flex-col h-full bg-card overflow-hidden">
            {selectedChatPhone ? (
              <>
                <div className="p-3 border-b border-line bg-bg-light/30 flex items-center justify-between">
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-ink">+{selectedChatPhone.split('@')[0]}</h4>
                    <span className="text-[9px] text-ink-soft flex items-center gap-1 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeChats.find(c => c.phone === selectedChatPhone)?.paused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {activeChats.find(c => c.phone === selectedChatPhone)?.paused ? 'Modo Manual (Bot Pausado 30m)' : 'Respuestas Automáticas Activas'}
                    </span>
                  </div>
                  <button onClick={() => { const c = activeChats.find(x => x.phone === selectedChatPhone); handleTogglePauseChat(selectedChatPhone, !c?.paused); }}
                    className={`px-3 py-1 rounded text-[10px] font-bold cursor-pointer border ${activeChats.find(c => c.phone === selectedChatPhone)?.paused ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    {activeChats.find(c => c.phone === selectedChatPhone)?.paused ? 'Activar Bot' : 'Pausar Bot'}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-bg-light/5 scrollbar-thin">
                  {loadingHistory ? (
                    <p className="text-xs text-ink-soft text-center py-6">Cargando...</p>
                  ) : chatMessages.length === 0 ? (
                    <p className="text-xs text-ink-soft text-center py-6 italic">Aún no hay mensajes en este chat.</p>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      const isClient = msg.sender === 'cliente';
                      const isBot = msg.sender === 'bot';
                      const dateStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                      return (
                        <div key={idx} className={`flex flex-col ${isClient ? 'items-start' : 'items-end'} max-w-full`}>
                          <div className={`rounded-lg p-2.5 text-xs text-left max-w-[80%] ${isClient ? 'bg-white dark:bg-zinc-800 text-ink border border-line/20' : isBot ? 'bg-zinc-150 dark:bg-zinc-900 text-ink-soft' : 'bg-terracotta text-white font-medium'}`}>
                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          </div>
                          <span className="text-[9px] text-ink-soft/65 mt-0.5 px-1 font-mono">{isBot ? 'Bot' : isClient ? 'Cliente' : 'Tú'} • {dateStr}</span>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>
                {quickResponses.length > 0 && (
                  <div className="p-2 border-t border-line bg-bg-light/5 flex flex-wrap gap-1.5 items-center justify-start select-none">
                    <span className="text-[9px] uppercase font-bold text-ink-soft mr-1">⚡ Respuestas rápidas:</span>
                    {quickResponses.map(qr => (
                      <button key={qr.id} type="button" onClick={() => setManualMessageText(qr.mensaje)}
                        className="px-2 py-0.5 rounded border border-line bg-card hover:bg-black/5 dark:hover:bg-white/5 text-[9px] font-semibold text-ink-soft cursor-pointer" title={qr.mensaje}>
                        {qr.titulo}
                      </button>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSendManualMessage} className="p-3 border-t border-line flex gap-2 items-center bg-bg-light/10">
                  <input type="text" placeholder="Escribe un mensaje manual..." value={manualMessageText} onChange={e => setManualMessageText(e.target.value)}
                    className="flex-1 bg-bg-light border border-line rounded px-3 py-2 text-xs text-ink focus:outline-none focus:border-terracotta" />
                  <button type="submit" className="bg-terracotta hover:bg-terracotta/90 text-white rounded p-2 flex items-center justify-center cursor-pointer">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ink-soft select-none">
                <MessageSquare className="w-12 h-12 text-ink-soft/30 mb-3" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Centro de Mensajería en Vivo</h4>
                <p className="text-[10px] text-ink-soft max-w-xs mt-1">Selecciona una conversación del menú de la izquierda para ver el historial.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
