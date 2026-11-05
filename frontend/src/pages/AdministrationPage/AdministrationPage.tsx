import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  createDepartment,
  deleteDepartment,
  updateDepartmentActive,
  updateDepartmentName,
  useManagedDepartments,
} from '../../api/departments';
import {
  createFundingSource,
  createIpNkrekpItem,
  createProcurementCategory,
  createProcurementKind,
  createProcurementProcedure,
  createContractType,
  deleteFundingSource,
  deleteIpNkrekpItem,
  deleteProcurementCategory,
  deleteProcurementKind,
  deleteProcurementProcedure,
  deleteContractType,
  updateFundingSourceActive,
  updateFundingSourceName,
  updateIpNkrekpItemActive,
  updateIpNkrekpItemName,
  updateProcurementProcedureActive,
  updateProcurementProcedureName,
  updateContractTypeActive,
  updateContractTypeName,
  updateProcurementCategoryActive,
  updateProcurementCategoryName,
  updateProcurementKindActive,
  updateProcurementKindName,
  useManagedFundingSources,
  useManagedIpNkrekpItems,
  useManagedProcurementCategories,
  useManagedProcurementKinds,
  useManagedProcurementProcedures,
  useManagedContractTypes,
} from '../../api/procurementDirectories';
import { useHasRole } from '../../hooks/useUserAccess';
import { ADMIN_ROLE } from '../../mocks/roles';
import { ContractorsDirectory } from './ContractorsDirectory';
import { ManagedDirectoryCard } from './ManagedDirectoryCard';
import { UsersDirectory } from './UsersDirectory';

type AdminTab = 'users' | 'directories' | 'contractors';

export function AdministrationPage() {
  const isAdmin = useHasRole(ADMIN_ROLE);
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const tab: AdminTab =
    requested === 'users' || requested === 'contractors' || requested === 'directories'
      ? requested
      : 'directories';
  const activeTab: AdminTab = !isAdmin && tab === 'users' ? 'directories' : tab;

  function selectTab(next: AdminTab) {
    setSearchParams({ tab: next });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Адміністрування
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Довідники та налаштування системи закупівель
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Розділи адміністрування"
        className="flex gap-6 border-b border-[var(--color-border)]"
      >
        {isAdmin ? (
          <TabButton selected={activeTab === 'users'} onSelect={() => selectTab('users')}>
            Користувачі
          </TabButton>
        ) : null}
        <TabButton selected={activeTab === 'directories'} onSelect={() => selectTab('directories')}>
          Довідники
        </TabButton>
        <TabButton selected={activeTab === 'contractors'} onSelect={() => selectTab('contractors')}>
          Контрагенти
        </TabButton>
      </div>

      {activeTab === 'users' ? (
        <UsersDirectory />
      ) : activeTab === 'directories' ? (
        <div className="space-y-6">
          <DepartmentsDirectory isAdmin={isAdmin} />
          <ProcurementKindsDirectory isAdmin={isAdmin} />
          <FundingSourcesDirectory isAdmin={isAdmin} />
          <ProcurementCategoriesDirectory isAdmin={isAdmin} />
          <IpNkrekpItemsDirectory isAdmin={isAdmin} />
          <ProcurementProceduresDirectory isAdmin={isAdmin} />
          <ContractTypesDirectory isAdmin={isAdmin} />
        </div>
      ) : (
        <ContractorsDirectory isAdmin={isAdmin} />
      )}
    </div>
  );
}

function TabButton({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={[
        '-mb-px border-b-2 px-1 pb-3 text-sm font-semibold',
        selected
          ? 'border-[var(--color-brand-600)] text-[var(--color-brand-700)]'
          : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
      ].join(' ')}
      onClick={onSelect}
    >
      {children}
    </button>
  );
}

