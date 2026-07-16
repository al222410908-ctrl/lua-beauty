import { useState, useEffect, useCallback } from 'react';
import { Users, Send, Search, Sparkles, RefreshCw, AlertTriangle, BookOpen, Check, Layers } from 'lucide-react';

export default function TabGrupos({ token, showToast, botStatus }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  // Predefined templates for stocks and promotions
  const templates = [
    {
      title: '📦 Reposición de Stock',
      text: '✨ ¡Buenas noticias! 🌟 Acabamos de reponer stock de tus productos favoritos en Lúa Beauty. \n\n🛍️ Consulta nuestro catálogo virtual y haz tu pedido antes de que se agoten. \n\n¡Escríbenos por mensaje privado para atenderte personalmente! 💖'
    },
    {
      title: '🔥 Promoción Especial',
      text: '🌸 ¡PROMO EXCLUSIVA! 🌸 \n\nLlevamos la belleza a tu puerta con un súper descuento especial por tiempo limitado. 🏷️✨\n\n💬 Envíanos un mensaje privado para darte todos los detalles y asegurar tu promoción. ¡No te lo pierdas!'
    },
    {
      title: '📖 Catálogo Virtual',
      text: '💖 ¡Hola a todos! Les recordamos que pueden explorar todos nuestros productos, precios y disponibilidad en tiempo real desde nuestro catálogo virtual. 📱✨\n\n👉 Entra al enlace y arma tu carrito de compras de forma rápida y sencilla. ¡Te esperamos!'
    }
  ];

  const fetchGroups = useCallback(async () => {
    if (!botStatus?.connected) return;
    setLoading(true);
    try {
      const res = await fetch('/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('No se pudieron obtener los grupos. Asegúrate de que el bot esté conectado.');
      }
      const data = await res.json();
      setGroups(data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, botStatus, showToast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleSelectGroup = (id) => {
    setSelectedGroupIds(prev => 
      prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const filteredGroupIds = filteredGroups.map(g => g.id);
    const allSelected = filteredGroupIds.every(id => selectedGroupIds.includes(id));

    if (allSelected) {
      // Unselect only the currently visible ones
      setSelectedGroupIds(prev => prev.filter(id => !filteredGroupIds.includes(id)));
    } else {
      // Select all visible ones
      setSelectedGroupIds(prev => [...new Set([...prev, ...filteredGroupIds])]);
    }
  };

  const handleSend = async () => {
    if (selectedGroupIds.length === 0) {
      showToast('Por favor, selecciona al menos un grupo.', 'warning');
      return;
    }
    if (!message.trim()) {
      showToast('El mensaje no puede estar vacío.', 'warning');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/groups/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          groupIds: selectedGroupIds,
          message: message
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar mensajes');
      
      showToast(`¡Mensaje enviado a ${selectedGroupIds.length} grupo(s) con éxito! 🚀`, 'success');
      setMessage('');
      setSelectedGroupIds([]);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected = filteredGroups.length > 0 && 
    filteredGroups.every(g => selectedGroupIds.includes(g.id));

  // Determine bot connection status
  const isBotReady = botStatus?.active && botStatus?.connected;

  if (!isBotReady) {
    return (
      <div className="bg-card border border-line/45 rounded-lg p-8 text-center space-y-4 max-w-2xl mx-auto my-8">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-ink">Asistente de WhatsApp Desconectado</h3>
        <p className="text-sm text-ink-soft">
          Para listar tus grupos de WhatsApp y poder enviarles promociones o actualizaciones de stock, es necesario que el bot esté encendido y vinculado a tu cuenta de WhatsApp.
        </p>
        <div className="pt-4">
          <p className="text-xs text-ink-soft">
            Por favor, ve a la pestaña <strong>Bot WhatsApp</strong> para iniciar y vincular el bot con el código QR.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
      {/* Columna Izquierda: Listado de Grupos */}
      <div className="xl:col-span-1 bg-card border border-line/45 rounded-lg p-5 flex flex-col h-[600px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-terracotta" />
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Tus Grupos ({groups.length})</h3>
          </div>
          <button 
            onClick={fetchGroups} 
            disabled={loading}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-ink-soft hover:text-ink transition-colors cursor-pointer"
            title="Actualizar grupos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-ink-soft absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar grupo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded border border-line bg-transparent text-xs focus:outline-none focus:border-terracotta text-ink"
          />
        </div>

        {/* Checkbox para seleccionar todos */}
        {filteredGroups.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-bg-light/40 border border-line/35 rounded-lg mb-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-ink select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="accent-terracotta rounded"
              />
              <span>Seleccionar todos los visibles</span>
            </label>
            <span className="text-[10px] text-ink-soft font-semibold bg-line/45 px-2 py-0.5 rounded-full">
              {selectedGroupIds.length} seleccionados
            </span>
          </div>
        )}

        {/* Lista de Grupos */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="text-center py-12 text-ink-soft text-xs">Cargando grupos de WhatsApp...</div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-ink-soft text-xs">
              {searchQuery ? 'No se encontraron grupos con ese nombre.' : 'No se detectaron grupos en tu cuenta.'}
            </div>
          ) : (
            filteredGroups.map(group => {
              const isSelected = selectedGroupIds.includes(group.id);
              return (
                <div 
                  key={group.id}
                  onClick={() => handleSelectGroup(group.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer select-none ${
                    isSelected 
                      ? 'bg-nude-pale border-terracotta/40 dark:bg-nude-pale/10' 
                      : 'bg-bg-light/30 border-line/50 hover:bg-bg-light/80 hover:border-line'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="accent-terracotta rounded cursor-pointer"
                    />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-ink line-clamp-1">{group.name}</p>
                      <p className="text-[10px] text-ink-soft mt-0.5">{group.participantsCount} participantes</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-terracotta flex-shrink-0" />}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Columna Derecha: Compositor de Mensajes */}
      <div className="xl:col-span-2 space-y-6">
        {/* Plantillas Rápidas */}
        <div className="bg-card border border-line/45 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-terracotta" />
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Plantillas Sugeridas</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {templates.map((tpl, i) => (
              <button
                key={i}
                onClick={() => {
                  if (message.trim() && !window.confirm('¿Reemplazar el mensaje actual con esta plantilla?')) return;
                  setMessage(tpl.text);
                  showToast('Plantilla aplicada ✨', 'info');
                }}
                className="p-3 text-left border border-line/60 rounded-lg hover:border-terracotta/50 hover:bg-bg-light/60 transition-all cursor-pointer group"
              >
                <p className="text-xs font-bold text-ink group-hover:text-terracotta transition-colors">{tpl.title}</p>
                <p className="text-[10px] text-ink-soft mt-1 line-clamp-3 leading-normal">{tpl.text}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Editor de Mensaje */}
        <div className="bg-card border border-line/45 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-terracotta" />
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Contenido de tu Mensaje</h4>
            </div>
            <div className="text-[10px] text-ink-soft font-semibold">
              Destinatarios: <span className="text-ink font-bold">{selectedGroupIds.length} grupo(s)</span>
            </div>
          </div>

          <textarea
            rows={8}
            placeholder="Escribe aquí tu stock de productos o promociones... Puedes usar emojis, *negrita*, _cursiva_ o ~tachado~."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-4 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta text-ink leading-relaxed font-sans"
          />

          {/* Dynamic Link Helper */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const link = `http://${window.location.host}`;
                setMessage(prev => prev + ` ${link}`);
              }}
              className="px-3 py-1 bg-bg-light border border-line hover:border-terracotta/40 rounded text-[10px] font-bold text-ink-soft hover:text-ink cursor-pointer transition-colors"
            >
              🔗 Insertar Enlace al Catálogo
            </button>
            <button
              onClick={() => {
                setMessage(prev => prev + ` \n\n📞 Contáctanos aquí: https://wa.me/${botStatus?.whatsappNumber || ''}`);
              }}
              className="px-3 py-1 bg-bg-light border border-line hover:border-terracotta/40 rounded text-[10px] font-bold text-ink-soft hover:text-ink cursor-pointer transition-colors"
            >
              💬 Insertar Link de WhatsApp
            </button>
          </div>

          {/* Acciones de Envío */}
          <div className="flex items-center justify-between border-t border-line/30 pt-4">
            <div className="text-[11px] text-ink-soft">
              Se enviará individualmente a cada grupo seleccionado.
            </div>
            <button
              onClick={handleSend}
              disabled={sending || selectedGroupIds.length === 0 || !message.trim()}
              className={`px-5 py-2.5 rounded text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                sending || selectedGroupIds.length === 0 || !message.trim()
                  ? 'bg-line border border-line text-ink-soft/40 cursor-not-allowed opacity-65'
                  : 'bg-terracotta border border-terracotta text-white hover:bg-terracotta/95 shadow-sm hover:shadow-black/10'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Enviando...' : `Enviar a ${selectedGroupIds.length} Grupos`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
