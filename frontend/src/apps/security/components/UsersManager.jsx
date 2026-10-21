import { useState, useEffect, useCallback } from 'react';
import { usersService } from '../services/usersService';
import { UserFormModal } from './UserFormModal';
import { SecurityPolicyModal } from './SecurityPolicyModal';
import {
  Users,
  Search,
  Plus,
  Filter,
  Shield,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Edit2,
  Power,
  RotateCcw,
  Loader2,
  Clock,
} from 'lucide-react';

export function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  // Acción en proceso (id_usuario de la fila afectada)
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersService.fetchUsers({
        q: searchTerm,
        tipo_usuario: roleFilter,
        estado: statusFilter,
      });
      setUsers(response.data || []);
    } catch (err) {
      setError(err.message || 'Error al cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  // Mensaje temporal de éxito
  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (formData, userId) => {
    if (userId) {
      const res = await usersService.updateUser(userId, formData);
      showSuccess(res.message || 'Operador actualizado correctamente.');
    } else {
      const res = await usersService.createUser(formData);
      showSuccess(res.message || 'Nuevo operador registrado exitosamente.');
    }
    loadUsers();
  };

  const handleToggleStatus = async (user) => {
    const actionText = user.estado === 'ACTIVO' ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Está seguro de ${actionText} el acceso para '${user.username}'?`)) {
      return;
    }

    setActionLoadingId(user.id_usuario);
    try {
      const res = await usersService.toggleUserStatus(user.id_usuario);
      showSuccess(res.message);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Error al cambiar estado.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnlock = async (user) => {
    if (!window.confirm(`¿Desea desbloquear la cuenta de '${user.username}' y reiniciar sus intentos fallidos?`)) {
      return;
    }

    setActionLoadingId(user.id_usuario);
    try {
      const res = await usersService.unlockUser(user.id_usuario);
      showSuccess(res.message);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Error al desbloquear usuario.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRoleBadge = (rol) => {
    switch (rol) {
      case 'ADMIN':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-purple-100 text-purple-800 border border-purple-200">ADMIN</span>;
      case 'RECEPCIONISTA':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-sky-100 text-sky-800 border border-sky-200">RECEPCION</span>;
      case 'MEDICO':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">MÉDICO</span>;
      case 'PACIENTE':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-amber-100 text-amber-800 border border-amber-200">PACIENTE</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-slate-100 text-slate-700">{rol}</span>;
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'ACTIVO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Activo
          </span>
        );
      case 'INACTIVO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Inactivo
          </span>
        );
      case 'BLOQUEADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <Lock className="w-3 h-3 text-rose-500" />
            Bloqueado
          </span>
        );
      default:
        return <span>{estado}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Éxito */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-medium shadow-xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Alerta de Error */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-medium shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Barra Superior con Resumen y Botón Principal */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#00687a]/10 text-[#00687a]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-slate-900 text-lg">
                Gestión de Usuarios y Roles (CU02)
              </h2>
              <p className="text-xs text-slate-500">
                Control de acceso basado en roles (RF01) — {users.length} operadores registrados
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPolicyModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer shrink-0"
            title="Configurar política de intentos y minutos de bloqueo de seguridad"
          >
            <ShieldAlert className="w-4 h-4 text-[#00687a]" />
            <span>Políticas de Bloqueo</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#00687a] hover:bg-[#004d5a] rounded-xl shadow-xs hover:shadow-md transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Operador</span>
          </button>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Buscador de texto */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario o correo..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 transition"
          />
        </div>

        {/* Filtro por Rol */}
        <div className="sm:col-span-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 text-slate-700 font-medium transition"
          >
            <option value="">Todos los Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="RECEPCIONISTA">RECEPCIONISTA</option>
            <option value="MEDICO">MEDICO</option>
            <option value="PACIENTE">PACIENTE</option>
          </select>
        </div>

        {/* Filtro por Estado */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 text-slate-700 font-medium transition"
          >
            <option value="">Todos los Estados</option>
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
            <option value="BLOQUEADO">BLOQUEADO</option>
          </select>
        </div>
      </div>

      {/* Tabla de Operadores */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Operador</th>
                <th className="py-3.5 px-4">Correo Institucional</th>
                <th className="py-3.5 px-4">Rol Asignado</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Último Acceso</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00687a]" />
                    <span>Cargando catálogo de operadores...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-slate-600">No se encontraron usuarios</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Prueba cambiando los filtros o registra un nuevo operador.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isActionBusy = actionLoadingId === user.id_usuario;

                  return (
                    <tr key={user.id_usuario} className="hover:bg-slate-50/60 transition">
                      {/* Operador */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{user.username}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID #{user.id_usuario}</span>
                          </div>
                        </div>
                      </td>

                      {/* Correo */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {user.email}
                      </td>

                      {/* Rol */}
                      <td className="py-3.5 px-4">
                        {getRoleBadge(user.tipo_usuario)}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(user.estado)}
                        {user.intentos_fallidos > 0 && user.estado !== 'BLOQUEADO' && (
                          <span className="ml-2 text-[10px] text-amber-600 font-mono">
                            ({user.intentos_fallidos}/5 intentos)
                          </span>
                        )}
                      </td>

                      {/* Último Acceso */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {user.ultimo_acceso ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(user.ultimo_acceso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Sin accesos aún</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Desbloquear (si está bloqueado) */}
                          {user.estado === 'BLOQUEADO' && (
                            <button
                              onClick={() => handleUnlock(user)}
                              disabled={isActionBusy}
                              title="Desbloquear cuenta de usuario"
                              className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Botón Editar */}
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            disabled={isActionBusy}
                            title="Editar datos de usuario"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#00687a] hover:border-[#00687a]/30 hover:bg-[#00687a]/5 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Conmutar Estado / Baja Lógica RN11 */}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={isActionBusy}
                            title={user.estado === 'ACTIVO' ? 'Desactivar usuario (Baja Lógica)' : 'Reactivar usuario'}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              user.estado === 'ACTIVO'
                                ? 'border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSaveUser}
        initialUser={selectedUser}
      />

      {/* Modal de Políticas de Bloqueo (RF01 - Seguridad) */}
      <SecurityPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        onSaved={() => showSuccess('Políticas de bloqueo de seguridad actualizadas con éxito.')}
      />
    </div>
  );
}