function DepartmentsDirectory({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useManagedDepartments();

  return (
    <ManagedDirectoryCard
      title="Підрозділи"
      hint="Лише активний підрозділ доступний при створенні нового пункту РПЗ або ДД"
      emptyText="Підрозділів ще немає."
      loadError="Не вдалося завантажити підрозділи."
      createTitle="Новий підрозділ"
      createEmptyError="Вкажіть назву підрозділу"
      renameTitle="Перейменувати підрозділ"
      renameEmptyError="Вкажіть назву підрозділу"
      renameFailedError="Не вдалося перейменувати підрозділ"
      deleteTitle="Видалити підрозділ"
      deleteMessage={(name) => `Видалити підрозділ «${name}»? Цю дію не можна скасувати.`}
      deleteFailedError="Не вдалося видалити підрозділ"
      deleteBlockedTitle="Підрозділ уже використовується, тому його не можна видалити"
      isAdmin={isAdmin}
      items={data}
      isLoading={isLoading}
      isError={isError}
      onCreate={createDepartment}
      onRename={updateDepartmentName}
      onSetActive={updateDepartmentActive}
      onDelete={deleteDepartment}
      onChanged={() => queryClient.invalidateQueries({ queryKey: ['departments'] })}
    />
  );
}

function ProcurementKindsDirectory({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useManagedProcurementKinds();

  return (
    <ManagedDirectoryCard
      title="Види закупівель"
      hint="Лише активний вид закупівлі доступний при створенні нового пункту РПЗ або ДД"
      emptyText="Видів закупівель ще немає."
      loadError="Не вдалося завантажити види закупівель."
      createTitle="Новий вид закупівлі"
      createEmptyError="Вкажіть назву виду закупівлі"
      renameTitle="Перейменувати вид закупівлі"
      renameEmptyError="Вкажіть назву виду закупівлі"
      renameFailedError="Не вдалося перейменувати вид закупівлі"
      deleteTitle="Видалити вид закупівлі"
      deleteMessage={(name) => `Видалити вид закупівлі «${name}»? Цю дію не можна скасувати.`}
      deleteFailedError="Не вдалося видалити вид закупівлі"
      deleteBlockedTitle="Вид закупівлі вже використовується, тому його не можна видалити"
      isAdmin={isAdmin}
      items={data}
      isLoading={isLoading}
      isError={isError}
      onCreate={createProcurementKind}
      onRename={updateProcurementKindName}
      onSetActive={updateProcurementKindActive}
      onDelete={deleteProcurementKind}
      onChanged={() => queryClient.invalidateQueries({ queryKey: ['procurement_kinds'] })}
    />
  );
}

function FundingSourcesDirectory({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useManagedFundingSources();

  return (
    <ManagedDirectoryCard
      title="Джерела фінансування"
      hint="Лише активне джерело фінансування доступне при створенні нового пункту РПЗ або ДД"
      emptyText="Джерел фінансування ще немає."
      loadError="Не вдалося завантажити джерела фінансування."
      createTitle="Нове джерело фінансування"
      createEmptyError="Вкажіть назву джерела фінансування"
      renameTitle="Перейменувати джерело фінансування"
      renameEmptyError="Вкажіть назву джерела фінансування"
      renameFailedError="Не вдалося перейменувати джерело фінансування"
      deleteTitle="Видалити джерело фінансування"
      deleteMessage={(name) =>
        `Видалити джерело фінансування «${name}»? Цю дію не можна скасувати.`
      }
      deleteFailedError="Не вдалося видалити джерело фінансування"
      deleteBlockedTitle="Джерело фінансування вже використовується, тому його не можна видалити"
      isAdmin={isAdmin}
      items={data}
      isLoading={isLoading}
      isError={isError}
      onCreate={createFundingSource}
      onRename={updateFundingSourceName}
      onSetActive={updateFundingSourceActive}
      onDelete={deleteFundingSource}
      onChanged={() => queryClient.invalidateQueries({ queryKey: ['funding_sources'] })}
    />
  );
}

function ProcurementCategoriesDirectory({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useManagedProcurementCategories();

  return (
    <ManagedDirectoryCard
      title="Категорії"
      hint="Лише активна категорія доступна при створенні нового пункту РПЗ або ДД"
      emptyText="Категорій ще немає."
      loadError="Не вдалося завантажити категорії."
      createTitle="Нова категорія"
      createEmptyError="Вкажіть назву категорії"
      renameTitle="Перейменувати категорію"
      renameEmptyError="Вкажіть назву категорії"
      renameFailedError="Не вдалося перейменувати категорію"
      deleteTitle="Видалити категорію"
      deleteMessage={(name) => `Видалити категорію «${name}»? Цю дію не можна скасувати.`}
      deleteFailedError="Не вдалося видалити категорію"
      deleteBlockedTitle="Категорія вже використовується, тому її не можна видалити"
      isAdmin={isAdmin}
      items={data}
      isLoading={isLoading}
      isError={isError}
      onCreate={createProcurementCategory}
      onRename={updateProcurementCategoryName}
      onSetActive={updateProcurementCategoryActive}
      onDelete={deleteProcurementCategory}
      onChanged={() => queryClient.invalidateQueries({ queryKey: ['procurement_categories'] })}
    />
  );
}

function IpNkrekpItemsDirectory({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useManagedIpNkrekpItems();

  return (
    <ManagedDirectoryCard
      title="Пункти ІП НКРЕКП"
      hint="Лише активний пункт ІП НКРЕКП доступнийпри створенні нового пункту РПЗ або ДД"
      emptyText="Пунктів ІП НКРЕКП ще немає."
      loadError="Не вдалося завантажити пункти ІП НКРЕКП."
      createTitle="Новий пункт ІП НКРЕКП"
      createEmptyError="Вкажіть назву пункту ІП НКРЕКП"
      renameTitle="Перейменувати пункт ІП НКРЕКП"
      renameEmptyError="Вкажіть назву пункту ІП НКРЕКП"
      renameFailedError="Не вдалося перейменувати пункт ІП НКРЕКП"
      deleteTitle="Видалити пункт ІП НКРЕКП"
      deleteMessage={(name) => `Видалити пункт ІП НКРЕКП «${name}»? Цю дію не можна скасувати.`}
      deleteFailedError="Не вдалося видалити пункт ІП НКРЕКП"
      deleteBlockedTitle="Пункт ІП НКРЕКП уже використовується, тому його не можна видалити"
      nameMaxLength={512}
      allowDigits
      isAdmin={isAdmin}
      items={data}
      isLoading={isLoading}
      isError={isError}
      onCreate={createIpNkrekpItem}
      onRename={updateIpNkrekpItemName}
      onSetActive={updateIpNkrekpItemActive}
      onDelete={deleteIpNkrekpItem}
      onChanged={() => queryClient.invalidateQueries({ queryKey: ['ip_nkrekp_items'] })}
    />
  );
}

function ProcurementProceduresDirectory({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useManagedProcurementProcedures();

  return (
    <ManagedDirectoryCard
      title="Види процедур"
      hint="Лише активний вид процедури доступний при створенні нового пункту РПЗ або ДД"
      emptyText="Видів процедур ще немає."
      loadError="Не вдалося завантажити види процедур."
      createTitle="Новий вид процедури"
      createEmptyError="Вкажіть назву виду процедури"
      renameTitle="Перейменувати вид процедури"
      renameEmptyError="Вкажіть назву виду процедури"
      renameFailedError="Не вдалося перейменувати вид процедури"
      deleteTitle="Видалити вид процедури"
      deleteMessage={(name) => `Видалити вид процедури «${name}»? Цю дію не можна скасувати.`}
      deleteFailedError="Не вдалося видалити вид процедури"
      deleteBlockedTitle="Вид процедури вже використовується, тому його не можна видалити"
      nameMaxLength={128}
      isAdmin={isAdmin}
      items={data}
      isLoading={isLoading}
      isError={isError}
      onCreate={createProcurementProcedure}
      onRename={updateProcurementProcedureName}
      onSetActive={updateProcurementProcedureActive}
      onDelete={deleteProcurementProcedure}
      onChanged={() => queryClient.invalidateQueries({ queryKey: ['procurement_procedures'] })}
    />
  );
}

function ContractTypesDirectory({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useManagedContractTypes();

  return (
    <ManagedDirectoryCard
      title="Типи ДД"
      hint="Лише активний тип ДД доступнипри створенні нового пункту РПЗ або ДД"
      emptyText="Типів ДД ще немає."
      loadError="Не вдалося завантажити типи ДД."
      createTitle="Новий тип ДД"
      createEmptyError="Вкажіть назву типу ДД"
      renameTitle="Перейменувати тип ДД"
      renameEmptyError="Вкажіть назву типу ДД"
      renameFailedError="Не вдалося перейменувати тип ДД"
      deleteTitle="Видалити тип ДД"
      deleteMessage={(name) => `Видалити тип ДД «${name}»? Цю дію не можна скасувати.`}
      deleteFailedError="Не вдалося видалити тип ДД"
      deleteBlockedTitle="Тип ДД уже використовується, тому його не можна видалити"
      nameMaxLength={128}
      isAdmin={isAdmin}
      items={data}
      isLoading={isLoading}
      isError={isError}
      onCreate={createContractType}
      onRename={updateContractTypeName}
      onSetActive={updateContractTypeActive}
      onDelete={deleteContractType}
      onChanged={() => queryClient.invalidateQueries({ queryKey: ['contract_types'] })}
    />
  );
}
