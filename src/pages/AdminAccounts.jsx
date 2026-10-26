import { useEffect, useState } from 'react';
import {
  createNutritionist,
  listNutritionists,
  resetNutritionistPassword,
  setNutritionistActive,
} from '../api/adminNutritionists';
import { formatDateTime } from '../utils/date';
import Badge from '../components/Badge';
import Button from '../components/Button';
import NutritionistAccountForm from '../components/NutritionistAccountForm';
import PasswordResetForm from '../components/PasswordResetForm';

const TH = 'px-5 py-3 text-left text-xs font-bold tracking-[0.3px] text-muted uppercase';
const TD = 'px-5 py-3 text-body-sm';
const LINK_BUTTON = 'text-body-sm font-medium text-primary hover:underline disabled:opacity-50';

// Panel del administrador (T31): alta, baja lógica, reactivación y
// restablecimiento de contraseña de las cuentas de nutricionista. No muestra
// nada de sus pacientes.
function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [resettingId, setResettingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;

    listNutritionists()
      .then((data) => {
        if (!cancelled) setAccounts(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function replaceAccount(updated) {
    setAccounts((current) => current.map((account) => (account.id === updated.id ? updated : account)));
  }

  function startCreating() {
    setNotice('');
    setActionError('');
    setResettingId(null);
    setIsCreating(true);
  }

  // Si falla, el error vuelve al formulario y se muestra en su campo.
  async function handleCreate(payload) {
    const created = await createNutritionist(payload);
    setAccounts((current) => [created, ...current]);
    setIsCreating(false);
    setNotice(`Cuenta de ${created.name} creada. Ya puede iniciar sesión con ${created.email}.`);
  }

  async function handleToggleActive(account) {
    const deactivating = account.active;
    const question = deactivating
      ? `¿Desactivar la cuenta de ${account.name}? No va a poder iniciar sesión y su sesión abierta se cierra.`
      : `¿Reactivar la cuenta de ${account.name}?`;
    if (!window.confirm(question)) return;

    setNotice('');
    setActionError('');
    setTogglingId(account.id);
    try {
      replaceAccount(await setNutritionistActive(account.id, !deactivating));
      setNotice(`Cuenta de ${account.name} ${deactivating ? 'desactivada' : 'reactivada'}.`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleResetPassword(account, password) {
    await resetNutritionistPassword(account.id, password);
    setResettingId(null);
    setNotice(`Contraseña de ${account.name} restablecida.`);
  }

  const isBusy = isCreating || Boolean(resettingId) || Boolean(togglingId);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-ink">Cuentas</h1>
          <p className="mt-2 text-sm text-muted">Cuentas de las nutricionistas que usan NutrIA.</p>
        </div>
        <Button onClick={startCreating} disabled={isBusy}>
          + Nueva cuenta
        </Button>
      </div>

      {isCreating && (
        <div className="mb-6">
          <NutritionistAccountForm onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />
        </div>
      )}

      {notice && (
        <p className="mb-4 rounded-xl bg-mint-50 px-3.5 py-2.5 text-body-sm text-mint-700" role="status">
          {notice}
        </p>
      )}
      {actionError && (
        <p className="mb-4 text-body-sm text-danger" role="alert">
          {actionError}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="flex items-center justify-end border-b border-line p-5">
          <span className="text-body-sm whitespace-nowrap text-muted">{accounts.length} cuentas</span>
        </div>

        {isLoading && <p className="p-5 text-sm text-muted">Cargando cuentas...</p>}
        {loadError && (
          <p className="p-5 text-sm text-danger" role="alert">
            {loadError}
          </p>
        )}

        {!isLoading && !loadError && accounts.length === 0 && (
          <p className="p-5 text-sm text-muted">Todavía no hay cuentas de nutricionista.</p>
        )}

        {!isLoading && !loadError && accounts.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-soft/45">
                <th className={TH}>Nombre</th>
                <th className={TH}>Email</th>
                <th className={TH}>Estado</th>
                <th className={TH}>Alta</th>
                <th className={TH} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  isResetting={resettingId === account.id}
                  isToggling={togglingId === account.id}
                  disabled={isBusy}
                  onStartReset={() => {
                    setNotice('');
                    setActionError('');
                    setResettingId(account.id);
                  }}
                  onCancelReset={() => setResettingId(null)}
                  onResetPassword={(password) => handleResetPassword(account, password)}
                  onToggleActive={() => handleToggleActive(account)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AccountRow({ account, isResetting, isToggling, disabled, onStartReset, onCancelReset, onResetPassword, onToggleActive }) {
  return (
    <>
      <tr>
        <td className={`${TD} font-semibold text-ink`}>{account.name}</td>
        <td className={TD}>{account.email}</td>
        <td className={TD}>
          {account.active ? <Badge tone="mint">Activa</Badge> : <Badge tone="warning">Desactivada</Badge>}
        </td>
        <td className={TD}>{formatDateTime(account.createdAt)}</td>
        <td className={TD}>
          <div className="flex items-center justify-end gap-4">
            <button type="button" className={LINK_BUTTON} onClick={onStartReset} disabled={disabled}>
              Restablecer contraseña
            </button>
            <button type="button" className={LINK_BUTTON} onClick={onToggleActive} disabled={disabled}>
              {isToggling ? 'Guardando...' : account.active ? 'Desactivar' : 'Reactivar'}
            </button>
          </div>
        </td>
      </tr>
      {isResetting && (
        <tr>
          <td colSpan={5} className="bg-surface px-5 py-4">
            <PasswordResetForm accountName={account.name} onSubmit={onResetPassword} onCancel={onCancelReset} />
          </td>
        </tr>
      )}
    </>
  );
}

export default AdminAccounts;
